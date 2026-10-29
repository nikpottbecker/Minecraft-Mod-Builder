import CoreGraphics
import UIKit
import XCTest
@testable import PinPose

/// A person standing straight, arms down, facing the camera (normalized, top-left origin).
private func standingPose() -> BodyPose {
    BodyPose(points: [
        .nose: CGPoint(x: 0.5, y: 0.12), .neck: CGPoint(x: 0.5, y: 0.2), .root: CGPoint(x: 0.5, y: 0.5),
        .leftShoulder: CGPoint(x: 0.6, y: 0.22), .rightShoulder: CGPoint(x: 0.4, y: 0.22),
        .leftElbow: CGPoint(x: 0.62, y: 0.35), .rightElbow: CGPoint(x: 0.38, y: 0.35),
        .leftWrist: CGPoint(x: 0.63, y: 0.47), .rightWrist: CGPoint(x: 0.37, y: 0.47),
        .leftHip: CGPoint(x: 0.56, y: 0.5), .rightHip: CGPoint(x: 0.44, y: 0.5),
        .leftKnee: CGPoint(x: 0.56, y: 0.7), .rightKnee: CGPoint(x: 0.44, y: 0.7),
        .leftAnkle: CGPoint(x: 0.56, y: 0.9), .rightAnkle: CGPoint(x: 0.44, y: 0.9),
    ])
}

/// Same person with the left arm stretched up and out.
private func armUpPose() -> BodyPose {
    var pose = standingPose()
    pose.points[.leftElbow] = CGPoint(x: 0.68, y: 0.12)
    pose.points[.leftWrist] = CGPoint(x: 0.74, y: 0.03)
    return pose
}

final class PoseMatcherTests: XCTestCase {
    func testIdenticalPoseScoresFull() throws {
        let score = try XCTUnwrap(PoseMatcher.score(live: standingPose(), liveAspect: 0.75,
                                                    reference: standingPose(), referenceAspect: 0.75))
        XCTAssertEqual(score, 1, accuracy: 0.001)
    }

    func testMirroredPoseCountsAsMatch() throws {
        let score = try XCTUnwrap(PoseMatcher.score(live: armUpPose().mirrored(), liveAspect: 0.75,
                                                    reference: armUpPose(), referenceAspect: 0.75))
        XCTAssertEqual(score, 1, accuracy: 0.001)
    }

    func testDifferentPoseScoresLower() throws {
        let score = try XCTUnwrap(PoseMatcher.score(live: standingPose(), liveAspect: 0.75,
                                                    reference: armUpPose(), referenceAspect: 0.75))
        XCTAssertLessThan(score, 0.9)
        XCTAssertGreaterThan(score, 0.5)
    }

    func testTooFewJointsGivesNil() {
        let tiny = BodyPose(points: [.nose: CGPoint(x: 0.5, y: 0.1), .neck: CGPoint(x: 0.5, y: 0.2)])
        XCTAssertNil(PoseMatcher.score(live: tiny, liveAspect: 0.75, reference: standingPose(), referenceAspect: 0.75))
    }
}

final class PoseCoachTests: XCTestCase {
    func testHighScoreMeansHold() {
        let hint = PoseCoach.hint(live: standingPose(), liveAspect: 0.75, reference: standingPose(),
                                  referenceAspect: 0.75, score: 0.9)
        XCTAssertEqual(hint, .hold)
    }

    func testRaisedArmAsksToMoveArmUp() throws {
        let hint = try XCTUnwrap(PoseCoach.hint(live: standingPose(), liveAspect: 0.75, reference: armUpPose(),
                                                referenceAspect: 0.75, score: 0.6))
        XCTAssertTrue(hint.text.hasSuffix("höher"), hint.text)
        XCTAssertTrue(hint.text.contains("Hand") || hint.text.contains("Ellbogen"), hint.text)
    }

    func testLoweringArmAsksToMoveDown() throws {
        let hint = try XCTUnwrap(PoseCoach.hint(live: armUpPose(), liveAspect: 0.75, reference: standingPose(),
                                                referenceAspect: 0.75, score: 0.6))
        XCTAssertTrue(hint.text.hasSuffix("tiefer"), hint.text)
    }

    func testSamePoseWithoutScoreHasNoCorrection() {
        let hint = PoseCoach.hint(live: standingPose(), liveAspect: 0.75, reference: standingPose(),
                                  referenceAspect: 0.75, score: nil)
        XCTAssertNil(hint)
    }
}

final class BodyPoseTests: XCTestCase {
    func testMirrorSwapsSides() throws {
        let mirrored = standingPose().mirrored()
        let left = try XCTUnwrap(mirrored[.leftShoulder])
        XCTAssertEqual(left.x, 0.6, accuracy: 0.0001)
        XCTAssertEqual(mirrored.mirrored(), standingPose())
    }

    func testFraming() {
        XCTAssertEqual(Framing(pose: standingPose()), .fullBody)
        var waist = standingPose()
        for joint in [Joint.leftKnee, .rightKnee, .leftAnkle, .rightAnkle] { waist.points[joint] = nil }
        XCTAssertEqual(Framing(pose: waist), .waist)
    }

