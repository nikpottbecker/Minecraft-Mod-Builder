import AVFoundation
import CoreGraphics
import Foundation

/// One spoken/written correction for the live view, e.g. "Linke Hand höher".
struct PoseHint: Equatable {
    let text: String
    /// The joint that should move, if the hint is about a single limb.
    let joint: Joint?

    static let hold = PoseHint(text: "Perfekt – Pose halten!", joint: nil)
}

/// Turns the difference between the live pose and the reference into the single most important correction.
///
/// Left/right always mean the person's own side (like everywhere else in the app). Sideways moves are
/// described relative to the body ("weiter nach außen", "näher an den Körper"), so the wording is the
/// same for the front and the back camera.
enum PoseCoach {
    private struct Limb {
        let from: Joint
        let to: Joint
        /// Accusative label used in the instruction, e.g. "Linke Hand", "Linken Ellbogen".
        let label: String
    }

    private static let limbs: [Limb] = [
        Limb(from: .leftShoulder, to: .leftElbow, label: "Linken Ellbogen"),
        Limb(from: .leftElbow, to: .leftWrist, label: "Linke Hand"),
        Limb(from: .rightShoulder, to: .rightElbow, label: "Rechten Ellbogen"),
        Limb(from: .rightElbow, to: .rightWrist, label: "Rechte Hand"),
        Limb(from: .leftHip, to: .leftKnee, label: "Linkes Knie"),
        Limb(from: .leftKnee, to: .leftAnkle, label: "Linken Fuß"),
        Limb(from: .rightHip, to: .rightKnee, label: "Rechtes Knie"),
        Limb(from: .rightKnee, to: .rightAnkle, label: "Rechten Fuß"),
    ]

    /// Limb directions that differ less than this are fine.
    static let limbToleranceDegrees = 25.0
    /// Shoulder/hip/head tilts that differ less than this are fine.
    static let tiltToleranceDegrees = 12.0
    /// From this match score on the pose counts as done.
    static let holdScore = 0.85

    /// Where the person is on screen, for distance and position hints.
    struct FramingContext {
        /// The live pose as shown on screen (not un-mirrored).
        var screenPose: BodyPose
        /// The reference overlay is shown mirrored.
        var referenceMirrored: Bool
        var frontCamera: Bool
    }

    /// Size differences up to this factor are fine.
    static let sizeTolerance = 1.25
    /// Horizontal offsets up to this share of the screen height are fine.
    static let offsetTolerance = 0.12

