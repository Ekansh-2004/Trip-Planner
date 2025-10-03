import axios from "axios";

export const getCombinedLocationInfo = async (req, res) => {
	try {
		const { placeId } = req.params;
		const { userLat, userLng, destLat, destLng } = req.query;

		if (!userLat || !userLng || !destLat || !destLng) {
			return res.status(400).json({
				success: false,
				error: "Missing required coordinates",
			});
		}

		// Parallel API calls for better performance
		const [weatherResponse, trafficResponse] = await Promise.allSettled([
			// Google Weather API [web:514][web:515]
			axios.get("https://weather.googleapis.com/v1/currentConditions:lookup", {
				params: {
					key: process.env.GOOGLE_API_KEY, // Same key works for weather
					"location.latitude": destLat,
					"location.longitude": destLng,
					unitsSystem: "METRIC", // For Celsius
				},
			}),

			// Google Traffic API
			axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
				params: {
					origins: `${userLat},${userLng}`,
					destinations: `${destLat},${destLng}`,
					departure_time: "now",
					traffic_model: "best_guess",
					units: "metric",
					key: process.env.GOOGLE_API_KEY,
				},
			}),
		]);

		const result = {
			placeId,
			weather: null,
			traffic: null,
		};

		// Process weather data [web:512]
		if (weatherResponse.status === "fulfilled") {
			const weather = weatherResponse.value.data;
			result.weather = {
				temperature: Math.round(weather.temperature?.degrees) || "N/A",
				feelsLike: Math.round(weather.feelsLikeTemperature?.degrees) || "N/A",
				description: weather.weatherCondition?.description?.text || "N/A",
				condition: weather.weatherCondition?.type || "N/A",
				humidity: weather.relativeHumidity || "N/A",
				windSpeed: weather.wind?.speed?.value || "N/A",
				icon: weather.weatherCondition?.iconBaseUri || null,
			};
		} else {
			console.error("Weather API failed:", weatherResponse.reason?.message);
		}

		// Process traffic data
		if (trafficResponse.status === "fulfilled") {
			const element = trafficResponse.value.data.rows[0]?.elements[0];
			if (element && element.status === "OK") {
				const normalTime = element.duration.value;
				const trafficTime = element.duration_in_traffic?.value || normalTime;
				const delayMinutes = Math.round((trafficTime - normalTime) / 60);

				result.traffic = {
					distance: element.distance.text,
					duration: element.duration_in_traffic?.text || element.duration.text,
					normalDuration: element.duration.text,
					delayMinutes: delayMinutes,
					trafficCondition: getTrafficCondition(delayMinutes),
				};
			}
		} else {
			console.error("Traffic API failed:", trafficResponse.reason?.message);
		}

		res.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Combined API error:", error.message);
		res.status(500).json({
			success: false,
			error: "Unable to fetch location data",
			details: error.message,
		});
	}
};

// Helper function
const getTrafficCondition = (delayMinutes) => {
	if (delayMinutes < 5) return "light";
	if (delayMinutes < 15) return "moderate";
	if (delayMinutes < 30) return "heavy";
	return "severe";
};
