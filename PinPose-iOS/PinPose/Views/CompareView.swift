import SwiftUI

/// Reference and captured photo side by side.
struct CompareView: View {
    let reference: UIImage?
    let photo: UIImage?
    let score: Double?
    /// nil hides the "saved to Fotos" line, e.g. for older shots.
    var saved: Bool?
    var doneTitle = "Weiter shooten"

    @Environment(\.dismiss) private var dismiss
    @State private var collage: UIImage?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    HStack(alignment: .top, spacing: 10) {
                        column(title: "Vorlage", image: reference)
                        column(title: "Dein Foto", image: photo)
                    }

                    if let score {
                        VStack(spacing: 6) {
                            ScoreBadge(score: score)
                            Text(verdict(for: score))
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .multilineTextAlignment(.center)
                        }
                    }

                    if let saved {
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
                    if let photo {
                        ShareLink(item: Image(uiImage: photo), preview: SharePreview("Mein PinPose-Foto", image: Image(uiImage: photo))) {
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
            .task(id: photo) {
                guard let reference, let photo else { return }
                collage = CollageRenderer.render(reference: reference, photo: photo, score: score)
            }
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
        case 0.9...: return "Wow – fast identisch! 🔥"
        case 0.8...: return "Sehr nah dran! Kleine Details noch anpassen."
        case 0.65...: return "Gut! Schau dir Arme und Beine in der Vorlage nochmal an."
        default: return "Noch nicht ganz – folge den Pose-Tipps Schritt für Schritt."
        }
    }
}
