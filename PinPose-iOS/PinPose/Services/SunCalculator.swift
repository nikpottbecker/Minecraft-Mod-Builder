import Foundation

/// Sunrise/sunset from the NOAA solar equations (accurate to a few minutes, which is plenty for planning a shoot).
enum SunCalculator {
    struct SunTimes {
        var sunrise: Date
        var sunset: Date

        var morningGoldenHour: DateInterval { DateInterval(start: sunrise, duration: 60 * 60) }
        var eveningGoldenHour: DateInterval { DateInterval(start: sunset.addingTimeInterval(-60 * 60), end: sunset) }
        var eveningBlueHour: DateInterval { DateInterval(start: sunset, duration: 30 * 60) }
    }

    /// Returns nil during polar day or polar night.
    static func sunTimes(on date: Date, latitude: Double, longitude: Double) -> SunTimes? {
        var utc = Calendar(identifier: .gregorian)
        utc.timeZone = TimeZone(identifier: "UTC")!
        let dayOfYear = Double(utc.ordinality(of: .day, in: .year, for: date) ?? 1)

        let g = 2 * Double.pi / 365 * (dayOfYear - 1)
        let equationOfTime = 229.18 * (0.000075 + 0.001868 * cos(g) - 0.032077 * sin(g)
                                       - 0.014615 * cos(2 * g) - 0.040849 * sin(2 * g))
        let declination = 0.006918 - 0.399912 * cos(g) + 0.070257 * sin(g) - 0.006758 * cos(2 * g)
            + 0.000907 * sin(2 * g) - 0.002697 * cos(3 * g) + 0.00148 * sin(3 * g)

        let lat = latitude * .pi / 180
        let zenith = 90.833 * Double.pi / 180
        let cosHourAngle = cos(zenith) / (cos(lat) * cos(declination)) - tan(lat) * tan(declination)
        guard (-1...1).contains(cosHourAngle) else { return nil }
        let hourAngle = acos(cosHourAngle) * 180 / .pi

        // Minutes after UTC midnight.
        let sunriseMinutes = 720 - 4 * (longitude + hourAngle) - equationOfTime
        let sunsetMinutes = 720 - 4 * (longitude - hourAngle) - equationOfTime
        let midnight = utc.startOfDay(for: date)
        return SunTimes(sunrise: midnight.addingTimeInterval(sunriseMinutes * 60),
                        sunset: midnight.addingTimeInterval(sunsetMinutes * 60))
    }
}
