import axios from "axios";
import { useEffect, useState } from "react";
import LoadingSpinner from "./LoadingSpinner";
import PlaceCard from "./PlaceCard";

// Haversine distance calculation function
const calculateDistance = (lat1, lng1, lat2, lng2) => {
	const R = 6371; // Radius of the Earth in kilometers
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const LocationSearch = () => {
	// State management
	const [location, setLocation] = useState("");
	const [coordinates, setCoordinates] = useState(null);
	const [radius, setRadius] = useState(2000);
	const [activeTab, setActiveTab] = useState("hotels");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	// Data states
	const [hotels, setHotels] = useState([]);
	const [restaurants, setRestaurants] = useState([]);
	const [attractions, setAttractions] = useState([]);

	const API_BASE_URL = "http://localhost:3000/api/places";

	// Get coordinates from location name
	const getCoordinates = async () => {
		if (!location.trim()) {
			setError("Please enter a location");
			return;
		}

		setLoading(true);
		setError("");

		try {
			const response = await axios.post(`${API_BASE_URL}/coordinates`, {
				location: location.trim(),
			});

			const { lat, lng } = response.data;
			setCoordinates({ lat, lng });

			// Automatically fetch all data once coordinates are available
			await fetchAllData(lat, lng);
		} catch (err) {
			console.error("Error getting coordinates:", err);
			setError(err.response?.data?.details || "Failed to get location coordinates");
		} finally {
			setLoading(false);
		}
	};

	// Fetch all data (hotels, restaurants, attractions)
	const fetchAllData = async (lat, lng, customRadius) => {
		setLoading(true);

		let hotelsData = [];
		let restaurantsData = [];
		let attractionsData = [];

		try {
			const requestData = { lat, lng, radius: customRadius || radius, city: location };

			// Fetch hotels
			try {
				const hotelsResponse = await axios.post(`${API_BASE_URL}/hotels`, requestData);
				hotelsData =
					hotelsResponse.data?.map((hotel) => ({
						...hotel,
						distance: calculateDistance(lat, lng, hotel.latitude, hotel.longitude).toFixed(2),
					})) || [];
				setHotels(hotelsData);
			} catch (hotelErr) {
				console.error("Error fetching hotels:", hotelErr);
				setHotels([]);
			}

			// Fetch restaurants
			try {
				const restaurantsResponse = await axios.post(`${API_BASE_URL}/restaurants`, requestData);
				restaurantsData =
					restaurantsResponse.data.data?.map((restaurant) => ({
						...restaurant,
						distance: calculateDistance(lat, lng, restaurant.latitude, restaurant.longitude).toFixed(2),
					})) || [];
				setRestaurants(restaurantsData);
			} catch (restErr) {
				console.error("Error fetching restaurants:", restErr);
				setRestaurants([]);
			}

			// Fetch attractions
			try {
				const attractionsResponse = await axios.post(`${API_BASE_URL}/attractions`, requestData);
				attractionsData = (attractionsResponse.data.data || []).map((attraction) => ({
					...attraction,
					distance: calculateDistance(lat, lng, attraction.latitude, attraction.longitude).toFixed(2),
				}));
				setAttractions(attractionsData);
			} catch (attrErr) {
				console.error("Error fetching attractions:", attrErr);
				setAttractions([]);
			}

			// ✅ Fixed: Use newly fetched data, not state variables
			const searchResults = {
				location,
				coordinates: { lat, lng },
				hotels: hotelsData, // ← Use fetched data
				restaurants: restaurantsData, // ← Use fetched data
				attractions: attractionsData, // ← Use fetched data
				timestamp: Date.now(),
			};

			sessionStorage.setItem("searchResults", JSON.stringify(searchResults));
		} catch (err) {
			console.error("Error fetching data:", err);
			setError("Failed to fetch location data");
		} finally {
			setLoading(false);
		}
	};

	// Update radius and refetch data
	const handleRadiusChange = (newRadius) => {
		setRadius(newRadius);
		if (coordinates) {
			fetchAllData(coordinates.lat, coordinates.lng, newRadius);
		}
	};

	// Get current data based on active tab
	const getCurrentData = () => {
		switch (activeTab) {
			case "hotels":
				return hotels;
			case "restaurants":
				return restaurants;
			case "attractions":
				return attractions;
			default:
				return [];
		}
	};

	useEffect(() => {
		const savedResults = sessionStorage.getItem("searchResults");
		if (savedResults) {
			const data = JSON.parse(savedResults);
			// Check if data is recent (less than 1 hour old)
			if (Date.now() - data.timestamp < 3600000) {
				setLocation(data.location);
				setCoordinates(data.coordinates);
				setHotels(data.hotels);
				setRestaurants(data.restaurants);
				setAttractions(data.attractions);
			}
		}
	}, []);

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			{/* Search Section */}
			<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 mb-8">
				<div className="flex flex-col md:flex-row gap-4 mb-6">
					<input
						type="text"
						value={location}
						onChange={(e) => setLocation(e.target.value)}
						placeholder="Enter your location (e.g., Connaught Place, New Delhi)"
						className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors duration-300 text-lg"
						onKeyPress={(e) => e.key === "Enter" && getCoordinates()}
					/>
					<button
						onClick={getCoordinates}
						disabled={loading}
						className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						{loading ? "Searching..." : "Search"}
					</button>
				</div>

				{/* Radius Selector */}
				{coordinates && (
					<div className="flex items-center gap-4 mb-4">
						<label className="text-gray-700 font-medium">Search Radius:</label>
						<select
							value={radius}
							onChange={(e) => handleRadiusChange(Number(e.target.value))}
							className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors duration-300"
						>
							<option value={1000}>1 KM</option>
							<option value={2000}>2 KM</option>
							<option value={5000}>5 KM</option>
							<option value={10000}>10 KM</option>
						</select>
					</div>
				)}

				{/* Error Display */}
				{error && (
					<div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-4">
						<div className="flex items-center">
							<span className="mr-2">⚠️</span>
							{error}
						</div>
					</div>
				)}

				{/* Coordinates Display */}
				{coordinates && (
					<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl">
						<div className="flex items-center font-mono">
							<span className="mr-2">📍</span>
							Location: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
						</div>
					</div>
				)}
			</div>

			{/* Results Section */}
			{coordinates && (
				<div className="space-y-6">
					{/* Tab Navigation */}
					<div className="flex flex-wrap justify-center gap-3">
						<button
							className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${activeTab === "hotels" ? "bg-white text-blue-600 shadow-lg" : "bg-white/70 text-gray-700 hover:bg-white/90"}`}
							onClick={() => setActiveTab("hotels")}
						>
							🏨 Hotels ({hotels.length})
						</button>
						<button
							className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${activeTab === "restaurants" ? "bg-white text-blue-600 shadow-lg" : "bg-white/70 text-gray-700 hover:bg-white/90"}`}
							onClick={() => setActiveTab("restaurants")}
						>
							🍽️ Restaurants ({restaurants.length})
						</button>
						<button
							className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 transform hover:scale-105 ${activeTab === "attractions" ? "bg-white text-blue-600 shadow-lg" : "bg-white/70 text-gray-700 hover:bg-white/90"}`}
							onClick={() => setActiveTab("attractions")}
						>
							🎯 Attractions ({attractions.length})
						</button>
					</div>
					{/* Loading Spinner */}
					{loading && <LoadingSpinner />}
					{/* Results Grid */}

					{!loading && (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{getCurrentData().length > 0 ? (
								getCurrentData().map((place, index) => (
									<PlaceCard
										key={place.placeId || index}
										place={place}
										type={activeTab}
										userLocation={coordinates} // ✅ Pass user location
									/>
								))
							) : (
								<div className="col-span-full text-center py-12 text-gray-500">
									<div className="text-4xl mb-4">🔍</div>
									<p>No {activeTab} found in this area</p>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default LocationSearch;
