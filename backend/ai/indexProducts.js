// backend/ai/indexProducts.js
// Run this script once to generate and store embeddings for ALL products in DB
// Usage: node --experimental-vm-modules ai/indexProducts.js
//    OR: node -e "import('./ai/indexProducts.js')"

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { generateEmbedding } from './embeddingService.js';
import Product from '../src/models/product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set in .env');
    process.exit(1);
}

try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 Connected to MongoDB');
} catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
}

// ─── Main Indexing Logic ──────────────────────────────────────────────────────
const indexAllProducts = async () => {
    const products = await Product.find({}).lean();

    if (products.length === 0) {
        console.log('⚠️  No products found in the database.');
        process.exit(0);
    }

    console.log(`📦 Found ${products.length} products. Starting embedding...\n`);

    let successCount = 0;
    let failCount = 0;

    for (const product of products) {
        try {
            // Build text representation for embedding
            const text = [
                product.title || product.name || '',
                product.description || '',
                product.category || '',
                product.brand || '',
                (product.tags || []).join(' '),
            ]
                .filter(Boolean)
                .join(' ')
                .trim();

            if (!text) {
                console.warn(`⚠️  Skipping product ${product._id} — no text to embed`);
                failCount++;
                continue;
            }

            const embedding = await generateEmbedding(text);

            if (!embedding || embedding.length === 0) {
                console.warn(`⚠️  Empty embedding for: ${product.title || product.name}`);
                failCount++;
                continue;
            }

            await Product.findByIdAndUpdate(product._id, { embedding });
            console.log(`✅ [${++successCount}/${products.length}] Indexed: ${product.title || product.name}`);
        } catch (err) {
            console.error(`❌ Failed to embed "${product.title || product.name}": ${err.message}`);
            failCount++;
        }
    }

    console.log(`\n🎉 Done! ${successCount} products indexed, ${failCount} failed.`);
    await mongoose.disconnect();
    process.exit(0);
};

indexAllProducts();
