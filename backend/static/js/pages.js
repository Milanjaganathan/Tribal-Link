/* ═══════════════════════════════════════════
   TRIBAL LINK — Auth, Checkout & Dashboards
   ═══════════════════════════════════════════ */

// ══════════════════════════════════
// AUTH PAGES
// ══════════════════════════════════
App.renderLogin = function() {
    if (TokenManager.isLoggedIn()) return this.navigate('profile');
    this.setContent(`
        <div class="auth-page"><div class="auth-card">
            <h2>Welcome Back</h2>
            <p class="subtitle">Sign in to your TribalLink account</p>
            <form id="login-form" onsubmit="App.handleLogin(event)">
                <div class="form-group"><label>Email</label><input type="email" class="form-control" id="login-email" placeholder="your@email.com" required></div>
                <div class="form-group"><label>Password</label><input type="password" class="form-control" id="login-password" placeholder="Enter your password" required></div>
                <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn"><i class="fas fa-sign-in-alt"></i> Sign In</button>
            </form>
            <div class="auth-footer">Don't have an account? <a href="#register" onclick="App.navigate('register')">Sign up here</a></div>
        </div></div>
    `);
};

App.handleLogin = async function(e) {
    e.preventDefault();
    const btn = document.getElementById('login-btn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div>';
    try {
        const data = await api.post('/accounts/login/', {
            email: document.getElementById('login-email').value,
            password: document.getElementById('login-password').value,
        });
        TokenManager.set(data);
        showToast('Login successful!', 'success');
        const role = data.user?.role;
        if (role === 'admin') this.navigate('admin');
        else if (role === 'seller') this.navigate('seller');
        else this.navigate('home');
    } catch(e) { showToast(e.message || 'Login failed', 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In'; }
};

App.renderRegister = function() {
    if (TokenManager.isLoggedIn()) return this.navigate('profile');
    this.setContent(`
        <div class="auth-page"><div class="auth-card" style="max-width:540px">
            <h2>Create Account</h2>
            <p class="subtitle">Join TribalLink — buy or sell authentic tribal products</p>
            <div class="role-selector">
                <button class="role-option active" onclick="App.selectRegRole('customer', this)"><i class="fas fa-user"></i><br>Customer</button>
                <button class="role-option" onclick="App.selectRegRole('seller', this)"><i class="fas fa-store"></i><br>Seller</button>
            </div>
            <form id="register-form" onsubmit="App.handleRegister(event)">
                <input type="hidden" id="reg-role" value="customer">
                <div class="grid-2 gap-2">
                    <div class="form-group"><label>First Name</label><input type="text" class="form-control" id="reg-fname" required></div>
                    <div class="form-group"><label>Last Name</label><input type="text" class="form-control" id="reg-lname" required></div>
                </div>
                <div class="form-group"><label>Username</label><input type="text" class="form-control" id="reg-username" required></div>
                <div class="form-group"><label>Email</label><input type="email" class="form-control" id="reg-email" required></div>
                <div class="form-group"><label>Phone</label><input type="tel" class="form-control" id="reg-phone"></div>
                <div id="seller-fields" class="hidden">
                    <div class="form-group"><label>Shop Name</label><input type="text" class="form-control" id="reg-shopname"></div>
                    <div class="form-group"><label>Shop Description</label><textarea class="form-control" id="reg-shopdesc" rows="2"></textarea></div>
                </div>
                <div class="grid-2 gap-2">
                    <div class="form-group"><label>Password</label><input type="password" class="form-control" id="reg-password" required minlength="8"></div>
                    <div class="form-group"><label>Confirm Password</label><input type="password" class="form-control" id="reg-password2" required></div>
                </div>
                <button type="submit" class="btn btn-primary btn-block btn-lg" id="reg-btn"><i class="fas fa-user-plus"></i> Create Account</button>
            </form>
            <div class="auth-footer">Already have an account? <a href="#login" onclick="App.navigate('login')">Sign in</a></div>
        </div></div>
    `);
};

App.selectRegRole = function(role, el) {
    document.getElementById('reg-role').value = role;
    document.querySelectorAll('.role-option').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('seller-fields').classList.toggle('hidden', role !== 'seller');
};

App.handleRegister = async function(e) {
    e.preventDefault();
    const pw = document.getElementById('reg-password').value;
    if (pw !== document.getElementById('reg-password2').value) return showToast('Passwords do not match', 'error');
    const btn = document.getElementById('reg-btn');
    btn.disabled = true;
    try {
        const body = {
            first_name: document.getElementById('reg-fname').value,
            last_name: document.getElementById('reg-lname').value,
            username: document.getElementById('reg-username').value,
            email: document.getElementById('reg-email').value,
            phone: document.getElementById('reg-phone').value,
            role: document.getElementById('reg-role').value,
            password: pw, password2: pw,
            shop_name: document.getElementById('reg-shopname')?.value || '',
            shop_description: document.getElementById('reg-shopdesc')?.value || '',
        };
        const data = await api.post('/accounts/register/', body);
        TokenManager.set(data);
        showToast('Registration successful! Please verify your email.', 'success');
        if (data.debug_otp) showToast(`Dev OTP: ${data.debug_otp}`, 'info');
        this.navigate('verify-otp', data.user.email);
    } catch(e) { showToast(e.message, 'error'); btn.disabled = false; }
};

App.renderVerifyOTP = function(email) {
    this.setContent(`
        <div class="auth-page"><div class="auth-card">
            <h2>Verify Email</h2>
            <p class="subtitle">Enter the 6-digit OTP sent to<br><strong>${email || 'your email'}</strong></p>
            <div class="otp-inputs">
                ${[1,2,3,4,5,6].map(i => `<input type="text" maxlength="1" id="otp-${i}" oninput="if(this.value.length===1)document.getElementById('otp-${i+1}')?.focus()" onkeydown="if(event.key==='Backspace'&&!this.value)document.getElementById('otp-${i-1}')?.focus()">`).join('')}
            </div>
            <button class="btn btn-primary btn-block btn-lg" onclick="App.handleVerifyOTP('${email}')"><i class="fas fa-check-circle"></i> Verify Email</button>
            <div class="auth-footer mt-2"><a href="#" onclick="App.resendOTP('${email}')">Resend OTP</a> | <a href="#home" onclick="App.navigate('home')">Skip for now</a></div>
        </div></div>
    `);
    document.getElementById('otp-1')?.focus();
};

App.handleVerifyOTP = async function(email) {
    const otp = [1,2,3,4,5,6].map(i => document.getElementById(`otp-${i}`).value).join('');
    if (otp.length !== 6) return showToast('Please enter the complete OTP', 'error');
    try {
        await api.post('/accounts/verify-otp/', { email, otp });
        showToast('Email verified successfully!', 'success');
        this.navigate('home');
    } catch(e) { showToast(e.message, 'error'); }
};

App.resendOTP = async function(email) {
    try {
        const data = await api.post('/accounts/resend-otp/', { email });
        showToast('OTP resent!', 'success');
        if (data.debug_otp) showToast(`Dev OTP: ${data.debug_otp}`, 'info');
    } catch(e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════
// PROFILE
// ══════════════════════════════════
App.renderProfile = async function() {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    const user = TokenManager.getUser();
    this.setContent(`
        <div class="section"><div class="container" style="max-width:800px">
            <h2 style="margin-bottom:24px"><i class="fas fa-user-circle"></i> My Profile</h2>
            <div class="auth-card" style="max-width:100%">
                <form onsubmit="App.updateProfile(event)">
                    <div class="grid-2 gap-2"><div class="form-group"><label>First Name</label><input class="form-control" id="prof-fname" value="${user.first_name || ''}"></div>
                    <div class="form-group"><label>Last Name</label><input class="form-control" id="prof-lname" value="${user.last_name || ''}"></div></div>
                    <div class="form-group"><label>Phone</label><input class="form-control" id="prof-phone" value="${user.phone || ''}"></div>
                    <div class="form-group"><label>Address</label><textarea class="form-control" id="prof-address" rows="2">${user.address || ''}</textarea></div>
                    <div class="grid-2 gap-2"><div class="form-group"><label>City</label><input class="form-control" id="prof-city" value="${user.city || ''}"></div>
                    <div class="form-group"><label>State</label><input class="form-control" id="prof-state" value="${user.state || ''}"></div></div>
                    <div class="form-group"><label>Pincode</label><input class="form-control" id="prof-pin" value="${user.pincode || ''}" style="max-width:200px"></div>
                    <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Save Changes</button>
                </form>
            </div>
            <div class="flex gap-2 mt-3">
                <button class="btn btn-secondary" onclick="App.navigate('orders')"><i class="fas fa-box"></i> My Orders</button>
                <button class="btn btn-secondary" onclick="App.navigate('wishlist')"><i class="fas fa-heart"></i> Wishlist</button>
                <button class="btn btn-secondary" onclick="App.navigate('notifications')"><i class="fas fa-bell"></i> Notifications</button>
            </div>
        </div></div>
    `);
};

App.updateProfile = async function(e) {
    e.preventDefault();
    try {
        const data = await api.put('/accounts/profile/', {
            first_name: document.getElementById('prof-fname').value,
            last_name: document.getElementById('prof-lname').value,
            phone: document.getElementById('prof-phone').value,
            address: document.getElementById('prof-address').value,
            city: document.getElementById('prof-city').value,
            state: document.getElementById('prof-state').value,
            pincode: document.getElementById('prof-pin').value,
        });
        TokenManager.set({ user: data });
        showToast('Profile updated!', 'success');
    } catch(e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════
// CHECKOUT
// ══════════════════════════════════
App.renderCheckout = async function() {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    const user = TokenManager.getUser();
    let cartData;
    try { cartData = await api.get('/cart/'); } catch(e) { return this.navigate('cart'); }
    if (!cartData.items?.length) return this.navigate('cart');

    this.setContent(`
        <div class="section"><div class="container" style="max-width:900px">
            <h2 style="margin-bottom:24px"><i class="fas fa-lock"></i> Checkout</h2>
            <div class="cart-grid" style="grid-template-columns:1fr 360px">
                <div>
                    <div class="auth-card" style="max-width:100%;margin-bottom:20px">
                        <h3><i class="fas fa-truck"></i> Shipping Address</h3>
                        <div class="grid-2 gap-2 mt-2">
                            <div class="form-group"><label>Full Name</label><input class="form-control" id="ship-name" value="${user.full_name || user.first_name + ' ' + user.last_name}" required></div>
                            <div class="form-group"><label>Phone</label><input class="form-control" id="ship-phone" value="${user.phone || ''}" required></div>
                        </div>
                        <div class="form-group"><label>Address</label><textarea class="form-control" id="ship-address" rows="2" required>${user.address || ''}</textarea></div>
                        <div class="grid-2 gap-2">
                            <div class="form-group"><label>City</label><input class="form-control" id="ship-city" value="${user.city || ''}" required></div>
                            <div class="form-group"><label>State</label><input class="form-control" id="ship-state" value="${user.state || ''}" required></div>
                        </div>
                        <div class="form-group"><label>Pincode</label><input class="form-control" id="ship-pin" value="${user.pincode || ''}" required style="max-width:200px"></div>
                    </div>
                    <div class="auth-card" style="max-width:100%">
                        <h3><i class="fas fa-credit-card"></i> Payment Method</h3>
                        <div class="payment-methods">
                            <div class="payment-method selected" onclick="App.selectPayment('cod',this)"><input type="radio" name="pay" value="cod" checked><div class="method-icon">💵</div><div><h4>Cash on Delivery</h4><p>Pay when order arrives</p></div></div>
                            <div class="payment-method" onclick="App.selectPayment('upi',this)"><input type="radio" name="pay" value="upi"><div class="method-icon">📱</div><div><h4>UPI Payment</h4><p>Pay via UPI ID / QR Code</p></div></div>
                        </div>
                        <div id="upi-details" class="hidden">
                            <div class="upi-qr-section"><div style="font-size:3rem">📱</div><p class="upi-id">triballink@upi</p><p style="font-size:0.8rem;color:#666;margin-top:8px">Scan or use UPI ID to pay</p></div>
                            <div class="form-group mt-2"><label>Your UPI ID (for verification)</label><input class="form-control" id="upi-id" placeholder="yourname@upi" style="background:var(--bg-input)"></div>
                        </div>
                    </div>
                </div>
                <div class="cart-summary">
                    <h3>Order Summary</h3>
                    ${cartData.items.map(i => `<div class="summary-row"><span>${(i.product_name || i.product_detail?.name || 'Item')} x${i.quantity}</span><span>${formatPrice(i.subtotal || 0)}</span></div>`).join('')}
                    <div class="summary-row total"><span>Total</span><span class="amount">${formatPrice(cartData.total_price)}</span></div>
                    <button class="btn btn-accent btn-block btn-lg mt-2" onclick="App.placeOrder()" id="place-order-btn"><i class="fas fa-check-circle"></i> Place Order</button>
                </div>
            </div>
        </div></div>
    `);
};

App.selectedPayment = 'cod';
App.selectPayment = function(method, el) {
    this.selectedPayment = method;
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
    el.classList.add('selected');
    el.querySelector('input[type=radio]').checked = true;
    document.getElementById('upi-details')?.classList.toggle('hidden', method !== 'upi');
};

App.placeOrder = async function() {
    const btn = document.getElementById('place-order-btn');
    btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Processing...';
    try {
        const order = await api.post('/orders/create/', {
            payment_method: this.selectedPayment,
            shipping_name: document.getElementById('ship-name').value,
            shipping_phone: document.getElementById('ship-phone').value,
            shipping_address: document.getElementById('ship-address').value,
            shipping_city: document.getElementById('ship-city').value,
            shipping_state: document.getElementById('ship-state').value,
            shipping_pincode: document.getElementById('ship-pin').value,
        });

        // Process UPI payment if selected
        if (this.selectedPayment === 'upi') {
            const upiId = document.getElementById('upi-id')?.value || '';
            await api.post(`/orders/${order.order_id}/pay/`, { method: 'upi', upi_id: upiId || 'user@upi' });
        }

        showToast('Order placed successfully!', 'success');
        this.loadCartCount();
        this.navigate('order', order.order_id);
    } catch(e) { showToast(e.message, 'error'); btn.disabled = false; btn.innerHTML = '<i class="fas fa-check-circle"></i> Place Order'; }
};

// ══════════════════════════════════
// ORDERS
// ══════════════════════════════════
App.renderOrders = async function() {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    this.setContent('<div class="loading-spinner" style="padding:100px"><div class="spinner"></div></div>');
    try {
        const data = await api.get('/orders/');
        const orders = data.results || data;
        this.setContent(`
            <div class="section"><div class="container">
                <h2 style="margin-bottom:24px"><i class="fas fa-box"></i> My Orders</h2>
                ${orders.length ? `<div class="table-container"><table>
                    <thead><tr><th>Order ID</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
                    <tbody>${orders.map(o => `<tr>
                        <td style="font-weight:600;color:var(--primary-light)">#${String(o.order_id).slice(0,8)}</td>
                        <td>${formatDate(o.created_at)}</td><td>${o.items_count} item(s)</td>
                        <td style="font-weight:700;color:var(--accent)">${formatPrice(o.total)}</td>
                        <td><span class="status-badge ${o.status}">${o.status}</span></td>
                        <td><span class="status-badge ${o.payment_status}">${o.payment_status}</span></td>
                        <td><button class="btn btn-sm btn-secondary" onclick="App.navigate('order','${o.order_id}')"><i class="fas fa-eye"></i></button>
                            <button class="btn btn-sm btn-primary" onclick="App.navigate('track','${o.order_id}')"><i class="fas fa-map-marker-alt"></i></button>
                            ${o.status === 'pending' || o.status === 'confirmed' ? `<button class="btn btn-sm btn-danger" onclick="App.cancelOrder('${o.order_id}')"><i class="fas fa-times"></i></button>` : ''}
                        </td>
                    </tr>`).join('')}</tbody>
                </table></div>` : '<div class="empty-state"><i class="fas fa-box-open"></i><h3>No orders yet</h3><p>Start shopping to see your orders here</p><button class="btn btn-primary" onclick="App.navigate(\'products\')">Browse Products</button></div>'}
            </div></div>
        `);
    } catch(e) { showToast('Failed to load orders', 'error'); }
};

App.renderOrderDetail = async function(orderId) {
    try {
        const o = await api.get(`/orders/${orderId}/`);
        this.setContent(`
            <div class="section"><div class="container" style="max-width:900px">
                <div class="flex justify-between items-center mb-3">
                    <h2><i class="fas fa-box"></i> Order #${String(o.order_id).slice(0,8)}</h2>
                    <button class="btn btn-primary btn-sm" onclick="App.navigate('track','${o.order_id}')"><i class="fas fa-map-marker-alt"></i> Track Order</button>
                </div>
                <div class="grid-2 gap-3">
                    <div class="stat-card"><div class="stat-label">Status</div><span class="status-badge ${o.status}" style="font-size:1rem;margin-top:8px">${o.status}</span></div>
                    <div class="stat-card"><div class="stat-label">Payment</div><span class="status-badge ${o.payment_status}" style="font-size:1rem;margin-top:8px">${o.payment_status} (${o.payment_method})</span></div>
                </div>
                <div class="table-container mt-3"><table>
                    <thead><tr><th>Product</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead>
                    <tbody>${(o.items||[]).map(i => `<tr>
                        <td class="flex items-center gap-2"><img src="${i.product_image || 'https://placehold.co/50x50/1a1a2e/8B5CF6?text=P'}" style="width:50px;height:50px;border-radius:8px;object-fit:cover" onerror="this.src='https://placehold.co/50x50/1a1a2e/8B5CF6?text=P'">${i.product_name}</td>
                        <td>${formatPrice(i.product_price)}</td><td>${i.quantity}</td><td style="font-weight:700">${formatPrice(i.subtotal)}</td>
                    </tr>`).join('')}</tbody>
                </table></div>
                <div class="cart-summary mt-3" style="max-width:400px;margin-left:auto">
                    <div class="summary-row"><span>Subtotal</span><span>${formatPrice(o.subtotal)}</span></div>
                    <div class="summary-row"><span>Shipping</span><span>${formatPrice(o.shipping_cost)}</span></div>
                    <div class="summary-row total"><span>Total</span><span class="amount">${formatPrice(o.total)}</span></div>
                </div>
                <div class="auth-card mt-3" style="max-width:100%">
                    <h4><i class="fas fa-truck"></i> Shipping To</h4>
                    <p style="color:var(--text-secondary);margin-top:8px">${o.shipping_name}<br>${o.shipping_address}<br>${o.shipping_city}, ${o.shipping_state} - ${o.shipping_pincode}<br>📞 ${o.shipping_phone}</p>
                </div>
            </div></div>
        `);
    } catch(e) { showToast('Order not found', 'error'); this.navigate('orders'); }
};

App.renderOrderTrack = async function(orderId) {
    try {
        const t = await api.get(`/orders/${orderId}/track/`);
        this.setContent(`
            <div class="section"><div class="container" style="max-width:700px">
                <h2 style="margin-bottom:8px"><i class="fas fa-map-marker-alt"></i> Track Order</h2>
                <p style="color:var(--text-muted);margin-bottom:32px">Order #${String(t.order_id).slice(0,8)} • Total: ${formatPrice(t.total)} • ${t.payment_method?.toUpperCase()}</p>
                <div class="stat-card mb-3 text-center"><div class="stat-label">Current Status</div><span class="status-badge ${t.current_status}" style="font-size:1.2rem;margin-top:8px;padding:8px 20px">${t.current_status}</span></div>
                <div class="tracking-timeline">
                    ${(t.timeline||[]).map(step => `
                        <div class="timeline-step ${step.completed ? 'completed' : ''}">
                            <div class="step-dot"><i class="fas ${step.icon || 'fa-circle'}"></i></div>
                            <h4>${step.status}</h4>
                            <div class="step-time">${step.timestamp ? formatDateTime(step.timestamp) : 'Pending'}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2 mt-3"><button class="btn btn-secondary" onclick="App.navigate('order','${orderId}')"><i class="fas fa-eye"></i> Order Details</button><button class="btn btn-secondary" onclick="App.navigate('orders')"><i class="fas fa-arrow-left"></i> All Orders</button></div>
            </div></div>
        `);
    } catch(e) { showToast('Tracking not available', 'error'); }
};

App.cancelOrder = async function(orderId) {
    if (!confirm('Cancel this order?')) return;
    try { await api.post(`/orders/${orderId}/cancel/`); showToast('Order cancelled', 'success'); this.renderOrders(); } catch(e) { showToast(e.message, 'error'); }
};

// ══════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════
App.renderNotifications = async function() {
    if (!TokenManager.isLoggedIn()) return this.navigate('login');
    try {
        const data = await api.get('/notifications/');
        const notifs = data.results || data;
        this.setContent(`
            <div class="section"><div class="container" style="max-width:800px">
                <div class="flex justify-between items-center mb-3">
                    <h2><i class="fas fa-bell"></i> Notifications</h2>
                    <button class="btn btn-sm btn-secondary" onclick="App.markAllRead()"><i class="fas fa-check-double"></i> Mark all read</button>
                </div>
                <div class="table-container">
                    ${notifs.length ? notifs.map(n => `
                        <div class="notification-item ${n.is_read ? '' : 'unread'}" onclick="App.markNotifRead(${n.id})">
                            <div class="notification-icon" style="background:var(--bg-secondary)"><i class="fas fa-bell" style="color:var(--primary-light)"></i></div>
                            <div class="notification-content"><h4>${n.title}</h4><p>${n.message}</p></div>
                            <div class="notification-time">${timeAgo(n.created_at)}</div>
                        </div>
                    `).join('') : '<div class="empty-state"><i class="fas fa-bell-slash"></i><h3>No notifications</h3></div>'}
                </div>
            </div></div>
        `);
    } catch(e) { showToast('Failed to load notifications', 'error'); }
};

App.markNotifRead = async function(id) { try { await api.post(`/notifications/${id}/read/`); this.loadNotifCount(); } catch(e) {} };
App.markAllRead = async function() { try { await api.post('/notifications/mark-all-read/'); showToast('All marked as read', 'success'); this.loadNotifCount(); this.renderNotifications(); } catch(e) {} };

// ══════════════════════════════════
// SEARCH
// ══════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && searchInput.value.trim()) {
                App.navigate('products', `q=${encodeURIComponent(searchInput.value.trim())}`);
            }
        });
    }
});
