/**
 * Delhi 47 Traders Admin Panel - Frontend JavaScript
 * Complete client-side logic for all features
 */

// API Base URL - automatically detects environment
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000'
    : '/api'; // Use relative path for Vercel API routes

// Auth state
let authToken = null;
let userRole = null;

// ========================================================================
// GLOBAL AUTH HANDLING: Redirect to login on 401/403
// ========================================================================

// Wrap window.fetch to catch unauthorized responses and force login
const __nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : (input && input.url) ? input.url : '';
    const response = await __nativeFetch(input, init);
    if (response && (response.status === 401 || response.status === 403)) {
        // Avoid redirect loops on the login endpoint
        const isLoginEndpoint = url.includes('/login');
        if (!isLoginEndpoint) {
            // Soft logout immediately to show login page
            logout('expired');
        }
    }
    return response;
};

// State Management
const state = {
    vendors: [],
    products: [],
    sales: [],
    currentEditingProductId: null,
    currentEditingVendorId: null
};

// ========================================================================
// INITIALIZATION
// ========================================================================

function showLoginPage() {
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
}

function showApp() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
}

function setupLoginForm() {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (!response.ok) {
                const errorText = await response.text();
                document.getElementById('login-error').textContent = errorText || 'Login failed';
                document.getElementById('login-error').style.display = 'block';
                return;
            }

            const data = await response.json();
            
            authToken = data.token;
            userRole = data.role;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('userRole', userRole);
            
            showApp();
            initializeApp();
        } catch (error) {
            console.error('Login error:', error);
            document.getElementById('login-error').textContent = 'Connection error';
            document.getElementById('login-error').style.display = 'block';
        }
    });
}

function logout(reason) {
    authToken = null;
    userRole = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    
    if (reason === 'expired') {
        try { window.__authExpired = true; } catch (_) {}
        showLoginPage();
        setupLoginForm();
        return;
    }
    
    location.reload();
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const savedToken = localStorage.getItem('authToken');
    const savedRole = localStorage.getItem('userRole');
    
    if (savedToken && savedRole) {
        authToken = savedToken;
        userRole = savedRole;
        showApp();
        initializeApp();
    } else {
        showLoginPage();
        setupLoginForm();
    }
});

async function initializeApp() {
    console.log('🚀 Initializing Delhi 47 Traders Admin Panel...');
    
    // Setup event listeners
    setupNavigation();
    setupModals();
    setupForms();
    setupReportTabs();
    setupSaleSearch();
    
    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Hide admin-only pages if not admin
    if (userRole !== 'admin') {
        document.querySelector('[data-page="vendors"]').style.display = 'none';
        document.querySelector('[data-page="products"]').style.display = 'none';
        document.querySelector('[data-page="reports"]').style.display = 'none';
        
        // Hide admin-only buttons
        document.getElementById('btn-add-vendor').style.display = 'none';
        document.getElementById('btn-add-product').style.display = 'none';
    }
    
    // Load initial data progressively (non-blocking)
    loadVendors();
    loadProducts();
    loadDashboard(); // Load summary cards first
    loadSales(); // Load recent sales independently
    
    // Update clock
    updateClock();
    setInterval(updateClock, 1000);
    
    console.log('✓ Application initialized successfully');
}

// ========================================================================
// NAVIGATION & PAGE MANAGEMENT
// ========================================================================

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pageName = btn.getAttribute('data-page');
            switchPage(pageName);
        });
    });
}

function switchPage(pageName) {
    // Update active nav button
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        vendors: 'Manage Vendors',
        products: 'Manage Products',
        sales: 'Record Sales',
        reports: 'Reports'
    };
    document.getElementById('page-title').textContent = titles[pageName];
    
    // Show/hide pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
    
    // Reload data when switching pages
    if (pageName === 'dashboard') {
        loadDashboard();
    } else if (pageName === 'reports') {
        loadReports();
    }
}

// ========================================================================
// MODAL MANAGEMENT
// ========================================================================

