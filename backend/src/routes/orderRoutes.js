import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
    placeOrder,
    getMyOrders,
    getOrderById,
    generateSignature,
    verifyEsewaPayment,
    getAllOrders,
    updateOrderStatus
} from "../controllers/orderController.js";

const router = express.Router();

// User routes
router.post("/", protect, placeOrder);
router.get("/", protect, getMyOrders);
router.post("/generate-signature", generateSignature);
router.post("/verify-esewa", protect, verifyEsewaPayment);
router.get("/:id", protect, getOrderById);

// Admin routes
router.get("/admin/all", protect, admin, getAllOrders);
router.put("/admin/update-status/:id", protect, admin, updateOrderStatus);

export default router;
