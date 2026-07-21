// src/components/ItineraryPage.jsx

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ActionCard } from "./ActionCard";
import { ActivityCard } from "./ActivityCard";
import { DayNavigation } from "./DayNavigation";
import LoadingSpinner from "./LoadingSpinner";
import NearbyPlacesModal from "./NearbyPlacesModal";
import { TravelConnector } from "./TravelConnector";

import { motion } from "framer-motion";

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.15,
		},
	},
};

const cardVariants = {
	hidden: { opacity: 0, y: 50 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring",
			stiffness: 100,
			damping: 20,
		},
	},
};

const textContainerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.1,
			delayChildren: 0.2,
		},
	},
};

const textItemVariants = {
	hidden: { opacity: 0, x: -30 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: "spring", stiffness: 100, damping: 15 },
	},
};

const ItineraryPage = () => {
	const [activeDay, setActiveDay] = useState("Day 1");
	const [itineraryData, setItineraryData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [modalContent, setModalContent] = useState(null);

	const [activeTab, setActiveTab] = useState("Itinerary");
	const [cuisines, setCuisines] = useState([]);
	const [activities, setActivities] = useState([]);
	const [loadingExtra, setLoadingExtra] = useState(false);
	
	// NEW: State for manual refresh
	const [isRefreshingTraffic, setIsRefreshingTraffic] = useState(false);
	const [lastRefreshTime, setLastRefreshTime] = useState(null);

	const itineraryDataRef = useRef(itineraryData);
	useEffect(() => {
		itineraryDataRef.current = itineraryData;
	}, [itineraryData]);

	const isClickScrolling = useRef(false);

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

	useEffect(() => {
		if (itineraryData) {
			const scrollPos = sessionStorage.getItem("itineraryScrollPos");
			if (scrollPos) {
				setTimeout(() => {
					window.scrollTo(0, parseInt(scrollPos, 10));
					sessionStorage.removeItem("itineraryScrollPos");
				}, 100);
			}
		}
	}, [itineraryData]);

	useEffect(() => {
		if (activeTab !== "Itinerary" || !itineraryData) return;

		const daySections = itineraryData.days.map((dayKey) => document.getElementById(dayKey.replace(" ", "")));

		const handleScroll = () => {
			if (isClickScrolling.current) return;

			const scrollPosition = window.scrollY;
			const offset = 160;

			let currentDay = itineraryData.days[0];

			for (const section of daySections) {
				if (section.offsetTop - offset <= scrollPosition) {
					currentDay = section.id.replace(/(\d+)/, " $1");
				}
			}

			setActiveDay(currentDay);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, [itineraryData, activeTab]);

	const fetchItinerary = async (city, startLocation, startDate, endDate) => {
		try {
			setLoading(true);
			const location = startLocation + ", " + city;

			const geoResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/geocode?location=${encodeURIComponent(location)}`, {
				credentials: "include"
			});
			const geoData = await geoResponse.json();
			const { lat, lng } = geoData;

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/itinerary/`, {
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

			if (morningAttractions.length > 0) {
				dayTimeline.push({
					type: "action",
					details: {
						title: "☕ Lunch Break",
						subtitle: "Explore nearby restaurants",
						buttonText: "Find Restaurants",
						actionType: "restaurants",
						lat: lastAttraction?.latitude,
						lng: lastAttraction?.longitude,
						city: tripCity,
					},
				});
			}

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

			if (eveningAttractions.length > 0) {
				dayTimeline.push({
					type: "action",
					details: {
						title: "🍽️ Dinner Spot",
						subtitle: "Find places for dinner",
						buttonText: "Find Restaurants",
						actionType: "restaurants",
						lat: lastAttraction?.latitude,
						lng: lastAttraction?.longitude,
						city: tripCity,
					},
				});

				dayTimeline.push({
					type: "action",
					details: {
						title: "🏨 Find Hotels Nearby",
						subtitle: "Rest for the night",
						buttonText: "Find Hotels",
						actionType: "hotels",
						lat: lastAttraction?.latitude,
						lng: lastAttraction?.longitude,
						city: tripCity,
					},
				});
			}

			timeline[dayKey] = dayTimeline;
		}

		const finalItinerary = {
			tripTitle: `${tripCity} Trip`,
			city: tripCity,
			days,
			timeline,
		};

		setItineraryData(finalItinerary);
		setLastRefreshTime(new Date());

		if (cacheInfo) {
			const cacheKey = `itinerary-${tripCity}-${cacheInfo.startLocation}-${cacheInfo.startDate}-${cacheInfo.endDate}`;
			localStorage.setItem(cacheKey, JSON.stringify(finalItinerary));
		}
	};

	const fetchTrafficData = async (originLat, originLng, destLat, destLng) => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/traffic?origin=${originLat},${originLng}&destination=${destLat},${destLng}`, {
				credentials: "include"
			});
			if (!response.ok) throw new Error(`Traffic API error: ${response.status}`);
			return await response.json();
		} catch (error) {
			console.error("Error fetching traffic data:", error);
			return null;
		}
	};

	const fetchPlaceDetails = async (lat, lng, type) => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/nearby?lat=${lat}&lng=${lng}&type=${type}`, {
				credentials: "include"
			});
			if (!response.ok) throw new Error(`Nearby API error: ${response.status}`);
			return await response.json();
		} catch (error) {
			console.error(`Error fetching ${type}:`, error);
			return null;
		}
	};

	const fetchCuisinesAndActivities = async (city) => {
		setLoadingExtra(true);
		try {
			const [cuisinesRes, activitiesRes] = await Promise.all([
				fetch(`${import.meta.env.VITE_API_URL}/api/culture/cuisine/${encodeURIComponent(city)}`, {
					credentials: "include"
				}),
				fetch(`${import.meta.env.VITE_API_URL}/api/culture/activities/${encodeURIComponent(city)}`, {
					credentials: "include"
				}),
			]);

			if (cuisinesRes.ok) {
				const cuisinesData = await cuisinesRes.json();
				setCuisines(cuisinesData || []);
			}

			if (activitiesRes.ok) {
				const activitiesData = await activitiesRes.json();
				setActivities(activitiesData || []);
			}
		} catch (error) {
			console.error("Error loading extra data:", error);
		} finally {
			setLoadingExtra(false);
		}
	};

	useEffect(() => {
		if (activeTab === "Cuisine" && cuisines.length === 0 && itineraryData?.city) {
			fetchCuisinesAndActivities(itineraryData.city);
		}
		if (activeTab === "Activities" && activities.length === 0 && itineraryData?.city) {
			fetchCuisinesAndActivities(itineraryData.city);
		}
	}, [activeTab]);

	const handleActionClick = (actionDetails) => {
		const { actionType, lat, lng, city } = actionDetails;
		if (!lat || !lng || !city) return;

		const userLocation = { lat, lng };
		setModalContent({ type: actionType, lat, lng, city, userLocation });
	};

	const handleDaySelect = (dayKey) => {
		isClickScrolling.current = true;
		const element = document.getElementById(dayKey.replace(" ", ""));
		if (element) {
			const offset = 120;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - offset;
			window.scrollTo({ top: offsetPosition, behavior: "smooth" });
			setActiveDay(dayKey);
			setTimeout(() => {
				isClickScrolling.current = false;
			}, 1000);
		}
	};

	const findNeighborActivities = (items, travelIndex) => {
		let prev = null,
			next = null;

		for (let i = travelIndex - 1; i >= 0; i--) {
			if (items[i]?.type === "activity") {
				prev = items[i];
				break;
			}
		}

		for (let i = travelIndex + 1; i < items.length; i++) {
			if (items[i]?.type === "activity") {
				next = items[i];
				break;
			}
		}
		return { prev, next };
	};

	// UPDATED: Manual refresh function with loading state
	const refreshAllTraffic = async () => {
		if (!itineraryDataRef.current?.timeline) return;
		
		setIsRefreshingTraffic(true);
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
		setLastRefreshTime(new Date());
		setIsRefreshingTraffic(false);
	};

	// REMOVED: Auto-refresh interval - now only manual refresh
	// Load traffic data once on initial load
	useEffect(() => {
		if (loading || error) return;
		if (!itineraryDataRef.current) return;

		console.log("🚀 Initial traffic load.");
		refreshAllTraffic();
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
			<div className="flex items-center justify-center min-h-screen text-red-500">
				<p>Error: {error}</p>
			</div>
		);
	}

	if (!itineraryData) {
		return (
			<div className="flex items-center justify-center min-h-screen text-gray-600">
				<p>No itinerary data available.</p>
			</div>
		);
	}

	return (
		<div>
			<main className="max-w-4xl mx-auto px-8 py-8 mt-8 bg-white rounded-xl shadow-lg border border-[#DEE2E6]">
				<div className="flex items-center justify-between mb-4">
					<h1 className="text-4xl font-bold text-gray-800">{itineraryData.tripTitle}</h1>
					
					{/* NEW: Manual Refresh Button */}
					{activeTab === "Itinerary" && (
						<button
							onClick={refreshAllTraffic}
							disabled={isRefreshingTraffic}
							className="flex items-center gap-2 px-4 py-2 bg-[#ef5006] text-white rounded-lg hover:bg-[#d64506] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg 
								className={`w-5 h-5 ${isRefreshingTraffic ? 'animate-spin' : ''}`}
								fill="none" 
								stroke="currentColor" 
								viewBox="0 0 24 24"
							>
								<path 
									strokeLinecap="round" 
									strokeLinejoin="round" 
									strokeWidth={2} 
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
								/>
							</svg>
							{isRefreshingTraffic ? 'Refreshing...' : 'Refresh Traffic'}
						</button>
					)}
				</div>
				
				{/* Show last refresh time */}
				{lastRefreshTime && activeTab === "Itinerary" && (
					<p className="text-sm text-gray-500 mb-4">
						Last updated: {lastRefreshTime.toLocaleTimeString()}
					</p>
				)}

				<div className="relative flex gap-2 border-b border-gray-200 mb-6 bg-gray-100 p-1.5 rounded-full">
					{["Itinerary", "Cuisine", "Activities"].map((tab) => (
						<button
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`w-1/3 z-10 relative rounded-full py-2.5 text-base font-semibold transition-colors ${activeTab === tab ? "text-white" : "text-gray-600 hover:text-[#ef5006]"}`}
						>
							{activeTab === tab && (
								<motion.div
									className="absolute inset-0 z-0 bg-[#ef5006] rounded-full shadow-md"
									layoutId="main-tab-pill"
									transition={{ type: "spring", stiffness: 380, damping: 30 }}
								/>
							)}
							<span className="relative z-10">{tab}</span>
						</button>
					))}
				</div>

				{activeTab === "Itinerary" && (
					<motion.div
						key="itinerary-content"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
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
					</motion.div>
				)}

				{activeTab === "Cuisine" && (
					<div className="mt-8">
						<h2 className="text-3xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
							🍛 <span>Famous Cuisines in {itineraryData.city}</span>
						</h2>

						{loadingExtra && <p className="text-gray-500">Loading cuisines...</p>}

						{!loadingExtra && cuisines.length > 0 ? (
							<motion.div
								className="flex flex-col gap-10"
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, amount: 0.1 }}
							>
								{cuisines.map((item, idx) => (
									<motion.div
										key={idx}
										variants={cardVariants}
										whileHover={{ scale: 1.02, z: 10 }}
										transition={{ type: "spring", stiffness: 300, damping: 15 }}
										className="group relative w-full h-64 md:h-72 bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
									>
										<img
											src={item.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(item.title)},food,india`}
											alt={item.title}
											className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
										/>
										<div className={`absolute inset-0 ${idx % 2 === 1 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/80 via-black/60 to-transparent`} />
										<motion.div
											className={`relative z-10 p-6 md:p-8 flex flex-col justify-center h-full md:w-2/3 ${idx % 2 === 1 ? "md:ml-auto md:text-right md:items-end" : ""}`}
											variants={textContainerVariants}
											initial="hidden"
											whileInView="visible"
											viewport={{ once: true, amount: 0.3 }}
										>
											<motion.h3
												variants={textItemVariants}
												className="text-3xl font-bold text-white mb-1"
											>
												{item.title}
											</motion.h3>
											{item.type && (
												<motion.p
													variants={textItemVariants}
													className="text-sm text-white/80 italic mb-2"
												>
													Type: {item.type}
												</motion.p>
											)}
											<motion.p
												variants={textItemVariants}
												className="text-white/90 leading-relaxed"
											>
												{item.description}
											</motion.p>
										</motion.div>
									</motion.div>
								))}
							</motion.div>
						) : (
							!loadingExtra && <p className="text-gray-500 italic mt-4">No cuisine data found for this destination.</p>
						)}
					</div>
				)}

				{activeTab === "Activities" && (
					<div className="mt-8">
						<h2 className="text-3xl font-extrabold mb-6 text-gray-800 flex items-center gap-2">
							<span>Famous Activities in {itineraryData.city}</span>
						</h2>

						{loadingExtra && <p className="text-gray-500">Loading Activities...</p>}

						{!loadingExtra && activities.length > 0 ? (
							<motion.div
								className="flex flex-col gap-10"
								variants={containerVariants}
								initial="hidden"
								whileInView="visible"
								viewport={{ once: true, amount: 0.1 }}
							>
								{activities.map((item, idx) => (
									<motion.div
										key={idx}
										variants={cardVariants}
										whileHover={{ scale: 1.02, z: 10 }}
										transition={{ type: "spring", stiffness: 300, damping: 15 }}
										className="group relative w-full h-64 md:h-72 bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
									>
										<img
											src={item.image || `https://source.unsplash.com/800x600/?${encodeURIComponent(item.title)},jaipur`}
											alt={item.title}
											className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
										/>
										<div className={`absolute inset-0 ${idx % 2 === 1 ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-black/80 via-black/60 to-transparent`} />
										<motion.div
											className={`relative z-10 p-6 md:p-8 flex flex-col justify-center h-full md:w-2/3 ${idx % 2 === 1 ? "md:ml-auto md:text-right md:items-end" : ""}`}
											variants={textContainerVariants}
											initial="hidden"
											whileInView="visible"
											viewport={{ once: true, amount: 0.3 }}
										>
											<motion.h3
												variants={textItemVariants}
												className="text-3xl font-bold text-white mb-1"
											>
												{item.title}
											</motion.h3>
											<motion.p
												variants={textItemVariants}
												className="text-white/90 leading-relaxed"
											>
												{item.description}
											</motion.p>
										</motion.div>
									</motion.div>
								))}
							</motion.div>
						) : (
							!loadingExtra && <p className="text-gray-500 italic mt-4">No activities found for this destination.</p>
						)}
					</div>
				)}
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