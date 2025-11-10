// src/components/ItineraryPage.jsx

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ActionCard } from "./ActionCard";
import { ActivityCard } from "./ActivityCard";
import { DayNavigation } from "./DayNavigation";
import LoadingSpinner from "./LoadingSpinner";
import NearbyPlacesModal from "./NearbyPlacesModal";
import { TravelConnector } from "./TravelConnector";

const ItineraryPage = () => {
	const [activeDay, setActiveDay] = useState("Day 1");
	const [itineraryData, setItineraryData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [modalContent, setModalContent] = useState(null);

	const itineraryDataRef = useRef(itineraryData);
	useEffect(() => {
		itineraryDataRef.current = itineraryData;
	}, [itineraryData]);

	const location = useLocation();
	const locationState = location.state || {};
	const { city, startLocation, startDate, endDate } = locationState;
	const { itineraryData: existingHistoryItem } = locationState;

	useEffect(() => {
		if (existingHistoryItem) {
			setLoading(true);
			if (existingHistoryItem.daysPlan && existingHistoryItem.city) {
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

		if (!city || !startLocation) {
			setLoading(false);
			return;
		}

		const cacheKey = `itinerary-${city}-${startLocation}-${startDate}-${endDate}`;
		const cachedData = localStorage.getItem(cacheKey);

		if (cachedData) {
			setItineraryData(JSON.parse(cachedData));
			setLoading(false);
		} else {
			fetchItinerary(city, startLocation, startDate, endDate);
		}
	}, [existingHistoryItem, city, startLocation, startDate, endDate]);

	// --- ADDED: useEffect for Scroll Restoration ---
	useEffect(() => {
		// This runs after the component mounts AND after itineraryData is set from cache
		if (itineraryData) {
			const scrollPos = sessionStorage.getItem("itineraryScrollPos");
			if (scrollPos) {
				// Use a small timeout to ensure all content has rendered
				setTimeout(() => {
					window.scrollTo(0, parseInt(scrollPos, 10));
					sessionStorage.removeItem("itineraryScrollPos");
				}, 100); // 100ms delay
			}
		}
	}, [itineraryData]); // Runs when data is loaded

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
			let lastAttraction = null;

			// Morning section
			dayTimeline.push({ type: "section", title: "Morning" });
			for (let i = 0; i < morningAttractions.length; i++) {
				const attraction = morningAttractions[i];
				lastAttraction = attraction;

				dayTimeline.push({
					type: "activity",
					details: {
						title: attraction.name,
						fee: attraction.entry_fee || "N/A",
						opening_time: attraction.opening_time || "N/A",
						closing_time: attraction.closing_time || "N/A",
						imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
						lat: attraction.latitude,
						lng: attraction.longitude,
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
					actionType: "restaurants",
					lat: lastAttraction?.latitude,
					lng: lastAttraction?.longitude,
				},
			});

			// Evening section
			if (eveningAttractions.length) {
				dayTimeline.push({ type: "section", title: "Evening" });
				for (let i = 0; i < eveningAttractions.length; i++) {
					const attraction = eveningAttractions[i];
					lastAttraction = attraction;

					dayTimeline.push({
						type: "activity",
						details: {
							title: attraction.name,
							fee: attraction.entry_fee || "N/A",
							opening_time: attraction.opening_time || "N/A",
							closing_time: attraction.closing_time || "N/A",
							imageUrl: attraction.image || "https://images.unsplash.com/photo-1564507592333-c60657eea523",
							lat: attraction.latitude,
							lng: attraction.longitude,
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
					actionType: "restaurants",
					lat: lastAttraction?.latitude,
					lng: lastAttraction?.longitude,
				},
			});
			dayTimeline.push({ type: "travel", details: { time: "Back to Hotel" } });
			dayTimeline.push({
				type: "action",
				details: {
					title: "Time to Rest?",
					subtitle: "Find the perfect hotel to recharge for tomorrow.",
					buttonText: "Find Hotels",
					actionType: "hotels",
					lat: lastAttraction?.latitude,
					lng: lastAttraction?.longitude,
				},
			});

			timeline[dayKey] = dayTimeline;
		}

		// ==========================================================
		// --- CACHING FIX ---
		// This now correctly saves the itinerary to localStorage
		// ==========================================================
		const finalData = {
			tripTitle: `Your ${backendItinerary.length}-Day Trip to ${tripCity}`,
			days,
			timeline,
			city: tripCity,
		};

		// Only cache if cacheInfo is available (i.e., for new trips, not from history)
		if (cacheInfo) {
			const { startLocation, startDate, endDate } = cacheInfo;
			// Use the correct variables to build the key
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

	const handleActionClick = (details) => {
		if (details.lat && details.lng) {
			setModalContent({
				type: details.actionType,
				lat: details.lat,
				lng: details.lng,
				city: itineraryData.city,
				userLocation: { lat: details.lat, lng: details.lng },
			});
		} else {
			console.error("Action aborted: Missing lat/lng data.");
		}
	};

	const findNeighborActivities = (items, idx) => {
		let prev = null,
			next = null;

		for (let i = idx - 1; i >= 0; i--) {
			if (items[i]?.type === "activity") {
				prev = items[i];
				break;
			}
		}
		for (let j = idx + 1; j < items.length; j++) {
			if (items[j]?.type === "activity") {
				next = items[j];
				break;
			}
		}
		return { prev, next };
	};

	const refreshAllTraffic = async () => {
		if (!itineraryDataRef.current?.timeline) return;
		console.log("🔄 Refreshing traffic data at", new Date().toLocaleTimeString());

		const updated = {
			...itineraryDataRef.current,
			timeline: { ...itineraryDataRef.current.timeline },
		};

		const promises = [];

		for (const dayKey of itineraryDataRef.current.days || []) {
			const items = [...(itineraryDataRef.current.timeline[dayKey] || [])];

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item?.type !== "travel") continue;

				const { prev, next } = findNeighborActivities(items, i);

				const oLat = prev?.details?.lat,
					oLng = prev?.details?.lng;
				const dLat = next?.details?.lat,
					dLng = next?.details?.lng;

				if (typeof oLat === "number" && typeof oLng === "number" && typeof dLat === "number" && typeof dLng === "number") {
					const p = fetchTrafficData(oLat, oLng, dLat, dLng)
						.then((traffic) => {
							if (traffic) {
								items[i] = {
									...items[i],
									details: {
										...items[i].details,
										time: traffic.duration,
										distance: traffic.distance,
										traffic: traffic.trafficCondition,
									},
								};
							}
						})
						.catch(() => {});
					promises.push(p);
				}
			}
			updated.timeline[dayKey] = items;
		}

		await Promise.all(promises);
		setItineraryData(updated);
	};

	useEffect(() => {
		if (loading || error) return;
		if (!itineraryDataRef.current) return;

		console.log("🚀 Initial traffic load.");
		refreshAllTraffic();

		const intervalId = setInterval(() => {
			console.log("🕒 Triggering scheduled refresh...");
			refreshAllTraffic();
		}, 30 * 60 * 1000); // 30 minutes

		return () => {
			console.log("🧹 Clearing traffic refresh interval");
			clearInterval(intervalId);
		};
	}, [loading, error]);

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
														onClick={() => handleActionClick(item.details)}
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

			{modalContent && (
				<NearbyPlacesModal
					type={modalContent.type}
					lat={modalContent.lat}
					lng={modalContent.lng}
					city={modalContent.city}
					userLocation={modalContent.userLocation}
					onClose={() => setModalContent(null)}
				/>
			)}
		</div>
	);
};

export default ItineraryPage;
