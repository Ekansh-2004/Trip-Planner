import mongoose from "mongoose";

const ActivitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: String, required: true },
  description: { type: String },
  image: { type: String },
});

export default mongoose.model("Activity", ActivitySchema);