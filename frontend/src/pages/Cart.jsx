import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Cart.css';

export default function Cart({ onUpdate }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({ total_items: 0, total_price: '0' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!isAuthenticated) { setLoading(false); return; }
    CartAPI.list()
      .then(({ data }) => {
        setItems(data.items || []);
        setSummary({ total_items: data.total_items || 0, total_price: data.total_price || '0' });
        if (onUpdate) onUpdate(data.total_items || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const updateQty = async (id, qty) => {
    if (qty < 1) { remove(id); return; }
    try { await CartAPI.update(id, qty); load(); } catch { toast.error('Error'); }
  };

  const remove = async (id) => {
    try { await CartAPI.remove(id); toast.success('Removed'); load(); } catch { toast.error('Error'); }
  };

  if (!isAuthenticated) return <div className="page-container"><p className="empty">Please login to view cart</p></div>;
  if (loading) return <div className="page-container"><p className="loading">Loading cart...</p></div>;

  return (
    <div className="page-container">
      <h2 className="page-heading">My Cart</h2>
      {items.length === 0 ? (
        <p className="empty">Your cart is empty</p>
      ) : (
        <>
          {items.map((item) => {
            const p = item.product_detail || {};
            const img = p.display_image || p.image_url || p.image || '';
            return (
              <div key={item.id} className="cart-row">
                <img src={img} alt={p.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/100'; }} />
                <div className="cart-info">
                  <h4>{p.name}</h4>
                  <div className="cart-price">₹{p.price}</div>
                  <div className="qty-controls">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    <button className="remove-btn" onClick={() => remove(item.id)}>REMOVE</button>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="cart-summary">
            <h3>Total: ₹{summary.total_price} ({summary.total_items} items)</h3>
            <button className="btn btn-orange" onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
          </div>
        </>
      )}
      <button className="btn btn-gray" style={{ maxWidth: 200, marginTop: 10 }} onClick={() => navigate('/')}>Back to Shop</button>
    </div>
  );
}
