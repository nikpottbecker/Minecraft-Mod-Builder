import ImageIO
import UIKit
import Vision

enum AnalysisError: LocalizedError {
    case unreadableImage

    var errorDescription: String? {
        "Das Bild konnte nicht gelesen werden. Versuch ein anderes Bild."
    }
}

struct AnalysisResult {
    var image: UIImage
    var analysis: ShotAnalysis
}

/// Runs Vision and pixel analysis on a reference photo.
enum ImageAnalyzer {
    static func analyze(data: Data) async throws -> AnalysisResult {
        try await Task.detached(priority: .userInitiated) {
            guard let raw = UIImage(data: data) else { throw AnalysisError.unreadableImage }
            let image = raw.uprightResized(maxSide: 2048)
            guard let cgImage = image.cgImage else { throw AnalysisError.unreadableImage }
            let analysis = try ImageAnalyzer.analyze(cgImage: cgImage, exif: ExifInfo.read(from: data))
            return AnalysisResult(image: image, analysis: analysis)
        }.value
    }

    private static func analyze(cgImage: CGImage, exif: ExifInfo?) throws -> ShotAnalysis {
        let size = CGSize(width: cgImage.width, height: cgImage.height)

        let poseRequest = VNDetectHumanBodyPoseRequest()
        let faceRequest = VNDetectFaceRectanglesRequest()
        let classifyRequest = VNClassifyImageRequest()
        let handler = VNImageRequestHandler(cgImage: cgImage, orientation: .up, options: [:])
        try handler.perform([poseRequest, faceRequest, classifyRequest])

        let pose = PoseExtraction.mainPose(from: poseRequest.results ?? [])

        let face = (faceRequest.results ?? []).max { $0.boundingBox.area < $1.boundingBox.area }
        let faceRect = face.map { observation -> CGRect in
            let box = observation.boundingBox
            return CGRect(x: box.minX, y: 1 - box.maxY, width: box.width, height: box.height)
        }

        let labels = (classifyRequest.results ?? [])
            .filter { $0.confidence > 0.12 }
            .sorted { $0.confidence > $1.confidence }
            .prefix(12)
            .map(\.identifier)

        // First pass without stats to find where the subject is.
        let placeholderStats = ImageStats(luminance: 0.5, contrast: 0.2, warmth: 0, saturation: 0.3,
                                          subjectLuminance: 0.5, backgroundLuminance: 0.5, sharpnessRatio: 1)
        let subject = ShotAdvisor(imageSize: size, pose: pose, faceRect: faceRect, stats: placeholderStats,
                                  exif: exif, sceneLabels: Array(labels)).subjectRect
        let stats = ImageAnalyzer.computeStats(cgImage, subject: subject)

        let advisor = ShotAdvisor(imageSize: size, pose: pose, faceRect: faceRect, stats: stats,
                                  exif: exif, sceneLabels: Array(labels))

        let poseAdvice: [Advice]
        if let pose {
            poseAdvice = PoseDescriber(pose: pose, aspect: size.width / size.height,
                                       faceYaw: face?.yaw?.doubleValue,
                                       faceRoll: face?.roll?.doubleValue).advice()
        } else {
            poseAdvice = PoseDescriber.noPersonAdvice
        }

        return ShotAnalysis(
            imageWidth: Double(size.width),
            imageHeight: Double(size.height),
            pose: pose,
            framing: advisor.framing,
            poseAdvice: poseAdvice,
            cameraAdvice: advisor.cameraAdvice(),
            lightAdvice: advisor.lightAdvice(),
            compositionAdvice: advisor.compositionAdvice(),
            places: advisor.placeIdeas(),
            sceneLabels: Array(labels),
            exif: exif,
            recommendedZoom: advisor.recommendedZoom(),
            recommendedExposureBias: advisor.recommendedExposureBias()
        )
    }

