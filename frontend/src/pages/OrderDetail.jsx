import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { OrdersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaTruck, FaBox, FaCheck, FaClock, FaHome, FaClipboardList } from 'react-icons/fa';

const timelineSteps = [
  { key: 'pending', label: 'Order Placed', icon: <FaClipboardList />, desc: 'Your order has been received' },
  { key: 'confirmed', label: 'Confirmed', icon: <FaCheck />, desc: 'Order confirmed by seller' },
  { key: 'processing', label: 'Processing', icon: <FaBox />, desc: 'Product is being packed' },
  { key: 'shipped', label: 'Shipped', icon: <FaTruck />, desc: 'On the way to you' },
  { key: 'delivered', label: 'Delivered', icon: <FaHome />, desc: 'Order delivered!' },
];

const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    OrdersAPI.detail(id)
      .then(({ data }) => setOrder(data))
      .catch(() => toast.error('Order not found'))
      .finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading order...</span></div>;
  if (!order) return <div className="empty">Order not found</div>;

  const currentStep = statusOrder.indexOf(order.status);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const paymentStatusColor = { pending: '#f59e0b', completed: '#16a34a', failed: '#ef4444', refunded: '#6366f1' };

  return (
    <div className="page-container" style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--forest-900), var(--earth-700))',
        borderRadius: 'var(--radius-xl)', padding: '28px 32px',
        color: 'white', marginBottom: 'var(--space-xl)',
        animation: 'fadeInUp 0.5s var(--ease-out) both',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'white', marginBottom: 4 }}>
            Order #{(order.order_id || id).toString().substring(0, 8).toUpperCase()}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
            Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <span className={`status-tag ${order.status}`} style={{ fontSize: '0.8rem', padding: '6px 18px' }}>
          {order.status?.toUpperCase()}
        </span>
      </div>

      {/* ═══ Order Tracking Timeline ═══ */}
      {!isCancelled && (
        <div style={{
          background: 'white', borderRadius: 'var(--radius-xl)', padding: '32px',
          boxShadow: 'var(--shadow-md)', border: '1px solid var(--gray-100)',
          marginBottom: 'var(--space-xl)', animation: 'fadeInUp 0.5s var(--ease-out) 0.1s both',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', marginBottom: 'var(--space-xl)', color: 'var(--gray-800)' }}>
            📦 Order Tracking
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 20px' }}>
            {/* Progress line background */}
            <div style={{
              position: 'absolute', top: 24, left: 40, right: 40, height: 3,
              background: 'var(--gray-200)', borderRadius: 'var(--radius-full)', zIndex: 0,
            }} />
            {/* Active progress line */}
            <div style={{
              position: 'absolute', top: 24, left: 40, height: 3,
              width: currentStep >= 0 ? `${(currentStep / (timelineSteps.length - 1)) * (100 - 8)}%` : '0%',
              background: 'linear-gradient(90deg, var(--primary), var(--forest-400))',
              borderRadius: 'var(--radius-full)', zIndex: 1,
              transition: 'width 0.8s var(--ease-out)',
            }} />

            {timelineSteps.map((step, i) => {
              const isActive = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <div key={step.key} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  position: 'relative', zIndex: 2, flex: 1,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 'var(--radius-full)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: isCurrent ? '1.1rem' : '0.95rem',
                    fontWeight: 700,
                    background: isActive
                      ? 'linear-gradient(135deg, var(--primary), var(--forest-400))'
                      : 'var(--gray-100)',
                    color: isActive ? 'white' : 'var(--gray-400)',
                    border: isCurrent ? '3px solid var(--forest-200)' : '3px solid transparent',
                    boxShadow: isCurrent ? '0 0 0 4px rgba(61, 155, 88, 0.15)' : 'none',
                    transition: 'all 0.5s var(--ease-out)',
                  }}>
                    {step.icon}
                  </div>
                  <strong style={{
                    marginTop: 10, fontSize: '0.75rem', fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--gray-800)' : 'var(--gray-400)',
                    textAlign: 'center',
                  }}>
                    {step.label}
                  </strong>
                  <span style={{
                    fontSize: '0.68rem', color: 'var(--gray-400)',
                    textAlign: 'center', marginTop: 2, maxWidth: 100,
                  }}>
                    {isActive ? step.desc : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancelled/refunded notice */}
      {isCancelled && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-lg)', marginBottom: 'var(--space-xl)',
          color: '#991b1b', fontWeight: 500, textAlign: 'center',
        }}>
          This order has been {order.status}.
        </div>
      )}

      {/* ═══ Order Items ═══ */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-xl)', padding: '24px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
        marginBottom: 'var(--space-xl)', animation: 'fadeInUp 0.5s var(--ease-out) 0.2s both',
      }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 'var(--space-md)', color: 'var(--gray-800)' }}>
          Items
        </h3>
        {(order.items || []).map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
            borderBottom: i < order.items.length - 1 ? '1px solid var(--gray-100)' : 'none',
          }}>
            {item.product_image && (
              <img src={item.product_image} alt="" style={{ width: 56, height: 56, borderRadius: 'var(--radius-sm)', objectFit: 'cover', flexShrink: 0 }}
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gray-800)' }}>{item.product_name}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)' }}>Qty: {item.quantity}</div>
            </div>
            <strong style={{ fontSize: '0.95rem', color: 'var(--gray-900)' }}>₹{parseFloat(item.subtotal || item.product_price * item.quantity).toLocaleString('en-IN')}</strong>
          </div>
        ))}

        <div className="divider" />

        {/* Payment & Shipping Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
          <div>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Shipping</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)', lineHeight: 1.6 }}>
              {order.shipping_name}<br />
              {order.shipping_phone}<br />
              {order.shipping_address}<br />
              {order.shipping_city}, {order.shipping_state} — {order.shipping_pincode}
            </p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Payment</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--gray-700)' }}>
              Method: <strong style={{ textTransform: 'uppercase' }}>{order.payment_method}</strong>
            </p>
            <p style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Status: <span style={{
                background: `${paymentStatusColor[order.payment_status] || '#888'}15`,
                color: paymentStatusColor[order.payment_status] || '#888',
                padding: '2px 10px', borderRadius: 'var(--radius-full)',
                fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              }}>{order.payment_status}</span>
            </p>
            <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: 8 }}>
              Total: ₹{parseFloat(order.total).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamps */}
      <div style={{
        background: 'white', borderRadius: 'var(--radius-lg)', padding: '20px 24px',
        boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)',
        marginBottom: 'var(--space-xl)', animation: 'fadeInUp 0.5s var(--ease-out) 0.3s both',
        display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap',
      }}>
        {[
          { label: 'Ordered', time: order.created_at, icon: <FaClock /> },
          order.paid_at && { label: 'Paid', time: order.paid_at, icon: <FaCheck /> },
          order.shipped_at && { label: 'Shipped', time: order.shipped_at, icon: <FaTruck /> },
          order.delivered_at && { label: 'Delivered', time: order.delivered_at, icon: <FaHome /> },
        ].filter(Boolean).map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--primary-light)', fontSize: '0.85rem' }}>{t.icon}</span>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--gray-700)', fontWeight: 500 }}>
                {new Date(t.time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        <button className="btn btn-gray" onClick={() => navigate('/orders')}><FaArrowLeft /> All Orders</button>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Continue Shopping</button>
      </div>
    </div>
  );
}
