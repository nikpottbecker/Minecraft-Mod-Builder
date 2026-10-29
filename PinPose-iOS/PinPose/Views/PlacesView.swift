import MapKit
import SwiftUI

struct PlacesView: View {
    let idea: PlaceIdea
    var originalCoordinate: CLLocationCoordinate2D?

    @StateObject private var finder = PlaceFinder()
    @State private var position: MapCameraPosition = .userLocation(fallback: .automatic)

    var body: some View {
        VStack(spacing: 0) {
            Map(position: $position) {
                UserAnnotation()
                ForEach(finder.results, id: \.self) { item in
                    Marker(item.name ?? idea.title, systemImage: idea.icon, coordinate: item.placemark.coordinate)
                        .tint(.pink)
                }
                if let originalCoordinate {
                    Marker(String(localized: "Original-Ort"), systemImage: "star.fill", coordinate: originalCoordinate)
                        .tint(.yellow)
                }
            }
            .mapControls {
                MapUserLocationButton()
            }
            .frame(height: 320)

            List {
                if originalCoordinate != nil, idea.query.isEmpty {
                    Section {
                        Button {
                            openOriginal()
                        } label: {
                            Label("Route zum Original-Ort", systemImage: "arrow.triangle.turn.up.right.diamond.fill")
                        }
                    }
                }

                if finder.locationDenied {
                    Section {
                        Label("Erlaube den Standortzugriff in den Einstellungen, um Orte in deiner Nähe zu sehen.",
                              systemImage: "location.slash")
                            .font(.subheadline)
                    }
                }

                if finder.isSearching {
                    HStack {
                        ProgressView()
                        Text("Suche „\(idea.query)“ in deiner Nähe …")
                            .foregroundStyle(.secondary)
                    }
                } else if let message = finder.errorMessage {
                    Text(message).foregroundStyle(.secondary)
                }

                ForEach(finder.results, id: \.self) { item in
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(item.name ?? idea.title)
                                .font(.subheadline.bold())
                            if let address = item.placemark.title {
                                Text(address)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                                    .lineLimit(2)
                            }
                        }
                        Spacer()
                        if let distance = finder.distanceText(to: item) {
                            Text(distance)
                                .font(.caption.monospacedDigit())
                                .foregroundStyle(.secondary)
                        }
                        Button {
                            item.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDefault])
                        } label: {
                            Image(systemName: "arrow.triangle.turn.up.right.circle.fill")
                                .font(.title2)
                        }
                        .buttonStyle(.borderless)
                        .accessibilityLabel("Route")
                    }
                    .contentShape(Rectangle())
                    .onTapGesture {
                        withAnimation {
                            position = .item(item)
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
        }
        .navigationTitle(idea.title)
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if idea.query.isEmpty, let originalCoordinate {
                position = .region(MKCoordinateRegion(center: originalCoordinate,
                                                      latitudinalMeters: 2000, longitudinalMeters: 2000))
            } else {
                await finder.search(idea.query)
            }
        }
    }

    private func openOriginal() {
        guard let originalCoordinate else { return }
        let item = MKMapItem(placemark: MKPlacemark(coordinate: originalCoordinate))
        item.name = String(localized: "Original-Ort")
        item.openInMaps(launchOptions: [MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDefault])
    }
}
