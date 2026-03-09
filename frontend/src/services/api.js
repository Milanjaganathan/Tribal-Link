import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// ─── Token interceptors ───
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tl_access');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const orig = error.config;
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      const refresh = localStorage.getItem('tl_refresh');
      if (refresh) {
        try {
          const { data } = await axios.post('/api/accounts/token/refresh/', { refresh });
          localStorage.setItem('tl_access', data.access);
          orig.headers.Authorization = `Bearer ${data.access}`;
          return API(orig);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───
export const AuthAPI = {
  register: (data) => API.post('/accounts/register/', data),
  login: (data) => API.post('/accounts/login/', data),
  logout: (data) => API.post('/accounts/logout/', data),
  profile: () => API.get('/accounts/profile/'),
  updateProfile: (data) => API.put('/accounts/profile/', data),
};

// ─── Products ───
export const ProductsAPI = {
  list: (params) => API.get('/products/', { params }),
  detail: (id) => API.get(`/products/${id}/`),
  categories: () => API.get('/products/categories/'),
  featured: () => API.get('/products/featured/'),
  reviews: (id) => API.get(`/products/${id}/reviews/`),
  addReview: (id, data) => API.post(`/products/${id}/reviews/`, data),
  sellerList: () => API.get('/products/seller/'),
  sellerAdd: (data) => API.post('/products/seller/', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  sellerUpdate: (id, data) => API.put(`/products/seller/${id}/`, data),
  sellerDelete: (id) => API.delete(`/products/seller/${id}/`),
};

// ─── Cart ───
export const CartAPI = {
  list: () => API.get('/cart/'),
  add: (product, quantity = 1) => API.post('/cart/', { product, quantity }),
  update: (id, quantity) => API.patch(`/cart/${id}/`, { quantity }),
  remove: (id) => API.delete(`/cart/${id}/`),
  clear: () => API.delete('/cart/clear/'),
};

// ─── Wishlist ───
export const WishlistAPI = {
  list: () => API.get('/wishlist/'),
  add: (product) => API.post('/wishlist/', { product }),
  remove: (id) => API.delete(`/wishlist/${id}/`),
  clear: () => API.delete('/wishlist/clear/'),
};

// ─── Orders ───
export const OrdersAPI = {
  create: (data) => API.post('/orders/create/', data),
  list: () => API.get('/orders/'),
  detail: (id) => API.get(`/orders/${id}/`),
  pay: (id, data) => API.post(`/orders/${id}/pay/`, data),
  cancel: (id) => API.post(`/orders/${id}/cancel/`),
  track: (id) => API.get(`/orders/${id}/track/`),
};

// ─── Search ───
export const SearchAPI = {
  search: (params) => API.get('/search/', { params }),
  suggestions: (q) => API.get('/search/suggestions/', { params: { q } }),
};

export default API;
