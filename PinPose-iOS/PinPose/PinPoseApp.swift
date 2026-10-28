import SwiftUI

@main
struct PinPoseApp: App {
    @StateObject private var store = LookStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
        }
    }
}
