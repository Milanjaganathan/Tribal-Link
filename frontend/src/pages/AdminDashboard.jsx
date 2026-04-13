import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AdminAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaUsers, FaBox, FaShoppingBag, FaRupeeSign, FaCheck, FaTimes, FaStore, FaChartBar, FaStar, FaTrash, FaArrowLeft } from 'react-icons/fa';

export default function AdminDashboard() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [pendingSellers, setPendingSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prodFilter, setProdFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && !user?.is_superuser)) {
      navigate('/');
      return;
    }
    loadDashboard();
  }, [isAuthenticated, user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await AdminAPI.dashboard();
      setStats(data);
    } catch { toast.error('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  const loadTab = async (t) => {
    setTab(t);
    try {
      if (t === 'sellers') {
        const { data } = await AdminAPI.pendingSellers();
        setPendingSellers(data.results || data || []);
      } else if (t === 'products') {
        const { data } = await AdminAPI.products({ status: prodFilter || undefined });
        setProducts(data.products || []);
      } else if (t === 'orders') {
        const { data } = await AdminAPI.orders({ status: orderFilter || undefined });
        setOrders(data.orders || []);
      } else if (t === 'reviews') {
        const { data } = await AdminAPI.reviews();
        setReviews(data.reviews || []);
      } else if (t === 'users') {
        const { data } = await AdminAPI.users({ role: userFilter || undefined });
        setUsers(data.results || data || []);
      }
    } catch { }
  };

  const approveSeller = async (id, action) => {
    try {
      await AdminAPI.approveSeller(id, { action, reason: action === 'reject' ? 'Does not meet criteria' : '' });
      toast.success(`Seller ${action}d`);
      loadTab('sellers');
      loadDashboard();
    } catch { toast.error('Error'); }
  };

  const approveProduct = async (id, action) => {
    try {
      await AdminAPI.approveProduct(id, { action });
      toast.success(`Product ${action}d`);
      loadTab('products');
      loadDashboard();
    } catch { toast.error('Error'); }
  };

  const deleteReview = async (id) => {
    try {
      await AdminAPI.deleteReview(id);
      toast.success('Review deleted');
      loadTab('reviews');
    } catch { toast.error('Error'); }
  };

  if (loading && !stats) return <div className="loading-screen"><div className="spinner"></div><span>Loading admin dashboard...</span></div>;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: <FaChartBar /> },
    { key: 'sellers', label: 'Sellers', icon: <FaStore /> },
    { key: 'products', label: 'Products', icon: <FaBox /> },
    { key: 'orders', label: 'Orders', icon: <FaShoppingBag /> },
    { key: 'users', label: 'Users', icon: <FaUsers /> },
    { key: 'reviews', label: 'Reviews', icon: <FaStar /> },
  ];

  const StatCard = ({ icon, label, value, color }) => (
    <div style={{
      background: 'white', borderRadius: 'var(--radius-lg)', padding: '24px',
      border: '1px solid var(--gray-100)', boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'all 0.2s', cursor: 'default',
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
    >
      <div style={{
        width: 50, height: 50, borderRadius: 'var(--radius-md)',
        background: `${color}15`, color: color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.3rem', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gray-900)', fontFamily: 'var(--font-display)' }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );

  return (
    <div className="page-container" style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4338ca)',
        borderRadius: 'var(--radius-xl)', padding: '32px',
        color: 'white', marginBottom: 'var(--space-xl)',
        animation: 'fadeInUp 0.5s var(--ease-out) both',
      }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: 4, color: 'white' }}>
          👑 Admin Dashboard
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
          Manage your marketplace — users, products, orders & analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 'var(--space-xl)',
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { if (t.key !== 'overview') loadTab(t.key); else setTab('overview'); }}
            style={{
              padding: '10px 20px', borderRadius: 'var(--radius-full)',
              border: tab === t.key ? '2px solid var(--indigo-500)' : '1.5px solid var(--gray-200)',
              background: tab === t.key ? 'var(--indigo-500)' : 'white',
              color: tab === t.key ? 'white' : 'var(--gray-600)',
              fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
              fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && stats && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
            <StatCard icon={<FaUsers />} label="Total Users" value={stats.users.total} color="#6366f1" />
            <StatCard icon={<FaStore />} label="Verified Sellers" value={stats.users.verified_sellers} color="#16a34a" />
            <StatCard icon={<FaBox />} label="Total Products" value={stats.products.total} color="#f59e0b" />
            <StatCard icon={<FaShoppingBag />} label="Total Orders" value={stats.orders.total} color="#e06b3a" />
            <StatCard icon={<FaRupeeSign />} label="Total Revenue" value={`₹${parseFloat(stats.revenue.total).toLocaleString('en-IN')}`} color="#16a34a" />
            <StatCard icon={<FaStore />} label="Pending Sellers" value={stats.users.pending_sellers} color="#ef4444" />
          </div>

          {/* Recent Orders */}
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)', color: 'var(--gray-800)' }}>Recent Orders</h3>
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Order ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Customer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recent_orders || []).map((o) => {
                  const sMap = { delivered: '#16a34a', shipped: '#2563eb', pending: '#f59e0b', cancelled: '#ef4444', confirmed: '#8b5cf6', processing: '#6366f1' };
                  return (
                    <tr key={o.order_id} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{o.order_id?.substring(0, 8).toUpperCase()}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-600)' }}>{o.user_email}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700 }}>₹{parseFloat(o.total).toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: `${sMap[o.status] || '#888'}15`, color: sMap[o.status] || '#888', padding: '3px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase' }}>{o.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                        {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sellers Tab */}
      {tab === 'sellers' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)' }}>Pending Seller Approvals ({pendingSellers.length})</h3>
          {pendingSellers.length === 0 ? (
            <div style={{ background: 'white', padding: 'var(--space-2xl)', borderRadius: 'var(--radius-lg)', textAlign: 'center', color: 'var(--gray-400)', border: '1px solid var(--gray-100)' }}>No pending sellers</div>
          ) : pendingSellers.map((s) => (
            <div key={s.id} style={{ background: 'white', padding: '20px', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-sm)', border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <strong>{s.first_name} {s.last_name}</strong> <span style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>({s.email})</span>
                <br /><span style={{ fontSize: '0.82rem', color: 'var(--gray-500)' }}>Shop: {s.shop_name || 'N/A'} · Phone: {s.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-green" style={{ padding: '8px 20px', fontSize: '0.82rem' }} onClick={() => approveSeller(s.id, 'approve')}><FaCheck /> Approve</button>
                <button className="btn btn-red" style={{ padding: '8px 20px', fontSize: '0.82rem' }} onClick={() => approveSeller(s.id, 'reject')}><FaTimes /> Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products Tab */}
      {tab === 'products' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Products ({products.length})</h3>
            <select value={prodFilter} onChange={(e) => { setProdFilter(e.target.value); setTimeout(() => loadTab('products'), 0); }}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--gray-200)', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          {products.map((p) => (
            <div key={p.id} style={{ background: 'white', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <img src={p.display_image || p.image_url || ''} alt="" style={{ width: 45, height: 45, borderRadius: 6, objectFit: 'cover' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)' }}>₹{p.price} · by {p.seller?.email || 'N/A'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {p.status === 'pending' && (
                  <>
                    <button className="btn btn-green" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => approveProduct(p.id, 'approve')}><FaCheck /></button>
                    <button className="btn btn-red" style={{ padding: '6px 14px', fontSize: '0.78rem' }} onClick={() => approveProduct(p.id, 'reject')}><FaTimes /></button>
                  </>
                )}
                <span className={`status-tag ${p.status}`}>{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>All Orders ({orders.length})</h3>
          </div>
          {orders.map((o) => (
            <div key={o.order_id} style={{ background: 'white', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <div>
                <strong>#{(o.order_id || '').substring(0, 8).toUpperCase()}</strong>
                <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem', marginLeft: 8 }}>{o.user_email || o.user?.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <strong>₹{parseFloat(o.total).toLocaleString('en-IN')}</strong>
                <span className={`status-tag ${o.status}`}>{o.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 'var(--space-md)', flexWrap: 'wrap', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)' }}>Users ({users.length})</h3>
            <select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setTimeout(() => loadTab('users'), 0); }}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--gray-200)', fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
              <option value="">All Roles</option>
              <option value="customer">Customers</option>
              <option value="seller">Sellers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          {users.map((u) => {
            const badge = { admin: { bg: '#e0e7ff', color: '#3730a3' }, seller: { bg: '#dcfce7', color: '#166534' }, customer: { bg: '#fef3c7', color: '#92400e' } };
            const b = badge[u.role] || badge.customer;
            return (
              <div key={u.id} style={{ background: 'white', padding: '14px 20px', borderRadius: 'var(--radius-md)', marginBottom: 6, border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{u.first_name} {u.last_name}</strong>
                  <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem', marginLeft: 8 }}>{u.email}</span>
                </div>
                <span style={{ background: b.bg, color: b.color, padding: '3px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>{u.role}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Reviews Tab */}
      {tab === 'reviews' && (
        <div style={{ animation: 'fadeInUp 0.4s var(--ease-out) both' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 'var(--space-md)' }}>Reviews ({reviews.length})</h3>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: 'white', padding: '16px 20px', borderRadius: 'var(--radius-md)', marginBottom: 8, border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <strong style={{ fontSize: '0.88rem' }}>{r.user?.first_name || 'User'}</strong>
                  <span style={{ color: 'var(--gold-500)', fontSize: '0.82rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginBottom: 4 }}>{r.comment}</p>
                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>on {r.product?.name || 'Product'}</span>
              </div>
              <button className="btn btn-red" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={() => deleteReview(r.id)}><FaTrash /></button>
            </div>
          ))}
        </div>
      )}

      <button className="btn btn-gray" style={{ maxWidth: 220, marginTop: 'var(--space-xl)' }} onClick={() => navigate('/')}>
        <FaArrowLeft /> Back to Home
      </button>
    </div>
  );
}
