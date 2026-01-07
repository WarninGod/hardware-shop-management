/**
 * POST /api/login - User login
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const USERS = {
    'admin': { password: 'admin5050', role: 'admin' },
    'sales': { password: 'sales123', role: 'salesperson' }
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        const user = USERS[username];
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        return res.json({
            token,
            role: user.role,
            message: `Login successful as ${user.role}`
        });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ error: 'Login failed' });
    }
};