    /// Brightness, color and sharpness statistics on a downscaled copy.
    private static func computeStats(_ cgImage: CGImage, subject: CGRect?) -> ImageStats {
        let maxSide = 192.0
        let scale = min(1, maxSide / Double(max(cgImage.width, cgImage.height)))
        let w = max(8, Int(Double(cgImage.width) * scale))
        let h = max(8, Int(Double(cgImage.height) * scale))
        var pixels = [UInt8](repeating: 0, count: w * h * 4)
        let drawn: Bool = pixels.withUnsafeMutableBytes { buffer in
            guard let context = CGContext(data: buffer.baseAddress, width: w, height: h, bitsPerComponent: 8,
                                          bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(),
                                          bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else { return false }
            context.interpolationQuality = .medium
            context.draw(cgImage, in: CGRect(x: 0, y: 0, width: w, height: h))
            return true
        }
        guard drawn else {
            return ImageStats(luminance: 0.5, contrast: 0.2, warmth: 0, saturation: 0.3,
                              subjectLuminance: 0.5, backgroundLuminance: 0.5, sharpnessRatio: 1)
        }

        let count = w * h
        var luminance = [Double](repeating: 0, count: count)
        var sumL = 0.0, sumL2 = 0.0, sumR = 0.0, sumB = 0.0, sumS = 0.0
        for i in 0..<count {
            let r = Double(pixels[i * 4]) / 255
            let g = Double(pixels[i * 4 + 1]) / 255
            let b = Double(pixels[i * 4 + 2]) / 255
            let l = 0.2126 * r + 0.7152 * g + 0.0722 * b
            luminance[i] = l
            sumL += l
            sumL2 += l * l
            sumR += r
            sumB += b
            let maxC = max(r, g, b), minC = min(r, g, b)
            sumS += maxC > 0 ? (maxC - minC) / maxC : 0
        }
        let n = Double(count)
        let mean = sumL / n

        // The bitmap's first row is the top of the image, matching our top-left coordinates.
        let region = subject ?? CGRect(x: 0.25, y: 0.2, width: 0.5, height: 0.6)
        var subjectL = 0.0, subjectN = 0.0, backgroundL = 0.0, backgroundN = 0.0
        var subjectSharp = 0.0, backgroundSharp = 0.0
        for y in 1..<(h - 1) {
            for x in 1..<(w - 1) {
                let i = y * w + x
                let laplacian = 4 * luminance[i] - luminance[i - 1] - luminance[i + 1] - luminance[i - w] - luminance[i + w]
                let energy = laplacian * laplacian
                let point = CGPoint(x: (Double(x) + 0.5) / Double(w), y: (Double(y) + 0.5) / Double(h))
                if region.contains(point) {
                    subjectL += luminance[i]; subjectSharp += energy; subjectN += 1
                } else {
                    backgroundL += luminance[i]; backgroundSharp += energy; backgroundN += 1
                }
            }
        }
        let subjectSharpness = subjectSharp / max(subjectN, 1)
        let backgroundSharpness = backgroundSharp / max(backgroundN, 1)

        return ImageStats(
            luminance: mean,
            contrast: sqrt(max(0, sumL2 / n - mean * mean)),
            warmth: (sumR - sumB) / n,
            saturation: sumS / n,
            subjectLuminance: subjectN > 0 ? subjectL / subjectN : mean,
            backgroundLuminance: backgroundN > 0 ? backgroundL / backgroundN : mean,
            sharpnessRatio: backgroundN > 0 ? subjectSharpness / max(backgroundSharpness, 0.000_01) : 1
        )
    }
}

extension UIImage {
    /// Redraws the image upright (applying EXIF orientation) and at most `maxSide` pixels long.
    func uprightResized(maxSide: CGFloat) -> UIImage {
        let pixelSize = CGSize(width: size.width * scale, height: size.height * scale)
        let longest = max(pixelSize.width, pixelSize.height)
        let factor = longest > maxSide ? maxSide / longest : 1
        let target = CGSize(width: (pixelSize.width * factor).rounded(), height: (pixelSize.height * factor).rounded())
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        return UIGraphicsImageRenderer(size: target, format: format).image { _ in
            draw(in: CGRect(origin: .zero, size: target))
        }
    }
}
