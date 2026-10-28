import SwiftUI

struct LookDetailView: View {
    @EnvironmentObject private var store: LookStore
    @Environment(\.dismiss) private var dismiss
    let lookID: UUID

    @State private var showCamera = false
    @State private var showSkeleton = true
    @State private var isRenaming = false
    @State private var newTitle = ""
    @State private var confirmDelete = false

    var body: some View {
        if let look = store.look(id: lookID) {
            content(for: look, image: store.image(for: look))
        } else {
            ContentUnavailableView("Look nicht gefunden", systemImage: "photo")
        }
    }

    private func content(for look: Look, image: UIImage?) -> some View {
        let analysis = look.analysis
        return ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()
                        .overlay {
                            if showSkeleton, let pose = analysis.pose {
                                PoseSkeletonView(pose: pose, imageSize: analysis.imageSize, contentMode: .fit,
                                                 color: .pink, lineWidth: 4)
                            }
                        }
                        .clipShape(RoundedRectangle(cornerRadius: 22, style: .continuous))
                        .overlay(alignment: .topTrailing) {
                            if analysis.pose != nil {
                                Button {
                                    withAnimation { showSkeleton.toggle() }
                                } label: {
                                    Image(systemName: showSkeleton ? "figure.stand" : "figure.stand.line.dotted.figure.stand")
                                        .font(.headline)
                                        .padding(10)
                                        .background(.ultraThinMaterial, in: Circle())
                                }
                                .padding(10)
                                .accessibilityLabel("Pose-Skelett ein/aus")
                            }
                        }
                        .frame(maxWidth: .infinity)
                }

                HStack {
                    if let framing = analysis.framing {
                        Label(framing.label, systemImage: "person.crop.rectangle")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    if let score = look.bestScore {
                        ScoreBadge(score: score)
                    }
                }

                Button {
                    showCamera = true
                } label: {
                    Label("Jetzt nachshooten", systemImage: "camera.fill")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                }
                .buttonStyle(.borderedProminent)
                .buttonBorderShape(.capsule)
                .controlSize(.large)

                AdviceSection(title: "So posierst du", icon: "figure.stand", advice: analysis.poseAdvice)
                AdviceSection(title: "Kamera-Einstellungen", icon: "camera.fill", advice: analysis.cameraAdvice)
                AdviceSection(title: "Licht & Stimmung", icon: "sun.max.fill", advice: analysis.lightAdvice)
                AdviceSection(title: "Bildaufbau", icon: "square.grid.3x3", advice: analysis.compositionAdvice)
                PlacesSection(places: analysis.places, exif: analysis.exif)

                if !analysis.sceneLabels.isEmpty {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Im Bild erkannt")
                            .font(.headline)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(analysis.sceneLabels, id: \.self) { label in
                                    Text(label.replacingOccurrences(of: "_", with: " "))
                                        .font(.caption)
                                        .padding(.horizontal, 10)
                                        .padding(.vertical, 5)
                                        .background(.thinMaterial, in: Capsule())
                                }
                            }
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle(look.title)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button {
                        newTitle = look.title
                        isRenaming = true
                    } label: {
                        Label("Umbenennen", systemImage: "pencil")
                    }
                    Button(role: .destructive) {
                        confirmDelete = true
                    } label: {
                        Label("Löschen", systemImage: "trash")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .alert("Umbenennen", isPresented: $isRenaming) {
            TextField("Titel", text: $newTitle)
            Button("Sichern") { store.rename(look.id, to: newTitle) }
            Button("Abbrechen", role: .cancel) {}
        }
        .confirmationDialog("Look löschen?", isPresented: $confirmDelete, titleVisibility: .visible) {
            Button("Löschen", role: .destructive) {
                dismiss()
                store.delete(look)
            }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraView(look: look, referenceImage: image)
                .environmentObject(store)
        }
    }
}

struct AdviceSection: View {
    let title: String
    let icon: String
    let advice: [Advice]

    var body: some View {
        if !advice.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Label(title, systemImage: icon)
                    .font(.title3.bold())
                ForEach(advice) { item in
                    AdviceCard(advice: item)
                }
            }
        }
    }
}

struct AdviceCard: View {
    let advice: Advice

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: advice.icon)
                .font(.headline)
                .foregroundStyle(Color.accentColor)
                .frame(width: 36, height: 36)
                .background(Color.accentColor.opacity(0.12), in: Circle())
            VStack(alignment: .leading, spacing: 3) {
                Text(advice.title)
                    .font(.subheadline.bold())
                Text(advice.detail)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .fixedSize(horizontal: false, vertical: true)
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
    }
}

private struct PlacesSection: View {
    let places: [PlaceIdea]
    let exif: ExifInfo?

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Orte in deiner Nähe", systemImage: "mappin.and.ellipse")
                .font(.title3.bold())

            if let coordinate = exif?.coordinate {
                NavigationLink {
                    PlacesView(idea: PlaceIdea(title: "Original-Ort", query: "", icon: "star.fill",
                                               reason: "GPS-Daten aus dem Bild"),
                               originalCoordinate: coordinate)
                } label: {
                    PlaceRow(icon: "star.fill", title: "Original-Ort anzeigen", subtitle: "Das Bild enthält GPS-Daten")
                }
                .buttonStyle(.plain)
            }

            ForEach(places) { place in
                if place.query.isEmpty {
                    PlaceRow(icon: place.icon, title: place.title, subtitle: place.reason, showsChevron: false)
                } else {
                    NavigationLink {
                        PlacesView(idea: place, originalCoordinate: exif?.coordinate)
                    } label: {
                        PlaceRow(icon: place.icon, title: place.title, subtitle: place.reason)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
}

private struct PlaceRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var showsChevron = true

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.accentColor.gradient, in: RoundedRectangle(cornerRadius: 10, style: .continuous))
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline.bold())
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            if showsChevron {
                Image(systemName: "chevron.right")
                    .font(.caption.bold())
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(12)
        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .contentShape(Rectangle())
    }
}
