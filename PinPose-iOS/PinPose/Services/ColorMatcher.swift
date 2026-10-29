import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit

/// Gives the user's photo the colour look of the reference: brightness, contrast, saturation and white balance.
/// Works on simple image statistics, so it is fast and runs fully on the device.
enum ColorMatcher {
    struct Stats: Equatable {
        var red: Double
        var green: Double
        var blue: Double
        var luminance: Double
        /// Standard deviation of the luminance.
        var contrast: Double
        var saturation: Double
    }

    struct Adjustment: Equatable {
        var exposure: Double
        var contrast: Double
        var saturation: Double
        var redGain: Double
        var greenGain: Double
        var blueGain: Double

        static let identity = Adjustment(exposure: 0, contrast: 1, saturation: 1, redGain: 1, greenGain: 1, blueGain: 1)

        /// Blends between no change (0) and the full adjustment (1).
        func scaled(by strength: Double) -> Adjustment {
            func mix(_ value: Double, _ neutral: Double) -> Double { neutral + (value - neutral) * strength }
            return Adjustment(exposure: mix(exposure, 0), contrast: mix(contrast, 1), saturation: mix(saturation, 1),
                              redGain: mix(redGain, 1), greenGain: mix(greenGain, 1), blueGain: mix(blueGain, 1))
        }
    }

    private static let context = CIContext(options: [.useSoftwareRenderer: false])

    static func stats(of image: UIImage) -> Stats? {
        guard let cgImage = image.uprightResized(maxSide: 96).cgImage else { return nil }
        let side = 48
        var pixels = [UInt8](repeating: 0, count: side * side * 4)
        guard let bitmap = CGContext(data: &pixels, width: side, height: side, bitsPerComponent: 8, bytesPerRow: side * 4,
                                     space: CGColorSpaceCreateDeviceRGB(),
                                     bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
        bitmap.interpolationQuality = .medium
        bitmap.draw(cgImage, in: CGRect(x: 0, y: 0, width: side, height: side))
        return stats(rgba: pixels)
    }

    /// Statistics from raw RGBA bytes; split out so it can be tested without images.
    static func stats(rgba pixels: [UInt8]) -> Stats? {
        let count = pixels.count / 4
        guard count > 0 else { return nil }
        var r = 0.0, g = 0.0, b = 0.0, lum = 0.0, lumSq = 0.0, sat = 0.0
        for i in 0..<count {
            let pr = Double(pixels[i * 4]) / 255
            let pg = Double(pixels[i * 4 + 1]) / 255
            let pb = Double(pixels[i * 4 + 2]) / 255
            let l = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb
            let maxC = max(pr, pg, pb), minC = min(pr, pg, pb)
            r += pr; g += pg; b += pb
            lum += l; lumSq += l * l
            sat += maxC > 0 ? (maxC - minC) / maxC : 0
        }
        let n = Double(count)
        let mean = lum / n
        return Stats(red: r / n, green: g / n, blue: b / n, luminance: mean,
                     contrast: sqrt(max(lumSq / n - mean * mean, 0)), saturation: sat / n)
    }

    /// What has to change so `photo` looks like `reference`. Clamped, so odd pictures never produce extreme results.
    static func adjustment(from photo: Stats, to reference: Stats) -> Adjustment {
        func clamp(_ value: Double, _ low: Double, _ high: Double) -> Double { min(max(value, low), high) }
        let exposure = clamp(log2(max(reference.luminance, 0.02) / max(photo.luminance, 0.02)), -1, 1)
        let contrast = clamp(reference.contrast / max(photo.contrast, 0.01), 0.75, 1.35)
        let saturation = clamp(reference.saturation / max(photo.saturation, 0.01), 0.4, 1.6)

        // Colour balance: compare each channel relative to the image's own brightness.
        func tint(_ channel: Double, _ stats: Stats) -> Double { channel / max((stats.red + stats.green + stats.blue) / 3, 0.01) }
        func gain(_ ref: Double, _ own: Double) -> Double { clamp(tint(ref, reference) / max(tint(own, photo), 0.01), 0.82, 1.22) }
        return Adjustment(exposure: exposure, contrast: contrast, saturation: saturation,
                          redGain: gain(reference.red, photo.red),
                          greenGain: gain(reference.green, photo.green),
                          blueGain: gain(reference.blue, photo.blue))
    }

    static func apply(_ adjustment: Adjustment, to image: UIImage) -> UIImage? {
        guard let input = CIImage(image: image) else { return nil }

        let matrix = CIFilter.colorMatrix()
        matrix.inputImage = input
        matrix.rVector = CIVector(x: adjustment.redGain, y: 0, z: 0, w: 0)
        matrix.gVector = CIVector(x: 0, y: adjustment.greenGain, z: 0, w: 0)
        matrix.bVector = CIVector(x: 0, y: 0, z: adjustment.blueGain, w: 0)

        let exposure = CIFilter.exposureAdjust()
        exposure.inputImage = matrix.outputImage
        exposure.ev = Float(adjustment.exposure)

        let controls = CIFilter.colorControls()
        controls.inputImage = exposure.outputImage
        controls.contrast = Float(adjustment.contrast)
        controls.saturation = Float(adjustment.saturation)
        controls.brightness = 0

        guard let output = controls.outputImage?.cropped(to: input.extent),
              let cgImage = context.createCGImage(output, from: input.extent) else { return nil }
        return UIImage(cgImage: cgImage, scale: image.scale, orientation: image.imageOrientation)
    }
}
