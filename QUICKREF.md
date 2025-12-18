QUICK REFERENCE GUIDE
Hardware Shop Management System
================================================================================

🚀 START SERVER
================================================================================
From project root directory:
  npm install       # Install dependencies (first time only)
  npm start         # Start server on http://localhost:3000

🌐 ACCESS APPLICATION
================================================================================
Frontend Dashboard:  http://localhost:3000
API Base URL:        http://localhost:3000

⚙️ CONFIGURATION
================================================================================
Edit .env file with your database credentials:
  DB_HOST=localhost      # MySQL server host
  DB_USER=root          # MySQL username
  DB_PASSWORD=root      # MySQL password (change this!)
  DB_NAME=hardware_shop # Database name
  PORT=3000             # Server port

📊 API ENDPOINTS REFERENCE
================================================================================

VENDORS
-------
POST   /vendors              Add new vendor
  Body: { name, phone }
  Returns: { id, name, phone }

GET    /vendors              Get all vendors
  Returns: Array of vendors


PRODUCTS
--------
POST   /products             Add new product
  Body: { name, category, vendor_id, cost_price, selling_price, stock_quantity }
  Returns: { id, name, category, vendor_id, cost_price, selling_price, stock_quantity }

GET    /products             Get all products
  Returns: Array with vendor_name included (cost_price NOT included)

PUT    /products/:id         Update product
  Body: { name, category, vendor_id, cost_price, selling_price, stock_quantity }
  Returns: Updated product

DELETE /products/:id         Delete product
  Returns: { message }


SALES
-----
POST   /sales                Record sale
  Body: { product_id, quantity }
  Returns: { id, product_id, quantity, total, profit, sale_date }
  Validates: Stock must be >= quantity
  Auto reduces: Product stock by quantity

GET    /sales                Get recent sales (last 100)
  Returns: Array of sales with product_name


REPORTS
-------
GET    /reports/summary              Summary statistics
  Returns: { total_sales, total_quantity, total_sales_amount, total_profit }

GET    /reports/product-profit       Product-wise profit
  Returns: Array { id, name, total_sales, total_quantity, total_revenue, total_profit, current_stock }

GET    /reports/vendor-profit        Vendor-wise profit
  Returns: Array { id, name, total_sales, total_quantity, total_revenue, total_profit, product_count }

GET    /reports/daily-sales          Daily sales summary (last 30 days)
  Returns: Array { date, total_sales, total_quantity, total_revenue, total_profit }


💾 DATABASE STRUCTURE
================================================================================

VENDORS TABLE
  id          INT PRIMARY KEY AUTO_INCREMENT
  name        VARCHAR(100) UNIQUE
  phone       VARCHAR(20)
  created_at  TIMESTAMP

PRODUCTS TABLE
  id              INT PRIMARY KEY AUTO_INCREMENT
  name            VARCHAR(150)
  category        VARCHAR(100)
  vendor_id       INT FOREIGN KEY (references vendors.id)
  cost_price      DECIMAL(10,2)
  selling_price   DECIMAL(10,2)
  stock_quantity  INT
  created_at      TIMESTAMP
  updated_at      TIMESTAMP

SALES TABLE
  id          INT PRIMARY KEY AUTO_INCREMENT
  product_id  INT FOREIGN KEY (references products.id)
  quantity    INT
  total       DECIMAL(10,2)
  profit      DECIMAL(10,2)
  sale_date   TIMESTAMP


🔧 TROUBLESHOOTING COMMANDS
================================================================================

Check if MySQL is running:
  mysql -u root -p -e "SELECT 1"

Create database:
  mysql -u root -p -e "CREATE DATABASE hardware_shop"

Import schema:
  mysql -u root -p hardware_shop < server/schema.sql

Import sample data:
  mysql -u root -p hardware_shop < server/sample-data.sql

Check if port 3000 is available (Windows):
  netstat -ano | findstr :3000

Kill process on port 3000 (Windows):
  taskkill /PID <PID> /F

Kill process on port 3000 (macOS/Linux):
  lsof -i :3000
  kill -9 <PID>


📁 PROJECT FILES
================================================================================

/client/
  ├── index.html     Main UI (dashboard, forms, tables, reports)
  ├── style.css      Responsive styling (mobile-friendly)
  └── script.js      Frontend logic (API calls, form handling, UI updates)

