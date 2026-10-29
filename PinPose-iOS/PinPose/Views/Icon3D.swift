import SwiftUI

/// The soft 3D illustrations (3dicons.co, CC0) used for heroes and key facts.
/// Controls and toolbars keep SF Symbols, so the 3D pictures stay special.
enum Icon3D: String {
    case camera, picture, sun, mapPin = "map-pin", zoom, magic = "magic-trick", palette = "color-palette"
    case link, trophy, medal, clock, person = "girl", target, tick, shield = "sheild", star, pin
}

struct Icon3DView: View {
    let icon: Icon3D
    var size: CGFloat = 32

    init(_ icon: Icon3D, size: CGFloat = 32) {
        self.icon = icon
        self.size = size
    }

    var body: some View {
        Image("3d-\(icon.rawValue)")
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(width: size, height: size)
            .shadow(color: .black.opacity(size > 60 ? 0.12 : 0.06), radius: size > 60 ? 12 : 3, y: size > 60 ? 8 : 2)
            .accessibilityHidden(true)
    }
}
