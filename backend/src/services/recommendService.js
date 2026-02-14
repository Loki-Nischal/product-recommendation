// backend/src/services/recommendationService.js

import LRU from 'lru-cache';
import Product from '../models/productModel.js';
import { recommendProducts as aiRecommend } from '../../ai/recommendationEngine.js';
import logger from '../utils/logger.js'; // ← add simple winston/pino logger if missing

// Cache per-user + context, longer TTL for anon, shorter for logged-in
const cache = new LRU({
  max: 2000,                    // increase if you have RAM
  ttl: 1000 * 60 * 10,          // 10 min default
  updateAgeOnGet: true,
  dispose: (value, key) => {
    // optional: log cache eviction for debugging
  }
});

const ANON_TTL = 1000 * 60 * 30;   // 30 min for anonymous
const USER_TTL = 1000 * 60 * 3;    // 3 min for logged-in (more dynamic)

export async function getRecommendations(
  productId,
  userId = 'anon',
  options = {}
) {
  const {
    limit = 8,
    minSimilarity = 0.65,           // if your engine returns similarity score
    includeViewed = false,
  } = options;

  const isAnon = userId === 'anon' || !userId;
  const cacheKey = `rec:${productId}:${userId}:${limit}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  try {
    let recs = [];

    // ──────────────────────────────────────────────
    // Phase 1: Try vector search if embeddings exist in DB
    // (strongly recommended if you have embeddingService)
    // ──────────────────────────────────────────────
    const targetProduct = await Product.findById(productId)
      .select('embedding title category price') // only needed fields
      .lean();

    if (!targetProduct?.embedding) {
      logger.warn(`No embedding for product ${productId} — falling back to AI engine`);
    } else {
      // Example: MongoDB Atlas Vector Search (add index first!)
      recs = await Product.aggregate([
        {
          $vectorSearch: {
            index: 'vector_index',           // create this in Atlas
            path: 'embedding',
            queryVector: targetProduct.embedding,
            numCandidates: limit * 3,
            limit: limit * 2,
          }
        },
        { $match: { _id: { $ne: targetProduct._id } } }, // exclude self
        { $limit: limit },
        {
          $project: {
            _id: 1,
            title: 1,
            price: 1,
            image: 1,
            category: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]);

      // Optional: filter low similarity
      recs = recs.filter(r => r.score >= minSimilarity);
    }

    // ──────────────────────────────────────────────
    // Phase 2: Fallback to your existing AI engine
    // ──────────────────────────────────────────────
    if (recs.length < limit / 2) {
      // Load only candidates — never full collection!
      const candidateFilter = {
        _id: { $ne: productId },
        stock: { $gt: 0 },               // in stock only
        // optional: category: targetProduct?.category  (pre-filter)
      };

      const candidates = await Product.find(candidateFilter)
        .select('title name description embedding category price brand tags')
        .limit(300)                      // safety limit — adjust
        .lean();

      if (candidates.length === 0) {
        logger.warn(`No candidates found for product ${productId}`);
        return [];
      }

      recs = await aiRecommend(
        candidates,
        productId,
        { userId, limit, minSimilarity }
      );
    }

    // Enrich with extra fields if needed (price, image, etc.)
    const finalRecs = await Product.find(
      { _id: { $in: recs.map(r => r._id || r) } },
      'title name price image category brand rating stock'
    ).lean();

    // Sort by score / relevance if your engine returns it
    // finalRecs.sort((a, b) => b.score - a.score);

    // Cache result
    const ttl = isAnon ? ANON_TTL : USER_TTL;
    cache.set(cacheKey, finalRecs, { ttl });

    return finalRecs;

  } catch (err) {
    logger.error('Recommendation error', {
      productId,
      userId,
      error: err.message,
      stack: err.stack?.slice(0, 200)
    });
    return []; // graceful degradation
  }
}