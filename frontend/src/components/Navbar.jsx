import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { FaHome, FaShoppingCart, FaHeart, FaBox, FaSearch, FaStore, FaUser, FaSignOutAlt, FaBell, FaUserCircle, FaCrown } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { NotificationsAPI } from '../services/api';
import './Navbar.css';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Navbar({ cartCount = 0, wishCount = 0 }) {
  const { user, logout, isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadUnreadCount = () => {
    NotificationsAPI.unreadCount()
      .then(({ data }) => setUnreadCount(data.unread_count || 0))
      .catch(() => {});
  };

  const toggleNotifications = () => {
    if (!showNotifs) {
      NotificationsAPI.list()
        .then(({ data }) => setNotifications(data.results || data || []))
        .catch(() => {});
    }
    setShowNotifs(!showNotifs);
  };

  const markAllRead = () => {
    NotificationsAPI.markAllRead()
      .then(() => { setUnreadCount(0); setNotifications(n => n.map(x => ({ ...x, is_read: true }))); })
      .catch(() => {});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const notifIcon = (type) => {
    if (type?.includes('order')) return '📦';
    if (type?.includes('payment')) return '💳';
    if (type?.includes('product')) return '🎨';
    if (type?.includes('seller')) return '🏪';
    if (type?.includes('review')) return '⭐';
    return '🔔';
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        Tribal<span>Link</span>
      </Link>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search handcrafted tribal products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit"><FaSearch /></button>
      </form>

      <nav className="navbar-links">
        <Link to="/"><FaHome /> <span>Home</span></Link>
        {(user?.role === 'admin' || user?.is_superuser) && (
          <Link to="/admin"><FaCrown /> <span>Admin</span></Link>
        )}
        <Link to="/seller"><FaStore /> <span>Sell</span></Link>
        <Link to="/orders"><FaBox /> <span>Orders</span></Link>
        <Link to="/wishlist" className="badge-link">
          <FaHeart /> <span>Wishlist</span>
          {wishCount > 0 && <span className="badge">{wishCount}</span>}
        </Link>
        <Link to="/cart" className="badge-link">
          <FaShoppingCart /> <span>Cart</span>
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </Link>

        {isAuthenticated && (
          <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button className="notification-btn" onClick={toggleNotifications} aria-label="Notifications">
              <FaBell />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            {showNotifs && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header">
                  <h4>Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead}>Mark all read</button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-empty">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => {
                          if (n.link) navigate(n.link);
                          setShowNotifs(false);
                        }}
                      >
                        <div className="notif-icon">{notifIcon(n.notification_type)}</div>
                        <div className="notif-content">
                          <div className="notif-title">{n.title}</div>
                          <div className="notif-message">{n.message}</div>
                          <div className="notif-time">{timeAgo(n.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {isAuthenticated ? (
          <>
            <Link to="/profile" className="nav-auth-link"><FaUserCircle /> <span>{user?.first_name || 'Profile'}</span></Link>
            <button className="nav-auth" onClick={() => { logout(); navigate('/'); }}>
              <FaSignOutAlt />
            </button>
          </>
        ) : (
          <Link to="/login" className="nav-auth-link"><FaUser /> Login</Link>
        )}
      </nav>
    </header>
  );
}
