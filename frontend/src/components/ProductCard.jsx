import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const img = product.display_image || product.image_url || product.image || '';
  const price = parseFloat(product.price);
  const fmtPrice = price % 1 === 0 ? price.toFixed(0) : price.toFixed(2);

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <img
        src={img}
        alt={product.name}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/200x160?text=No+Image'; }}
      />
      <h4>{product.name}</h4>
      <div className="product-price">₹{fmtPrice}</div>
      {product.compare_price && (
        <div className="product-compare">
          <span className="old-price">₹{product.compare_price}</span>
          <span className="discount">{product.discount_percentage}% off</span>
        </div>
      )}
    </Link>
  );
}
