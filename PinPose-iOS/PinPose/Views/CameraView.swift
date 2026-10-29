import AVFoundation
import SwiftUI

struct CameraView: View {
    let look: Look
    let referenceImage: UIImage?
    var silhouette: UIImage?

    @EnvironmentObject private var store: LookStore
    @Environment(\.dismiss) private var dismiss
    @StateObject private var camera = CameraController()

    @State private var showGhost = true
    @AppStorage("camera.ghostOpacity") private var ghostOpacity = 0.35
    @State private var showSkeleton = true
    @AppStorage("camera.showGrid") private var showGrid = true
    @AppStorage("camera.showTips") private var showTips = true
    @State private var activeSlider: CameraSlider?
    @State private var tipIndex = 0
    @State private var timerSeconds = 0
    @State private var countdown: Int?
    @State private var flashScreen = false
    @State private var showCompare = false
    @State private var shotToast: String?

    @AppStorage("camera.overlayStyle") private var overlayStyle: OverlayStyle = .photo
    @State private var mirrorOverlay = false
    @State private var adjustingOverlay = false
    @State private var overlayScale: CGFloat = 1
    @State private var overlayOffset: CGSize = .zero
    @GestureState private var pinchScale: CGFloat = 1
    @GestureState private var dragOffset: CGSize = .zero

    @AppStorage("camera.autoCapture") private var autoCapture = false
    @State private var matchingSince: Date?
    @State private var lastAutoCapture = Date.distantPast
    @State private var wasMatching = false

    @AppStorage("camera.coaching") private var coaching = true
    @AppStorage("camera.speakHints") private var speakHints = false
    @State private var voice = CoachVoice()

    private var tips: [Advice] {
        look.analysis.poseAdvice + look.analysis.cameraAdvice.prefix(3)
    }

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            CameraPreview(controller: camera)
                .ignoresSafeArea()

            overlays
                .ignoresSafeArea()

            if adjustingOverlay {
                adjustLayer
            }

            controls

            if let countdown {
                Text("\(countdown)")
                    .font(.system(size: 140, weight: .heavy, design: .rounded))
                    .foregroundStyle(.white)
                    .shadow(radius: 12)
                    .transition(.scale.combined(with: .opacity))
                    .id(countdown)
            }

