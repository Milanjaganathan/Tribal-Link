import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaHome, FaShoppingCart, FaHeart, FaBox, FaSearch, FaShop, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export default function Navbar({ cartCount = 0, wishCount = 0 }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        Tribal<span>Link</span>
      </Link>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search for unique tribal products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit"><FaSearch /></button>
      </form>

      <nav className="navbar-links">
        <Link to="/"><FaHome /> Home</Link>
        <Link to="/seller"><FaShop /> Seller Hub</Link>
        <Link to="/orders"><FaBox /> Orders</Link>
        <Link to="/wishlist" className="badge-link">
          <FaHeart /> Wishlist
          {wishCount > 0 && <span className="badge">{wishCount}</span>}
        </Link>
        <Link to="/cart" className="badge-link">
          <FaShoppingCart /> Cart
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </Link>

        {isAuthenticated ? (
          <button className="nav-auth" onClick={() => { logout(); navigate('/'); }}>
            <FaSignOutAlt /> {user?.first_name || 'Logout'}
          </button>
        ) : (
          <Link to="/login" className="nav-auth-link"><FaUser /> Login</Link>
        )}
      </nav>
    </header>
  );
}
