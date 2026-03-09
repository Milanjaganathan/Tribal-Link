import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistAPI, CartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ProductCard from '../components/ProductCard';

export default function Wishlist({ onUpdate }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!isAuthenticated) { setLoading(false); return; }
    WishlistAPI.list()
      .then(({ data }) => {
        const list = data.results || data || [];
        setItems(list);
        if (onUpdate) onUpdate(list.length);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const remove = async (id) => {
    try { await WishlistAPI.remove(id); toast.success('Removed'); load(); }
    catch { toast.error('Error'); }
  };

  const moveToCart = async (productId, wishId) => {
    try { await CartAPI.add(productId); await WishlistAPI.remove(wishId); toast.success('Moved to cart'); load(); }
    catch { toast.error('Error'); }
  };

  if (!isAuthenticated) return <div className="page-container"><p className="empty">Please login to view wishlist</p></div>;
  if (loading) return <div className="page-container"><p className="loading">Loading...</p></div>;

  return (
    <div className="page-container">
      <h2 className="page-heading">My Wishlist</h2>
      {items.length === 0 ? (
        <p className="empty">Wishlist is empty</p>
      ) : (
        <div className="product-grid">
          {items.map((item) => {
            const p = item.product_detail || {};
            const img = p.display_image || p.image_url || '';
            return (
              <div key={item.id} style={{ background: 'white', padding: 15, borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <img src={img} alt={p.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 6 }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/200x160?text=No+Image'; }} />
                <h4 style={{ margin: '10px 0 5px', fontSize: '0.9rem' }}>{p.name}</h4>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 10 }}>₹{p.price}</div>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 6 }} onClick={() => moveToCart(p.id, item.id)}>Move to Cart</button>
                <button className="btn btn-red" style={{ width: '100%' }} onClick={() => remove(item.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}
      <button className="btn btn-gray" style={{ maxWidth: 200, marginTop: 20 }} onClick={() => navigate('/')}>Back to Shop</button>
    </div>
  );
}
