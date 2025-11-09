import Itinerary from "../models/Itinerary.js";
import Place from "../models/Place.js"; // Attraction collection
import User from "../models/User.js";

// --- HELPER FUNCTION: HAVERSINE DISTANCE ---
const haversineDistance = (lat1, lng1, lat2, lng2) => {
	const R = 6371; // Earth's radius in km
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in km
};

// --- HELPER FUNCTION: K-MEANS CLUSTERING ---
const KMeans = (attractions, k, maxIterations = 100) => {
	if (attractions.length === 0 || k <= 0) return [];

	const actualK = Math.min(k, attractions.length);

	let centroids = [];
	// K-Means++ initialization
	const firstIdx = Math.floor(Math.random() * attractions.length);
	centroids.push({
		lat: attractions[firstIdx].latitude,
		lng: attractions[firstIdx].longitude,
	});

	while (centroids.length < actualK) {
		const distances = attractions.map((attr) => {
			const minDist = Math.min(...centroids.map((c) => haversineDistance(attr.latitude, attr.longitude, c.lat, c.lng)));
			return minDist * minDist;
		});

		const totalDist = distances.reduce((sum, d) => sum + d, 0);
		if (totalDist === 0) break;

		let random = Math.random() * totalDist;

		for (let i = 0; i < distances.length; i++) {
			random -= distances[i];
			if (random <= 0) {
				centroids.push({
					lat: attractions[i].latitude,
					lng: attractions[i].longitude,
				});
				break;
			}
		}
	}

	// K-Means iterations
	let clusters = [];
	let iterations = 0;

	while (iterations < maxIterations) {
		clusters = Array.from({ length: centroids.length }, () => []);

		attractions.forEach((attraction) => {
			let minDist = Infinity;
			let clusterIdx = 0;
			centroids.forEach((centroid, idx) => {
				const dist = haversineDistance(attraction.latitude, attraction.longitude, centroid.lat, centroid.lng);
				if (dist < minDist) {
					minDist = dist;
					clusterIdx = idx;
				}
			});
			clusters[clusterIdx].push(attraction);
		});

		clusters = clusters.filter((c) => c.length > 0);
		if (clusters.length === 0) break;

		const newCentroids = clusters.map((cluster) => {
			const avgLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
			const avgLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
			return { lat: avgLat, lng: avgLng };
		});

		let converged = true;
		if (centroids.length === newCentroids.length) {
			for (let i = 0; i < newCentroids.length; i++) {
				if (Math.abs(newCentroids[i].lat - centroids[i].lat) > 0.0001 || Math.abs(newCentroids[i].lng - centroids[i].lng) > 0.0001) {
					converged = false;
					break;
				}
			}
		} else {
			converged = false;
		}

		centroids = newCentroids;
		if (converged) break;
		iterations++;
	}

	return clusters.filter((c) => c.length > 0);
};

// --- HELPER FUNCTION: PROXIMITY SORT (Nearest Neighbor) ---
const sortDayByProximity = (attractions, startLat, startLng) => {
	if (!attractions || attractions.length === 0) return [];

	let remaining = [...attractions];
	let sorted = [];
	let currentLat = startLat;
	let currentLng = startLng;

	while (remaining.length > 0) {
		let closestIdx = 0;
		let minDistance = Infinity;

		for (let i = 0; i < remaining.length; i++) {
			const attr = remaining[i];
			const distance = haversineDistance(currentLat, currentLng, attr.latitude, attr.longitude);
			if (distance < minDistance) {
				minDistance = distance;
				closestIdx = i;
			}
		}

		const nextAttraction = remaining.splice(closestIdx, 1)[0];
		sorted.push(nextAttraction);

		currentLat = nextAttraction.latitude;
		currentLng = nextAttraction.longitude;
	}

	return sorted;
};

