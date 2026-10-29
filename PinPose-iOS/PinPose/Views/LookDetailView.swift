import StoreKit
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
    @State private var openShot: Shot?
    @Environment(\.requestReview) private var requestReview
    @AppStorage("reviewAskedVersion") private var reviewAskedVersion = ""

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

                ShotPlanCard(analysis: analysis)

                if look.isRecreated {
                    ShotStrip(look: look) { openShot = $0 }
                }

                AdviceSection(title: "So posierst du", icon: "figure.stand", advice: analysis.poseAdvice, preview: 4)
                AdviceSection(title: "Kamera-Einstellungen", icon: "camera.fill", advice: analysis.cameraAdvice)
                AdviceSection(title: "Licht & Stimmung", icon: "sun.max.fill", advice: analysis.lightAdvice)
                SunTimesCard(highlightGoldenHour: analysis.lightAdvice.contains { $0.title == "Golden Hour" },
                             look: look)
                AdviceSection(title: "Bildaufbau", icon: "square.grid.3x3", advice: analysis.compositionAdvice)
                if !analysis.places.isEmpty || analysis.exif?.coordinate != nil {
                    PlacesSection(places: analysis.places, exif: analysis.exif)
                }

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
        .sheet(item: $openShot) { shot in
            CompareView(reference: image, photo: store.image(for: shot), score: shot.score, doneTitle: "Fertig")
        }
        .onChange(of: showCamera) { _, open in
            if !open { askForReviewAfterGoodSession() }
        }
        .fullScreenCover(isPresented: $showCamera) {
            CameraView(look: look, referenceImage: image, silhouette: store.silhouette(for: look))
                .environmentObject(store)
        }
    }
}

/// The photos the user already took for this look, newest first.
private struct ShotStrip: View {
    @EnvironmentObject private var store: LookStore
    let look: Look
    var onOpen: (Shot) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Label("Deine Fotos", systemImage: "photo.stack")
                    .font(.title3.bold())
                Spacer()
                Text("\(look.shots.count)")
                    .font(.subheadline.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 10) {
                    ForEach(look.shots) { shot in
                        Button { onOpen(shot) } label: {
                            ZStack(alignment: .bottomTrailing) {
                                Group {
                                    if let image = store.image(for: shot) {
                                        Image(uiImage: image).resizable().scaledToFill()
                                    } else {
                                        Color.secondary.opacity(0.2)
                                    }
                                }
                                .frame(width: 96, height: 128)
                                .clipped()
                                if let score = shot.score {
                                    ScoreBadge(score: score, compact: true).padding(5)
                                }
                            }
                            .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            .overlay {
                                if shot.id == look.bestShot?.id, look.shots.count > 1 {
                                    RoundedRectangle(cornerRadius: 14, style: .continuous)
                                        .stroke(Color.accentColor, lineWidth: 3)
                                }
                            }
                        }
                        .buttonStyle(.plain)
                        .contextMenu {
                            Button(role: .destructive) {
                                store.deleteShot(shot, from: look.id)
                            } label: {
                                Label("Foto entfernen", systemImage: "trash")
                            }
                        }
                        .accessibilityLabel(shot.score.map { "Foto mit \(Int($0 * 100)) Prozent" } ?? "Foto")
                    }
                }
            }
        }
    }
}

/// The four facts that matter most, so the user can start without reading every card.
private struct ShotPlanCard: View {
    let analysis: ShotAnalysis

    private struct Item: Identifiable {
        let icon: String
        let label: String
        let value: String
        var id: String { label }
    }

    private var items: [Item] {
        var result = [Item(icon: "plus.magnifyingglass", label: "Zoom", value: ShotAdvisor.zoomLabel(analysis.recommendedZoom))]
        if let height = analysis.cameraAdvice.first(where: { $0.title.hasPrefix("Kamera ") }) {
            let rest = height.title.replacingOccurrences(of: "Kamera ", with: "")
            result.append(Item(icon: "camera.viewfinder", label: "Kamera", value: rest.prefix(1).uppercased() + rest.dropFirst()))
        } else if let framing = analysis.framing {
            result.append(Item(icon: "person.crop.rectangle", label: "Ausschnitt", value: framing.label))
        }
        if let light = analysis.lightAdvice.first {
            result.append(Item(icon: light.icon, label: "Licht", value: light.title))
        }
        if let place = analysis.places.first {
            result.append(Item(icon: place.icon, label: "Ort", value: place.title))
        }
        return result
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("Dein Shot-Plan", systemImage: "checklist")
                .font(.title3.bold())
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
                ForEach(items) { item in
                    HStack(spacing: 10) {
                        Image(systemName: item.icon)
                            .font(.headline)
                            .foregroundStyle(Color.accentColor)
                            .frame(width: 26)
                        VStack(alignment: .leading, spacing: 1) {
                            Text(item.label)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Text(item.value)
                                .font(.subheadline.bold())
                                .lineLimit(2)
                                .minimumScaleFactor(0.8)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(12)
                    .frame(maxWidth: .infinity, minHeight: 64, alignment: .leading)
                    .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    .accessibilityElement(children: .combine)
                }
            }
        }
    }
}

extension LookDetailView {
    /// Asks for a rating right after a session that went well (peak moment), at most once per app version.
    fileprivate func askForReviewAfterGoodSession() {
        let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1"
        guard reviewAskedVersion != version else { return }
        let shots = store.looks.flatMap(\.shots)
        let greatShots = shots.filter { ($0.score ?? 0) >= 0.85 }.count
        guard shots.count >= 3, greatShots >= 1,
              let latest = store.look(id: lookID)?.shots.first, (latest.score ?? 0) >= 0.8,
              Date().timeIntervalSince(latest.createdAt) < 600 else { return }
        reviewAskedVersion = version
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) { requestReview() }
    }
}

struct AdviceSection: View {
    let title: String
    let icon: String
    let advice: [Advice]
    /// How many cards are shown before "Mehr anzeigen".
    var preview = 2

    @State private var expanded = false

    var body: some View {
        if !advice.isEmpty {
            VStack(alignment: .leading, spacing: 10) {
                Label(title, systemImage: icon)
                    .font(.title3.bold())
                ForEach(expanded ? advice : Array(advice.prefix(preview))) { item in
                    AdviceCard(advice: item)
                        .transition(.opacity.combined(with: .move(edge: .top)))
                }
                if advice.count > preview {
                    Button {
                        withAnimation(.easeInOut(duration: 0.25)) { expanded.toggle() }
                    } label: {
                        Label(expanded ? "Weniger anzeigen" : "\(advice.count - preview) weitere anzeigen",
                              systemImage: expanded ? "chevron.up" : "chevron.down")
                            .font(.subheadline.bold())
                    }
                    .padding(.leading, 4)
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