            if let shotToast {
                VStack {
                    Spacer()
                    Text(shotToast)
                        .font(.subheadline.bold())
                        .foregroundStyle(.white)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 10)
                        .background(.black.opacity(0.7), in: Capsule())
                        .padding(.bottom, 260)
                }
                .transition(.move(edge: .bottom).combined(with: .opacity))
                .allowsHitTesting(false)
            }

            if flashScreen {
                Color.white.ignoresSafeArea().transition(.opacity)
            }

            if camera.authorizationDenied {
                permissionHint
            }
        }
        .statusBarHidden()
        .onAppear {
            UIApplication.shared.isIdleTimerDisabled = true
            camera.prepare(referencePose: look.analysis.pose,
                           referenceAspect: look.analysis.aspect,
                           zoom: look.analysis.recommendedZoom,
                           exposureBias: look.analysis.recommendedExposureBias)
            camera.start()
        }
        .onDisappear {
            UIApplication.shared.isIdleTimerDisabled = false
            voice.stop()
            camera.stop()
        }
        .onChange(of: camera.position) { _, position in
            // A selfie preview is mirrored, so mirror the reference too.
            mirrorOverlay = position == .front
        }
        .onChange(of: camera.matchScore) { _, score in
            handleMatch(score)
        }
        .onChange(of: camera.coachHint) { _, hint in
            if coaching, speakHints, let hint { voice.say(hint.text) }
        }
        .onChange(of: speakHints) { _, enabled in
            if !enabled { voice.stop() }
        }
        .onChange(of: camera.lastPhoto) { _, photo in
            guard let photo else { return }
            let previousBest = store.look(id: look.id)?.bestScore
            let score = camera.lastPhotoScore
            store.addShot(photo, score: score, for: look.id)
            showToast(for: score, previousBest: previousBest)
        }
        .sheet(isPresented: $showCompare) {
            CompareView(reference: referenceImage, photo: camera.lastPhoto,
                        score: camera.lastPhotoScore, saved: camera.savedToLibrary)
        }
    }

    // MARK: Overlays

    private var overlays: some View {
        GeometryReader { geo in
            ZStack {
                ZStack {
                    if showGhost, let ghost = ghostImage {
                        Image(uiImage: ghost)
                            .resizable()
                            .scaledToFill()
                            .frame(width: geo.size.width, height: geo.size.height)
                            .opacity(overlayStyle == .silhouette ? max(ghostOpacity, 0.3) : ghostOpacity)
                    }
                    if showSkeleton, let pose = look.analysis.pose {
                        PoseSkeletonView(pose: pose, imageSize: look.analysis.imageSize, contentMode: .fill,
                                         color: .pink, lineWidth: 6)
                    }
                }
                .scaleEffect(x: mirrorOverlay ? -1 : 1, y: 1)
                .scaleEffect(overlayScale * pinchScale)
                .offset(x: overlayOffset.width + dragOffset.width, y: overlayOffset.height + dragOffset.height)
                .frame(width: geo.size.width, height: geo.size.height)
                .clipped()

                if showGrid {
                    GridOverlay()
                }
                if let live = camera.livePose {
                    PoseSkeletonView(pose: live, imageSize: camera.liveFrameSize, contentMode: .fill,
                                     color: matchColor, lineWidth: 3)
                }
            }
            .frame(width: geo.size.width, height: geo.size.height)
        }
        .allowsHitTesting(false)
    }

    private var ghostImage: UIImage? {
        overlayStyle == .silhouette ? (silhouette ?? referenceImage) : referenceImage
    }

    /// Captures pinch and drag while the user positions the reference.
    private var adjustLayer: some View {
        Color.clear
            .contentShape(Rectangle())
            .ignoresSafeArea()
            .gesture(
                SimultaneousGesture(
                    MagnifyGesture()
                        .updating($pinchScale) { value, state, _ in state = value.magnification }
                        .onEnded { value in overlayScale = min(max(overlayScale * value.magnification, 0.4), 3) },
                    DragGesture()
                        .updating($dragOffset) { value, state, _ in state = value.translation }
                        .onEnded { value in
                            overlayOffset.width += value.translation.width
                            overlayOffset.height += value.translation.height
                        }
                )
            )
    }

    private var matchColor: Color {
        guard let score = camera.matchScore else { return .white }
        switch score {
        case 0.85...: return .green
        case 0.65...: return .yellow
        default: return .white
        }
    }

    // MARK: Controls

    private var controls: some View {
        VStack(spacing: 10) {
            topBar
            if adjustingOverlay {
                adjustBanner
            } else {
                if coaching, let hint = camera.coachHint {
                    CoachHintPill(hint: hint)
                        .transition(.opacity.combined(with: .scale(scale: 0.95)))
                        .animation(.easeInOut(duration: 0.2), value: hint)
                }
                if camera.livePose == nil, look.analysis.pose != nil, !camera.authorizationDenied {
                    setupHint
                } else if showTips, !tips.isEmpty, !(coaching && camera.coachHint != nil) {
                    tipCard
                }
            }
            Spacer()
            bottomPanel
        }
        .padding(.horizontal, 12)
        .padding(.bottom, 8)
    }

    private var topBar: some View {
        HStack(spacing: 8) {
            CameraIconButton(systemName: "xmark") { dismiss() }
                .accessibilityLabel("Schließen")

            Spacer()

            if let score = camera.matchScore {
                ScoreBadge(score: score)
                    .animation(.easeInOut, value: score)
            } else if look.analysis.pose != nil, camera.livePose != nil {
                Text("Pose wird verglichen …")
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 6)
                    .background(.black.opacity(0.45), in: Capsule())
            }

            Spacer()

            Menu {
                Toggle(isOn: $showGhost) { Label("Vorlage einblenden", systemImage: "photo") }
                Toggle(isOn: $showSkeleton) { Label("Pose-Skelett", systemImage: "figure.stand") }
                Toggle(isOn: $showGrid) { Label("Raster", systemImage: "squareshape.split.3x3") }
                Toggle(isOn: $showTips) { Label("Tipps", systemImage: "lightbulb") }
                if look.analysis.pose != nil {
                    Toggle(isOn: $coaching) { Label("Live-Coaching", systemImage: "figure.wave") }
                    Toggle(isOn: $speakHints) { Label("Coaching ansagen", systemImage: "speaker.wave.2") }
                }
                if silhouette != nil {
                    Picker("Vorlage als", selection: $overlayStyle) {
                        ForEach(OverlayStyle.allCases) { style in
                            Label(style.label, systemImage: style.icon).tag(style)
                        }
                    }
                }
                Toggle(isOn: $mirrorOverlay) { Label("Vorlage spiegeln", systemImage: "arrow.left.and.right.righttriangle.left.righttriangle.right") }
                Button {
                    showGhost = true
                    adjustingOverlay = true
                } label: {
                    Label("Vorlage verschieben & zoomen", systemImage: "arrow.up.and.down.and.arrow.left.and.right")
                }
            } label: {
                CameraIconLabel(systemName: "slider.horizontal.3")
            }
            .accessibilityLabel("Overlays")

            CameraIconButton(systemName: camera.flashMode == .on ? "bolt.fill" : "bolt.slash.fill",
                             active: camera.flashMode == .on) {
                camera.flashMode = camera.flashMode == .on ? .off : .on
            }
            .accessibilityLabel("Blitz")

            CameraIconButton(systemName: "arrow.triangle.2.circlepath.camera") {
                camera.switchCamera()
            }
            .accessibilityLabel("Kamera wechseln")
        }
        .padding(.top, 8)
    }

    private var adjustBanner: some View {
        HStack(spacing: 10) {
            Image(systemName: "hand.draw.fill")
                .font(.headline)
                .foregroundStyle(.pink)
            Text("Mit einem Finger verschieben, mit zwei Fingern zoomen.")
                .font(.caption)
            Spacer(minLength: 0)
            Button("Zurücksetzen") {
                withAnimation {
                    overlayScale = 1
                    overlayOffset = .zero
                }
            }
            .font(.caption.bold())
            Button("Fertig") { adjustingOverlay = false }
                .font(.caption.bold())
                .buttonStyle(.borderedProminent)
        }
        .foregroundStyle(.white)
        .tint(.pink)
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .environment(\.colorScheme, .dark)
    }

    private var tipCard: some View {
        let tip = tips[tipIndex % tips.count]
        return Button {
            withAnimation(.easeInOut(duration: 0.2)) { tipIndex = (tipIndex + 1) % tips.count }
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: tip.icon)
                    .font(.headline)
                    .foregroundStyle(.pink)
                    .frame(width: 28)
                VStack(alignment: .leading, spacing: 2) {
                    Text(tip.title)
                        .font(.subheadline.bold())
                    Text(tip.detail)
                        .font(.caption)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                }
                Spacer(minLength: 0)
                VStack {
                    Text("\(tipIndex % tips.count + 1)/\(tips.count)")
                        .font(.caption2.monospacedDigit())
                    Image(systemName: "chevron.right")
                        .font(.caption.bold())
                }
                .foregroundStyle(.secondary)
            }
            .foregroundStyle(.primary)
            .padding(12)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
        .buttonStyle(.plain)
        .environment(\.colorScheme, .dark)
    }

    private var bottomPanel: some View {
        VStack(spacing: 12) {
            switch activeSlider {
            case .opacity:
                HStack(spacing: 10) {
                    Image(systemName: "photo")
                    Slider(value: $ghostOpacity, in: 0...0.8)
                    Text("\(Int(ghostOpacity * 100)) %")
                        .font(.caption.monospacedDigit())
                        .frame(width: 40)
                }
                .transition(.opacity)
            case .exposure:
                HStack(spacing: 10) {
                    Image(systemName: "sun.max.fill")
                    Slider(value: Binding(get: { Double(camera.exposureBias) },
                                          set: { camera.setExposureBias(Float($0)) }),
                           in: -2...2, step: 0.1)
                    Text(String(format: "%+.1f", camera.exposureBias))
                        .font(.caption.monospacedDigit())
                        .frame(width: 40)
                }
                .transition(.opacity)
            case nil:
                EmptyView()
            }

            HStack(spacing: 8) {
                if look.analysis.pose != nil {
                    ChipToggle(title: "Auto", systemImage: "figure.stand", isOn: $autoCapture)
                        .accessibilityLabel("Auto-Auslöser")
                }
                if showGhost, referenceImage != nil {
                    ChipToggle(title: "Vorlage", systemImage: "photo",
                               isOn: sliderBinding(.opacity))
                }
                ChipToggle(title: String(format: "%+.1f", camera.exposureBias), systemImage: "sun.max.fill",
                           isOn: sliderBinding(.exposure))
                    .accessibilityLabel("Belichtung")
                ChipToggle(title: "Spiegeln", systemImage: "arrow.left.and.right", isOn: $mirrorOverlay)
            }

            HStack(spacing: 8) {
                ForEach(camera.zoomPresets, id: \.self) { zoom in
                    let selected = abs(camera.currentZoom - zoom) < 0.01
                    let recommended = abs(look.analysis.recommendedZoom - zoom) < 0.01
                    Button {
                        camera.setZoom(zoom)
                    } label: {
                        Text(ShotAdvisor.zoomLabel(zoom))
                            .font(.caption.bold())
                            .foregroundStyle(selected ? Color.black : Color.white)
                            .frame(width: 42, height: 42)
                            .background(selected ? Color.yellow : Color.black.opacity(0.45), in: Circle())
                            .overlay {
                                if recommended {
                                    Circle().stroke(Color.pink, lineWidth: 2)
                                }
                            }
                    }
                }
            }

            HStack {
                Button {
                    if camera.lastPhoto != nil { showCompare = true }
                } label: {
                    Group {
                        if let photo = camera.lastPhoto {
                            Image(uiImage: photo)
                                .resizable()
                                .scaledToFill()
                        } else {
                            Color.white.opacity(0.15)
                        }
                    }
                    .frame(width: 52, height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 10, style: .continuous).stroke(.white.opacity(0.6), lineWidth: 1))
                }
                .accessibilityLabel("Vergleich ansehen")

                Spacer()

                Button(action: shoot) {
                    ZStack {
                        Circle().stroke(.white, lineWidth: 4).frame(width: 78, height: 78)
                        Circle().fill(.white).frame(width: 64, height: 64)
                    }
                }
                .accessibilityLabel("Foto aufnehmen")
                .disabled(countdown != nil)

                Spacer()

                Button {
                    timerSeconds = timerSeconds == 0 ? 3 : (timerSeconds == 3 ? 10 : 0)
                } label: {
                    VStack(spacing: 2) {
                        Image(systemName: "timer")
                            .font(.title3)
                        Text(timerSeconds == 0 ? "Aus" : "\(timerSeconds) s")
                            .font(.caption2.bold())
                    }
                    .foregroundStyle(timerSeconds == 0 ? Color.white : Color.yellow)
                    .frame(width: 52, height: 52)
                }
                .accessibilityLabel("Selbstauslöser")
            }
        }
        .foregroundStyle(.white)
        .tint(.pink)
        .padding(14)
        .background(.black.opacity(0.4), in: RoundedRectangle(cornerRadius: 26, style: .continuous))
    }

    private func sliderBinding(_ slider: CameraSlider) -> Binding<Bool> {
        Binding(get: { activeSlider == slider },
                set: { on in withAnimation(.easeInOut(duration: 0.2)) { activeSlider = on ? slider : nil } })
    }

    /// Shown until a person is in the frame: the one thing to do first.
    private var setupHint: some View {
        HStack(spacing: 10) {
            Image(systemName: "figure.stand.line.dotted.figure.stand")
                .font(.headline)
                .foregroundStyle(.pink)
            Text(camera.position == .front
                 ? "Halte das iPhone weiter weg, bis du ganz im Bild bist."
                 : "Bring die Person ins Bild – am besten so groß wie in der Vorlage.")
                .font(.subheadline)
            Spacer(minLength: 0)
        }
        .foregroundStyle(.white)
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .environment(\.colorScheme, .dark)
    }

    private var permissionHint: some View {
        VStack(spacing: 12) {
            Image(systemName: "camera.fill")
                .font(.largeTitle)
            Text("Kein Kamerazugriff")
                .font(.headline)
            Text("Erlaube PinPose den Zugriff auf die Kamera in den Einstellungen.")
                .font(.subheadline)
                .multilineTextAlignment(.center)
            Button("Einstellungen öffnen") {
                if let url = URL(string: UIApplication.openSettingsURLString) {
                    UIApplication.shared.open(url)
                }
            }
            .buttonStyle(.borderedProminent)
        }
        .foregroundStyle(.white)
        .padding(24)
        .background(.black.opacity(0.7), in: RoundedRectangle(cornerRadius: 20))
        .padding()
    }

    // MARK: Actions

    private func shoot() {
        guard countdown == nil else { return }
        guard timerSeconds > 0 else {
            capture()
            return
        }
        Task { @MainActor in
            for second in stride(from: timerSeconds, to: 0, by: -1) {
                withAnimation(.spring) { countdown = second }
                UIImpactFeedbackGenerator(style: .light).impactOccurred()
                try? await Task.sleep(nanoseconds: 1_000_000_000)
            }
            withAnimation { countdown = nil }
            capture()
        }
    }

    /// Haptic when the pose locks in, and hands-free capture after holding it.
    private func handleMatch(_ score: Double?) {
        let matching = (score ?? 0) >= 0.85
        if matching && !wasMatching {
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        }
        wasMatching = matching

        guard autoCapture, matching, countdown == nil else {
            matchingSince = nil
            return
        }
        let now = Date()
        guard let since = matchingSince else {
            matchingSince = now
            return
        }
        if now.timeIntervalSince(since) >= 0.8, now.timeIntervalSince(lastAutoCapture) > 3 {
            lastAutoCapture = now
            matchingSince = nil
            capture()
        }
    }

    private func showToast(for score: Double?, previousBest: Double?) {
        let text: String
        if let score {
            let percent = "\(Int((score * 100).rounded())) %"
            if let previousBest, score > previousBest + 0.005 {
                text = "🏆 Neuer Bestwert: \(percent)"
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            } else if previousBest == nil {
                text = "Erstes Foto: \(percent) – tippe unten links zum Vergleichen"
            } else {
                text = "Gespeichert · \(percent)"
            }
        } else {
            text = "Gespeichert"
        }
        withAnimation(.spring) { shotToast = text }
        let shown = text
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            if shotToast == shown { withAnimation { shotToast = nil } }
        }
    }

    private func capture() {
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        camera.capturePhoto()
        withAnimation(.easeOut(duration: 0.08)) { flashScreen = true }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.12) {
            withAnimation(.easeIn(duration: 0.25)) { flashScreen = false }
        }
    }
}

