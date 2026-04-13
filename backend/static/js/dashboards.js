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
// ADMIN DASHBOARD — FULL FEATURED
// ══════════════════════════════════
App.renderAdminDashboard = async function(tab) {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    const role = TokenManager.getRole();
    const user = TokenManager.getUser();
    if (role !== 'admin' && !user.is_superuser) return this.navigate('home');

    const tabs = {
        overview: 'Overview', users: 'Users', sellers: 'Sellers',
        products: 'Products', orders: 'Orders', payments: 'Payments',
        reviews: 'Reviews', broadcast: 'Broadcast'
    };
    const activeTab = tabs[tab] ? tab : 'overview';

    this.setContent(`
        <div class="dashboard">
            <div class="dashboard-sidebar">
                <div class="sidebar-header">
                    <h3>⚙️ Admin Panel</h3>
                    <p style="font-size:0.75rem;color:var(--accent)"><i class="fas fa-shield-alt"></i> System Management</p>
                </div>
                <ul class="sidebar-nav">
                    <li><a href="#admin/overview" class="${activeTab==='overview'?'active':''}"><i class="fas fa-chart-pie"></i> Overview</a></li>
                    <li><a href="#admin/users" class="${activeTab==='users'?'active':''}"><i class="fas fa-users"></i> Users</a></li>
                    <li><a href="#admin/sellers" class="${activeTab==='sellers'?'active':''}"><i class="fas fa-store"></i> Seller Approvals</a></li>
                    <li><a href="#admin/products" class="${activeTab==='products'?'active':''}"><i class="fas fa-box"></i> Product Verification</a></li>
                    <li><a href="#admin/orders" class="${activeTab==='orders'?'active':''}"><i class="fas fa-shopping-bag"></i> Orders</a></li>
                    <li><a href="#admin/payments" class="${activeTab==='payments'?'active':''}"><i class="fas fa-credit-card"></i> Payments</a></li>
                    <li><a href="#admin/reviews" class="${activeTab==='reviews'?'active':''}"><i class="fas fa-star"></i> Reviews</a></li>
                    <li><a href="#admin/broadcast" class="${activeTab==='broadcast'?'active':''}"><i class="fas fa-bullhorn"></i> Broadcast</a></li>
                </ul>
            </div>
            <div class="dashboard-main" id="admin-content"><div class="loading-spinner"><div class="spinner"></div></div></div>
        </div>
    `);

    const renderers = {
        overview: this.adminOverview, users: this.adminUsers,
        sellers: this.adminSellers, products: this.adminProducts,
        orders: this.adminOrders, payments: this.adminPayments,
        reviews: this.adminReviews, broadcast: this.adminBroadcast
    };
    if (renderers[activeTab]) await renderers[activeTab].call(this);
};

