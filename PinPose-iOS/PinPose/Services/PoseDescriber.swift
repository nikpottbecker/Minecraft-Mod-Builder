import CoreGraphics
import Foundation

/// Turns a detected pose into step-by-step posing instructions (German).
/// Left/right always mean the person's own left/right, so they can copy it directly.
struct PoseDescriber {
    let pose: BodyPose
    /// Image width / height, so angles are measured in real proportions.
    let aspect: CGFloat
    var faceYaw: Double?
    var faceRoll: Double?

    static let noPersonAdvice: [Advice] = [
        Advice(icon: "person.fill.questionmark", title: "Keine Person erkannt",
               detail: "Im Bild wurde keine Pose gefunden. Nutze das halbtransparente Vorlagenbild in der Kamera, um den Bildausschnitt nachzubauen."),
        Advice(icon: "figure.stand", title: "Natürlich bleiben",
               detail: "Gewicht auf ein Bein, Schultern locker, Hände beschäftigen (Haare, Jacke, Tasche)."),
    ]

    private func p(_ joint: Joint) -> CGPoint? {
        pose[joint].map { CGPoint(x: $0.x * aspect, y: $0.y) }
    }

    private static func dist(_ a: CGPoint, _ b: CGPoint) -> CGFloat { hypot(a.x - b.x, a.y - b.y) }
    private static func mid(_ a: CGPoint, _ b: CGPoint) -> CGPoint { CGPoint(x: (a.x + b.x) / 2, y: (a.y + b.y) / 2) }

    /// Inner angle at `b` in degrees.
    private static func angle(_ a: CGPoint, _ b: CGPoint, _ c: CGPoint) -> CGFloat {
        let v1 = CGVector(dx: a.x - b.x, dy: a.y - b.y)
        let v2 = CGVector(dx: c.x - b.x, dy: c.y - b.y)
        let lengths = hypot(v1.dx, v1.dy) * hypot(v2.dx, v2.dy)
        guard lengths > 0 else { return 180 }
        let cosine = max(-1, min(1, (v1.dx * v2.dx + v1.dy * v2.dy) / lengths))
        return acos(cosine) * 180 / .pi
    }

    /// Slope of the line between two points in degrees; positive means the right side (in the image) is lower.
    private static func tilt(_ a: CGPoint, _ b: CGPoint) -> CGFloat {
        let (left, right) = a.x <= b.x ? (a, b) : (b, a)
        return atan2(right.y - left.y, right.x - left.x) * 180 / .pi
    }

    func advice() -> [Advice] {
        var result: [Advice] = []
        let ls = p(.leftShoulder), rs = p(.rightShoulder)
        let lh = p(.leftHip), rh = p(.rightHip)

        let shoulderMid: CGPoint? = {
            if let ls, let rs { return Self.mid(ls, rs) }
            return ls ?? rs ?? p(.neck)
        }()
        let hipMid: CGPoint? = {
            if let lh, let rh { return Self.mid(lh, rh) }
            return lh ?? rh ?? p(.root)
        }()
        let unit: CGFloat = {
            if let shoulderMid, let hipMid { return max(Self.dist(shoulderMid, hipMid), 0.05) }
            if let ls, let rs { return max(Self.dist(ls, rs) * 1.4, 0.05) }
            return 0.25
        }()

        // Body orientation
        if let ls, let rs {
            let ratio = abs(ls.x - rs.x) / unit
            let facingCamera = ls.x > rs.x
            if ratio < 0.25 {
                result.append(Advice(icon: "person.fill.turn.right", title: "Seitlich zur Kamera",
                                     detail: "Stell dich im Profil zur Kamera – die Schultern zeigen nicht zur Linse."))
            } else if !facingCamera {
                result.append(Advice(icon: "arrow.uturn.backward", title: "Rücken zur Kamera",
                                     detail: faceYaw != nil
                                     ? "Dreh der Kamera den Rücken zu und schau über die Schulter zurück."
                                     : "Dreh der Kamera den Rücken zu – z. B. Blick in die Landschaft."))
            } else if ratio < 0.5 {
                result.append(Advice(icon: "person.fill.turn.left", title: "Leicht schräg (ca. 45°)",
                                     detail: "Dreh deinen Körper etwa 45° von der Kamera weg – wirkt schlanker und natürlicher."))
            } else {
                result.append(Advice(icon: "person.fill", title: "Frontal zur Kamera",
                                     detail: "Stell dich gerade zur Kamera, Schultern locker nach hinten und unten."))
            }

            let shoulderTilt = Self.tilt(ls, rs)
            if abs(shoulderTilt) > 7 {
                let lowSide = shoulderTilt > 0 ? "rechten" : "linken"
                result.append(Advice(icon: "line.diagonal", title: "Schultern schräg",
                                     detail: "Die Schulter auf der \(lowSide) Bildseite ist tiefer – lass eine Schulter locker fallen, das wirkt lässig."))
            }
        } else if ls != nil || rs != nil {
            result.append(Advice(icon: "person.fill.turn.right", title: "Seitlich zur Kamera",
                                 detail: "Stell dich im Profil zur Kamera."))
        }

        // Hips / weight shift
        if let lh, let rh, !pose.isSitting {
            let hipTilt = Self.tilt(lh, rh)
            if abs(hipTilt) > 5 {
                let highSide = hipTilt > 0 ? "linken" : "rechten"
                result.append(Advice(icon: "figure.dance", title: "Hüfte zur Seite (S-Kurve)",
                                     detail: "Verlagere dein Gewicht auf ein Bein, sodass die Hüfte auf der \(highSide) Bildseite höher ist."))
            }
        }

        // Head
        result.append(contentsOf: headAdvice(unit: unit))

        // Arms
        let center = shoulderMid?.x
        if let tip = armAdvice(shoulder: .leftShoulder, elbow: .leftElbow, wrist: .leftWrist, hip: .leftHip,
                               title: "Linker Arm", accusative: "linken", centerX: center, unit: unit) {
            result.append(tip)
        }
        if let tip = armAdvice(shoulder: .rightShoulder, elbow: .rightElbow, wrist: .rightWrist, hip: .rightHip,
                               title: "Rechter Arm", accusative: "rechten", centerX: center, unit: unit) {
            result.append(tip)
        }

        // Legs
        result.append(contentsOf: legAdvice(unit: unit))

        result.append(Advice(icon: "sparkles", title: "Profi-Trick",
                             detail: "Geh langsam in die Pose und mach Serienbilder (Auslöser gedrückt halten) – kleine Bewegungen wirken natürlicher als Stillstand."))
        return result
    }

