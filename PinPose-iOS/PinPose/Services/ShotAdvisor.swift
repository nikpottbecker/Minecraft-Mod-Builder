import CoreGraphics
import Foundation

/// Pixel statistics of the reference photo (all values 0...1 unless noted).
struct ImageStats {
    var luminance: Double
    var contrast: Double
    /// Mean red minus mean blue (-1...1). Positive = warm.
    var warmth: Double
    var saturation: Double
    var subjectLuminance: Double
    var backgroundLuminance: Double
    /// Subject sharpness divided by background sharpness. High = blurry background.
    var sharpnessRatio: Double
}

/// Derives camera, light, composition and location advice from the analysis inputs.
struct ShotAdvisor {
    let imageSize: CGSize
    let pose: BodyPose?
    /// Normalized, top-left origin.
    let faceRect: CGRect?
    let stats: ImageStats
    let exif: ExifInfo?
    let sceneLabels: [String]

    static let zoomSteps: [Double] = [0.5, 1, 2, 3, 5]

    var framing: Framing? {
        if let pose { return Framing(pose: pose) }
        return faceRect != nil ? .portrait : nil
    }

    /// Where the person is in the frame (normalized), including some room for the head.
    var subjectRect: CGRect? {
        if let pose {
            var box = pose.boundingBox
            let headRoom = max(box.height * 0.12, 0.04)
            box.origin.y = max(0, box.minY - headRoom)
            box.size.height += headRoom
            return box.insetBy(dx: -0.04, dy: -0.02).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        if let faceRect {
            return CGRect(x: faceRect.midX - faceRect.width * 1.5, y: faceRect.minY - faceRect.height * 0.3,
                          width: faceRect.width * 3, height: faceRect.height * 4)
                .intersection(CGRect(x: 0, y: 0, width: 1, height: 1))
        }
        return nil
    }

    private var hasBlurryBackground: Bool { stats.sharpnessRatio > 2.5 }
    private var hasStrongBlur: Bool { stats.sharpnessRatio > 5 }

    // MARK: Camera

    func recommendedZoom() -> Double {
        if let focal = exif?.focalLength35, focal > 0 {
            return Self.snap(focal / 26)
        }
        guard let framing else { return 1 }
        switch framing {
        case .portrait: return hasBlurryBackground ? 3 : 2
        case .waist: return hasBlurryBackground ? 2 : 1
        case .knees: return hasStrongBlur ? 2 : 1
        case .fullBody: return 1
        }
    }

    static func snap(_ zoom: Double) -> Double {
        zoomSteps.min { abs(log($0 / zoom)) < abs(log($1 / zoom)) } ?? 1
    }

    static func zoomLabel(_ zoom: Double) -> String {
        zoom < 1 ? "0,5×" : "\(Int(zoom))×"
    }

    func recommendedExposureBias() -> Float {
        var bias: Double
        switch stats.luminance {
        case ..<0.3: bias = -1.0
        case ..<0.4: bias = -0.5
        case 0.7...: bias = 1.0
        case 0.6...: bias = 0.5
        default: bias = 0
        }
        if isBacklit { bias += 0.3 }
        return Float(max(-2, min(2, bias)))
    }

    private var isBacklit: Bool { stats.backgroundLuminance - stats.subjectLuminance > 0.15 }

    func cameraAdvice() -> [Advice] {
        var result: [Advice] = []
        let zoom = recommendedZoom()
        let zoomText = Self.zoomLabel(zoom)

        if let focal = exif?.focalLength35 {
            result.append(Advice(icon: "plus.magnifyingglass", title: String(localized: "Zoom: \(zoomText)"),
                                 detail: String(localized: "Original-Brennweite ca. \(Int(focal)) mm (Kleinbild) – entspricht am iPhone etwa \(zoomText).")))
        } else {
            let reason: String
            switch framing {
            case .none: reason = String(localized: "Starte mit \(zoomText) und vergleiche mit der Vorlage.")
            case .some(.portrait): reason = String(localized: "Für ein Porträt wirkt \(zoomText) natürlicher – keine verzerrte Nase, schöner Hintergrund.")
            case .some(.waist): reason = String(localized: "Halbnah mit \(zoomText): Die Proportionen bleiben natürlich.")
            case .some(.knees): reason = String(localized: "Mit \(zoomText) passt der Ausschnitt bis zu den Knien.")
            case .some(.fullBody): reason = String(localized: "Ganzkörper mit \(zoomText) – lieber ein paar Schritte zurückgehen statt digital zu zoomen.")
            }
            result.append(Advice(icon: "plus.magnifyingglass", title: String(localized: "Zoom: \(zoomText)"), detail: reason))
        }

        if hasStrongBlur {
            result.append(Advice(icon: "camera.aperture", title: String(localized: "Porträtmodus (f/1.8–2.2)"),
                                 detail: String(localized: "Der Hintergrund ist stark unscharf. Porträtmodus an, Tiefe auf ca. f/2 stellen. Mindestens 3 m Abstand zwischen Person und Hintergrund.")))
        } else if hasBlurryBackground {
            result.append(Advice(icon: "camera.aperture", title: String(localized: "Leichte Unschärfe (f/2.8–4)"),
                                 detail: String(localized: "Porträtmodus mit Tiefe ca. f/2.8–4 – oder einfach mehr Abstand zum Hintergrund und 2× Zoom.")))
        } else {
            result.append(Advice(icon: "camera", title: String(localized: "Normaler Fotomodus"),
                                 detail: String(localized: "Alles ist scharf – kein Porträtmodus nötig. Live Photo kann aus bleiben.")))
        }

        result.append(cameraHeightAdvice())

        let (ratioLabel, isPortrait) = Self.aspectLabel(imageSize)
        var formatDetail = isPortrait
            ? String(localized: "Fotografiere im Hochformat und schneide danach auf \(ratioLabel) zu.")
            : String(localized: "Fotografiere im Querformat und schneide danach auf \(ratioLabel) zu.")
        if ratioLabel == "2:3" { formatDetail += " " + String(localized: "Das ist das typische Pinterest-Format.") }
        result.append(Advice(icon: isPortrait ? "rectangle.portrait" : "rectangle",
                             title: String(localized: "Format \(ratioLabel)"),
                             detail: formatDetail))

        let bias = recommendedExposureBias()
        if abs(bias) < 0.05 {
            result.append(Advice(icon: "sun.max", title: String(localized: "Belichtung ±0"),
                                 detail: String(localized: "Tippe auf das Gesicht – damit sitzen Fokus und Belichtung auf der Person.")))
        } else {
            let ev = String(format: "%+.1f", bias)
            result.append(Advice(icon: "sun.max", title: String(localized: "Belichtung \(ev)"),
                                 detail: bias < 0
                                 ? String(localized: "Tippe auf das Gesicht und zieh den Sonnen-Regler nach unten (ca. \(ev) EV). In der PinPose-Kamera ist das schon voreingestellt.")
                                 : String(localized: "Tippe auf das Gesicht und zieh den Sonnen-Regler nach oben (ca. \(ev) EV). In der PinPose-Kamera ist das schon voreingestellt.")))
        }

        if let exif, exif.hasCameraValues {
            result.append(Advice(icon: "info.circle", title: String(localized: "Originale Kameradaten"), detail: exif.summary))
        }
        return result
    }

    private func cameraHeightAdvice() -> Advice {
        if framing == .fullBody, let pose, !pose.isSitting,
           let shoulder = pose[.leftShoulder] ?? pose[.rightShoulder],
           let hip = pose[.leftHip] ?? pose[.rightHip],
           let ankle = pose[.leftAnkle] ?? pose[.rightAnkle] {
            let torso = hip.y - shoulder.y
            let legs = ankle.y - hip.y
            if torso > 0.02 {
                let ratio = legs / torso
                if ratio > 2.0 {
                    return Advice(icon: "arrow.up.forward.circle", title: String(localized: "Kamera tief halten"),
                                  detail: String(localized: "Kamera auf Hüft- oder Kniehöhe, leicht nach oben neigen – das macht lange Beine. Person steht nah am unteren Bildrand."))
                }
                if ratio < 1.45 {
                    return Advice(icon: "arrow.down.forward.circle", title: String(localized: "Kamera erhöht"),
                                  detail: String(localized: "Kamera etwas über Augenhöhe halten und leicht nach unten neigen."))
                }
            }
        }
        return Advice(icon: "camera.viewfinder", title: String(localized: "Kamera auf Brusthöhe"),
                      detail: String(localized: "Halte die Kamera etwa auf Brust- bis Augenhöhe der Person und gerade (Raster nutzen)."))
    }

    static func aspectLabel(_ size: CGSize) -> (String, Bool) {
        let ratio = size.width / max(size.height, 1)
        let candidates: [(String, CGFloat)] = [
            ("9:16", 9.0 / 16), ("2:3", 2.0 / 3), ("3:4", 3.0 / 4), ("4:5", 4.0 / 5),
            ("1:1", 1), ("4:3", 4.0 / 3), ("3:2", 3.0 / 2), ("16:9", 16.0 / 9),
        ]
        let best = candidates.min { abs($0.1 - ratio) < abs($1.1 - ratio) }!
        return (best.0, ratio < 1)
    }

    // MARK: Light

    func lightAdvice() -> [Advice] {
        var result: [Advice] = []
        let lum = stats.luminance
        let warmth = stats.warmth

        if lum < 0.2 && warmth > 0.05 {
            result.append(Advice(icon: "lightbulb.fill", title: String(localized: "Warmes Kunstlicht"),
                                 detail: String(localized: "Abends oder drinnen mit Lichterkette, Kerzen oder Lampen. Belichtung runter, Handy ruhig halten.")))
        } else if lum < 0.25 {
            result.append(Advice(icon: "moon.stars.fill", title: String(localized: "Abend / Blaue Stunde"),
                                 detail: String(localized: "Kurz nach Sonnenuntergang. Nachtmodus oder Blitz verwenden.")))
        } else if warmth > 0.08 && lum < 0.65 {
            result.append(Advice(icon: "sun.horizon.fill", title: String(localized: "Golden Hour"),
                                 detail: String(localized: "Ca. 1 Stunde vor Sonnenuntergang (oder nach Sonnenaufgang). Die tiefe Sonne gibt warmes, weiches Licht.")))
        } else if stats.contrast > 0.26 && lum > 0.45 {
            result.append(Advice(icon: "sun.max.fill", title: String(localized: "Direkte Sonne"),
                                 detail: String(localized: "Tagsüber bei Sonnenschein, harte Schatten. Achte auf Schatten im Gesicht – Sonnenbrille oder Hut helfen.")))
        } else if stats.contrast < 0.17 {
            result.append(Advice(icon: "cloud.sun.fill", title: String(localized: "Weiches Licht"),
                                 detail: String(localized: "Bewölkter Himmel oder Schatten unter Bäumen/Gebäuden – gleichmäßig und schmeichelhaft.")))
        } else {
            result.append(Advice(icon: "sun.min.fill", title: String(localized: "Tageslicht"),
                                 detail: String(localized: "Normales Tageslicht. Am schönsten, wenn das Licht schräg von vorne kommt (z. B. Fenster neben der Kamera).")))
        }

        if isBacklit {
            result.append(Advice(icon: "sun.haze.fill", title: String(localized: "Gegenlicht"),
                                 detail: String(localized: "Die Lichtquelle ist hinter der Person. Stell dich mit dem Rücken zur Sonne und tippe zum Belichten auf das Gesicht.")))
        } else if stats.subjectLuminance - stats.backgroundLuminance > 0.22 && stats.backgroundLuminance < 0.3 {
            result.append(Advice(icon: "bolt.fill", title: String(localized: "Blitz-Look"),
                                 detail: String(localized: "Die Person ist viel heller als der dunkle Hintergrund – typischer Blitz-Look. In der Kamera den Blitz anschalten.")))
        }

        let tone = warmth > 0.08 ? String(localized: "warm") : (warmth < -0.04 ? String(localized: "kühl") : String(localized: "neutral"))
        let saturation = stats.saturation < 0.18 ? String(localized: "entsättigt")
            : (stats.saturation > 0.45 ? String(localized: "kräftige Farben") : String(localized: "natürliche Farben"))
        let brightness = lum > 0.6 ? String(localized: "hell & airy") : (lum < 0.35 ? String(localized: "dunkel & moody") : String(localized: "ausgewogen"))

        func clamp(_ value: Double, _ low: Double, _ high: Double) -> Int { Int(max(low, min(high, value)).rounded()) }
        func signed(_ value: Int) -> String { value > 0 ? "+\(value)" : "\(value)" }
        let edits = [
            String(localized: "Belichtung \(signed(clamp((lum - 0.5) * 100, -40, 40)))"),
            String(localized: "Kontrast \(signed(clamp((stats.contrast - 0.22) * 200, -40, 40)))"),
            String(localized: "Sättigung \(signed(clamp((stats.saturation - 0.3) * 100, -50, 30)))"),
            String(localized: "Wärme \(signed(clamp(warmth * 200, -40, 40)))"),
        ]
        result.append(Advice(icon: "paintpalette.fill", title: String(localized: "Farblook: \(tone), \(saturation), \(brightness)"),
                             detail: String(localized: "Nachbearbeitung in der Fotos-App (Bearbeiten → Anpassen): \(edits.joined(separator: ", "))."))
        return result
    }

    // MARK: Composition

    func compositionAdvice() -> [Advice] {
        var result: [Advice] = []
        if let framing {
            result.append(Advice(icon: "person.crop.rectangle", title: String(localized: "Ausschnitt: \(framing.label)"), detail: framing.detail))
        }
        guard let rect = subjectRect else {
            result.append(Advice(icon: "square.grid.3x3", title: String(localized: "Raster nutzen"),
                                 detail: String(localized: "Blende das Vorlagenbild in der Kamera ein und richte Horizont und Linien daran aus.")))
            return result
        }

        let percent = Int((rect.height * 100).rounded())
        let position: String
        let detail: String
        switch rect.midX {
        case ..<0.4:
            position = String(localized: "Person links")
            detail = String(localized: "Platziere die Person auf der linken Drittel-Linie, rechts bleibt Raum für die Umgebung.")
        case 0.6...:
            position = String(localized: "Person rechts")
            detail = String(localized: "Platziere die Person auf der rechten Drittel-Linie, links bleibt Raum für die Umgebung.")
        default:
            position = String(localized: "Person mittig")
            detail = String(localized: "Die Person steht genau in der Bildmitte.")
        }
        result.append(Advice(icon: "square.grid.3x3", title: position,
                             detail: detail + " " + String(localized: "Sie füllt ca. \(percent) % der Bildhöhe.")))

        if rect.minY < 0.04 {
            result.append(Advice(icon: "arrow.up.to.line", title: String(localized: "Kaum Platz über dem Kopf"),
                                 detail: String(localized: "Der Kopf ist nah am oberen Bildrand – eng geschnitten.")))
        } else if rect.minY > 0.3 {
            result.append(Advice(icon: "arrow.up.and.down", title: String(localized: "Viel Raum über dem Kopf"),
                                 detail: String(localized: "Viel Himmel oder Umgebung über der Person zeigen – die Person ist eher klein im unteren Bildteil.")))
        }
        if framing == .fullBody, rect.maxY > 0.97 {
            result.append(Advice(icon: "arrow.down.to.line", title: String(localized: "Füße am Bildrand"),
                                 detail: String(localized: "Die Füße sind ganz unten im Bild – aufpassen, dass sie nicht abgeschnitten werden.")))
        }
        return result
    }

    // MARK: Places

    private static let placeCatalog: [(keywords: [String], idea: PlaceIdea)] = [
        (["beach", "sand", "shore", "ocean", "sea", "coast", "wave", "surf"],
         PlaceIdea(title: String(localized: "Strand"), query: String(localized: "Strand"), icon: "beach.umbrella.fill", reason: String(localized: "Strand oder Meer im Bild"))),
        (["lake", "river", "water", "pond", "waterfall", "lakeside"],
         PlaceIdea(title: String(localized: "See oder Fluss"), query: String(localized: "See"), icon: "water.waves", reason: String(localized: "Wasser im Hintergrund"))),
        (["cafe", "coffee", "restaurant", "bakery", "dining", "cup", "tea", "dessert", "food"],
         PlaceIdea(title: String(localized: "Café"), query: String(localized: "Café"), icon: "cup.and.saucer.fill", reason: String(localized: "Café- oder Food-Stimmung"))),
        (["forest", "tree", "wood", "jungle", "woodland"],
         PlaceIdea(title: String(localized: "Wald"), query: String(localized: "Wald"), icon: "tree.fill", reason: String(localized: "Bäume und Natur"))),
        (["flower", "blossom", "garden", "rose", "tulip", "bloom", "sunflower", "lavender", "plant"],
         PlaceIdea(title: String(localized: "Blumen & Gärten"), query: String(localized: "Botanischer Garten"), icon: "camera.macro", reason: String(localized: "Blumen im Bild"))),
        (["grass", "field", "meadow", "wheat", "farm", "hay", "park", "lawn"],
         PlaceIdea(title: String(localized: "Park oder Wiese"), query: String(localized: "Park"), icon: "leaf.fill", reason: String(localized: "Wiese oder Park"))),
        (["street", "road", "city", "building", "architecture", "urban", "alley", "sidewalk", "brick", "cityscape"],
         PlaceIdea(title: String(localized: "Altstadt & Straßen"), query: String(localized: "Altstadt"), icon: "building.2.fill", reason: String(localized: "Stadt-Kulisse"))),
        (["mountain", "hill", "cliff", "rock", "canyon", "valley"],
         PlaceIdea(title: String(localized: "Berge & Aussicht"), query: String(localized: "Aussichtspunkt"), icon: "mountain.2.fill", reason: String(localized: "Berge oder Felsen"))),
        (["snow", "ice", "winter", "ski"],
         PlaceIdea(title: String(localized: "Winterlandschaft"), query: String(localized: "Rodelberg"), icon: "snowflake", reason: String(localized: "Schnee im Bild"))),
        (["bridge"],
         PlaceIdea(title: String(localized: "Brücke"), query: String(localized: "Brücke"), icon: "road.lanes", reason: String(localized: "Brücke im Bild"))),
        (["stairs", "staircase", "steps"],
         PlaceIdea(title: String(localized: "Treppe"), query: String(localized: "Treppe"), icon: "stairs", reason: String(localized: "Treppe im Bild"))),
        (["museum", "gallery", "painting", "sculpture", "statue"],
         PlaceIdea(title: String(localized: "Museum / Galerie"), query: String(localized: "Museum"), icon: "building.columns.fill", reason: String(localized: "Kunst-Kulisse"))),
        (["church", "castle", "palace", "monument", "cathedral", "tower"],
         PlaceIdea(title: String(localized: "Schloss & Historisches"), query: String(localized: "Schloss"), icon: "building.columns", reason: String(localized: "Historisches Gebäude"))),
        (["shop", "store", "boutique", "mall", "shopping"],
         PlaceIdea(title: String(localized: "Shopping-Straße"), query: String(localized: "Einkaufsstraße"), icon: "bag.fill", reason: String(localized: "Shopping-Kulisse"))),
        (["pool", "swimming"],
         PlaceIdea(title: String(localized: "Schwimmbad"), query: String(localized: "Freibad"), icon: "figure.pool.swim", reason: String(localized: "Pool im Bild"))),
        (["graffiti", "mural"],
         PlaceIdea(title: String(localized: "Street Art"), query: String(localized: "Street Art"), icon: "paintbrush.fill", reason: String(localized: "Graffiti / Wandbild"))),
        (["car", "vehicle", "automobile"],
         PlaceIdea(title: String(localized: "Parkhaus-Dach"), query: String(localized: "Parkhaus"), icon: "car.fill", reason: String(localized: "Auto im Bild"))),
        (["sunset", "sunrise", "sky", "cloud", "clouds", "horizon"],
         PlaceIdea(title: String(localized: "Sonnenuntergang-Spot"), query: String(localized: "Aussichtspunkt"), icon: "sun.horizon.fill", reason: String(localized: "Weiter Himmel"))),
        (["bed", "bedroom", "room", "interior", "sofa", "couch", "indoor", "furniture", "mirror", "window", "curtain"],
         PlaceIdea(title: String(localized: "Zuhause"), query: "", icon: "house.fill", reason: String(localized: "Innenraum – kannst du zu Hause nachstellen"))),
    ]

    func placeIdeas() -> [PlaceIdea] {
        var ideas: [PlaceIdea] = []
        for label in sceneLabels {
            let tokens = label.lowercased().split { $0 == "_" || $0 == " " || $0 == "-" }.map(String.init)
            for entry in Self.placeCatalog where !ideas.contains(entry.idea) {
                let matches = entry.keywords.contains { keyword in
                    tokens.contains { $0 == keyword || $0 == keyword + "s" || $0 == keyword + "es" }
                }
                if matches { ideas.append(entry.idea) }
            }
        }
        if ideas.isEmpty {
            ideas = [
                PlaceIdea(title: String(localized: "Park oder Wiese"), query: String(localized: "Park"), icon: "leaf.fill", reason: String(localized: "Allrounder für fast jeden Look")),
                PlaceIdea(title: String(localized: "Altstadt & Straßen"), query: String(localized: "Altstadt"), icon: "building.2.fill", reason: String(localized: "Schöne Fassaden und Gassen")),
            ]
        }
        return Array(ideas.prefix(4))
    }
}
