import { useEffect, useState } from "react";
import { ActionCard } from "../components/ActionCard";
import { ActivityCard } from "../components/ActivityCard";
import { DayNavigation } from "../components/DayNavigation";
import { TravelConnector } from "../components/TravelConnector";

import LoadingSpinner from "./LoadingSpinner";

const ItineraryPage = () => {
	const [activeDay, setActiveDay] = useState("Day 1");
	const [itineraryData, setItineraryData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// CONFIGURABLE VARIABLES
	const DAYS = 3;
	const CITY = "Jaipur";
	const JAIPUR_JUNCTION = { lat: 26.9157, lng: 75.8189 };

	useEffect(() => {
		fetchItinerary();
	}, []);

	const fetchItinerary = async () => {
		try {
			setLoading(true);

			// Fetch itinerary
			const response = await fetch("http://localhost:3000/api/itinerary/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					startLat: JAIPUR_JUNCTION.lat,
					startLng: JAIPUR_JUNCTION.lng,
					city: CITY,
					days: DAYS,
					minAttractionsPerDay: 3,
					maxAttractionsPerDay: 5,
				}),
			});

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = await response.json();

			if (data.error) {
				throw new Error(data.error);
			}

			await buildItineraryTimeline(data.itinerary);
		} catch (err) {
			console.error("Error fetching itinerary:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const buildItineraryTimeline = async (backendItinerary) => {
		const days = backendItinerary.map((_, idx) => `Day ${idx + 1}`);
		const timeline = {};

		for (let dayIndex = 0; dayIndex < backendItinerary.length; dayIndex++) {
			const dayKey = `Day ${dayIndex + 1}`;
			const dayData = backendItinerary[dayIndex];
			const attractions = dayData.attractions || [];
			const dayTimeline = [];

			// Morning section
			dayTimeline.push({ type: "section", title: "Morning" });

			// Add first 2 attractions
			const morningCount = Math.min(2, attractions.length);
			for (let i = 0; i < morningCount; i++) {
				const attraction = attractions[i];

				// Add activity
				dayTimeline.push({
					type: "activity",
					details: {
						title: attraction.name,
						fee: attraction.entry_fee || "N/A",
						opening_time: attraction.opening_time || "N/A",
						closing_time: attraction.closing_time || "N/A",
						imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
					},
				});

				// Add travel from current to next attraction
				if (i < attractions.length - 1) {
					const currentAttraction = attractions[i];
					const nextAttraction = attractions[i + 1];

					const trafficData = await fetchTrafficData(currentAttraction.latitude, currentAttraction.longitude, nextAttraction.latitude, nextAttraction.longitude);

					if (trafficData) {
						dayTimeline.push({
							type: "travel",
							details: {
								time: trafficData.duration,
								distance: trafficData.distance,
								traffic: trafficData.trafficCondition,
							},
						});
					}
				}
			}

			// Afternoon section
			dayTimeline.push({ type: "section", title: "Afternoon" });
			dayTimeline.push({
				type: "action",
				details: {
					title: "Time for Lunch?",
					subtitle: "Discover local flavors and refuel for your adventure.",
					buttonText: "Find Food",
				},
			});

			// Evening section with remaining attractions
			if (attractions.length > 2) {
				dayTimeline.push({ type: "section", title: "Evening" });

				// Add remaining attractions starting from index 2
				for (let i = 2; i < attractions.length; i++) {
					const attraction = attractions[i];

					dayTimeline.push({
						type: "activity",
						details: {
							title: attraction.name,
							fee: attraction.entry_fee || "N/A",
							opening_time: attraction.opening_time || "N/A",
							closing_time: attraction.closing_time || "N/A",
							imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
						},
					});

					// Add travel from current to next attraction
					if (i < attractions.length - 1) {
						const currentAttraction = attractions[i];
						const nextAttraction = attractions[i + 1];

						const trafficData = await fetchTrafficData(currentAttraction.latitude, currentAttraction.longitude, nextAttraction.latitude, nextAttraction.longitude);

						if (trafficData) {
							dayTimeline.push({
								type: "travel",
								details: {
									time: trafficData.duration,
									distance: trafficData.distance,
									traffic: trafficData.trafficCondition,
								},
							});
						}
					}
				}
			}

			// Night section
			dayTimeline.push({ type: "section", title: "Night" });
			dayTimeline.push({
				type: "action",
				details: {
					title: "Dinner Plans?",
					subtitle: "End your day with a memorable meal.",
					buttonText: "Find Restaurants",
				},
			});

			dayTimeline.push({
				type: "travel",
				details: { time: "Back to Hotel" },
			});

			dayTimeline.push({
				type: "action",
				details: {
					title: "Time to Rest?",
					subtitle: "Find the perfect hotel to recharge for tomorrow.",
					buttonText: "Find Hotels",
				},
			});

			timeline[dayKey] = dayTimeline;
		}

		const finalData = {
			tripTitle: `Your ${backendItinerary.length}-Day Trip to ${CITY}`,
			days,
			timeline,
		};

		setItineraryData(finalData);
	};

	const fetchTrafficData = async (originLat, originLng, destLat, destLng) => {
		try {
			const response = await fetch(`http://localhost:3000/api/location-info/temp?userLat=${originLat}&userLng=${originLng}&destLat=${destLat}&destLng=${destLng}`);

			if (!response.ok) {
				console.error("Traffic API error:", response.status);
				return null;
			}

			const data = await response.json();

			if (data.success && data.data?.traffic) {
				return {
					duration: data.data.traffic.duration,
					distance: data.data.traffic.distance,
					trafficCondition: capitalizeFirst(data.data.traffic.trafficCondition),
				};
			}
		} catch (err) {
			console.error("Traffic fetch error:", err);
		}
		return null;
	};

	const capitalizeFirst = (str) => {
		if (!str) return "Moderate";
		return str.charAt(0).toUpperCase() + str.slice(1);
	};

	const handleDaySelect = (day) => {
		setActiveDay(day);
		const element = document.getElementById(day.replace(" ", ""));
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<LoadingSpinner />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-xl font-semibold text-red-600">Error: {error}</div>
			</div>
		);
	}

	if (!itineraryData) return null;

	return (
		<div>
			<main className="max-w-4xl mx-auto px-4 py-8">
				<h1 className="text-4xl font-bold text-gray-800 mb-4">{itineraryData.tripTitle}</h1>

				<DayNavigation
					days={itineraryData.days}
					activeDay={activeDay}
					onDaySelect={handleDaySelect}
				/>

				<div className="mt-8">
					{itineraryData.days.map((dayKey) => (
						<div
							key={dayKey}
							id={dayKey.replace(" ", "")}
							className="mb-20 scroll-mt-24"
						>
							<div className="relative pl-14">
								<div className="absolute left-[34px] top-0 h-full w-px bg-gray-200 border-l-2 border-dashed border-gray-300"></div>

								<h2 className="text-2xl font-bold mb-4 flex items-center">
									<span className="absolute left-[24px] w-5 h-5 bg-green-500 rounded-full border-4 border-white"></span>
									{dayKey}
								</h2>

								{(itineraryData.timeline[dayKey] || []).map((item, index) => {
									switch (item.type) {
										case "section":
											return (
												<h3
													key={index}
													className="text-xl font-bold text-gray-500 my-6"
												>
													{item.title}
												</h3>
											);
										case "activity":
											return (
												<ActivityCard
													key={index}
													{...item.details}
												/>
											);
										case "travel":
											return (
												<TravelConnector
													key={index}
													{...item.details}
												/>
											);
										case "action":
											return (
												<ActionCard
													key={index}
													{...item.details}
												/>
											);
										default:
											return null;
									}
								})}
							</div>
						</div>
					))}
				</div>
			</main>
		</div>
	);
};