    private func headAdvice(unit: CGFloat) -> [Advice] {
        var result: [Advice] = []

        var roll: CGFloat?
        if let le = p(.leftEye), let re = p(.rightEye) {
            roll = Self.tilt(le, re)
        } else if let faceRoll {
            roll = CGFloat(faceRoll * 180 / .pi)
        }
        if let roll, abs(roll) > 8 {
            result.append(Advice(icon: "face.smiling", title: "Kopf neigen",
                                 detail: "Neige deinen Kopf leicht zur Seite (ca. \(Int(abs(roll).rounded()))°)."))
        }

        if let yaw = faceYaw {
            let degrees = abs(yaw * 180 / .pi)
            if degrees > 20 {
                result.append(Advice(icon: "eye", title: "Blick zur Seite",
                                     detail: "Dreh den Kopf etwa \(Int(degrees.rounded()))° zur Seite und schau an der Kamera vorbei."))
            } else {
                result.append(Advice(icon: "eye", title: "Blick in die Kamera",
                                     detail: "Schau direkt in die Linse – Kinn leicht nach vorne und unten."))
            }
        } else if p(.nose) == nil, p(.leftEar) != nil || p(.rightEar) != nil {
            result.append(Advice(icon: "eye.slash", title: "Gesicht abgewandt",
                                 detail: "Das Gesicht ist von der Kamera weggedreht."))
        }

        if let nose = p(.nose), let le = p(.leftEar), let re = p(.rightEar) {
            let offset = (nose.y - Self.mid(le, re).y) / unit
            if offset > 0.18 {
                result.append(Advice(icon: "arrow.down.circle", title: "Blick nach unten",
                                     detail: "Senk den Blick – z. B. auf den Boden, deine Hände oder dein Outfit."))
            } else if offset < -0.08 {
                result.append(Advice(icon: "arrow.up.circle", title: "Kinn hoch",
                                     detail: "Heb das Kinn leicht an und schau nach oben."))
            }
        }
        return result
    }

