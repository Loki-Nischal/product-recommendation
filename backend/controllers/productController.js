import Product from "../models/productModel.js";
import User from "../models/userModel.js";

// Get all products
export const getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

// Add new product
export const addProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
};

// Recommendation logic
export const getRecommendations = async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!user.viewedCategories.length) {
    const randomProducts = await Product.aggregate([{ $sample: { size: 5 } }]);
    return res.json(randomProducts);
  }

  const recommendations = await Product.find({
    category: { $in: user.viewedCategories }
  }).limit(5);

  res.json(recommendations);
};

// When user views a product, store category
user.viewedCategories.push(product.category);
user.viewedCategories = [...new Set(user.viewedCategories)];
await user.save();