private enum CameraSlider {
    case opacity, exposure
}

private enum OverlayStyle: String, CaseIterable, Identifiable {
    case photo, silhouette

    var id: String { rawValue }

    var label: String {
        switch self {
        case .photo: return "Foto"
        case .silhouette: return "Silhouette"
        }
    }

    var icon: String {
        switch self {
        case .photo: return "photo"
        case .silhouette: return "person.fill"
        }
    }
}

/// The live correction shown below the match score, green when the pose should be held.
private struct CoachHintPill: View {
    let hint: PoseHint

    var body: some View {
        let holding = hint == .hold
        HStack(spacing: 8) {
            Image(systemName: holding ? "checkmark.circle.fill" : "arrow.up.and.down.and.arrow.left.and.right")
            Text(hint.text)
                .lineLimit(2)
                .multilineTextAlignment(.leading)
        }
        .font(.headline)
        .foregroundStyle(.white)
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background((holding ? Color.green : Color.black).opacity(holding ? 0.85 : 0.55),
                    in: RoundedRectangle(cornerRadius: 14, style: .continuous))
        .accessibilityElement(children: .combine)
        .accessibilityLabel("Coaching: \(hint.text)")
    }
}

private struct ChipToggle: View {
    let title: String
    let systemImage: String
    @Binding var isOn: Bool

