import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			index: true,
		},
		email: {
			type: String,
			required: true,
			unique: true,
			trim: true,
			lowercase: true,
		},
		password: {
			type: String,
			required: true,
		},
		itineraries: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Itinerary",
			},
		],
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);

export default User;
