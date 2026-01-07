/**
 * GET /api/vendors - List all vendors
 * POST /api/vendors - Create a new vendor
 * DELETE /api/vendors/:id - Delete a vendor
 */

const db = require('../server/db');
const { requireAuth, requireAdmin } = require('./auth');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET /vendors - List all vendors
    if (req.method === 'GET') {
        try {
            // Verify token
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const vendors = await db.query(
                'SELECT id, name, phone, created_at FROM vendors ORDER BY name ASC'
            );
            res.json(vendors);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            res.status(500).json({ error: 'Failed to fetch vendors' });
        }
    }

    // POST /vendors - Create a new vendor
    else if (req.method === 'POST') {
        try {
            // Verify admin token
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const { name, phone } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Vendor name is required' });
            }

            const result = await db.query(
                'INSERT INTO vendors (name, phone) VALUES ($1, $2) RETURNING id, name, phone',
                [name.trim(), phone || null]
            );

            res.status(201).json({
                ...result[0],
                message: 'Vendor created successfully'
            });
        } catch (error) {
            if (error.message && error.message.includes('unique')) {
                return res.status(409).json({ error: 'Vendor name already exists' });
            }
            console.error('Error creating vendor:', error);
            res.status(500).json({ error: 'Failed to create vendor' });
        }
    }

    // DELETE /vendors/:id
    else if (req.method === 'DELETE') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const vendorId = parseInt(req.query.id);

            const vendor = await db.queryOne('SELECT id FROM vendors WHERE id = $1', [vendorId]);
            if (!vendor) {
                return res.status(404).json({ error: 'Vendor not found' });
            }

            const products = await db.queryOne('SELECT id FROM products WHERE vendor_id = $1 LIMIT 1', [vendorId]);
            if (products) {
                return res.status(400).json({ error: 'Cannot delete vendor with existing products' });
            }

            await db.query('DELETE FROM vendors WHERE id = $1', [vendorId]);

            res.json({ message: 'Vendor deleted successfully' });
        } catch (error) {
            console.error('Error deleting vendor:', error);
            res.status(500).json({ error: 'Failed to delete vendor' });
        }
    }

    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

export default handler;
