import AVFoundation
import Photos
import UIKit
import Vision

/// Runs the capture session, live pose detection and photo capture.
/// Session work happens on `sessionQueue`, pose detection on `videoQueue`; published state is updated on the main queue.
final class CameraController: NSObject, ObservableObject {
    @Published private(set) var livePose: BodyPose?
    @Published private(set) var liveFrameSize = CGSize(width: 1080, height: 1440)
    @Published private(set) var matchScore: Double?
    /// The current coaching hint, only published once it has been stable for a few frames.
    @Published private(set) var coachHint: PoseHint?
    @Published private(set) var zoomPresets: [Double] = [1]
    @Published private(set) var currentZoom: Double = 1
    @Published private(set) var exposureBias: Float = 0
    @Published private(set) var position: AVCaptureDevice.Position = .back
    @Published var flashMode: AVCaptureDevice.FlashMode = .off
    @Published private(set) var lastPhoto: UIImage?
    @Published private(set) var lastPhotoScore: Double?
    @Published private(set) var savedToLibrary = false
    @Published private(set) var authorizationDenied = false

    let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "pinpose.camera.session")
    private let videoQueue = DispatchQueue(label: "pinpose.camera.video")
    private let photoOutput = AVCapturePhotoOutput()
    private let videoOutput = AVCaptureVideoDataOutput()

    // Only touched on sessionQueue.
    private var device: AVCaptureDevice?
    private var wideZoomFactor: CGFloat = 1
    private var sessionPosition: AVCaptureDevice.Position = .back
    private var pendingZoom: Double = 1
    private var pendingBias: Float = 0
    private var inFlightCaptures: [Int64: PhotoCaptureProcessor] = [:]

    // Only touched on videoQueue.
    private let poseRequest = VNDetectHumanBodyPoseRequest()
    private var referencePose: BodyPose?
    private var referenceAspect: CGFloat = 0.75
    private var lastPoseTime = Date.distantPast
    private var smoothedScore: Double?
    private var candidateHint: PoseHint?
    private var candidateCount = 0
    private var stableHint: PoseHint?
    private var framingGuide = true
    private var referenceMirrored = false

    /// Sets the reference to match against and the settings to start with.
    func prepare(referencePose: BodyPose?, referenceAspect: CGFloat, zoom: Double, exposureBias: Float) {
        videoQueue.async {
            self.referencePose = referencePose
            self.referenceAspect = referenceAspect
        }
        sessionQueue.async {
            self.pendingZoom = zoom
            self.pendingBias = exposureBias
        }
    }

    /// Distance/position hints only make sense while the reference overlay is not moved or zoomed by hand.
    func setFramingGuide(enabled: Bool, referenceMirrored: Bool) {
        videoQueue.async {
            self.framingGuide = enabled
            self.referenceMirrored = referenceMirrored
        }
    }

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            startSession()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                guard let self else { return }
                if granted {
                    self.startSession()
                } else {
                    DispatchQueue.main.async { self.authorizationDenied = true }
                }
            }
        default:
            authorizationDenied = true
        }
    }

    func stop() {
        sessionQueue.async {
            if self.session.isRunning { self.session.stopRunning() }
        }
    }

    private func startSession() {
        sessionQueue.async {
            if self.device == nil { self.configureSession() }
            if !self.session.isRunning { self.session.startRunning() }
        }
    }

    // MARK: Configuration (sessionQueue)

    private func configureSession() {
        session.beginConfiguration()
        if session.canSetSessionPreset(.photo) { session.sessionPreset = .photo }
        for input in session.inputs { session.removeInput(input) }

        guard let newDevice = Self.bestDevice(for: sessionPosition),
              let input = try? AVCaptureDeviceInput(device: newDevice),
              session.canAddInput(input) else {
            session.commitConfiguration()
            return
        }
        session.addInput(input)

        if !session.outputs.contains(photoOutput), session.canAddOutput(photoOutput) {
            session.addOutput(photoOutput)
            photoOutput.maxPhotoQualityPrioritization = .quality
        }
        if !session.outputs.contains(videoOutput), session.canAddOutput(videoOutput) {
            videoOutput.alwaysDiscardsLateVideoFrames = true
            videoOutput.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
            videoOutput.setSampleBufferDelegate(self, queue: videoQueue)
            session.addOutput(videoOutput)
        }

        let mirrored = sessionPosition == .front
        for connection in [videoOutput.connection(with: .video), photoOutput.connection(with: .video)].compactMap({ $0 }) {
            if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
            if connection.isVideoMirroringSupported {
                connection.automaticallyAdjustsVideoMirroring = false
                connection.isVideoMirrored = mirrored
            }
        }
        session.commitConfiguration()
        device = newDevice

        // On multi-camera devices zoom factor 1 is the ultra wide lens; "1×" is at the first switch-over factor.
        let hasUltraWide = newDevice.deviceType == .builtInTripleCamera || newDevice.deviceType == .builtInDualWideCamera
        if hasUltraWide, let firstSwitch = newDevice.virtualDeviceSwitchOverVideoZoomFactors.first {
            wideZoomFactor = CGFloat(truncating: firstSwitch)
        } else {
            wideZoomFactor = 1
        }
        let maxDisplayZoom = Double(min(newDevice.maxAvailableVideoZoomFactor, 20) / wideZoomFactor)
        var presets: [Double] = hasUltraWide ? [0.5, 1] : [1]
        for zoom in [2.0, 3.0, 5.0] where zoom <= maxDisplayZoom { presets.append(zoom) }

        let target = presets.min { abs($0 - pendingZoom) < abs($1 - pendingZoom) } ?? 1
        applyZoom(target, animated: false)
        applyBias(pendingBias)

        let position = sessionPosition
        DispatchQueue.main.async {
            self.zoomPresets = presets
            self.currentZoom = target
            self.position = position
        }
    }

    private static func bestDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        let types: [AVCaptureDevice.DeviceType] = position == .back
            ? [.builtInTripleCamera, .builtInDualWideCamera, .builtInDualCamera, .builtInWideAngleCamera]
            : [.builtInWideAngleCamera]
        for type in types {
            if let device = AVCaptureDevice.default(type, for: .video, position: position) { return device }
        }
        return AVCaptureDevice.default(for: .video)
    }

    private func applyZoom(_ displayZoom: Double, animated: Bool) {
        guard let device else { return }
        let factor = min(max(CGFloat(displayZoom) * wideZoomFactor, device.minAvailableVideoZoomFactor),
                         device.maxAvailableVideoZoomFactor)
        do {
            try device.lockForConfiguration()
            if animated {
                device.ramp(toVideoZoomFactor: factor, withRate: 8)
            } else {
                device.videoZoomFactor = factor
            }
            device.unlockForConfiguration()
        } catch {}
    }

    private func applyBias(_ bias: Float) {
        guard let device else { return }
        let clamped = min(max(bias, device.minExposureTargetBias), device.maxExposureTargetBias)
        do {
            try device.lockForConfiguration()
            device.setExposureTargetBias(clamped, completionHandler: nil)
            device.unlockForConfiguration()
        } catch {}
        DispatchQueue.main.async { self.exposureBias = clamped }
    }

    // MARK: Controls (call from main)

    func setZoom(_ displayZoom: Double) {
        currentZoom = displayZoom
        sessionQueue.async {
            self.pendingZoom = displayZoom
            self.applyZoom(displayZoom, animated: true)
        }
    }

    func setExposureBias(_ bias: Float) {
        exposureBias = bias
        sessionQueue.async {
            self.pendingBias = bias
            self.applyBias(bias)
        }
    }

    /// `devicePoint` is in capture-device coordinates (0...1), e.g. from the preview layer.
    func focus(at devicePoint: CGPoint) {
        sessionQueue.async {
            guard let device = self.device else { return }
            do {
                try device.lockForConfiguration()
                if device.isFocusPointOfInterestSupported, device.isFocusModeSupported(.continuousAutoFocus) {
                    device.focusPointOfInterest = devicePoint
                    device.focusMode = .continuousAutoFocus
                }
                if device.isExposurePointOfInterestSupported, device.isExposureModeSupported(.continuousAutoExposure) {
                    device.exposurePointOfInterest = devicePoint
                    device.exposureMode = .continuousAutoExposure
                }
                device.unlockForConfiguration()
            } catch {}
        }
    }

    func switchCamera() {
        sessionQueue.async {
            self.sessionPosition = self.sessionPosition == .back ? .front : .back
            self.pendingZoom = 1
            self.configureSession()
        }
    }

    func capturePhoto() {
        let score = matchScore
        let flash = flashMode
        sessionQueue.async {
            guard self.device != nil else { return }
            let settings = AVCapturePhotoSettings()
            if self.photoOutput.supportedFlashModes.contains(flash) { settings.flashMode = flash }
            settings.photoQualityPrioritization = .balanced
            let id = settings.uniqueID

            let processor = PhotoCaptureProcessor { [weak self] data in
                guard let self else { return }
                self.sessionQueue.async { self.inFlightCaptures[id] = nil }
                guard let data, let image = UIImage(data: data) else { return }
                PhotoLibrarySaver.save(data) { success in
                    DispatchQueue.main.async { self.savedToLibrary = success }
                }
                DispatchQueue.main.async {
                    self.lastPhoto = image
                    self.lastPhotoScore = score
                }
            }
            self.inFlightCaptures[id] = processor
            self.photoOutput.capturePhoto(with: settings, delegate: processor)
        }
    }
}

