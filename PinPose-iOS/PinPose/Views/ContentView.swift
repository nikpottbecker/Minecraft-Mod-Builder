import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: LookStore
    @EnvironmentObject private var reminders: Reminders
    @State private var path: [UUID] = []
    @State private var showImport = false
    @State private var importLink: String?
    @State private var clipboardHasLink = false
    @AppStorage("onboardingDone") private var onboardingDone = false
    @AppStorage("dismissedClipboardChange") private var dismissedClipboardChange = -1
    @Environment(\.scenePhase) private var scenePhase

    var body: some View {
        NavigationStack(path: $path) {
            Group {
                if store.looks.isEmpty {
                    EmptyLibraryView { showImport = true }
                } else {
                    LibraryGrid()
                }
            }
            .safeAreaInset(edge: .top) {
                if clipboardHasLink {
                    ClipboardBanner(
                        onPaste: { text in
                            dismissedClipboardChange = UIPasteboard.general.changeCount
                            withAnimation { clipboardHasLink = false }
                            importLink = text
                            showImport = true
                        },
                        onDismiss: {
                            dismissedClipboardChange = UIPasteboard.general.changeCount
                            withAnimation { clipboardHasLink = false }
                        }
                    )
                    .padding(.horizontal)
                    .padding(.bottom, 6)
                    .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
            .navigationTitle("PinPose")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showImport = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                    .accessibilityLabel("Bild hinzufügen")
                }
            }
            .navigationDestination(for: UUID.self) { id in
                LookDetailView(lookID: id)
            }
        }
        .task { await checkClipboard() }
        .onChange(of: reminders.lookToOpen) { _, id in
            guard let id, store.look(id: id) != nil else { return }
            reminders.lookToOpen = nil
            showImport = false
            path = [id]
        }
        .onChange(of: scenePhase) { _, phase in
            if phase == .active { Task { await checkClipboard() } }
        }
        .fullScreenCover(isPresented: Binding(get: { !onboardingDone }, set: { if !$0 { onboardingDone = true } })) {
            OnboardingView { addPicture in
                onboardingDone = true
                if addPicture {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { showImport = true }
                }
            }
        }
        .sheet(isPresented: $showImport, onDismiss: { importLink = nil }) {
            ImportView(initialLink: importLink) { look in
                showImport = false
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.4) {
                    path.append(look.id)
                }
            }
            .environmentObject(store)
        }
    }
}

extension ContentView {
    /// Looks for a copied link without reading it, so iOS does not show the paste prompt.
    /// The link itself is only read when the user taps the system paste button.
    fileprivate func checkClipboard() async {
        let pasteboard = UIPasteboard.general
        guard onboardingDone, !showImport, pasteboard.changeCount != dismissedClipboardChange,
              pasteboard.hasStrings || pasteboard.hasURLs else {
            if clipboardHasLink { withAnimation { clipboardHasLink = false } }
            return
        }
        let patterns = (try? await pasteboard.detectedPatterns(for: [\UIPasteboard.DetectedValues.probableWebURL])) ?? []
        let found = !patterns.isEmpty
        if found != clipboardHasLink { withAnimation(.spring) { clipboardHasLink = found } }
    }
}

/// Offers to analyse a link the user just copied in Pinterest.
private struct ClipboardBanner: View {
    var onPaste: (String) -> Void
    var onDismiss: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: "link")
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 36, height: 36)
                .background(Color.accentColor.gradient, in: Circle())
            VStack(alignment: .leading, spacing: 1) {
                Text("Link kopiert")
                    .font(.subheadline.bold())
                Text("Direkt analysieren?")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer(minLength: 0)
            PasteButton(payloadType: String.self) { strings in
                guard let text = strings.first else { return }
                DispatchQueue.main.async { onPaste(text) }
            }
            .labelStyle(.titleOnly)
            .buttonBorderShape(.capsule)
            .tint(.accentColor)
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .font(.caption.bold())
                    .foregroundStyle(.secondary)
                    .frame(width: 28, height: 28)
            }
            .accessibilityLabel("Ausblenden")
        }
        .padding(10)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .shadow(color: .black.opacity(0.08), radius: 8, y: 2)
    }
}

private struct LibraryGrid: View {
    @EnvironmentObject private var store: LookStore
    private let columns = [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)]

    var body: some View {
        ScrollView {
            LibraryProgress(looks: store.looks)
                .padding(.horizontal)
                .padding(.top, 4)
            LazyVGrid(columns: columns, spacing: 12) {
                ForEach(store.looks) { look in
                    NavigationLink(value: look.id) {
                        LookCard(look: look, image: store.image(for: look),
                                 latestShot: look.shots.first.flatMap { store.image(for: $0) })
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button(role: .destructive) {
                            store.delete(look)
                        } label: {
                            Label("Löschen", systemImage: "trash")
                        }
                    }
                }
            }
            .padding()
        }
    }
}

