// backend/scripts/createAdmin.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/userModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
    const MONGO = process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb://localhost:27017/mydb';
    await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const plain = process.env.ADMIN_PASSWORD || 'admin123'; // override via env for security
    const hashed = await bcrypt.hash(plain, 10);

    const existing = await User.findOne({ email });
    if (existing) {
        existing.password = hashed;
        existing.role = 'admin';
        await existing.save();
        console.log('Updated existing admin user:', email);
    } else {
        const u = new User({ name: 'Administrator', email, password: hashed, role: 'admin' });
        await u.save();
        console.log('Created admin user:', email);
    }

    await mongoose.disconnect();
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});