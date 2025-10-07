import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGODB_URI, {
			dbName: "TripPlanner",
		});
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (err) {
		console.error("MongoDB connection error:", err.message);
		process.exit(1);
	}
};
