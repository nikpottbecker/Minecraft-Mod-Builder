import StoreKit
import SwiftUI

/// Info screen: how it works, privacy, and resetting hints.
struct AboutView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.requestReview) private var requestReview
    @AppStorage("onboardingDone") private var onboardingDone = true
    @EnvironmentObject private var store: LookStore

    private var version: String {
        let info = Bundle.main.infoDictionary
        let short = info?["CFBundleShortVersionString"] as? String ?? "1.0"
        let build = info?["CFBundleVersion"] as? String ?? "1"
        return "\(short) (\(build))"
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    statRow(String(localized: "Looks"), value: store.looks.count, icon: "square.grid.2x2")
                    statRow(String(localized: "Nachgeshootet"), value: store.looks.filter(\.isRecreated).count, icon: "checkmark.seal")
                    statRow(String(localized: "Fotos"), value: store.looks.reduce(0) { $0 + $1.shots.count }, icon: "photo.stack")
                    if let best = store.looks.compactMap(\.bestScore).max() {
                        HStack {
                            Label {
                                Text("Bester Pose-Match")
                            } icon: {
                                Icon3DView(.trophy, size: 26)
                            }
                            Spacer()
                            ScoreBadge(score: best, compact: true)
                        }
                    }
                } header: {
                    Text("Dein Fortschritt")
                }

                Section {
                    Button {
                        dismiss()
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) { onboardingDone = false }
                    } label: {
                        Label("Einführung nochmal ansehen", systemImage: "sparkles")
                    }
                    Button {
                        requestReview()
                    } label: {
                        Label("PinPose bewerten", systemImage: "star")
                    }
                } header: {
                    Text("PinPose")
                }

                Section {
                    Label("Bilder, Analysen und deine Fotos bleiben auf deinem iPhone.", systemImage: "iphone")
                    Label("Kein Konto, keine Werbung, kein Tracking.", systemImage: "hand.raised.fill")
                    Label("Pinterest-Links werden nur geladen, um das Bild zu holen.", systemImage: "link")
                    Label("Standort nur für Golden Hour und Orte in der Nähe – er wird nicht gespeichert.", systemImage: "location")
                } header: {
                    Text("Datenschutz")
                }
                .font(.subheadline)

                Section {
                    Text("Bitte teile nachgeshootete Fotos nur, wenn du die Rechte an der Vorlage hast oder sie als Inspiration kennzeichnest.")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                } header: {
                    Text("Fair bleiben")
                }

                Section {
                    Text("3D-Icons: 3dicons.co von realvjy (CC0)")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(version).foregroundStyle(.secondary).monospacedDigit()
                    }
                }
            }
            .navigationTitle("Über PinPose")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Fertig") { dismiss() }
                }
            }
        }
    }

    private func statRow(_ title: String, value: Int, icon: String) -> some View {
        HStack {
            Label(title, systemImage: icon)
            Spacer()
            Text("\(value)").foregroundStyle(.secondary).monospacedDigit()
        }
    }
}
