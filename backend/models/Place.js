// // models/Place.js
// import mongoose from "mongoose";

// const PlaceSchema = new mongoose.Schema({
// 	name: { type: String, required: true },
// 	city: { type: String, required: true },
// 	lat: { type: Number, required: true },
// 	long: { type: Number, required: true },
// 	feature: { type: String, required: true },
// 	image: { type: String, required: true },
// });

// export default mongoose.model("Place", PlaceSchema, "places"); // Explicit collection name
import mongoose from "mongoose";

const PlaceSchema = new mongoose.Schema({
	name: { type: String, required: true },
	city: { type: String, required: true },
	latitude: { type: Number, required: true },
	longitude: { type: Number, required: true },
	entry_fee: { type: String, required: false }, // Indian fees as string since ranges included
	feature: { type: String, required: true },
	opening_time: { type: String, required: true },
	closing_time: { type: String, required: true },
	ranking: { type: Number, required: true },
	image: { type: String, required: false }, // Optional, if you have images
});

export default mongoose.model("Place", PlaceSchema);
