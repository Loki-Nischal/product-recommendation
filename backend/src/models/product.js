import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, default: "Other" },
    description: { type: String },
    image: { type: String, required: true },
    brand: { type: String },
    rating: { type: Number, default: 4 },
    stock: { type: Number, default: 10 },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);




