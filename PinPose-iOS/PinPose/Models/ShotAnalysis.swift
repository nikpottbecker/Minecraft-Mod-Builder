import CoreLocation
import Foundation
import ImageIO

/// One piece of advice shown as a card.
struct Advice: Codable, Hashable, Identifiable {
    var id = UUID()
    var icon: String
    var title: String
    var detail: String
}

/// A kind of location that fits the photo, searchable on the map.
struct PlaceIdea: Codable, Hashable, Identifiable {
    var title: String
    /// Apple Maps search query. Empty when the look works at home.
    var query: String
    var icon: String
    var reason: String

    var id: String { title }
}

/// Camera metadata, when the image still carries it (Pinterest usually strips it).
struct ExifInfo: Codable, Hashable {
    var focalLength35: Double?
    var fNumber: Double?
    var exposureTime: Double?
    var iso: Int?
    var deviceModel: String?
    var lensModel: String?
    var latitude: Double?
    var longitude: Double?

    var coordinate: CLLocationCoordinate2D? {
        guard let latitude, let longitude else { return nil }
        return CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    var hasCameraValues: Bool { fNumber != nil || exposureTime != nil || iso != nil || focalLength35 != nil }

    var summary: String {
        var parts: [String] = []
        if let deviceModel { parts.append(deviceModel) }
        if let focalLength35 { parts.append("\(Int(focalLength35)) mm") }
        if let fNumber { parts.append(String(format: "f/%.1f", fNumber)) }
        if let exposureTime {
            parts.append(exposureTime >= 1 ? String(format: "%.1f s", exposureTime) : "1/\(Int((1 / exposureTime).rounded())) s")
        }
        if let iso { parts.append("ISO \(iso)") }
        return parts.joined(separator: " · ")
    }

    static func read(from data: Data) -> ExifInfo? {
        guard let source = CGImageSourceCreateWithData(data as CFData, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any] else { return nil }
        var info = ExifInfo()
        if let exif = props[kCGImagePropertyExifDictionary] as? [CFString: Any] {
            info.focalLength35 = (exif[kCGImagePropertyExifFocalLenIn35mmFilm] as? NSNumber)?.doubleValue
            info.fNumber = (exif[kCGImagePropertyExifFNumber] as? NSNumber)?.doubleValue
            info.exposureTime = (exif[kCGImagePropertyExifExposureTime] as? NSNumber)?.doubleValue
            info.iso = (exif[kCGImagePropertyExifISOSpeedRatings] as? [NSNumber])?.first?.intValue
            info.lensModel = exif[kCGImagePropertyExifLensModel] as? String
        }
        if let tiff = props[kCGImagePropertyTIFFDictionary] as? [CFString: Any] {
            info.deviceModel = tiff[kCGImagePropertyTIFFModel] as? String
        }
        if let gps = props[kCGImagePropertyGPSDictionary] as? [CFString: Any],
           let lat = (gps[kCGImagePropertyGPSLatitude] as? NSNumber)?.doubleValue,
           let lon = (gps[kCGImagePropertyGPSLongitude] as? NSNumber)?.doubleValue {
            let latRef = gps[kCGImagePropertyGPSLatitudeRef] as? String ?? "N"
            let lonRef = gps[kCGImagePropertyGPSLongitudeRef] as? String ?? "E"
            info.latitude = latRef == "S" ? -lat : lat
            info.longitude = lonRef == "W" ? -lon : lon
        }
        let isEmpty = !info.hasCameraValues && info.deviceModel == nil && info.coordinate == nil
        return isEmpty ? nil : info
    }
}

/// Everything the app worked out about a reference photo.
struct ShotAnalysis: Codable {
    var imageWidth: Double
    var imageHeight: Double
    var pose: BodyPose?
    var framing: Framing?
    var poseAdvice: [Advice]
    var cameraAdvice: [Advice]
    var lightAdvice: [Advice]
    var compositionAdvice: [Advice]
    var places: [PlaceIdea]
    var sceneLabels: [String]
    var exif: ExifInfo?
    var recommendedZoom: Double
    var recommendedExposureBias: Float

    var aspect: CGFloat { CGFloat(imageWidth / max(imageHeight, 1)) }
    var imageSize: CGSize { CGSize(width: imageWidth, height: imageHeight) }
}

/// A saved reference photo plus its analysis.
struct Look: Codable, Identifiable {
    var id: UUID
    var title: String
    var createdAt: Date
    var analysis: ShotAnalysis
    var bestScore: Double?

    var imageFileName: String { "\(id.uuidString).jpg" }
}