// --- CONTROLLER: GENERATE ITINERARY (Combined Fixes) ---
export const generateItinerary = async (req, res) => {
	try {
		const { startLat, startLng, city, days } = req.body;
		console.log("Itinerary routes loaded");
		if (!startLat || !startLng || !city || !days) {
			return res.status(400).json({
				error: "Missing required fields: startLat, startLng, city, days",
			});
		}

		const latRange = 0.005;
		const lngRange = 0.005;
		const latNum = Number(startLat);
		const lngNum = Number(startLng);

		// Check for existing itinerary
		const existingItinerary = await Itinerary.findOne({
			user: req.user._id,
			city,
			days,
			"startLocation.lat": { $gte: latNum - latRange, $lte: latNum + latRange },
			"startLocation.lng": { $gte: lngNum - latRange, $lte: lngNum + latRange },
		}).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		if (existingItinerary) {
			return res.json({ itinerary: existingItinerary.daysPlan });
		}

		// --- START OF ITINERARY GENERATION LOGIC ---
		const attractionsPerDay = 5;
		const totalAttractionsNeeded = days * attractionsPerDay;
		const fetchLimit = totalAttractionsNeeded + 15; // Fetch extra for clustering

		const allAttractions = await Place.find({ city }).sort({ ranking: 1 }).limit(fetchLimit).select("name city latitude longitude feature image ranking entry_fee opening_time closing_time");

		if (allAttractions.length < totalAttractionsNeeded) {
			return res.status(404).json({
				error: `Not enough attractions found in ${city} to generate a ${days}-day itinerary (requires ${totalAttractionsNeeded}).`,
			});
		}

		// Cluster all fetched attractions
		const clusters = KMeans(allAttractions, days);

		// Sort clusters by distance from the user's start location
		const clustersWithDistance = clusters.map((cluster) => {
			const centroidLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
			const centroidLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
			const distance = haversineDistance(startLat, startLng, centroidLat, centroidLng);
			return { attractions: cluster, distance };
		});

		clustersWithDistance.sort((a, b) => a.distance - b.distance);

		const itinerary = [];

		// THIS IS THE FIX FOR REPEATS:
		// A Set to track attraction IDs that have been assigned to a day
		const usedAttractionIds = new Set();

		// This is our master pool for "top-ups", sorted by ranking
		const rankedAttractionPool = allAttractions.sort((a, b) => a.ranking - b.ranking);

		// --- Day-by-day Itinerary Building Loop ---
		for (let day = 0; day < days; day++) {
			let dayAttractions = [];

			if (day < clustersWithDistance.length) {
				// 1. Get base attractions from this day's cluster
				// Filter out any that were ALREADY used (e.g., as a top-up on a previous day)
				dayAttractions = clustersWithDistance[day].attractions.filter((attr) => !usedAttractionIds.has(attr._id.toString()));
			}

			// 2. Check if we need to "top up" to reach attractionsPerDay
			const needed = attractionsPerDay - dayAttractions.length;
			if (needed > 0) {
				// --- FIX ---
				// Get the IDs of attractions already in this day's list from the cluster
				const attractionsInDay = new Set(dayAttractions.map((a) => a._id.toString()));
				// --- END FIX ---

				// Find top-ups that are NOT in the global "used" list
				// AND are NOT already in this day's list.
				const topUpAttractions = rankedAttractionPool
					.filter((attr) => {
						const id = attr._id.toString();
						// --- FIX ---
						return !usedAttractionIds.has(id) && !attractionsInDay.has(id);
						// --- END FIX ---
					})
					.slice(0, needed);

				// Add them to this day's list
				dayAttractions = [...dayAttractions, ...topUpAttractions];
			}

			// 3. Finalize the list for the day
			// Sort by ranking and slice to *exactly* attractionsPerDay
			// This handles cases where the cluster + top-up was > 5
			let finalDayAttractions = dayAttractions.sort((a, b) => a.ranking - b.ranking).slice(0, attractionsPerDay);

			if (finalDayAttractions.length === 0) {
				continue; // No attractions left to assign for this day
			}

			// 4. Sort the final day's list by Proximity (Travel Order)
			let dayStartLat, dayStartLng;
			if (day === 0) {
				// Day 1 starts at the user's location
				dayStartLat = startLat;
				dayStartLng = startLng;
			} else {
				// Subsequent days start at the previous day's *last* attraction
				const prevDay = itinerary
					.slice()
					.reverse()
					.find((d) => d.attractions.length > 0);

				if (prevDay) {
					const lastAttraction = prevDay.attractions[prevDay.attractions.length - 1];
					dayStartLat = lastAttraction.latitude;
					dayStartLng = lastAttraction.longitude;
				} else {
					// Fallback if previous days were empty
					dayStartLat = startLat;
					dayStartLng = startLng;
				}
			}

			const sortedDayAttractions = sortDayByProximity(finalDayAttractions, dayStartLat, dayStartLng);

			// 5. THIS IS THE KEY:
			// Add all attractions from the *final* sorted list to the used Set
			// This ensures they cannot be picked again by the cluster or top-up logic
			sortedDayAttractions.forEach((attr) => usedAttractionIds.add(attr._id.toString()));

			// 6. Push the final, sorted day plan
			const morningCount = 3;
			itinerary.push({
				day: day + 1,
				attractions: sortedDayAttractions,
				attractionCount: sortedDayAttractions.length,
				morning: sortedDayAttractions.slice(0, morningCount),
				evening: sortedDayAttractions.slice(morningCount),
			});
		}
		// --- END OF ITINERARY GENERATION LOGIC ---

		// Save the new itinerary
		const newItinerary = new Itinerary({
			user: req.user._id,
			city,
			days,
			startLocation: { lat: startLat, lng: startLng },
			daysPlan: itinerary,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		await newItinerary.save();

		// Add itinerary reference to user
		await User.findByIdAndUpdate(req.user._id, {
			$push: { itineraries: newItinerary._id },
		});

		// Populate the new itinerary before sending it to the front-end
		const populatedItinerary = await Itinerary.findById(newItinerary._id).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		res.json({ itinerary: populatedItinerary.daysPlan });
	} catch (error) {
		console.error("Error generating itinerary:", error);
		res.status(500).json({ error: "Failed to generate itinerary" });
	}
};

// --- CONTROLLER: GET ITINERARY HISTORY ---
export const getItineraryHistory = async (req, res) => {
	try {
		const itineraries = await Itinerary.find({ user: req.user._id }).populate("daysPlan.attractions daysPlan.morning daysPlan.evening").sort({ createdAt: -1 }); // Sort by newest first

		res.status(200).json(itineraries);
	} catch (error) {
		console.error("Error fetching itinerary history:", error);
		res.status(500).json({ error: "Failed to fetch itinerary history" });
	}
};
