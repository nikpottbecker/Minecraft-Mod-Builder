import SwiftUI

@main
struct PinPoseApp: App {
    @StateObject private var store = LookStore()
    @StateObject private var reminders = Reminders.shared

    init() {
        // The notification delegate has to exist before a tapped reminder is delivered.
        _ = Reminders.shared
        ScreenshotMode.prepareDefaults()
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .environmentObject(reminders)
        }
    }
}
