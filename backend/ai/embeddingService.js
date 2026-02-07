import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate vector embedding for semantic search
export async function generateEmbedding(text) {
  if (!text || text.trim().length === 0) return null;

  try {
    const response = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding; // number[]
  } catch (error) {
    console.error("Embedding error:", error.message);
    return null; // safe fallback
  }
}
