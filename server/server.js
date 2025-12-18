/**
 * Hardware Shop Management System - Express Backend
 * REST API for product, vendor, sales, and reporting management
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// ============================================================================
// VENDOR ENDPOINTS
// ============================================================================

/**
 * POST /vendors - Create a new vendor
 * Body: { name, phone }
 */
app.post('/vendors', async (req, res) => {
    try {
        const { name, phone } = req.body;

        // Validation
        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Vendor name is required' });
        }

        const result = await db.query(
            'INSERT INTO vendors (name, phone) VALUES (?, ?)',
            [name.trim(), phone || null]
        );

        res.status(201).json({
            id: result.insertId,
            name: name.trim(),
            phone: phone || null,
            message: 'Vendor created successfully'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Vendor name already exists' });
        }
        console.error('Error creating vendor:', error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

/**
 * GET /vendors - List all vendors
 */
app.get('/vendors', async (req, res) => {
    try {
        const vendors = await db.query(
            'SELECT id, name, phone, created_at FROM vendors ORDER BY name ASC'
        );
        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

// ============================================================================
// PRODUCT ENDPOINTS
// ============================================================================

/**
 * POST /products - Create a new product
 * Body: { name, category, vendor_id, cost_price, selling_price, stock_quantity }
 */
app.post('/products', async (req, res) => {
    try {
        const { name, category, vendor_id, cost_price, selling_price, stock_quantity } = req.body;

        // Validation
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

        // Check vendor exists
        const vendor = await db.queryOne('SELECT id FROM vendors WHERE id = ?', [vendor_id]);
        if (!vendor) {
            return res.status(400).json({ error: 'Vendor not found' });
        }

        const result = await db.query(
            'INSERT INTO products (name, category, vendor_id, cost_price, selling_price, stock_quantity) VALUES (?, ?, ?, ?, ?, ?)',
            [name.trim(), category.trim(), vendor_id, costPrice, sellingPrice, quantity]
        );

        res.status(201).json({
            id: result.insertId,
            name: name.trim(),
            category: category.trim(),
            vendor_id,
            cost_price: costPrice,
            selling_price: sellingPrice,
            stock_quantity: quantity,
            message: 'Product created successfully'
        });
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

/**
 * GET /products - List all products with vendor information
 */
app.get('/products', async (req, res) => {
    try {
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
});

/**
 * PUT /products/:id - Update a product
 * Body: { name, category, vendor_id, cost_price, selling_price, stock_quantity }
 */
app.put('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const { name, category, vendor_id, cost_price, selling_price, stock_quantity } = req.body;

        // Check product exists
        const product = await db.queryOne('SELECT id FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Validation
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

        // Check vendor exists
        const vendor = await db.queryOne('SELECT id FROM vendors WHERE id = ?', [vendor_id]);
        if (!vendor) {
            return res.status(400).json({ error: 'Vendor not found' });
        }

        await db.query(
            'UPDATE products SET name = ?, category = ?, vendor_id = ?, cost_price = ?, selling_price = ?, stock_quantity = ? WHERE id = ?',
            [name.trim(), category.trim(), vendor_id, costPrice, sellingPrice, quantity, productId]
        );

        res.json({
            id: productId,
            name: name.trim(),
            category: category.trim(),
            vendor_id,
            cost_price: costPrice,
            selling_price: sellingPrice,
            stock_quantity: quantity,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

/**
 * DELETE /products/:id - Delete a product
 */
app.delete('/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);

        // Check product exists
        const product = await db.queryOne('SELECT id FROM products WHERE id = ?', [productId]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check if product has sales
        const sales = await db.queryOne('SELECT id FROM sales WHERE product_id = ? LIMIT 1', [productId]);
        if (sales) {
            return res.status(400).json({ error: 'Cannot delete product with existing sales records' });
        }

        await db.query('DELETE FROM products WHERE id = ?', [productId]);

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ============================================================================
// SALES ENDPOINTS
// ============================================================================

/**
 * POST /sales - Create a new sale
 * Body: { product_id, quantity }
 */
app.post('/sales', async (req, res) => {
    try {
        const { product_id, quantity } = req.body;

        // Validation
        if (!product_id) {
            return res.status(400).json({ error: 'Product is required' });
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty <= 0) {
            return res.status(400).json({ error: 'Quantity must be a positive number' });
        }

        // Get product details
        const product = await db.queryOne(
            'SELECT id, cost_price, selling_price, stock_quantity FROM products WHERE id = ?',
            [product_id]
        );

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Check stock availability
        if (product.stock_quantity < qty) {
            return res.status(400).json({
                error: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${qty}`
            });
        }

        // Calculate sale details
        const total = parseFloat((product.selling_price * qty).toFixed(2));
        const profit = parseFloat(((product.selling_price - product.cost_price) * qty).toFixed(2));

        // Insert sale record
        const saleResult = await db.query(
            'INSERT INTO sales (product_id, quantity, total, profit) VALUES (?, ?, ?, ?)',
            [product_id, qty, total, profit]
        );

        // Update product stock
        await db.query(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [qty, product_id]
        );

        res.status(201).json({
            id: saleResult.insertId,
            product_id,
            quantity: qty,
            total,
            profit,
            sale_date: new Date().toISOString(),
            message: 'Sale recorded successfully'
        });
    } catch (error) {
        console.error('Error creating sale:', error);
        res.status(500).json({ error: 'Failed to record sale' });
    }
});

/**
 * GET /sales - List all sales with product information
 */
app.get('/sales', async (req, res) => {
    try {
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
});

// ============================================================================
// REPORTING ENDPOINTS
// ============================================================================

/**
 * GET /reports/summary - Overall sales and profit summary
 */
app.get('/reports/summary', async (req, res) => {
    try {
        const summary = await db.queryOne(`
            SELECT 
                COUNT(*) as total_sales,
                COALESCE(SUM(quantity), 0) as total_quantity,
                COALESCE(SUM(total), 0) as total_sales_amount,
                COALESCE(SUM(profit), 0) as total_profit
            FROM sales
        `);

        res.json({
            total_sales: summary.total_sales || 0,
            total_quantity: summary.total_quantity || 0,
            total_sales_amount: parseFloat(summary.total_sales_amount) || 0,
            total_profit: parseFloat(summary.total_profit) || 0
        });
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: 'Failed to fetch summary' });
    }
});

/**
 * GET /reports/product-profit - Product-wise profit analysis
 */
app.get('/reports/product-profit', async (req, res) => {
    try {
        const products = await db.query(`
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

        res.json(products.map(p => ({
            id: p.id,
            name: p.name,
            total_sales: p.total_sales,
            total_quantity: p.total_quantity,
            total_revenue: parseFloat(p.total_revenue) || 0,
            total_profit: parseFloat(p.total_profit) || 0,
            current_stock: p.current_stock
        })));
    } catch (error) {
        console.error('Error fetching product profit report:', error);
        res.status(500).json({ error: 'Failed to fetch product profit report' });
    }
});

/**
 * GET /reports/vendor-profit - Vendor-wise profit analysis
 */
app.get('/reports/vendor-profit', async (req, res) => {
    try {
        const vendors = await db.query(`
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

        res.json(vendors.map(v => ({
            id: v.id,
            name: v.name,
            total_sales: v.total_sales,
            total_quantity: v.total_quantity,
            total_revenue: parseFloat(v.total_revenue) || 0,
            total_profit: parseFloat(v.total_profit) || 0,
            product_count: v.product_count
        })));
    } catch (error) {
        console.error('Error fetching vendor profit report:', error);
        res.status(500).json({ error: 'Failed to fetch vendor profit report' });
    }
});

/**
 * GET /reports/daily-sales - Daily sales summary
 */
app.get('/reports/daily-sales', async (req, res) => {
    try {
        const daily = await db.query(`
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

        res.json(daily.map(d => ({
            date: d.sale_day,
            total_sales: d.total_sales,
            total_quantity: d.total_quantity,
            total_revenue: parseFloat(d.total_revenue) || 0,
            total_profit: parseFloat(d.total_profit) || 0
        })));
    } catch (error) {
        console.error('Error fetching daily sales report:', error);
        res.status(500).json({ error: 'Failed to fetch daily sales report' });
    }
});

// ============================================================================
// INITIALIZATION & SERVER START
// ============================================================================

/**
 * Start server and initialize database
 */
async function startServer() {
    try {
        // Initialize database
        await db.initializeDatabase();

        // Start Express server
        app.listen(PORT, () => {
            console.log(`✓ Server running at http://localhost:${PORT}`);
            console.log(`✓ Frontend: http://localhost:${PORT}`);
            console.log(`✓ API endpoints available at http://localhost:${PORT}/api/*`);
        });
    } catch (error) {
        console.error('✗ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Start server
startServer();

module.exports = app;
