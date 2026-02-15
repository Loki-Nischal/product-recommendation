import Product from "../models/product.js";
import User from "../models/userModel.js";
import { generateEmbedding, cosineSimilarity } from "../ai/embeddingService.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * GET /api/recommendations
 * - Protected route: identify user via middleware (req.user)
 * - Build semantic query from user's viewed categories and viewed products
 * - If OpenAI available, generate embedding and use Atlas $vectorSearch
 * - Filter results to user's viewedCategories only
 * - Return top 5-10 personalized products
 */
export const getRecommendations = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

        // Gather preferences
        const viewedCategories = Array.isArray(user.viewedCategories) ? user.viewedCategories.filter(Boolean) : [];
        const viewedProductIds = Array.isArray(user.viewedProducts) ? user.viewedProducts : [];

        if (viewedCategories.length === 0 && viewedProductIds.length === 0) {
            // No preferences → return empty personalized list (business rule)
            return res.json({ success: true, products: [] });
        }

        // Build semantic input text from category names and viewed product titles/descriptions
        let semanticTextParts = [];
        if (viewedCategories.length > 0) semanticTextParts.push(viewedCategories.join(" "));

        if (viewedProductIds.length > 0) {
            // fetch product details to include names/descriptions
            const viewedProducts = await Product.find({ _id: { $in: viewedProductIds } }).select("name title description").lean();
            for (const vp of viewedProducts) {
                semanticTextParts.push((vp.name || vp.title || "") + " " + (vp.description || ""));
            }
        }

        const semanticQueryText = semanticTextParts.join(" ").trim();

        // Try to generate embedding via OpenAI (dynamic import) if possible
        let queryEmbedding = null;
        try {
            if (process.env.OPENAI_API_KEY && semanticQueryText) {
                const OpenAI = (await import("openai")).default;
                const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                const resp = await client.embeddings.create({ model: "text-embedding-3-small", input: semanticQueryText });
                queryEmbedding = resp?.data?.[0]?.embedding || null;
            }
        } catch (err) {
            console.warn("OpenAI embedding generation failed; falling back to category-only recommendations", err?.message || err);
            queryEmbedding = null;
        }

        // If we have an embedding, run $vectorSearch and then filter to user's categories
        if (Array.isArray(queryEmbedding) && queryEmbedding.length > 0 && viewedCategories.length > 0) {
            try {
                const pipeline = [
                    {
                        $vectorSearch: {
                            index: "product_vector_index",
                            knn: {
                                vector: queryEmbedding,
                                path: "embedding",
                                k: 20,
                                similarity: "cosine",
                            },
                        },
                    },
                    // filter to user's preferred categories
                    { $match: { category: { $in: viewedCategories } } },
                    { $project: { name: 1, title: 1, description: 1, category: 1, price: 1, image: 1, score: 1 } },
                    { $limit: 10 },
                ];

                const results = await Product.aggregate(pipeline);
                // rank results already by vector similarity; we can slice top 5-10
                const products = results.slice(0, 10).map((r) => ({
                    _id: r._id,
                    name: r.name || r.title,
                    description: r.description,
                    category: r.category,
                    price: r.price,
                    image: r.image,
                    score: r.score ?? null,
                }));

                return res.json({ success: true, products });
            } catch (vecErr) {
                console.warn("Vector recommendation failed:", vecErr?.message || vecErr);
                // fall through to category-only fallback
            }
        }

        // Fallback: recommend only from viewedCategories (no popularity/rating)
        if (viewedCategories.length > 0) {
            const fallback = await Product.find({ category: { $in: viewedCategories } }).limit(10).lean();
            return res.json({ success: true, products: fallback });
        }

        // If no categories but have viewedProducts, recommend products similar by exact category of viewed products
        if (viewedProductIds.length > 0) {
            const viewed = await Product.find({ _id: { $in: viewedProductIds } }).select("category").lean();
            const cats = [...new Set(viewed.map((v) => v.category).filter(Boolean))];
            if (cats.length > 0) {
                const fallback2 = await Product.find({ category: { $in: cats } }).limit(10).lean();
                return res.json({ success: true, products: fallback2 });
            }
        }

        return res.json({ success: true, products: [] });
    } catch (err) {
        console.error("getRecommendations error:", err?.message || err);
        return res.status(500).json({ success: false, message: "Recommendation failed" });
    }
};

