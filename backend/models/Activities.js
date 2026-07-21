import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  title: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String },
  image: { type: String },
});

export default mongoose.model("Activity", ActivitySchema);