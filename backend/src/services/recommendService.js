import LRU from "lru-cache";
import Product from "../models/productModel.js";
import { recommendProducts as aiRecommend } from "../../ai/recommendationEngine.js";

const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 });

export async function getRecommendations(productId, userId = "anon") {
  const cacheKey = `rec:${productId}:${userId}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const products = await Product.find().lean();
  const recs = await aiRecommend(products, productId);

  cache.set(cacheKey, recs);
  return recs;
}