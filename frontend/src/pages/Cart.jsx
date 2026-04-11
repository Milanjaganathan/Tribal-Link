import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaShoppingBag, FaArrowLeft } from 'react-icons/fa';
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
    try { await CartAPI.remove(id); toast.success('Removed from cart'); load(); } catch { toast.error('Error'); }
  };

  if (!isAuthenticated) return (
    <div className="page-container">
      <div className="cart-empty">
        <div className="cart-empty-icon">🛒</div>
        <h3>Please sign in</h3>
        <p>Log in to view your shopping cart</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading cart...</span></div>;

  const totalPrice = parseFloat(summary.total_price);

  return (
    <div className="page-container">
      <h2 className="page-heading">Shopping Cart</h2>

      {items.length === 0 ? (
        <div className="cart-empty">
          <div className="cart-empty-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added any tribal treasures yet!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            <FaShoppingBag /> Start Shopping
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {items.map((item, i) => {
              const p = item.product_detail || {};
              const img = p.display_image || p.image_url || p.image || '';
              return (
                <div key={item.id} className="cart-row" style={{ animationDelay: `${i * 60}ms` }}>
                  <img
                    src={img} alt={p.name}
                    onClick={() => navigate(`/product/${p.id}`)}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/110/f5e6d0/8b5e3c?text=Art'; }}
                  />
                  <div className="cart-info">
                    <h4>{p.name}</h4>
                    {p.seller?.shop_name && <div className="cart-seller">by {p.seller.shop_name}</div>}
                    <div className="cart-price">₹{parseFloat(p.price).toLocaleString('en-IN')}</div>
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
          </div>

          <div className="cart-summary">
            <h3>Order Summary</h3>
            <div className="summary-row">
              <span>Items ({summary.total_items})</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>FREE</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{totalPrice.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn btn-orange" onClick={() => navigate('/checkout')}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      <button className="btn btn-gray" style={{ maxWidth: 220, marginTop: 'var(--space-lg)' }} onClick={() => navigate('/')}>
        <FaArrowLeft /> Continue Shopping
      </button>
    </div>
  );
}
