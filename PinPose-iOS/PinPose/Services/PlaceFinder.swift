import CoreLocation
import MapKit

/// Finds matching photo spots near the user via Apple Maps search.
@MainActor
final class PlaceFinder: NSObject, ObservableObject, CLLocationManagerDelegate {
    @Published private(set) var userLocation: CLLocation?
    @Published private(set) var results: [MKMapItem] = []
    @Published private(set) var isSearching = false
    @Published private(set) var locationDenied = false
    @Published private(set) var errorMessage: String?

    private let manager = CLLocationManager()
    private var locationFailed = false

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyHundredMeters
    }

    func search(_ query: String) async {
        guard !query.isEmpty else { return }
        isSearching = true
        errorMessage = nil
        defer { isSearching = false }

        requestLocation()
        let location = await waitForLocation(timeout: 6)

        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = query
        if let location {
            request.region = MKCoordinateRegion(center: location.coordinate,
                                                latitudinalMeters: 25_000, longitudinalMeters: 25_000)
        }
        do {
            let response = try await MKLocalSearch(request: request).start()
            var items = response.mapItems
            if let location {
                items.sort { distance(of: $0, from: location) < distance(of: $1, from: location) }
            }
            results = Array(items.prefix(25))
            if results.isEmpty { errorMessage = "Keine passenden Orte in der Nähe gefunden." }
        } catch {
            results = []
            errorMessage = "Keine passenden Orte gefunden. Versuch es später noch einmal."
        }
    }

    func distanceText(to item: MKMapItem) -> String? {
        guard let userLocation, let location = item.placemark.location else { return nil }
        let meters = userLocation.distance(from: location)
        if meters < 1000 { return "\(Int(meters.rounded())) m" }
        return String(format: "%.1f km", meters / 1000).replacingOccurrences(of: ".", with: ",")
    }

    private func distance(of item: MKMapItem, from location: CLLocation) -> CLLocationDistance {
        item.placemark.location?.distance(from: location) ?? .greatestFiniteMagnitude
    }

    private func requestLocation() {
        switch manager.authorizationStatus {
        case .notDetermined:
            manager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            manager.requestLocation()
        default:
            locationDenied = true
        }
    }

    private func waitForLocation(timeout: TimeInterval) async -> CLLocation? {
        let start = Date()
        while userLocation == nil, !locationDenied, !locationFailed, Date().timeIntervalSince(start) < timeout {
            try? await Task.sleep(nanoseconds: 200_000_000)
        }
        return userLocation
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor in
            switch status {
            case .authorizedWhenInUse, .authorizedAlways:
                self.locationDenied = false
                self.manager.requestLocation()
            case .denied, .restricted:
                self.locationDenied = true
            default:
                break
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor in self.userLocation = location }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.locationFailed = true }
    }
}