/server/
  ├── server.js      Express backend with all routes
  ├── db.js          Database connection and utilities
  └── schema.sql     Database schema creation

/
  ├── package.json           Dependencies and scripts
  ├── .env                   Configuration (EDIT THIS!)
  ├── README.md              Full documentation
  ├── QUICKREF.md            This file
  ├── quickstart.bat         Quick start script (Windows)
  └── quickstart.sh          Quick start script (Linux/macOS)


🔐 SECURITY NOTES
================================================================================

✓ Cost price is NOT exposed to frontend
✓ All calculations done on server
✓ Stock validation before sale
✓ Input validation on both frontend and backend
✓ SQL injection prevention (prepared statements)
✓ CORS enabled for development

❌ DO NOT:
  - Expose cost_price in frontend API responses
  - Calculate profit on client side
  - Allow negative stock
  - Skip backend validation


📝 TYPICAL WORKFLOW
================================================================================

1. Add Vendor
   - Go to Vendors tab
   - Click "Add Vendor"
   - Enter name and phone

2. Add Product
   - Go to Products tab
   - Click "Add Product"
   - Select vendor, enter cost & selling price
   - Note: Selling price must be > cost price

3. Record Sale
   - Go to Sales tab
   - Click "New Sale"
   - Select product (only shows if stock > 0)
   - Enter quantity
   - System shows: unit price, available stock, total amount
   - Click "Complete Sale"
   - Stock automatically reduced

4. View Reports
   - Go to Reports tab
   - Click different tabs: Summary, Product Profit, Vendor Profit, Daily Sales
   - All calculations automatic


🔍 FRONTEND FEATURES
================================================================================

Dashboard:
  - Live time display
  - Statistics cards (Sales, Revenue, Profit, Stock)
  - Recent sales table

Sidebar Navigation:
  - 5 main sections
  - Active page highlighting

Responsive Design:
  - Works on desktop (1024px+)
  - Tablet (768px+)
  - Mobile (480px+)

UI Components:
  - Modal forms for data entry
  - Data tables with sorting
  - Toast notifications for feedback
  - Real-time calculations


🚨 COMMON ISSUES & FIXES
================================================================================

Issue: "Cannot connect to database"
  → Check MySQL is running
  → Verify credentials in .env
  → Check if database exists: mysql -u root -p -e "SHOW DATABASES"

Issue: "Module not found: mysql2"
  → Run: npm install mysql2 --save

Issue: "Port 3000 already in use"
  → Change PORT in .env
  → Or kill process on port 3000

Issue: Frontend shows "Cannot GET /vendors"
  → Check backend is running
  → Check URL in script.js (API_BASE)
  → Check browser console for errors (F12)

Issue: Sales not saving
  → Check product has stock
  → Check quantity is valid
  → Check browser console for errors
  → Check server logs


💡 TIPS
================================================================================

1. Always validate profit margins
2. Set realistic cost and selling prices
3. Monitor stock regularly
4. Use daily sales report for trend analysis
5. Keep vendor information updated
6. Backup database regularly

To add sample data quickly:
  mysql -u root -p hardware_shop < server/sample-data.sql


📞 TESTING THE API
================================================================================

Using curl (command line):

# Create vendor
curl -X POST http://localhost:3000/vendors \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Vendor","phone":"9876543210"}'

# Get all vendors
curl http://localhost:3000/vendors

# Create product
curl -X POST http://localhost:3000/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Hammer","category":"Tools","vendor_id":1,"cost_price":50,"selling_price":75,"stock_quantity":100}'

# Record sale
curl -X POST http://localhost:3000/sales \
  -H "Content-Type: application/json" \
  -d '{"product_id":1,"quantity":5}'

# Get summary
curl http://localhost:3000/reports/summary


🎯 NEXT STEPS
================================================================================

After setup:
  1. Create at least one vendor
  2. Add some products with realistic prices
  3. Record a few test sales
  4. Check the reports to see calculations
  5. Verify profit calculations are correct

For production:
  1. Change DB_PASSWORD in .env
  2. Set NODE_ENV=production
  3. Configure proper MySQL security
  4. Use process manager (PM2) to keep server running
  5. Add HTTPS certificate
  6. Backup database regularly


================================================================================
Good luck with your hardware shop management system! 🎉
================================================================================
