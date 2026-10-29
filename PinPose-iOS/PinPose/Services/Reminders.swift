import Foundation
import UserNotifications

/// Local "golden hour soon" reminders for a look. Nothing leaves the device.
@MainActor
final class Reminders: NSObject, ObservableObject {
    static let shared = Reminders()

    /// Set when the user taps a reminder; the library opens that look.
    @Published var lookToOpen: UUID?
    /// Looks that have a pending reminder.
    @Published private(set) var scheduled: Set<UUID> = []

    nonisolated static let leadTime: TimeInterval = 30 * 60
    private let center = UNUserNotificationCenter.current()

    override private init() {
        super.init()
        center.delegate = self
        Task { await refresh() }
    }

    func refresh() async {
        let requests = await center.pendingNotificationRequests()
        scheduled = Set(requests.compactMap { UUID(uuidString: $0.identifier) })
    }

    /// The next evening golden hour start that is still at least the lead time away.
    nonisolated static func nextGoldenHour(after now: Date, latitude: Double, longitude: Double) -> Date? {
        for dayOffset in 0..<3 {
            guard let day = Calendar.current.date(byAdding: .day, value: dayOffset, to: now),
                  let times = SunCalculator.sunTimes(on: day, latitude: latitude, longitude: longitude) else { continue }
            let start = times.eveningGoldenHour.start
            if start.addingTimeInterval(-leadTime) > now { return start }
        }
        return nil
    }

    /// Asks for permission on first use. Returns the golden hour start it reminds about, or nil.
    func remind(lookID: UUID, title: String, latitude: Double, longitude: Double) async -> Date? {
        let granted = (try? await center.requestAuthorization(options: [.alert, .sound])) ?? false
        guard granted, let start = Self.nextGoldenHour(after: Date(), latitude: latitude, longitude: longitude) else { return nil }

        let content = UNMutableNotificationContent()
        content.title = String(localized: "Golden Hour in 30 Minuten ☀️")
        content.body = String(localized: "Perfektes Licht für „\(title)“. Schnapp dir dein iPhone und los!")
        content.sound = .default
        content.userInfo = ["lookID": lookID.uuidString]

        let fireDate = start.addingTimeInterval(-Self.leadTime)
        let components = Calendar.current.dateComponents([.year, .month, .day, .hour, .minute], from: fireDate)
        let request = UNNotificationRequest(identifier: lookID.uuidString, content: content,
                                            trigger: UNCalendarNotificationTrigger(dateMatching: components, repeats: false))
        do {
            try await center.add(request)
        } catch {
            return nil
        }
        scheduled.insert(lookID)
        return start
    }

    func cancel(lookID: UUID) {
        center.removePendingNotificationRequests(withIdentifiers: [lookID.uuidString])
        scheduled.remove(lookID)
    }
}

extension Reminders: UNUserNotificationCenterDelegate {
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                            withCompletionHandler completionHandler: @escaping () -> Void) {
        let id = (response.notification.request.content.userInfo["lookID"] as? String).flatMap(UUID.init(uuidString:))
        Task { @MainActor in
            self.lookToOpen = id
            await self.refresh()
            completionHandler()
        }
    }

    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}
