/**
 * POST /api/sales - Create a new sale
 * GET /api/sales - List all sales
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
        res.status(200).end();
        return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        // GET /sales
        if (req.method === 'GET') {
            const result = await pool.query(`
                SELECT 
                    s.id,
                    s.product_id,
                    p.name as product_name,
                    s.quantity,
                    s.total,
                    s.profit,
                    s.sale_date
                FROM sales s
                LEFT JOIN products p ON s.product_id = p.id
                ORDER BY s.sale_date DESC
                LIMIT 100
            `);
            return res.json(result.rows);
        }

        // POST /sales
        else if (req.method === 'POST') {
            const { product_id, quantity } = req.body;

            if (!product_id) {
                return res.status(400).json({ error: 'Product is required' });
            }

            const qty = parseInt(quantity);
            if (isNaN(qty) || qty <= 0) {
                return res.status(400).json({ error: 'Quantity must be a positive number' });
            }

            const productResult = await pool.query(
                'SELECT id, cost_price, selling_price, stock_quantity FROM products WHERE id = $1',
                [product_id]
            );

            if (productResult.rows.length === 0) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const product = productResult.rows[0];

            if (product.stock_quantity < qty) {
                return res.status(400).json({
                    error: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${qty}`
                });
            }

            const total = parseFloat((product.selling_price * qty).toFixed(2));
            const profit = parseFloat(((product.selling_price - product.cost_price) * qty).toFixed(2));

            const saleResult = await pool.query(
                'INSERT INTO sales (product_id, quantity, total, profit) VALUES ($1, $2, $3, $4) RETURNING *',
                [product_id, qty, total, profit]
            );

            await pool.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [qty, product_id]
            );

            return res.status(201).json({
                ...saleResult.rows[0],
                message: 'Sale recorded successfully'
            });
        }

        // DELETE /sales?id=X
        else if (req.method === 'DELETE') {
            const saleId = parseInt(req.query.id);

            const saleResult = await pool.query(
                'SELECT id, product_id, quantity FROM sales WHERE id = $1',
                [saleId]
            );
            if (saleResult.rows.length === 0) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            const sale = saleResult.rows[0];

            await pool.query('DELETE FROM sales WHERE id = $1', [saleId]);
            await pool.query(
                'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                [sale.quantity, sale.product_id]
            );

            return res.json({ message: 'Sale deleted and stock restored' });
        }

        else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Error in sales API:', error);
        return res.status(500).json({ error: 'Failed to process request' });
    }
};
