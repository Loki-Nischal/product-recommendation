import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { setAdminSession, clearAdminSession } from '../utils/sessionStore.js';
import { protect, admin as adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ADMIN LOGIN (server-backed)
router.post('/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = (email || '').trim();
        password = (password || '').toString();

        // case-insensitive email lookup
        const escapeReg = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const emailRegex = new RegExp('^' + escapeReg(email) + '$', 'i');
        const user = await User.findOne({ email: emailRegex });

        console.debug('Admin login attempt for:', email, 'userFound:', !!user);
        if (!user) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        console.debug('Password compare result:', isMatch);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });

        if (user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not an admin' });

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        // compute expiry timestamp in ms from token payload
        let expiryMs = Date.now() + 7 * 24 * 3600 * 1000;
        try {
            const payload = jwt.decode(token);
            if (payload && payload.exp) expiryMs = payload.exp * 1000;
        } catch (e) {
            /* ignore */
        }

        setAdminSession(user._id, token, expiryMs);

        res.status(200).json({ success: true, message: 'Admin login successful', token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error('Admin login error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ADMIN LOGOUT - clears server-side admin session
// This endpoint will attempt to clear the admin session based on the provided
// Authorization token. It will tolerate expired/invalid tokens by decoding the
// token payload (without verification) to extract the admin id so the server
// session can be removed even when the token cannot be verified.
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        let adminId = null;

        if (token) {
            // Try to verify first (preferred)
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                adminId = decoded.id;
            } catch (verifyErr) {
                // If verification fails (expired, etc.) try a non-verifying decode
                try {
                    const decoded = jwt.decode(token);
                    adminId = decoded?.id;
                } catch (decodeErr) {
                    // ignore
                }
            }
        }

        // As a last fallback, if protect middleware ran earlier and set req.user
        if (!adminId && req.user && req.user._id) adminId = req.user._id;

        if (!adminId) {
            return res.status(400).json({ success: false, message: 'No admin token provided or token malformed' });
        }

        clearAdminSession(adminId);
        return res.status(200).json({ success: true, message: 'Admin logged out' });
    } catch (err) {
        console.error('Admin logout error', err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
