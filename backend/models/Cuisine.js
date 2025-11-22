import mongoose from "mongoose";

const CuisineSchema = new mongoose.Schema({
	name: { type: String, required: true },
	city: { type: String, required: true },
	description: { type: String },
	type: { type: String },
	image: { type: String },
});

export default mongoose.model("Cuisine", CuisineSchema);