export default ItineraryPage;

//local storage
// import { useEffect, useState } from "react";
// import { ActionCard } from "../components/ActionCard";
// import { ActivityCard } from "../components/ActivityCard";
// import { DayNavigation } from "../components/DayNavigation";
// import { TravelConnector } from "../components/TravelConnector";

// const ItineraryPage = () => {
// 	const [activeDay, setActiveDay] = useState("Day 1");
// 	const [itineraryData, setItineraryData] = useState(null);
// 	const [loading, setLoading] = useState(true);
// 	const [error, setError] = useState(null);

// 	// CONFIGURABLE VARIABLES
// 	const DAYS = 2;
// 	const CITY = "Jaipur";
// 	const JAIPUR_JUNCTION = { lat: 26.9157, lng: 75.8189 };
// 	const CACHE_KEY = `itinerary_${CITY}_${DAYS}`;

// 	useEffect(() => {
// 		loadItinerary();
// 	}, []);

// 	const loadItinerary = () => {
// 		// Try to load from localStorage first
// 		const cachedData = localStorage.getItem(CACHE_KEY);

// 		if (cachedData) {
// 			try {
// 				const parsed = JSON.parse(cachedData);
// 				setItineraryData(parsed);
// 				setLoading(false);
// 				console.log("Loaded itinerary from cache");
// 				return;
// 			} catch (err) {
// 				console.error("Failed to parse cached data:", err);
// 				localStorage.removeItem(CACHE_KEY);
// 			}
// 		}

