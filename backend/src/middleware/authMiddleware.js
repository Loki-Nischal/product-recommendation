import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1]; // Bearer token

  if (!token) return res.status(401).json({ msg: "Not authorized" });

  try {
    const decoded = jwt.verify(token, "secret123");
    req.user = await User.findById(decoded.id).select("-password");
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") next();
  else res.status(403).json({ msg: "Admin access only" });
};
