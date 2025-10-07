import cors from "cors";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

import itineraryRoutes from "./routes/itineraryRoute.js";
import weatherTrafficRoutes from "./routes/locationInfoRoute.js";
import placeRoutes from "./routes/placeRoute.js";

import { connectDB } from "./config/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

await connectDB();

app.use("/api/places", placeRoutes);
app.use("/api/location-info", weatherTrafficRoutes);
app.use("/api/itinerary", itineraryRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