// 		// If no cache, fetch from API
// 		fetchItinerary();
// 	};

// 	const fetchItinerary = async () => {
// 		try {
// 			setLoading(true);

// 			const response = await fetch("http://localhost:3000/api/itinerary/", {
// 				method: "POST",
// 				headers: { "Content-Type": "application/json" },
// 				body: JSON.stringify({
// 					startLat: JAIPUR_JUNCTION.lat,
// 					startLng: JAIPUR_JUNCTION.lng,
// 					city: CITY,
// 					days: DAYS,
// 					minAttractionsPerDay: 2,
// 					maxAttractionsPerDay: 5,
// 				}),
// 			});

// 			if (!response.ok) {
// 				throw new Error(`HTTP error! status: ${response.status}`);
// 			}

// 			const data = await response.json();

// 			if (data.error) {
// 				throw new Error(data.error);
// 			}

// 			await buildItineraryTimeline(data.itinerary);
// 		} catch (err) {
// 			console.error("Error fetching itinerary:", err);
// 			setError(err.message);
// 		} finally {
// 			setLoading(false);
// 		}
// 	};

// 	const buildItineraryTimeline = async (backendItinerary) => {
// 		const days = backendItinerary.map((_, idx) => `Day ${idx + 1}`);
// 		const timeline = {};

// 		for (let dayIndex = 0; dayIndex < backendItinerary.length; dayIndex++) {
// 			const dayKey = `Day ${dayIndex + 1}`;
// 			const dayData = backendItinerary[dayIndex];
// 			const attractions = dayData.attractions || [];
// 			const dayTimeline = [];

// 			// Morning section
// 			dayTimeline.push({ type: "section", title: "Morning" });

// 			const morningCount = Math.min(2, attractions.length);
// 			for (let i = 0; i < morningCount; i++) {
// 				const attraction = attractions[i];
// 				dayTimeline.push({
// 					type: "activity",
// 					details: {
// 						title: attraction.name,
// 						fee: attraction.entry_fee || "N/A",
// 						opening_time: attraction.opening_time || "N/A",
// 						closing_time: attraction.closing_time || "N/A",
// 						imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
// 					},
// 				});

// 				if (i < morningCount - 1) {
// 					const origin = i === 0 ? JAIPUR_JUNCTION : attractions[i];
// 					const destination = attractions[i + 1];

