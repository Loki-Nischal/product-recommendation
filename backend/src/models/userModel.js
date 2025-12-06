import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  viewedCategories: [String], // store categories the user has viewed
}, { timestamps: true });

export default mongoose.model("User", userSchema);
