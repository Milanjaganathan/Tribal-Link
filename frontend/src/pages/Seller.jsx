import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Seller() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: 50, description: '', image_url: '' });

  useEffect(() => {
    ProductsAPI.categories().then(({ data }) => {
      setCategories(data);
      if (data.length) setForm((f) => ({ ...f, category: data[0].id }));
    }).catch(() => {});
    if (isAuthenticated) loadProducts();
  }, [isAuthenticated]);

  const loadProducts = () => {
    ProductsAPI.sellerList()
      .then(({ data }) => setProducts(data.results || data || []))
      .catch(() => {});
  };

  const set = (k, v) => setForm({ ...form, [k]: v });

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login as seller'); navigate('/login'); return; }
    if (!form.name || !form.price) { toast.error('Name and price required'); return; }
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('category', form.category);
      fd.append('price', form.price);
      fd.append('stock', form.stock || 50);
      fd.append('description', form.description || 'Authentic tribal product');
      if (form.image_url) fd.append('image_url', form.image_url);
      const fileInput = document.getElementById('sellerImage');
      if (fileInput?.files[0]) fd.append('image', fileInput.files[0]);
      await ProductsAPI.sellerAdd(fd);
      toast.success('Product listed! Pending admin approval.');
      setForm({ ...form, name: '', price: '', description: '', image_url: '' });
      loadProducts();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(', ') : 'Error listing product');
    }
  };

  const statusColor = (s) => s === 'approved' ? '#388e3c' : s === 'rejected' ? '#e53935' : '#fb8c00';

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 580 }}>
        <h2 style={{ color: '#2d5a27', textAlign: 'center' }}>Artisan Dashboard</h2>
        <form onSubmit={submit}>
          <input placeholder="Product Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
          <select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="form-row">
            <input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => set('price', e.target.value)} />
            <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          </div>
          <label style={{ fontSize: '0.8rem', color: '#666' }}>Upload Image:</label>
          <input type="file" id="sellerImage" accept="image/*" style={{ padding: 8 }} />
          <input placeholder="Or paste image URL" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
          <textarea placeholder="Describe the story of your product..." value={form.description} onChange={(e) => set('description', e.target.value)}
            style={{ width: '100%', padding: 12, margin: '8px 0', border: '1px solid #ddd', borderRadius: 6, fontFamily: 'inherit', minHeight: 80 }} />
          <button className="btn btn-green" type="submit" style={{ width: '100%' }}>List Product</button>
        </form>

        <h3 style={{ marginTop: 30, marginBottom: 12 }}>Your Products</h3>
        {products.length === 0 ? (
          <p style={{ color: '#888' }}>{isAuthenticated ? 'No products listed yet' : 'Login as seller to see products'}</p>
        ) : (
          products.map((p) => (
            <div key={p.id} style={{
              background: '#f9f9f9', padding: 12, margin: '8px 0', borderRadius: 6,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span>{p.name} — ₹{p.price}</span>
              <span style={{
                background: statusColor(p.status), color: 'white',
                padding: '2px 10px', borderRadius: 10, fontSize: '0.75rem',
              }}>
                {(p.status || 'pending').toUpperCase()}
              </span>
            </div>
          ))
        )}
        <button className="btn btn-gray" onClick={() => navigate('/')}>Back to Home</button>
      </div>
    </div>
  );
}
