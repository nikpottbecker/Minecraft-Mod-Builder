import CoreGraphics
import UIKit

/// Built-in poses, so people can start without their own Pinterest picture.
struct PoseIdea: Identifiable, Hashable {
    let id: String
    let title: String
    let subtitle: String
    let pose: BodyPose

    static let imageSize = CGSize(width: 900, height: 1200)

    static func == (a: PoseIdea, b: PoseIdea) -> Bool { a.id == b.id }
    func hash(into hasher: inout Hasher) { hasher.combine(id) }

    /// Standing straight, arms down, facing the camera. Left/right are the person's own sides.
    private static let base: [Joint: CGPoint] = [
        .nose: CGPoint(x: 0.5, y: 0.14), .neck: CGPoint(x: 0.5, y: 0.22), .root: CGPoint(x: 0.5, y: 0.5),
        .leftShoulder: CGPoint(x: 0.59, y: 0.24), .rightShoulder: CGPoint(x: 0.41, y: 0.24),
        .leftElbow: CGPoint(x: 0.61, y: 0.36), .rightElbow: CGPoint(x: 0.39, y: 0.36),
        .leftWrist: CGPoint(x: 0.62, y: 0.47), .rightWrist: CGPoint(x: 0.38, y: 0.47),
        .leftHip: CGPoint(x: 0.555, y: 0.5), .rightHip: CGPoint(x: 0.445, y: 0.5),
        .leftKnee: CGPoint(x: 0.555, y: 0.69), .rightKnee: CGPoint(x: 0.445, y: 0.69),
        .leftAnkle: CGPoint(x: 0.555, y: 0.88), .rightAnkle: CGPoint(x: 0.445, y: 0.88),
    ]

    private static func pose(_ changes: [Joint: CGPoint]) -> BodyPose {
        BodyPose(points: base.merging(changes) { _, new in new })
    }

    static let all: [PoseIdea] = [
        PoseIdea(id: "hip", title: String(localized: "Hand in die Hüfte"), subtitle: String(localized: "Der Klassiker für Outfit-Fotos"),
                 pose: pose([.leftElbow: CGPoint(x: 0.70, y: 0.37), .leftWrist: CGPoint(x: 0.57, y: 0.47),
                             .rightKnee: CGPoint(x: 0.47, y: 0.69), .rightAnkle: CGPoint(x: 0.5, y: 0.88)])),
        PoseIdea(id: "hair", title: String(localized: "Hand in den Haaren"), subtitle: String(localized: "Locker und selbstbewusst"),
                 pose: pose([.rightElbow: CGPoint(x: 0.30, y: 0.14), .rightWrist: CGPoint(x: 0.43, y: 0.09),
                             .leftKnee: CGPoint(x: 0.53, y: 0.69), .leftAnkle: CGPoint(x: 0.5, y: 0.88)])),
        PoseIdea(id: "walk", title: String(localized: "Lässig gehen"), subtitle: String(localized: "Bewegung wirkt natürlich"),
                 pose: pose([.leftKnee: CGPoint(x: 0.6, y: 0.68), .leftAnkle: CGPoint(x: 0.65, y: 0.87),
                             .rightKnee: CGPoint(x: 0.43, y: 0.7), .rightAnkle: CGPoint(x: 0.37, y: 0.86),
                             .leftElbow: CGPoint(x: 0.6, y: 0.36), .leftWrist: CGPoint(x: 0.57, y: 0.46),
                             .rightElbow: CGPoint(x: 0.37, y: 0.35), .rightWrist: CGPoint(x: 0.33, y: 0.45)])),
        PoseIdea(id: "arms", title: String(localized: "Arme verschränkt"), subtitle: String(localized: "Business- und Profilbild"),
                 pose: pose([.leftElbow: CGPoint(x: 0.64, y: 0.38), .leftWrist: CGPoint(x: 0.45, y: 0.37),
                             .rightElbow: CGPoint(x: 0.36, y: 0.38), .rightWrist: CGPoint(x: 0.55, y: 0.36)])),
        PoseIdea(id: "sit", title: String(localized: "Sitzen"), subtitle: String(localized: "Auf Treppe, Mauer oder Bank"),
                 pose: pose([.leftKnee: CGPoint(x: 0.6, y: 0.56), .rightKnee: CGPoint(x: 0.4, y: 0.56),
                             .leftAnkle: CGPoint(x: 0.6, y: 0.84), .rightAnkle: CGPoint(x: 0.4, y: 0.84),
                             .leftWrist: CGPoint(x: 0.6, y: 0.53), .rightWrist: CGPoint(x: 0.4, y: 0.53),
                             .leftElbow: CGPoint(x: 0.63, y: 0.4), .rightElbow: CGPoint(x: 0.37, y: 0.4)])),
        PoseIdea(id: "cheer", title: String(localized: "Arme hoch"), subtitle: String(localized: "Jubel, Konzert, Gipfel"),
                 pose: pose([.leftElbow: CGPoint(x: 0.68, y: 0.13), .leftWrist: CGPoint(x: 0.71, y: 0.03),
                             .rightElbow: CGPoint(x: 0.32, y: 0.13), .rightWrist: CGPoint(x: 0.29, y: 0.03)])),
    ]

