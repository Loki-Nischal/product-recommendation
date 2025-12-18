import express from "express";
import {
  getProducts,
  addProduct,
  deleteProduct,
  updateProduct,
  getRecommendations
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.post("/", addProduct);
router.delete("/:id", deleteProduct);
router.put("/:id", updateProduct);
router.get("/recommend/:userId", getRecommendations);

export default router;
