import mongoose from "mongoose";

const DayPlanSchema = new mongoose.Schema({
	day: { type: Number, required: true },
	attractions: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Place",
			required: true,
		},
	],
	morning: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Place",
		},
	],
	evening: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Place",
		},
	],
	attractionCount: { type: Number, default: 0 },
});

const ItinerarySchema = new mongoose.Schema({
	user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

	city: { type: String, required: true },
	startLocation: {
		lat: { type: Number, required: true },
		lng: { type: Number, required: true },
	},
	startDate: { type: Date, required: false },
	days: { type: Number, required: true },
	daysPlan: [DayPlanSchema],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Itinerary", ItinerarySchema);
