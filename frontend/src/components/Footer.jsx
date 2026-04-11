import { Link } from 'react-router-dom';
import { FaHeart, FaInstagram, FaTwitter, FaFacebookF, FaYoutube } from 'react-icons/fa';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path d="M0,40 C360,100 720,0 1080,60 C1260,80 1380,40 1440,50 L1440,100 L0,100Z" fill="currentColor" />
        </svg>
      </div>

      <div className="footer-content">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3 className="footer-logo">Tribal<span>Link</span></h3>
            <p>Connecting tribal artisans with the world. Every purchase supports indigenous craftsmanship and preserves centuries of cultural heritage.</p>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Facebook"><FaFacebookF /></a>
              <a href="#" aria-label="YouTube"><FaYoutube /></a>
            </div>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/">All Products</Link>
            <Link to="/search?q=painting">Tribal Paintings</Link>
            <Link to="/search?q=jewelry">Handmade Jewelry</Link>
            <Link to="/search?q=textile">Textiles & Weaves</Link>
            <Link to="/search?q=pottery">Pottery & Ceramics</Link>
          </div>

          <div className="footer-col">
            <h4>Artisans</h4>
            <Link to="/seller">Sell on TribalLink</Link>
            <Link to="/seller">Artisan Dashboard</Link>
            <Link to="/">Success Stories</Link>
            <Link to="/">Community</Link>
          </div>

          <div className="footer-col">
            <h4>Support</h4>
            <Link to="/">Help Center</Link>
            <Link to="/">Track Order</Link>
            <Link to="/">Returns & Refunds</Link>
            <Link to="/">Contact Us</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TribalLink. Made with <FaHeart className="heart-icon" /> for tribal artisans.</p>
          <div className="footer-bottom-links">
            <Link to="/">Privacy Policy</Link>
            <Link to="/">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
