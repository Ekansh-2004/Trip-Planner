import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	city: { type: String, required: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	entry_fee: { type: String, required: false },
	feature: { type: String, required: true },
	opening_time: { type: String, required: true },
	closing_time: { type: String, required: true },
	ranking: { type: Number, required: true },
	image: { type: String, required: false },
});

export default mongoose.model("Place", PlaceSchema);
