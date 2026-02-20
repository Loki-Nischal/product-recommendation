import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Order from '../models/order.js';
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

// ─── ADMIN STATS ────────────────────────────────────────────────────────────
router.get('/stats', protect, adminMiddleware, async (req, res) => {
    try {
        const [userCount, orders] = await Promise.all([
            User.countDocuments({ role: { $ne: 'admin' } }),
            Order.find({}).select('status paymentStatus total createdAt').lean(),
        ]);

        const totalRevenue = orders
            .filter((o) => o.paymentStatus === 'paid')
            .reduce((s, o) => s + (o.total || 0), 0);

        const byStatus = {};
        for (const s of ['pending', 'processing', 'shipped', 'delivered', 'cancelled']) {
            byStatus[s] = orders.filter((o) => o.status === s).length;
        }

        // recent 7 days revenue
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
        const recentRevenue = orders
            .filter((o) => o.paymentStatus === 'paid' && new Date(o.createdAt) >= sevenDaysAgo)
            .reduce((s, o) => s + (o.total || 0), 0);

        res.json({ success: true, stats: { userCount, totalOrders: orders.length, totalRevenue, recentRevenue, byStatus } });
    } catch (err) {
        console.error('Admin stats error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ─── ADMIN USERS ────────────────────────────────────────────────────────────
router.get('/users', protect, adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .populate('likedProducts', 'title name price image')
            .populate('viewedProducts', 'title name price image')
            .populate('cartProducts', 'title name price image')
            .sort({ createdAt: -1 });

        const userIds = users.map((u) => u._id);
        const orders = await Order.find({ user: { $in: userIds } }).select('user total status paymentStatus createdAt').lean();

        const orderMap = {};
        for (const o of orders) {
            const uid = o.user.toString();
            if (!orderMap[uid]) orderMap[uid] = { count: 0, totalSpent: 0 };
            orderMap[uid].count += 1;
            if (o.paymentStatus === 'paid') orderMap[uid].totalSpent += o.total || 0;
        }

        const result = users.map((u) => ({ ...u.toObject(), orderStats: orderMap[u._id.toString()] || { count: 0, totalSpent: 0 } }));
        res.json({ success: true, users: result });
    } catch (err) {
        console.error('Admin get users error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/users/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('likedProducts', 'title name price image category')
            .populate('viewedProducts', 'title name price image category')
            .populate('purchasedProducts', 'title name price image category')
            .populate('cartProducts', 'title name price image category');

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
        res.json({ success: true, user, orders });
    } catch (err) {
        console.error('Admin get user detail error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.delete('/users/:id', protect, adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin accounts' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (err) {
        console.error('Admin delete user error', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