// ── Admin Overview ──
App.adminOverview = async function() {
    try {
        const d = await api.get('/accounts/admin/dashboard/');
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-chart-pie"></i> Admin Dashboard</h2></div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon purple"><i class="fas fa-users"></i></div>
                    <div class="stat-value">${d.users.total}</div>
                    <div class="stat-label">Total Users</div>
                    <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">
                        <span style="color:var(--accent)">${d.users.customers}</span> customers ·
                        <span style="color:var(--secondary)">${d.users.sellers}</span> sellers
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-store"></i></div>
                    <div class="stat-value">${d.users.sellers}</div>
                    <div class="stat-label">Total Sellers</div>
                    <div style="margin-top:8px">
                        ${d.users.pending_sellers > 0 ? `<span class="status-badge pending" style="cursor:pointer" onclick="App.navigate('admin','sellers')">${d.users.pending_sellers} pending approval</span>` : '<span class="status-badge delivered">All approved</span>'}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><i class="fas fa-box"></i></div>
                    <div class="stat-value">${d.products.total}</div>
                    <div class="stat-label">Products</div>
                    <div style="margin-top:8px">
                        ${d.products.pending > 0 ? `<span class="status-badge pending" style="cursor:pointer" onclick="App.navigate('admin','products')">${d.products.pending} pending review</span>` : '<span class="status-badge delivered">All reviewed</span>'}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon blue"><i class="fas fa-shopping-bag"></i></div>
                    <div class="stat-value">${d.orders.total}</div>
                    <div class="stat-label">Total Orders</div>
                    <div style="margin-top:8px;font-size:0.8rem;color:var(--text-muted)">
                        <span style="color:var(--accent)">${d.orders.completed}</span> completed ·
                        <span style="color:var(--secondary)">${d.orders.pending}</span> pending
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><i class="fas fa-rupee-sign"></i></div>
                    <div class="stat-value">${formatPrice(d.revenue.total)}</div>
                    <div class="stat-label">Total Revenue</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><i class="fas fa-check-double"></i></div>
                    <div class="stat-value">${d.orders.completed}</div>
                    <div class="stat-label">Completed Orders</div>
                </div>
            </div>

            <!-- Quick Action Cards -->
            <div class="grid-2 gap-3 mb-3">
                <div class="stat-card" style="border-left:3px solid var(--secondary)">
                    <h3 style="margin-bottom:16px"><i class="fas fa-bolt" style="color:var(--secondary)"></i> Quick Actions</h3>
                    <div class="flex flex-col gap-1">
                        <button class="btn btn-primary btn-block btn-sm" onclick="App.navigate('admin','products')"><i class="fas fa-check-circle"></i> Review Pending Products (${d.products.pending})</button>
                        <button class="btn btn-accent btn-block btn-sm" onclick="App.navigate('admin','sellers')"><i class="fas fa-user-check"></i> Approve Sellers (${d.users.pending_sellers})</button>
                        <button class="btn btn-secondary btn-block btn-sm" onclick="App.navigate('admin','payments')"><i class="fas fa-credit-card"></i> Manage Payments</button>
                        <button class="btn btn-secondary btn-block btn-sm" onclick="App.navigate('admin','broadcast')"><i class="fas fa-bullhorn"></i> Send Notification</button>
                    </div>
                </div>
                <div class="stat-card" style="border-left:3px solid var(--primary)">
                    <h3 style="margin-bottom:16px"><i class="fas fa-chart-line" style="color:var(--primary-light)"></i> Platform Health</h3>
                    <div class="flex flex-col gap-1">
                        <div class="flex justify-between"><span style="color:var(--text-muted)">Approved Products</span><span style="font-weight:700;color:var(--accent)">${d.products.approved}</span></div>
                        <div style="background:var(--bg-secondary);border-radius:var(--radius-full);height:8px;overflow:hidden;margin:4px 0">
                            <div style="height:100%;width:${d.products.total > 0 ? Math.round(d.products.approved / d.products.total * 100) : 0}%;background:linear-gradient(90deg,var(--accent),var(--accent-light));border-radius:var(--radius-full);transition:width 0.5s"></div>
                        </div>
                        <div class="flex justify-between mt-1"><span style="color:var(--text-muted)">Verified Sellers</span><span style="font-weight:700;color:var(--accent)">${d.users.verified_sellers || (d.users.sellers - d.users.pending_sellers)}</span></div>
                        <div style="background:var(--bg-secondary);border-radius:var(--radius-full);height:8px;overflow:hidden;margin:4px 0">
                            <div style="height:100%;width:${d.users.sellers > 0 ? Math.round((d.users.sellers - d.users.pending_sellers) / d.users.sellers * 100) : 100}%;background:linear-gradient(90deg,var(--primary),var(--primary-light));border-radius:var(--radius-full);transition:width 0.5s"></div>
                        </div>
                        <div class="flex justify-between mt-1"><span style="color:var(--text-muted)">Categories</span><span style="font-weight:700">${d.categories}</span></div>
                    </div>
                </div>
            </div>

            <h3 style="margin-bottom:16px"><i class="fas fa-clock"></i> Recent Orders</h3>
            <div class="table-container"><table>
                <thead><tr><th>Order</th><th>User</th><th>Total</th><th>Status</th><th>Payment</th><th>Date</th></tr></thead>
                <tbody>${(d.recent_orders||[]).map(o => `<tr>
                    <td style="color:var(--primary-light);font-weight:600">#${o.order_id.slice(0,8)}</td><td>${o.user_email}</td>
                    <td style="font-weight:700">${formatPrice(o.total)}</td>
                    <td><span class="status-badge ${o.status}">${o.status}</span></td>
                    <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
                    <td>${formatDate(o.created_at)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    } catch(e) { document.getElementById('admin-content').innerHTML = `<div class="empty-state"><p>${e.message}</p></div>`; }
};

// ── Admin Users ──
App.adminUsers = async function() {
    try {
        const data = await api.get('/accounts/admin/users/');
        const users = data.results || data;
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-users"></i> Manage Users</h2>
                <div style="font-size:0.85rem;color:var(--text-muted)">${users.length} total users</div>
            </div>
            <div class="filters-bar mb-2">
                <button class="filter-chip active" onclick="App.adminUsersFilter('')">All</button>
                <button class="filter-chip" onclick="App.adminUsersFilter('customer')">Customers</button>
                <button class="filter-chip" onclick="App.adminUsersFilter('seller')">Sellers</button>
                <button class="filter-chip" onclick="App.adminUsersFilter('admin')">Admins</button>
            </div>
            <div class="table-container" id="users-table"><table>
                <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
                <tbody>${users.map(u => `<tr>
                    <td><strong>${u.full_name || u.username}</strong></td><td>${u.email}</td>
                    <td>${u.phone || '-'}</td>
                    <td><span class="status-badge ${u.role === 'admin' ? 'processing' : u.role === 'seller' ? 'shipped' : 'confirmed'}">${u.role}</span></td>
                    <td>${u.is_active ? '<span class="text-green"><i class="fas fa-check-circle"></i> Active</span>' : '<span class="text-red"><i class="fas fa-times-circle"></i> Inactive</span>'}</td>
                    <td>${formatDate(u.date_joined)}</td>
                </tr>`).join('')}</tbody>
            </table></div>
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.adminUsersFilter = async function(role) {
    try {
        const url = role ? `/accounts/admin/users/?role=${role}` : '/accounts/admin/users/';
        const data = await api.get(url);
        const users = data.results || data;
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        event.target.classList.add('active');
        document.getElementById('users-table').innerHTML = `<table>
            <thead><tr><th>User</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
            <tbody>${users.map(u => `<tr>
                <td><strong>${u.full_name || u.username}</strong></td><td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td><span class="status-badge ${u.role === 'admin' ? 'processing' : u.role === 'seller' ? 'shipped' : 'confirmed'}">${u.role}</span></td>
                <td>${u.is_active ? '<span class="text-green"><i class="fas fa-check-circle"></i> Active</span>' : '<span class="text-red"><i class="fas fa-times-circle"></i> Inactive</span>'}</td>
                <td>${formatDate(u.date_joined)}</td>
            </tr>`).join('')}</tbody>
        </table>`;
    } catch(e) {}
};

// ── Admin Sellers ──
App.adminSellers = async function() {
    try {
        const data = await api.get('/accounts/admin/sellers/pending/');
        const sellers = data.results || data;
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-store"></i> Pending Seller Approvals</h2></div>
            ${sellers.length ? sellers.map(s => `
                <div class="stat-card mb-2" style="border-left:3px solid var(--secondary)">
                    <div class="flex justify-between items-center">
                        <div>
                            <h3 style="margin-bottom:4px">${s.full_name || s.username}</h3>
                            <div style="font-size:0.85rem;color:var(--text-muted)">
                                <i class="fas fa-envelope"></i> ${s.email}
                                ${s.phone ? ` · <i class="fas fa-phone"></i> ${s.phone}` : ''}
                            </div>
                            ${s.shop_name ? `<div style="font-size:0.9rem;color:var(--primary-light);margin-top:4px"><i class="fas fa-store"></i> ${s.shop_name}</div>` : ''}
                            ${s.shop_description ? `<p style="font-size:0.82rem;color:var(--text-muted);margin-top:4px">${s.shop_description}</p>` : ''}
                            <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">Applied: ${formatDate(s.date_joined)}</div>
                        </div>
                        <div class="flex gap-1">
                            <button class="btn btn-accent btn-sm" onclick="App.approveSeller(${s.id},'approve')"><i class="fas fa-check"></i> Approve</button>
                            <button class="btn btn-danger btn-sm" onclick="App.approveSeller(${s.id},'reject')"><i class="fas fa-times"></i> Reject</button>
                        </div>
                    </div>
                </div>
            `).join('') : '<div class="empty-state"><i class="fas fa-check-circle" style="color:var(--accent)"></i><h3>No pending approvals</h3><p>All seller applications have been reviewed.</p></div>'}
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

// ── Admin Products — Verification Panel ──
App.adminProducts = async function() {
    document.getElementById('admin-content').innerHTML = `
        <div class="dashboard-header"><h2><i class="fas fa-box"></i> Product Verification</h2></div>
        <div class="filters-bar mb-2" id="product-filters">
            <button class="filter-chip" onclick="App.loadAdminProducts('', this)">All</button>
            <button class="filter-chip active" onclick="App.loadAdminProducts('pending', this)">⏳ Pending</button>
            <button class="filter-chip" onclick="App.loadAdminProducts('approved', this)">✅ Approved</button>
            <button class="filter-chip" onclick="App.loadAdminProducts('rejected', this)">❌ Rejected</button>
        </div>
        <div id="admin-products-container"><div class="loading-spinner"><div class="spinner"></div></div></div>
    `;
    await this.loadAdminProducts('pending', document.querySelector('.filter-chip.active'));
};

App.loadAdminProducts = async function(statusFilter, btn) {
    try {
        if (btn) {
            document.querySelectorAll('#product-filters .filter-chip').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
        }
        const data = await api.get(`/accounts/admin/products/${statusFilter ? '?status=' + statusFilter : ''}`);
        const products = data.products || [];
        const container = document.getElementById('admin-products-container');

        if (!products.length) {
            container.innerHTML = `<div class="empty-state"><i class="fas fa-box-open"></i><h3>No ${statusFilter || ''} products</h3></div>`;
            return;
        }

        container.innerHTML = products.map(p => `
            <div class="stat-card mb-2" style="border-left:3px solid ${p.status === 'pending' ? 'var(--secondary)' : p.status === 'approved' ? 'var(--accent)' : 'var(--danger)'}">
                <div style="display:grid;grid-template-columns:120px 1fr auto;gap:20px;align-items:start">
                    <div style="width:120px;height:120px;border-radius:var(--radius-md);overflow:hidden;background:var(--bg-secondary)">
                        <img src="${getProductImage(p)}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" onerror="this.src='https://placehold.co/120/1a1a2e/8B5CF6?text=No+Image'">
                    </div>
                    <div>
                        <div class="flex items-center gap-2 mb-1">
                            <h3 style="margin:0">${p.name}</h3>
                            <span class="status-badge ${p.status}">${p.status}</span>
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;font-size:0.85rem;color:var(--text-muted);margin-top:8px">
                            <span><i class="fas fa-tag"></i> ${p.category_name || 'Uncategorized'}</span>
                            <span><i class="fas fa-rupee-sign"></i> ${formatPrice(p.price)} ${p.compare_price ? `<span style="text-decoration:line-through;opacity:0.5">${formatPrice(p.compare_price)}</span>` : ''}</span>
                            <span><i class="fas fa-store"></i> ${p.seller_name || 'Unknown'}</span>
                            <span><i class="fas fa-cubes"></i> Stock: ${p.stock}</span>
                            ${p.seller_email ? `<span><i class="fas fa-envelope"></i> ${p.seller_email}</span>` : ''}
                            ${p.seller_phone ? `<span><i class="fas fa-phone"></i> ${p.seller_phone}</span>` : ''}
                        </div>
                        <div style="font-size:0.8rem;color:var(--text-muted);margin-top:6px">
                            <i class="fas fa-star" style="color:var(--secondary)"></i> ${p.average_rating || 'No'} rating · ${p.review_count || 0} reviews · Listed ${formatDate(p.created_at)}
                        </div>
                    </div>
                    <div class="flex flex-col gap-1" style="min-width:140px">
                        ${p.status === 'pending' ? `
                            <button class="btn btn-accent btn-sm btn-block" onclick="App.approveProduct(${p.id},'approve')"><i class="fas fa-check-circle"></i> Approve</button>
                            <button class="btn btn-danger btn-sm btn-block" onclick="App.approveProduct(${p.id},'reject')"><i class="fas fa-times-circle"></i> Reject</button>
                        ` : p.status === 'approved' ? `
                            <button class="btn btn-danger btn-sm btn-block" onclick="App.approveProduct(${p.id},'reject')"><i class="fas fa-ban"></i> Revoke</button>
                        ` : `
                            <button class="btn btn-accent btn-sm btn-block" onclick="App.approveProduct(${p.id},'approve')"><i class="fas fa-undo"></i> Re-approve</button>
                        `}
                        <button class="btn btn-secondary btn-sm btn-block" onclick="App.navigate('product','${p.id}')"><i class="fas fa-eye"></i> Preview</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch(e) { showToast(e.message, 'error'); }
};

App.approveProduct = async function(id, action) {
    const reason = action === 'reject' ? prompt('Rejection reason:') : '';
    if (action === 'reject' && reason === null) return; // user cancelled prompt
    try {
        await api.post(`/accounts/admin/products/${id}/approve/`, { action, reason: reason || '' });
        showToast(`Product ${action}d successfully`, 'success');
        // Reload current filter
        const activeChip = document.querySelector('#product-filters .filter-chip.active');
        const currentFilter = activeChip?.textContent?.includes('Pending') ? 'pending' :
                              activeChip?.textContent?.includes('Approved') ? 'approved' :
                              activeChip?.textContent?.includes('Rejected') ? 'rejected' : '';
        await this.loadAdminProducts(currentFilter, activeChip);
    } catch(e) { showToast(e.message, 'error'); }
};

// ── Admin Orders ──
App.adminOrders = async function() {
    try {
        const data = await api.get('/accounts/admin/orders/');
        const orders = data.orders || [];
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-shopping-bag"></i> All Orders</h2>
                <div style="font-size:0.85rem;color:var(--text-muted)">${orders.length} orders total</div>
            </div>
            <div class="filters-bar mb-2">
                <button class="filter-chip active" onclick="App.adminOrdersFilter('', this)">All</button>
                <button class="filter-chip" onclick="App.adminOrdersFilter('pending', this)">Pending</button>
                <button class="filter-chip" onclick="App.adminOrdersFilter('confirmed', this)">Confirmed</button>
                <button class="filter-chip" onclick="App.adminOrdersFilter('shipped', this)">Shipped</button>
                <button class="filter-chip" onclick="App.adminOrdersFilter('delivered', this)">Delivered</button>
                <button class="filter-chip" onclick="App.adminOrdersFilter('cancelled', this)">Cancelled</button>
            </div>
            <div id="admin-orders-table">
                ${App.renderAdminOrdersTable(orders)}
            </div>
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.renderAdminOrdersTable = function(orders) {
    if (!orders.length) return '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No orders found</h3></div>';
    return `<div class="table-container"><table>
        <thead><tr><th>Order ID</th><th>Total</th><th>Status</th><th>Payment</th><th>Method</th><th>Date</th></tr></thead>
        <tbody>${orders.map(o => `<tr>
            <td style="color:var(--primary-light);font-weight:600">#${String(o.order_id).slice(0,8)}</td>
            <td style="font-weight:700">${formatPrice(o.total)}</td>
            <td><span class="status-badge ${o.status}">${o.status}</span></td>
            <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
            <td style="text-transform:uppercase;font-size:0.8rem;font-weight:600">${o.payment_method || 'N/A'}</td>
            <td>${formatDate(o.created_at)}</td>
        </tr>`).join('')}</tbody>
    </table></div>`;
};

App.adminOrdersFilter = async function(statusFilter, btn) {
    try {
        document.querySelectorAll('.filters-bar .filter-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const data = await api.get(`/accounts/admin/orders/${statusFilter ? '?status=' + statusFilter : ''}`);
        document.getElementById('admin-orders-table').innerHTML = App.renderAdminOrdersTable(data.orders || []);
    } catch(e) {}
};

// ── Admin Payments Management ──
App.adminPayments = async function() {
    try {
        const data = await api.get('/accounts/admin/orders/');
        const orders = data.orders || [];

        // Compute payment stats
        const paid = orders.filter(o => o.payment_status === 'completed');
        const unpaid = orders.filter(o => o.payment_status === 'pending');
        const failed = orders.filter(o => o.payment_status === 'failed');
        const totalRevenue = paid.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);
        const pendingAmount = unpaid.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-credit-card"></i> Payment Management</h2></div>

            <div class="stats-grid">
                <div class="stat-card" style="border-top:3px solid var(--accent)">
                    <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
                    <div class="stat-value">${formatPrice(totalRevenue)}</div>
                    <div class="stat-label">Revenue Collected</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${paid.length} successful payments</div>
                </div>
                <div class="stat-card" style="border-top:3px solid var(--secondary)">
                    <div class="stat-icon yellow"><i class="fas fa-clock"></i></div>
                    <div class="stat-value">${formatPrice(pendingAmount)}</div>
                    <div class="stat-label">Pending Payments</div>
                    <div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px">${unpaid.length} awaiting payment</div>
                </div>
                <div class="stat-card" style="border-top:3px solid var(--danger)">
                    <div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div>
                    <div class="stat-value">${failed.length}</div>
                    <div class="stat-label">Failed Payments</div>
                </div>
            </div>

            <div class="filters-bar mb-2">
                <button class="filter-chip active" onclick="App.filterPayments('all', this)">All</button>
                <button class="filter-chip" onclick="App.filterPayments('completed', this)">✅ Completed</button>
                <button class="filter-chip" onclick="App.filterPayments('pending', this)">⏳ Pending</button>
                <button class="filter-chip" onclick="App.filterPayments('failed', this)">❌ Failed</button>
            </div>

            <div id="payments-table">
                ${App.renderPaymentsTable(orders)}
            </div>
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.renderPaymentsTable = function(orders) {
    if (!orders.length) return '<div class="empty-state"><h3>No payment records</h3></div>';
    return `<div class="table-container"><table>
        <thead><tr><th>Order</th><th>Amount</th><th>Method</th><th>Payment Status</th><th>Order Status</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>${orders.map(o => `<tr>
            <td style="color:var(--primary-light);font-weight:600">#${String(o.order_id).slice(0,8)}</td>
            <td style="font-weight:700">${formatPrice(o.total)}</td>
            <td><span style="text-transform:uppercase;font-size:0.8rem;font-weight:600;padding:4px 10px;border-radius:var(--radius-full);background:var(--bg-secondary)">${o.payment_method || 'N/A'}</span></td>
            <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
            <td><span class="status-badge ${o.status}">${o.status}</span></td>
            <td>${formatDate(o.created_at)}</td>
            <td>
                ${o.payment_status === 'pending' ? `<button class="btn btn-sm btn-accent" onclick="App.markPaymentComplete('${o.order_id}')" title="Mark as Paid"><i class="fas fa-check"></i></button>` : ''}
                ${o.payment_status === 'completed' ? `<button class="btn btn-sm btn-danger" onclick="App.markPaymentRefund('${o.order_id}')" title="Refund"><i class="fas fa-undo"></i></button>` : ''}
            </td>
        </tr>`).join('')}</tbody>
    </table></div>`;
};

App.filterPayments = async function(filter, btn) {
    try {
        document.querySelectorAll('.filters-bar .filter-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const data = await api.get('/accounts/admin/orders/');
        let orders = data.orders || [];
        if (filter !== 'all') orders = orders.filter(o => o.payment_status === filter);
        document.getElementById('payments-table').innerHTML = App.renderPaymentsTable(orders);
    } catch(e) {}
};

App.markPaymentComplete = async function(orderId) {
    if (!confirm('Mark this payment as completed?')) return;
    try {
        await api.post(`/orders/${orderId}/pay/`, { method: 'cod', transaction_id: 'ADMIN-VERIFIED-' + Date.now() });
        showToast('Payment marked as completed', 'success');
        this.adminPayments();
    } catch(e) { showToast(e.message || 'Failed to update payment', 'error'); }
};

App.markPaymentRefund = async function(orderId) {
    if (!confirm('Issue a refund for this order?')) return;
    showToast('Refund initiated (simulated)', 'success');
};

// ── Admin Reviews ──
App.adminReviews = async function() {
    try {
        const data = await api.get('/accounts/admin/reviews/');
        const reviews = data.reviews || [];
        document.getElementById('admin-content').innerHTML = `
            <div class="dashboard-header"><h2><i class="fas fa-star"></i> Manage Reviews</h2>
                <div style="font-size:0.85rem;color:var(--text-muted)">${reviews.length} reviews total</div>
            </div>
            ${reviews.length ? reviews.map(r => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="review-user">
                            <div class="review-avatar">${getInitials(r.user)}</div>
                            <div>
                                <strong>${r.user?.full_name || r.user?.username || 'User'}</strong>
                                <div class="review-stars" style="font-size:0.8rem;color:var(--secondary)">${renderStars(r.rating)}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span style="font-size:0.8rem;color:var(--text-muted)">${r.created_at ? timeAgo(r.created_at) : ''}</span>
                            <button class="btn btn-sm btn-danger" onclick="App.deleteReview(${r.id})"><i class="fas fa-trash"></i> Delete</button>
                        </div>
                    </div>
                    <p style="color:var(--text-secondary)">${r.comment}</p>
                    ${r.image ? `<img src="${r.image}" class="review-image" alt="Review photo">` : ''}
                </div>
            `).join('') : '<div class="empty-state"><i class="fas fa-star" style="color:var(--secondary)"></i><h3>No reviews yet</h3></div>'}
        `;
    } catch(e) { showToast(e.message, 'error'); }
};

App.deleteReview = async function(id) {
    if (!confirm('Delete this review?')) return;
    try { await api.delete(`/accounts/admin/reviews/${id}/`); showToast('Review deleted', 'success'); this.adminReviews(); } catch(e) { showToast(e.message, 'error'); }
};

// ── Admin Broadcast ──
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
    const title = document.getElementById('bc-title').value;
    const message = document.getElementById('bc-message').value;
    if (!title || !message) return showToast('Please fill in title and message', 'error');
    try {
        const data = await api.post('/notifications/broadcast/', {
            title,
            message,
            role: document.getElementById('bc-role').value,
        });
        showToast(data.message || 'Broadcast sent!', 'success');
        document.getElementById('bc-title').value = '';
        document.getElementById('bc-message').value = '';
    } catch(e) { showToast(e.message, 'error'); }
};
