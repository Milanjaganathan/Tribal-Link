/* ═══════════════════════════════════════════
   TRIBAL LINK — Main Application
   SPA Router, Page Renderers, Event Handlers
   ═══════════════════════════════════════════ */

const App = {
    currentPage: null,
    init() {
        window.addEventListener('hashchange', () => this.route());
        this.route();
        this.updateNav();
        this.loadCartCount();
    },

    navigate(page, params) {
        let hash = `#${page}`;
        if (params) hash += `/${params}`;
        window.location.hash = hash;
    },

    route() {
        const hash = window.location.hash.slice(1) || 'home';
        const parts = hash.split('/');
        const page = parts[0];
        const param = parts.slice(1).join('/');

        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        this.currentPage = page;

        const routes = {
            'home': () => this.renderHome(),
            'products': () => this.renderProducts(param),
            'product': () => this.renderProductDetail(param),
            'cart': () => this.renderCart(),
            'checkout': () => this.renderCheckout(),
            'login': () => this.renderLogin(),
            'register': () => this.renderRegister(),
            'verify-otp': () => this.renderVerifyOTP(param),
            'profile': () => this.renderProfile(),
            'orders': () => this.renderOrders(),
            'order': () => this.renderOrderDetail(param),
            'track': () => this.renderOrderTrack(param),
            'wishlist': () => this.renderWishlist(),
            'notifications': () => this.renderNotifications(),
            'seller': () => this.renderSellerDashboard(param || 'overview'),
            'admin': () => this.renderAdminDashboard(param || 'overview'),
        };

        const renderer = routes[page];
        if (renderer) renderer();
        else this.renderHome();
        
        this.updateNav();
        window.scrollTo(0, 0);
    },

    updateNav() {
        const user = TokenManager.getUser();
        const isLoggedIn = TokenManager.isLoggedIn();
        const navActions = document.getElementById('nav-actions');
        if (!navActions) return;

        let html = '';
        if (isLoggedIn && user) {
            html = `
                <button class="nav-btn" onclick="App.navigate('wishlist')" title="Wishlist"><i class="fas fa-heart"></i></button>
                <button class="nav-btn" onclick="App.navigate('cart')" title="Cart"><i class="fas fa-shopping-cart"></i><span class="badge" id="cart-badge" style="display:none">0</span></button>
                <button class="nav-btn" onclick="App.navigate('notifications')" title="Notifications"><i class="fas fa-bell"></i><span class="badge" id="notif-badge" style="display:none">0</span></button>
                <div class="nav-user" style="cursor:pointer" onclick="App.navigate(TokenManager.getRole() === 'seller' ? 'seller' : TokenManager.getRole() === 'admin' ? 'admin' : 'profile')">
                    <div class="nav-user-avatar">${getInitials(user)}</div>
                    <span style="font-size:0.85rem;font-weight:600;color:var(--text-secondary)">${user.first_name || user.username}</span>
                </div>
                <button class="nav-btn" onclick="App.logout()" title="Logout"><i class="fas fa-sign-out-alt"></i></button>`;
        } else {
            html = `
                <button class="nav-btn" onclick="App.navigate('login')"><i class="fas fa-sign-in-alt"></i><span>Login</span></button>
                <button class="btn btn-primary btn-sm" onclick="App.navigate('register')">Sign Up</button>`;
        }
        navActions.innerHTML = html;
        this.loadCartCount();
        this.loadNotifCount();
    },

    async loadCartCount() {
        if (!TokenManager.isLoggedIn()) return;
        try {
            const data = await api.get('/cart/');
            const badge = document.getElementById('cart-badge');
            if (badge) {
                badge.textContent = data.total_items || 0;
                badge.style.display = data.total_items > 0 ? 'flex' : 'none';
            }
        } catch(e) {}
    },

    async loadNotifCount() {
        if (!TokenManager.isLoggedIn()) return;
        try {
            const data = await api.get('/notifications/unread-count/');
            const badge = document.getElementById('notif-badge');
            if (badge) {
                badge.textContent = data.unread_count || 0;
                badge.style.display = data.unread_count > 0 ? 'flex' : 'none';
            }
        } catch(e) {}
    },

    async logout() {
        try { await api.post('/accounts/logout/', { refresh: TokenManager.getRefresh() }); } catch(e) {}
        TokenManager.clear();
        showToast('Logged out successfully', 'success');
        this.navigate('home');
    },

    setContent(html) {
        const main = document.getElementById('app-content');
        main.innerHTML = `<div class="page active animate-in">${html}</div>`;
    },

    // ══════════════════════════════════
    // HOME PAGE
    // ══════════════════════════════════
    async renderHome() {
        this.setContent(`
            <section class="hero">
                <div class="container">
                    <div class="hero-content">
                        <div class="hero-badge"><i class="fas fa-leaf"></i> Authentic Tribal Artisan Products</div>
                        <h1>Discover <span class="gradient-text">Tribal Treasures</span> From India's Heartland</h1>
                        <p>Connecting tribal artisans directly with discerning buyers. Every purchase supports indigenous communities and preserves traditional craftsmanship.</p>
                        <div class="hero-actions">
                            <button class="btn btn-primary btn-lg" onclick="App.navigate('products')"><i class="fas fa-store"></i> Explore Products</button>
                            <button class="btn btn-secondary btn-lg" onclick="App.navigate('register')"><i class="fas fa-handshake"></i> Become a Seller</button>
                        </div>
                        <div class="hero-stats">
                            <div class="hero-stat"><div class="value" id="stat-products">100+</div><div class="label">Products</div></div>
                            <div class="hero-stat"><div class="value" id="stat-artisans">50+</div><div class="label">Artisans</div></div>
                            <div class="hero-stat"><div class="value" id="stat-orders">500+</div><div class="label">Orders Delivered</div></div>
                        </div>
                    </div>
                </div>
                <div class="hero-shapes"><div class="shape shape-1"></div><div class="shape shape-2"></div><div class="shape shape-3"></div></div>
            </section>

            <section class="section" id="home-categories"><div class="container">
                <div class="section-header"><div class="subtitle">Browse By Category</div><h2>Explore Collections</h2><p>Discover authentic tribal products organized by heritage</p></div>
                <div class="categories-grid" id="categories-grid"><div class="loading-spinner"><div class="spinner"></div></div></div>
            </div></section>

            <section class="section" style="background: var(--bg-secondary)"><div class="container">
                <div class="section-header"><div class="subtitle">Handpicked For You</div><h2>Featured Products</h2><p>Curated selection of our finest tribal artisan products</p></div>
                <div class="products-grid" id="featured-grid"><div class="loading-spinner"><div class="spinner"></div></div></div>
            </div></section>

            <footer class="footer"><div class="container">
                <div class="footer-grid">
                    <div class="footer-brand"><h3>🏺 <span>Tribal Link</span></h3><p>Empowering tribal artisans through digital commerce. Authentic handcrafted products from India's indigenous communities.</p></div>
                    <div class="footer-col"><h4>Quick Links</h4><ul><li><a href="#products" onclick="App.navigate('products')">All Products</a></li><li><a href="#register" onclick="App.navigate('register')">Register</a></li><li><a href="#login" onclick="App.navigate('login')">Login</a></li></ul></div>
                    <div class="footer-col"><h4>For Sellers</h4><ul><li><a href="#register">Become a Seller</a></li><li><a href="#seller">Seller Dashboard</a></li></ul></div>
                    <div class="footer-col"><h4>Support</h4><ul><li><a href="#">Help Center</a></li><li><a href="#">Contact Us</a></li><li><a href="#">Privacy Policy</a></li></ul></div>
                </div>
                <div class="footer-bottom">&copy; 2026 Tribal Link. All rights reserved. Made with <i class="fas fa-heart" style="color:var(--danger)"></i> for tribal artisans.</div>
            </div></footer>
        `);

        // Load data
        try {
            const [cats, featured] = await Promise.all([
                api.get('/products/categories/'),
                api.get('/products/featured/'),
            ]);
            this.renderCategoryCards(cats);
            this.renderProductCards(featured.results || featured, 'featured-grid');
        } catch(e) { console.error(e); }
    },

    renderCategoryCards(categories) {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;
        const icons = ['🍯', '🏺', '💍', '🧶', '🎨', '🌿', '🪵', '🎭', '🧺', '📿'];
        grid.innerHTML = categories.length ? categories.map((c, i) => `
            <div class="category-card" onclick="App.navigate('products', 'category=${c.id}')">
                <span class="cat-icon">${c.icon || icons[i % icons.length]}</span>
                <h3>${c.name}</h3>
                <div class="count">${c.product_count || 0} products</div>
            </div>
        `).join('') : '<p class="text-center" style="grid-column:1/-1;color:var(--text-muted)">No categories yet</p>';
    },

    renderProductCards(products, containerId) {
        const grid = document.getElementById(containerId);
        if (!grid) return;
        grid.innerHTML = products.length ? products.map(p => `
            <div class="product-card">
                <div class="product-card-img">
                    <img src="${getProductImage(p)}" alt="${p.name}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1a1a2e/8B5CF6?text=No+Image'">
                    ${p.discount_percentage > 0 ? `<span class="discount-badge">-${p.discount_percentage}%</span>` : ''}
                    <button class="wishlist-btn" onclick="event.stopPropagation();App.toggleWishlist(${p.id})" title="Add to Wishlist"><i class="far fa-heart"></i></button>
                </div>
                <div class="product-card-body" onclick="App.navigate('product', '${p.id}')" style="cursor:pointer">
                    <div class="category-tag">${p.category_name || 'Uncategorized'}</div>
                    <h3>${p.name}</h3>
                    <div class="product-rating"><span class="stars">${renderStars(p.average_rating)}</span><span class="count">(${p.review_count || 0})</span></div>
                    <div class="product-price">
                        <span class="current">${formatPrice(p.price)}</span>
                        ${p.compare_price ? `<span class="original">${formatPrice(p.compare_price)}</span>` : ''}
                    </div>
                    <div class="seller-name"><i class="fas fa-store"></i> ${p.seller_name || 'Tribal Artisan'}</div>
                </div>
                <div class="product-card-actions">
                    <button class="btn btn-primary btn-sm" onclick="App.addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                    <button class="btn btn-secondary btn-sm" onclick="App.navigate('product', '${p.id}')"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        `).join('') : '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-box-open"></i><h3>No products found</h3><p>Check back soon for new additions!</p></div>';
    },

    // ══════════════════════════════════
    // PRODUCTS PAGE
    // ══════════════════════════════════
    async renderProducts(params) {
        const searchParams = new URLSearchParams(params || '');
        const category = searchParams.get('category');
        const search = searchParams.get('q');

        this.setContent(`
            <div class="section"><div class="container">
                <div class="section-header"><h2>${search ? `Search: "${search}"` : 'All Products'}</h2><p>Browse our collection of authentic tribal artisan products</p></div>
                <div class="filters-bar" id="filters-bar"><div class="loading-spinner"><div class="spinner"></div></div></div>
                <div class="products-grid" id="products-grid"><div class="loading-spinner"><div class="spinner"></div></div></div>
                <div id="pagination" class="mt-3 text-center"></div>
            </div></div>
        `);

        try {
            const cats = await api.get('/products/categories/');
            const filtersBar = document.getElementById('filters-bar');
            filtersBar.innerHTML = `
                <button class="filter-chip ${!category ? 'active' : ''}" onclick="App.navigate('products')">All</button>
                ${cats.map(c => `<button class="filter-chip ${category == c.id ? 'active' : ''}" onclick="App.navigate('products', 'category=${c.id}')">${c.name}</button>`).join('')}
            `;

            let url = '/products/';
            const qp = [];
            if (category) qp.push(`category=${category}`);
            if (search) qp.push(`search=${search}`);
            if (qp.length) url += '?' + qp.join('&');

            const data = await api.get(url);
            this.renderProductCards(data.results || data, 'products-grid');
        } catch(e) { console.error(e); showToast('Failed to load products', 'error'); }
    },

    // ══════════════════════════════════
    // PRODUCT DETAIL
    // ══════════════════════════════════
    async renderProductDetail(id) {
        this.setContent('<div class="loading-spinner" style="padding:100px"><div class="spinner"></div></div>');
        try {
            const p = await api.get(`/products/${id}/`);
            const imgs = [getProductImage(p), ...(p.images || []).map(img => img.image)];
            this.setContent(`
                <div class="product-detail"><div class="container">
                    <div class="product-detail-grid">
                        <div class="product-gallery">
                            <div class="main-image"><img id="main-product-img" src="${imgs[0]}" alt="${p.name}" onerror="this.src='https://placehold.co/600x450/1a1a2e/8B5CF6?text=No+Image'"></div>
                            ${imgs.length > 1 ? `<div class="thumbnails">${imgs.map((img, i) => `<div class="thumb ${i === 0 ? 'active' : ''}" onclick="document.getElementById('main-product-img').src='${img}';document.querySelectorAll('.thumb').forEach(t=>t.classList.remove('active'));this.classList.add('active')"><img src="${img}" alt=""></div>`).join('')}</div>` : ''}
                        </div>
                        <div class="product-info">
                            <div class="category-tag" style="font-size:0.85rem;margin-bottom:8px">${p.category ? p.category.name : 'Uncategorized'}</div>
                            <h1>${p.name}</h1>
                            <div class="product-meta">
                                <span class="stars" style="color:var(--secondary)">${renderStars(p.average_rating)}</span>
                                <span style="color:var(--text-muted)">${p.review_count || 0} reviews</span>
                                <span style="color:var(--text-muted)"><i class="fas fa-eye"></i> ${p.views_count || 0} views</span>
                            </div>
                            <div class="product-price" style="font-size:1.5rem">
                                <span class="current" style="font-size:2rem">${formatPrice(p.price)}</span>
                                ${p.compare_price ? `<span class="original" style="font-size:1.2rem">${formatPrice(p.compare_price)}</span><span class="discount-badge" style="position:static;font-size:0.85rem">-${p.discount_percentage}%</span>` : ''}
                            </div>
                            <p class="description">${p.description}</p>
                            <div style="margin:12px 0;color:${p.stock > 0 ? 'var(--accent)' : 'var(--danger)'};font-weight:600">
                                <i class="fas fa-${p.stock > 0 ? 'check-circle' : 'times-circle'}"></i> ${p.stock > 0 ? `In Stock (${p.stock} available)` : 'Out of Stock'}
                            </div>

                            <div class="seller-info-box">
                                <h4><i class="fas fa-store"></i> Seller Information</h4>
                                <div class="contact">
                                    <span><i class="fas fa-user"></i> ${p.seller ? (p.seller.shop_name || p.seller.full_name || p.seller.username) : 'Tribal Artisan'}</span>
                                    ${p.seller?.email ? `<span><i class="fas fa-envelope"></i> ${p.seller.email}</span>` : ''}
                                    ${p.seller?.phone ? `<span><i class="fas fa-phone"></i> ${p.seller.phone}</span>` : ''}
                                </div>
                            </div>

                            <div class="quantity-selector">
                                <button onclick="let i=document.getElementById('qty');i.value=Math.max(1,parseInt(i.value)-1)">−</button>
                                <input type="number" id="qty" value="1" min="1" max="${p.stock}">
                                <button onclick="let i=document.getElementById('qty');i.value=Math.min(${p.stock},parseInt(i.value)+1)">+</button>
                            </div>
                            <div class="flex gap-2 mt-2">
                                <button class="btn btn-primary btn-lg" onclick="App.addToCart(${p.id}, parseInt(document.getElementById('qty').value))" ${p.stock < 1 ? 'disabled' : ''}><i class="fas fa-cart-plus"></i> Add to Cart</button>
                                <button class="btn btn-accent btn-lg" onclick="App.buyNow(${p.id}, parseInt(document.getElementById('qty').value))" ${p.stock < 1 ? 'disabled' : ''}><i class="fas fa-bolt"></i> Buy Now</button>
                                <button class="btn btn-secondary btn-lg" onclick="App.toggleWishlist(${p.id})"><i class="far fa-heart"></i></button>
                            </div>
                        </div>
                    </div>

                    <div class="section" style="padding:40px 0">
                        <h2 style="margin-bottom:24px">Customer Reviews (${p.review_count || 0})</h2>
                        ${TokenManager.isLoggedIn() ? `
                        <div class="review-card mb-3">
                            <h4>Write a Review</h4>
                            <div class="mt-2 mb-2" id="review-stars-input" style="font-size:1.5rem;cursor:pointer;color:var(--text-muted)">
                                ${[1,2,3,4,5].map(i => `<i class="far fa-star" data-rating="${i}" onmouseover="App.hoverStars(${i})" onmouseout="App.resetStars()" onclick="App.selectRating(${i})"></i>`).join('')}
                            </div>
                            <input type="hidden" id="review-rating" value="0">
                            <div class="form-group"><textarea class="form-control" id="review-comment" placeholder="Share your experience..." rows="3"></textarea></div>
                            <button class="btn btn-primary btn-sm" onclick="App.submitReview(${p.id})"><i class="fas fa-paper-plane"></i> Submit Review</button>
                        </div>` : '<p class="mb-3" style="color:var(--text-muted)"><a href="#login" onclick="App.navigate(\'login\')">Login</a> to write a review</p>'}
                        <div id="reviews-list">
                            ${(p.reviews || []).map(r => `
                                <div class="review-card">
                                    <div class="review-header">
                                        <div class="review-user">
                                            <div class="review-avatar">${getInitials(r.user)}</div>
                                            <div><strong>${r.user?.full_name || r.user?.username || 'User'}</strong><div class="review-stars" style="font-size:0.8rem">${renderStars(r.rating)}</div></div>
                                        </div>
                                        <span style="color:var(--text-muted);font-size:0.8rem">${timeAgo(r.created_at)}</span>
                                    </div>
                                    <p style="color:var(--text-secondary)">${r.comment}</p>
                                    ${r.image ? `<img src="${r.image}" class="review-image" alt="Review photo">` : ''}
                                </div>
                            `).join('') || '<p style="color:var(--text-muted)">No reviews yet. Be the first to review!</p>'}
                        </div>
                    </div>
                </div></div>
            `);
        } catch(e) { this.setContent('<div class="empty-state"><h3>Product not found</h3></div>'); }
    },

    selectedRating: 0,
    hoverStars(n) { document.querySelectorAll('#review-stars-input i').forEach((s, i) => { s.className = i < n ? 'fas fa-star' : 'far fa-star'; s.style.color = i < n ? 'var(--secondary)' : 'var(--text-muted)'; }); },
    resetStars() { const r = this.selectedRating; this.hoverStars(r); },
    selectRating(n) { this.selectedRating = n; document.getElementById('review-rating').value = n; this.hoverStars(n); },
    async submitReview(productId) {
        const rating = parseInt(document.getElementById('review-rating').value);
        const comment = document.getElementById('review-comment').value.trim();
        if (!rating) return showToast('Please select a rating', 'error');
        if (!comment) return showToast('Please write a comment', 'error');
        try {
            await api.post(`/products/${productId}/reviews/`, { rating, comment });
            showToast('Review submitted!', 'success');
            this.renderProductDetail(productId);
        } catch(e) { showToast(e.message, 'error'); }
    },

    // ══════════════════════════════════
    // CART & WISHLIST
    // ══════════════════════════════════
    async addToCart(productId, quantity = 1) {
        if (!TokenManager.isLoggedIn()) return this.navigate('login');
        try {
            await api.post('/cart/', { product: productId, quantity });
            showToast('Added to cart!', 'success');
            this.loadCartCount();
        } catch(e) { showToast(e.message, 'error'); }
    },

    async buyNow(productId, quantity = 1) {
        if (!TokenManager.isLoggedIn()) return this.navigate('login');
        await this.addToCart(productId, quantity);
        this.navigate('checkout');
    },

    async toggleWishlist(productId) {
        if (!TokenManager.isLoggedIn()) return this.navigate('login');
        try {
            await api.post('/wishlist/', { product: productId });
            showToast('Added to wishlist!', 'success');
        } catch(e) { showToast('Already in wishlist or error', 'info'); }
    },

    async renderCart() {
        if (!TokenManager.isLoggedIn()) return this.navigate('login');
        this.setContent('<div class="loading-spinner" style="padding:100px"><div class="spinner"></div></div>');
        try {
            const data = await api.get('/cart/');
            const items = data.items || [];
            this.setContent(`
                <div class="cart-page"><div class="container">
                    <h2 style="margin-bottom:24px"><i class="fas fa-shopping-cart"></i> Shopping Cart (${items.length} items)</h2>
                    ${items.length ? `<div class="cart-grid">
                        <div id="cart-items">${items.map(item => `
                            <div class="cart-item" id="cart-item-${item.id}">
                                <div class="cart-item-img"><img src="${getProductImage(item.product_detail || item)}" alt="" onerror="this.src='https://placehold.co/100x100/1a1a2e/8B5CF6?text=No+Image'"></div>
                                <div class="cart-item-info">
                                    <h3>${item.product_name || item.product_detail?.name || 'Product'}</h3>
                                    <div class="price">${formatPrice(item.product_price || item.product_detail?.price || 0)}</div>
                                    <div class="quantity-selector mt-1" style="margin:8px 0">
                                        <button onclick="App.updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
                                        <input type="number" value="${item.quantity}" min="1" readonly style="width:50px">
                                        <button onclick="App.updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
                                    </div>
                                    <div style="font-weight:700;color:var(--accent)">Subtotal: ${formatPrice(item.subtotal || (item.product_detail?.price * item.quantity))}</div>
                                </div>
                                <button class="btn btn-danger btn-sm" onclick="App.removeCartItem(${item.id})" style="align-self:start"><i class="fas fa-trash"></i></button>
                            </div>
                        `).join('')}</div>
                        <div class="cart-summary">
                            <h3>Order Summary</h3>
                            <div class="summary-row"><span>Subtotal</span><span>${formatPrice(data.total_price)}</span></div>
                            <div class="summary-row"><span>Shipping</span><span style="color:var(--accent)">Free</span></div>
                            <div class="summary-row total"><span>Total</span><span class="amount">${formatPrice(data.total_price)}</span></div>
                            <button class="btn btn-primary btn-block btn-lg mt-2" onclick="App.navigate('checkout')"><i class="fas fa-lock"></i> Proceed to Checkout</button>
                            <button class="btn btn-secondary btn-block mt-1" onclick="App.navigate('products')"><i class="fas fa-arrow-left"></i> Continue Shopping</button>
                        </div>
                    </div>` : `<div class="empty-state"><i class="fas fa-shopping-cart"></i><h3>Your cart is empty</h3><p>Explore products and add items to your cart</p><button class="btn btn-primary" onclick="App.navigate('products')">Browse Products</button></div>`}
                </div></div>
            `);
        } catch(e) { showToast('Failed to load cart', 'error'); }
    },

    async updateCartItem(itemId, qty) {
        if (qty < 1) return this.removeCartItem(itemId);
        try { await api.patch(`/cart/${itemId}/`, { quantity: qty }); this.renderCart(); } catch(e) { showToast(e.message, 'error'); }
    },

    async removeCartItem(itemId) {
        try { await api.delete(`/cart/${itemId}/`); showToast('Item removed', 'success'); this.renderCart(); this.loadCartCount(); } catch(e) { showToast(e.message, 'error'); }
    },

    async renderWishlist() {
        if (!TokenManager.isLoggedIn()) return this.navigate('login');
        this.setContent('<div class="loading-spinner" style="padding:100px"><div class="spinner"></div></div>');
        try {
            const data = await api.get('/wishlist/');
            const items = data.results || data;
            this.setContent(`
                <div class="section"><div class="container">
                    <h2 style="margin-bottom:24px"><i class="fas fa-heart"></i> My Wishlist</h2>
                    ${items.length ? `<div class="products-grid">${items.map(item => {
                        const p = item.product_detail || item;
                        return `<div class="product-card">
                            <div class="product-card-img"><img src="${getProductImage(p)}" alt="${p.name || ''}" loading="lazy" onerror="this.src='https://placehold.co/400x300/1a1a2e/8B5CF6?text=No+Image'"></div>
                            <div class="product-card-body" onclick="App.navigate('product','${p.id}')" style="cursor:pointer"><h3>${p.name || 'Product'}</h3><div class="product-price"><span class="current">${formatPrice(p.price || 0)}</span></div></div>
                            <div class="product-card-actions">
                                <button class="btn btn-primary btn-sm" onclick="App.addToCart(${p.id})"><i class="fas fa-cart-plus"></i> Add to Cart</button>
                                <button class="btn btn-danger btn-sm" onclick="App.removeWishlistItem(${item.id})"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>`;
                    }).join('')}</div>` : '<div class="empty-state"><i class="fas fa-heart"></i><h3>Wishlist is empty</h3><p>Save products you love</p><button class="btn btn-primary" onclick="App.navigate(\'products\')">Browse Products</button></div>'}
                </div></div>
            `);
        } catch(e) { showToast('Failed to load wishlist', 'error'); }
    },

    async removeWishlistItem(id) {
        try { await api.delete(`/wishlist/${id}/`); showToast('Removed from wishlist', 'success'); this.renderWishlist(); } catch(e) { showToast(e.message, 'error'); }
    },
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
