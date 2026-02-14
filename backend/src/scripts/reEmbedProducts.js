// src/scripts/reEmbedProducts.js

import 'dotenv/config';
import mongoose from "mongoose";
import Product from "../models/product.js";
import { generateEmbedding } from "../ai/embeddingService.js";

// ✅ Fail fast if keys missing
if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Missing OPENAI_API_KEY in .env");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("❌ Missing MONGO_URI in .env");
  process.exit(1);
}

// 1️⃣ Connect to MongoDB
try {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🟢 Connected to MongoDB successfully");
} catch (err) {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
}

// 2️⃣ Main function
const run = async () => {
  try {
    const totalProducts = await Product.countDocuments();
    console.log(`📦 Total products in DB: ${totalProducts}`);

    // Find products missing embeddings
    const products = await Product.find({
      $or: [{ embedding: null }, { embedding: { $exists: false } }],
    });

    console.log(`🔍 Products without embeddings: ${products.length}`);

    if (products.length === 0) {
      console.log("🎉 All products already have embeddings!");
      process.exit(0);
    }

    // 3️⃣ Generate embeddings
    for (const p of products) {
      const text = `${p.title || ""} ${p.description || ""} ${(p.tags || []).join(" ")}`;
      p.embedding = await generateEmbedding(text);
      await p.save();
      console.log(`✅ Embedded: ${p.title}`);
    }

    console.log("🎉 Embeddings regenerated successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during embedding:", err.message);
    process.exit(1);
  }
};

// 4️⃣ Run
run();
