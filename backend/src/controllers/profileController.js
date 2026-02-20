import User from "../models/userModel.js";
import Product from "../models/product.js";

// GET /api/user/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("likedProducts viewedProducts purchasedProducts cartProducts");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/user/profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, address, bio } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (bio !== undefined) updates.bio = bio;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");

    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/profile/image
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });

    const imagePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(req.user._id, { profileImage: imagePath }, { new: true }).select("-password");

    res.json({ success: true, data: { profileImage: user.profileImage } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/like/:productId
export const likeProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const exists = user.likedProducts.find((p) => p.toString() === productId);
    if (!exists) {
      user.likedProducts.push(productId);
      await user.save();
    }

    res.json({ success: true, data: user.likedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/view/:productId
export const viewProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // avoid duplicates
    user.viewedProducts = user.viewedProducts.filter((p) => p.toString() !== productId);
    user.viewedProducts.unshift(productId);

    // cap to 50
    if (user.viewedProducts.length > 50) user.viewedProducts = user.viewedProducts.slice(0, 50);

    // increase interaction score
    user.interactionScore = (user.interactionScore || 0) + 1;

    await user.save();

    res.json({ success: true, data: user.viewedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/search
export const recordSearch = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) return res.status(400).json({ success: false, message: "No query provided" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // push into searchHistory and lastSearchQueries
    user.searchHistory = user.searchHistory || [];
    user.lastSearchQueries = user.lastSearchQueries || [];

    // add to front
    user.searchHistory.unshift(query);
    user.lastSearchQueries.unshift(query);

    // dedupe lastSearchQueries while preserving order
    user.lastSearchQueries = [...new Set(user.lastSearchQueries)].slice(0, 20);

    // cap searchHistory to 20
    if (user.searchHistory.length > 20) user.searchHistory = user.searchHistory.slice(0, 20);

    await user.save();

    res.json({ success: true, data: { searchHistory: user.searchHistory, lastSearchQueries: user.lastSearchQueries } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/purchase/:productId
export const purchaseProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const exists = user.purchasedProducts.find((p) => p.toString() === productId);
    if (!exists) {
      user.purchasedProducts.unshift(productId);
      if (user.purchasedProducts.length > 100) {
        user.purchasedProducts = user.purchasedProducts.slice(0, 100);
      }
    }

    // If product exists in cart, remove it after purchase
    user.cartProducts = (user.cartProducts || []).filter((p) => p.toString() !== productId);

    user.interactionScore = (user.interactionScore || 0) + 2;
    await user.save();

    res.json({ success: true, data: user.purchasedProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/cart/:productId
export const addToCart = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check product exists and is in stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: "Product is out of stock" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // avoid duplicates
    const exists = user.cartProducts.find((p) => p.toString() === productId);
    if (!exists) {
      user.cartProducts.unshift(productId);
      if (user.cartProducts.length > 100) user.cartProducts = user.cartProducts.slice(0, 100);
    }

    await user.save();

    res.json({ success: true, data: user.cartProducts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/user/cart/:productId
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    console.log('Removing product from cart:', productId);
    console.log('Cart before:', user.cartProducts.map(p => p.toString()));

    const beforeLength = user.cartProducts.length;
    user.cartProducts = (user.cartProducts || []).filter((p) => {
      const pId = p.toString();
      const matches = pId === productId;
      console.log(`Comparing ${pId} with ${productId}: ${matches ? 'REMOVE' : 'KEEP'}`);
      return !matches; // keep items that don't match
    });

    console.log('Cart after:', user.cartProducts.map(p => p.toString()));
    console.log(`Removed ${beforeLength - user.cartProducts.length} items`);

    await user.save();
    console.log('Cart saved successfully');

    res.json({ success: true, data: user.cartProducts });
  } catch (err) {
    console.error('Error removing from cart:', err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/user/history
export const getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("searchHistory likedProducts viewedProducts purchasedProducts cartProducts lastSearchQueries interactionScore")
      .populate("likedProducts viewedProducts purchasedProducts cartProducts");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, data: user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/user/search/clear
export const clearSearchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.searchHistory = [];
    user.lastSearchQueries = [];

    await user.save();

    res.json({ success: true, data: { searchHistory: user.searchHistory, lastSearchQueries: user.lastSearchQueries } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
