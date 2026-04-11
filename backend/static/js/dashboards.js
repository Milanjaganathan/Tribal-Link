/* ═══════════════════════════════════════════
   TRIBAL LINK — Seller & Admin Dashboards
   ═══════════════════════════════════════════ */

// ══════════════════════════════════
// SELLER DASHBOARD
// ══════════════════════════════════
App.renderSellerDashboard = async function(tab) {
    if (!TokenManager.isLoggedIn() || TokenManager.getRole() !== 'seller') return this.navigate('login');
    const user = TokenManager.getUser();

    const tabs = { overview: 'Overview', products: 'My Products', orders: 'Orders', 'add-product': 'Add Product' };
    const activeTab = tabs[tab] ? tab : 'overview';

    this.setContent(`
        <div class="dashboard">
            <div class="dashboard-sidebar" id="seller-sidebar">
                <div class="sidebar-header"><h3>🏪 ${user.shop_name || 'Seller Hub'}</h3><p>${user.is_verified_seller ? '<span class="text-green"><i class="fas fa-check-circle"></i> Verified</span>' : '<span class="text-yellow"><i class="fas fa-clock"></i> Pending Approval</span>'}</p></div>
                <ul class="sidebar-nav">
                    <li><a href="#seller/overview" class="${activeTab==='overview'?'active':''}"><i class="fas fa-chart-line"></i> Overview</a></li>
                    <li><a href="#seller/products" class="${activeTab==='products'?'active':''}"><i class="fas fa-box"></i> My Products</a></li>
                    <li><a href="#seller/orders" class="${activeTab==='orders'?'active':''}"><i class="fas fa-shopping-bag"></i> Orders</a></li>
                    <li><a href="#seller/add-product" class="${activeTab==='add-product'?'active':''}"><i class="fas fa-plus-circle"></i> Add Product</a></li>
                    <li><a href="#notifications"><i class="fas fa-bell"></i> Notifications</a></li>
                    <li><a href="#profile"><i class="fas fa-user"></i> Profile</a></li>
                </ul>
            </div>
            <div class="dashboard-main" id="seller-content"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `);

    if (activeTab === 'overview') await this.sellerOverview();
    else if (activeTab === 'products') await this.sellerProducts();
    else if (activeTab === 'orders') await this.sellerOrders();
    else if (activeTab === 'add-product') this.sellerAddProduct();
};

App.sellerOverview = async function() {
    try {
        const d = await api.get('/accounts/seller/dashboard/');
        document.getElementById('seller-content').innerHTML = `
            <div class="dashboard-header"><h2>Dashboard Overview</h2></div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-box"></i></div><div class="stat-value">${d.products.total}</div><div class="stat-label">Total Products</div></div>
                <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check-circle"></i></div><div class="stat-value">${d.products.approved}</div><div class="stat-label">Approved</div></div>
                <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-shopping-bag"></i></div><div class="stat-value">${d.orders.total}</div><div class="stat-label">Total Orders</div></div>
                <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-rupee-sign"></i></div><div class="stat-value">${formatPrice(d.earnings.total)}</div><div class="stat-label">Total Earnings</div></div>
            </div>
            <div class="grid-2 gap-3">
                <div class="stat-card"><h3 style="margin-bottom:16px">Quick Actions</h3>
                    <div class="flex flex-col gap-1">
                        <button class="btn btn-primary btn-block" onclick="App.navigate('seller','add-product')"><i class="fas fa-plus"></i> Add New Product</button>
                        <button class="btn btn-secondary btn-block" onclick="App.navigate('seller','orders')"><i class="fas fa-shopping-bag"></i> View Orders</button>
                    </div>
                </div>
                <div class="stat-card"><h3 style="margin-bottom:16px">Summary</h3>
                    <div class="summary-row flex justify-between mb-1"><span style="color:var(--text-muted)">Pending Products</span><span class="status-badge pending">${d.products.pending}</span></div>
                    <div class="summary-row flex justify-between mb-1"><span style="color:var(--text-muted)">Pending Orders</span><span class="status-badge pending">${d.orders.pending}</span></div>
                    <div class="summary-row flex justify-between"><span style="color:var(--text-muted)">Completed Orders</span><span class="status-badge delivered">${d.orders.completed}</span></div>
                </div>
            </div>
        `;
    } catch(e) { document.getElementById('seller-content').innerHTML = `<div class="empty-state"><p>${e.message}</p></div>`; }
};

