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
        Advice(icon: "person.fill.questionmark", title: String(localized: "Keine Person erkannt"),
               detail: String(localized: "Im Bild wurde keine Pose gefunden. Nutze das halbtransparente Vorlagenbild in der Kamera, um den Bildausschnitt nachzubauen.")),
        Advice(icon: "figure.stand", title: String(localized: "Natürlich bleiben"),
               detail: String(localized: "Gewicht auf ein Bein, Schultern locker, Hände beschäftigen (Haare, Jacke, Tasche).")),
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
                result.append(Advice(icon: "person.fill.turn.right", title: String(localized: "Seitlich zur Kamera"),
                                     detail: String(localized: "Stell dich im Profil zur Kamera – die Schultern zeigen nicht zur Linse.")))
            } else if !facingCamera {
                result.append(Advice(icon: "arrow.uturn.backward", title: String(localized: "Rücken zur Kamera"),
                                     detail: faceYaw != nil
                                     ? String(localized: "Dreh der Kamera den Rücken zu und schau über die Schulter zurück.")
                                     : String(localized: "Dreh der Kamera den Rücken zu – z. B. Blick in die Landschaft.")))
            } else if ratio < 0.5 {
                result.append(Advice(icon: "person.fill.turn.left", title: String(localized: "Leicht schräg (ca. 45°)"),
                                     detail: String(localized: "Dreh deinen Körper etwa 45° von der Kamera weg – wirkt schlanker und natürlicher.")))
            } else {
                result.append(Advice(icon: "person.fill", title: String(localized: "Frontal zur Kamera"),
                                     detail: String(localized: "Stell dich gerade zur Kamera, Schultern locker nach hinten und unten.")))
            }

            let shoulderTilt = Self.tilt(ls, rs)
            if abs(shoulderTilt) > 7 {
                result.append(Advice(icon: "line.diagonal", title: String(localized: "Schultern schräg"),
                                     detail: shoulderTilt > 0
                                     ? String(localized: "Die Schulter auf der rechten Bildseite ist tiefer – lass eine Schulter locker fallen, das wirkt lässig.")
                                     : String(localized: "Die Schulter auf der linken Bildseite ist tiefer – lass eine Schulter locker fallen, das wirkt lässig.")))
            }
        } else if ls != nil || rs != nil {
            result.append(Advice(icon: "person.fill.turn.right", title: String(localized: "Seitlich zur Kamera"),
                                 detail: String(localized: "Stell dich im Profil zur Kamera.")))
        }

        // Hips / weight shift
        if let lh, let rh, !pose.isSitting {
            let hipTilt = Self.tilt(lh, rh)
            if abs(hipTilt) > 5 {
                result.append(Advice(icon: "figure.dance", title: String(localized: "Hüfte zur Seite (S-Kurve)"),
                                     detail: hipTilt > 0
                                     ? String(localized: "Verlagere dein Gewicht auf ein Bein, sodass die Hüfte auf der linken Bildseite höher ist.")
                                     : String(localized: "Verlagere dein Gewicht auf ein Bein, sodass die Hüfte auf der rechten Bildseite höher ist.")))
            }
        }

        // Head
        result.append(contentsOf: headAdvice(unit: unit))

        // Arms
        let center = shoulderMid?.x
        if let tip = armAdvice(shoulder: .leftShoulder, elbow: .leftElbow, wrist: .leftWrist, hip: .leftHip,
                               title: String(localized: "Linker Arm"), left: true, centerX: center, unit: unit) {
            result.append(tip)
        }
        if let tip = armAdvice(shoulder: .rightShoulder, elbow: .rightElbow, wrist: .rightWrist, hip: .rightHip,
                               title: String(localized: "Rechter Arm"), left: false, centerX: center, unit: unit) {
            result.append(tip)
        }

        // Legs
        result.append(contentsOf: legAdvice(unit: unit))

        result.append(Advice(icon: "sparkles", title: String(localized: "Profi-Trick"),
                             detail: String(localized: "Geh langsam in die Pose und mach Serienbilder (Auslöser gedrückt halten) – kleine Bewegungen wirken natürlicher als Stillstand.")))
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
            result.append(Advice(icon: "face.smiling", title: String(localized: "Kopf neigen"),
                                 detail: String(localized: "Neige deinen Kopf leicht zur Seite (ca. \(Int(abs(roll).rounded()))°).")))
        }

        if let yaw = faceYaw {
            let degrees = abs(yaw * 180 / .pi)
            if degrees > 20 {
                result.append(Advice(icon: "eye", title: String(localized: "Blick zur Seite"),
                                     detail: String(localized: "Dreh den Kopf etwa \(Int(degrees.rounded()))° zur Seite und schau an der Kamera vorbei.")))
            } else {
                result.append(Advice(icon: "eye", title: String(localized: "Blick in die Kamera"),
                                     detail: String(localized: "Schau direkt in die Linse – Kinn leicht nach vorne und unten.")))
            }
        } else if p(.nose) == nil, p(.leftEar) != nil || p(.rightEar) != nil {
            result.append(Advice(icon: "eye.slash", title: String(localized: "Gesicht abgewandt"),
                                 detail: String(localized: "Das Gesicht ist von der Kamera weggedreht.")))
        }

        if let nose = p(.nose), let le = p(.leftEar), let re = p(.rightEar) {
            let offset = (nose.y - Self.mid(le, re).y) / unit
            if offset > 0.18 {
                result.append(Advice(icon: "arrow.down.circle", title: String(localized: "Blick nach unten"),
                                     detail: String(localized: "Senk den Blick – z. B. auf den Boden, deine Hände oder dein Outfit.")))
            } else if offset < -0.08 {
                result.append(Advice(icon: "arrow.up.circle", title: String(localized: "Kinn hoch"),
                                     detail: String(localized: "Heb das Kinn leicht an und schau nach oben.")))
            }
        }
        return result
    }

    private func armAdvice(shoulder: Joint, elbow: Joint, wrist: Joint, hip: Joint,
                           title: String, left: Bool, centerX: CGFloat?, unit: CGFloat) -> Advice? {
        guard let s = p(shoulder), let w = p(wrist) else { return nil }
        let e = p(elbow)
        let nose = p(.nose)
        let center = centerX ?? s.x

        if let nose, w.y < nose.y - 0.05 * unit {
            return Advice(icon: "hand.raised.fill", title: title,
                          detail: left
                          ? String(localized: "Heb den linken Arm über den Kopf – z. B. Hand in die Haare oder locker an den Hinterkopf.")
                          : String(localized: "Heb den rechten Arm über den Kopf – z. B. Hand in die Haare oder locker an den Hinterkopf."))
        }
        if let nose, Self.dist(w, nose) < 0.45 * unit {
            return Advice(icon: "hand.point.up.left.fill", title: title,
                          detail: String(localized: "Führ die Hand ans Gesicht – sanft ans Kinn, an die Wange oder in die Haare."))
        }
        if let h = p(hip), Self.dist(w, h) < 0.3 * unit {
            if let e, abs(e.x - center) > abs(s.x - center) + 0.12 * unit {
                return Advice(icon: "hand.raised", title: title,
                              detail: String(localized: "Hand in die Hüfte stützen, Ellbogen nach außen – so entsteht Luft zwischen Arm und Körper."))
            }
            return Advice(icon: "hand.raised", title: title,
                          detail: String(localized: "Hand locker an die Hüfte oder in die Hosentasche."))
        }
        if (s.x - center) * (w.x - center) < 0, abs(w.x - center) > 0.1 * unit {
            return Advice(icon: "arrow.left.arrow.right", title: title,
                          detail: String(localized: "Führ den Arm vor den Körper – z. B. an den anderen Arm, die Tasche oder die Jacke."))
        }
        if abs(w.y - s.y) < 0.2 * unit, Self.dist(w, s) > 0.7 * unit {
            return Advice(icon: "figure.wave", title: title,
                          detail: left ? String(localized: "Streck den linken Arm zur Seite aus.")
                                : String(localized: "Streck den rechten Arm zur Seite aus."))
        }
        if let e {
            let bend = Self.angle(s, e, w)
            if bend > 150 {
                return Advice(icon: "figure.stand", title: title,
                              detail: String(localized: "Lass den Arm locker hängen – leicht vom Körper weg, damit er nicht flach wirkt."))
            }
            return Advice(icon: "figure.stand", title: title,
                          detail: left
                          ? String(localized: "Winkel den linken Arm an (ca. \(Int(bend.rounded()))°), die Hand entspannt.")
                          : String(localized: "Winkel den rechten Arm an (ca. \(Int(bend.rounded()))°), die Hand entspannt."))
        }
        return nil
    }

    private func legAdvice(unit: CGFloat) -> [Advice] {
        let lh = p(.leftHip), rh = p(.rightHip)
        let lk = p(.leftKnee), rk = p(.rightKnee)
        let la = p(.leftAnkle), ra = p(.rightAnkle)

        if pose.isSitting {
            var detail = String(localized: "Setz dich hin – z. B. auf eine Mauer, Treppe, Bank oder den Boden.")
            if let lk, let lh, lk.y < lh.y { detail += " " + String(localized: "Die Knie sind angezogen.") }
            return [Advice(icon: "chair.lounge.fill", title: String(localized: "Hinsetzen"), detail: detail)]
        }

        var result: [Advice] = []
        if let la, let ra, let lh, let rh, (la.x - ra.x) * (lh.x - rh.x) < 0, abs(la.x - ra.x) > 0.05 * unit {
            result.append(Advice(icon: "figure.walk", title: String(localized: "Beine überkreuzen"),
                                 detail: String(localized: "Stell ein Bein vor das andere und kreuze die Füße – das macht die Silhouette schmal.")))
        }

        var leftBend: CGFloat?
        var rightBend: CGFloat?
        if let lh, let lk, let la { leftBend = Self.angle(lh, lk, la) }
        if let rh, let rk, let ra { rightBend = Self.angle(rh, rk, ra) }
        if let l = leftBend, let r = rightBend {
            if l < 150 && r < 150 {
                result.append(Advice(icon: "figure.walk", title: String(localized: "Beide Knie gebeugt"),
                                     detail: String(localized: "Geh leicht in die Knie oder lauf locker auf die Kamera zu (Walking-Shot).")))
            } else if min(l, r) < 158 && max(l, r) >= 160 {
                result.append(Advice(icon: "figure.stand", title: String(localized: "Standbein & Spielbein"),
                                     detail: l < r
                                     ? String(localized: "Beug dein linkes Knie leicht und dreh es etwas nach innen – das andere Bein trägt das Gewicht.")
                                     : String(localized: "Beug dein rechtes Knie leicht und dreh es etwas nach innen – das andere Bein trägt das Gewicht.")))
            }
        }

        if let la, let ra {
            let hipWidth = (lh != nil && rh != nil) ? abs(lh!.x - rh!.x) : 0.3 * unit
            if abs(la.x - ra.x) > 1.6 * max(hipWidth, 0.3 * unit) {
                result.append(Advice(icon: "figure.walk", title: String(localized: "Großer Schritt"),
                                     detail: String(localized: "Stell die Füße weit auseinander oder mach einen großen Schritt – wirkt dynamisch.")))
            }
            if abs(la.y - ra.y) > 0.25 * unit {
                result.append(Advice(icon: "shoeprints.fill", title: String(localized: "Ein Fuß angehoben"),
                                     detail: String(localized: "Heb einen Fuß leicht an (Zehenspitze) oder geh in die Bewegung.")))
            }
            if result.isEmpty {
                result.append(Advice(icon: "figure.stand", title: String(localized: "Beine"),
                                     detail: String(localized: "Beide Beine locker nebeneinander, Gewicht leicht auf einem Bein.")))
            }
        }
        return result
    }
}
