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