    var body: some View {
        Button {
            isOn.toggle()
        } label: {
            Label(title, systemImage: systemImage)
                .font(.caption.bold())
                .foregroundStyle(isOn ? Color.black : Color.white)
                .padding(.horizontal, 12)
                .padding(.vertical, 7)
                .background(isOn ? Color.yellow : Color.black.opacity(0.45), in: Capsule())
        }
        .accessibilityAddTraits(isOn ? .isSelected : [])
    }
}

private struct CameraIconLabel: View {
    let systemName: String
    var active = false

    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: 17, weight: .semibold))
            .foregroundStyle(active ? Color.yellow : Color.white)
            .frame(width: 42, height: 42)
            .background(.black.opacity(0.45), in: Circle())
    }
}

private struct CameraIconButton: View {
    let systemName: String
    var active = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            CameraIconLabel(systemName: systemName, active: active)
        }
    }
}

/// Live camera preview with tap-to-focus.
struct CameraPreview: UIViewRepresentable {
    let controller: CameraController

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.backgroundColor = .black
        view.previewLayer.session = controller.session
        view.previewLayer.videoGravity = .resizeAspectFill
        let tap = UITapGestureRecognizer(target: context.coordinator, action: #selector(Coordinator.handleTap(_:)))
        view.addGestureRecognizer(tap)
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(controller: controller)
    }

