import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

	const location = useLocation();
	const locationState = location.state || {}; // Ensure state is not null

	// Data for a NEWLY generated trip
	const { city, startLocation, startDate, endDate } = locationState;

	// Data from trip HISTORY (ProfilePage)
	// This 'existingHistoryItem' is the 'itinerary' object from ProfilePage
	const { itineraryData: existingHistoryItem } = locationState;

	useEffect(() => {
		// Priority 1: Load and build from history state (ProfilePage)
		if (existingHistoryItem) {
			setLoading(true);

			// We assume existingHistoryItem is { city: '...', itinerary: [...] }
			// The 'itinerary' property is the array buildItineraryTimeline expects.
			if (existingHistoryItem.daysPlan && existingHistoryItem.city) {
				// Build the timeline from the history object. Pass null for cacheInfo
				// because we don't have start/end dates and can't build a cache key.
				buildItineraryTimeline(existingHistoryItem.daysPlan, existingHistoryItem.city, null)
					.catch((err) => {
						console.error("Error building from history:", err);
						setError(err.message);
					})
					.finally(() => {
						setLoading(false);
					});
			} else {
				console.error("History item is in wrong format:", existingHistoryItem);
				setError("Could not load itinerary. Data from history is incomplete.");
				setLoading(false);
			}
			return;
		}

		// Priority 2: Data for a NEW trip is missing
		// (and we didn't have a history item)
		if (!city || !startLocation) {
			setLoading(false);
			return;
		}

		// Priority 3: Generate a NEW trip (check cache first)
		const cacheKey = `itinerary-${city}-${startLocation}-${startDate}-${endDate}`;
		const cachedData = localStorage.getItem(cacheKey);

		if (cachedData) {
			setItineraryData(JSON.parse(cachedData));
			setLoading(false);
		} else {
			fetchItinerary(city, startLocation, startDate, endDate);
		}
	}, [existingHistoryItem, city, startLocation, startDate, endDate]);

	const fetchItinerary = async (city, startLocation, startDate, endDate) => {
		try {
			setLoading(true);
			const location = startLocation + ", " + city;

			const geoResponse = await fetch(`http://localhost:3001/api/geocode?location=${encodeURIComponent(location)}`);
			const geoData = await geoResponse.json();
			const { lat, lng } = geoData;

			const response = await fetch("http://localhost:3001/api/itinerary/", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					startLat: lat,
					startLng: lng,
					city: city,
					days: calculateTripDays(startDate, endDate),
				}),
			});

			if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
			const data = await response.json();
			console.log(data);

			if (data.error) throw new Error(data.error);

			// Pass city and cacheInfo to the builder function
			const cacheInfo = { startLocation, startDate, endDate };
			await buildItineraryTimeline(data.itinerary, city, cacheInfo);
		} catch (err) {
			console.error("Error fetching itinerary:", err);
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	const calculateTripDays = (start, end) => {
		const diff = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
		return diff > 0 ? diff : 1;
	};

	const buildItineraryTimeline = async (backendItinerary, tripCity, cacheInfo = null) => {
		const days = backendItinerary.map((_, idx) => `Day ${idx + 1}`);
		const timeline = {};

		for (let dayIndex = 0; dayIndex < backendItinerary.length; dayIndex++) {
			const dayKey = `Day ${dayIndex + 1}`;
			const dayData = backendItinerary[dayIndex];
			const morningAttractions = dayData.morning || [];
			const eveningAttractions = dayData.evening || [];
			const dayTimeline = [];

			// Morning section
			dayTimeline.push({ type: "section", title: "Morning" });

			for (let i = 0; i < morningAttractions.length; i++) {
				const attraction = morningAttractions[i];

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

				if (i < morningAttractions.length - 1) {
					const currentAttraction = morningAttractions[i];
					const nextAttraction = morningAttractions[i + 1];
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

			// Evening section
			if (eveningAttractions.length) {
				dayTimeline.push({ type: "section", title: "Evening" });

				for (let i = 0; i < eveningAttractions.length; i++) {
					const attraction = eveningAttractions[i];

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

					if (i < eveningAttractions.length - 1) {
						const currentAttraction = eveningAttractions[i];
						const nextAttraction = eveningAttractions[i + 1];
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
			tripTitle: `Your ${backendItinerary.length}-Day Trip to ${city}`,
			days,
			timeline,
		};

		// Cache the newly generated itinerary
		const cacheKey = `itinerary-${city}-${startLocation}-${startDate}-${endDate}`;
		localStorage.setItem(cacheKey, JSON.stringify(finalData));
		if (cacheInfo) {
			const { startLocation, startDate, endDate } = cacheInfo;
			const cacheKey = `itinerary-${tripCity}-${startLocation}-${startDate}-${endDate}`;
			localStorage.setItem(cacheKey, JSON.stringify(finalData));
		}

		setItineraryData(finalData);
	};

	const fetchTrafficData = async (originLat, originLng, destLat, destLng) => {
		try {
			const response = await fetch(`http://localhost:3001/api/location-info/temp?userLat=${originLat}&userLng=${originLng}&destLat=${destLat}&destLng=${destLng}`, {
				credentials: "include",
			});

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

	if (!itineraryData) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-xl font-semibold text-gray-600">No itinerary data available. Please go back and create a new trip.</div>
			</div>
		);
	}

	return (
		<div>
			<main className="max-w-4xl mx-auto px-8 py-8 mt-8 bg-white rounded-xl overflow-hidden shadow-lg border border-[#DEE2E6]">
				<h1 className="text-4xl font-bold text-gray-800 mb-4">{itineraryData.tripTitle}</h1>

				<DayNavigation
					days={itineraryData.days}
					activeDay={activeDay}
					onDaySelect={handleDaySelect}
				/>

				<div className="mt-8">
					{(itineraryData?.days || []).length > 0 ? (
						itineraryData.days.map((dayKey) => (
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

									{(itineraryData.timeline?.[dayKey] || []).map((item, index) => {
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
						))
					) : (
						<div className="text-gray-600 text-center mt-10">No itinerary timeline found for this trip.</div>
					)}
				</div>
			</main>
		</div>
	);
};

export default ItineraryPage;
