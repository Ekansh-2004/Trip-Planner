// src/pages/PlaceDetailsPage.jsx

import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const DetailsSpinner = () => (
	<div className="text-center p-8">
		<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35] mx-auto mb-4"></div>
		<p className="text-gray-600">Loading traffic and weather info...</p>
	</div>
);

const getWeatherIcon = (condition) => {
	const iconProps = {
		className: "w-24 h-24 text-gray-700",
		strokeWidth: 1.5,
	};

	const normalizedCondition = condition?.toUpperCase().replace(/_/g, " ") || "";

	if (normalizedCondition.includes("RAIN") || normalizedCondition.includes("SHOWER")) {
		return (
			<svg
				{...iconProps}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M9.69 7.02a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-1.06 1.06L11.25 9.62V15a.75.75 0 01-1.5 0V9.62L8.69 10.58a.75.75 0 01-1.06-1.06l2.06-2.5zM12 21a9 9 0 100-18 9 9 0 000 18z"
				/>
			</svg>
		);
	}
	if (normalizedCondition.includes("PARTLY CLOUDY")) {
		return (
			<svg
				{...iconProps}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 9.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z"
				/>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M15.75 9.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM21.75 12c0 5.385-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12 6.615 2.25 12 2.25 21.75 6.615 21.75 12z"
				/>
			</svg>
		);
	}
	if (normalizedCondition.includes("CLOUD") || normalizedCondition.includes("OVERCAST")) {
		return (
			<svg
				{...iconProps}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.08-5.032.75.75 0 00-.812.812A2.25 2.25 0 019 13.5H4.5a2.25 2.25 0 00-2.25 2.25z"
				/>
			</svg>
		);
	}
	if (normalizedCondition.includes("CLEAR") || normalizedCondition.includes("SUNNY")) {
		return (
			<svg
				{...iconProps}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
				/>
			</svg>
		);
	}
	if (normalizedCondition.includes("FOG") || normalizedCondition.includes("HAZE")) {
		return (
			<svg
				{...iconProps}
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-2.08-5.032.75.75 0 00-.812.812A2.25 2.25 0 019 13.5H4.5a2.25 2.25 0 00-2.25 2.25z"
				/>
			</svg>
		);
	}

	return (
		<svg
			{...iconProps}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18"
			/>
		</svg>
	);
};

const PlaceDetailsPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	const { place, type, userLocation } = location.state || {};
	const [locationInfo, setLocationInfo] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (place && userLocation) {
			fetchLocationInfo();
		} else {
			setLoading(false);
		}
	}, [place, userLocation]);

	const fetchLocationInfo = async () => {
		setLoading(true);
		try {
			const API_BASE_URL = `${process.env.REACT_APP_API_URL}/api/location-info`;

			const params = {
				userLat: userLocation.lat,
				userLng: userLocation.lng,
				destLat: place.latitude,
				destLng: place.longitude,
			};

			const response = await axios.get(`${API_BASE_URL}/${place.placeId}`, { params, withCredentials: true });

			if (response.data.success) {
				setLocationInfo(response.data.data);
			}
		} catch (error) {
			console.error("Failed to fetch location info:", error);
		} finally {
			setLoading(false);
		}
	};

	const getTypeIcon = () => {
		const iconProps = { className: "w-8 h-8", strokeWidth: 2 };
		switch (type) {
			case "hotels":
				return (
					<svg
						{...iconProps}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.75.75 0 01.75.75v3.375a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75V7.5a.75.75 0 01.75-.75z"
						/>
					</svg>
				);
			case "restaurants":
				return (
					<svg
						{...iconProps}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
						/>
					</svg>
				);
			case "attractions":
				return (
					<svg
						{...iconProps}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
						/>
					</svg>
				);
			default:
				return (
					<svg
						{...iconProps}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
						/>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
						/>
					</svg>
				);
		}
	};

	if (!place) {
		return (
			<div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-display">
				<div className="text-center p-8 bg-white shadow-xl rounded-2xl">
					<p className="text-lg text-gray-700">Place data not found.</p>
					<button
						onClick={() => navigate("/")}
						className="mt-4 bg-[#FF6B35] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#E65C2E] transition-colors"
					>
						Go Back to Discover
					</button>
				</div>
			</div>
		);
	}

	const trafficConditionColors = {
		light: "bg-green-100 text-green-800",
		moderate: "bg-yellow-100 text-yellow-800",
		heavy: "bg-orange-100 text-orange-800",
		severe: "bg-red-100 text-red-800",
	};

	return (
		<div className="min-h-screen py-8 sm:py-12 font-display">
			<div className="max-w-4xl mx-auto px-4">
				<div className="flex items-center mb-8">
					<button
						onClick={() => navigate(-1)}
						className="bg-white p-3 rounded-full shadow-md hover:shadow-lg text-[#212529] hover:text-[#FF6B35] transition-all flex items-center justify-center"
					>
						<svg
							className="w-6 h-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							/>
						</svg>
					</button>
					<h1 className="text-3xl sm:text-4xl font-bold text-[#212529] ml-4">Place Details</h1>
				</div>

				<div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-8 border border-[#DEE2E6]">
					<div className="flex items-center gap-6">
						<div className="bg-[#FF6B35]/10 text-[#FF6B35] p-4 rounded-full">{getTypeIcon()}</div>
						<div className="flex-1">
							<h2 className="text-2xl sm:text-3xl font-bold text-[#212529] mb-2">{place.name}</h2>
							<p className="text-[#6C757D] flex items-center text-sm sm:text-base">
								<svg
									className="w-5 h-5 mr-2 flex-shrink-0"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
									/>
								</svg>
								{place.address}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
						{place.rating !== "N/A" && (
							<span className="flex items-center gap-2 bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-full text-sm">
								<svg
									className="w-5 h-5"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
								{place.rating}
							</span>
						)}
						{place.distance && (
							<span className="flex items-center gap-2 bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-full text-sm">
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
									/>
								</svg>
								{place.distance} km
							</span>
						)}
						<span className="flex items-center gap-2 bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded-full text-sm capitalize">{type?.slice(0, -1)}</span>
					</div>
				</div>

				{loading ? (
					<div className="bg-white rounded-2xl shadow-xl p-8 border border-[#DEE2E6]">
						<DetailsSpinner />
					</div>
				) : (
					<div className="grid md:grid-cols-2 gap-8">
						{locationInfo?.traffic && (
							<div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#DEE2E6]">
								<h3 className="text-2xl font-bold text-[#212529] mb-6 flex items-center gap-3">
									<svg
										className="w-7 h-7 text-[#FF6B35]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 2c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 10c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4z"
										/>
									</svg>
									Traffic
								</h3>
								<div className="space-y-4">
									<div>
										<p className="text-sm text-gray-500">Travel Time</p>
										<p className="text-3xl font-bold text-[#FF6B35]">{locationInfo.traffic.duration}</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Distance</p>
										<p className="text-lg font-medium text-gray-800">{locationInfo.traffic.distance}</p>
									</div>
									<div>
										<p className="text-sm text-gray-500">Current Conditions</p>
										<span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${trafficConditionColors[locationInfo.traffic.trafficCondition]}`}>{locationInfo.traffic.trafficCondition} Traffic</span>
									</div>
								</div>
							</div>
						)}

						{locationInfo?.weather && (
							<div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-[#DEE2E6]">
								<h3 className="text-2xl font-bold text-[#212529] mb-6 flex items-center gap-3">
									<svg
										className="w-7 h-7 text-[#FF6B35]"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 12a9 9 0 0115.14-6.36A8.99 8.99 0 0121 12h-3a6 6 0 00-12 0H3z"
										/>
									</svg>
									Weather
								</h3>
								<div className="flex items-start justify-between gap-4">
									<div className="flex-1">
										<p className="text-sm text-gray-500">Current</p>
										<p className="text-5xl font-bold text-gray-800">{locationInfo.weather.temperature}°C</p>
										<p className="text-gray-600 mb-4">Feels like {locationInfo.weather.feelsLike}°C</p>

										<div className="space-y-2 text-sm">
											<div className="flex items-center gap-2 text-gray-700">
												<svg
													className="w-5 h-5 text-blue-500"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V5m0 14v-3m-7.071-7.071L5.636 5.636m12.728 12.728L18.364 18.364M3 12h3m12 0h3"
													/>
												</svg>
												<span>
													Humidity: <strong>{locationInfo.weather.humidity}%</strong>
												</span>
											</div>
											<div className="flex items-center gap-2 text-gray-700">
												<svg
													className="w-5 h-5 text-gray-500"
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
													/>
												</svg>
												<span>
													Wind: <strong>{locationInfo.weather.windSpeed} km/h</strong>
												</span>
											</div>
										</div>
									</div>
									<div className="text-center">
										{getWeatherIcon(locationInfo.weather.condition)}
										<p className="text-gray-700 font-semibold capitalize mt-2">{locationInfo.weather.description}</p>
									</div>
								</div>
							</div>
						)}

						{!locationInfo && (
							<div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-8 border border-[#DEE2E6] text-center">
								<p className="text-gray-600">Unable to fetch additional traffic and weather information.</p>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
};

export default PlaceDetailsPage;