    func testStandingIsNotSitting() {
        XCTAssertFalse(standingPose().isSitting)
    }
}

final class PoseDescriberTests: XCTestCase {
    func testStandingPoseGivesAdvice() {
        let advice = PoseDescriber(pose: standingPose(), aspect: 0.75).advice()
        XCTAssertFalse(advice.isEmpty)
    }
}

final class ShotAdvisorTests: XCTestCase {
    func testZoomSnapsToLensSteps() {
        XCTAssertEqual(ShotAdvisor.snap(2.1), 2)
        XCTAssertEqual(ShotAdvisor.snap(0.6), 0.5)
        XCTAssertEqual(ShotAdvisor.snap(4.2), 5)
        XCTAssertEqual(ShotAdvisor.zoomLabel(0.5), "0,5×")
        XCTAssertEqual(ShotAdvisor.zoomLabel(3), "3×")
    }
}

final class SunCalculatorTests: XCTestCase {
    func testBerlinMidsummer() throws {
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(identifier: "UTC")!
        let date = try XCTUnwrap(utc.date(from: DateComponents(year: 2026, month: 6, day: 21, hour: 12)))
        let times = try XCTUnwrap(SunCalculator.sunTimes(on: date, latitude: 52.52, longitude: 13.405))
        // Reference: sunrise 02:43 UTC, sunset 19:33 UTC.
        let sunrise = utc.dateComponents([.hour, .minute], from: times.sunrise)
        let sunset = utc.dateComponents([.hour, .minute], from: times.sunset)
        XCTAssertEqual(Double(sunrise.hour! * 60 + sunrise.minute!), 163, accuracy: 10)
        XCTAssertEqual(Double(sunset.hour! * 60 + sunset.minute!), 1173, accuracy: 10)
        XCTAssertEqual(times.eveningGoldenHour.end, times.sunset)
    }

    func testPolarDayHasNoSunset() throws {
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(identifier: "UTC")!
        let date = try XCTUnwrap(utc.date(from: DateComponents(year: 2026, month: 6, day: 21, hour: 12)))
        XCTAssertNil(SunCalculator.sunTimes(on: date, latitude: 80, longitude: 15))
    }
}

final class PinterestImporterTests: XCTestCase {
    func testFindsLinkInSharedText() {
        let url = PinterestImporter.firstURL(in: "Schau mal: https://pin.it/3abcDEF super Look")
        XCTAssertEqual(url?.host, "pin.it")
    }

    func testNoLink() {
        XCTAssertNil(PinterestImporter.firstURL(in: "kein Link hier"))
    }

    func testPrefersOriginalImageSize() throws {
        let html = #"<html><head><meta property="og:image" content="https://i.pinimg.com/236x/ab/cd/ef/abcdef.jpg"></head></html>"#
        let candidates = PinterestImporter.imageCandidates(in: html)
        XCTAssertEqual(candidates.first?.absoluteString, "https://i.pinimg.com/originals/ab/cd/ef/abcdef.jpg")
        XCTAssertTrue(candidates.contains { $0.absoluteString.contains("/736x/") })
    }
}

final class LookTests: XCTestCase {
    private func sampleLook() -> Look {
        let analysis = ShotAnalysis(imageWidth: 750, imageHeight: 1000, pose: standingPose(), framing: .fullBody,
                                    poseAdvice: [], cameraAdvice: [], lightAdvice: [], compositionAdvice: [],
                                    places: [], sceneLabels: [], exif: nil, recommendedZoom: 1,
                                    recommendedExposureBias: 0)
        return Look(id: UUID(), title: "Test", createdAt: Date(), analysis: analysis, bestScore: nil)
    }

    func testOldLibraryWithoutShotsStillDecodes() throws {
        let data = try JSONEncoder().encode([sampleLook()])
        var json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [[String: Any]])
        json[0].removeValue(forKey: "savedShots")
        let decoded = try JSONDecoder().decode([Look].self, from: JSONSerialization.data(withJSONObject: json))
        XCTAssertEqual(decoded.first?.shots, [])
        XCTAssertFalse(decoded[0].isRecreated)
    }

    func testBestShotPrefersHighestScore() {
        var look = sampleLook()
        let low = Shot(id: UUID(), createdAt: Date(), score: 0.6)
        let high = Shot(id: UUID(), createdAt: Date().addingTimeInterval(-60), score: 0.9)
        let unscored = Shot(id: UUID(), createdAt: Date().addingTimeInterval(60), score: nil)
        look.savedShots = [unscored, low, high]
        XCTAssertEqual(look.bestShot?.id, high.id)
    }
}

final class CollageRendererTests: XCTestCase {
    func testCollageHasInstagramSize() {
        let image = UIGraphicsImageRenderer(size: CGSize(width: 30, height: 40)).image { context in
            UIColor.red.setFill()
            context.fill(CGRect(x: 0, y: 0, width: 30, height: 40))
        }
        let collage = CollageRenderer.render(reference: image, photo: image, score: 0.9)
        XCTAssertEqual(collage.size.width * collage.scale, 1080)
        XCTAssertEqual(collage.size.height * collage.scale, 1350)
    }
}

