// models/Place.js
import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	city: { type: String, required: true },
	lat: { type: Number, required: true },
	long: { type: Number, required: true },
	feature: { type: String, required: true },
	image: { type: String, required: true },
});

export default mongoose.model("Place", PlaceSchema, "places"); // Explicit collection name
