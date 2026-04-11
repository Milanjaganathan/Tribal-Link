import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [title, setTitle] = useState('All Products');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProductsAPI.categories().then(({ data }) => setCategories(data)).catch(() => {});
    loadProducts();
  }, []);

  const loadProducts = (catId = null, catName = 'All Products') => {
    setLoading(true);
    setActiveCat(catId);
    setTitle(catName);
    const params = catId ? { category: catId } : { ordering: '-is_featured' };
    ProductsAPI.list(params)
      .then(({ data }) => setProducts(data.results || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-tag">✦ Authentic Handcrafted Art</div>
          <h1>Discover the Soul of <span>Tribal India</span></h1>
          <p>
            Explore hand-crafted masterpieces directly from India's tribal artisans.
            Every purchase preserves centuries of cultural heritage and empowers indigenous communities.
          </p>
          <div className="hero-actions">
            <button className="btn btn-gold" onClick={() => {
              document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Explore Collection
            </button>
            <button className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
              onClick={() => navigate('/seller')}>
              Become an Artisan
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-value">500+</div>
              <div className="stat-label">Artisan Products</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">50+</div>
              <div className="stat-label">Tribal Communities</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Category Pills ═══ */}
      <section className="categories-section">
        <div className="section-header">
          <h2>Browse Categories</h2>
        </div>
        <div className="category-pills">
          <div
            className={`cat-pill ${activeCat === null ? 'active' : ''}`}
            onClick={() => loadProducts(null, 'All Products')}
          >
            🎨 All
          </div>
          {categories.map((c) => (
            <div
              key={c.id}
              className={`cat-pill ${activeCat === c.id ? 'active' : ''}`}
              onClick={() => loadProducts(c.id, c.name)}
            >
              {c.name} <span className="cat-count">({c.product_count})</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Products Grid ═══ */}
      <section id="products-section" style={{ padding: '0 6%', maxWidth: 1400, margin: '0 auto' }}>
        <div className="section-header">
          <h2>{title}</h2>
        </div>
        {loading ? (
          <div className="loading-screen">
            <div className="spinner"></div>
            <span>Loading artisan products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="empty">No products found in this category</div>
        ) : (
          <div className="product-grid stagger-children" style={{ paddingBottom: 40 }}>
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
