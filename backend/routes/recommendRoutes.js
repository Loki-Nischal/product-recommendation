import express from "express";
import { recommendProducts } from "../ai/recommendationEngine.js";
import Product from "../models/Product.js";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const allProducts = await Product.find();
    const recommendations = await recommendProducts(allProducts, req.params.id);

    res.json({ recommendations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Recommendation failed" });
  }
});

export default router;
