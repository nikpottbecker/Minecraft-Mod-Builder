import SwiftUI

/// Draws a pose on top of an image that is shown with the given content mode.
struct PoseSkeletonView: View {
    let pose: BodyPose
    let imageSize: CGSize
    var contentMode: ContentMode = .fit
    var color: Color = .pink
    var lineWidth: CGFloat = 4

    var body: some View {
        Canvas { context, size in
            guard imageSize.width > 0, imageSize.height > 0 else { return }
            let sx = size.width / imageSize.width
            let sy = size.height / imageSize.height
            let scale = contentMode == .fit ? min(sx, sy) : max(sx, sy)
            let drawn = CGSize(width: imageSize.width * scale, height: imageSize.height * scale)
            let origin = CGPoint(x: (size.width - drawn.width) / 2, y: (size.height - drawn.height) / 2)

            func map(_ point: CGPoint) -> CGPoint {
                CGPoint(x: origin.x + point.x * drawn.width, y: origin.y + point.y * drawn.height)
            }

            var bones = Path()
            for (a, b) in BodyPose.bones {
                if let pa = pose[a], let pb = pose[b] {
                    bones.move(to: map(pa))
                    bones.addLine(to: map(pb))
                }
            }

            context.addFilter(.shadow(color: .black.opacity(0.5), radius: 2))
            context.stroke(bones, with: .color(color.opacity(0.9)),
                           style: StrokeStyle(lineWidth: lineWidth, lineCap: .round, lineJoin: .round))

            // Head outline sized from the shoulders.
            if let nose = pose[.nose] {
                var radius = lineWidth * 4
                if let ls = pose[.leftShoulder], let rs = pose[.rightShoulder] {
                    let a = map(ls), b = map(rs)
                    radius = max(radius, hypot(a.x - b.x, a.y - b.y) * 0.35)
                }
                let center = map(nose)
                let head = Path(ellipseIn: CGRect(x: center.x - radius, y: center.y - radius, width: radius * 2, height: radius * 2))
                context.stroke(head, with: .color(color.opacity(0.9)), lineWidth: lineWidth * 0.8)
            }

            let dot = lineWidth * 1.1
            for point in pose.points.values {
                let c = map(point)
                context.fill(Path(ellipseIn: CGRect(x: c.x - dot, y: c.y - dot, width: dot * 2, height: dot * 2)),
                             with: .color(.white))
            }
        }
        .allowsHitTesting(false)
    }
}

/// Rule-of-thirds grid.
struct GridOverlay: View {
    var body: some View {
        Canvas { context, size in
            var path = Path()
            for i in 1...2 {
                let x = size.width * CGFloat(i) / 3
                let y = size.height * CGFloat(i) / 3
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
            }
            context.stroke(path, with: .color(.white.opacity(0.4)), lineWidth: 1)
        }
        .allowsHitTesting(false)
    }
}
