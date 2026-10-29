import CoreLocation
import SwiftUI

/// Today's golden hour and blue hour at the user's location.
struct SunTimesCard: View {
    /// Highlights the evening golden hour when the reference was shot in it.
    var highlightGoldenHour = false
    /// When set, the card offers a golden hour reminder for this look.
    var look: Look?

    @StateObject private var locator = PlaceFinder()
    @EnvironmentObject private var reminders: Reminders
    @State private var reminderNote: String?
    @State private var reminderFailed = false

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Icon3DView(.sun, size: 30)
                Text("Licht heute bei dir").font(.title3.bold())
            }

            Group {
                if let location = locator.userLocation,
                   let times = SunCalculator.sunTimes(on: Date(), latitude: location.coordinate.latitude,
                                                      longitude: location.coordinate.longitude) {
                    VStack(spacing: 8) {
                        row(icon: "sunrise.fill", title: String(localized: "Golden Hour morgens"), interval: times.morningGoldenHour)
                        row(icon: "sunset.fill", title: String(localized: "Golden Hour abends"), interval: times.eveningGoldenHour,
                            highlighted: highlightGoldenHour)
                        row(icon: "moon.haze.fill", title: String(localized: "Blaue Stunde"), interval: times.eveningBlueHour)
                        if let look {
                            Divider()
                            reminderButton(for: look, location: location.coordinate)
                        }
                    }
                } else if locator.locationDenied {
                    Text("Erlaube den Standortzugriff, um die Golden Hour für deinen Ort zu berechnen.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else if locator.userLocation != nil {
                    Text("An deinem Ort geht die Sonne heute nicht auf oder unter.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                } else {
                    Button {
                        locator.locate()
                    } label: {
                        Label("Golden Hour für meinen Ort berechnen", systemImage: "location.fill")
                    }
                }
            }
            .padding(12)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    @ViewBuilder
    private func reminderButton(for look: Look, location: CLLocationCoordinate2D) -> some View {
        if reminders.scheduled.contains(look.id) {
            HStack {
                Label(reminderNote ?? String(localized: "Erinnerung ist gestellt"), systemImage: "bell.badge.fill")
                    .font(.subheadline.bold())
                    .foregroundStyle(Color.accentColor)
                Spacer()
                Button("Aus") { reminders.cancel(lookID: look.id); reminderNote = nil }
                    .font(.subheadline)
            }
        } else {
            Button {
                Task {
                    if let start = await reminders.remind(lookID: look.id, title: look.title,
                                                          latitude: location.latitude, longitude: location.longitude) {
                        let time = start.addingTimeInterval(-Reminders.leadTime).formatted(date: .omitted, time: .shortened)
                        reminderNote = Calendar.current.isDateInToday(start)
                            ? String(localized: "Erinnerung heute um \(time)")
                            : String(localized: "Erinnerung morgen um \(time)")
                        reminderFailed = false
                    } else {
                        reminderNote = nil
                        reminderFailed = true
                    }
                }
            } label: {
                VStack(alignment: .leading, spacing: 2) {
                    Label("30 Min vor der Golden Hour erinnern", systemImage: "bell")
                        .font(.subheadline.bold())
                    if reminderFailed {
                        Text("Erlaube Mitteilungen für PinPose in den Einstellungen.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private func row(icon: String, title: String, interval: DateInterval, highlighted: Bool = false) -> some View {
        HStack {
            Image(systemName: icon)
                .foregroundStyle(Color.orange)
                .frame(width: 24)
            Text(title)
                .font(.subheadline.weight(highlighted ? .bold : .regular))
            if highlighted {
                Text("wie im Bild")
                    .font(.caption2.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Color.accentColor, in: Capsule())
            }
            Spacer()
            Text("\(interval.start.formatted(date: .omitted, time: .shortened)) – \(interval.end.formatted(date: .omitted, time: .shortened))")
                .font(.subheadline.monospacedDigit())
                .foregroundStyle(.secondary)
        }
    }
}
