import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const PlaceDetailsPage = () => {
	const { placeId } = useParams();
	const location = useLocation();
	const navigate = useNavigate();

	const { place, type, userLocation } = location.state || {};

	const [locationInfo, setLocationInfo] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetchLocationInfo();
	}, []);

	const fetchLocationInfo = async () => {
		if (!userLocation || !place?.latitude || !place?.longitude) {
			setLoading(false);
			return;
		}

		try {
			const response = await axios.get(`http://localhost:3000/api/location-info/${placeId}`, {
				params: {
					userLat: userLocation.lat,
					userLng: userLocation.lng,
					destLat: place.latitude,
					destLng: place.longitude,
				},
			});

			if (response.data.success) {
				setLocationInfo(response.data.data);
			}
		} catch (error) {
			console.error("Location info error:", error);
		} finally {
			setLoading(false);
		}
	};

	const getTypeIcon = () => {
		switch (type) {
			case "hotels":
				return "🏨";
			case "restaurants":
				return "🍽️";
			case "attractions":
				return "🎯";
			default:
				return "📍";
		}
	};

	if (!place) {
		return (
			<div className="min-h-screen bg-gray-100 flex items-center justify-center">
				<div className="text-center">
					<p className="text-gray-600">Place not found</p>
					<button
						onClick={() => navigate("/")}
						className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
					>
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* Header */}
				<div className="flex items-center mb-6">
					<button
						onClick={() => navigate("/")}
						className="bg-white p-2 rounded-lg shadow hover:shadow-md mr-4"
					>
						← Back
					</button>
					<h1 className="text-3xl font-bold text-gray-800">Place Details</h1>
				</div>

				{/* Place Info Card */}
				<div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
					<div className="flex items-start gap-4 mb-6">
						<div className="text-4xl">{getTypeIcon()}</div>
						<div className="flex-1">
							<h2 className="text-2xl font-bold text-gray-800 mb-2">{place.name}</h2>
							<p className="text-gray-600 flex items-center mb-4">
								<span className="mr-2">📍</span>
								{place.address}
							</p>

							<div className="flex flex-wrap gap-4 text-sm">
								{place.rating !== "N/A" && <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">⭐ {place.rating}</span>}
								{place.distance && <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">📏 {place.distance} km</span>}
								<span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full capitalize">
									{type?.slice(0, -1)} {/* Remove 's' from hotels/restaurants */}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Loading State */}
				{loading && (
					<div className="bg-white rounded-2xl shadow-lg p-8">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
							<p className="text-gray-600">Loading traffic and weather info...</p>
						</div>
					</div>
				)}

				{/* Traffic & Weather Info */}
				{!loading && locationInfo && (
					<div className="grid md:grid-cols-2 gap-8">
						{/* Traffic Info */}
						{locationInfo.traffic && (
							<div className="bg-white rounded-2xl shadow-lg p-8">
								<h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
									🚗 <span className="ml-3">Traffic Information</span>
								</h3>

								<div className="space-y-4">
									<div className="bg-blue-50 rounded-lg p-4">
										<div className="text-3xl font-bold text-blue-600 mb-1">{locationInfo.traffic.duration}</div>
										<div className="text-blue-500 text-sm">Travel Time</div>
									</div>

									<div className="bg-purple-50 rounded-lg p-4">
										<div className="text-2xl font-bold text-purple-600 mb-1">{locationInfo.traffic.distance}</div>
										<div className="text-purple-500 text-sm">Distance</div>
									</div>

									{locationInfo.traffic.delayMinutes > 0 && (
										<div className={`rounded-lg p-4 text-center ${locationInfo.traffic.trafficCondition === "light" ? "bg-green-100 text-green-800" : locationInfo.traffic.trafficCondition === "moderate" ? "bg-yellow-100 text-yellow-800" : locationInfo.traffic.trafficCondition === "heavy" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"}`}>
											<div className="text-xl font-bold mb-1">+{locationInfo.traffic.delayMinutes} min</div>
											<div className="text-sm capitalize">{locationInfo.traffic.trafficCondition} Traffic</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Weather Info */}
						{locationInfo.weather && (
							<div className="bg-white rounded-2xl shadow-lg p-8">
								<h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
									🌤️ <span className="ml-3">Weather Information</span>
								</h3>

								<div className="text-center mb-6">
									<div className="text-5xl font-bold text-blue-600 mb-2">{locationInfo.weather.temperature}°C</div>
									<div className="text-gray-600 capitalize text-lg">{locationInfo.weather.description}</div>
									<div className="text-gray-500 mt-2">Feels like {locationInfo.weather.feelsLike}°C</div>
								</div>

								<div className="grid grid-cols-2 gap-4 text-sm">
									<div className="bg-gray-50 rounded-lg p-3 text-center">
										<div className="text-lg font-semibold text-gray-700">{locationInfo.weather.humidity}%</div>
										<div className="text-gray-500">Humidity</div>
									</div>

									<div className="bg-gray-50 rounded-lg p-3 text-center">
										<div className="text-lg font-semibold text-gray-700">{locationInfo.weather.windSpeed} m/s</div>
										<div className="text-gray-500">Wind Speed</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}

				{/* No Data Message */}
				{!loading && !locationInfo?.traffic && !locationInfo?.weather && (
					<div className="bg-white rounded-2xl shadow-lg p-8 text-center">
						<div className="text-4xl mb-4">⚠️</div>
						<p className="text-gray-600">Unable to fetch traffic and weather information</p>
					</div>
				)}
			</div>
		</div>
	);
};

export default PlaceDetailsPage;
