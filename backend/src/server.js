import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import recommendationRoutes from "./routes/recommendationRoutes.js";
import connectDB from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

app.use(cors());
app.use(express.json());
// serve uploads (use process.cwd() to match multer destination)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const port = process.env.PORT || 4000;

// MongoDB connection
connectDB();

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes); // <-- FIXED
app.use("/api/user", profileRoutes);
app.use("/api/recommend", recommendationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/admin", adminRoutes);

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Choose a different PORT or stop the process using it.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});
