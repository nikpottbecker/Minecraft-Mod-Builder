import SwiftUI

/// Three short pages on the first launch. The last button leads straight into adding the first picture,
/// so the user reaches the first result without having to find the "+" first.
struct OnboardingView: View {
    /// Called with `true` when the user wants to add a picture right away.
    var onFinish: (_ addPicture: Bool) -> Void

    @State private var page = 0

    private let pages: [OnboardingPage] = [
        OnboardingPage(
            icon: .pin,
            title: "Dein Pinterest-Foto.\nIn echt.",
            text: "Du hast ein Bild gespeichert, das du genau so haben willst? PinPose zeigt dir, wie es entstanden ist."
        ),
        OnboardingPage(
            icon: .magic,
            title: "Alles aus einem Bild",
            text: "Pose in Worten, Zoom und Belichtung, das richtige Licht samt Uhrzeit und passende Orte in deiner Nähe.",
            bullets: [
                OnboardingBullet(icon: .person, label: "Pose Schritt für Schritt"),
                OnboardingBullet(icon: .zoom, label: "Kamera-Einstellungen"),
                OnboardingBullet(icon: .sun, label: "Golden Hour & Licht"),
                OnboardingBullet(icon: .mapPin, label: "Foto-Orte in der Nähe"),
            ]
        ),
        OnboardingPage(
            icon: .camera,
            title: "Nachshooten mit Live-Coach",
            text: "Die Vorlage liegt über der Kamera. PinPose sagt dir, was du ändern sollst, und löst aus, sobald die Pose passt.",
            footnote: "Alles läuft auf deinem iPhone. Kein Konto, keine Uploads."
        ),
    ]

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                if page < pages.count - 1 {
                    Button("Überspringen") { onFinish(false) }
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(height: 44)
            .padding(.horizontal)

            TabView(selection: $page) {
                ForEach(pages.indices, id: \.self) { index in
                    OnboardingPageView(page: pages[index])
                        .tag(index)
                }
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .animation(.easeInOut, value: page)

            PageDots(count: pages.count, current: page)
                .padding(.bottom, 20)

            Button {
                if page < pages.count - 1 {
                    withAnimation { page += 1 }
                } else {
                    onFinish(true)
                }
            } label: {
                Text(page < pages.count - 1 ? "Weiter" : "Erstes Bild hinzufügen")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
            }
            .buttonStyle(.borderedProminent)
            .buttonBorderShape(.capsule)
            .controlSize(.large)
            .padding(.horizontal, 24)

            Button("Erst mal umsehen") { onFinish(false) }
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .padding(.top, 12)
                .opacity(page == pages.count - 1 ? 1 : 0)
                .disabled(page != pages.count - 1)
                .padding(.bottom, 16)
        }
        .sensoryFeedback(.selection, trigger: page)
    }
}

private struct OnboardingBullet: Hashable {
    let icon: Icon3D
    let label: String
}

private struct OnboardingPage {
    let icon: Icon3D
    let title: String
    let text: String
    var bullets: [OnboardingBullet] = []
    var footnote: String?
}

private struct OnboardingPageView: View {
    let page: OnboardingPage
    @State private var floating = false

    var body: some View {
        VStack(spacing: 22) {
            Spacer(minLength: 0)
            ZStack {
                Circle()
                    .fill(Color.accentColor.opacity(0.10))
                    .frame(width: 190, height: 190)
                Icon3DView(page.icon, size: 150)
                    .rotationEffect(.degrees(floating ? 3 : -3))
                    .offset(y: floating ? -6 : 6)
            }
            .onAppear {
                withAnimation(.easeInOut(duration: 2.4).repeatForever(autoreverses: true)) { floating = true }
            }
            Text(page.title)
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.8)
            Text(page.text)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)

            if !page.bullets.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    ForEach(page.bullets, id: \.self) { bullet in
                        Label {
                            Text(bullet.label).font(.subheadline.bold())
                        } icon: {
                            Icon3DView(bullet.icon, size: 30)
                        }
                    }
                }
                .padding(18)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.thinMaterial, in: RoundedRectangle(cornerRadius: 20, style: .continuous))
            }

            if let footnote = page.footnote {
                Label(footnote, systemImage: "lock.fill")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 28)
    }
}

private struct PageDots: View {
    let count: Int
    let current: Int

    var body: some View {
        HStack(spacing: 8) {
            ForEach(0..<count, id: \.self) { index in
                Capsule()
                    .fill(index == current ? Color.accentColor : Color.secondary.opacity(0.3))
                    .frame(width: index == current ? 22 : 8, height: 8)
            }
        }
        .animation(.spring(duration: 0.3), value: current)
        .accessibilityHidden(true)
    }
}
