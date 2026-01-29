// src/components/LocationSearch.jsx

import axios from "axios";
import { useState } from "react";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";
import PlaceCard from "./PlaceCard";

const calculateDistance = (lat1, lng1, lat2, lng2) => {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

const LocationSearch = ({ location, setLocation, coordinates, setCoordinates, radius, setRadius, hotels, setHotels, restaurants, setRestaurants, attractions, setAttractions }) => {
	const [activeTab, setActiveTab] = useState("hotels");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showAll, setShowAll] = useState(false);

	const getCoordinates = async () => {
		if (!location.trim()) {
			setError("Please enter a location");
			return;
		}
		setLoading(true);
		setError("");
		setHotels([]);
		setRestaurants([]);
		setAttractions([]);

		try {
			const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geocode`, {
				params: { location: location.trim() },
			});
			const { lat, lng } = response.data;
			setCoordinates({ lat, lng });
			await fetchAllData(lat, lng, radius);
		} catch (err) {
			console.error("Error getting coordinates:", err);
			setError(err.response?.data?.details || "Failed to get location coordinates");
			setCoordinates(null);
			setLoading(false);
		}
	};

	const fetchAllData = async (lat, lng, currentRadius) => {
		setLoading(true);
		try {
			const types = ["hotels", "restaurants", "attractions"];
			const requests = types.map((type) =>
				axios
					.post(
						`${process.env.REACT_APP_API_URL}/api/places/${type}`,
						{
							lat,
							lng,
							radius: currentRadius,
							city: location,
						},
						{ withCredentials: true },
					)
					.catch((err) => {
						console.error(`Failed to fetch ${type}:`, err);
						return { data: {} };
					}),
			);

			const responses = await Promise.all(requests);

			const hotelResults = (responses[0].data || []).map((place) => ({
				...place,
				distance: calculateDistance(lat, lng, place.latitude, place.longitude).toFixed(2),
			}));

			const restaurantResults = (responses[1].data.data || []).map((place) => ({
				...place,
				distance: calculateDistance(lat, lng, place.latitude, place.longitude).toFixed(2),
			}));

			const attractionResults = (responses[2].data.data || []).map((place) => ({
				...place,
				distance: calculateDistance(lat, lng, place.latitude, place.longitude).toFixed(2),
			}));

			setHotels(hotelResults);
			setRestaurants(restaurantResults);
			setAttractions(attractionResults);
		} catch (err) {
			console.error("An error occurred while fetching place data:", err);
			setError("Could not fetch place details. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleRadiusChange = (newRadius) => {
		setRadius(newRadius);
		if (coordinates) {
			fetchAllData(coordinates.lat, coordinates.lng, newRadius);
		}
	};

	const tabDetails = {
		hotels: { label: "Hotels", data: hotels },
		restaurants: { label: "Restaurants", data: restaurants },
		attractions: { label: "Attractions", data: attractions },
	};

	const handleCategoryChange = (key) => {
		setActiveTab(key);
		setShowAll(false);
	};

	const allCurrentData = tabDetails[activeTab]?.data || [];
	const displayedData = showAll ? allCurrentData : allCurrentData.slice(0, 3);

	return (
		<div className="max-w-7xl mx-auto px-4 py-8">
			<div className="text-center mb-12">
				<h1 className="text-5xl sm:text-6xl font-extrabold text-[#212529] tracking-tight">Explore Nearby</h1>
				<p className="mt-4 text-xl text-[#6C757D] max-w-2xl mx-auto">Discover the best places around you, tailored to your taste.</p>
			</div>

			<div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-12 border border-[#DEE2E6]">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
					<div>
						<label
							className="block text-sm font-medium text-[#212529] mb-2"
							htmlFor="location"
						>
							Your Location
						</label>
						<div className="relative">
							<input
								className="w-full pl-4 pr-4 py-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all duration-300"
								id="location"
								name="location"
								placeholder="e.g., Connaught Place, New Delhi"
								type="text"
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && getCoordinates()}
							/>
						</div>
					</div>
					<div>
						<label
							className="block text-sm font-medium text-[#212529] mb-2"
							htmlFor="radius"
						>
							Search Radius
						</label>
						<div className="relative">
							<select
								className="w-full appearance-none pl-4 pr-10 py-3 bg-[#F8F9FA] border border-[#DEE2E6] rounded-xl focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent transition-all duration-300"
								id="radius"
								name="radius"
								value={radius}
								onChange={(e) => handleRadiusChange(Number(e.target.value))}
							>
								<option value={1000}>Within 1 km</option>
								<option value={2000}>Within 2 km</option>
								<option value={5000}>Within 5 km</option>
								<option value={10000}>Within 10 km</option>
							</select>
							<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[#6C757D] pointer-events-none">expand_more</span>
						</div>
					</div>
				</div>
				<div className="mt-6">
					<button
						onClick={getCoordinates}
						disabled={loading}
						className="w-full px-8 py-3 bg-[#FF6B35] text-white font-semibold rounded-xl hover:bg-[#E65C2E] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
					>
						{loading ? "Searching..." : "Search Places"}
					</button>
				</div>
				{error && (
					<div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-xl mt-6">
						<div className="flex items-center">
							<span className="mr-2">⚠️</span>
							{error}
						</div>
					</div>
				)}
				{coordinates && !error && !loading && (
					<div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-xl mt-6">
						<div className="flex items-center font-mono">
							<span className="mr-2">📍</span>Showing results for: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
						</div>
					</div>
				)}
			</div>

			{loading ? (
				<LoadingSpinner />
			) : !coordinates ? (
				<EmptyState />
			) : (
				<div className="space-y-6">
					<div className="flex justify-center items-center gap-4">
						{Object.keys(tabDetails).map((key) => (
							<button
								key={key}
								type="button"
								onClick={() => handleCategoryChange(key)}
								className={`px-6 py-3 font-semibold transition-all duration-300 rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF6B35] flex items-center gap-2 ${activeTab === key ? "text-white bg-[#FF6B35] hover:bg-[#E65C2E] shadow-lg" : "text-[#212529] bg-white hover:bg-[#F8F9FA] border border-[#DEE2E6]"}`}
							>
								<span>{tabDetails[key].icon}</span>
								<span>
									{tabDetails[key].label} ({tabDetails[key].data.length})
								</span>
							</button>
						))}
					</div>

					<div className="flex items-center justify-between pt-8">
						<h2 className="text-3xl font-bold text-[#212529]">Top-rated {tabDetails[activeTab].label}</h2>
						{allCurrentData.length > 3 && (
							<button
								onClick={() => setShowAll(!showAll)}
								className="font-semibold text-[#FF6B35] hover:text-[#E65C2E] flex items-center gap-1 transition-colors"
							>
								<span>{showAll ? "Show Less" : "View All"}</span>
								{showAll ? (
									<svg
										className="w-5 h-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2.5}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M4.5 15.75l7.5-7.5 7.5 7.5"
										/>
									</svg>
								) : (
									<svg
										className="w-5 h-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
										strokeWidth={2.5}
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M19.5 8.25l-7.5 7.5-7.5-7.5"
										/>
									</svg>
								)}
							</button>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
						{displayedData.length > 0 ? (
							displayedData.map((place, index) => (
								<PlaceCard
									key={place.placeId || index}
									place={place}
									type={activeTab}
									userLocation={coordinates}
								/>
							))
						) : (
							<div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl shadow-lg border">
								<div className="text-4xl mb-4">🤷</div>
								<p className="text-lg">No {activeTab} found in this area.</p>
								<p className="text-sm">Try expanding your search radius.</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default LocationSearch;
