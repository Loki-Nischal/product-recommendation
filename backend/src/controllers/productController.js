import Product from "../models/product.js";
import User from "../models/userModel.js";
// Dynamically import generateEmbedding to avoid initialization issues
let generateEmbedding;
try {
  const embeddingModule = await import("../ai/embeddingService.js");
  generateEmbedding = embeddingModule.generateEmbedding;
  console.log("✅ Embedding service loaded");
} catch (error) {
  console.warn("⚠️ Embedding service not found, using fallback");
  generateEmbedding = async () => {
    console.log("🎲 Using fallback mock embedding");
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  };
}


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
// ADD PRODUCT WITH EMBEDDING
export const addProduct = async (req, res) => {
  try {
    console.log("📦 Adding product:", req.body.title);

    const { title, description = "", tags = [] } = req.body;

    const textForEmbedding = `
      ${title}
      ${description}
      ${tags.join(" ")}
    `.trim();

    console.log("📝 Text for embedding:", textForEmbedding);

    // Check if generateEmbedding is imported correctly
    if (typeof generateEmbedding !== 'function') {
      console.error("❌ generateEmbedding is not a function!");
      return res.status(500).json({
        success: false,
        message: "Embedding service not available"
      });
    }

    const embedding = await generateEmbedding(textForEmbedding);
    console.log("✅ Embedding generated:", embedding ? "Success" : "Failed");

    const product = await Product.create({
      ...req.body,
      embedding,
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    console.error("❌ Error adding product:", err);
    res.status(500).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// =============================
// DELETE PRODUCT
// =============================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =============================
// UPDATE PRODUCT
// =============================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Normalize title/name: if the client updates one but not the other,
    // keep them in sync so frontends that read either field show consistent values.
    const updates = { ...req.body };
    // Treat empty string as "not provided" — normalize so updating one field updates the other
    const titleVal = typeof updates.title === 'string' ? updates.title.trim() : undefined;
    const nameVal = typeof updates.name === 'string' ? updates.name.trim() : undefined;
    if (titleVal && !nameVal) updates.name = updates.title;
    if (nameVal && !titleVal) updates.title = updates.name;

    let product = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // If the client supplied either title or name in the update, make them consistent
    // by writing the same chosen value into both fields so all clients see the same text.
    const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const rawName = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const chosenName = rawTitle || rawName || null;
    if (chosenName) {
      product.title = chosenName;
      product.name = chosenName;
      await product.save();
    }

    // Return the (possibly normalized) product
    product = await Product.findById(id);
    return res.status(200).json({ success: true, product });
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
