import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SearchAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import { FaSearch, FaArrowLeft } from 'react-icons/fa';

export default function Search() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    SearchAPI.search({ q })
      .then(({ data }) => { setProducts(data.products || []); setCount(data.count || 0); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="page-container">
      <button className="btn btn-gray" style={{ marginBottom: 'var(--space-lg)', padding: '8px 18px', fontSize: '0.82rem' }}
        onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>

      <h2 className="page-heading">
        <FaSearch style={{ fontSize: '0.9em', marginRight: 8, opacity: 0.5 }} />
        {count} results for "{q}"
      </h2>
      {loading ? (
        <div className="loading-screen">
          <div className="spinner"></div>
          <span>Searching artisan products...</span>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-4xl)' }}>
          <div style={{ fontSize: '4rem', marginBottom: 16, opacity: 0.3 }}>🔍</div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gray-600)', marginBottom: 8 }}>No results found</h3>
          <p style={{ color: 'var(--gray-400)', marginBottom: 24 }}>Try different keywords or browse our categories</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Browse All Products</button>
        </div>
      ) : (
        <div className="product-grid stagger-children">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
