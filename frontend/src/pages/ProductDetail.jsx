import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductsAPI, CartAPI, WishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProductsAPI.detail(id)
      .then(({ data }) => setProduct(data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const addToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    try { await CartAPI.add(product.id); toast.success('Added to cart!'); }
    catch { toast.error('Error adding to cart'); }
  };

  const addToWish = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    try { await WishlistAPI.add(product.id); toast.success('Added to wishlist!'); }
    catch (err) { toast.error(err.response?.data?.non_field_errors?.[0] || 'Already in wishlist'); }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!product) return <div className="empty">Product not found</div>;

  const img = product.display_image || product.image_url || product.image || '';
  const price = parseFloat(product.price);

  return (
    <div className="detail-container">
      <div className="detail-grid">
        <div className="detail-image">
          <img src={img} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'; }} />
        </div>
        <div className="detail-info">
          <h1>{product.name}</h1>
          <div className="detail-price">₹{price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}</div>
          {product.compare_price && (
            <div className="detail-compare">
              <span className="old">₹{product.compare_price}</span>
              <span className="off">{product.discount_percentage}% off</span>
            </div>
          )}
          <p className="detail-desc">{product.description}</p>
          <div className="detail-meta">
            <span>Category: {product.category?.name || 'N/A'}</span>
            <span>Stock: {product.stock}</span>
            <span>Seller: {product.seller?.shop_name || product.seller?.first_name || 'N/A'}</span>
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary" onClick={addToCart}>ADD TO CART</button>
            <button className="btn btn-orange" onClick={addToWish}>WISHLIST</button>
          </div>
          <button className="btn btn-gray" onClick={() => navigate('/')}>Back to Shop</button>
        </div>
      </div>
    </div>
  );
}