// 					const trafficData = await fetchTrafficData(origin.latitude || origin.lat, origin.longitude || origin.lng, destination.latitude, destination.longitude);

// 					if (trafficData) {
// 						dayTimeline.push({
// 							type: "travel",
// 							details: {
// 								time: trafficData.duration,
// 								distance: trafficData.distance,
// 								traffic: trafficData.trafficCondition,
// 							},
// 						});
// 					}
// 				}
// 			}

// 			// Afternoon section
// 			dayTimeline.push({ type: "section", title: "Afternoon" });
// 			dayTimeline.push({
// 				type: "action",
// 				details: {
// 					title: "Time for Lunch?",
// 					subtitle: "Discover local flavors and refuel for your adventure.",
// 					buttonText: "Find Food",
// 				},
// 			});

// 			// Evening section
// 			if (attractions.length > 2) {
// 				dayTimeline.push({ type: "section", title: "Evening" });

// 				if (attractions.length > 2 && morningCount > 0) {
// 					const trafficData = await fetchTrafficData(attractions[morningCount - 1].latitude, attractions[morningCount - 1].longitude, attractions[morningCount].latitude, attractions[morningCount].longitude);

// 					if (trafficData) {
// 						dayTimeline.push({
// 							type: "travel",
// 							details: {
// 								time: trafficData.duration,
// 								distance: trafficData.distance,
// 								traffic: trafficData.trafficCondition,
// 							},
// 						});
// 					}
// 				}

// 				for (let i = morningCount; i < attractions.length; i++) {
// 					const attraction = attractions[i];

// 					dayTimeline.push({
// 						type: "activity",
// 						details: {
// 							title: attraction.name,
// 							fee: attraction.entry_fee || "N/A",
// 							opening_time: attraction.opening_time || "N/A",
// 							closing_time: attraction.closing_time || "N/A",
// 							imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
// 						},
// 					});

// 					if (i < attractions.length - 1) {
// 						const nextAttraction = attractions[i + 1];
// 						const trafficData = await fetchTrafficData(attraction.latitude, attraction.longitude, nextAttraction.latitude, nextAttraction.longitude);

// 						if (trafficData) {
// 							dayTimeline.push({
// 								type: "travel",
// 								details: {
// 									time: trafficData.duration,
// 									distance: trafficData.distance,
// 									traffic: trafficData.trafficCondition,
// 								},
// 							});
// 						}
// 					}
// 				}
// 			}

// 			// Night section
// 			dayTimeline.push({ type: "section", title: "Night" });
// 			dayTimeline.push({
// 				type: "action",
// 				details: {
// 					title: "Dinner Plans?",
// 					subtitle: "End your day with a memorable meal.",
// 					buttonText: "Find Restaurants",
// 				},
// 			});

// 			dayTimeline.push({
// 				type: "travel",
// 				details: { time: "Back to Hotel" },
// 			});

// 			dayTimeline.push({
// 				type: "action",
// 				details: {
// 					title: "Time to Rest?",
// 					subtitle: "Find the perfect hotel to recharge for tomorrow.",
// 					buttonText: "Find Hotels",
// 				},
// 			});

// 			timeline[dayKey] = dayTimeline;
// 		}

// 		const finalData = {
// 			tripTitle: `Your ${backendItinerary.length}-Day Trip to ${CITY}`,
// 			days,
// 			timeline,
// 		};

// 		// Save to localStorage
// 		try {
// 			localStorage.setItem(CACHE_KEY, JSON.stringify(finalData));
// 			console.log("Itinerary saved to localStorage");
// 		} catch (err) {
// 			console.error("Failed to save to localStorage:", err);
// 		}

// 		setItineraryData(finalData);
// 	};

// 	const fetchTrafficData = async (originLat, originLng, destLat, destLng) => {
// 		try {
// 			const response = await fetch(`http://localhost:3000/api/places/location-info/temp?userLat=${originLat}&userLng=${originLng}&destLat=${destLat}&destLng=${destLng}`);

