import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ProductsAPI, CartAPI, WishlistAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaShoppingCart, FaHeart, FaArrowLeft, FaStar, FaBoxOpen, FaTag, FaUser, FaPhone, FaEnvelope, FaStore, FaCamera } from 'react-icons/fa';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    ProductsAPI.detail(id)
      .then(({ data }) => setProduct(data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
    loadReviews();
  }, [id]);

  const loadReviews = () => {
    ProductsAPI.reviews(id)
      .then(({ data }) => setReviews(data.results || data || []))
      .catch(() => {});
  };

  const addToCart = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    setAdding(true);
    try { await CartAPI.add(product.id); toast.success('Added to cart!'); }
    catch { toast.error('Error adding to cart'); }
    finally { setAdding(false); }
  };

  const addToWish = async () => {
    if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; }
    try { await WishlistAPI.add(product.id); toast.success('Added to wishlist!'); }
    catch (err) { toast.error(err.response?.data?.non_field_errors?.[0] || 'Already in wishlist'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) { toast.error('Please login to review'); navigate('/login'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a comment'); return; }
    setSubmittingReview(true);
    try {
      const fd = new FormData();
      fd.append('rating', reviewForm.rating);
      fd.append('comment', reviewForm.comment);
      const fileInput = document.getElementById('reviewImage');
      if (fileInput?.files[0]) fd.append('image', fileInput.files[0]);
      await ProductsAPI.addReview(id, fd);
      toast.success('Review submitted!');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      loadReviews();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Failed to submit review');
    } finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div><span>Loading product details...</span></div>;
  if (!product) return <div className="empty">Product not found</div>;

  const img = product.display_image || product.image_url || product.image || '';
  const price = parseFloat(product.price);
  const hasDiscount = product.compare_price && parseFloat(product.compare_price) > price;
  const seller = product.seller || {};

  return (
    <div className="detail-container">
      <div className="detail-breadcrumb">
        <Link to="/">Home</Link> / <Link to="/">Products</Link> / <span>{product.name}</span>
      </div>

      <div className="detail-grid">
        <div className="detail-image">
          <img src={img} alt={product.name} onError={(e) => { e.target.src = 'https://via.placeholder.com/500x400/f5e6d0/8b5e3c?text=Tribal+Art'; }} />
          {product.is_featured && <span className="detail-featured-tag">✦ Featured Artisan</span>}
        </div>

        <div className="detail-info">
          {product.category?.name && (
            <span className="detail-category">{product.category.name}</span>
          )}
          <h1>{product.name}</h1>

          {product.average_rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ color: 'var(--gold-500)', fontSize: '0.95rem' }}>{'★'.repeat(Math.round(product.average_rating))}{'☆'.repeat(5 - Math.round(product.average_rating))}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>{product.average_rating}/5 ({product.review_count || reviews.length} reviews)</span>
            </div>
          )}

          <div className="detail-price">₹{price % 1 === 0 ? price.toLocaleString('en-IN') : price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          {hasDiscount && (
            <div className="detail-compare">
              <span className="old">₹{parseFloat(product.compare_price).toLocaleString('en-IN')}</span>
              <span className="off">{product.discount_percentage}% off</span>
            </div>
          )}
          <p className="detail-desc">{product.description}</p>

          <div className="detail-meta">
            <span><FaTag /> Category: <strong>{product.category?.name || 'N/A'}</strong></span>
            <span><FaBoxOpen /> Stock: <strong>{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</strong></span>
            <span><FaStore /> Seller: <strong>{seller.shop_name || seller.first_name || 'N/A'}</strong></span>
            {product.average_rating && (
              <span><FaStar style={{ color: 'var(--gold-500)' }} /> Rating: <strong>{product.average_rating} / 5</strong></span>
            )}
          </div>

          {/* ═══ Seller Contact Info ═══ */}
          <div style={{
            padding: 'var(--space-md)', background: 'var(--earth-50)',
            borderRadius: 'var(--radius-md)', border: '1px solid var(--earth-100)',
            marginBottom: 'var(--space-lg)',
          }}>
            <h4 style={{ fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Seller Contact
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '0.88rem', color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaUser style={{ color: 'var(--primary-light)' }} /> {seller.first_name} {seller.last_name}
              </span>
              {seller.phone && (
                <a href={`tel:${seller.phone}`} style={{ fontSize: '0.88rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaPhone /> {seller.phone}
                </a>
              )}
              {seller.email && (
                <a href={`mailto:${seller.email}`} style={{ fontSize: '0.88rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FaEnvelope /> {seller.email}
                </a>
              )}
            </div>
          </div>

          <div className="detail-actions">
            <button className="btn btn-primary" onClick={addToCart} disabled={adding || product.stock === 0}>
              <FaShoppingCart /> {adding ? 'Adding...' : 'Add to Cart'}
            </button>
            <button className="btn btn-orange" onClick={addToWish}>
              <FaHeart /> Wishlist
            </button>
          </div>
          <button className="btn btn-gray" onClick={() => navigate('/')}><FaArrowLeft /> Back to Shop</button>
        </div>
      </div>

      {/* ═══ Reviews Section ═══ */}
      <div className="reviews-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3>Customer Reviews ({reviews.length})</h3>
          {isAuthenticated && (
            <button className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.82rem' }}
              onClick={() => setShowReviewForm(!showReviewForm)}>
              <FaStar /> {showReviewForm ? 'Cancel' : 'Write Review'}
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={submitReview} style={{
            padding: 'var(--space-lg)', background: 'var(--gray-50)',
            borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)',
            border: '1px solid var(--gray-100)', animation: 'fadeInUp 0.3s var(--ease-out)',
          }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--gray-600)', marginBottom: 6, display: 'block' }}>Rating</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', color: star <= reviewForm.rating ? 'var(--gold-500)' : 'var(--gray-300)', transition: 'transform 0.15s' }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >★</button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Share your experience with this product..."
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              style={{
                width: '100%', padding: 14, border: '1.5px solid var(--gray-200)',
                borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)',
                minHeight: 100, fontSize: '0.9rem', resize: 'vertical',
                background: 'white',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: 'var(--gray-500)', cursor: 'pointer', padding: '8px 12px', border: '1.5px dashed var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'white' }}>
                <FaCamera /> Attach Photo
                <input type="file" id="reviewImage" accept="image/*" style={{ display: 'none' }} />
              </label>
              <button className="btn btn-green" type="submit" disabled={submittingReview} style={{ padding: '10px 24px', fontSize: '0.88rem' }}>
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}

        {reviews.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 'var(--space-lg)' }}>No reviews yet. Be the first to review!</p>
        ) : reviews.map((r, i) => (
          <div key={i} className="review-card">
            <div className="review-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 'var(--radius-full)',
                  background: 'linear-gradient(135deg, var(--forest-100), var(--earth-100))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.8rem', color: 'var(--forest-700)',
                }}>
                  {(r.user?.first_name?.[0] || 'U').toUpperCase()}
                </div>
                <span className="review-author">{r.user?.first_name || 'Customer'} {r.user?.last_name?.[0] ? r.user.last_name[0] + '.' : ''}</span>
              </div>
              <span className="review-rating">{'★'.repeat(r.rating || 0)}{'☆'.repeat(5 - (r.rating || 0))}</span>
            </div>
            <p className="review-text">{r.comment}</p>
            {r.image && (
              <img src={r.image} alt="Review" style={{ maxWidth: 200, borderRadius: 'var(--radius-sm)', marginTop: 8, border: '1px solid var(--gray-100)' }} />
            )}
            {r.created_at && <div className="review-date">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
