import express from "express";
import { getRecommendations, getPersonalizedRecommendations } from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET /api/recommendations (existing protected recommendations)
router.get("/", protect, getRecommendations);

// GET /api/recommend/personalized?q=
router.get("/personalized", getPersonalizedRecommendations);

export default router;
