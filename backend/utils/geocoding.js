// utils/geocoding.js
import axios from "axios";

export const getCoordinates = async (location) => {
	if (!location || typeof location !== "string") {
		throw new Error("Location is required");
	}

	try {
		if (process.env.GOOGLE_API_KEY) {
			const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_API_KEY}`;

			const geoRes = await axios.get(geoUrl);

			if (geoRes.data.status !== "OK") {
				console.error("Geocoding failed with status:", geoRes.data.status);
				console.error("Error message:", geoRes.data.error_message || "No error message provided");

				return {
					error: `Geocoding failed: ${geoRes.data.status}`,
					details: geoRes.data.error_message || "Check your API key and billing settings",
				};
			}

			const { lat, lng } = geoRes.data.results[0].geometry.location;
			return { lat, lng };
		}

		throw new Error("Google Maps API key not found in environment variables");
	} catch (error) {
		throw new Error(`Geocoding failed: ${error.message}`);
	}
};
