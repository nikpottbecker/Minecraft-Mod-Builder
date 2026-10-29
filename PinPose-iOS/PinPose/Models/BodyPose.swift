import CoreGraphics
import Foundation

/// Body joints we track (mirrors Vision's human body pose joints).
enum Joint: String, Codable, CaseIterable, CodingKeyRepresentable {
    case nose, leftEye, rightEye, leftEar, rightEar, neck
    case leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist
    case root, leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle

    /// The same joint on the other side of the body.
    var mirrored: Joint {
        switch self {
        case .leftEye: return .rightEye
        case .rightEye: return .leftEye
        case .leftEar: return .rightEar
        case .rightEar: return .leftEar
        case .leftShoulder: return .rightShoulder
        case .rightShoulder: return .leftShoulder
        case .leftElbow: return .rightElbow
        case .rightElbow: return .leftElbow
        case .leftWrist: return .rightWrist
        case .rightWrist: return .leftWrist
        case .leftHip: return .rightHip
        case .rightHip: return .leftHip
        case .leftKnee: return .rightKnee
        case .rightKnee: return .leftKnee
        case .leftAnkle: return .rightAnkle
        case .rightAnkle: return .leftAnkle
        case .nose, .neck, .root: return self
        }
    }
}

/// A detected body pose. Points are normalized (0...1) with the origin at the top-left of the image.
struct BodyPose: Codable, Equatable {
    var points: [Joint: CGPoint]

    subscript(_ joint: Joint) -> CGPoint? { points[joint] }

    /// Lines drawn for the skeleton overlay.
    static let bones: [(Joint, Joint)] = [
        (.nose, .neck),
        (.neck, .leftShoulder), (.neck, .rightShoulder),
        (.leftShoulder, .leftElbow), (.leftElbow, .leftWrist),
        (.rightShoulder, .rightElbow), (.rightElbow, .rightWrist),
        (.leftShoulder, .leftHip), (.rightShoulder, .rightHip),
        (.leftHip, .rightHip),
        (.leftHip, .leftKnee), (.leftKnee, .leftAnkle),
        (.rightHip, .rightKnee), (.rightKnee, .rightAnkle),
    ]

    var boundingBox: CGRect {
        let xs = points.values.map(\.x)
        let ys = points.values.map(\.y)
        guard let minX = xs.min(), let maxX = xs.max(), let minY = ys.min(), let maxY = ys.max() else { return .zero }
        return CGRect(x: minX, y: minY, width: maxX - minX, height: maxY - minY)
    }

    /// The pose flipped horizontally, with left and right swapped.
    func mirrored() -> BodyPose {
        var result: [Joint: CGPoint] = [:]
        for (joint, point) in points {
            result[joint.mirrored] = CGPoint(x: 1 - point.x, y: point.y)
        }
        return BodyPose(points: result)
    }

    /// True when the knees are roughly level with the hips (person is sitting or crouching).
    var isSitting: Bool {
        guard let ls = self[.leftShoulder] ?? self[.rightShoulder],
              let lh = self[.leftHip], let rh = self[.rightHip],
              let lk = self[.leftKnee], let rk = self[.rightKnee] else { return false }
        let torso = max(((lh.y + rh.y) / 2) - ls.y, 0.02)
        return (lk.y - lh.y) < 0.35 * torso && (rk.y - rh.y) < 0.35 * torso
    }
}

extension CGRect {
    var area: CGFloat { width * height }
}

/// How much of the person is in the frame.
enum Framing: String, Codable {
    case fullBody, knees, waist, portrait

    init(pose: BodyPose) {
        if pose[.leftAnkle] != nil || pose[.rightAnkle] != nil {
            self = .fullBody
        } else if pose[.leftKnee] != nil || pose[.rightKnee] != nil {
            self = .knees
        } else if pose[.leftHip] != nil || pose[.rightHip] != nil {
            self = .waist
        } else {
            self = .portrait
        }
    }

    var label: String {
        switch self {
        case .fullBody: return String(localized: "Ganzkörper")
        case .knees: return String(localized: "Bis zu den Knien")
        case .waist: return String(localized: "Halbnah (bis zur Hüfte)")
        case .portrait: return String(localized: "Porträt")
        }
    }

    var detail: String {
        switch self {
        case .fullBody: return String(localized: "Von Kopf bis Fuß im Bild – die Füße nicht abschneiden!")
        case .knees: return String(localized: "Schnitt oberhalb der Knie, nie direkt im Gelenk.")
        case .waist: return String(localized: "Oberkörper im Bild, Schnitt etwa an der Hüfte.")
        case .portrait: return String(localized: "Kopf und Schultern füllen das Bild.")
        }
    }
}