function setupModals() {
    // Close modal on X click
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modalId = closeBtn.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Close modal on secondary button click
    document.querySelectorAll('[data-modal]').forEach(btn => {
        if (btn.classList.contains('btn-secondary')) {
            btn.addEventListener('click', (e) => {
                const modalId = btn.getAttribute('data-modal');
                closeModal(modalId);
            });
        }
    });
    
    // Open modals
    document.getElementById('btn-add-vendor').addEventListener('click', () => {
        openModal('vendor-modal');
        document.getElementById('vendor-modal-title').textContent = 'Add Vendor';
        state.currentEditingVendorId = null;
        document.getElementById('vendor-form').reset();
    });
    
    document.getElementById('btn-add-product').addEventListener('click', () => {
        openModal('product-modal');
        document.getElementById('product-modal-title').textContent = 'Add Product';
        state.currentEditingProductId = null;
        document.getElementById('product-form').reset();
        loadVendorDropdown('product-vendor');
    });
    
    document.getElementById('btn-new-sale').addEventListener('click', () => {
        openModal('sale-modal');
        document.getElementById('sale-form').reset();
        loadProductDropdown('sale-product');
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    modal.style.display = 'none';
}

// ========================================================================
// FORM MANAGEMENT
// ========================================================================

function setupForms() {
    // Vendor Form
    document.getElementById('vendor-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveVendor();
    });
    
    // Product Form
    document.getElementById('product-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveProduct();
    });
    
    // Sale Form
    document.getElementById('sale-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await recordSale();
    });
    
    // Sale product dropdown change
    document.getElementById('sale-product').addEventListener('change', updateSaleInfo);
    document.getElementById('sale-quantity').addEventListener('input', updateSaleInfo);
}

// ========================================================================
// VENDOR MANAGEMENT
// ========================================================================

async function loadVendors() {
    if (!authToken) return;
    try {
        const response = await fetch(`${API_BASE}/vendors`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load vendors');
        }
        
        state.vendors = await response.json();
        renderVendors();
    } catch (error) {
        console.error('Error loading vendors:', error);
        showToast('Failed to load vendors', 'error');
    }
}

function renderVendors() {
    const tbody = document.getElementById('vendors-list');
    
    if (state.vendors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="no-data">No vendors added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.vendors.map(vendor => `
        <tr>
            <td>${vendor.id}</td>
            <td>${vendor.name}</td>
            <td>${vendor.phone || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-danger btn-small" onclick="deleteVendor(${vendor.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveVendor() {
    const name = document.getElementById('vendor-name').value.trim();
    const phone = document.getElementById('vendor-phone').value.trim();
    
    if (!name) {
        showToast('Vendor name is required', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/vendors`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, phone: phone || null })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save vendor');
        }
        
        showToast('Vendor saved successfully', 'success');
        closeModal('vendor-modal');
        await loadVendors();
    } catch (error) {
        console.error('Error saving vendor:', error);
        showToast(error.message, 'error');
    }
}

