import Foundation

enum PinterestImportError: LocalizedError {
    case noLink
    case noImageFound
    case downloadFailed

    var errorDescription: String? {
        switch self {
        case .noLink: return String(localized: "Im Text wurde kein Link gefunden. In Pinterest: Teilen → „Link kopieren“.")
        case .noImageFound: return String(localized: "Auf der Pinterest-Seite wurde kein Bild gefunden. Speichere das Bild stattdessen in Fotos und wähle es dort aus.")
        case .downloadFailed: return String(localized: "Das Bild konnte nicht geladen werden. Prüfe deine Internetverbindung.")
        }
    }
}

/// Loads the image behind a Pinterest pin link (pin.it short links and pinterest.* URLs).
enum PinterestImporter {
    private static let userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

    static func firstURL(in text: String) -> URL? {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue) else { return nil }
        let range = NSRange(trimmed.startIndex..., in: trimmed)
        return detector.firstMatch(in: trimmed, options: [], range: range)?.url
    }

    static func loadImageData(from text: String) async throws -> Data {
        guard let url = firstURL(in: text) else { throw PinterestImportError.noLink }

        if isDirectImage(url) {
            return try await download(url)
        }

        var request = URLRequest(url: url)
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        let data: Data
        do {
            let (pageData, _) = try await URLSession.shared.data(for: request)
            data = pageData
        } catch {
            throw PinterestImportError.downloadFailed
        }
        let html = String(decoding: data, as: UTF8.self)
        let candidates = imageCandidates(in: html)
        guard !candidates.isEmpty else { throw PinterestImportError.noImageFound }

        for candidate in candidates {
            if let data = try? await download(candidate) { return data }
        }
        throw PinterestImportError.downloadFailed
    }

    private static func isDirectImage(_ url: URL) -> Bool {
        let ext = url.pathExtension.lowercased()
        return ["jpg", "jpeg", "png", "webp", "heic"].contains(ext) || (url.host ?? "").contains("pinimg.com")
    }

    /// Image URLs in order of preference: highest resolution first.
    static func imageCandidates(in html: String) -> [URL] {
        var found: [String] = []
        let patterns = [
            #"<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']"#,
            #"<meta[^>]+content=["']([^"']+)["'][^>]*property=["']og:image["']"#,
            #"(https://i\.pinimg\.com/[^"'\s\\]+?\.(?:jpg|jpeg|png|webp))"#,
        ]
        for pattern in patterns {
            guard let regex = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { continue }
            let range = NSRange(html.startIndex..., in: html)
            for match in regex.matches(in: html, options: [], range: range) {
                guard let r = Range(match.range(at: 1), in: html) else { continue }
                let value = String(html[r]).replacingOccurrences(of: "&amp;", with: "&")
                if !found.contains(value) { found.append(value) }
            }
        }

        var urls: [URL] = []
        for value in found {
            // Pinterest serves sizes like /236x/, /474x/, /736x/ – try the original first.
            if let sizeRange = value.range(of: #"/\d+x/"#, options: .regularExpression) {
                let original = value.replacingCharacters(in: sizeRange, with: "/originals/")
                let large = value.replacingCharacters(in: sizeRange, with: "/736x/")
                for candidate in [original, large] {
                    if let url = URL(string: candidate), !urls.contains(url) { urls.append(url) }
                }
            }
            if let url = URL(string: value), !urls.contains(url) { urls.append(url) }
        }
        return urls
    }

    private static func download(_ url: URL) async throws -> Data {
        var request = URLRequest(url: url)
        request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode), data.count > 1000 else {
            throw PinterestImportError.downloadFailed
        }
        return data
    }
}
