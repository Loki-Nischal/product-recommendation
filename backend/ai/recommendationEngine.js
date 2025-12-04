import OpenAI from "openai";

/**
 * Initialize OpenAI
 * Use your API key from .env
 */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Convert text to an embedding vector
 */
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate recommendations based on:
 * - product title
 * - description
 */
export async function recommendProducts(products, queryProductId) {
  const targetProduct = products.find((p) => p._id.toString() === queryProductId);

  if (!targetProduct) return [];

  const targetText = `${targetProduct.title} ${targetProduct.description}`;
  const targetEmbed = await getEmbedding(targetText);

  // Calculate similarity for all products
  const scored = [];

  for (let product of products) {
    if (product._id.toString() === queryProductId) continue;

    const text = `${product.title} ${product.description}`;
    const embed = await getEmbedding(text);

    const score = cosineSimilarity(targetEmbed, embed);

    scored.push({
      product,
      score,
    });
  }

  // Return top 5 recommendations
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((item) => item.product);
}
