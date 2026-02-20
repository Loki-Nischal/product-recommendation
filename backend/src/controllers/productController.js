import Product from "../models/product.js";
import User from "../models/userModel.js";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
// GET SINGLE PRODUCT BY ID
// Increments views counter on every fetch so the popularity
// signal in the recommendation engine has real data.
// =============================
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    // $inc atomically increments views and returns the updated doc
    const product = await Product.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    return res.status(200).json({ success: true, product });
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

// =============================
// CONTENT-BASED RECOMMENDATION (Python TF-IDF)
// =============================
export const getContentBasedRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    // Ask Python for more candidates than needed so filtering doesn't leave us short
    const topN = Math.min(30, (parseInt(req.query.limit) || 8) * 3);
    // Minimum cosine similarity to be considered "similar" (0 – 1 scale)
    const MIN_SIMILARITY = 0.10;

    // Verify product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Path to Python script
    const pythonScriptPath = path.join(__dirname, "../../recommendation-engine/recommend.py");

    // Prefer the project's venv Python when available (cross-platform), otherwise fall back to system `python`.
    const isWin = process.platform === "win32";
    const venvPythonPath = isWin
      ? path.join(__dirname, "../../recommendation-engine/venv/Scripts/python.exe")
      : path.join(__dirname, "../../recommendation-engine/venv/bin/python");

    const pythonExec = fs.existsSync(venvPythonPath) ? venvPythonPath : "python";
    console.log("Using Python executable for recommendations:", pythonExec);

    // Spawn Python process
    const pythonProcess = spawn(pythonExec, [pythonScriptPath, id, topN.toString()]);

    let dataString = "";
    let errorString = "";

    // Collect stdout
    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    // Collect stderr
    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    pythonProcess.on("close", async (code) => {
      if (code !== 0) {
        console.error("Python process error:", errorString);
        return res.status(500).json({
          success: false,
          message: "Recommendation engine failed",
          error: errorString,
        });
      }

      try {
        // Parse Python output
        const recommendations = JSON.parse(dataString);

        if (!Array.isArray(recommendations) || recommendations.length === 0) {
          return res.json({ success: true, products: [], message: "No recommendations found" });
        }

        // Extract product IDs
        const productIds = recommendations.map((r) => r.productId);

        // Fetch full product details
        const products = await Product.find({ _id: { $in: productIds } });

        // Add similarity scores to products
        const productsWithScores = products.map((product) => {
          const rec = recommendations.find((r) => r.productId === product._id.toString());
          return {
            ...product.toObject(),
            similarityScore: rec ? rec.similarity : 0,
          };
        });

        // Remove products below the minimum similarity threshold and sort
        const qualified = productsWithScores
          .filter((p) => p.similarityScore >= MIN_SIMILARITY)
          .sort((a, b) => b.similarityScore - a.similarityScore)
          .slice(0, parseInt(req.query.limit) || 8);

        res.json({
          success: true,
          products: qualified,
          count: qualified.length,
          basedOn: {
            productId: id,
            productName: product.name || product.title,
          },
        });
      } catch (parseError) {
        console.error("Failed to parse Python output:", parseError);
        return res.status(500).json({
          success: false,
          message: "Failed to parse recommendations",
          error: parseError.message,
        });
      }
    });

    // Handle process errors
    pythonProcess.on("error", (error) => {
      console.error("Failed to start Python process:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to start recommendation engine",
        error: error.message,
      });
    });
  } catch (err) {
    console.error("Content-based recommendation error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
