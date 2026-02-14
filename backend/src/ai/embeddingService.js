// backend/ai/embeddingService.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

let OpenAI;

// Try to import OpenAI, but don't crash if it fails
try {
  OpenAI = (await import('openai')).default;
  console.log("✅ OpenAI SDK loaded");
} catch (error) {
  console.warn("⚠️ OpenAI SDK not available, using mock mode");
}

// Initialize OpenAI only if API key exists
let client = null;
if (OpenAI && process.env.OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://models.inference.ai.azure.com',
  });
  console.log("✅ OpenAI client initialized");
} else {
  console.warn("⚠️ OpenAI API key not found, using mock embeddings");
}

// Generate vector embedding for semantic search
export async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) return null;

  try {
    // If we have real OpenAI client, use it
    if (client) {
      console.log("🤖 Using real OpenAI embedding for:", text.substring(0, 30) + "...");
      const response = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    }

    // Otherwise, use mock embedding
    console.log("🎲 Using MOCK embedding for:", text.substring(0, 30) + "...");
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);

  } catch (error) {
    console.error("❌ Embedding error:", error.message);

    // Fallback to mock on error
    console.log("🎲 Falling back to MOCK embedding");
    return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
  }
}

// Cosine similarity function
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] ** 2;
    normB += b[i] ** 2;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}