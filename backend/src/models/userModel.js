import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user","admin"], default: "user" },
    viewedCategories: [String], // optional for recommendation
    profileImage: { type: String },
    phone: { type: String },
    address: { type: String },
    bio: { type: String },
    searchHistory: [{ type: String }],
    likedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    viewedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    purchasedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    cartProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    lastSearchQueries: [{ type: String }],
    interactionScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
