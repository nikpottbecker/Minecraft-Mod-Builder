import SwiftUI

/// Reference and captured photo side by side, with the reference's colour look on request.
struct CompareView: View {
    let reference: UIImage?
    let photo: UIImage?
    let score: Double?
    /// nil hides the "saved to Fotos" line, e.g. for older shots.
    var saved: Bool?
    var doneTitle = "Weiter shooten"

    @Environment(\.dismiss) private var dismiss
    @AppStorage("compare.colorLook") private var colorLook = false
    @AppStorage("compare.colorStrength") private var strength = 0.7
    @State private var adjustment: ColorMatcher.Adjustment?
    @State private var graded: UIImage?
    @State private var collage: UIImage?
    @State private var savedGraded = false

    /// The photo as shown and shared: graded when the colour look is on.
    private var shownPhoto: UIImage? { colorLook ? (graded ?? photo) : photo }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    HStack(alignment: .top, spacing: 10) {
                        column(title: "Vorlage", image: reference)
                        column(title: colorLook ? "Dein Foto · Farblook" : "Dein Foto", image: shownPhoto)
                    }

                    if let score {
                        VStack(spacing: 6) {
                            Icon3DView(score >= 0.9 ? .trophy : (score >= 0.8 ? .medal : .target), size: 64)
                            ScoreBadge(score: score)
                            Text(verdict(for: score))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }

                    if adjustment != nil {
                        colorLookCard
                    }

                    if let saved, !colorLook {
                        Label(saved ? "In deinen Fotos gespeichert" : "Wird in Fotos gespeichert …",
                              systemImage: saved ? "checkmark.circle.fill" : "arrow.down.circle")
                            .font(.subheadline)
                            .foregroundStyle(saved ? Color.green : Color.secondary)
                    }

                    if let collage {
                        ShareLink(item: Image(uiImage: collage),
                                  preview: SharePreview("Vorher/Nachher mit PinPose", image: Image(uiImage: collage))) {
                            Label("Vorher/Nachher teilen", systemImage: "square.and.arrow.up")
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .buttonBorderShape(.capsule)
                        .controlSize(.large)
                    }
                    if let shownPhoto {
                        ShareLink(item: Image(uiImage: shownPhoto),
                                  preview: SharePreview("Mein PinPose-Foto", image: Image(uiImage: shownPhoto))) {
                            Label("Nur mein Foto teilen", systemImage: "photo")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                        .buttonBorderShape(.capsule)
                        .controlSize(.large)
                    }
                }
                .padding()
            }
            .navigationTitle("Vergleich")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button(doneTitle) { dismiss() }
                }
            }
            .task(id: photo) { await prepareColorLook() }
            .task(id: RenderKey(colorLook: colorLook, strength: strength, ready: adjustment != nil)) {
                await render()
            }
        }
    }

    private var colorLookCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Toggle(isOn: $colorLook.animation()) {
                Label {
                    VStack(alignment: .leading, spacing: 1) {
                        Text("Farblook der Vorlage").font(.subheadline.bold())
                        Text("Helligkeit, Kontrast, Farben und Weißabgleich wie im Original.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                } icon: {
                    Icon3DView(.palette, size: 30)
                }
            }
            if colorLook {
                HStack(spacing: 10) {
                    Text("Stärke").font(.caption)
                    Slider(value: $strength, in: 0.2...1, step: 0.05)
                    Text("\(Int(strength * 100)) %")
                        .font(.caption.monospacedDigit())
                        .frame(width: 40)
                }
                Button {
                    saveGraded()
                } label: {
                    Label(savedGraded ? "In Fotos gesichert" : "Mit Farblook in Fotos sichern",
                          systemImage: savedGraded ? "checkmark.circle.fill" : "square.and.arrow.down")
                        .font(.subheadline.bold())
                }
                .disabled(savedGraded || graded == nil)
            }
        }
        .padding(14)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }

    private struct RenderKey: Equatable {
        var colorLook: Bool
        var strength: Double
        var ready: Bool
    }

    private func prepareColorLook() async {
        guard let reference, let photo else { return }
        let result = await Task.detached(priority: .userInitiated) { () -> ColorMatcher.Adjustment? in
            guard let own = ColorMatcher.stats(of: photo), let target = ColorMatcher.stats(of: reference) else { return nil }
            return ColorMatcher.adjustment(from: own, to: target)
        }.value
        adjustment = result
        await render()
    }

    private func render() async {
        guard let photo else { return }
        savedGraded = false
        if colorLook, let adjustment {
            let scaled = adjustment.scaled(by: strength)
            let preview = photo.uprightResized(maxSide: 1600)
            graded = await Task.detached(priority: .userInitiated) { ColorMatcher.apply(scaled, to: preview) }.value
        }
        if let reference, let shown = shownPhoto {
            collage = CollageRenderer.render(reference: reference, photo: shown, score: score)
        }
    }

    private func saveGraded() {
        guard let graded, let data = graded.jpegData(compressionQuality: 0.92) else { return }
        PhotoLibrarySaver.save(data) { success in
            DispatchQueue.main.async { savedGraded = success }
        }
    }

    private func column(title: String, image: UIImage?) -> some View {
        VStack(spacing: 6) {
            Text(title)
                .font(.caption.bold())
                .foregroundStyle(.secondary)
            if let image {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            } else {
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(Color.secondary.opacity(0.2))
                    .aspectRatio(3 / 4, contentMode: .fit)
            }
        }
        .frame(maxWidth: .infinity)
    }

    private func verdict(for score: Double) -> String {
        switch score {
        case 0.9...: return "Wow – fast identisch!"
        case 0.8...: return "Sehr nah dran! Kleine Details noch anpassen."
        case 0.65...: return "Gut! Schau dir Arme und Beine in der Vorlage nochmal an."
        default: return "Noch nicht ganz – folge den Pose-Tipps Schritt für Schritt."
        }
    }
}