/// Small progress line above the grid: open looks pull people back in.
private struct LibraryProgress: View {
    let looks: [Look]

    var body: some View {
        let done = looks.filter(\.isRecreated).count
        let open = looks.count - done
        HStack(spacing: 10) {
            ProgressView(value: Double(done), total: Double(max(looks.count, 1)))
                .tint(.accentColor)
                .frame(maxWidth: 90)
            Text(open == 0 ? "Alle \(looks.count) Looks nachgeshootet 🎉"
                           : "\(done) von \(looks.count) nachgeshootet · \(open) \(open == 1 ? "wartet" : "warten") noch")
                .font(.footnote)
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }
}

private struct LookCard: View {
    let look: Look
    let image: UIImage?
    var latestShot: UIImage?

    var body: some View {
        ZStack(alignment: .bottomLeading) {
            Group {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                } else {
                    Color.secondary.opacity(0.2)
                }
            }
            .frame(height: 230)
            .frame(maxWidth: .infinity)
            .clipped()

            LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .center, endPoint: .bottom)

            VStack(alignment: .leading, spacing: 2) {
                Text(look.title)
                    .font(.subheadline.bold())
                    .lineLimit(1)
                if let framing = look.analysis.framing {
                    Text(framing.label)
                        .font(.caption2)
                        .opacity(0.85)
                }
            }
            .foregroundStyle(.white)
            .padding(10)
            .padding(.trailing, latestShot == nil ? 0 : 52)
        }
        .overlay(alignment: .topTrailing) {
            if let score = look.bestScore {
                ScoreBadge(score: score, compact: true)
                    .padding(8)
            } else if !look.isRecreated {
                Text("Offen")
                    .font(.caption2.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.black.opacity(0.45), in: Capsule())
                    .padding(8)
            }
        }
        .overlay(alignment: .bottomTrailing) {
            if let latestShot {
                Image(uiImage: latestShot)
                    .resizable()
                    .scaledToFill()
                    .frame(width: 44, height: 58)
                    .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
                    .overlay(RoundedRectangle(cornerRadius: 8, style: .continuous).stroke(.white, lineWidth: 2))
                    .shadow(radius: 4)
                    .padding(8)
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
    }
}

private struct EmptyLibraryView: View {
    var onAdd: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(systemName: "camera.on.rectangle.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(Color.accentColor.gradient)
                    .padding(.top, 40)

                VStack(spacing: 8) {
                    Text("Pinterest-Bilder nachshooten")
                        .font(.title2.bold())
                    Text("Füg ein Bild hinzu und PinPose zeigt dir Pose, Kamera-Einstellungen, Licht und passende Orte in deiner Nähe.")
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }
                .padding(.horizontal)

                VStack(alignment: .leading, spacing: 16) {
                    StepRow(number: 1, title: "Bild einfügen", detail: "Pin-Link kopieren oder Bild aus Fotos wählen.")
                    StepRow(number: 2, title: "Analyse ansehen", detail: "Pose, Zoom, Belichtung, Licht & Orte.")
                    StepRow(number: 3, title: "Nachshooten", detail: "Kamera mit Vorlage als Overlay und Live-Pose-Match.")
                }
                .padding()
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
                .padding(.horizontal)

                Button(action: onAdd) {
                    Label("Erstes Bild hinzufügen", systemImage: "plus")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 6)
                }
                .buttonStyle(.borderedProminent)
                .buttonBorderShape(.capsule)
                .controlSize(.large)
                .padding(.horizontal)
            }
            .padding(.bottom, 32)
        }
    }
}

private struct StepRow: View {
    let number: Int
    let title: String
    let detail: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Text("\(number)")
                .font(.headline)
                .foregroundStyle(.white)
                .frame(width: 32, height: 32)
                .background(Color.accentColor, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(detail).font(.subheadline).foregroundStyle(.secondary)
            }
        }
    }
}

/// Pose match percentage with a traffic-light color.
struct ScoreBadge: View {
    let score: Double
    var compact = false

    var color: Color {
        switch score {
        case 0.85...: return .green
        case 0.65...: return .orange
        default: return .pink
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: "figure.stand")
            Text("\(Int((score * 100).rounded())) %")
                .monospacedDigit()
        }
        .font(compact ? .caption2.bold() : .subheadline.bold())
        .foregroundStyle(.white)
        .padding(.horizontal, compact ? 8 : 12)
        .padding(.vertical, compact ? 4 : 6)
        .background(color, in: Capsule())
    }
}
