/**
 * Utility functions for API routes
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS = {
    'admin': { password: 'admin5050', role: 'admin' },
    'sales': { password: 'sales123', role: 'salesperson' }
};

/**
 * Verify JWT token and extract user role
 */
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = decoded;
        next();
    });
}

/**
 * Require admin role
 */
function requireAdmin(req, res, next) {
    verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        next();
    });
}

/**
 * Require authenticated user
 */
function requireAuth(req, res, next) {
    verifyToken(req, res, next);
}

module.exports = {
    verifyToken,
    requireAdmin,
    requireAuth,
    USERS,
    JWT_SECRET
};
