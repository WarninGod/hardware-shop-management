/**
 * GET /api/products - List all products
 * POST /api/products - Create a new product
 * PUT /api/products/:id - Update a product
 * DELETE /api/products/:id - Delete a product
 */

const db = require('../server/db');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET /products
    if (req.method === 'GET') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const products = await db.query(`
                SELECT 
                    p.id,
                    p.name,
                    p.category,
                    p.vendor_id,
                    v.name as vendor_name,
                    p.selling_price,
                    p.stock_quantity,
                    p.created_at
                FROM products p
                LEFT JOIN vendors v ON p.vendor_id = v.id
                ORDER BY p.name ASC
            `);
            res.json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    // POST /products
    else if (req.method === 'POST') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const { name, category, vendor_id, cost_price, selling_price, stock_quantity } = req.body;

            if (!name || !name.trim()) {
                return res.status(400).json({ error: 'Product name is required' });
            }
            if (!category || !category.trim()) {
                return res.status(400).json({ error: 'Category is required' });
            }
            if (!vendor_id) {
                return res.status(400).json({ error: 'Vendor is required' });
            }

            const costPrice = parseFloat(cost_price);
            const sellingPrice = parseFloat(selling_price);
            const quantity = parseInt(stock_quantity) || 0;

            if (isNaN(costPrice) || costPrice < 0) {
                return res.status(400).json({ error: 'Cost price must be a non-negative number' });
            }
            if (isNaN(sellingPrice) || sellingPrice <= costPrice) {
                return res.status(400).json({ error: 'Selling price must be greater than cost price' });
            }
            if (quantity < 0) {
                return res.status(400).json({ error: 'Stock quantity cannot be negative' });
            }

            const vendor = await db.queryOne('SELECT id FROM vendors WHERE id = $1', [vendor_id]);
            if (!vendor) {
                return res.status(400).json({ error: 'Vendor not found' });
            }

            const result = await db.query(
                'INSERT INTO products (name, category, vendor_id, cost_price, selling_price, stock_quantity) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
                [name.trim(), category.trim(), vendor_id, costPrice, sellingPrice, quantity]
            );

            res.status(201).json({
                ...result[0],
                message: 'Product created successfully'
            });
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }

    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

export default handler;
