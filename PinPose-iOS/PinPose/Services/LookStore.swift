import Foundation
import UIKit

/// Saves looks as JSON plus one JPEG per look in the app's Documents folder.
@MainActor
final class LookStore: ObservableObject {
    @Published private(set) var looks: [Look] = []

    private let folder: URL
    private let cache = NSCache<NSString, UIImage>()
    private var indexURL: URL { folder.appendingPathComponent("looks.json") }

    init() {
        let documents = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        if ScreenshotMode.current != nil {
            // Fresh sample library on every screenshot run.
            folder = documents.appendingPathComponent("ScreenshotLooks", isDirectory: true)
            try? FileManager.default.removeItem(at: folder)
        } else {
            folder = documents.appendingPathComponent("Looks", isDirectory: true)
        }
        try? FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
        load()
    }

    func look(id: UUID) -> Look? {
        looks.first { $0.id == id }
    }

    func image(for look: Look) -> UIImage? {
        let key = look.id.uuidString as NSString
        if let cached = cache.object(forKey: key) { return cached }
        guard let image = UIImage(contentsOfFile: folder.appendingPathComponent(look.imageFileName).path) else { return nil }
        cache.setObject(image, forKey: key)
        return image
    }

    /// The cut-out person of the reference, if one was created on import.
    func silhouette(for look: Look) -> UIImage? {
        let key = "\(look.id.uuidString)-mask" as NSString
        if let cached = cache.object(forKey: key) { return cached }
        guard let image = UIImage(contentsOfFile: folder.appendingPathComponent(Self.silhouetteFileName(for: look.id)).path) else { return nil }
        cache.setObject(image, forKey: key)
        return image
    }

    @discardableResult
    func add(image: UIImage, analysis: ShotAnalysis, silhouette: UIImage? = nil, title: String? = nil) -> Look {
        let look = Look(id: UUID(), title: title ?? Self.defaultTitle(for: analysis), createdAt: Date(),
                        analysis: analysis, bestScore: nil)
        if let data = image.jpegData(compressionQuality: 0.9) {
            try? data.write(to: folder.appendingPathComponent(look.imageFileName), options: .atomic)
        }
        if let silhouette, let data = silhouette.pngData() {
            try? data.write(to: folder.appendingPathComponent(Self.silhouetteFileName(for: look.id)), options: .atomic)
        }
        cache.setObject(image, forKey: look.id.uuidString as NSString)
        looks.insert(look, at: 0)
        save()
        return look
    }

    /// Keeps a photo the user took for this look (a smaller copy; the original is in Fotos).
    @discardableResult
    func addShot(_ image: UIImage, score: Double?, for id: UUID) -> Shot? {
        guard let index = looks.firstIndex(where: { $0.id == id }) else { return nil }
        let shot = Shot(id: UUID(), createdAt: Date(), score: score)
        let stored = image.uprightResized(maxSide: 1600)
        if let data = stored.jpegData(compressionQuality: 0.85) {
            try? data.write(to: folder.appendingPathComponent(Self.shotFileName(shot.id)), options: .atomic)
        }
        cache.setObject(stored, forKey: shot.id.uuidString as NSString)
        looks[index].savedShots = [shot] + looks[index].shots
        if let score, score > (looks[index].bestScore ?? 0) { looks[index].bestScore = score }
        save()
        return shot
    }

    func image(for shot: Shot) -> UIImage? {
        let key = shot.id.uuidString as NSString
        if let cached = cache.object(forKey: key) { return cached }
        guard let image = UIImage(contentsOfFile: folder.appendingPathComponent(Self.shotFileName(shot.id)).path) else { return nil }
        cache.setObject(image, forKey: key)
        return image
    }

    func deleteShot(_ shot: Shot, from id: UUID) {
        guard let index = looks.firstIndex(where: { $0.id == id }) else { return }
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(Self.shotFileName(shot.id)))
        cache.removeObject(forKey: shot.id.uuidString as NSString)
        looks[index].savedShots = looks[index].shots.filter { $0.id != shot.id }
        looks[index].bestScore = looks[index].shots.compactMap(\.score).max()
        save()
    }

    @discardableResult
    func add(idea: PoseIdea) -> Look {
        add(image: idea.referenceImage(), analysis: idea.analysis(), silhouette: idea.silhouette(), title: idea.title)
    }

    func delete(_ look: Look) {
        for shot in look.shots {
            try? FileManager.default.removeItem(at: folder.appendingPathComponent(Self.shotFileName(shot.id)))
        }
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(look.imageFileName))
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(Self.silhouetteFileName(for: look.id)))
        cache.removeObject(forKey: look.id.uuidString as NSString)
        looks.removeAll { $0.id == look.id }
        save()
    }

    func rename(_ id: UUID, to title: String) {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, let index = looks.firstIndex(where: { $0.id == id }) else { return }
        looks[index].title = trimmed
        save()
    }

    private func load() {
        guard let data = try? Data(contentsOf: indexURL),
              let decoded = try? JSONDecoder().decode([Look].self, from: data) else { return }
        looks = decoded
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(looks) else { return }
        try? data.write(to: indexURL, options: .atomic)
    }

    private static func shotFileName(_ id: UUID) -> String {
        "shot-\(id.uuidString).jpg"
    }

    private static func silhouetteFileName(for id: UUID) -> String {
        "\(id.uuidString)-mask.png"
    }

    private static func defaultTitle(for analysis: ShotAnalysis) -> String {
        if let place = analysis.places.first { return "\(place.title)-Look" }
        return "Neuer Look"
    }
}