async function deleteVendor(vendorId) {
    if (!confirm('Are you sure you want to delete this vendor?')) {
        return;
    }
    
    try {
        showToast('Deleting vendor...', 'warning');
        const response = await fetch(`${API_BASE}/vendors/${vendorId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (!response.ok) {
            const errorText = await response.text();
            showToast(errorText || 'Failed to delete vendor', 'error');
            return;
        }

        const data = await response.json();

        showToast('Vendor deleted successfully', 'success');
        await loadVendors();
    } catch (error) {
        console.error('Error deleting vendor:', error);
        showToast('Failed to delete vendor', 'error');
    }
}

async function loadVendorDropdown(elementId) {
    const select = document.getElementById(elementId);
    select.innerHTML = '<option value="">Select Vendor</option>' + 
        state.vendors.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
}

// ========================================================================
// PRODUCT MANAGEMENT
// ========================================================================

async function loadProducts() {
    if (!authToken) return;
    try {
        const response = await fetch(`${API_BASE}/products`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load products');
        }
        
        state.products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

function renderProducts() {
    const tbody = document.getElementById('products-list');
    
    if (state.products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No products added yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.products.map(product => `
        <tr>
            <td>${product.id}</td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.vendor_name}</td>
            <td>₹${parseFloat(product.selling_price).toFixed(2)}</td>
            <td><strong>${product.stock_quantity}</strong></td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-success btn-small" onclick="editProduct(${product.id})">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteProduct(${product.id})">Delete</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function saveProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value.trim();
    const vendor_id = document.getElementById('product-vendor').value;
    const cost_price = document.getElementById('product-cost').value;
    const selling_price = document.getElementById('product-selling').value;
    const stock_quantity = document.getElementById('product-stock').value;
    
    if (!name || !category || !vendor_id || !cost_price || !selling_price) {
        showToast('All fields are required', 'error');
        return;
    }
    
    try {
        const method = state.currentEditingProductId ? 'PUT' : 'POST';
        const url = state.currentEditingProductId 
            ? `${API_BASE}/products/${state.currentEditingProductId}`
            : `${API_BASE}/products`;
        
        const response = await fetch(url, {
            method,
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                name,
                category,
                vendor_id: parseInt(vendor_id),
                cost_price: parseFloat(cost_price),
                selling_price: parseFloat(selling_price),
                stock_quantity: parseInt(stock_quantity) || 0
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to save product');
        }
        
        showToast(state.currentEditingProductId ? 'Product updated successfully' : 'Product added successfully', 'success');
        closeModal('product-modal');
        await loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        showToast(error.message, 'error');
    }
}

async function editProduct(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    
    state.currentEditingProductId = productId;
    document.getElementById('product-modal-title').textContent = 'Edit Product';
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-vendor').value = product.vendor_id;
    document.getElementById('product-stock').value = product.stock_quantity;
    
    // Note: cost_price is not fetched in the GET endpoint for security
    // In production, you might need a separate endpoint for editing
    openModal('product-modal');
    await loadVendorDropdown('product-vendor');
    document.getElementById('product-vendor').value = product.vendor_id;
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/${productId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to delete product');
        }
        
        showToast('Product deleted successfully', 'success');
        await loadProducts();
    } catch (error) {
        console.error('Error deleting product:', error);
        showToast(error.message, 'error');
    }
}

async function loadProductDropdown(elementId) {
    const select = document.getElementById(elementId);
    select.innerHTML = '<option value="">Select Product</option>' + 
        state.products
            .filter(p => p.stock_quantity > 0)
            .map(p => `<option value="${p.id}" data-price="${p.selling_price}" data-stock="${p.stock_quantity}">${p.name}</option>`)
            .join('');
}

// ========================================================================
// SALES MANAGEMENT
// ========================================================================

async function loadSales() {
    if (!authToken) return;
    
    // Show loading state
    const dashboardTbody = document.getElementById('dashboard-sales-list');
    if (dashboardTbody) {
        dashboardTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">Loading...</td></tr>';
    }
    
    try {
        const response = await fetch(`${API_BASE}/sales`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load sales');
        }
        
        state.sales = await response.json();
        renderSales();
        renderDashboardSales();
    } catch (error) {
        console.error('Error loading sales:', error);
        showToast('Failed to load sales', 'error');
    }
}

function renderSales() {
    const tbody = document.getElementById('sales-list');
    
    if (state.sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No sales recorded yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.sales.slice(0, 50).map(sale => `
        <tr>
            <td>#${sale.id}</td>
            <td>${sale.product_name}</td>
            <td>${sale.quantity}</td>
            <td>₹${parseFloat(sale.total).toFixed(2)}</td>
            <td>₹${parseFloat(sale.profit).toFixed(2)}</td>
            <td>${formatDate(sale.sale_date)}</td>
        </tr>
    `).join('');
}

function renderDashboardSales() {
    const tbody = document.getElementById('dashboard-sales-list');
    
    if (state.sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No sales yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.sales.slice(0, 10).map(sale => `
        <tr>
            <td>${sale.product_name}</td>
            <td>${sale.quantity}</td>
            <td>₹${parseFloat(sale.total).toFixed(2)}</td>
            <td>₹${parseFloat(sale.profit).toFixed(2)}</td>
            <td>${formatDate(sale.sale_date)}</td>
        </tr>
    `).join('');
}

function updateSaleInfo() {
    const productSelect = document.getElementById('sale-product');
    const quantityInput = document.getElementById('sale-quantity');
    
    const selectedOption = productSelect.options[productSelect.selectedIndex];
    if (!selectedOption.value) {
        resetSaleInfo();
        return;
    }
    
    const price = parseFloat(selectedOption.getAttribute('data-price'));
    const stock = parseInt(selectedOption.getAttribute('data-stock'));
    const quantity = parseInt(quantityInput.value) || 0;
    
    document.getElementById('sale-unit-price').textContent = price.toFixed(2);
    document.getElementById('sale-available-stock').textContent = stock;
    
    if (quantity > 0) {
        const total = (price * quantity).toFixed(2);
        document.getElementById('sale-total-amount').textContent = total;
    } else {
        document.getElementById('sale-total-amount').textContent = '0.00';
    }
}

function resetSaleInfo() {
    document.getElementById('sale-unit-price').textContent = '0.00';
    document.getElementById('sale-available-stock').textContent = '0';
    document.getElementById('sale-total-amount').textContent = '0.00';
}

async function recordSale() {
    const product_id = document.getElementById('sale-product').value;
    const quantity = parseInt(document.getElementById('sale-quantity').value);
    
    if (!product_id || !quantity || quantity <= 0) {
        showToast('Please select a product and valid quantity', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/sales`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                product_id: parseInt(product_id),
                quantity
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to record sale');
        }

        const sale = await response.json();
        showToast(`Sale recorded! Profit: ₹${sale.profit.toFixed(2)}`, 'success');
        closeModal('sale-modal');
        await loadSales();
        await loadProducts(); // Refresh products for updated stock
        await loadDashboard(); // Refresh dashboard stats
    } catch (error) {
        console.error('Error recording sale:', error);
        showToast(error.message, 'error');
    }
}

// ========================================================================
// SALES PRODUCT SEARCH/FILTER
// ========================================================================

function setupSaleSearch() {
    const saleSearch = document.getElementById('sale-product-search');
    if (saleSearch) {
        saleSearch.addEventListener('input', (e) => filterSaleProducts(e.target.value));
    }
}

function filterSaleProducts(query) {
    const select = document.getElementById('sale-product');
    if (!select) return;
    const prevSelected = select.value;
    const q = (query || '').trim().toLowerCase();

    const filtered = state.products
        .filter(p => p.stock_quantity > 0)
        .filter(p => {
            if (!q) return true;
            const name = (p.name || '').toLowerCase();
            const category = (p.category || '').toLowerCase();
            const vendor = (p.vendor_name || '').toLowerCase();
            return name.includes(q) || category.includes(q) || vendor.includes(q);
        });

    select.innerHTML = '<option value="">Select Product</option>' +
        filtered.map(p => `<option value="${p.id}" data-price="${p.selling_price}" data-stock="${p.stock_quantity}">${p.name}</option>`).join('');

    // Restore selection if still present; otherwise reset sale info
    if (prevSelected && filtered.some(p => String(p.id) === String(prevSelected))) {
        select.value = prevSelected;
        updateSaleInfo();
    } else {
        resetSaleInfo();
    }
}

// ========================================================================
// DASHBOARD
// ========================================================================

async function loadDashboard() {
    if (!authToken) return;
    
    // Show loading state
    document.getElementById('stat-total-sales').textContent = '...';
    document.getElementById('stat-revenue').textContent = '...';
    document.getElementById('stat-profit').textContent = '...';
    document.getElementById('stat-stock').textContent = '...';
    
    try {
        const response = await fetch(`${API_BASE}/reports/summary`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load summary');
        }
        
        const summary = await response.json();
        
        // Calculate total stock
        const totalStock = state.products.reduce((sum, p) => sum + p.stock_quantity, 0);
        
        // Update stats
        document.getElementById('stat-total-sales').textContent = summary.total_sales;
        document.getElementById('stat-revenue').textContent = `₹${summary.total_sales_amount.toFixed(2)}`;
        document.getElementById('stat-profit').textContent = `₹${summary.total_profit.toFixed(2)}`;
        document.getElementById('stat-stock').textContent = totalStock;
    } catch (error) {
        console.error('Error loading dashboard:', error);
        // Show error state
        document.getElementById('stat-total-sales').textContent = '0';
        document.getElementById('stat-revenue').textContent = '₹0.00';
        document.getElementById('stat-profit').textContent = '₹0.00';
        document.getElementById('stat-stock').textContent = '0';
    }
}

// ========================================================================
// REPORTS
// ========================================================================

function setupReportTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = btn.getAttribute('data-tab');
            switchReportTab(tabName);
        });
    });
}

function switchReportTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

async function loadReports() {
    if (!authToken) return;
    
    // Show loading states immediately
    document.getElementById('report-total-sales').textContent = '...';
    document.getElementById('report-total-qty').textContent = '...';
    document.getElementById('report-total-revenue').textContent = '...';
    document.getElementById('report-total-profit').textContent = '...';
    
    document.getElementById('product-report-list').innerHTML = '<tr><td colspan="7" style="text-align:center;color:#888;">Loading...</td></tr>';
    document.getElementById('vendor-report-list').innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;">Loading...</td></tr>';
    document.getElementById('daily-sales-list').innerHTML = '<tr><td colspan="5" style="text-align:center;color:#888;">Loading...</td></tr>';
    
    let successCount = 0;
    const errors = [];

    // Load summary report
    const summary = await (async () => {
        try {
            const r = await fetch(`${API_BASE}/reports/summary`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || 'Failed to load summary');
            }
            successCount++;
            return r.json();
        } catch (error) {
            errors.push('summary');
            console.error('Summary report error:', error);
            return { total_sales: 0, total_quantity: 0, total_sales_amount: 0, total_profit: 0 };
        }
    })();
    
    // Update summary cards immediately (with error safety)
    try {
        const totalSales = Number(summary?.total_sales) || 0;
        const totalQty = Number(summary?.total_quantity) || 0;
        const totalRevenue = Number(summary?.total_sales_amount) || 0;
        const totalProfit = Number(summary?.total_profit) || 0;
        
        document.getElementById('report-total-sales').textContent = totalSales;
        document.getElementById('report-total-qty').textContent = totalQty;
        document.getElementById('report-total-revenue').textContent = `₹${totalRevenue.toFixed(2)}`;
        document.getElementById('report-total-profit').textContent = `₹${totalProfit.toFixed(2)}`;
    } catch (renderError) {
        console.error('Error rendering summary cards:', renderError);
        // Clear skeleton with zeros on render error
        document.getElementById('report-total-sales').textContent = '0';
        document.getElementById('report-total-qty').textContent = '0';
        document.getElementById('report-total-revenue').textContent = '₹0.00';
        document.getElementById('report-total-profit').textContent = '₹0.00';
    }

    // Load product profit report
    const productProfit = await (async () => {
        try {
            const r = await fetch(`${API_BASE}/reports/product-profit`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || 'Failed to load product profit report');
            }
            successCount++;
            return r.json();
        } catch (error) {
            errors.push('product-profit');
            console.error('Product profit report error:', error);
            return [];
        }
    })();
    
    // Render product report immediately
    renderProductProfitReport(productProfit);

    // Load vendor profit report
    const vendorProfit = await (async () => {
        try {
            const r = await fetch(`${API_BASE}/reports/vendor-profit`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || 'Failed to load vendor profit report');
            }
            successCount++;
            return r.json();
        } catch (error) {
            errors.push('vendor-profit');
            console.error('Vendor profit report error:', error);
            return [];
        }
    })();
    
    // Render vendor report immediately
    renderVendorProfitReport(vendorProfit);

    // Load daily sales report
    const dailySales = await (async () => {
        try {
            const r = await fetch(`${API_BASE}/reports/daily-sales`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (!r.ok) {
                const text = await r.text();
                throw new Error(text || 'Failed to load daily sales report');
            }
            successCount++;
            return r.json();
        } catch (error) {
            errors.push('daily-sales');
            console.error('Daily sales report error:', error);
            return [];
        }
    })();
    
    // Render daily sales report immediately
    renderDailySalesReport(dailySales);

    // Show error ONLY if ALL reports failed
    if (successCount === 0) {
        showToast('Failed to load reports', 'error');
    }
}

function renderProductProfitReport(products) {
    const tbody = document.getElementById('product-report-list');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = products.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.total_sales}</td>
            <td>${p.total_quantity}</td>
            <td>₹${p.total_revenue.toFixed(2)}</td>
            <td>₹${p.total_profit.toFixed(2)}</td>
            <td>${p.current_stock}</td>
        </tr>
    `).join('');
}

function renderVendorProfitReport(vendors) {
    const tbody = document.getElementById('vendor-report-list');
    
    if (vendors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="no-data">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = vendors.map(v => `
        <tr>
            <td>${v.name}</td>
            <td>${v.total_sales}</td>
            <td>${v.total_quantity}</td>
            <td>₹${v.total_revenue.toFixed(2)}</td>
            <td>₹${v.total_profit.toFixed(2)}</td>
            <td>${v.product_count}</td>
        </tr>
    `).join('');
}

function renderDailySalesReport(daily) {
    const tbody = document.getElementById('daily-report-list');
    
    if (daily.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No data available</td></tr>';
        return;
    }
    
    tbody.innerHTML = daily.map(d => `
        <tr>
            <td>${d.date}</td>
            <td>${d.total_sales}</td>
            <td>${d.total_quantity}</td>
            <td>₹${d.total_revenue.toFixed(2)}</td>
            <td>₹${d.total_profit.toFixed(2)}</td>
        </tr>
    `).join('');
}

// ========================================================================
// UTILITY FUNCTIONS
// ========================================================================

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-IN');
    document.getElementById('current-time').textContent = timeString;
}

function showToast(message, type = 'info') {
    // Suppress toasts if auth just expired to avoid error spam
    if (window.__authExpired) return;
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Export for debugging
window.appState = state;
console.log('✓ Frontend application loaded successfully');

