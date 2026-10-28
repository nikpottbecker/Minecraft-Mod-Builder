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
        folder = documents.appendingPathComponent("Looks", isDirectory: true)
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

    @discardableResult
    func add(image: UIImage, analysis: ShotAnalysis) -> Look {
        let look = Look(id: UUID(), title: Self.defaultTitle(for: analysis), createdAt: Date(),
                        analysis: analysis, bestScore: nil)
        if let data = image.jpegData(compressionQuality: 0.9) {
            try? data.write(to: folder.appendingPathComponent(look.imageFileName), options: .atomic)
        }
        cache.setObject(image, forKey: look.id.uuidString as NSString)
        looks.insert(look, at: 0)
        save()
        return look
    }

    func delete(_ look: Look) {
        try? FileManager.default.removeItem(at: folder.appendingPathComponent(look.imageFileName))
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

    func recordScore(_ score: Double, for id: UUID) {
        guard let index = looks.firstIndex(where: { $0.id == id }), score > (looks[index].bestScore ?? 0) else { return }
        looks[index].bestScore = score
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

    private static func defaultTitle(for analysis: ShotAnalysis) -> String {
        if let place = analysis.places.first { return "\(place.title)-Look" }
        return "Neuer Look"
    }
}
