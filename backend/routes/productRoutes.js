import express from "express";
import { getProducts, addProduct, getRecommendations } from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", addProduct);
router.get("/recommend/:userId", getRecommendations);

export default router;