    /// Returns `PoseHint.hold` when the pose matches, the most important correction otherwise,
    /// or nil when there is not enough of the body visible to say anything useful.
    static func hint(live: BodyPose, liveAspect: CGFloat, reference: BodyPose, referenceAspect: CGFloat, score: Double?,
                     framing: FramingContext? = nil) -> PoseHint? {
        let framingHint = framing.flatMap { self.framingHint($0, liveAspect: liveAspect,
                                                             reference: reference, referenceAspect: referenceAspect) }
        if let score, score >= holdScore {
            // A matching pose at the wrong size or place still needs one step.
            if let framingHint, framingHint.severity > 1.5 { return framingHint.hint }
            return .hold
        }

        let target = PoseMatcher.alignedReference(live: live, liveAspect: liveAspect,
                                                  reference: reference, referenceAspect: referenceAspect)
        var best: (severity: Double, hint: PoseHint)?

        func consider(_ severity: Double, _ hint: PoseHint) {
            guard severity > 1 else { return }
            if best == nil || severity > best!.severity { best = (severity, hint) }
        }

        let center = bodyCenterX(live, aspect: liveAspect)
        for limb in limbs {
            guard let a1 = live[limb.from], let a2 = live[limb.to],
                  let b1 = target[limb.from], let b2 = target[limb.to] else { continue }
            let liveVector = vector(a1, a2, aspect: liveAspect)
            let targetVector = vector(b1, b2, aspect: referenceAspect)
            let diff = angleBetween(liveVector, targetVector)
            guard diff > limbToleranceDegrees else { continue }

            // Where the end of the limb would be with the reference direction and the live length.
            let length = hypot(liveVector.dx, liveVector.dy)
            let targetLength = max(hypot(targetVector.dx, targetVector.dy), 0.0001)
            let start = CGPoint(x: a1.x * liveAspect, y: a1.y)
            let end = CGPoint(x: a2.x * liveAspect, y: a2.y)
            let goal = CGPoint(x: start.x + targetVector.dx / targetLength * length,
                               y: start.y + targetVector.dy / targetLength * length)
            let dx = goal.x - end.x
            let dy = goal.y - end.y

            let direction: String
            if abs(dy) >= abs(dx) {
                direction = dy < 0 ? "höher" : "tiefer"
            } else if let center {
                direction = abs(goal.x - center) > abs(end.x - center) ? "weiter nach außen" : "näher an den Körper"
            } else {
                continue
            }
            consider(diff / limbToleranceDegrees, PoseHint(text: "\(limb.label) \(direction)", joint: limb.to))
        }

        if let hint = tiltHint(live, liveAspect, target, referenceAspect, .leftShoulder, .rightShoulder,
                               more: "Schultern schräger halten", less: "Schultern gerader halten") {
            consider(hint.severity * 0.8, hint.hint)
        }
        if let hint = tiltHint(live, liveAspect, target, referenceAspect, .leftHip, .rightHip,
                               more: "Hüfte mehr zur Seite kippen", less: "Hüfte gerader halten") {
            consider(hint.severity * 0.8, hint.hint)
        }
        if let hint = headHint(live, liveAspect, target, referenceAspect) {
            consider(hint.severity * 0.7, hint.hint)
        }
        if let framingHint {
            // Distance first: limb directions are easier to judge once the size is right.
            consider(framingHint.severity * 1.2, framingHint.hint)
        }
        return best?.hint
    }

    /// "Ein Schritt zurück", "Näher ran", "Kamera etwas nach links" …
    static func framingHint(_ context: FramingContext, liveAspect: CGFloat,
                            reference: BodyPose, referenceAspect: CGFloat) -> (severity: Double, hint: PoseHint)? {
        let target = context.referenceMirrored ? reference.mirrored() : reference
        // Only joints visible in both, so a cut-off foot does not count as "too small".
        let common = Set(context.screenPose.points.keys).intersection(target.points.keys)
        guard common.count >= 6,
              common.contains(.leftShoulder) || common.contains(.rightShoulder),
              common.contains(.leftHip) || common.contains(.rightHip) || common.contains(.root) else { return nil }
        let liveBox = BodyPose(points: context.screenPose.points.filter { common.contains($0.key) }).boundingBox
        let targetBox = BodyPose(points: target.points.filter { common.contains($0.key) }).boundingBox
        guard liveBox.height > 0.05, targetBox.height > 0.05 else { return nil }

        var best: (severity: Double, hint: PoseHint)?
        let ratio = Double(liveBox.height / targetBox.height)
        let sizeSeverity = abs(log(ratio)) / log(sizeTolerance)
        if sizeSeverity > 1 {
            let text: String
            if ratio < 1 {
                text = context.frontCamera ? "Näher an die Kamera" : "Einen Schritt näher ran"
            } else {
                text = context.frontCamera ? "Weiter weg von der Kamera" : "Einen Schritt zurück"
            }
            best = (sizeSeverity, PoseHint(text: text, joint: nil))
        }

        // Both pictures fill the screen height, so compare x in units of the height.
        let liveX = Double((liveBox.midX - 0.5) * liveAspect)
        let targetX = Double((targetBox.midX - 0.5) * referenceAspect)
        let dx = liveX - targetX
        let offsetSeverity = abs(dx) / offsetTolerance
        if offsetSeverity > 1, offsetSeverity * 0.9 > (best?.severity ?? 0) {
            let text: String
            if context.frontCamera {
                // Mirrored preview: moving to your own left moves you to the left of the screen.
                text = dx > 0 ? "Etwas nach links gehen" : "Etwas nach rechts gehen"
            } else {
                text = dx > 0 ? "Kamera etwas nach rechts schwenken" : "Kamera etwas nach links schwenken"
            }
            best = (offsetSeverity * 0.9, PoseHint(text: text, joint: nil))
        }
        return best
    }

