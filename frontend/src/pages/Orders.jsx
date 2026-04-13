import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaBox, FaEye } from 'react-icons/fa';

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    OrdersAPI.list()
      .then(({ data }) => setOrders(data.results || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const statusMap = {
    delivered: { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
    cancelled: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
    shipped: { bg: '#dbeafe', color: '#1e40af', label: 'Shipped' },
    confirmed: { bg: '#fef3c7', color: '#92400e', label: 'Confirmed' },
    processing: { bg: '#e0e7ff', color: '#3730a3', label: 'Processing' },
    pending: { bg: '#fef9c3', color: '#854d0e', label: 'Pending' },
    refunded: { bg: '#f3e8ff', color: '#6b21a8', label: 'Refunded' },
  };

  if (!isAuthenticated) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', animation: 'fadeInUp 0.5s var(--ease-out) both' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>📦</div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-600)', marginBottom: 8 }}>Sign in to view orders</h3>
        <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Track your tribal treasures</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading orders...</span></div>;

  return (
    <div className="page-container">
      <h2 className="page-heading">My Orders</h2>
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>📦</div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-600)', marginBottom: 8 }}>No orders yet</h3>
          <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Your tribal treasures await!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}><FaBox /> Start Shopping</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {orders.map((o, i) => {
            const s = statusMap[o.status] || statusMap.pending;
            return (
              <div key={o.order_id} onClick={() => navigate(`/order/${o.order_id}`)}
                style={{
                  background: 'white', padding: '20px 24px', borderRadius: 'var(--radius-lg)',
                  borderLeft: `4px solid ${s.color}`, boxShadow: 'var(--shadow-sm)',
                  border: '1px solid var(--gray-100)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.2s', cursor: 'pointer', flexWrap: 'wrap', gap: 12,
                  animation: `fadeInUp 0.4s var(--ease-out) ${i * 60}ms both`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateX(0)'; }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--gray-800)' }}>
                      Order #{o.order_id?.substring(0, 8).toUpperCase()}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                      {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    {o.items_count && <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>· {o.items_count} items</span>}
                    <span style={{ color: 'var(--gray-400)', fontSize: '0.82rem' }}>
                      · {(o.payment_method || 'cod').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: s.bg, color: s.color,
                      padding: '4px 16px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                      textTransform: 'uppercase', display: 'inline-block', marginBottom: 4,
                    }}>
                      {s.label}
                    </span>
                    <br />
                    <strong style={{ fontSize: '1.15rem', color: 'var(--gray-900)' }}>₹{parseFloat(o.total).toLocaleString('en-IN')}</strong>
                  </div>
                  <FaEye style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
      <button className="btn btn-gray" style={{ maxWidth: 220, marginTop: 'var(--space-xl)' }} onClick={() => navigate(-1)}>
        <FaArrowLeft /> Continue Shopping
      </button>
    </div>
  );
}
