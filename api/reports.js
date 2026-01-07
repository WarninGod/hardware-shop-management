/**
 * GET /api/reports?type=summary - Overall sales and profit summary
 * GET /api/reports?type=product-profit - Product-wise profit analysis
 * GET /api/reports?type=vendor-profit - Vendor-wise profit analysis
 * GET /api/reports?type=daily-sales - Daily sales summary
 */

const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const reportType = req.query.type || 'summary';

        if (reportType === 'summary') {
            const result = await pool.query(`
                SELECT 
                    COUNT(*) as total_sales,
                    COALESCE(SUM(quantity), 0) as total_quantity,
                    COALESCE(SUM(total), 0) as total_sales_amount,
                    COALESCE(SUM(profit), 0) as total_profit
                FROM sales
            `);

            const summary = result.rows[0];

            return res.json({
                total_sales: parseInt(summary.total_sales) || 0,
                total_quantity: parseInt(summary.total_quantity) || 0,
                total_sales_amount: parseFloat(summary.total_sales_amount) || 0,
                total_profit: parseFloat(summary.total_profit) || 0
            });
        }

        if (reportType === 'product-profit') {
            const result = await pool.query(`
                SELECT 
                    p.id,
                    p.name,
                    COALESCE(COUNT(s.id), 0) as total_sales,
                    COALESCE(SUM(s.quantity), 0) as total_quantity,
                    COALESCE(SUM(s.total), 0) as total_revenue,
                    COALESCE(SUM(s.profit), 0) as total_profit,
                    p.stock_quantity as current_stock
                FROM products p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.name, p.stock_quantity
                ORDER BY total_profit DESC
            `);

            return res.json(result.rows.map(p => ({
                id: Number(p.id),
                name: p.name,
                total_sales: parseInt(p.total_sales),
                total_quantity: parseInt(p.total_quantity),
                total_revenue: parseFloat(p.total_revenue) || 0,
                total_profit: parseFloat(p.total_profit) || 0,
                current_stock: Number(p.current_stock)
            })));
        }

        if (reportType === 'vendor-profit') {
            const result = await pool.query(`
                SELECT 
                    v.id,
                    v.name,
                    COALESCE(COUNT(s.id), 0) as total_sales,
                    COALESCE(SUM(s.quantity), 0) as total_quantity,
                    COALESCE(SUM(s.total), 0) as total_revenue,
                    COALESCE(SUM(s.profit), 0) as total_profit,
                    COUNT(DISTINCT p.id) as product_count
                FROM vendors v
                LEFT JOIN products p ON v.id = p.vendor_id
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY v.id, v.name
                ORDER BY total_profit DESC
            `);

            return res.json(result.rows.map(v => ({
                id: Number(v.id),
                name: v.name,
                total_sales: parseInt(v.total_sales),
                total_quantity: parseInt(v.total_quantity),
                total_revenue: parseFloat(v.total_revenue) || 0,
                total_profit: parseFloat(v.total_profit) || 0,
                product_count: Number(v.product_count)
            })));
        }

        if (reportType === 'daily-sales') {
            const result = await pool.query(`
                SELECT 
                    DATE(sale_date) as sale_day,
                    COUNT(*) as total_sales,
                    COALESCE(SUM(quantity), 0) as total_quantity,
                    COALESCE(SUM(total), 0) as total_revenue,
                    COALESCE(SUM(profit), 0) as total_profit
                FROM sales
                GROUP BY DATE(sale_date)
                ORDER BY sale_day DESC
                LIMIT 30
            `);

            return res.json(result.rows.map(d => {
                const dateObj = new Date(d.sale_day);
                const formattedDate = dateObj.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
                return {
                    date: formattedDate,
                    total_sales: parseInt(d.total_sales),
                    total_quantity: parseInt(d.total_quantity),
                    total_revenue: parseFloat(d.total_revenue) || 0,
                    total_profit: parseFloat(d.total_profit) || 0
                };
            }));
        }

        return res.status(400).json({ error: 'Invalid report type' });
    } catch (error) {
        console.error('Error fetching report:', error);
        return res.status(500).json({ error: 'Failed to fetch report' });
    }
};
