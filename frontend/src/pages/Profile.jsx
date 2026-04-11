import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthAPI, OrdersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FaUser, FaEnvelope, FaPhone, FaStore, FaBox, FaEdit, FaSave, FaArrowLeft } from 'react-icons/fa';
import './Login.css';

export default function Profile() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', shop_name: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        shop_name: user.shop_name || '',
      });
    }
    OrdersAPI.list()
      .then(({ data }) => { const list = data.results || data || []; setOrderCount(list.length); })
      .catch(() => {});
  }, [user, isAuthenticated]);

  const set = (k, v) => setForm({ ...form, [k]: v });

  const handleSave = async () => {
    setSaving(true);
    try {
      await AuthAPI.updateProfile(form);
      toast.success('Profile updated!');
      setEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    } finally { setSaving(false); }
  };

  if (!isAuthenticated) return null;

  const roleBadge = {
    admin: { bg: '#e0e7ff', color: '#3730a3', label: '👑 Admin' },
    seller: { bg: '#dcfce7', color: '#166534', label: '🎨 Artisan' },
    customer: { bg: '#fef3c7', color: '#92400e', label: '🛒 Customer' },
  };
  const badge = roleBadge[user?.role] || roleBadge.customer;

  return (
    <div className="page-container" style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(135deg, var(--forest-900), var(--earth-700))',
        borderRadius: 'var(--radius-xl)', padding: '40px 32px',
        color: 'white', marginBottom: 'var(--space-xl)',
        animation: 'fadeInUp 0.5s var(--ease-out) both',
        display: 'flex', alignItems: 'center', gap: 24,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--gold-500), var(--gold-300))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.8rem', color: 'var(--earth-900)', fontWeight: 700,
          flexShrink: 0, boxShadow: '0 4px 16px rgba(212, 160, 23, 0.3)',
        }}>
          {(user?.first_name?.[0] || 'U').toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', marginBottom: 4, color: 'white' }}>
            {user?.first_name} {user?.last_name}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>{user?.email}</p>
          <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{
              background: badge.bg, color: badge.color,
              padding: '4px 14px', borderRadius: 'var(--radius-full)',
              fontSize: '0.72rem', fontWeight: 700,
            }}>
              {badge.label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
              <FaBox style={{ marginRight: 4, fontSize: '0.75rem' }} /> {orderCount} orders
            </span>
          </div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="auth-card" style={{
        maxWidth: '100%',
        animation: 'fadeInUp 0.5s var(--ease-out) 0.1s both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 0 }}>✦ Profile Details</h2>
          {!editing ? (
            <button className="btn btn-outline" style={{ padding: '8px 18px', fontSize: '0.82rem' }} onClick={() => setEditing(true)}>
              <FaEdit /> Edit
            </button>
          ) : (
            <button className="btn btn-green" style={{ padding: '8px 18px', fontSize: '0.82rem' }} onClick={handleSave} disabled={saving}>
              <FaSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaUser /> First Name
              </label>
              {editing ? (
                <input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
              ) : (
                <p style={{ padding: '12px 0', fontWeight: 500, color: 'var(--gray-800)' }}>{user?.first_name || '—'}</p>
              )}
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'block' }}>
                Last Name
              </label>
              {editing ? (
                <input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
              ) : (
                <p style={{ padding: '12px 0', fontWeight: 500, color: 'var(--gray-800)' }}>{user?.last_name || '—'}</p>
              )}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaEnvelope /> Email
            </label>
            <p style={{ padding: '12px 0', fontWeight: 500, color: 'var(--gray-800)' }}>{user?.email}</p>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaPhone /> Phone
            </label>
            {editing ? (
              <input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Phone number" />
            ) : (
              <p style={{ padding: '12px 0', fontWeight: 500, color: 'var(--gray-800)' }}>{user?.phone || '—'}</p>
            )}
          </div>

          {(user?.role === 'seller' || editing) && (
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaStore /> Shop Name
              </label>
              {editing ? (
                <input value={form.shop_name} onChange={(e) => set('shop_name', e.target.value)} placeholder="Your shop name" />
              ) : (
                <p style={{ padding: '12px 0', fontWeight: 500, color: 'var(--gray-800)' }}>{user?.shop_name || '—'}</p>
              )}
            </div>
          )}
        </div>

        <div className="divider" />

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-gray" style={{ flex: 1 }} onClick={() => navigate('/')}>
            <FaArrowLeft /> Home
          </button>
          <button className="btn btn-red" style={{ flex: 1 }} onClick={() => { logout(); navigate('/'); }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
