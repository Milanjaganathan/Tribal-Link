import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '', password: '', password2: '', username: '',
    first_name: '', last_name: '', phone: '', role: 'customer',
  });

  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.first_name}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Passwords do not match'); return; }
    if (!form.email || !form.username || !form.password) { toast.error('Fill required fields'); return; }
    setLoading(true);
    try {
      const data = await register(form);
      toast.success(`Welcome, ${data.user.first_name}!`);
      navigate('/');
    } catch (err) {
      const msg = err.response?.data;
      toast.error(msg ? Object.values(msg).flat().join(', ') : 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>{isRegister ? 'Create Account' : 'User Login'}</h2>

        {!isRegister ? (
          <form onSubmit={handleLogin}>
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => set('password', e.target.value)} />
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Continue'}
            </button>
            <p className="auth-switch">
              New to TribalLink? <span onClick={() => setIsRegister(true)}>Create an account</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="form-row">
              <input placeholder="First Name" value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              <input placeholder="Last Name" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
            <input placeholder="Username" value={form.username} onChange={(e) => set('username', e.target.value)} />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => set('email', e.target.value)} />
            <input placeholder="Phone Number" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <input type="password" placeholder="Password (min 8 chars)" value={form.password} onChange={(e) => set('password', e.target.value)} />
            <input type="password" placeholder="Confirm Password" value={form.password2} onChange={(e) => set('password2', e.target.value)} />
            <select value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="customer">Customer</option>
              <option value="seller">Seller / Artisan</option>
            </select>
            <button className="btn btn-green" type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Register'}
            </button>
            <p className="auth-switch">
              Already have an account? <span onClick={() => setIsRegister(false)}>Login</span>
            </p>
          </form>
        )}
        <Link to="/" className="btn btn-gray" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>Back to Home</Link>
      </div>
    </div>
  );
}
