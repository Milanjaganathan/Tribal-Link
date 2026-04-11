import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const img = product.display_image || product.image_url || product.image || '';
  const price = parseFloat(product.price);
  const fmtPrice = price % 1 === 0 ? price.toLocaleString('en-IN') : price.toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const hasDiscount = product.compare_price && parseFloat(product.compare_price) > price;

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="card-image-wrap">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300/f5e6d0/8b5e3c?text=Tribal+Art'; }}
        />
        {product.is_featured && <span className="card-badge">✦ Featured</span>}
        {hasDiscount && (
          <span className="discount-badge">-{product.discount_percentage}%</span>
        )}
      </div>
      <div className="card-body">
        {product.category?.name && (
          <span className="card-category">{product.category.name}</span>
        )}
        <h4>{product.name}</h4>
        {product.seller?.shop_name && (
          <span className="card-seller">by {product.seller.shop_name}</span>
        )}
        <div className="card-price-row">
          <span className="product-price">₹{fmtPrice}</span>
          {hasDiscount && (
            <div className="product-compare">
              <span className="old-price">₹{parseFloat(product.compare_price).toLocaleString('en-IN')}</span>
              <span className="discount">{product.discount_percentage}% off</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