extension CameraController: AVCaptureVideoDataOutputSampleBufferDelegate {
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let now = Date()
        guard now.timeIntervalSince(lastPoseTime) >= 0.12,
              let buffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        lastPoseTime = now

        let size = CGSize(width: CVPixelBufferGetWidth(buffer), height: CVPixelBufferGetHeight(buffer))
        let handler = VNImageRequestHandler(cvPixelBuffer: buffer, orientation: .up, options: [:])
        try? handler.perform([poseRequest])
        let pose = PoseExtraction.mainPose(from: poseRequest.results ?? [])

        var score: Double?
        if let pose, let referencePose,
           let raw = PoseMatcher.score(live: pose, liveAspect: size.width / size.height,
                                       reference: referencePose, referenceAspect: referenceAspect) {
            let smoothed = smoothedScore.map { $0 * 0.6 + raw * 0.4 } ?? raw
            smoothedScore = smoothed
            score = smoothed
        } else {
            smoothedScore = nil
        }

        var rawHint: PoseHint?
        if let pose, let referencePose {
            // A mirrored (selfie) frame makes Vision swap left and right; undo that so "Linke Hand" is the real left hand.
            let anatomicalPose = connection.isVideoMirrored ? pose.mirrored() : pose
            let framing = framingGuide
                ? PoseCoach.FramingContext(screenPose: pose, referenceMirrored: referenceMirrored,
                                           frontCamera: connection.isVideoMirrored)
                : nil
            rawHint = PoseCoach.hint(live: anatomicalPose, liveAspect: size.width / size.height,
                                     reference: referencePose, referenceAspect: referenceAspect, score: score,
                                     framing: framing)
        }
        let hint = stabilized(rawHint)

