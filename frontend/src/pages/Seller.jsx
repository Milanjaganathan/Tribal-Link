import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsAPI, SellerAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaPlus, FaArrowLeft, FaImage, FaBox, FaRupeeSign, FaChartBar, FaTruck } from 'react-icons/fa';
import './Login.css';

export default function Seller() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [products, setProducts] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: 50, description: '', image_url: '' });

  useEffect(() => {
    ProductsAPI.categories().then(({ data }) => {
      setCategories(data);
      if (data.length) setForm((f) => ({ ...f, category: data[0].id }));
    }).catch(() => {});
    if (isAuthenticated) {
      loadProducts();
      loadDashboard();
    }
  }, [isAuthenticated]);

  const loadDashboard = () => {
    SellerAPI.dashboard()
      .then(({ data }) => setDashboard(data))
      .catch(() => {});
  };

  const loadProducts = () => {
    ProductsAPI.sellerList()
      .then(({ data }) => setProducts(data.results || data || []))
      .catch(() => {});
  };

  const loadOrders = () => {
    SellerAPI.orders()
      .then(({ data }) => setSellerOrders(data.orders || []))
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
      setShowForm(false);
      loadProducts();
      loadDashboard();
    } catch (err) {
      const msg = err.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(', ') : 'Error listing product');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await SellerAPI.updateOrderStatus(orderId, { status: newStatus });
      toast.success(`Order updated to ${newStatus}`);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot update status');
    }
  };

  const statusMap = {
    approved: { bg: '#dcfce7', color: '#166534' },
    rejected: { bg: '#fee2e2', color: '#991b1b' },
    pending: { bg: '#fef9c3', color: '#854d0e' },
  };

  const orderStatusMap = {
    pending: { next: 'confirmed', label: 'Confirm' },
    confirmed: { next: 'processing', label: 'Process' },
    processing: { next: 'shipped', label: 'Ship' },
    shipped: { next: 'delivered', label: 'Mark Delivered' },
  };

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { key: 'products', label: 'Products', icon: <FaBox /> },
    { key: 'orders', label: 'Orders', icon: <FaTruck /> },
  ];

  return (
    <div className="page-container" style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--forest-900), var(--earth-700))',
        borderRadius: 'var(--radius-xl)', padding: '32px',
        color: 'white', marginBottom: 'var(--space-xl)',
        animation: 'fadeInUp 0.5s var(--ease-out) both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 4, color: 'white' }}>
              🎨 Artisan Dashboard
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              {dashboard?.shop_name || 'Your artisan shop'}{dashboard?.is_verified ? ' · ✅ Verified' : ' · ⏳ Pending verification'}
            </p>
          </div>
          <button className="btn btn-gold" onClick={() => { setShowForm(!showForm); setActiveTab('products'); }}>
            <FaPlus /> New Product
          </button>
        </div>

        {/* Stats Row */}
        {dashboard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 24 }}>
            {[
              { label: 'Products', value: dashboard.products.total, icon: '📦' },
              { label: 'Approved', value: dashboard.products.approved, icon: '✅' },
              { label: 'Orders', value: dashboard.orders.total, icon: '🛒' },
              { label: 'Earnings', value: `₹${parseFloat(dashboard.earnings.total).toLocaleString('en-IN')}`, icon: '💰' },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
                padding: '16px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gold-300)', fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>{s.icon} {s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-xl)' }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setActiveTab(t.key); if (t.key === 'orders') loadOrders(); }}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-full)',
              border: activeTab === t.key ? '2px solid var(--primary)' : '1.5px solid var(--gray-200)',
              background: activeTab === t.key ? 'var(--primary)' : 'white',
              color: activeTab === t.key ? 'white' : 'var(--gray-600)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Add Product Form */}
      {showForm && activeTab === 'products' && (
        <div className="auth-card" style={{ maxWidth: '100%', marginBottom: 'var(--space-xl)', animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <h2 style={{ fontSize: '1.3rem' }}>✦ New Product</h2>
          <form onSubmit={submit}>
            <input placeholder="Product Name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <select value={form.category} onChange={(e) => set('category', e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="form-row">
              <input type="number" placeholder="Price (₹)" value={form.price} onChange={(e) => set('price', e.target.value)} />
              <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </div>
            <div style={{ padding: '12px 16px', border: '1.5px dashed var(--gray-200)', borderRadius: 'var(--radius-md)', margin: '6px 0', background: 'var(--gray-50)' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FaImage /> Upload Image
              </label>
              <input type="file" id="sellerImage" accept="image/*" style={{ padding: 0, border: 'none', background: 'transparent', fontSize: '0.85rem' }} />
            </div>
            <input placeholder="Or paste image URL" value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
            <textarea placeholder="Tell the story behind your product..."
              value={form.description} onChange={(e) => set('description', e.target.value)}
              style={{ width: '100%', padding: 14, margin: '6px 0', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', minHeight: 100, background: 'var(--gray-50)', fontSize: '0.9rem', resize: 'vertical' }} />
            <button className="btn btn-green" type="submit" style={{ width: '100%' }}>List Product</button>
          </form>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === 'products' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 'var(--space-lg)', color: 'var(--gray-800)' }}>
            Your Products ({products.length})
          </h3>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
              <p style={{ color: 'var(--gray-400)' }}>{isAuthenticated ? 'No products yet. Start listing!' : 'Login as seller to manage products'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {products.map((p, i) => {
                const s = statusMap[p.status] || statusMap.pending;
                const img = p.display_image || p.image_url || p.image || '';
                return (
                  <div key={p.id} style={{
                    background: 'white', padding: '16px 20px', borderRadius: 'var(--radius-md)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)', gap: 16,
                    animation: `fadeInUp 0.4s var(--ease-out) ${i * 50}ms both`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      {img && <img src={img} alt={p.name} style={{ width: 50, height: 50, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                        onError={(e) => { e.target.style.display = 'none'; }} />}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>₹{parseFloat(p.price).toLocaleString('en-IN')} · Stock: {p.stock}</div>
                      </div>
                    </div>
                    <span style={{ background: s.bg, color: s.color, padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>
                      {(p.status || 'pending').toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', marginBottom: 'var(--space-lg)' }}>
            Received Orders ({sellerOrders.length})
          </h3>
          {sellerOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--gray-100)' }}>
              <p style={{ color: 'var(--gray-400)' }}>No orders received yet</p>
            </div>
          ) : sellerOrders.map((o, i) => {
            const transition = orderStatusMap[o.status];
            return (
              <div key={o.order_id} style={{
                background: 'white', padding: '20px', borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-md)', border: '1px solid var(--gray-100)',
                boxShadow: 'var(--shadow-sm)',
                animation: `fadeInUp 0.4s var(--ease-out) ${i * 60}ms both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <strong style={{ fontSize: '0.95rem' }}>Order #{o.order_id?.substring(0, 8).toUpperCase()}</strong>
                  <span className={`status-tag ${o.status}`}>{o.status?.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: 12 }}>
                  <span>📍 {o.customer_name} · {o.customer_phone}</span><br />
                  <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{o.shipping_address}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {o.items?.map((item, j) => (
                    <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-sm)' }}>
                      {item.product_image && <img src={item.product_image} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                      <span style={{ flex: 1, fontSize: '0.85rem' }}>{item.product_name}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>×{item.quantity}</span>
                      <strong style={{ fontSize: '0.85rem' }}>₹{item.subtotal}</strong>
                    </div>
                  ))}
                </div>
                {transition && (
                  <button className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}
                    onClick={() => updateOrderStatus(o.order_id, transition.next)}>
                    <FaTruck /> {transition.label}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && !dashboard && (
        <div style={{ textAlign: 'center', padding: 'var(--space-2xl)', background: 'white', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ color: 'var(--gray-400)' }}>{isAuthenticated ? 'Loading dashboard...' : 'Login as seller to see your dashboard'}</p>
        </div>
      )}

      <button className="btn btn-gray" style={{ maxWidth: 220, marginTop: 'var(--space-xl)' }} onClick={() => navigate('/')}>
        <FaArrowLeft /> Back to Home
      </button>
    </div>
  );
}