    /// Reference picture: the figure in white on a dark gradient.
    func referenceImage() -> UIImage {
        render(background: true, color: .white)
    }

    /// Transparent figure in the accent pink, used as the camera silhouette.
    func silhouette() -> UIImage {
        render(background: false, color: UIColor(named: "AccentColor") ?? .systemPink)
    }

    private func render(background: Bool, color: UIColor) -> UIImage {
        let size = Self.imageSize
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = background
        return UIGraphicsImageRenderer(size: size, format: format).image { context in
            let cg = context.cgContext
            if background {
                let colors = [UIColor(red: 0.16, green: 0.12, blue: 0.22, alpha: 1).cgColor,
                              UIColor(red: 0.05, green: 0.05, blue: 0.08, alpha: 1).cgColor] as CFArray
                if let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1]) {
                    cg.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: 0, y: size.height), options: [])
                }
            }
            func map(_ joint: Joint) -> CGPoint? {
                pose[joint].map { CGPoint(x: $0.x * size.width, y: $0.y * size.height) }
            }
            cg.setStrokeColor(color.cgColor)
            cg.setFillColor(color.cgColor)
            cg.setLineCap(.round)
            cg.setLineJoin(.round)

            // Torso as a filled shape, limbs as thick strokes, head as a circle.
            if let ls = map(.leftShoulder), let rs = map(.rightShoulder), let lh = map(.leftHip), let rh = map(.rightHip) {
                cg.setLineWidth(size.width * 0.05)
                cg.move(to: ls); cg.addLine(to: rs); cg.addLine(to: rh); cg.addLine(to: lh); cg.closePath()
                cg.drawPath(using: .fillStroke)
            }
            cg.setLineWidth(size.width * 0.06)
            for (a, b) in BodyPose.bones where a != .nose && b != .nose {
                if let pa = map(a), let pb = map(b) {
                    cg.move(to: pa); cg.addLine(to: pb)
                }
            }
            cg.strokePath()
            if let nose = map(.nose) {
                let radius = size.width * 0.065
                cg.fillEllipse(in: CGRect(x: nose.x - radius, y: nose.y - radius, width: radius * 2, height: radius * 2))
            }
        }
    }

    func analysis() -> ShotAnalysis {
        let stats = ImageStats(luminance: 0.5, contrast: 0.2, warmth: 0.05, saturation: 0.35,
                               subjectLuminance: 0.5, backgroundLuminance: 0.5, sharpnessRatio: 1)
        let advisor = ShotAdvisor(imageSize: Self.imageSize, pose: pose, faceRect: nil, stats: stats,
                                  exif: nil, sceneLabels: [])
        return ShotAnalysis(
            imageWidth: Double(Self.imageSize.width),
            imageHeight: Double(Self.imageSize.height),
            pose: pose,
            framing: advisor.framing,
            poseAdvice: PoseDescriber(pose: pose, aspect: Self.imageSize.width / Self.imageSize.height).advice(),
            cameraAdvice: advisor.cameraAdvice(),
            lightAdvice: [Advice(icon: "cloud.sun.fill", title: String(localized: "Weiches Licht"),
                                 detail: String(localized: "Am besten im Schatten oder bei leichter Bewölkung – kein hartes Mittagslicht im Gesicht."))],
            compositionAdvice: advisor.compositionAdvice(),
            places: [],
            sceneLabels: [],
            exif: nil,
            recommendedZoom: 1,
            recommendedExposureBias: 0
        )
    }
}
