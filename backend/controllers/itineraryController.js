import Itinerary from "../models/Itinerary.js";
import Place from "../models/Place.js"; // Attraction collection
import User from "../models/User.js";

const haversineDistance = (lat1, lng1, lat2, lng2) => {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; // Distance in km
};

const KMeans = (attractions, k, maxIterations = 100) => {
	if (attractions.length === 0 || k <= 0) return [];

	const actualK = Math.min(k, attractions.length);

	let centroids = [];
	const firstIdx = Math.floor(Math.random() * attractions.length); //selecting a random centroid
	centroids.push({
		lat: attractions[firstIdx].latitude,
		lng: attractions[firstIdx].longitude,
	});

	//choose remaining centroids based on distance
	while (centroids.length < actualK) {
		// compute squared minimum distance from each point to the existing centroids
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

	let clusters = [];
	let prevClusters = [];
	let iterations = 0;

	while (iterations < maxIterations) {
		// Assign attractions to nearest centroid
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

		// Remove empty clusters
		clusters = clusters.filter((c) => c.length > 0);

		if (clusters.length === 0) break;

		// Recalculate centroids
		const newCentroids = clusters.map((cluster) => {
			const avgLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
			const avgLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
			return { lat: avgLat, lng: avgLng };
		});

		// Check convergence
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

export const generateItinerary = async (req, res) => {
	try {
		const { startLat, startLng, city, days } = req.body;
		console.log("Itinerary routes loaded");
		if (!startLat || !startLng || !city || !days) {
			return res.status(400).json({ error: "Missing required fields: startLat, startLng, city, days" });
		}

		const latRange = 0.005;
		const lngRange = 0.005;

		const latNum = Number(startLat);
		const lngNum = Number(startLng);

		const existingItinerary = await Itinerary.findOne({
			user: req.user._id,
			city,
			days,
			"startLocation.lat": { $gte: latNum - latRange, $lte: latNum + latRange },
			"startLocation.lng": { $gte: lngNum - lngRange, $lte: lngNum + lngRange },
		})
			// This line is the solution. It populates all three arrays.
			.populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		if (existingItinerary) {
			return res.json({ itinerary: existingItinerary.daysPlan });
		}

		const attractionsPerDay = 4;
		const fetchLimit = days * attractionsPerDay + 5;

		const allAttractions = await Place.find({ city }).sort({ ranking: 1 }).limit(fetchLimit).select("name city latitude longitude feature image ranking entry_fee opening_time closing_time");

		if (allAttractions.length === 0) {
			return res.status(404).json({ error: "No attractions found for this city" });
		}

		const clusters = KMeans(allAttractions, days);

		// Calculate distance from start point to each cluster's centroid
		const clustersWithDistance = clusters.map((cluster) => {
			const centroidLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
			const centroidLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
			const distance = haversineDistance(startLat, startLng, centroidLat, centroidLng);

			return {
				attractions: cluster,
				centroidLat,
				centroidLng,
				distance,
			};
		});

		// Sort clusters by distance from start point (nearest first)
		clustersWithDistance.sort((a, b) => a.distance - b.distance);

		const itinerary = [];
		let remainingAttractions = allAttractions.sort((a, b) => a.ranking - b.ranking); // Sort all by ranking

		for (let day = 0; day < days; day++) {
			let availableForDay = day < clustersWithDistance.length ? clustersWithDistance[day].attractions.sort((a, b) => a.ranking - b.ranking) : remainingAttractions;

			const minAttractions = 3;
			const maxAttractions = 5;
			const targetCount = Math.min(availableForDay.length, Math.max(minAttractions, Math.min(maxAttractions, availableForDay.length)));

			const dayAttractions = availableForDay.slice(0, targetCount);

			// Remove used attractions from remaining pool
			remainingAttractions = remainingAttractions.filter((attr) => !dayAttractions.find((used) => used._id.equals(attr._id)));

			if (dayAttractions.length === 0) break;

			// Split into morning (2-3) and evening (2)
			const morningCount = Math.min(3, Math.max(2, Math.ceil(dayAttractions.length / 2)));

			itinerary.push({
				day: day + 1,
				attractions: dayAttractions,
				attractionCount: dayAttractions.length,
				morning: dayAttractions.slice(0, morningCount),
				evening: dayAttractions.slice(morningCount),
			});
		}
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

		await User.findByIdAndUpdate(req.user._id, {
			$push: { itineraries: newItinerary._id },
		});

		const populatedItinerary = await Itinerary.findById(newItinerary._id).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		res.json({ itinerary: populatedItinerary.daysPlan });
	} catch (error) {
		console.error("Error generating itinerary:", error);
		res.status(500).json({ error: "Failed to generate itinerary" });
	}
};

export const getItineraryHistory = async (req, res) => {
	try {
		const itineraries = await Itinerary.find({ user: req.user._id }).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");
		res.status(200).json(itineraries);
	} catch (error) {
		console.error("Error fetching itinerary history:", error);
		res.status(500).json({ error: "Failed to fetch itinerary history" });
	}
};