    final class Coordinator: NSObject {
        let controller: CameraController

        init(controller: CameraController) {
            self.controller = controller
        }

        @objc func handleTap(_ gesture: UITapGestureRecognizer) {
            guard let view = gesture.view as? PreviewView else { return }
            let point = gesture.location(in: view)
            controller.focus(at: view.previewLayer.captureDevicePointConverted(fromLayerPoint: point))
            view.showFocusIndicator(at: point)
        }
    }
}

final class PreviewView: UIView {
    override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }

    var previewLayer: AVCaptureVideoPreviewLayer {
        // swiftlint:disable:next force_cast
        layer as! AVCaptureVideoPreviewLayer
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        if let connection = previewLayer.connection, connection.isVideoRotationAngleSupported(90),
           connection.videoRotationAngle != 90 {
            connection.videoRotationAngle = 90
        }
    }

    func showFocusIndicator(at point: CGPoint) {
        let indicator = UIView(frame: CGRect(x: 0, y: 0, width: 72, height: 72))
        indicator.center = point
        indicator.layer.borderColor = UIColor.systemYellow.cgColor
        indicator.layer.borderWidth = 2
        indicator.layer.cornerRadius = 10
        indicator.transform = CGAffineTransform(scaleX: 1.4, y: 1.4)
        addSubview(indicator)
        UIView.animate(withDuration: 0.25, animations: {
            indicator.transform = .identity
        }, completion: { _ in
            UIView.animate(withDuration: 0.4, delay: 0.6, options: [], animations: {
                indicator.alpha = 0
            }, completion: { _ in
                indicator.removeFromSuperview()
            })
        })
    }
}
