import Product from "../models/product.js";
import User from "../models/userModel.js";

// =============================
// GET ALL PRODUCTS
// =============================
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({ success: true, products });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =============================
// ADD NEW PRODUCT
// =============================
export const addProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json({ success: true, product });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =============================
// RECOMMENDATION ENGINE
// =============================
export const getRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // If user has no viewed categories → send random 5 products
    if (!user.viewedCategories || user.viewedCategories.length === 0) {
      const randomProducts = await Product.aggregate([{ $sample: { size: 5 } }]);
      return res.status(200).json({ success: true, products: randomProducts });
    }

    // Recommend based on viewed categories
    const recommendations = await Product.find({
      category: { $in: user.viewedCategories }
    }).limit(5);

    return res.status(200).json({ success: true, products: recommendations });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
