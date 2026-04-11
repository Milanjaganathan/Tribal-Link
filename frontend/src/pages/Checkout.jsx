import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FaTruck, FaMoneyBillWave, FaCreditCard, FaUniversity, FaQrcode, FaCheckCircle } from 'react-icons/fa';
import './Login.css';

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showUpiQR, setShowUpiQR] = useState(false);
  const [form, setForm] = useState({
    shipping_name: '', shipping_phone: '', shipping_address: '',
    shipping_city: '', shipping_state: '', shipping_pincode: '',
    payment_method: 'cod', upi_id: '', bank_name: '', account_number: '', ifsc_code: '',
  });

  const set = (k, v) => setForm({ ...form, [k]: v });

  const placeOrder = async (e) => {
    e.preventDefault();
    const { shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode } = form;
    if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_state || !shipping_pincode) {
      toast.error('Fill all shipping details'); return;
    }
    if (form.payment_method === 'upi' && !form.upi_id) {
      toast.error('Enter UPI ID'); return;
    }
    setLoading(true);
    try {
      const { data } = await OrdersAPI.create({
        payment_method: form.payment_method,
        shipping_name, shipping_phone, shipping_address,
        shipping_city, shipping_state, shipping_pincode,
      });

      if (form.payment_method !== 'cod') {
        const payData = { method: form.payment_method };
        if (form.payment_method === 'upi') payData.upi_id = form.upi_id;
        if (form.payment_method === 'bank_transfer') {
          payData.bank_name = form.bank_name;
          payData.account_number = form.account_number;
          payData.ifsc_code = form.ifsc_code;
        }
        await OrdersAPI.pay(data.order_id, payData);
      }
      toast.success('🎉 Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) { navigate('/login'); return null; }

  const paymentMethods = [
    { value: 'cod', label: 'Cash on Delivery', icon: <FaMoneyBillWave />, desc: 'Pay when you receive your order' },
    { value: 'upi', label: 'UPI Payment', icon: <FaCreditCard />, desc: 'Pay via UPI apps like GPay, PhonePe' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <FaUniversity />, desc: 'Direct bank transfer (NEFT/RTGS)' },
  ];

  // UPI QR placeholder — in production, use a QR generation library
  const upiPayLink = `upi://pay?pa=triballink@upi&pn=TribalLink&cu=INR`;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 600 }}>
        <h2>✦ Checkout</h2>

        <form onSubmit={placeOrder}>
          {/* Shipping Details */}
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaTruck style={{ color: 'var(--primary-light)' }} /> Shipping Details
          </p>
          <input placeholder="Full Name" value={form.shipping_name} onChange={(e) => set('shipping_name', e.target.value)} />
          <input placeholder="Phone Number" value={form.shipping_phone} onChange={(e) => set('shipping_phone', e.target.value)} />
          <textarea placeholder="Full Address (with pincode area)" value={form.shipping_address} onChange={(e) => set('shipping_address', e.target.value)}
            style={{ width: '100%', padding: 14, margin: '6px 0', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', minHeight: 80, background: 'var(--gray-50)', fontSize: '0.9rem', resize: 'vertical' }} />
          <div className="form-row">
            <input placeholder="City" value={form.shipping_city} onChange={(e) => set('shipping_city', e.target.value)} />
            <input placeholder="State" value={form.shipping_state} onChange={(e) => set('shipping_state', e.target.value)} />
          </div>
          <input placeholder="PIN Code" value={form.shipping_pincode} onChange={(e) => set('shipping_pincode', e.target.value)} />

          {/* Payment Method */}
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 24, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaCreditCard style={{ color: 'var(--primary-light)' }} /> Payment Method
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            {paymentMethods.map((pm) => (
              <label key={pm.value} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: form.payment_method === pm.value ? '2px solid var(--primary-light)' : '1.5px solid var(--gray-200)',
                background: form.payment_method === pm.value ? 'var(--forest-50)' : 'white',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <input type="radio" name="payment" value={pm.value} checked={form.payment_method === pm.value}
                  onChange={(e) => { set('payment_method', e.target.value); setShowUpiQR(false); }}
                  style={{ width: 'auto', margin: 0, accentColor: 'var(--primary)' }} />
                <span style={{ color: form.payment_method === pm.value ? 'var(--primary)' : 'var(--gray-400)', fontSize: '1.2rem', flexShrink: 0 }}>{pm.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{pm.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{pm.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* UPI Payment Section */}
          {form.payment_method === 'upi' && (
            <div style={{
              padding: 'var(--space-lg)', background: '#f0faf3',
              borderRadius: 'var(--radius-md)', border: '1px solid var(--forest-200)',
              marginBottom: 12,
            }}>
              <input placeholder="Enter UPI ID (e.g. name@upi, name@gpay)" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)}
                style={{ marginBottom: 12 }} />

              {/* UPI QR Code Section */}
              <div style={{ textAlign: 'center' }}>
                <button type="button" onClick={() => setShowUpiQR(!showUpiQR)}
                  style={{
                    background: 'none', border: '1.5px solid var(--primary-light)',
                    borderRadius: 'var(--radius-md)', padding: '10px 20px',
                    color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                    fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                  }}>
                  <FaQrcode /> {showUpiQR ? 'Hide QR Code' : 'Show UPI QR Code'}
                </button>

                {showUpiQR && (
                  <div style={{
                    marginTop: 16, padding: 'var(--space-lg)',
                    background: 'white', borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--gray-200)',
                    display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                    animation: 'fadeInUp 0.3s var(--ease-out)',
                  }}>
                    {/* QR Code Placeholder — shows UPI intent */}
                    <div style={{
                      width: 200, height: 200, background: 'var(--gray-50)',
                      borderRadius: 'var(--radius-md)', border: '2px dashed var(--gray-300)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 8,
                    }}>
                      <FaQrcode style={{ fontSize: '3rem', color: 'var(--gray-400)' }} />
                      <span style={{ fontSize: '0.72rem', color: 'var(--gray-400)', textAlign: 'center', padding: '0 12px' }}>
                        Scan with any UPI app to pay
                      </span>
                    </div>
                    <div style={{
                      background: 'var(--forest-50)', padding: '10px 20px',
                      borderRadius: 'var(--radius-md)', border: '1px solid var(--forest-200)',
                      fontSize: '0.85rem', fontWeight: 600, color: 'var(--forest-700)',
                    }}>
                      UPI ID: <strong>triballink@upi</strong>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', maxWidth: 240, textAlign: 'center' }}>
                      After payment, enter your UPI ID above and place the order. Payment will be verified automatically.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bank Transfer Section */}
          {form.payment_method === 'bank_transfer' && (
            <div style={{
              padding: 'var(--space-lg)', background: '#f5f3ff',
              borderRadius: 'var(--radius-md)', border: '1px solid #ddd6fe',
              marginBottom: 12,
            }}>
              <div style={{
                background: 'white', padding: 'var(--space-md)',
                borderRadius: 'var(--radius-sm)', border: '1px solid #e0e7ff',
                marginBottom: 12, fontSize: '0.85rem',
              }}>
                <p style={{ fontWeight: 600, marginBottom: 4, color: 'var(--gray-700)' }}>Transfer to:</p>
                <p style={{ color: 'var(--gray-600)' }}>Bank: <strong>State Bank of India</strong></p>
                <p style={{ color: 'var(--gray-600)' }}>A/C: <strong>1234 5678 9012</strong></p>
                <p style={{ color: 'var(--gray-600)' }}>IFSC: <strong>SBIN0001234</strong></p>
                <p style={{ color: 'var(--gray-600)' }}>Name: <strong>TribalLink Marketplace</strong></p>
              </div>
              <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Bank Details (for verification)
              </p>
              <input placeholder="Your Bank Name" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />
              <input placeholder="Your Account Number" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} />
              <input placeholder="IFSC Code" value={form.ifsc_code} onChange={(e) => set('ifsc_code', e.target.value)} />
            </div>
          )}

          {/* COD Notice */}
          {form.payment_method === 'cod' && (
            <div style={{
              padding: '14px 18px', background: '#fef3c7',
              borderRadius: 'var(--radius-md)', border: '1px solid #fde68a',
              marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
              fontSize: '0.85rem', color: '#92400e',
            }}>
              <FaCheckCircle /> Pay with cash when the order is delivered to your doorstep.
            </div>
          )}

          <button className="btn btn-orange" type="submit" disabled={loading} style={{ width: '100%', marginTop: 16, padding: 16, fontSize: '1rem' }}>
            {loading ? 'Processing your order...' : '🎉 Place Order'}
          </button>
        </form>
        <button className="btn btn-gray" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/cart')}>← Back to Cart</button>
      </div>
    </div>
  );
}