// 			if (!response.ok) {
// 				console.error("Traffic API error:", response.status);
// 				return null;
// 			}

// 			const data = await response.json();

// 			if (data.success && data.data?.traffic) {
// 				return {
// 					duration: data.data.traffic.duration,
// 					distance: data.data.traffic.distance,
// 					trafficCondition: capitalizeFirst(data.data.traffic.trafficCondition),
// 				};
// 			}
// 		} catch (err) {
// 			console.error("Traffic fetch error:", err);
// 		}
// 		return null;
// 	};

// 	const capitalizeFirst = (str) => {
// 		if (!str) return "Moderate";
// 		return str.charAt(0).toUpperCase() + str.slice(1);
// 	};

// 	const handleDaySelect = (day) => {
// 		setActiveDay(day);
// 		const element = document.getElementById(day.replace(" ", ""));
// 		if (element) {
// 			element.scrollIntoView({ behavior: "smooth", block: "start" });
// 		}
// 	};

// 	// Clear cache function (optional, for debugging or refresh button)
// 	const clearCache = () => {
// 		localStorage.removeItem(CACHE_KEY);
// 		window.location.reload();
// 	};

// 	if (loading) {
// 		return (
// 			<div className="flex items-center justify-center min-h-screen">
// 				<div className="text-xl font-semibold">Loading your itinerary...</div>
// 			</div>
// 		);
// 	}

// 	if (error) {
// 		return (
// 			<div className="flex items-center justify-center min-h-screen">
// 				<div className="text-xl font-semibold text-red-600">Error: {error}</div>
// 			</div>
// 		);
// 	}

// 	if (!itineraryData) return null;

// 	return (
// 		<div>
// 			<main className="max-w-4xl mx-auto px-4 py-8">
// 				<h1 className="text-4xl font-bold text-gray-800 mb-4">{itineraryData.tripTitle}</h1>

// 				{/* Optional: Add refresh button to clear cache */}
// 				{/* <button onClick={clearCache} className="mb-4 px-4 py-2 bg-blue-500 text-white rounded">
//           Refresh Itinerary
//         </button> */}

// 				<DayNavigation
// 					days={itineraryData.days}
// 					activeDay={activeDay}
// 					onDaySelect={handleDaySelect}
// 				/>

// 				<div className="mt-8">
// 					{itineraryData.days.map((dayKey) => (
// 						<div
// 							key={dayKey}
// 							id={dayKey.replace(" ", "")}
// 							className="mb-20 scroll-mt-24"
// 						>
// 							<div className="relative pl-14">
// 								<div className="absolute left-[34px] top-0 h-full w-px bg-gray-200 border-l-2 border-dashed border-gray-300"></div>

// 								<h2 className="text-2xl font-bold mb-4 flex items-center">
// 									<span className="absolute left-[24px] w-5 h-5 bg-green-500 rounded-full border-4 border-white"></span>
// 									{dayKey}
// 								</h2>

// 								{(itineraryData.timeline[dayKey] || []).map((item, index) => {
// 									switch (item.type) {
// 										case "section":
// 											return (
// 												<h3
// 													key={index}
// 													className="text-xl font-bold text-gray-500 my-6"
// 												>
// 													{item.title}
// 												</h3>
// 											);
// 										case "activity":
// 											return (
// 												<ActivityCard
// 													key={index}
// 													{...item.details}
// 												/>
// 											);
// 										case "travel":
// 											return (
// 												<TravelConnector
// 													key={index}
// 													{...item.details}
// 												/>
// 											);
// 										case "action":
// 											return (
// 												<ActionCard
// 													key={index}
// 													{...item.details}
// 												/>
// 											);
// 										default:
// 											return null;
// 									}
// 								})}
// 							</div>
// 						</div>
// 					))}
// 				</div>
// 			</main>
// 		</div>
// 	);
// };

// export default ItineraryPage;
