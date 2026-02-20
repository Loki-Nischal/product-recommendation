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

        // Helper: try to resolve a logged-in user from req.user or Bearer token
        const readTokenUser = async () => {
            if (req.user?._id) {
                return User.findById(req.user._id)
                    .populate("likedProducts viewedProducts purchasedProducts")
                    .lean();
            }

            const auth = req.headers.authorization;
            if (!auth || !auth.startsWith("Bearer ")) return null;

            const token = auth.split(" ")[1];
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                if (!decoded?.id) return null;
                return User.findById(decoded.id)
                    .populate("likedProducts viewedProducts purchasedProducts")
                    .lean();
            } catch {
                return null;
            }
        };

        let user = null;
        try {
            user = await readTokenUser();
        } catch {
            user = null;
        }

        // Guest views fallback: accept comma-separated product ids in `views` query param
        // Example: /recommend/personalized?views=603...,604...&q=
        const guestViewsParam = (req.query.views || "").trim();
        const guestViewedIds = guestViewsParam ? guestViewsParam.split(",").map(s => s.trim()).filter(Boolean) : [];

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

        /**
         * Determine whether a user has any interaction history.
         * Cold-start = no viewed/liked/purchased products AND no search history.
         * A user who has only searched (but never clicked a product) still gets
         * behavior scoring derived from those query embeddings.
         */
        const isColdStart = (u, guestIds = []) => {
            if (Array.isArray(guestIds) && guestIds.length > 0) return false;
            if (!u) return true;
            const hasViewed = Array.isArray(u.viewedProducts) && u.viewedProducts.length > 0;
            const hasLiked = Array.isArray(u.likedProducts) && u.likedProducts.length > 0;
            const hasPurchased = Array.isArray(u.purchasedProducts) && u.purchasedProducts.length > 0;
            const hasSearched = Array.isArray(u.lastSearchQueries) && u.lastSearchQueries.length > 0;
            return !hasViewed && !hasLiked && !hasPurchased && !hasSearched;
        };

        const buildUserInterestVector = async (u, guestIds = []) => {
            // u may be a full user object from DB (with populated liked/viewed/purchased arrays),
            // or null for guests. guestIds is an array of product ids from query param.
            const vectors = [];

            if (u) {
                // Item-based collaborative filtering:
                // Collect embeddings from all three interaction signals.
                // Viewed products receive base weight (1x), liked products signal
                // stronger intent (counted once here — extend weights if needed),
                // and purchased products represent the strongest purchase intent.
                const viewed = Array.isArray(u.viewedProducts) ? u.viewedProducts : [];
                const liked = Array.isArray(u.likedProducts) ? u.likedProducts : [];
                const purchased = Array.isArray(u.purchasedProducts) ? u.purchasedProducts : [];

                for (const p of [...viewed, ...liked, ...purchased]) {
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
            }

            // If guestIds provided (from cookie/localStorage passed by frontend), include their product embeddings
            if (Array.isArray(guestIds) && guestIds.length > 0) {
                try {
                    const prods = await Product.find({ _id: { $in: guestIds } }).select('embedding').lean();
                    for (const p of prods) {
                        if (Array.isArray(p?.embedding) && p.embedding.length > 0) vectors.push(p.embedding);
                    }
                } catch (e) {
                    // ignore product fetch errors for guest ids
                }
            }

            return averageVectors(vectors);
        };

        // Detect cold-start before building the interest vector to avoid wasted work
        const coldStart = isColdStart(user, guestViewedIds);
        const userInterestVector = coldStart
            ? null
            : await buildUserInterestVector(user, guestViewedIds);

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
            // behaviorScore is only meaningful for returning users with interaction history
            const behaviorScore = !coldStart && Array.isArray(userInterestVector)
                ? cosineSimilarity(userInterestVector, product.embedding || [])
                : null;
            const popularityScore = Number(product.views || 0);

            // Promotion raw score: combine explicit promotionScore, sale flag, and time-left signal
            const now = Date.now();
            let timeLeftRatio = 0;
            if (product.discountEndTime) {
                const end = new Date(product.discountEndTime).getTime();
                // normalize time left over a 7-day window (caps at 1)
                const maxWindow = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
                timeLeftRatio = Math.max(0, Math.min(1, (end - now) / maxWindow));
            }
            const promotionRaw = (Number(product.promotionScore || 0) || 0) + (product.isOnSale ? 1 : 0) + timeLeftRatio;

            return { product, semanticScore, behaviorScore, popularityScore };
        });

        const semanticNormalized = toMinMax(scored.map((item) => item.semanticScore));
        const popularityNormalized = toMinMax(scored.map((item) => item.popularityScore));
        // Compute promotionNormalized per product
        const promotionValues = scored.map((item) => {
            const p = item.product;
            const now = Date.now();
            let timeLeftRatio = 0;
            if (p.discountEndTime) {
                const end = new Date(p.discountEndTime).getTime();
                const maxWindow = 7 * 24 * 60 * 60 * 1000;
                timeLeftRatio = Math.max(0, Math.min(1, (end - now) / maxWindow));
            }
            return (Number(p.promotionScore || 0) || 0) + (p.isOnSale ? 1 : 0) + timeLeftRatio;
        });
        const promotionNormalized = toMinMax(promotionValues);

        // Only normalize behavior scores when we have real interaction data
        const behaviorNormalized = coldStart
            ? null
            : toMinMax(scored.map((item) => item.behaviorScore ?? 0));

        const ranked = scored
            .map((item, idx) => {
                let finalScore;

                if (coldStart || behaviorNormalized === null) {
                    // Cold-start: prioritize semantic but allow promotion and popularity to influence
                    // Weights: semantic = 0.8, promotion = 0.1, popularity = 0.1
                    finalScore =
                        0.8 * (semanticNormalized[idx] || 0) +
                        0.1 * (promotionNormalized[idx] || 0) +
                        0.1 * (popularityNormalized[idx] || 0);
                } else {
                    // Returning user with interaction history: include promotion boost
                    // Weights: semantic = 0.55, behavior = 0.2, promotion = 0.15, popularity = 0.1
                    finalScore =
                        0.55 * (semanticNormalized[idx] || 0) +
                        0.2 * (behaviorNormalized[idx] || 0) +
                        0.15 * (promotionNormalized[idx] || 0) +
                        0.1 * (popularityNormalized[idx] || 0);
                }

                return {
                    ...item.product,
                    semanticScore: item.semanticScore,
                    behaviorScore: item.behaviorScore ?? 0,
                    popularityScore: item.popularityScore,
                    finalScore,
                    coldStart,
                };
            })
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 10);

        return res.json({
            success: true,
            personalized: true,
            coldStart,
            products: ranked,
        });
    } catch (err) {
        console.error("personalized recommendation error:", err?.message || err);
        return res.status(500).json({ success: false, message: "Personalized recommendation failed" });
    }
};
