import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

import authRoutes from "./routes/authRoute.js";
import cultureRoutes from "./routes/cultureRoute.js";
import itineraryRoutes from "./routes/itineraryRoute.js";
import weatherTrafficRoutes from "./routes/locationInfoRoute.js";
import nlpRoutes from "./routes/nlpRoute.js";
import placeRoutes from "./routes/placeRoute.js";

import axios from "axios";
import { connectDB } from "./config/db.js";

const app = express();

app.use(
	cors({
		origin: ["http://localhost:5173", "http://localhost:3001", "https://trip-planner-lovat-psi.vercel.app"],
		credentials: true,
	}),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

await connectDB();
app.use("/api/auth", authRoutes);

app.use("/api/places", placeRoutes);
app.use("/api/location-info", weatherTrafficRoutes);
app.use("/api/itinerary", itineraryRoutes);
app.use("/api/nlp", nlpRoutes);
app.use("/api/culture", cultureRoutes);

app.get("/api/geocode", async (req, res) => {
	try {
		const { location } = req.query;
		const geoRes = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
			params: { address: location, key: process.env.GOOGLE_API_KEY },
		});
		if (geoRes.data.status !== "OK") {
			console.error("Geocoding failed:", geoRes.data.status, geoRes.data.error_message);
			return res.status(502).json({ error: `Geocoding failed: ${geoRes.data.error_message || geoRes.data.status}` });
		}
		const { lat, lng } = geoRes.data.results[0].geometry.location;
		res.json({ lat, lng });
	} catch (err) {
		console.error("Geocoding failed:", err.message);
		res.status(500).json({ error: "Failed to geocode location" });
	}
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
