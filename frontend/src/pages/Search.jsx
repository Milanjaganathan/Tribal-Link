import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SearchAPI } from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    SearchAPI.search({ q })
      .then(({ data }) => { setProducts(data.products || []); setCount(data.count || 0); })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="page-container">
      <h2 className="page-heading">{count} results for "{q}"</h2>
      {loading ? (
        <p className="loading">Searching...</p>
      ) : products.length === 0 ? (
        <p className="empty">No products found for "{q}"</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
