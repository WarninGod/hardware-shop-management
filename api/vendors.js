/**
 * GET /api/vendors - List all vendors
 * POST /api/vendors - Create a new vendor
 * DELETE /api/vendors - Delete a vendor (requires ?id=)
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify token for all methods
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // GET /vendors - List all vendors
        if (req.method === 'GET') {
            const result = await pool.query(
                'SELECT id, name, phone, created_at FROM vendors ORDER BY name ASC'
            );
            return res.json(result.rows);
        }

        // POST /vendors - Create a new vendor
        else if (req.method === 'POST') {
            const { name, phone } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Vendor name is required' });
            }

            const result = await pool.query(
                'INSERT INTO vendors (name, phone) VALUES ($1, $2) RETURNING id, name, phone',
                [name.trim(), phone || null]
            );

            return res.status(201).json({
                ...result.rows[0],
                message: 'Vendor created successfully'
            });
        }

        // DELETE /vendors?id=X
        else if (req.method === 'DELETE') {
            const vendorId = parseInt(req.query.id);

            const vendor = await pool.query('SELECT id FROM vendors WHERE id = $1', [vendorId]);
            if (vendor.rows.length === 0) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const products = await pool.query('SELECT id FROM products WHERE vendor_id = $1 LIMIT 1', [vendorId]);
            if (products.rows.length > 0) {
                return res.status(400).json({ error: 'Cannot delete vendor with existing products' });
            }

            await pool.query('DELETE FROM vendors WHERE id = $1', [vendorId]);

            return res.json({ message: 'Vendor deleted successfully' });
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        if (error.message && error.message.includes('unique')) {
            return res.status(409).json({ error: 'Vendor name already exists' });
        }
        console.error('Error in vendors API:', error);
        return res.status(500).json({ error: 'Failed to process request' });
    }
};
