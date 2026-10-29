import UIKit

/// Builds the before/after picture people share: reference and own photo side by side, 4:5 for Instagram.
enum CollageRenderer {
    static let size = CGSize(width: 1080, height: 1350)

    static func render(reference: UIImage, photo: UIImage, score: Double?) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        let footer: CGFloat = 150
        let gap: CGFloat = 8
        let panelWidth = (size.width - gap) / 2
        let panelHeight = size.height - footer

        return UIGraphicsImageRenderer(size: size, format: format).image { context in
            UIColor.black.setFill()
            context.fill(CGRect(origin: .zero, size: size))

            let left = CGRect(x: 0, y: 0, width: panelWidth, height: panelHeight)
            let right = CGRect(x: panelWidth + gap, y: 0, width: panelWidth, height: panelHeight)
            drawFilling(reference, in: left, context: context.cgContext)
            drawFilling(photo, in: right, context: context.cgContext)
            drawTag("Vorlage", in: left)
            drawTag("Ich", in: right)

            let footerRect = CGRect(x: 0, y: panelHeight, width: size.width, height: footer)
            drawFooter(in: footerRect, score: score)
        }
    }

    /// Aspect-fill, biased slightly to the top so heads are not cut off.
    private static func drawFilling(_ image: UIImage, in rect: CGRect, context: CGContext) {
        let imageSize = image.size
        guard imageSize.width > 0, imageSize.height > 0 else { return }
        let scale = max(rect.width / imageSize.width, rect.height / imageSize.height)
        let drawn = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
        let origin = CGPoint(x: rect.midX - drawn.width / 2,
                             y: rect.minY - (drawn.height - rect.height) * 0.3)
        context.saveGState()
        context.clip(to: rect)
        image.draw(in: CGRect(origin: origin, size: drawn))
        context.restoreGState()
    }

    private static func drawTag(_ text: String, in rect: CGRect) {
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 34, weight: .bold),
            .foregroundColor: UIColor.white,
        ]
        let textSize = (text as NSString).size(withAttributes: attributes)
        let pill = CGRect(x: rect.minX + 24, y: rect.minY + 24, width: textSize.width + 36, height: textSize.height + 16)
        UIColor.black.withAlphaComponent(0.55).setFill()
        UIBezierPath(roundedRect: pill, cornerRadius: pill.height / 2).fill()
        (text as NSString).draw(at: CGPoint(x: pill.minX + 18, y: pill.minY + 8), withAttributes: attributes)
    }

    private static func drawFooter(in rect: CGRect, score: Double?) {
        let accent = UIColor(named: "AccentColor") ?? .systemPink
        let brand: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 44, weight: .heavy),
            .foregroundColor: UIColor.white,
        ]
        let sub: [NSAttributedString.Key: Any] = [
            .font: UIFont.systemFont(ofSize: 28, weight: .medium),
            .foregroundColor: UIColor.white.withAlphaComponent(0.7),
        ]
        ("PinPose" as NSString).draw(at: CGPoint(x: 40, y: rect.minY + 30), withAttributes: brand)
        ("Pinterest-Foto nachgeshootet" as NSString).draw(at: CGPoint(x: 40, y: rect.minY + 88), withAttributes: sub)

        guard let score else { return }
        let text = "\(Int((score * 100).rounded())) % Pose-Match"
        let attributes: [NSAttributedString.Key: Any] = [
            .font: UIFont.monospacedDigitSystemFont(ofSize: 36, weight: .bold),
            .foregroundColor: UIColor.white,
        ]
        let textSize = (text as NSString).size(withAttributes: attributes)
        let pill = CGRect(x: rect.maxX - 40 - textSize.width - 48, y: rect.midY - (textSize.height + 28) / 2,
                          width: textSize.width + 48, height: textSize.height + 28)
        (score >= 0.85 ? UIColor.systemGreen : accent).setFill()
        UIBezierPath(roundedRect: pill, cornerRadius: pill.height / 2).fill()
        (text as NSString).draw(at: CGPoint(x: pill.minX + 24, y: pill.minY + 14), withAttributes: attributes)
    }
}
