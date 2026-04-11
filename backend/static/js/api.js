/* ═══════════════════════════════════════════
   TRIBAL LINK — API Client & Auth Module
   ═══════════════════════════════════════════ */

const API_BASE = '/api';

// ── Token Management ──
const TokenManager = {
    getAccess: () => localStorage.getItem('tl_access'),
    getRefresh: () => localStorage.getItem('tl_refresh'),
    getUser: () => JSON.parse(localStorage.getItem('tl_user') || 'null'),
    set(data) {
        if (data.tokens) {
            localStorage.setItem('tl_access', data.tokens.access);
            localStorage.setItem('tl_refresh', data.tokens.refresh);
        }
        if (data.access) localStorage.setItem('tl_access', data.access);
        if (data.refresh) localStorage.setItem('tl_refresh', data.refresh);
        if (data.user) localStorage.setItem('tl_user', JSON.stringify(data.user));
    },
    clear() {
        localStorage.removeItem('tl_access');
        localStorage.removeItem('tl_refresh');
        localStorage.removeItem('tl_user');
    },
    isLoggedIn() { return !!this.getAccess(); },
    getRole() { const u = this.getUser(); return u ? u.role : null; },
};

// ── API Client ──
async function apiCall(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = options.headers || {};
    
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }
    
    const token = TokenManager.getAccess();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const config = { ...options, headers };
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
        config.body = JSON.stringify(options.body);
    }
    
    let response = await fetch(url, config);
    
    // Token refresh on 401
    if (response.status === 401 && TokenManager.getRefresh()) {
        const refreshResp = await fetch(`${API_BASE}/accounts/token/refresh/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: TokenManager.getRefresh() }),
        });
        if (refreshResp.ok) {
            const data = await refreshResp.json();
            TokenManager.set(data);
            headers['Authorization'] = `Bearer ${data.access}`;
            response = await fetch(url, { ...config, headers });
        } else {
            TokenManager.clear();
            App.navigate('login');
            throw new Error('Session expired. Please login again.');
        }
    }
    
    if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.detail || err.error || JSON.stringify(err));
    }
    
    if (response.status === 204) return {};
    return response.json();
}

const api = {
    get: (url) => apiCall(url),
    post: (url, body) => apiCall(url, { method: 'POST', body }),
    put: (url, body) => apiCall(url, { method: 'PUT', body }),
    patch: (url, body) => apiCall(url, { method: 'PATCH', body }),
    delete: (url) => apiCall(url, { method: 'DELETE' }),
    upload: (url, formData) => apiCall(url, { method: 'POST', body: formData }),
};

// ── Toast Notifications ──
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── Utility ──
function formatPrice(price) { return `₹${parseFloat(price).toLocaleString('en-IN')}`; }
function formatDate(dateStr) { return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function formatDateTime(dateStr) { return new Date(dateStr).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return days < 30 ? `${days}d ago` : formatDate(dateStr);
}
function renderStars(rating) {
    let s = '';
    for (let i = 1; i <= 5; i++) {
        s += `<i class="fa${i <= Math.round(rating || 0) ? 's' : 'r'} fa-star"></i>`;
    }
    return s;
}
function getProductImage(product) {
    if (product.image) return product.image;
    if (product.display_image) return product.display_image;
    if (product.image_url) return product.image_url;
    return 'https://placehold.co/400x300/1a1a2e/8B5CF6?text=No+Image';
}
function getInitials(user) {
    if (!user) return '?';
    const f = user.first_name || user.username || '';
    const l = user.last_name || '';
    return (f[0] || '') + (l[0] || '');
}
function debounce(fn, delay) {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}