// GET /api/recommend/personalized?q=
export const getPersonalizedRecommendations = async (req, res) => {
    try {
        const q = (req.query.q || "").trim();
        const queryEmbedding = q ? await generateEmbedding(q) : null;

        const readTokenUser = async () => {
            if (req.user?._id) {
                return User.findById(req.user._id)
                    .populate("likedProducts viewedProducts")
                    .lean();
            }

            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith("Bearer ")) return null;

            const token = auth.split(" ")[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            if (!decoded?.id) return null;

            return User.findById(decoded.id)
                .populate("likedProducts viewedProducts")
                .lean();
        };

        let user = null;
        try {
            user = await readTokenUser();
        } catch {
            user = null;
        }

        const averageVectors = (vectors) => {
            const valid = vectors.filter((v) => Array.isArray(v) && v.length > 0);
            if (valid.length === 0) return null;

            const dim = valid[0].length;
            const sameDim = valid.filter((v) => v.length === dim);
            if (sameDim.length === 0) return null;

            const sum = new Array(dim).fill(0);
            for (const v of sameDim) {
                for (let i = 0; i < dim; i++) sum[i] += v[i];
            }
            return sum.map((x) => x / sameDim.length);
        };

        const buildUserInterestVector = async (u) => {
            if (!u) return null;

            const vectors = [];
            const liked = Array.isArray(u.likedProducts) ? u.likedProducts : [];
            const viewed = Array.isArray(u.viewedProducts) ? u.viewedProducts : [];

            for (const p of [...liked, ...viewed]) {
                if (Array.isArray(p?.embedding) && p.embedding.length > 0) vectors.push(p.embedding);
            }

            const queries = Array.isArray(u.lastSearchQueries) ? u.lastSearchQueries.slice(0, 10) : [];
            if (queries.length > 0) {
                const queryEmbeddings = await Promise.all(
                    queries.map(async (text) => {
                        try {
                            return await generateEmbedding(text);
                        } catch {
                            return null;
                        }
                    })
                );
                for (const emb of queryEmbeddings) {
                    if (Array.isArray(emb) && emb.length > 0) vectors.push(emb);
                }
            }

            return averageVectors(vectors);
        };

        const userInterestVector = await buildUserInterestVector(user);

        const products = await Product.find({ embedding: { $exists: true, $ne: [] } }).lean();
        if (products.length === 0) {
            return res.json({ success: true, personalized: true, products: [] });
        }

        const toMinMax = (values) => {
            if (!values.length) return [];
            const min = Math.min(...values);
            const max = Math.max(...values);
            if (min === max) return values.map(() => 0);
            return values.map((v) => (v - min) / (max - min));
        };

        const scored = products.map((product) => {
            const semanticScore = Array.isArray(queryEmbedding)
                ? cosineSimilarity(queryEmbedding, product.embedding || [])
                : 0;
            const behaviorScore = Array.isArray(userInterestVector)
                ? cosineSimilarity(userInterestVector, product.embedding || [])
                : 0;
            const popularityScore = Number(product.views || 0);

            return { product, semanticScore, behaviorScore, popularityScore };
        });

        const semanticNormalized = toMinMax(scored.map((item) => item.semanticScore));
        const behaviorNormalized = toMinMax(scored.map((item) => item.behaviorScore));
        const popularityNormalized = toMinMax(scored.map((item) => item.popularityScore));

        const ranked = scored
            .map((item, idx) => {
                const finalScore =
                    0.6 * (semanticNormalized[idx] || 0) +
                    0.3 * (behaviorNormalized[idx] || 0) +
                    0.1 * (popularityNormalized[idx] || 0);

                return {
                    ...item.product,
                    semanticScore: item.semanticScore,
                    behaviorScore: item.behaviorScore,
                    popularityScore: item.popularityScore,
                    finalScore,
                };
            })
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 10);

        // fallback behavior: if no history/user vector, ranking is effectively semantic-only
        return res.json({ success: true, personalized: true, products: ranked });
    } catch (err) {
        console.error("personalized recommendation error:", err?.message || err);
        return res.status(500).json({ success: false, message: "Personalized recommendation failed" });
    }
};
