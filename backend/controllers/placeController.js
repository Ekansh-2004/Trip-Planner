import axios from "axios";

// Step 1: Convert location name to lat/lng
export const getCoordinates = async (req, res) => {
	try {
		const { location } = req.body;
		const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_API_KEY}`;

		const geoRes = await axios.get(geoUrl);

		// Debug: Log the full response

		if (geoRes.data.status !== "OK") {
			console.error("Geocoding failed with status:", geoRes.data.status);
			console.error("Error message:", geoRes.data.error_message || "No error message provided");

			return res.status(400).json({
				error: `Geocoding failed: ${geoRes.data.status}`,
				details: geoRes.data.error_message || "Check your API key and billing settings",
			});
		}

		const { lat, lng } = geoRes.data.results[0].geometry.location;
		res.json({ lat, lng });
	} catch (err) {
		console.error("Request error:", err.message);
		console.error("Full error:", err);
		res.status(500).json({ error: err.message });
	}
};

export const getNearbyHotels = async (req, res) => {
	try {
		const { lat, lng } = req.body;

		const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=2000&type=lodging&keyword=hotel&key=${process.env.GOOGLE_API_KEY}`;

		const placesRes = await axios.get(placesUrl);

		if (placesRes.data.status !== "OK") {
			return res.status(400).json({
				error: `Places API failed: ${placesRes.data.status}`,
				details: placesRes.data.error_message || "Check billing and API enablement",
			});
		}

		const hotels = placesRes.data.results.map((hotel) => ({
			name: hotel.name,
			address: hotel.vicinity,
			latitude: hotel.geometry.location.lat,
			longitude: hotel.geometry.location.lng,
			rating: hotel.rating || "N/A",
		}));

		res.json(hotels);
	} catch (err) {
		console.error("Places API Error:", err.message);
		res.status(500).json({ error: err.message });
	}
};

export const getNearbyRestaurants = async (req, res) => {
	try {
		// Input validation
		if (!req.body || Object.keys(req.body).length === 0) {
			return res.status(400).json({
				error: "Request body is required",
				expectedFormat: { lat: "number", lng: "number", radius: "number" },
			});
		}

		const { lat, lng, radius = 2000 } = req.body;

		if (!lat || !lng) {
			return res.status(400).json({
				error: "Missing required fields: lat and lng",
			});
		}

		// Try Legacy API first (more cost-effective)
		try {
			const legacyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=restaurant&key=${process.env.GOOGLE_API_KEY}`;

			const legacyResponse = await axios.get(legacyUrl);

			if (legacyResponse.data.status === "OK" && legacyResponse.data.results.length > 0) {
				const restaurants = legacyResponse.data.results.map((place) => ({
					name: place.name,
					address: place.vicinity || place.formatted_address,
					latitude: place.geometry.location.lat,
					longitude: place.geometry.location.lng,
					rating: place.rating || "N/A",
					priceLevel: place.price_level || "N/A",
					types: place.types || [],
					placeId: place.place_id,
					userRatingsTotal: place.user_ratings_total || 0,
					isOpen: place.opening_hours?.open_now || null,
					photos: place.photos
						? place.photos.slice(0, 2).map((photo) => ({
								reference: photo.photo_reference,
								photoUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_API_KEY}`,
						  }))
						: [],
				}));

				// Sort by rating
				const sortedRestaurants = restaurants.sort((a, b) => {
					if (a.rating === "N/A" && b.rating === "N/A") return b.userRatingsTotal - a.userRatingsTotal;
					if (a.rating === "N/A") return 1;
					if (b.rating === "N/A") return -1;
					if (b.rating !== a.rating) return b.rating - a.rating;
					return b.userRatingsTotal - a.userRatingsTotal;
				});

				return res.json({
					success: true,
					count: sortedRestaurants.length,
					data: sortedRestaurants,
				});
			}
		} catch (legacyError) {
			console.error("Legacy API failed:", legacyError.message);
		}

		// Fallback to New API v1 with cost-optimized field mask
		const requestData = {
			includedTypes: ["restaurant"],
			maxResultCount: 20,
			locationRestriction: {
				circle: {
					center: { latitude: parseFloat(lat), longitude: parseFloat(lng) },
					radius: parseFloat(radius),
				},
			},
		};

		// ✅ Cost-optimized field mask - Advanced tier only ($35 CPM)
		const response = await axios.post("https://places.googleapis.com/v1/places:searchNearby", requestData, {
			headers: {
				"Content-Type": "application/json",
				"X-Goog-Api-Key": process.env.GOOGLE_API_KEY,
				"X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.priceLevel,places.location,places.types",
			},
		});

		if (!response.data.places || response.data.places.length === 0) {
			return res.status(404).json({
				success: false,
				message: "No restaurants found in this area",
				data: [],
			});
		}

		const restaurants = response.data.places.map((place) => ({
			name: place.displayName?.text || "Unknown Restaurant",
			address: place.formattedAddress || "Address not available",
			latitude: place.location?.latitude || lat,
			longitude: place.location?.longitude || lng,
			rating: place.rating ?? "N/A",
			priceLevel: place.priceLevel ?? "N/A",
			types: place.types || [],
			placeId: place.id || null,
		}));

		// Sort by rating
		const sortedRestaurants = restaurants.sort((a, b) => {
			if (a.rating === "N/A" && b.rating === "N/A") return 0;
			if (a.rating === "N/A") return 1;
			if (b.rating === "N/A") return -1;
			return b.rating - a.rating;
		});

		res.json({
			success: true,
			count: sortedRestaurants.length,
			data: sortedRestaurants,
		});
	} catch (err) {
		console.error("Restaurants API Error:", err.response?.data || err.message);
		res.status(500).json({
			error: "Failed to fetch restaurants",
			details: err.response?.data?.error?.message || err.message,
		});
	}
};

