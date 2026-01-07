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
                    CAST(COUNT(*) AS INTEGER) as total_sales,
                    CAST(COALESCE(SUM(quantity), 0) AS INTEGER) as total_quantity,
                    CAST(COALESCE(SUM(total), 0) AS DECIMAL(10,2)) as total_sales_amount,
                    CAST(COALESCE(SUM(profit), 0) AS DECIMAL(10,2)) as total_profit
                FROM sales
            `);

            const summary = result.rows[0] || {};

            return res.json({
                total_sales: Number(summary.total_sales) || 0,
                total_quantity: Number(summary.total_quantity) || 0,
                total_sales_amount: Number(summary.total_sales_amount) || 0,
                total_profit: Number(summary.total_profit) || 0
            });
        }

        if (reportType === 'product-profit') {
            const result = await pool.query(`
                SELECT 
                    p.id,
                    p.name,
                    CAST(COUNT(s.id) AS INTEGER) as total_sales,
                    CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) as total_quantity,
                    CAST(COALESCE(SUM(s.total), 0) AS DECIMAL(10,2)) as total_revenue,
                    CAST(COALESCE(SUM(s.profit), 0) AS DECIMAL(10,2)) as total_profit,
                    p.stock_quantity as current_stock
                FROM products p
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY p.id, p.name, p.stock_quantity
                ORDER BY total_profit DESC
            `);

            return res.json(result.rows.map(p => ({
                id: Number(p.id) || 0,
                name: p.name || '',
                total_sales: Number(p.total_sales) || 0,
                total_quantity: Number(p.total_quantity) || 0,
                total_revenue: Number(p.total_revenue) || 0,
                total_profit: Number(p.total_profit) || 0,
                current_stock: Number(p.current_stock) || 0
            })));
        }

        if (reportType === 'vendor-profit') {
            const result = await pool.query(`
                SELECT 
                    v.id,
                    v.name,
                    CAST(COUNT(s.id) AS INTEGER) as total_sales,
                    CAST(COALESCE(SUM(s.quantity), 0) AS INTEGER) as total_quantity,
                    CAST(COALESCE(SUM(s.total), 0) AS DECIMAL(10,2)) as total_revenue,
                    CAST(COALESCE(SUM(s.profit), 0) AS DECIMAL(10,2)) as total_profit,
                    CAST(COUNT(DISTINCT p.id) AS INTEGER) as product_count
                FROM vendors v
                LEFT JOIN products p ON v.id = p.vendor_id
                LEFT JOIN sales s ON p.id = s.product_id
                GROUP BY v.id, v.name
                ORDER BY total_profit DESC
            `);

            return res.json(result.rows.map(v => ({
                id: Number(v.id) || 0,
                name: v.name || '',
                total_sales: Number(v.total_sales) || 0,
                total_quantity: Number(v.total_quantity) || 0,
                total_revenue: Number(v.total_revenue) || 0,
                total_profit: Number(v.total_profit) || 0,
                product_count: Number(v.product_count) || 0
            })));
        }

        if (reportType === 'daily-sales') {
            const result = await pool.query(`
                SELECT 
                    DATE(sale_date) as sale_day,
                    CAST(COUNT(*) AS INTEGER) as total_sales,
                    CAST(COALESCE(SUM(quantity), 0) AS INTEGER) as total_quantity,
                    CAST(COALESCE(SUM(total), 0) AS DECIMAL(10,2)) as total_revenue,
                    CAST(COALESCE(SUM(profit), 0) AS DECIMAL(10,2)) as total_profit
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
                    total_sales: Number(d.total_sales) || 0,
                    total_quantity: Number(d.total_quantity) || 0,
                    total_revenue: Number(d.total_revenue) || 0,
                    total_profit: Number(d.total_profit) || 0
                };
            }));
        }

        return res.status(400).json({ error: 'Invalid report type' });
    } catch (error) {
        console.error('Error fetching report:', error);
        return res.status(500).json({ error: 'Failed to fetch report' });
    }
};
