-- Hardware Shop Management System - Sample Data
-- Run this after schema.sql to populate test data

-- Insert sample vendors
INSERT INTO vendors (name, phone) VALUES
('Ace Hardware Suppliers', '9876543210'),
('BuildPro Distributors', '9876543211'),
('Quality Tools Ltd', '9876543212'),
('Premium Hardware Co', '9876543213'),
('TechTools India', '9876543214');

-- Insert sample products
INSERT INTO products (name, category, vendor_id, cost_price, selling_price, stock_quantity) VALUES
-- Vendor 1 products
('Claw Hammer 500g', 'Tools', 1, 80.00, 120.00, 50),
('Wood Chisel Set', 'Tools', 1, 200.00, 350.00, 30),
('Adjustable Wrench 10"', 'Tools', 1, 120.00, 180.00, 40),
('Screwdriver Set 12pc', 'Tools', 1, 150.00, 250.00, 25),

-- Vendor 2 products
('Concrete Nails 50mm', 'Hardware', 2, 50.00, 80.00, 200),
('Steel L-Bracket 3"', 'Hardware', 2, 30.00, 50.00, 150),
('Stainless Steel Bolts', 'Hardware', 2, 100.00, 160.00, 100),
('Door Hinges Brass', 'Hardware', 2, 40.00, 70.00, 75),

-- Vendor 3 products
('Power Drill 800W', 'Power Tools', 3, 1500.00, 2200.00, 15),
('Cordless Impact Driver', 'Power Tools', 3, 2000.00, 3000.00, 10),
('Circular Saw 185mm', 'Power Tools', 3, 1200.00, 1800.00, 12),

-- Vendor 4 products
('Wood Sandpaper Pack', 'Abrasives', 4, 80.00, 130.00, 200),
('Metal Polish', 'Chemicals', 4, 60.00, 100.00, 150),
('Lubricating Oil 500ml', 'Chemicals', 4, 90.00, 150.00, 100),

-- Vendor 5 products
('Paint Brush 2" Set', 'Painting', 5, 120.00, 180.00, 80),
('Paint Roller Frame', 'Painting', 5, 100.00, 160.00, 60),
('Drop Cloth Plastic 9x12', 'Painting', 5, 150.00, 250.00, 40);

-- Insert sample sales (optional - for testing reports)
INSERT INTO sales (product_id, quantity, total, profit) VALUES
(1, 5, 600.00, 200.00),
(2, 2, 700.00, 300.00),
(3, 3, 540.00, 180.00),
(5, 20, 1600.00, 600.00),
(6, 15, 750.00, 300.00),
(9, 2, 4400.00, 1400.00),
(10, 1, 3000.00, 1000.00),
(14, 50, 6500.00, 2500.00),
(16, 4, 640.00, 220.00),
(17, 30, 4500.00, 1800.00);

-- Verify data
SELECT 'VENDORS:' as info;
SELECT COUNT(*) as total_vendors FROM vendors;

SELECT 'PRODUCTS:' as info;
SELECT COUNT(*) as total_products, SUM(stock_quantity) as total_stock FROM products;

SELECT 'SALES:' as info;
SELECT COUNT(*) as total_sales, SUM(quantity) as total_qty, SUM(total) as total_revenue, SUM(profit) as total_profit FROM sales;

-- Sample query to see product with vendor
SELECT p.name, p.category, v.name as vendor, p.cost_price, p.selling_price, p.stock_quantity
FROM products p
LEFT JOIN vendors v ON p.vendor_id = v.id
LIMIT 5;