        DispatchQueue.main.async {
            self.livePose = pose
            self.liveFrameSize = size
            self.matchScore = score
            if self.coachHint != hint { self.coachHint = hint }
        }
    }
}

extension CameraController {
    /// A new hint only replaces the shown one after 3 identical frames (~0.4 s), so the text does not flicker.
    /// "Hold" and "nobody in frame" switch immediately.
    fileprivate func stabilized(_ hint: PoseHint?) -> PoseHint? {
        if hint == nil || hint == .hold {
            candidateHint = nil
            candidateCount = 0
            stableHint = hint
            return hint
        }
        if hint == candidateHint {
            candidateCount += 1
        } else {
            candidateHint = hint
            candidateCount = 1
        }
        if candidateCount >= 3 { stableHint = hint }
        return stableHint
    }
}

private final class PhotoCaptureProcessor: NSObject, AVCapturePhotoCaptureDelegate {
    private let completion: (Data?) -> Void
    private var data: Data?

    init(completion: @escaping (Data?) -> Void) {
        self.completion = completion
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        data = photo.fileDataRepresentation()
    }

    func photoOutput(_ output: AVCapturePhotoOutput, didFinishCaptureFor resolvedSettings: AVCaptureResolvedPhotoSettings, error: Error?) {
        completion(data)
    }
}

enum PhotoLibrarySaver {
    static func save(_ data: Data, completion: @escaping (Bool) -> Void) {
        PHPhotoLibrary.requestAuthorization(for: .addOnly) { status in
            guard status == .authorized || status == .limited else {
                completion(false)
                return
            }
            PHPhotoLibrary.shared().performChanges({
                PHAssetCreationRequest.forAsset().addResource(with: .photo, data: data, options: nil)
            }, completionHandler: { success, _ in
                completion(success)
            })
        }
    }
}