    private func armAdvice(shoulder: Joint, elbow: Joint, wrist: Joint, hip: Joint,
                           title: String, accusative: String, centerX: CGFloat?, unit: CGFloat) -> Advice? {
        guard let s = p(shoulder), let w = p(wrist) else { return nil }
        let e = p(elbow)
        let nose = p(.nose)
        let center = centerX ?? s.x

        if let nose, w.y < nose.y - 0.05 * unit {
            return Advice(icon: "hand.raised.fill", title: title,
                          detail: "Heb den \(accusative) Arm über den Kopf – z. B. Hand in die Haare oder locker an den Hinterkopf.")
        }
        if let nose, Self.dist(w, nose) < 0.45 * unit {
            return Advice(icon: "hand.point.up.left.fill", title: title,
                          detail: "Führ die Hand ans Gesicht – sanft ans Kinn, an die Wange oder in die Haare.")
        }
        if let h = p(hip), Self.dist(w, h) < 0.3 * unit {
            if let e, abs(e.x - center) > abs(s.x - center) + 0.12 * unit {
                return Advice(icon: "hand.raised", title: title,
                              detail: "Hand in die Hüfte stützen, Ellbogen nach außen – so entsteht Luft zwischen Arm und Körper.")
            }
            return Advice(icon: "hand.raised", title: title,
                          detail: "Hand locker an die Hüfte oder in die Hosentasche.")
        }
        if (s.x - center) * (w.x - center) < 0, abs(w.x - center) > 0.1 * unit {
            return Advice(icon: "arrow.left.arrow.right", title: title,
                          detail: "Führ den Arm vor den Körper – z. B. an den anderen Arm, die Tasche oder die Jacke.")
        }
        if abs(w.y - s.y) < 0.2 * unit, Self.dist(w, s) > 0.7 * unit {
            return Advice(icon: "figure.wave", title: title,
                          detail: "Streck den \(accusative) Arm zur Seite aus.")
        }
        if let e {
            let bend = Self.angle(s, e, w)
            if bend > 150 {
                return Advice(icon: "figure.stand", title: title,
                              detail: "Lass den Arm locker hängen – leicht vom Körper weg, damit er nicht flach wirkt.")
            }
            return Advice(icon: "figure.stand", title: title,
                          detail: "Winkel den \(accusative) Arm an (ca. \(Int(bend.rounded()))°), die Hand entspannt.")
        }
        return nil
    }

    private func legAdvice(unit: CGFloat) -> [Advice] {
        let lh = p(.leftHip), rh = p(.rightHip)
        let lk = p(.leftKnee), rk = p(.rightKnee)
        let la = p(.leftAnkle), ra = p(.rightAnkle)

        if pose.isSitting {
            var detail = "Setz dich hin – z. B. auf eine Mauer, Treppe, Bank oder den Boden."
            if let lk, let lh, lk.y < lh.y { detail += " Die Knie sind angezogen." }
            return [Advice(icon: "chair.lounge.fill", title: "Hinsetzen", detail: detail)]
        }

        var result: [Advice] = []
        if let la, let ra, let lh, let rh, (la.x - ra.x) * (lh.x - rh.x) < 0, abs(la.x - ra.x) > 0.05 * unit {
            result.append(Advice(icon: "figure.walk", title: "Beine überkreuzen",
                                 detail: "Stell ein Bein vor das andere und kreuze die Füße – das macht die Silhouette schmal."))
        }

        var leftBend: CGFloat?
        var rightBend: CGFloat?
        if let lh, let lk, let la { leftBend = Self.angle(lh, lk, la) }
        if let rh, let rk, let ra { rightBend = Self.angle(rh, rk, ra) }
        if let l = leftBend, let r = rightBend {
            if l < 150 && r < 150 {
                result.append(Advice(icon: "figure.walk", title: "Beide Knie gebeugt",
                                     detail: "Geh leicht in die Knie oder lauf locker auf die Kamera zu (Walking-Shot)."))
            } else if min(l, r) < 158 && max(l, r) >= 160 {
                let side = l < r ? "linkes" : "rechtes"
                result.append(Advice(icon: "figure.stand", title: "Standbein & Spielbein",
                                     detail: "Beug dein \(side) Knie leicht und dreh es etwas nach innen – das andere Bein trägt das Gewicht."))
            }
        }

        if let la, let ra {
            let hipWidth = (lh != nil && rh != nil) ? abs(lh!.x - rh!.x) : 0.3 * unit
            if abs(la.x - ra.x) > 1.6 * max(hipWidth, 0.3 * unit) {
                result.append(Advice(icon: "figure.walk", title: "Großer Schritt",
                                     detail: "Stell die Füße weit auseinander oder mach einen großen Schritt – wirkt dynamisch."))
            }
            if abs(la.y - ra.y) > 0.25 * unit {
                result.append(Advice(icon: "shoeprints.fill", title: "Ein Fuß angehoben",
                                     detail: "Heb einen Fuß leicht an (Zehenspitze) oder geh in die Bewegung."))
            }
            if result.isEmpty {
                result.append(Advice(icon: "figure.stand", title: "Beine",
                                     detail: "Beide Beine locker nebeneinander, Gewicht leicht auf einem Bein."))
            }
        }
        return result
    }
}
