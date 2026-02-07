import Product from "../models/product.js";
import { generateEmbedding } from "../ai/embeddingService.js";

// Cosine similarity
const cosineSimilarity = (a, b) => {
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return dot / (magA * magB);
};

export const semanticSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json({ success: true, semantic: false, products: [] });
    }

    const queryEmbedding = await generateEmbedding(q);
    if (!queryEmbedding) {
      return res.json({ success: true, semantic: false, products: [] });
    }

    const products = await Product.find({
      embedding: { $exists: true, $ne: null },
    });

    const ranked = products
      .map((p) => ({
        product: p,
        score: cosineSimilarity(queryEmbedding, p.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((r) => r.product);

    res.json({
      success: true,
      semantic: true,
      products: ranked,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
