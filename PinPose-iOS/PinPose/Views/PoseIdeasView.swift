import SwiftUI

/// Built-in poses to start with when there is no Pinterest picture at hand.
struct PoseIdeasView: View {
    @EnvironmentObject private var store: LookStore
    @Environment(\.dismiss) private var dismiss
    var onPicked: (Look) -> Void

    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        NavigationStack {
            ScrollView {
                Text("Keine Vorlage zur Hand? Nimm eine dieser Posen, PinPose coacht dich genauso durch.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                LazyVGrid(columns: columns, spacing: 12) {
                    ForEach(PoseIdea.all) { idea in
                        Button {
                            let look = store.add(idea: idea)
                            onPicked(look)
                        } label: {
                            PoseIdeaCard(idea: idea)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding()
            }
            .navigationTitle("Pose-Ideen")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Abbrechen") { dismiss() }
                }
            }
        }
    }
}

struct PoseIdeaCard: View {
    let idea: PoseIdea
    var compact = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            ZStack {
                LinearGradient(colors: [Color.accentColor.opacity(0.25), Color.accentColor.opacity(0.08)],
                               startPoint: .top, endPoint: .bottom)
                PoseSkeletonView(pose: idea.pose, imageSize: PoseIdea.imageSize, contentMode: .fit,
                                 color: .accentColor, lineWidth: compact ? 3 : 4)
                    .padding(compact ? 4 : 8)
            }
            .frame(height: compact ? 120 : 170)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            Text(idea.title)
                .font(compact ? .caption.bold() : .subheadline.bold())
                .lineLimit(1)
            if !compact {
                Text(idea.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
        }
        .accessibilityElement(children: .combine)
    }
}
