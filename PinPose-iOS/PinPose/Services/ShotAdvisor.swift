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
            result.append(Advice(icon: "plus.magnifyingglass", title: "Zoom: \(zoomText)",
                                 detail: "Original-Brennweite ca. \(Int(focal)) mm (Kleinbild) – entspricht am iPhone etwa \(zoomText)."))
        } else {
            let reason: String
            switch framing {
            case .none: reason = "Starte mit \(zoomText) und vergleiche mit der Vorlage."
            case .some(.portrait): reason = "Für ein Porträt wirkt \(zoomText) natürlicher – keine verzerrte Nase, schöner Hintergrund."
            case .some(.waist): reason = "Halbnah mit \(zoomText): Die Proportionen bleiben natürlich."
            case .some(.knees): reason = "Mit \(zoomText) passt der Ausschnitt bis zu den Knien."
            case .some(.fullBody): reason = "Ganzkörper mit \(zoomText) – lieber ein paar Schritte zurückgehen statt digital zu zoomen."
            }
            result.append(Advice(icon: "plus.magnifyingglass", title: "Zoom: \(zoomText)", detail: reason))
        }

        if hasStrongBlur {
            result.append(Advice(icon: "camera.aperture", title: "Porträtmodus (f/1.8–2.2)",
                                 detail: "Der Hintergrund ist stark unscharf. Porträtmodus an, Tiefe auf ca. f/2 stellen. Mindestens 3 m Abstand zwischen Person und Hintergrund."))
        } else if hasBlurryBackground {
            result.append(Advice(icon: "camera.aperture", title: "Leichte Unschärfe (f/2.8–4)",
                                 detail: "Porträtmodus mit Tiefe ca. f/2.8–4 – oder einfach mehr Abstand zum Hintergrund und 2× Zoom."))
        } else {
            result.append(Advice(icon: "camera", title: "Normaler Fotomodus",
                                 detail: "Alles ist scharf – kein Porträtmodus nötig. Live Photo kann aus bleiben."))
        }

        result.append(cameraHeightAdvice())

        let (ratioLabel, isPortrait) = Self.aspectLabel(imageSize)
        let extra = ratioLabel == "2:3" ? " (das typische Pinterest-Format)" : ""
        result.append(Advice(icon: isPortrait ? "rectangle.portrait" : "rectangle",
                             title: "Format \(ratioLabel)",
                             detail: "Fotografiere im \(isPortrait ? "Hochformat" : "Querformat") und schneide danach auf \(ratioLabel) zu\(extra)."))

        let bias = recommendedExposureBias()
        if abs(bias) < 0.05 {
            result.append(Advice(icon: "sun.max", title: "Belichtung ±0",
                                 detail: "Tippe auf das Gesicht – damit sitzen Fokus und Belichtung auf der Person."))
        } else {
            let direction = bias < 0 ? "nach unten" : "nach oben"
            result.append(Advice(icon: "sun.max", title: String(format: "Belichtung %+.1f", bias),
                                 detail: "Tippe auf das Gesicht und zieh den Sonnen-Regler \(direction) (ca. \(String(format: "%+.1f", bias)) EV). In der PinPose-Kamera ist das schon voreingestellt."))
        }

        if let exif, exif.hasCameraValues {
            result.append(Advice(icon: "info.circle", title: "Originale Kameradaten", detail: exif.summary))
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
                    return Advice(icon: "arrow.up.forward.circle", title: "Kamera tief halten",
                                  detail: "Kamera auf Hüft- oder Kniehöhe, leicht nach oben neigen – das macht lange Beine. Person steht nah am unteren Bildrand.")
                }
                if ratio < 1.45 {
                    return Advice(icon: "arrow.down.forward.circle", title: "Kamera erhöht",
                                  detail: "Kamera etwas über Augenhöhe halten und leicht nach unten neigen.")
                }
            }
        }
        return Advice(icon: "camera.viewfinder", title: "Kamera auf Brusthöhe",
                      detail: "Halte die Kamera etwa auf Brust- bis Augenhöhe der Person und gerade (Raster nutzen).")
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
            result.append(Advice(icon: "lightbulb.fill", title: "Warmes Kunstlicht",
                                 detail: "Abends oder drinnen mit Lichterkette, Kerzen oder Lampen. Belichtung runter, Handy ruhig halten."))
        } else if lum < 0.25 {
            result.append(Advice(icon: "moon.stars.fill", title: "Abend / Blaue Stunde",
                                 detail: "Kurz nach Sonnenuntergang. Nachtmodus oder Blitz verwenden."))
        } else if warmth > 0.08 && lum < 0.65 {
            result.append(Advice(icon: "sun.horizon.fill", title: "Golden Hour",
                                 detail: "Ca. 1 Stunde vor Sonnenuntergang (oder nach Sonnenaufgang). Die tiefe Sonne gibt warmes, weiches Licht."))
        } else if stats.contrast > 0.26 && lum > 0.45 {
            result.append(Advice(icon: "sun.max.fill", title: "Direkte Sonne",
                                 detail: "Tagsüber bei Sonnenschein, harte Schatten. Achte auf Schatten im Gesicht – Sonnenbrille oder Hut helfen."))
        } else if stats.contrast < 0.17 {
            result.append(Advice(icon: "cloud.sun.fill", title: "Weiches Licht",
                                 detail: "Bewölkter Himmel oder Schatten unter Bäumen/Gebäuden – gleichmäßig und schmeichelhaft."))
        } else {
            result.append(Advice(icon: "sun.min.fill", title: "Tageslicht",
                                 detail: "Normales Tageslicht. Am schönsten, wenn das Licht schräg von vorne kommt (z. B. Fenster neben der Kamera)."))
        }

        if isBacklit {
            result.append(Advice(icon: "sun.haze.fill", title: "Gegenlicht",
                                 detail: "Die Lichtquelle ist hinter der Person. Stell dich mit dem Rücken zur Sonne und tippe zum Belichten auf das Gesicht."))
        } else if stats.subjectLuminance - stats.backgroundLuminance > 0.22 && stats.backgroundLuminance < 0.3 {
            result.append(Advice(icon: "bolt.fill", title: "Blitz-Look",
                                 detail: "Die Person ist viel heller als der dunkle Hintergrund – typischer Blitz-Look. In der Kamera den Blitz anschalten."))
        }

        let tone = warmth > 0.08 ? "warm" : (warmth < -0.04 ? "kühl" : "neutral")
        let saturation = stats.saturation < 0.18 ? "entsättigt" : (stats.saturation > 0.45 ? "kräftige Farben" : "natürliche Farben")
        let brightness = lum > 0.6 ? "hell & airy" : (lum < 0.35 ? "dunkel & moody" : "ausgewogen")

        func clamp(_ value: Double, _ low: Double, _ high: Double) -> Int { Int(max(low, min(high, value)).rounded()) }
        func signed(_ value: Int) -> String { value > 0 ? "+\(value)" : "\(value)" }
        let edits = [
            "Belichtung \(signed(clamp((lum - 0.5) * 100, -40, 40)))",
            "Kontrast \(signed(clamp((stats.contrast - 0.22) * 200, -40, 40)))",
            "Sättigung \(signed(clamp((stats.saturation - 0.3) * 100, -50, 30)))",
            "Wärme \(signed(clamp(warmth * 200, -40, 40)))",
        ]
        result.append(Advice(icon: "paintpalette.fill", title: "Farblook: \(tone), \(saturation), \(brightness)",
                             detail: "Nachbearbeitung in der Fotos-App (Bearbeiten → Anpassen): " + edits.joined(separator: ", ") + "."))
        return result
    }

    // MARK: Composition

    func compositionAdvice() -> [Advice] {
        var result: [Advice] = []
        if let framing {
            result.append(Advice(icon: "person.crop.rectangle", title: "Ausschnitt: \(framing.label)", detail: framing.detail))
        }
        guard let rect = subjectRect else {
            result.append(Advice(icon: "square.grid.3x3", title: "Raster nutzen",
                                 detail: "Blende das Vorlagenbild in der Kamera ein und richte Horizont und Linien daran aus."))
            return result
        }

        let percent = Int((rect.height * 100).rounded())
        let position: String
        let detail: String
        switch rect.midX {
        case ..<0.4:
            position = "Person links"
            detail = "Platziere die Person auf der linken Drittel-Linie, rechts bleibt Raum für die Umgebung."
        case 0.6...:
            position = "Person rechts"
            detail = "Platziere die Person auf der rechten Drittel-Linie, links bleibt Raum für die Umgebung."
        default:
            position = "Person mittig"
            detail = "Die Person steht genau in der Bildmitte."
        }
        result.append(Advice(icon: "square.grid.3x3", title: position,
                             detail: detail + " Sie füllt ca. \(percent) % der Bildhöhe."))

        if rect.minY < 0.04 {
            result.append(Advice(icon: "arrow.up.to.line", title: "Kaum Platz über dem Kopf",
                                 detail: "Der Kopf ist nah am oberen Bildrand – eng geschnitten."))
        } else if rect.minY > 0.3 {
            result.append(Advice(icon: "arrow.up.and.down", title: "Viel Raum über dem Kopf",
                                 detail: "Viel Himmel oder Umgebung über der Person zeigen – die Person ist eher klein im unteren Bildteil."))
        }
        if framing == .fullBody, rect.maxY > 0.97 {
            result.append(Advice(icon: "arrow.down.to.line", title: "Füße am Bildrand",
                                 detail: "Die Füße sind ganz unten im Bild – aufpassen, dass sie nicht abgeschnitten werden."))
        }
        return result
    }

    // MARK: Places

    private static let placeCatalog: [(keywords: [String], idea: PlaceIdea)] = [
        (["beach", "sand", "shore", "ocean", "sea", "coast", "wave", "surf"],
         PlaceIdea(title: "Strand", query: "Strand", icon: "beach.umbrella.fill", reason: "Strand oder Meer im Bild")),
        (["lake", "river", "water", "pond", "waterfall", "lakeside"],
         PlaceIdea(title: "See oder Fluss", query: "See", icon: "water.waves", reason: "Wasser im Hintergrund")),
        (["cafe", "coffee", "restaurant", "bakery", "dining", "cup", "tea", "dessert", "food"],
         PlaceIdea(title: "Café", query: "Café", icon: "cup.and.saucer.fill", reason: "Café- oder Food-Stimmung")),
        (["forest", "tree", "wood", "jungle", "woodland"],
         PlaceIdea(title: "Wald", query: "Wald", icon: "tree.fill", reason: "Bäume und Natur")),
        (["flower", "blossom", "garden", "rose", "tulip", "bloom", "sunflower", "lavender", "plant"],
         PlaceIdea(title: "Blumen & Gärten", query: "Botanischer Garten", icon: "camera.macro", reason: "Blumen im Bild")),
        (["grass", "field", "meadow", "wheat", "farm", "hay", "park", "lawn"],
         PlaceIdea(title: "Park oder Wiese", query: "Park", icon: "leaf.fill", reason: "Wiese oder Park")),
        (["street", "road", "city", "building", "architecture", "urban", "alley", "sidewalk", "brick", "cityscape"],
         PlaceIdea(title: "Altstadt & Straßen", query: "Altstadt", icon: "building.2.fill", reason: "Stadt-Kulisse")),
        (["mountain", "hill", "cliff", "rock", "canyon", "valley"],
         PlaceIdea(title: "Berge & Aussicht", query: "Aussichtspunkt", icon: "mountain.2.fill", reason: "Berge oder Felsen")),
        (["snow", "ice", "winter", "ski"],
         PlaceIdea(title: "Winterlandschaft", query: "Rodelberg", icon: "snowflake", reason: "Schnee im Bild")),
        (["bridge"],
         PlaceIdea(title: "Brücke", query: "Brücke", icon: "road.lanes", reason: "Brücke im Bild")),
        (["stairs", "staircase", "steps"],
         PlaceIdea(title: "Treppe", query: "Treppe", icon: "stairs", reason: "Treppe im Bild")),
        (["museum", "gallery", "painting", "sculpture", "statue"],
         PlaceIdea(title: "Museum / Galerie", query: "Museum", icon: "building.columns.fill", reason: "Kunst-Kulisse")),
        (["church", "castle", "palace", "monument", "cathedral", "tower"],
         PlaceIdea(title: "Schloss & Historisches", query: "Schloss", icon: "building.columns", reason: "Historisches Gebäude")),
        (["shop", "store", "boutique", "mall", "shopping"],
         PlaceIdea(title: "Shopping-Straße", query: "Einkaufsstraße", icon: "bag.fill", reason: "Shopping-Kulisse")),
        (["pool", "swimming"],
         PlaceIdea(title: "Schwimmbad", query: "Freibad", icon: "figure.pool.swim", reason: "Pool im Bild")),
        (["graffiti", "mural"],
         PlaceIdea(title: "Street Art", query: "Street Art", icon: "paintbrush.fill", reason: "Graffiti / Wandbild")),
        (["car", "vehicle", "automobile"],
         PlaceIdea(title: "Parkhaus-Dach", query: "Parkhaus", icon: "car.fill", reason: "Auto im Bild")),
        (["sunset", "sunrise", "sky", "cloud", "clouds", "horizon"],
         PlaceIdea(title: "Sonnenuntergang-Spot", query: "Aussichtspunkt", icon: "sun.horizon.fill", reason: "Weiter Himmel")),
        (["bed", "bedroom", "room", "interior", "sofa", "couch", "indoor", "furniture", "mirror", "window", "curtain"],
         PlaceIdea(title: "Zuhause", query: "", icon: "house.fill", reason: "Innenraum – kannst du zu Hause nachstellen")),
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
                PlaceIdea(title: "Park oder Wiese", query: "Park", icon: "leaf.fill", reason: "Allrounder für fast jeden Look"),
                PlaceIdea(title: "Altstadt & Straßen", query: "Altstadt", icon: "building.2.fill", reason: "Schöne Fassaden und Gassen"),
            ]
        }
        return Array(ideas.prefix(4))
    }
}
