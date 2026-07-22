import crypto from "crypto";
import mongoose from "mongoose";
import Itinerary from "../models/Itinerary.js";
import Place from "../models/Place.js";
import User from "../models/User.js";



const haversineDistance = (lat1, lng1, lat2, lng2) => {
	const R = 6371; 
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c; 
};

const KMeans = (attractions, k, maxIterations = 100) => {
	if (attractions.length === 0 || k <= 0) return [];

	const actualK = Math.min(k, attractions.length);

	let centroids = [];
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


		const existingItinerary = await Itinerary.findOne({
			user: req.user._id,
			city,
			days,
			"startLocation.lat": { $gte: latNum - latRange, $lte: latNum + latRange },
			"startLocation.lng": { $gte: lngNum - latRange, $lte: lngNum + latRange },
		}).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		if (existingItinerary) {
			return res.json({ itinerary: existingItinerary.daysPlan, itineraryId: existingItinerary._id });
		}


		const attractionsPerDay = 5;
		const totalAttractionsNeeded = days * attractionsPerDay;
		const fetchLimit = totalAttractionsNeeded + 15; 

		const allAttractions = await Place.find({ city }).sort({ ranking: 1 }).limit(fetchLimit).select("name city latitude longitude feature image ranking entry_fee opening_time closing_time");

		if (allAttractions.length < totalAttractionsNeeded) {
			return res.status(404).json({
				error: `Not enough attractions found in ${city} to generate a ${days}-day itinerary (requires ${totalAttractionsNeeded}).`,
			});
		}


		const clusters = KMeans(allAttractions, days);


		const clustersWithDistance = clusters.map((cluster) => {
			const centroidLat = cluster.reduce((sum, a) => sum + a.latitude, 0) / cluster.length;
			const centroidLng = cluster.reduce((sum, a) => sum + a.longitude, 0) / cluster.length;
			const distance = haversineDistance(startLat, startLng, centroidLat, centroidLng);
			return { attractions: cluster, distance };
		});

		clustersWithDistance.sort((a, b) => a.distance - b.distance);

		const itinerary = [];


		const usedAttractionIds = new Set();

		const rankedAttractionPool = allAttractions.sort((a, b) => a.ranking - b.ranking);

		for (let day = 0; day < days; day++) {
			let dayAttractions = [];

			if (day < clustersWithDistance.length) {

				dayAttractions = clustersWithDistance[day].attractions.filter((attr) => !usedAttractionIds.has(attr._id.toString()));
			}

			const needed = attractionsPerDay - dayAttractions.length;
			if (needed > 0) {
				const attractionsInDay = new Set(dayAttractions.map((a) => a._id.toString()));

				const topUpAttractions = rankedAttractionPool
					.filter((attr) => {
						const id = attr._id.toString();
						return !usedAttractionIds.has(id) && !attractionsInDay.has(id);
					})
					.slice(0, needed);

				dayAttractions = [...dayAttractions, ...topUpAttractions];
			}

			let finalDayAttractions = dayAttractions.sort((a, b) => a.ranking - b.ranking).slice(0, attractionsPerDay);

			if (finalDayAttractions.length === 0) {
				continue; 
			}

			let dayStartLat, dayStartLng;
			if (day === 0) {
				dayStartLat = startLat;
				dayStartLng = startLng;
			} else {
				const prevDay = itinerary
					.slice()
					.reverse()
					.find((d) => d.attractions.length > 0);

				if (prevDay) {
					const lastAttraction = prevDay.attractions[prevDay.attractions.length - 1];
					dayStartLat = lastAttraction.latitude;
					dayStartLng = lastAttraction.longitude;
				} else {
					dayStartLat = startLat;
					dayStartLng = startLng;
				}
			}

			const sortedDayAttractions = sortDayByProximity(finalDayAttractions, dayStartLat, dayStartLng);

			sortedDayAttractions.forEach((attr) => usedAttractionIds.add(attr._id.toString()));
			const attractionIds = sortedDayAttractions.map((a) => a._id);
			const morningCount = 3;
			itinerary.push({
				day: day + 1,
				attractions: attractionIds,
				attractionCount: sortedDayAttractions.length,
				morning: sortedDayAttractions.slice(0, morningCount),
				evening: sortedDayAttractions.slice(morningCount),
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

		res.json({ itinerary: populatedItinerary.daysPlan, itineraryId: populatedItinerary._id });
	} catch (error) {
		console.error("Error generating itinerary:", error);
		res.status(500).json({ error: "Failed to generate itinerary" });
	}
};


export const getItineraryHistory = async (req, res) => {
	try {
		const itineraries = await Itinerary.find({ user: req.user._id }).populate("daysPlan.attractions daysPlan.morning daysPlan.evening").sort({ createdAt: -1 }); 

		res.status(200).json(itineraries);
	} catch (error) {
		console.error("Error fetching itinerary history:", error);
		res.status(500).json({ error: "Failed to fetch itinerary history" });
	}
};

export const deleteItinerary = async(req,res) => {
	try {
		const { itineraryId } = req.params;

		const itinerary = await Itinerary.findById(itineraryId);
		if (!itinerary) {
			return res.status(404).json({ error: "Itinerary not found" });
		}	

		await Itinerary.findByIdAndDelete(itineraryId);

		res.status(200).json({ message: "Itinerary deleted successfully" });
	} catch (error) {
		console.error("Error deleting itinerary:", error);
		res.status(500).json({ error: "Failed to delete itinerary" });
	}
}

export const shareItinerary = async (req, res) => {
	try {
		const { itineraryId } = req.params;

		const itinerary = await Itinerary.findById(itineraryId);
		if (!itinerary) {
			return res.status(404).json({ error: "Itinerary not found" });
		}
		if (itinerary.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized to share this itinerary" });
		}

		if (!itinerary.shareToken) {
			itinerary.shareToken = crypto.randomBytes(16).toString("hex");
			await itinerary.save();
		}

		res.status(200).json({ shareToken: itinerary.shareToken });
	} catch (error) {
		console.error("Error sharing itinerary:", error);
		res.status(500).json({ error: "Failed to share itinerary" });
	}
};

export const getPublicItinerary = async (req, res) => {
	try {
		const { shareToken } = req.params;

		const itinerary = await Itinerary.findOne({ shareToken }).populate("daysPlan.attractions daysPlan.morning daysPlan.evening").select("city days daysPlan startLocation createdAt");
		if (!itinerary) {
			return res.status(404).json({ error: "Shared itinerary not found" });
		}

		res.status(200).json({
			city: itinerary.city,
			days: itinerary.days,
			daysPlan: itinerary.daysPlan,
			createdAt: itinerary.createdAt,
		});
	} catch (error) {
		console.error("Error fetching public itinerary:", error);
		res.status(500).json({ error: "Failed to fetch shared itinerary" });
	}
};

// Persists a user-reordered/drag-and-dropped daysPlan. Only allows rearranging
// attractions that already belong to this itinerary — every attraction id from
// the original itinerary must appear exactly once across the submitted days,
// so this can move/reorder existing attractions but can't inject new ones or
// silently drop any.
export const updateItinerary = async (req, res) => {
	try {
		const { itineraryId } = req.params;
		const { daysPlan } = req.body;

		if (!Array.isArray(daysPlan) || daysPlan.length === 0) {
			return res.status(400).json({ error: "daysPlan must be a non-empty array" });
		}

		const itinerary = await Itinerary.findById(itineraryId);
		if (!itinerary) {
			return res.status(404).json({ error: "Itinerary not found" });
		}
		if (itinerary.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ error: "Not authorized to edit this itinerary" });
		}

		if (daysPlan.length !== itinerary.days) {
			return res.status(400).json({ error: `daysPlan must contain exactly ${itinerary.days} day(s)` });
		}

		const existingAttractionIds = new Set(itinerary.daysPlan.flatMap((d) => d.attractions.map((id) => id.toString())));

		const morningCount = 3;
		const seenIds = new Set();
		const newDaysPlan = [];

		for (let i = 0; i < daysPlan.length; i++) {
			const dayEntry = daysPlan[i];
			const dayNumber = Number(dayEntry.day);
			if (dayNumber !== i + 1) {
				return res.status(400).json({ error: "daysPlan entries must be ordered and numbered 1..N" });
			}

			const attractionIds = Array.isArray(dayEntry.attractions) ? dayEntry.attractions : [];

			for (const id of attractionIds) {
				if (!mongoose.Types.ObjectId.isValid(id)) {
					return res.status(400).json({ error: `Invalid attraction id: ${id}` });
				}
				if (!existingAttractionIds.has(id.toString())) {
					return res.status(400).json({ error: `Attraction ${id} does not belong to this itinerary` });
				}
				if (seenIds.has(id.toString())) {
					return res.status(400).json({ error: `Attraction ${id} appears more than once` });
				}
				seenIds.add(id.toString());
			}

			newDaysPlan.push({
				day: dayNumber,
				attractions: attractionIds,
				morning: attractionIds.slice(0, morningCount),
				evening: attractionIds.slice(morningCount),
				attractionCount: attractionIds.length,
			});
		}

		if (seenIds.size !== existingAttractionIds.size) {
			return res.status(400).json({ error: "daysPlan must include every attraction from the original itinerary exactly once" });
		}

		itinerary.daysPlan = newDaysPlan;
		itinerary.updatedAt = new Date();
		await itinerary.save();

		const populatedItinerary = await Itinerary.findById(itinerary._id).populate("daysPlan.attractions daysPlan.morning daysPlan.evening");

		res.status(200).json({ itinerary: populatedItinerary.daysPlan, itineraryId: populatedItinerary._id });
	} catch (error) {
		console.error("Error updating itinerary:", error);
		res.status(500).json({ error: "Failed to update itinerary" });
	}
};

