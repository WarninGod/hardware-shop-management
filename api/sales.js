/**
 * POST /api/sales - Create a new sale
 * GET /api/sales - List all sales
 * DELETE /api/sales/:id - Delete a sale
 */

const db = require('../server/db');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // GET /sales
    if (req.method === 'GET') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const sales = await db.query(`
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
            res.json(sales);
        } catch (error) {
            console.error('Error fetching sales:', error);
            res.status(500).json({ error: 'Failed to fetch sales' });
        }
    }

    // POST /sales
    else if (req.method === 'POST') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const { product_id, quantity } = req.body;

            if (!product_id) {
                return res.status(400).json({ error: 'Product is required' });
            }

            const qty = parseInt(quantity);
            if (isNaN(qty) || qty <= 0) {
                return res.status(400).json({ error: 'Quantity must be a positive number' });
            }

            const product = await db.queryOne(
                'SELECT id, cost_price, selling_price, stock_quantity FROM products WHERE id = $1',
                [product_id]
            );

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            if (product.stock_quantity < qty) {
                return res.status(400).json({
                    error: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${qty}`
                });
            }

            const total = parseFloat((product.selling_price * qty).toFixed(2));
            const profit = parseFloat(((product.selling_price - product.cost_price) * qty).toFixed(2));

            const saleResult = await db.query(
                'INSERT INTO sales (product_id, quantity, total, profit) VALUES ($1, $2, $3, $4) RETURNING *',
                [product_id, qty, total, profit]
            );

            await db.query(
                'UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2',
                [qty, product_id]
            );

            res.status(201).json({
                ...saleResult[0],
                message: 'Sale recorded successfully'
            });
        } catch (error) {
            console.error('Error creating sale:', error);
            res.status(500).json({ error: 'Failed to record sale' });
        }
    }

    // DELETE /sales/:id
    else if (req.method === 'DELETE') {
        try {
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const saleId = parseInt(req.query.id);

            const sale = await db.queryOne(
                'SELECT id, product_id, quantity FROM sales WHERE id = $1',
                [saleId]
            );
            if (!sale) {
                return res.status(404).json({ error: 'Sale not found' });
            }

            await db.query('DELETE FROM sales WHERE id = $1', [saleId]);
            await db.query(
                'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
                [sale.quantity, sale.product_id]
            );

            res.json({ message: 'Sale deleted and stock restored' });
        } catch (error) {
            console.error('Error deleting sale:', error);
            res.status(500).json({ error: 'Failed to delete sale' });
        }
    }

    else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

export default handler;