App.sellerProducts = async function() {
    try {
        const data = await api.get('/products/seller/');
        const products = data.results || data;
        document.getElementById('seller-content').innerHTML = `
            <div class="dashboard-header"><h2>My Products</h2><button class="btn btn-primary" onclick="App.navigate('seller','add-product')"><i class="fas fa-plus"></i> Add Product</button></div>
            ${products.length ? `<div class="table-container"><table>
                <thead><tr><th>Product</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>${products.map(p => `<tr>
                    <td class="flex items-center gap-2"><img src="${getProductImage(p)}" style="width:50px;height:50px;border-radius:8px;object-fit:cover" onerror="this.src='https://placehold.co/50/1a1a2e/8B5CF6?text=P'">${p.name}</td>
                    <td style="font-weight:700">${formatPrice(p.price)}</td><td>${p.stock}</td>
                    <td><span class="status-badge ${p.status}">${p.status}</span></td>
                    <td><button class="btn btn-sm btn-secondary" onclick="App.editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteProduct(${p.id})"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('')}</tbody>
            </table></div>` : '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No products yet</h3><button class="btn btn-primary mt-2" onclick="App.navigate(\'seller\',\'add-product\')">Add Your First Product</button></div>'}
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.sellerAddProduct = function(product) {
    document.getElementById('seller-content').innerHTML = `
        <div class="dashboard-header"><h2>${product ? 'Edit Product' : 'Add New Product'}</h2></div>
        <div class="auth-card" style="max-width:700px">
            <form onsubmit="App.saveProduct(event, ${product ? product.id : 'null'})">
                <div class="form-group"><label>Product Name *</label><input class="form-control" id="prod-name" value="${product?.name || ''}" required></div>
                <div class="form-group"><label>Description *</label><textarea class="form-control" id="prod-desc" rows="4" required>${product?.description || ''}</textarea></div>
                <div class="grid-2 gap-2">
                    <div class="form-group"><label>Price (₹) *</label><input type="number" class="form-control" id="prod-price" step="0.01" value="${product?.price || ''}" required></div>
                    <div class="form-group"><label>Compare Price (₹)</label><input type="number" class="form-control" id="prod-compare" step="0.01" value="${product?.compare_price || ''}"></div>
                </div>
                <div class="grid-2 gap-2">
                    <div class="form-group"><label>Stock *</label><input type="number" class="form-control" id="prod-stock" value="${product?.stock || 1}" required></div>
                    <div class="form-group"><label>Category</label><select class="form-control" id="prod-category"><option value="">Select...</option></select></div>
                </div>
                <div class="form-group"><label>Product Image URL</label><input class="form-control" id="prod-imgurl" value="${product?.image_url || ''}" placeholder="https://..."></div>
                <div class="form-group"><label>Or Upload Image</label><input type="file" class="form-control" id="prod-imgfile" accept="image/*"></div>
                <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-save"></i> ${product ? 'Update' : 'Add'} Product</button>
                <button type="button" class="btn btn-secondary btn-lg" onclick="App.navigate('seller','products')">Cancel</button>
            </form>
        </div>
    `;
    // Load categories
    api.get('/products/categories/').then(cats => {
        const sel = document.getElementById('prod-category');
        cats.forEach(c => { const o = document.createElement('option'); o.value = c.id; o.textContent = c.name; if (product?.category == c.id) o.selected = true; sel.appendChild(o); });
    });
};

App.saveProduct = async function(e, productId) {
    e.preventDefault();
    try {
        const fileInput = document.getElementById('prod-imgfile');
        const hasFile = fileInput.files.length > 0;
        let result;

        if (hasFile) {
            const fd = new FormData();
            fd.append('name', document.getElementById('prod-name').value);
            fd.append('description', document.getElementById('prod-desc').value);
            fd.append('price', document.getElementById('prod-price').value);
            const cp = document.getElementById('prod-compare').value;
            if (cp) fd.append('compare_price', cp);
            fd.append('stock', document.getElementById('prod-stock').value);
            const cat = document.getElementById('prod-category').value;
            if (cat) fd.append('category', cat);
            fd.append('image', fileInput.files[0]);
            result = productId ? await api.upload(`/products/seller/${productId}/`, fd) : await api.upload('/products/seller/', fd);
        } else {
            const body = {
                name: document.getElementById('prod-name').value,
                description: document.getElementById('prod-desc').value,
                price: document.getElementById('prod-price').value,
                stock: parseInt(document.getElementById('prod-stock').value),
                image_url: document.getElementById('prod-imgurl').value,
            };
            const cp = document.getElementById('prod-compare').value;
            if (cp) body.compare_price = cp;
            const cat = document.getElementById('prod-category').value;
            if (cat) body.category = parseInt(cat);
            result = productId ? await api.put(`/products/seller/${productId}/`, body) : await api.post('/products/seller/', body);
        }
        showToast(`Product ${productId ? 'updated' : 'added'}! Pending admin approval.`, 'success');
        this.navigate('seller', 'products');
    } catch(e) { showToast(e.message, 'error'); }
};

App.editProduct = async function(id) {
    try { const p = await api.get(`/products/seller/${id}/`); this.sellerAddProduct(p); } catch(e) { showToast(e.message, 'error'); }
};

App.deleteProduct = async function(id) {
    if (!confirm('Delete this product?')) return;
    try { await api.delete(`/products/seller/${id}/`); showToast('Product deleted', 'success'); this.sellerProducts(); } catch(e) { showToast(e.message, 'error'); }
};

App.sellerOrders = async function() {
    try {
        const data = await api.get('/accounts/seller/orders/');
        const orders = data.orders || [];
        document.getElementById('seller-content').innerHTML = `
            <div class="dashboard-header"><h2>Orders Received</h2></div>
            ${orders.length ? `<div class="table-container"><table>
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Status</th><th>Payment</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>${orders.map(o => `<tr>
                    <td style="font-weight:600;color:var(--primary-light)">#${o.order_id.slice(0,8)}</td>
                    <td>${o.customer_name}<br><small style="color:var(--text-muted)">${o.customer_phone}</small></td>
                    <td>${o.items.map(i => `${i.product_name} x${i.quantity}`).join('<br>')}</td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
                    <td>${formatDate(o.created_at)}</td>
                    <td><select class="form-control" style="min-width:120px;padding:6px" onchange="App.updateSellerOrderStatus('${o.order_id}', this.value)">
                        <option value="">Update...</option>
                        ${o.status === 'pending' ? '<option value="confirmed">Confirm</option>' : ''}
                        ${o.status === 'confirmed' ? '<option value="processing">Processing</option>' : ''}
                        ${o.status === 'processing' ? '<option value="shipped">Ship</option>' : ''}
                        ${o.status === 'shipped' ? '<option value="delivered">Delivered</option>' : ''}
                    </select></td>
                </tr>`).join('')}</tbody>
            </table></div>` : '<div class="empty-state"><i class="fas fa-shopping-bag"></i><h3>No orders yet</h3></div>'}
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.updateSellerOrderStatus = async function(orderId, newStatus) {
    if (!newStatus) return;
    try {
        await api.post(`/accounts/seller/orders/${orderId}/update-status/`, { status: newStatus });
        showToast(`Order status updated to ${newStatus}`, 'success');
        this.sellerOrders();
    } catch(e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════
App.renderAdminDashboard = async function(tab) {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    const role = TokenManager.getRole();
    const user = TokenManager.getUser();
    if (role !== 'admin' && !user.is_superuser) return this.navigate('home');

    const tabs = { overview: 'Overview', users: 'Users', sellers: 'Sellers', products: 'Products', orders: 'Orders', reviews: 'Reviews', broadcast: 'Broadcast' };
    const activeTab = tabs[tab] ? tab : 'overview';

    this.setContent(`
        <div class="dashboard">
            <div class="dashboard-sidebar">
                <div class="sidebar-header"><h3>⚙️ Admin Panel</h3><p>System Management</p></div>
                <ul class="sidebar-nav">
                    <li><a href="#admin/overview" class="${activeTab==='overview'?'active':''}"><i class="fas fa-chart-pie"></i> Overview</a></li>
                    <li><a href="#admin/users" class="${activeTab==='users'?'active':''}"><i class="fas fa-users"></i> Users</a></li>
                    <li><a href="#admin/sellers" class="${activeTab==='sellers'?'active':''}"><i class="fas fa-store"></i> Seller Approvals</a></li>
                    <li><a href="#admin/products" class="${activeTab==='products'?'active':''}"><i class="fas fa-box"></i> Products</a></li>
                    <li><a href="#admin/orders" class="${activeTab==='orders'?'active':''}"><i class="fas fa-shopping-bag"></i> Orders</a></li>
                    <li><a href="#admin/reviews" class="${activeTab==='reviews'?'active':''}"><i class="fas fa-star"></i> Reviews</a></li>
                    <li><a href="#admin/broadcast" class="${activeTab==='broadcast'?'active':''}"><i class="fas fa-bullhorn"></i> Broadcast</a></li>
                </ul>
            </div>
            <div class="dashboard-main" id="admin-content"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `);

    const renderers = { overview: this.adminOverview, users: this.adminUsers, sellers: this.adminSellers, products: this.adminProducts, orders: this.adminOrders, reviews: this.adminReviews, broadcast: this.adminBroadcast };
    if (renderers[activeTab]) await renderers[activeTab].call(this);
};

App.adminOverview = async function() {
    try {
        const d = await api.get('/accounts/admin/dashboard/');
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>Admin Dashboard</h2></div>
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-users"></i></div><div class="stat-value">${d.users.total}</div><div class="stat-label">Total Users</div></div>
                <div class="stat-card"><div class="stat-icon green"><i class="fas fa-store"></i></div><div class="stat-value">${d.users.sellers}</div><div class="stat-label">Sellers (${d.users.pending_sellers} pending)</div></div>
                <div class="stat-card"><div class="stat-icon yellow"><i class="fas fa-box"></i></div><div class="stat-value">${d.products.total}</div><div class="stat-label">Products (${d.products.pending} pending)</div></div>
                <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-shopping-bag"></i></div><div class="stat-value">${d.orders.total}</div><div class="stat-label">Total Orders</div></div>
                <div class="stat-card"><div class="stat-icon red"><i class="fas fa-rupee-sign"></i></div><div class="stat-value">${formatPrice(d.revenue.total)}</div><div class="stat-label">Total Revenue</div></div>
                <div class="stat-card"><div class="stat-icon green"><i class="fas fa-check"></i></div><div class="stat-value">${d.orders.completed}</div><div class="stat-label">Completed Orders</div></div>
            </div>
            <h3 style="margin-bottom:16px">Recent Orders</h3>
            <div class="table-container"><table>
                <thead><tr><th>Order</th><th>User</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>${(d.recent_orders||[]).map(o => `<tr>
                    <td style="color:var(--primary-light)">#${o.order_id.slice(0,8)}</td><td>${o.user_email}</td>
                    <td style="font-weight:700">${formatPrice(o.total)}</td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
                    <td>${formatDate(o.created_at)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    } catch(e) { document.getElementById('admin-content').innerHTML = `<div class="empty-state"><p>${e.message}</p></div>`; }
};

App.adminUsers = async function() {
    try {
        const data = await api.get('/accounts/admin/users/');
        const users = data.results || data;
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>Manage Users</h2></div>
            <div class="filters-bar mb-2">
                <button class="filter-chip active" onclick="App.navigate('admin','users')">All</button>
                <button class="filter-chip" onclick="App.filterUsers('customer')">Customers</button>
                <button class="filter-chip" onclick="App.filterUsers('seller')">Sellers</button>
            </div>
            <div class="table-container"><table>
                <thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>${users.map(u => `<tr>
                    <td><strong>${u.full_name || u.username}</strong></td><td>${u.email}</td>
                    <td><span class="status-badge ${u.role === 'admin' ? 'processing' : u.role === 'seller' ? 'shipped' : 'confirmed'}">${u.role}</span></td>
                    <td>${u.is_active ? '<span class="text-green">Active</span>' : '<span class="text-red">Inactive</span>'}</td>
                    <td>${formatDate(u.date_joined)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.adminSellers = async function() {
    try {
        const data = await api.get('/accounts/admin/sellers/pending/');
        const sellers = data.results || data;
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>Pending Seller Approvals</h2></div>
            ${sellers.length ? `<div class="table-container"><table>
                <thead><tr><th>Name</th><th>Email</th><th>Shop</th><th>Phone</th><th>Actions</th></tr></thead>
                <tbody>${sellers.map(s => `<tr>
                    <td><strong>${s.full_name || s.username}</strong></td><td>${s.email}</td>
                    <td>${s.shop_name || '-'}</td><td>${s.phone || '-'}</td>
                    <td><button class="btn btn-sm btn-accent" onclick="App.approveSeller(${s.id},'approve')"><i class="fas fa-check"></i> Approve</button>
                        <button class="btn btn-sm btn-danger" onclick="App.approveSeller(${s.id},'reject')"><i class="fas fa-times"></i> Reject</button></td>
                </tr>`).join('')}</tbody>
            </table></div>` : '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>No pending approvals</h3></div>'}
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.approveSeller = async function(id, action) {
    const reason = action === 'reject' ? prompt('Rejection reason (optional):') : '';
    try {
        await api.post(`/accounts/admin/sellers/${id}/approve/`, { action, reason: reason || '' });
        showToast(`Seller ${action}d successfully`, 'success');
        this.adminSellers();
    } catch(e) { showToast(e.message, 'error'); }
};

App.adminProducts = async function() {
    try {
        const data = await api.get('/accounts/admin/products/?status=pending');
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>Product Management</h2></div>
            <div class="filters-bar mb-2">
                <button class="filter-chip" onclick="App.loadAdminProducts('')">All</button>
                <button class="filter-chip active" onclick="App.loadAdminProducts('pending')">Pending</button>
                <button class="filter-chip" onclick="App.loadAdminProducts('approved')">Approved</button>
                <button class="filter-chip" onclick="App.loadAdminProducts('rejected')">Rejected</button>
            </div>
            <div id="admin-products-table"></div>
        `;
        this.renderAdminProductsTable(data.products || []);
    } catch(e) { showToast(e.message, 'error'); }
};

App.loadAdminProducts = async function(status) {
    try {
        const data = await api.get(`/accounts/admin/products/${status ? '?status=' + status : ''}`);
        this.renderAdminProductsTable(data.products || []);
    } catch(e) {}
};

App.renderAdminProductsTable = function(products) {
    const el = document.getElementById('admin-products-table');
    if (!el) return;
    el.innerHTML = products.length ? `<div class="table-container"><table>
        <thead><tr><th>Product</th><th>Seller</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>${products.map(p => `<tr>
            <td class="flex items-center gap-2"><img src="${getProductImage(p)}" style="width:40px;height:40px;border-radius:6px;object-fit:cover" onerror="this.src='https://placehold.co/40/1a1a2e/8B5CF6?text=P'">${p.name}</td>
            <td>${p.seller_name || '-'}</td><td>${formatPrice(p.price)}</td>
            <td><span class="status-badge ${p.status}">${p.status}</span></td>
            <td>${p.status === 'pending' ? `<button class="btn btn-sm btn-accent" onclick="App.approveProduct(${p.id},'approve')"><i class="fas fa-check"></i></button><button class="btn btn-sm btn-danger" onclick="App.approveProduct(${p.id},'reject')"><i class="fas fa-times"></i></button>` : '-'}</td>
        </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty-state"><h3>No products found</h3></div>';
};

App.approveProduct = async function(id, action) {
    const reason = action === 'reject' ? prompt('Rejection reason:') : '';
    try {
        await api.post(`/accounts/admin/products/${id}/approve/`, { action, reason: reason || '' });
        showToast(`Product ${action}d`, 'success');
        this.adminProducts();
    } catch(e) { showToast(e.message, 'error'); }
};

App.adminOrders = async function() {
    try {
        const data = await api.get('/accounts/admin/orders/');
        const orders = data.orders || [];
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>All Orders</h2></div>
            <div class="table-container"><table>
                <thead><tr><th>Order</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>${orders.map(o => `<tr>
                    <td style="color:var(--primary-light)">#${String(o.order_id).slice(0,8)}</td>
                    <td style="font-weight:700">${formatPrice(o.total)}</td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
                    <td>${formatDate(o.created_at)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.adminReviews = async function() {
    try {
        const data = await api.get('/accounts/admin/reviews/');
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2>Manage Reviews</h2></div>
            ${(data.reviews||[]).length ? data.reviews.map(r => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-user"><div class="review-avatar">${getInitials(r.user)}</div><div><strong>${r.user?.full_name || r.user?.username || 'User'}</strong><div class="review-stars" style="font-size:0.8rem">${renderStars(r.rating)}</div></div></div>
                        <button class="btn btn-sm btn-danger" onclick="App.deleteReview(${r.id})"><i class="fas fa-trash"></i> Delete</button>
                    </div>
                    <p style="color:var(--text-secondary)">${r.comment}</p>
                </div>
            `).join('') : '<div class="empty-state"><h3>No reviews</h3></div>'}
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.deleteReview = async function(id) {
    if (!confirm('Delete this review?')) return;
    try { await api.delete(`/accounts/admin/reviews/${id}/`); showToast('Review deleted', 'success'); this.adminReviews(); } catch(e) { showToast(e.message, 'error'); }
};

App.adminBroadcast = function() {
    document.getElementById('admin-content').innerHTML = `
        <div class="dashboard-header"><h2><i class="fas fa-bullhorn"></i> Broadcast Notification</h2></div>
        <div class="auth-card" style="max-width:600px">
            <div class="form-group"><label>Target Audience</label>
                <select class="form-control" id="bc-role"><option value="">All Users</option><option value="customer">Customers Only</option><option value="seller">Sellers Only</option></select>
            </div>
            <div class="form-group"><label>Title</label><input class="form-control" id="bc-title" placeholder="Notification title"></div>
            <div class="form-group"><label>Message</label><textarea class="form-control" id="bc-message" rows="4" placeholder="Your message..."></textarea></div>
            <button class="btn btn-primary btn-lg" onclick="App.sendBroadcast()"><i class="fas fa-paper-plane"></i> Send Broadcast</button>
        </div>
    `;
};

App.sendBroadcast = async function() {
    try {
        const data = await api.post('/notifications/broadcast/', {
            title: document.getElementById('bc-title').value,
            message: document.getElementById('bc-message').value,
            role: document.getElementById('bc-role').value,
        });
        showToast(data.message, 'success');
        document.getElementById('bc-title').value = '';
        document.getElementById('bc-message').value = '';
    } catch(e) { showToast(e.message, 'error'); }
};
