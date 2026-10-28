import CoreGraphics
import Foundation
import Vision

/// Converts Vision observations into our `BodyPose`.
enum PoseExtraction {
    private static let jointNames: [Joint: VNHumanBodyPoseObservation.JointName] = [
        .nose: .nose, .leftEye: .leftEye, .rightEye: .rightEye, .leftEar: .leftEar, .rightEar: .rightEar,
        .neck: .neck, .root: .root,
        .leftShoulder: .leftShoulder, .rightShoulder: .rightShoulder,
        .leftElbow: .leftElbow, .rightElbow: .rightElbow,
        .leftWrist: .leftWrist, .rightWrist: .rightWrist,
        .leftHip: .leftHip, .rightHip: .rightHip,
        .leftKnee: .leftKnee, .rightKnee: .rightKnee,
        .leftAnkle: .leftAnkle, .rightAnkle: .rightAnkle,
    ]

    static func pose(from observation: VNHumanBodyPoseObservation, minConfidence: Float = 0.3) -> BodyPose? {
        guard let recognized = try? observation.recognizedPoints(.all) else { return nil }
        var points: [Joint: CGPoint] = [:]
        for (joint, name) in jointNames {
            if let point = recognized[name], point.confidence >= minConfidence {
                // Vision uses a bottom-left origin; flip to top-left.
                points[joint] = CGPoint(x: point.location.x, y: 1 - point.location.y)
            }
        }
        return points.count >= 4 ? BodyPose(points: points) : nil
    }

    /// Picks the largest person among several observations.
    static func mainPose(from observations: [VNHumanBodyPoseObservation]) -> BodyPose? {
        observations
            .compactMap { pose(from: $0) }
            .max { $0.boundingBox.area < $1.boundingBox.area }
    }
}

/// Compares two poses by the direction of each limb, independent of size and position.
enum PoseMatcher {
    private static let limbs: [(Joint, Joint)] = [
        (.leftShoulder, .leftElbow), (.leftElbow, .leftWrist),
        (.rightShoulder, .rightElbow), (.rightElbow, .rightWrist),
        (.leftHip, .leftKnee), (.leftKnee, .leftAnkle),
        (.rightHip, .rightKnee), (.rightKnee, .rightAnkle),
        (.leftShoulder, .rightShoulder), (.leftHip, .rightHip),
        (.leftShoulder, .leftHip), (.rightShoulder, .rightHip),
        (.neck, .nose),
    ]

    /// Returns 0...1, or nil when too few limbs are visible in both poses.
    /// A mirrored copy of the pose counts as a match too.
    static func score(live: BodyPose, liveAspect: CGFloat, reference: BodyPose, referenceAspect: CGFloat) -> Double? {
        let direct = compare(live, liveAspect, reference, referenceAspect)
        let mirrored = compare(live, liveAspect, reference.mirrored(), referenceAspect)
        switch (direct, mirrored) {
        case let (a?, b?): return max(a, b)
        default: return direct ?? mirrored
        }
    }

    private static func compare(_ a: BodyPose, _ aspectA: CGFloat, _ b: BodyPose, _ aspectB: CGFloat) -> Double? {
        var total = 0.0
        var count = 0
        for (j1, j2) in limbs {
            guard let a1 = a[j1], let a2 = a[j2], let b1 = b[j1], let b2 = b[j2] else { continue }
            let angleA = atan2(Double(a2.y - a1.y), Double(a2.x - a1.x) * Double(aspectA))
            let angleB = atan2(Double(b2.y - b1.y), Double(b2.x - b1.x) * Double(aspectB))
            var diff = abs(angleA - angleB)
            if diff > .pi { diff = 2 * .pi - diff }
            total += max(0, 1 - diff / (.pi / 2))
            count += 1
        }
        return count >= 4 ? total / Double(count) : nil
    }
}
