import express from "express";
import {
  getProducts,
  getProductById,
  addProduct,
  deleteProduct,
  updateProduct,
  getRecommendations,
  getContentBasedRecommendations
} from "../controllers/productController.js";
import { handleChat } from "../controllers/chatController.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", addProduct);
router.post('/chat', handleChat);
router.get("/recommend/:userId", getRecommendations);
router.get("/similar/:id", getContentBasedRecommendations); // Content-based recommendations
router.get("/:id", getProductById);          // single product + view increment
router.delete("/:id", deleteProduct);
router.put("/:id", updateProduct);

export default router;
