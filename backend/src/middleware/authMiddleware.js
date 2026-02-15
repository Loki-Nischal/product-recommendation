import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) return res.status(401).json({ success: false, message: "Not authorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ success: false, message: "User not found for token" });
    }
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else res.status(403).json({ success: false, message: "Admin access only" });
};
