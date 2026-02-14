// backend/src/controllers/chatController.js
import Product from '../models/product.js';
import OpenAI from 'openai';
import { generateEmbedding, cosineSimilarity } from '../ai/embeddingService.js';

const conversations = new Map(); // in-memory per-user history

// Lazy-init OpenAI client pointing to GitHub Models endpoint
let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://models.inference.ai.azure.com',
    });
  }
  return openai;
}

export async function handleChat(req, res) {
  const { message, userId = 'guest' } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ reply: 'Please type something...', products: [] });
  }

  let history = conversations.get(userId) || [];
  history.push({ role: 'user', content: message });

  try {
    let parsed = {};
    const client = getOpenAI();

    if (client) {
      try {
        const completion = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-5',
          messages: getMessages(history),
          temperature: 0.3,
          max_tokens: 600,
          response_format: { type: 'json_object' }
        });

        const raw = completion.choices?.[0]?.message?.content;
        console.log('🤖 GPT raw:', raw);
        parsed = safeParseJSON(raw) || {};
      } catch (aiErr) {
        console.warn('⚠️ OpenAI error, falling back to keyword search:', aiErr?.message || aiErr);
        parsed = smartKeywordParse(message);
      }
    } else {
      console.warn('⚠️ No OpenAI key – using keyword fallback');
      parsed = smartKeywordParse(message);
    }

    // Ensure parsed has expected shape
    parsed.intent = parsed.intent || 'search';
    parsed.showProducts = typeof parsed.showProducts === 'boolean' ? parsed.showProducts : true;
    parsed.filters = parsed.filters || {};

    // If user asked about shoes but model didn't set category, set a preferred category
    // (don't enforce it strictly because DB items may be labeled differently)
    if ((!parsed.filters.category || parsed.filters.category === null) && looksLikeShoeQuery(parsed.filters.keywords || message)) {
      parsed.filters.preferredCategory = 'Sports';
    }

    let products = [];

    if (parsed.intent === 'search' || parsed.showProducts === true) {
      const query = buildMongoQuery(parsed.filters || {});
      console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));

      products = await Product.find(query)
        .sort(getSort(parsed.sort))
        .limit(10)
        .lean();

      if (products.length > 0 && !parsed.includeOutOfStock) {
        products = products.filter(p => p.stock > 0);
      }

      console.log(`📦 Found ${products.length} products`);

      // Semantic fallback when no exact matches
      if (products.length === 0) {
        try {
          const qText = (parsed.filters && parsed.filters.keywords) ? parsed.filters.keywords : message;
          const qEmbedding = await generateEmbedding(qText);
          if (qEmbedding) {
            console.log('🔁 Falling back to embedding search for:', qText.substring(0, 100));

            // Try candidates in preferred category first (if any), then fall back to all categories
            let candidates = [];
            const candidateQuery = { embedding: { $exists: true, $ne: [] } };
            const preferredCat = parsed.filters?.category || parsed.filters?.preferredCategory;
            if (preferredCat) {
              const qWithCat = { ...candidateQuery, category: preferredCat };
              candidates = await Product.find(qWithCat).lean();
            }
            // If none found in preferred category, search across all products with embeddings
            if (!candidates || candidates.length === 0) {
              candidates = await Product.find(candidateQuery).lean();
            }

            const scored = candidates
              .map(p => ({ product: p, score: cosineSimilarity(qEmbedding, p.embedding || []) }))
              .sort((a, b) => b.score - a.score);

            const strong = scored.filter(s => s.score > 0.45).slice(0, 10).map(s => s.product);
            if (strong.length > 0) {
              products = strong;
              console.log(`🔎 Embedding search returned ${strong.length} strong matches`);
            } else {
              const top5 = scored.slice(0, 5);
              console.log('🔎 Top embedding scores:', top5.map(t => ({ id: t.product._id, score: t.score })));
              if (top5.length > 0) {
                products = top5.map(s => s.product);
                console.log(`🔎 Embedding fallback returning top ${products.length} best-effort matches (low confidence)`);
              } else {
                console.log('🔎 Embedding search returned no matches at all');
              }
            }
          }
        } catch (embErr) {
          console.warn('⚠️ Embedding fallback failed:', embErr?.message || embErr);
        }
      }
    }

    history.push({ role: 'assistant', content: parsed.reply });
    conversations.set(userId, history.slice(-12));

    res.json({
      reply: parsed.reply || "Here's what I found...",
      products: products.map(p => ({
        _id: p._id,
        title: p.title || p.name,
        price: p.price,
        image: p.image,
        category: p.category,
        brand: p.brand,
        rating: p.rating
      })),
      hasMore: products.length === 10
    });
  } catch (err) {
    console.error('❌ Chat error:', err);
    res.status(500).json({
      reply: "Sorry, I'm having trouble right now. Can you try again?",
      products: [],
      error: err?.message || String(err)
    });
  }
}

function getMessages(history) {
  return [
    {
      role: 'system',
      content: `You are a friendly shopping assistant.
Current date: 2025. Be concise.

When the user wants products, extract filters and return **JSON only**:

{
  "intent": "search" | "chat" | "greeting" | "other",
  "reply": "short message to user (always friendly)",
  "showProducts": true/false,
  "filters": {
    "keywords": "words to search in title/name/description",
    "category": "Electronics|Clothing|..." or null,
    "brand": string or null,
    "minPrice": number|null,
    "maxPrice": number|null,
    "tags": ["gaming","wireless"] or null,
    "minRating": number|null,
    "inStockOnly": true/false
  },
  "sort": "price-low"|"price-high"|"rating"|"newest"|null,
  "includeOutOfStock": false
}

If no product intent → intent:"chat", showProducts:false, just normal reply.`
    },
    ...history.slice(-10)
  ];
}

