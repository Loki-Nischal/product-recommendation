import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

const port = 4000;

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/estore")
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes); // <-- FIXED

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
