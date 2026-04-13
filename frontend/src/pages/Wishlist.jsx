import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WishlistAPI, CartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaTrash, FaArrowLeft, FaHeart } from 'react-icons/fa';

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
    try { await CartAPI.add(productId); await WishlistAPI.remove(wishId); toast.success('Moved to cart!'); load(); }
    catch { toast.error('Error'); }
  };

  if (!isAuthenticated) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: 'var(--space-4xl)', animation: 'fadeInUp 0.5s var(--ease-out) both' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>❤️</div>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-600)', marginBottom: 8 }}>Sign in to see your wishlist</h3>
        <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Save your favorite tribal pieces</p>
        <button className="btn btn-primary" onClick={() => navigate('/login')}>Sign In</button>
      </div>
    </div>
  );

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading wishlist...</span></div>;

  return (
    <div className="page-container">
      <h2 className="page-heading">My Wishlist</h2>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>❤️</div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-600)', marginBottom: 8 }}>Wishlist is empty</h3>
          <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Find something you love!</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}><FaHeart /> Browse Products</button>
        </div>
      ) : (
        <div className="product-grid stagger-children">
          {items.map((item) => {
            const p = item.product_detail || {};
            const img = p.display_image || p.image_url || '';
            return (
              <div key={item.id} style={{
                background: 'white', borderRadius: 'var(--radius-lg)',
                overflow: 'hidden', border: '1px solid var(--gray-100)',
                boxShadow: 'var(--shadow-sm)', transition: 'all 0.25s var(--ease-out)',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ overflow: 'hidden', aspectRatio: '4/3', background: 'var(--gray-50)', cursor: 'pointer' }}
                  onClick={() => navigate(`/product/${p.id}`)}>
                  <img src={img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.08)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/300x225/f5e6d0/8b5e3c?text=Tribal+Art'; }} />
                </div>
                <div style={{ padding: '16px' }}>
                  <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.92rem', fontWeight: 600, marginBottom: 4, color: 'var(--gray-800)', lineHeight: 1.35 }}>{p.name}</h4>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 12, color: 'var(--gray-900)' }}>
                    ₹{parseFloat(p.price).toLocaleString('en-IN')}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" style={{ flex: 1, padding: '10px 8px', fontSize: '0.8rem' }} onClick={() => moveToCart(p.id, item.id)}>
                      <FaShoppingCart /> Move to Cart
                    </button>
                    <button className="btn btn-red" style={{ padding: '10px 14px', fontSize: '0.8rem' }} onClick={() => remove(item.id)}>
                      <FaTrash />
                    </button>
                  </div>
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