function buildMongoQuery(f) {
  const q = {};

  if (f.keywords) {
    const words = f.keywords.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      q.$or = [
        { title: { $regex: words.join('|'), $options: 'i' } },
        { name: { $regex: words.join('|'), $options: 'i' } },
        { description: { $regex: words.join('|'), $options: 'i' } }
      ];
    }
  }

  if (f.category) q.category = f.category;
  if (f.brand) q.brand = { $regex: new RegExp(f.brand, 'i') };
  if (f.tags?.length) q.tags = { $in: f.tags };

  if (f.minPrice || f.maxPrice) {
    q.price = {};
    if (f.minPrice) q.price.$gte = Number(f.minPrice);
    if (f.maxPrice) q.price.$lte = Number(f.maxPrice);
  }

  if (f.minRating) {
    q.rating = { $gte: Number(f.minRating) };
  }

  if (f.inStockOnly !== false) {
    q.stock = { $gt: 0 };
  }

  return q;
}

function getSort(sort) {
  if (sort === 'price-low') return { price: 1 };
  if (sort === 'price-high') return { price: -1 };
  if (sort === 'rating') return { rating: -1 };
  if (sort === 'newest') return { createdAt: -1 };
  return { createdAt: -1 };
}

// ── Smart keyword parser (works without GPT) ──
function smartKeywordParse(message) {
  const lower = message.toLowerCase();

  // Detect greetings
  const greetings = ['hello', 'hi', 'hey', 'hii', 'hola', 'good morning', 'good evening'];
  if (greetings.some(g => lower.trim() === g || lower.startsWith(g + ' '))) {
    return {
      intent: 'greeting',
      reply: "Hey there! 👋 I'm your shopping assistant. Try asking me things like:\n• \"cheap phones under 15000\"\n• \"best laptops\"\n• \"gaming accessories\"",
      showProducts: false,
      filters: {},
      sort: null,
      includeOutOfStock: false
    };
  }

  // Extract price hints
  let maxPrice = null;
  let minPrice = null;
  const underMatch = lower.match(/under\s+(\d+)/);
  const belowMatch = lower.match(/below\s+(\d+)/);
  const aboveMatch = lower.match(/above\s+(\d+)/);
  const overMatch = lower.match(/over\s+(\d+)/);
  const budgetMatch = lower.match(/budget\s+(\d+)/);
  if (underMatch) maxPrice = Number(underMatch[1]);
  if (belowMatch) maxPrice = Number(belowMatch[1]);
  if (budgetMatch) maxPrice = Number(budgetMatch[1]);
  if (aboveMatch) minPrice = Number(aboveMatch[1]);
  if (overMatch) minPrice = Number(overMatch[1]);

  // Detect "cheap" → sort by price low
  const wantsCheap = /cheap|budget|affordable|low.?price|inexpensive/i.test(lower);
  const wantsBest = /best|top|premium|high.?end|expensive/i.test(lower);

  // Detect known categories
  const categories = ['electronics', 'clothing', 'shoes', 'accessories', 'home', 'sports', 'books', 'beauty'];
  let category = null;
  for (const cat of categories) {
    if (lower.includes(cat)) { category = cat.charAt(0).toUpperCase() + cat.slice(1); break; }
  }

  // Strip noise words to get search keywords
  const noise = ['show', 'me', 'find', 'search', 'get', 'want', 'need', 'looking', 'for',
    'some', 'a', 'an', 'the', 'please', 'can', 'you', 'i', 'any', 'good',
    'cheap', 'budget', 'affordable', 'best', 'top', 'under', 'below', 'above', 'over'];
  const keywords = lower
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !noise.includes(w) && !/^\d+$/.test(w))
    .join(' ');

  const sort = wantsCheap ? 'price-low' : wantsBest ? 'price-high' : null;

  return {
    intent: 'search',
    reply: keywords
      ? `Let me find ${keywords} for you!`
      : "Here's what I found for you!",
    showProducts: true,
    filters: {
      keywords: keywords || null,
      category,
      brand: null,
      minPrice,
      maxPrice,
      tags: null,
      minRating: null,
      inStockOnly: true
    },
    sort,
    includeOutOfStock: false
  };
}

// Try multiple strategies to parse JSON returned by model
function safeParseJSON(raw) {
  if (!raw || typeof raw !== 'string') return {};

  // 1) direct parse
  try {
    return JSON.parse(raw);
  } catch (e) {
    // continue
  }

  // 2) extract the first {...} block that is balanced
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = raw.slice(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate); } catch (e) { /* continue */ }
  }

  // 3) attempt to find the largest balanced JSON object by scanning
  let best = null;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '{') continue;
    let depth = 0;
    for (let j = i; j < raw.length; j++) {
      if (raw[j] === '{') depth++;
      else if (raw[j] === '}') depth--;
      if (depth === 0) {
        const chunk = raw.slice(i, j + 1);
        try { best = JSON.parse(chunk); return best; } catch (e) { break; }
      }
    }
  }

  // 4) sanitize invalid backslashes: escape backslashes not followed by valid escapes
  try {
    const sanitized = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    return JSON.parse(sanitized);
  } catch (e) {
    console.warn('⚠️ safeParseJSON: failed to parse model output');
    return {};
  }
}

// Lightweight heuristic: detect shoe-related queries
function looksLikeShoeQuery(text) {
  if (!text) return false;
  const t = text.toLowerCase();
  const shoeWords = ['shoe', 'shoes', 'sneaker', 'sneakers', 'running', 'trainer', 'trainers', 'sports shoe', 'sports shoes'];
  return shoeWords.some(w => t.includes(w));
}