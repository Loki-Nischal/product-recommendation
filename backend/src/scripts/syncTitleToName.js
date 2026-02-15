#!/usr/bin/env node
import connectDB from "../config/db.js";
import Product from "../models/product.js";

const sync = async () => {
    try {
        await connectDB();
        console.log("Connected to DB — syncing title -> name where needed...");

        const products = await Product.find().lean();
        let updated = 0;
        for (const p of products) {
            const title = typeof p.title === 'string' ? p.title.trim() : '';
            const name = typeof p.name === 'string' ? p.name.trim() : '';
            if (title && title !== name) {
                await Product.findByIdAndUpdate(p._id, { name: title, title }, { new: true });
                updated++;
                console.log(`Synced product ${p._id}: set name='${title}'`);
            }
        }

        console.log(`Done. Updated ${updated} products.`);
        process.exit(0);
    } catch (err) {
        console.error('Sync failed:', err);
        process.exit(1);
    }
};

sync();
