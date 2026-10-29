import PhotosUI
import SwiftUI

struct ImportView: View {
    @EnvironmentObject private var store: LookStore
    @Environment(\.dismiss) private var dismiss
    /// A link to load right away, e.g. one PinPose found in the clipboard.
    var initialLink: String?
    var onFinished: (Look) -> Void

    @State private var pickerItem: PhotosPickerItem?
    @State private var linkText = ""
    @State private var isWorking = false
    @State private var status = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    PhotosPicker(selection: $pickerItem, matching: .images) {
                        Label("Aus Fotos auswählen", systemImage: "photo.on.rectangle")
                    }
                } header: {
                    Text("Bild gespeichert?")
                } footer: {
                    Text("In Pinterest: Pin öffnen → ••• → „Bild herunterladen“. Danach hier auswählen.")
                }

                Section {
                    TextField("https://pin.it/…", text: $linkText)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    PasteButton(payloadType: String.self) { strings in
                        linkText = strings.first ?? ""
                    }
                    Button {
                        Task { await importLink() }
                    } label: {
                        Label("Pin laden & analysieren", systemImage: "arrow.down.circle.fill")
                    }
                    .disabled(linkText.trimmingCharacters(in: .whitespaces).isEmpty)
                } header: {
                    Text("Pinterest-Link")
                } footer: {
                    Text("In Pinterest: Teilen → „Link kopieren“, dann hier einfügen.")
                }

                Section {
                    Button {
                        Task { await importClipboardImage() }
                    } label: {
                        Label("Bild aus Zwischenablage", systemImage: "doc.on.clipboard")
                    }
                } footer: {
                    Text("Funktioniert, wenn du ein Bild kopiert hast (z. B. lange drücken → Kopieren).")
                }
            }
            .disabled(isWorking)
            .overlay {
                if isWorking { AnalyzingOverlay(status: status) }
            }
            .navigationTitle("Bild hinzufügen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
            .task {
                if let initialLink, !initialLink.isEmpty, linkText.isEmpty {
                    linkText = initialLink
                    await importLink()
                }
            }
            .onChange(of: pickerItem) { _, item in
                guard let item else { return }
                Task { await importPickerItem(item) }
            }
            .alert("Hoppla", isPresented: Binding(get: { errorMessage != nil }, set: { if !$0 { errorMessage = nil } })) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
        }
        .interactiveDismissDisabled(isWorking)
    }

    private func importPickerItem(_ item: PhotosPickerItem) async {
        isWorking = true
        status = String(localized: "Bild wird geladen …")
        do {
            guard let data = try await item.loadTransferable(type: Data.self) else { throw AnalysisError.unreadableImage }
            await process(data)
        } catch {
            isWorking = false
            errorMessage = error.localizedDescription
        }
        pickerItem = nil
    }

    private func importLink() async {
        isWorking = true
        status = String(localized: "Pin wird geladen …")
        do {
            let data = try await PinterestImporter.loadImageData(from: linkText)
            await process(data)
        } catch {
            isWorking = false
            errorMessage = error.localizedDescription
        }
    }

    private func importClipboardImage() async {
        guard let image = UIPasteboard.general.image, let data = image.jpegData(compressionQuality: 0.95) else {
            errorMessage = String(localized: "In der Zwischenablage ist kein Bild.")
            return
        }
        await process(data)
    }

    private func process(_ data: Data) async {
        isWorking = true
        status = String(localized: "Analysiere Pose, Licht & Kamera …")
        do {
            let result = try await ImageAnalyzer.analyze(data: data)
            let look = store.add(image: result.image, analysis: result.analysis, silhouette: result.silhouette)
            isWorking = false
            onFinished(look)
        } catch {
            isWorking = false
            errorMessage = error.localizedDescription
        }
    }
}

/// Shows the analysis steps ticking off one by one, so the wait feels like work being done for you.
private struct AnalyzingOverlay: View {
    let status: String

    private let steps: [(Icon3D, String)] = [
        (.person, String(localized: "Pose erkennen")),
        (.zoom, String(localized: "Kamera & Zoom berechnen")),
        (.sun, String(localized: "Licht & Farben messen")),
        (.mapPin, String(localized: "Passende Orte finden")),
    ]
    @State private var done = 0

    var body: some View {
        ZStack {
            Rectangle().fill(.ultraThinMaterial).ignoresSafeArea()
            VStack(spacing: 22) {
                Text(status)
                    .font(.headline)
                    .multilineTextAlignment(.center)
                VStack(alignment: .leading, spacing: 14) {
                    ForEach(steps.indices, id: \.self) { index in
                        HStack(spacing: 12) {
                            ZStack {
                                if index < done {
                                    Image(systemName: "checkmark.circle.fill")
                                        .foregroundStyle(.green)
                                        .transition(.scale.combined(with: .opacity))
                                } else if index == done {
                                    ProgressView()
                                } else {
                                    Image(systemName: "circle")
                                        .foregroundStyle(.tertiary)
                                }
                            }
                            .font(.title3)
                            .frame(width: 28)
                            Icon3DView(steps[index].0, size: 28)
                                .opacity(index <= done ? 1 : 0.4)
                            Text(steps[index].1)
                                .font(.subheadline.weight(index <= done ? .semibold : .regular))
                                .foregroundStyle(index <= done ? .primary : .secondary)
                        }
                    }
                }
                .padding(20)
                .background(.background.opacity(0.6), in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }
            .padding()
        }
        .task {
            // Paced a little below the real analysis time; the last step stays open until the result is there.
            for step in 1..<steps.count {
                try? await Task.sleep(nanoseconds: 550_000_000)
                withAnimation(.spring(duration: 0.3)) { done = step }
            }
        }
        .sensoryFeedback(.increase, trigger: done)
    }
}
