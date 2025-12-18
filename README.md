# Hardware Shop Management System - Complete Setup Guide

## Overview
This is a **production-ready** hardware shop management system with:
- **Frontend**: HTML, CSS, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js + Express
- **Database**: MySQL (with SQLite support)

---

## 📋 REQUIREMENTS

### System Requirements
- Node.js 14+ (Download from https://nodejs.org)
- MySQL 5.7+ Server (Download from https://www.mysql.com/downloads/mysql/)
- Any modern web browser (Chrome, Firefox, Edge, Safari)

### Recommended Setup
- **OS**: Windows, macOS, or Linux
- **Memory**: 2GB RAM minimum
- **Disk Space**: 500MB

---

## 🚀 INSTALLATION & SETUP

### Step 1: Create and Configure MySQL Database

#### Option A: Using MySQL Command Line

1. **Start MySQL Server** (if not running)
   ```bash
   # Windows
   cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"
   mysql -u root -p
   
   # macOS (if installed via Homebrew)
   mysql -u root -p
   
   # Linux
   sudo mysql -u root -p
   ```

2. **Create Database and Initialize Schema**
   ```sql
   -- Copy the entire content of server/schema.sql and execute it
   -- Or run from command line:
   ```

3. **From Command Line (Easier)**
   ```bash
   # Navigate to project folder
   cd c:\Users\FSOS\Documents\Delhi47Project
   
   # Import schema (Windows)
   mysql -u root -p hardware_shop < server/schema.sql
   
   # Import schema (macOS/Linux)
   mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS hardware_shop"
   mysql -u root -p hardware_shop < server/schema.sql
   ```

#### Option B: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your MySQL server
3. File → Open SQL Script → Select `server/schema.sql`
4. Execute the script

---

### Step 2: Configure Database Connection

Edit the `.env` file in the project root:

```env
# .env file content
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root        # Change this to your MySQL password
DB_NAME=hardware_shop
PORT=3000
NODE_ENV=development
```

**Change `DB_PASSWORD` to your actual MySQL root password!**

---

### Step 3: Install Dependencies

```bash
# Navigate to project directory
cd c:\Users\FSOS\Documents\Delhi47Project

# Install Node.js dependencies
npm install
```

This will install:
- `express` - Web framework
- `cors` - Cross-origin request handling
- `mysql2` - Database driver
- `dotenv` - Environment variables

---

### Step 4: Start the Backend Server

```bash
# From project root directory
npm start

# Expected output:
# ✓ Database initialized successfully
# ✓ Server running at http://localhost:3000
# ✓ Frontend: http://localhost:3000
# ✓ API endpoints available at http://localhost:3000/api/*
```

The server runs on **http://localhost:3000**

---

### Step 5: Access the Application

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the Hardware Shop Management System dashboard.

---

## 📚 FEATURES & MODULES

### 1. **Dashboard**
- Quick overview of business metrics
- Total sales, revenue, profit, and stock statistics
- Recent sales history

### 2. **Vendor Management** 
- Add new vendors
- View all vendors
- Manage vendor information (name, phone)
- Delete vendors (if no products assigned)

### 3. **Product Management**
- Add/Edit/Delete products
- Product details:
  - Name, Category
  - Vendor assignment
  - Cost price & Selling price
  - Stock quantity
- Real-time stock tracking

### 4. **Sales Module**
- Record sales transactions
- Auto-fetch selling price
- Real-time stock validation
- Automatic profit calculation
- Sales history with details

### 5. **Reports & Analytics**
- **Summary Report**: Total sales, revenue, profit metrics
- **Product-wise Profit**: Analyze profit by each product
- **Vendor-wise Profit**: Analyze profit by vendor
- **Daily Sales Summary**: Last 30 days sales breakdown

---

## 🔌 API ENDPOINTS

### Vendors API
```
POST   /vendors                  - Create vendor
GET    /vendors                  - List all vendors
```

### Products API
```
POST   /products                 - Create product
GET    /products                 - List products (without cost_price for security)
PUT    /products/:id             - Update product
DELETE /products/:id             - Delete product (only if no sales)
```

### Sales API
```
POST   /sales                    - Record a sale
GET    /sales                    - List recent sales
```

### Reports API
```
GET    /reports/summary          - Summary statistics
GET    /reports/product-profit   - Product-wise profit analysis
GET    /reports/vendor-profit    - Vendor-wise profit analysis
GET    /reports/daily-sales      - Daily sales summary
```

---

## 💾 DATABASE SCHEMA

### vendors table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR, UNIQUE)
- phone (VARCHAR, OPTIONAL)
- created_at (TIMESTAMP)
```

### products table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- name (VARCHAR)
- category (VARCHAR)
- vendor_id (FOREIGN KEY)
- cost_price (DECIMAL 10,2)
- selling_price (DECIMAL 10,2)
- stock_quantity (INT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### sales table
```sql
- id (PRIMARY KEY, AUTO_INCREMENT)
- product_id (FOREIGN KEY)
- quantity (INT)
- total (DECIMAL 10,2)
- profit (DECIMAL 10,2)
- sale_date (TIMESTAMP)
```

---

## 🔒 SECURITY FEATURES

✅ **Backend Validation**: All input validated on server
✅ **Stock Protection**: Stock never goes negative
✅ **Cost Price Hidden**: Never exposed to frontend
✅ **Profit Calculation**: Server-side only
✅ **Data Integrity**: Database constraints enforced
✅ **CORS Enabled**: Cross-origin requests allowed

---

## 🎯 BUSINESS LOGIC

### Sale Execution Flow
1. User selects product from dropdown
2. System fetches selling price automatically
3. User enters quantity
4. System validates stock availability
5. Sale is recorded with:
   - `total = selling_price × quantity`
   - `profit = (selling_price - cost_price) × quantity`
6. Product stock is automatically reduced

### Profit Calculation
```
profit = (selling_price - cost_price) × quantity_sold
```

All calculations happen on the server to ensure data integrity.

---

## 🛠️ TROUBLESHOOTING

### Issue: "Cannot connect to database"
**Solution:**
1. Ensure MySQL is running
2. Check database credentials in `.env`
3. Verify database name in MySQL: `SHOW DATABASES;`
4. Test connection: `mysql -u root -p`

### Issue: "Port 3000 is already in use"
**Solution:**
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>

# Or change PORT in .env file
```

### Issue: "npm install fails"
**Solution:**
1. Ensure Node.js is installed: `node --version`
2. Update npm: `npm install -g npm@latest`
3. Clear npm cache: `npm cache clean --force`
4. Delete `node_modules` and `package-lock.json`, then reinstall

### Issue: "Cannot find module 'mysql2'"
**Solution:**
```bash
npm install mysql2 --save
```

### Issue: Frontend won't load
**Solution:**
1. Check if backend is running on `http://localhost:3000`
2. Open browser DevTools (F12) and check Console for errors
3. Ensure all API endpoints are returning data

---

## 📁 FILE STRUCTURE

```
Delhi47Project/
├── client/
│   ├── index.html          # Main UI
│   ├── style.css           # Styling (responsive)
│   └── script.js           # Frontend logic
├── server/
│   ├── server.js           # Express backend
│   ├── db.js               # Database connection
│   └── schema.sql          # Database schema
├── package.json            # Dependencies
├── .env                    # Configuration (edit this!)
└── README.md              # This file
```

---

## 🚀 DEVELOPMENT TIPS

### Running in Development Mode
```bash
# Install nodemon for auto-reload
npm install -g nodemon

# Run with auto-reload
nodemon server/server.js
```

### Adding Sample Data
```sql
-- Add a vendor
INSERT INTO vendors (name, phone) VALUES ('Vendor A', '9876543210');

-- Add a product
INSERT INTO products (name, category, vendor_id, cost_price, selling_price, stock_quantity)
VALUES ('Hammer', 'Tools', 1, 50.00, 75.00, 100);

-- Record a sale
INSERT INTO sales (product_id, quantity, total, profit)
VALUES (1, 5, 375.00, 125.00);
```

### API Testing
Use Postman or curl:
```bash
# Test vendor creation
curl -X POST http://localhost:3000/vendors \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Vendor","phone":"1234567890"}'

# Test getting all vendors
curl http://localhost:3000/vendors
```

---

## 📊 USAGE WORKFLOW

### Day-to-Day Operations

1. **Morning Setup**
   - Open http://localhost:3000
   - Check Dashboard for previous day's sales

2. **Add New Vendor** (if needed)
   - Go to Vendors tab
   - Click "Add Vendor"
   - Fill vendor details

3. **Add Products**
   - Go to Products tab
   - Click "Add Product"
   - Fill all details with cost and selling price

4. **Record Sales**
   - Go to Sales tab
   - Click "New Sale"
   - Select product, enter quantity
   - System auto-calculates and confirms

5. **View Reports**
   - Go to Reports tab
   - Check Summary, Product Profit, Vendor Profit, Daily Sales

---

## 📞 SUPPORT & CONTACT

For issues or questions:
1. Check the Troubleshooting section
2. Review API endpoint documentation
3. Check browser console for errors (F12)
4. Verify MySQL is running and accessible

---

## 📜 LICENSE

This project is provided as-is for personal and commercial use.

---

## ✅ VERIFICATION CHECKLIST

After setup, verify everything works:

- [ ] MySQL database is running
- [ ] `.env` file configured with correct credentials
- [ ] `npm install` completed successfully
- [ ] `npm start` shows server running on port 3000
- [ ] Frontend loads at http://localhost:3000
- [ ] Can add vendors
- [ ] Can add products
- [ ] Can record sales
- [ ] Can view all reports
- [ ] Dashboard shows statistics

---

**You're all set! Start managing your hardware shop! 🎉**