final class ColorMatcherTests: XCTestCase {
    private func flat(_ r: UInt8, _ g: UInt8, _ b: UInt8, count: Int = 16) -> [UInt8] {
        Array((0..<count).flatMap { _ in [r, g, b, 255] })
    }

    func testSameStatsNeedNoChange() throws {
        let stats = try XCTUnwrap(ColorMatcher.stats(rgba: flat(120, 100, 80) + flat(200, 180, 160)))
        let adjustment = ColorMatcher.adjustment(from: stats, to: stats)
        XCTAssertEqual(adjustment.exposure, 0, accuracy: 0.001)
        XCTAssertEqual(adjustment.contrast, 1, accuracy: 0.001)
        XCTAssertEqual(adjustment.saturation, 1, accuracy: 0.001)
        XCTAssertEqual(adjustment.redGain, 1, accuracy: 0.001)
    }

    func testDarkerReferenceLowersExposureAndWarmerAddsRed() throws {
        let photo = try XCTUnwrap(ColorMatcher.stats(rgba: flat(150, 150, 150) + flat(170, 170, 170)))
        let reference = try XCTUnwrap(ColorMatcher.stats(rgba: flat(90, 60, 40) + flat(110, 80, 60)))
        let adjustment = ColorMatcher.adjustment(from: photo, to: reference)
        XCTAssertLessThan(adjustment.exposure, 0)
        XCTAssertGreaterThan(adjustment.redGain, 1)
        XCTAssertLessThan(adjustment.blueGain, 1)
        XCTAssertGreaterThanOrEqual(adjustment.redGain, 0.82)
        XCTAssertLessThanOrEqual(adjustment.redGain, 1.22)
    }

    func testStrengthZeroIsIdentity() {
        let adjustment = ColorMatcher.Adjustment(exposure: 0.8, contrast: 1.3, saturation: 0.5,
                                                 redGain: 1.2, greenGain: 0.9, blueGain: 0.85)
        XCTAssertEqual(adjustment.scaled(by: 0), .identity)
    }
}

final class ReminderTests: XCTestCase {
    func testNextGoldenHourIsInTheFutureWithLeadTime() throws {
        let now = Date()
        let start = try XCTUnwrap(Reminders.nextGoldenHour(after: now, latitude: 51.5, longitude: 6.3))
        XCTAssertGreaterThan(start.addingTimeInterval(-Reminders.leadTime), now)
        XCTAssertLessThan(start.timeIntervalSince(now), 3 * 24 * 3600)
    }
}

final class PoseIdeaTests: XCTestCase {
    func testIdeasHaveFullBodyAndMatchThemselves() throws {
        for idea in PoseIdea.all {
            XCTAssertEqual(Framing(pose: idea.pose), .fullBody, idea.title)
            let score = try XCTUnwrap(PoseMatcher.score(live: idea.pose, liveAspect: 0.75,
                                                        reference: idea.pose, referenceAspect: 0.75))
            XCTAssertEqual(score, 1, accuracy: 0.001, idea.title)
            XCTAssertFalse(idea.analysis().poseAdvice.isEmpty, idea.title)
        }
    }

    func testIdeasAreDistinct() {
        let ids = PoseIdea.all.map(\.id)
        XCTAssertEqual(Set(ids).count, ids.count)
    }

    func testReferenceImageSize() {
        let image = PoseIdea.all[0].referenceImage()
        XCTAssertEqual(image.size.width * image.scale, PoseIdea.imageSize.width)
    }
}

final class FramingHintTests: XCTestCase {
    /// The standing pose shrunk around its centre, like a person further away.
    private func scaled(_ pose: BodyPose, by factor: CGFloat, dx: CGFloat = 0) -> BodyPose {
        BodyPose(points: pose.points.mapValues { CGPoint(x: 0.5 + ($0.x - 0.5) * factor + dx, y: 0.5 + ($0.y - 0.5) * factor) })
    }

    private func hint(live: BodyPose, front: Bool = false) -> String? {
        PoseCoach.hint(live: live, liveAspect: 0.75, reference: standingPose(), referenceAspect: 0.75, score: 0.95,
                       framing: .init(screenPose: live, referenceMirrored: false, frontCamera: front))?.text
    }

    func testTooSmallAsksToComeCloser() {
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 0.5)), "Einen Schritt näher ran")
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 0.5), front: true), "Näher an die Kamera")
    }

    func testTooBigAsksToStepBack() {
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 1.6)), "Einen Schritt zurück")
    }

    func testOffCentreAsksToPan() {
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 1, dx: 0.3)), "Kamera etwas nach rechts schwenken")
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 1, dx: 0.3), front: true), "Etwas nach links gehen")
    }

    func testRightSizeAndPlaceHolds() {
        XCTAssertEqual(hint(live: scaled(standingPose(), by: 1.05)), PoseHint.hold.text)
    }
}