export const getAllAttractions = async (req, res) => {
	try {
		// Handle both undefined and empty body
		if (!req.body || Object.keys(req.body).length === 0) {
			return res.status(400).json({
				error: "Request body is required",
				expectedFormat: { lat: "number", lng: "number", radius: "number", city: "string" },
			});
		}

		const { lat, lng, radius, city } = req.body;

		// Validate required fields
		if (!lat || !lng) {
			return res.status(400).json({
				error: "Missing required fields: lat and lng",
			});
		}

		let allAttractions = [];

		// Use Legacy API (more reliable) instead of New API v1
		const attractionTypes = ["museum", "park", "church", "hindu_temple", "stadium", "zoo", "amusement_park"];

		// Fetch using Legacy Places API (more stable)
		for (const type of attractionTypes) {
			try {
				const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${process.env.GOOGLE_API_KEY}`;

				const response = await axios.get(nearbyUrl);

				if (response.data.status === "OK" && response.data.results.length > 0) {
					const typeAttractions = response.data.results.map((place) => ({
						name: place.name,
						address: place.vicinity || place.formatted_address,
						latitude: place.geometry.location.lat,
						longitude: place.geometry.location.lng,
						rating: place.rating || "N/A",
						userRatingsTotal: place.user_ratings_total || 0,
						types: place.types || [],
						primaryType: type,
						placeId: place.place_id,
						priceLevel: place.price_level || "N/A",
						photos: place.photos
							? place.photos.slice(0, 3).map((photo) => ({
									reference: photo.photo_reference,
									photoUrl: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${process.env.GOOGLE_API_KEY}`,
							  }))
							: [],
					}));

					allAttractions = [...allAttractions, ...typeAttractions];
				}

				// Small delay to avoid hitting rate limits
				await new Promise((resolve) => setTimeout(resolve, 200));
			} catch (typeError) {
				console.error(`Error fetching ${type}:`, typeError.message);
				// Continue with other types
			}
		}

		// Remove duplicates by placeId
		const uniqueAttractions = [...new Map(allAttractions.map((a) => [a.placeId, a])).values()];

		// Sort by rating + popularity
		const sortedByRating = uniqueAttractions.sort((a, b) => {
			// Handle "N/A" ratings - put them at the end
			if (a.rating === "N/A" && b.rating === "N/A") {
				return b.userRatingsTotal - a.userRatingsTotal; // Sort by review count
			}
			if (a.rating === "N/A") return 1; // Put N/A ratings at end
			if (b.rating === "N/A") return -1; // Keep rated items first

			// Primary sort: by rating (highest first)
			if (b.rating !== a.rating) {
				return b.rating - a.rating;
			}

			// Secondary sort: by number of reviews (most reviewed first)
			return b.userRatingsTotal - a.userRatingsTotal;
		});

		// Filter out very low-rated places
		const quality = sortedByRating.filter((a) => a.rating === "N/A" || a.rating >= 3.5);

		res.json({
			success: true,
			count: quality.length,
			location: { lat: parseFloat(lat), lng: parseFloat(lng), radius, city },
			data: quality,
		});
	} catch (err) {
		console.error("Attractions API Error:", err.message);
		res.status(500).json({
			error: "Failed to fetch attractions",
			details: err.message,
		});
	}
};

import Place from "../models/Place.js";

export const getAttractionsByCity = async (req, res) => {
	try {
		const { city } = req.body;

		if (!city) {
			return res.status(400).json({ error: "City name is required" });
		}

		// Case-insensitive match (e.g., "Jaipur" == "jaipur")
		const attractions = await Place.find(
			{ city: { $regex: new RegExp(`^${city}$`, "i") } } // case-insensitive filter
		).select("name city lat long feature image"); // select only needed fields

		if (!attractions.length) {
			return res.status(404).json({ message: `No attractions found in ${city}` });
		}

		res.json(attractions);
	} catch (err) {
		console.error("Error fetching attractions:", err);
		res.status(500).json({ error: "Failed to fetch attractions" });
	}
};
