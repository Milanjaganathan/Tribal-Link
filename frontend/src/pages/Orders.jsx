import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

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

  const statusColor = (s) => {
    if (s === 'delivered') return '#388e3c';
    if (s === 'cancelled') return '#e53935';
    if (s === 'shipped') return '#1565c0';
    return '#fb8c00';
  };

  if (!isAuthenticated) return <div className="page-container"><p className="empty">Please login to view orders</p></div>;
  if (loading) return <div className="page-container"><p className="loading">Loading...</p></div>;

  return (
    <div className="page-container">
      <h2 className="page-heading">My Orders</h2>
      {orders.length === 0 ? (
        <p className="empty">No orders yet</p>
      ) : (
        orders.map((o) => (
          <div key={o.order_id} style={{
            background: 'white', padding: 20, marginBottom: 12, borderRadius: 8,
            borderLeft: `4px solid ${statusColor(o.status)}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <strong>Order #{o.order_id?.substring(0, 8)}</strong>
              <br />
              <span style={{ color: '#888', fontSize: '0.85rem' }}>
                {new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                background: statusColor(o.status), color: 'white',
                padding: '4px 14px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600
              }}>
                {o.status?.toUpperCase()}
              </span>
              <br />
              <strong style={{ fontSize: '1.1rem' }}>₹{o.total}</strong>
            </div>
          </div>
        ))
      )}
      <button className="btn btn-gray" style={{ maxWidth: 200, marginTop: 15 }} onClick={() => navigate('/')}>Back to Shop</button>
    </div>
  );
}
