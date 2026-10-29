import UIKit

/// Debug-only launch mode for automated App Store / review screenshots:
/// `-PinPoseScreenshot library|detail|ideas|compare|about|onboarding|empty`.
/// Uses its own folder with sample looks, so a real library is never touched.
enum ScreenshotMode: String {
    case onboarding, empty, library, detail, ideas, compare, about

    static let current: ScreenshotMode? = {
        #if DEBUG
        let args = ProcessInfo.processInfo.arguments
        guard let index = args.firstIndex(of: "-PinPoseScreenshot"), index + 1 < args.count else { return nil }
        return ScreenshotMode(rawValue: args[index + 1])
        #else
        return nil
        #endif
    }()

    /// Called once at launch, before any view reads its settings.
    static func prepareDefaults() {
        guard let mode = current else { return }
        UserDefaults.standard.set(mode != .onboarding, forKey: "onboardingDone")
        UserDefaults.standard.set(UIPasteboard.general.changeCount, forKey: "dismissedClipboardChange")
    }

    /// Fills an empty store with sample looks made from the built-in pose ideas.
    @MainActor
    static func seed(_ store: LookStore) {
        guard let mode = current, mode != .empty, mode != .onboarding, store.looks.isEmpty else { return }
        let picks = ["walk", "sit", "hair", "hip"]
        let scores: [String: Double?] = ["hip": 0.92, "hair": 0.81, "sit": nil, "walk": nil]
        for id in picks {
            guard let idea = PoseIdea.all.first(where: { $0.id == id }) else { continue }
            let look = store.add(idea: idea)
            if let score = scores[id] ?? nil {
                store.addShot(idea.referenceImage(), score: score, for: look.id)
            }
        }
    }
}
