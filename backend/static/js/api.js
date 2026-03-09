/**
 * TribalLink API Integration Layer
 * Connects the frontend HTML/JS to the Django REST API backend.
 */

const API_BASE = 'http://127.0.0.1:8000/api';

// ─── Token Management ───
const TokenManager = {
    getAccess: () => localStorage.getItem('tl_access_token'),
    getRefresh: () => localStorage.getItem('tl_refresh_token'),
    getUser: () => JSON.parse(localStorage.getItem('tl_user') || 'null'),
    
    save(data) {
        if (data.access) localStorage.setItem('tl_access_token', data.access);
        if (data.refresh) localStorage.setItem('tl_refresh_token', data.refresh);
        if (data.user) localStorage.setItem('tl_user', JSON.stringify(data.user));
    },
    
    clear() {
        localStorage.removeItem('tl_access_token');
        localStorage.removeItem('tl_refresh_token');
        localStorage.removeItem('tl_user');
    },
    
    isLoggedIn() { return !!this.getAccess(); },

    async refresh() {
        const refreshToken = this.getRefresh();
        if (!refreshToken) return false;
        try {
            const res = await fetch(`${API_BASE}/accounts/token/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken }),
            });
            if (!res.ok) { this.clear(); return false; }
            const data = await res.json();
            this.save(data);
            return true;
        } catch { this.clear(); return false; }
    }
};

// ─── Fetch Wrapper with Auth ───
async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const token = TokenManager.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Remove Content-Type for FormData
    if (options.body instanceof FormData) delete headers['Content-Type'];
    
    let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    
    // Auto-refresh on 401
    if (res.status === 401 && TokenManager.getRefresh()) {
        const refreshed = await TokenManager.refresh();
        if (refreshed) {
            headers['Authorization'] = `Bearer ${TokenManager.getAccess()}`;
            res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
        }
    }
    return res;
}

// ─── Auth API ───
const AuthAPI = {
    async register(data) {
        const res = await fetch(`${API_BASE}/accounts/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (res.ok && json.tokens) TokenManager.save({ ...json.tokens, user: json.user });
        return { ok: res.ok, data: json };
    },
    
    async login(email, password) {
        const res = await fetch(`${API_BASE}/accounts/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const json = await res.json();
        if (res.ok) TokenManager.save({ access: json.access, refresh: json.refresh, user: json.user });
        return { ok: res.ok, data: json };
    },
    
    async logout() {
        await apiFetch('/accounts/logout/', {
            method: 'POST',
            body: JSON.stringify({ refresh: TokenManager.getRefresh() }),
        });
        TokenManager.clear();
    },
    
    async getProfile() {
        const res = await apiFetch('/accounts/profile/');
        return res.ok ? await res.json() : null;
    }
};

// ─── Products API ───
const ProductsAPI = {
    async list(params = {}) {
        const query = new URLSearchParams(params).toString();
        const res = await apiFetch(`/products/?${query}`);
        return res.ok ? await res.json() : { results: [] };
    },
    
    async detail(id) {
        const res = await apiFetch(`/products/${id}/`);
        return res.ok ? await res.json() : null;
    },
    
    async categories() {
        const res = await apiFetch('/products/categories/');
        return res.ok ? await res.json() : [];
    },
    
    async featured() {
        const res = await apiFetch('/products/featured/');
        return res.ok ? await res.json() : [];
    },
    
    async sellerAdd(formData) {
        const res = await apiFetch('/products/seller/', {
            method: 'POST', body: formData,
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async sellerList() {
        const res = await apiFetch('/products/seller/');
        return res.ok ? await res.json() : { results: [] };
    }
};

// ─── Cart API ───
const CartAPI = {
    async list() {
        const res = await apiFetch('/cart/');
        return res.ok ? await res.json() : { items: [], total_items: 0, total_price: '0' };
    },
    
    async add(productId, quantity = 1) {
        const res = await apiFetch('/cart/', {
            method: 'POST',
            body: JSON.stringify({ product: productId, quantity }),
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async update(cartItemId, quantity) {
        const res = await apiFetch(`/cart/${cartItemId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity }),
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async remove(cartItemId) {
        const res = await apiFetch(`/cart/${cartItemId}/`, { method: 'DELETE' });
        return res.ok;
    },
    
    async clear() {
        const res = await apiFetch('/cart/clear/', { method: 'DELETE' });
        return res.ok;
    }
};

// ─── Wishlist API ───
const WishlistAPI = {
    async list() {
        const res = await apiFetch('/wishlist/');
        return res.ok ? await res.json() : { results: [] };
    },
    
    async add(productId) {
        const res = await apiFetch('/wishlist/', {
            method: 'POST',
            body: JSON.stringify({ product: productId }),
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async remove(wishlistItemId) {
        const res = await apiFetch(`/wishlist/${wishlistItemId}/`, { method: 'DELETE' });
        return res.ok;
    }
};

// ─── Orders API ───
const OrdersAPI = {
    async create(orderData) {
        const res = await apiFetch('/orders/create/', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async list() {
        const res = await apiFetch('/orders/');
        return res.ok ? await res.json() : { results: [] };
    },
    
    async detail(orderId) {
        const res = await apiFetch(`/orders/${orderId}/`);
        return res.ok ? await res.json() : null;
    },
    
    async pay(orderId, paymentData) {
        const res = await apiFetch(`/orders/${orderId}/pay/`, {
            method: 'POST',
            body: JSON.stringify(paymentData),
        });
        return { ok: res.ok, data: await res.json() };
    },
    
    async cancel(orderId) {
        const res = await apiFetch(`/orders/${orderId}/cancel/`, { method: 'POST' });
        return { ok: res.ok, data: await res.json() };
    },
    
    async track(orderId) {
        const res = await apiFetch(`/orders/${orderId}/track/`);
        return res.ok ? await res.json() : null;
    }
};

// ─── Search API ───
const SearchAPI = {
    async search(query, params = {}) {
        const p = new URLSearchParams({ q: query, ...params }).toString();
        const res = await apiFetch(`/search/?${p}`);
        return res.ok ? await res.json() : { products: [], count: 0 };
    },
    
    async suggestions(query) {
        const res = await apiFetch(`/search/suggestions/?q=${encodeURIComponent(query)}`);
        return res.ok ? await res.json() : { suggestions: [] };
    },
    
    async voiceSearch(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'voice.wav');
        const res = await apiFetch('/search/voice/', { method: 'POST', body: formData });
        return { ok: res.ok, data: await res.json() };
    }
};

// Export for use
window.TribalLinkAPI = { TokenManager, AuthAPI, ProductsAPI, CartAPI, WishlistAPI, OrdersAPI, SearchAPI };
console.log('TribalLink API loaded. Access via window.TribalLinkAPI');
