import { useState, useEffect } from 'react';
import { ProductsAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import './Home.css';

export default function Home() {
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
    <div className="home-layout">
      <aside className="sidebar">
        <h3 className="sidebar-title">CATEGORIES</h3>
        <div
          className={`cat-btn ${activeCat === null ? 'active' : ''}`}
          onClick={() => loadProducts(null, 'All Products')}
        >
          All Products
        </div>
        {categories.map((c) => (
          <div
            key={c.id}
            className={`cat-btn ${activeCat === c.id ? 'active' : ''}`}
            onClick={() => loadProducts(c.id, c.name)}
          >
            {c.name} <span className="cat-count">({c.product_count})</span>
          </div>
        ))}
      </aside>

      <main className="main-content">
        <h2 className="page-title">{title}</h2>
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="empty">No products found</div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
