import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartAPI, WishlistAPI } from './services/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Checkout from './pages/Checkout';
import Seller from './pages/Seller';
import Search from './pages/Search';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import OrderDetail from './pages/OrderDetail';
import './App.css';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishCount, setWishCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      CartAPI.list().then(({ data }) => setCartCount(data.total_items || 0)).catch(() => {});
      WishlistAPI.list().then(({ data }) => setWishCount((data.results || data || []).length)).catch(() => {});
    } else {
      setCartCount(0);
      setWishCount(0);
    }
  }, [isAuthenticated]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar cartCount={cartCount} wishCount={wishCount} />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart onUpdate={setCartCount} />} />
          <Route path="/wishlist" element={<Wishlist onUpdate={setWishCount} />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order/:id" element={<OrderDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/seller" element={<Seller />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 2500,
            style: {
              background: 'var(--gray-800)',
              color: 'white',
              borderRadius: 'var(--radius-md)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-lg)',
            },
            success: {
              iconTheme: { primary: '#16a34a', secondary: 'white' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: 'white' },
            },
          }}
        />
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