    // MARK: Geometry (y points down, x is scaled by the aspect ratio so angles are true angles)

    private static func vector(_ a: CGPoint, _ b: CGPoint, aspect: CGFloat) -> CGVector {
        CGVector(dx: (b.x - a.x) * aspect, dy: b.y - a.y)
    }

    /// Unsigned angle between two vectors in degrees (0...180).
    private static func angleBetween(_ a: CGVector, _ b: CGVector) -> Double {
        var diff = abs(atan2(Double(a.dy), Double(a.dx)) - atan2(Double(b.dy), Double(b.dx)))
        if diff > .pi { diff = 2 * .pi - diff }
        return diff * 180 / .pi
    }

    /// Tilt of a line against the horizontal in degrees (0...90), independent of its direction.
    private static func tilt(_ v: CGVector) -> Double {
        let angle = abs(atan2(Double(v.dy), Double(v.dx))) * 180 / .pi
        return angle > 90 ? 180 - angle : angle
    }

    private static func bodyCenterX(_ pose: BodyPose, aspect: CGFloat) -> CGFloat? {
        if let neck = pose[.neck] { return neck.x * aspect }
        if let l = pose[.leftShoulder], let r = pose[.rightShoulder] { return (l.x + r.x) / 2 * aspect }
        if let root = pose[.root] { return root.x * aspect }
        return nil
    }

    private static func tiltHint(_ live: BodyPose, _ liveAspect: CGFloat, _ target: BodyPose, _ targetAspect: CGFloat,
                                 _ a: Joint, _ b: Joint, more: String, less: String) -> (severity: Double, hint: PoseHint)? {
        guard let l1 = live[a], let l2 = live[b], let t1 = target[a], let t2 = target[b] else { return nil }
        let liveTilt = tilt(vector(l1, l2, aspect: liveAspect))
        let targetTilt = tilt(vector(t1, t2, aspect: targetAspect))
        let diff = targetTilt - liveTilt
        guard abs(diff) > tiltToleranceDegrees else { return nil }
        return (abs(diff) / tiltToleranceDegrees, PoseHint(text: diff > 0 ? more : less, joint: nil))
    }

    private static func headHint(_ live: BodyPose, _ liveAspect: CGFloat,
                                 _ target: BodyPose, _ targetAspect: CGFloat) -> (severity: Double, hint: PoseHint)? {
        guard let ln = live[.neck], let lnose = live[.nose], let tn = target[.neck], let tnose = target[.nose] else { return nil }
        // Head tilt = how far the neck→nose line leans away from vertical.
        let liveLean = 90 - tilt(vector(ln, lnose, aspect: liveAspect))
        let targetLean = 90 - tilt(vector(tn, tnose, aspect: targetAspect))
        let diff = targetLean - liveLean
        guard abs(diff) > tiltToleranceDegrees else { return nil }
        return (abs(diff) / tiltToleranceDegrees,
                PoseHint(text: diff > 0 ? "Kopf mehr zur Seite neigen" : "Kopf gerader halten", joint: .nose))
    }
}

/// Reads coaching hints aloud, for when the phone is on a tripod and the screen is out of reach.
final class CoachVoice {
    private let synthesizer = AVSpeechSynthesizer()
    private var lastText = ""
    private var lastSpoken = Date.distantPast

    /// Speaks a new hint; repeats an unchanged one at most every 4 seconds.
    func say(_ text: String) {
        let now = Date()
        let changed = text != lastText
        guard changed ? now.timeIntervalSince(lastSpoken) > 1.2 : now.timeIntervalSince(lastSpoken) > 4 else { return }
        guard !synthesizer.isSpeaking else { return }
        activateAudioSession()
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "de-DE")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 1.05
        synthesizer.speak(utterance)
        lastText = text
        lastSpoken = now
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    /// Playback category so the hints are audible with the ring/silent switch on; other audio is only ducked.
    private func activateAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playback, mode: .voicePrompt, options: [.duckOthers])
        try? session.setActive(true)
    }
}
