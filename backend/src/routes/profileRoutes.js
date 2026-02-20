import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middleware/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  uploadProfileImage,
  likeProduct,
  viewProduct,
  purchaseProduct,
  recordSearch,
  addToCart,
  removeFromCart,
  clearSearchHistory,
  getHistory,
} from "../controllers/profileController.js";

const router = express.Router();

// multer setup
// ensure uploads directory exists (use process.cwd() and avoid duplicating 'backend')
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/profile/image", protect, upload.single("image"), uploadProfileImage);

router.post("/like/:productId", protect, likeProduct);
router.post("/view/:productId", protect, viewProduct);
router.post("/purchase/:productId", protect, purchaseProduct);
router.post("/cart/:productId", protect, addToCart);
router.delete("/cart/:productId", protect, removeFromCart);
router.post("/search", protect, recordSearch);
router.post("/search/clear", protect, clearSearchHistory);
router.get("/history", protect, getHistory);

export default router;
