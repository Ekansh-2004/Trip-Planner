import { useEffect, useRef } from "react";
import { Status, Wrapper } from "@googlemaps/react-wrapper";

// Renders the actual google.maps.Map. Kept separate from the Wrapper because
// the Maps JS globals (`window.google`) only exist once the Wrapper reports
// SUCCESS, so nothing in here may run before that.
const MapCanvas = ({ points }) => {
	const containerRef = useRef(null);
	const mapRef = useRef(null);
	const markersRef = useRef([]);

	// Create the map exactly once — recreating it on every points change would
	// reset the user's pan/zoom.
	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;
		mapRef.current = new window.google.maps.Map(containerRef.current, {
			zoom: 12,
			center: { lat: 0, lng: 0 },
			mapTypeControl: false,
			streetViewControl: false,
			fullscreenControl: false,
		});
	}, []);

	// Markers are torn down and rebuilt whenever the points change, so a
	// reorder/refetch never leaves stale pins behind.
	useEffect(() => {
		const map = mapRef.current;
		if (!map) return;

		markersRef.current.forEach((marker) => marker.setMap(null));
		markersRef.current = [];

		if (points.length === 0) return;

		const bounds = new window.google.maps.LatLngBounds();
		points.forEach((point) => {
			const position = { lat: point.lat, lng: point.lng };
			markersRef.current.push(
				new window.google.maps.Marker({
					map,
					position,
					title: point.title,
				}),
			);
			bounds.extend(position);
		});

		map.fitBounds(bounds, 48);

		// fitBounds on a single point zooms all the way in; clamp it back to
		// something that still shows the surrounding area.
		if (points.length === 1) {
			const listener = window.google.maps.event.addListenerOnce(map, "idle", () => {
				if (map.getZoom() > 15) map.setZoom(15);
			});
			return () => window.google.maps.event.removeListener(listener);
		}
	}, [points]);

	return (
		<div
			ref={containerRef}
			className="h-full w-full"
		/>
	);
};

const MapMessage = ({ children }) => <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm text-gray-500">{children}</div>;

// Wraps the map in its loading/error states and the shared frame. `points` is
// a flat list of { lat, lng, title } — the caller decides which days to
// include, so this component stays agnostic about itinerary shape.
const TripMap = ({ points = [], className = "" }) => {
	const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
	const validPoints = points.filter((point) => Number.isFinite(point?.lat) && Number.isFinite(point?.lng));

	const frame = `h-[400px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 ${className}`;

	if (!apiKey) {
		return (
			<div className={frame}>
				<MapMessage>Map unavailable — VITE_GOOGLE_MAPS_API_KEY is not set.</MapMessage>
			</div>
		);
	}

	if (validPoints.length === 0) {
		return (
			<div className={frame}>
				<MapMessage>No mapped locations for this trip yet.</MapMessage>
			</div>
		);
	}

	return (
		<div className={frame}>
			<Wrapper
				apiKey={apiKey}
				render={(status) => (status === Status.FAILURE ? <MapMessage>Couldn&apos;t load the map. Check that the Maps JavaScript API is enabled for this key.</MapMessage> : <MapMessage>Loading map…</MapMessage>)}
			>
				<MapCanvas points={validPoints} />
			</Wrapper>
		</div>
	);
};

export default TripMap;
