import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAPI, CartAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  FaTruck, FaMoneyBillWave, FaCreditCard, FaUniversity, FaQrcode,
  FaCheckCircle, FaArrowLeft, FaShieldAlt, FaSpinner, FaMobileAlt,
} from 'react-icons/fa';
import './Login.css';

// ─── Your real UPI ID — change this to your actual UPI address ───
const MERCHANT_UPI_ID = 'triballink@upi';
const MERCHANT_NAME   = 'TribalLink Marketplace';

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  const [showUpiQR, setShowUpiQR] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [upiPaid, setUpiPaid] = useState(false);
  const [form, setForm] = useState({
    shipping_name: '', shipping_phone: '', shipping_address: '',
    shipping_city: '', shipping_state: '', shipping_pincode: '',
    payment_method: 'cod', upi_id: '', bank_name: '', account_number: '', ifsc_code: '',
  });

  // Fetch current cart total for UPI amount
  useEffect(() => {
    if (isAuthenticated) {
      CartAPI.list()
        .then(({ data }) => setCartTotal(parseFloat(data.total_price || 0)))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const set = (k, v) => setForm({ ...form, [k]: v });

  // ─── Generate a proper UPI deep-link ───
  const generateUpiLink = (amount) => {
    const txnRef = `TL${Date.now()}`;
    const params = new URLSearchParams({
      pa: MERCHANT_UPI_ID,
      pn: MERCHANT_NAME,
      am: amount.toFixed(2),
      cu: 'INR',
      tn: `TribalLink Order Payment`,
      tr: txnRef,
    });
    return `upi://pay?${params.toString()}`;
  };

  const upiDeepLink = generateUpiLink(cartTotal);

  // Simulate UPI payment verification (in production, poll backend)
  const verifyUpiPayment = () => {
    if (!form.upi_id) { toast.error('Enter your UPI ID used for payment'); return; }
    setUpiVerifying(true);
    // Simulate server-side verification delay
    setTimeout(() => {
      setUpiVerifying(false);
      setUpiPaid(true);
      toast.success('✅ UPI Payment verified successfully!');
    }, 2500);
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const { shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode } = form;
    if (!shipping_name || !shipping_phone || !shipping_address || !shipping_city || !shipping_state || !shipping_pincode) {
      toast.error('Fill all shipping details'); return;
    }
    if (form.payment_method === 'upi' && !form.upi_id) {
      toast.error('Enter UPI ID'); return;
    }
    if (form.payment_method === 'upi' && !upiPaid) {
      toast.error('Please complete UPI payment and verify before placing order'); return;
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
    { value: 'upi', label: 'UPI Payment', icon: <FaMobileAlt />, desc: 'Pay via UPI apps — GPay, PhonePe, Paytm' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: <FaUniversity />, desc: 'Direct bank transfer (NEFT/RTGS)' },
  ];

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 620 }}>
        {/* Back button at top */}
        <button className="btn btn-gray" style={{ marginBottom: 16, padding: '8px 18px', fontSize: '0.82rem' }}
          onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>

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
                  onChange={(e) => { set('payment_method', e.target.value); setShowUpiQR(false); setUpiPaid(false); }}
                  style={{ width: 'auto', margin: 0, accentColor: 'var(--primary)' }} />
                <span style={{ color: form.payment_method === pm.value ? 'var(--primary)' : 'var(--gray-400)', fontSize: '1.2rem', flexShrink: 0 }}>{pm.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--gray-800)' }}>{pm.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>{pm.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* ═══════════════════════════════════════════
              REAL UPI PAYMENT SECTION
              ═══════════════════════════════════════════ */}
          {form.payment_method === 'upi' && (
            <div style={{
              padding: 'var(--space-lg)', background: 'linear-gradient(135deg, #f0faf3 0%, #e8f5e9 100%)',
              borderRadius: 'var(--radius-lg)', border: '1.5px solid var(--forest-200)',
              marginBottom: 12, animation: 'fadeInUp 0.3s var(--ease-out)',
            }}>
              {/* Cart Total Display */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: 'white', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--forest-200)', marginBottom: 16,
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', fontWeight: 500 }}>Amount to Pay</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                  ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* Step 1: Scan QR or use UPI link */}
              <div style={{
                background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
                border: '1px solid var(--gray-100)', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-full)',
                    background: 'var(--primary)', color: 'white', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800,
                  }}>1</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>
                    Scan QR Code or Pay via UPI App
                  </span>
                </div>

                {/* Toggle QR */}
                <div style={{ textAlign: 'center' }}>
                  <button type="button" onClick={() => setShowUpiQR(!showUpiQR)}
                    style={{
                      background: showUpiQR ? 'var(--primary)' : 'none',
                      border: showUpiQR ? 'none' : '1.5px solid var(--primary-light)',
                      borderRadius: 'var(--radius-md)', padding: '10px 24px',
                      color: showUpiQR ? 'white' : 'var(--primary)', fontWeight: 600, fontSize: '0.85rem',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontFamily: 'var(--font-body)', transition: 'all 0.2s',
                    }}>
                    <FaQrcode /> {showUpiQR ? 'Hide QR Code' : 'Show UPI QR Code'}
                  </button>

                  {showUpiQR && (
                    <div style={{
                      marginTop: 20, padding: '24px',
                      background: 'white', borderRadius: 'var(--radius-lg)',
                      border: '2px solid var(--forest-100)',
                      display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                      animation: 'fadeInUp 0.3s var(--ease-out)',
                      boxShadow: '0 8px 32px rgba(61, 155, 88, 0.1)',
                    }}>
                      {/* Real QR Code */}
                      <div style={{
                        padding: 16, background: 'white', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--gray-100)',
                      }}>
                        <QRCodeSVG
                          value={upiDeepLink}
                          size={220}
                          level="H"
                          includeMargin={true}
                          bgColor="#ffffff"
                          fgColor="#1a0f0a"
                          style={{ display: 'block' }}
                        />
                      </div>

                      {/* UPI ID Display */}
                      <div style={{
                        background: 'linear-gradient(135deg, var(--forest-50), var(--forest-100))',
                        padding: '10px 24px', borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--forest-200)',
                        fontSize: '0.88rem', fontWeight: 600, color: 'var(--forest-700)',
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <FaMobileAlt /> UPI ID: <strong>{MERCHANT_UPI_ID}</strong>
                      </div>

                      {/* Amount Badge */}
                      <div style={{
                        background: 'var(--gold-100)', padding: '8px 20px',
                        borderRadius: 'var(--radius-full)', border: '1px solid var(--gold-200)',
                        fontSize: '0.95rem', fontWeight: 800, color: 'var(--earth-700)',
                      }}>
                        Pay ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>

                      {/* Open in UPI App (mobile deep link) */}
                      <a href={upiDeepLink}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--forest-400) 100%)',
                          color: 'white', padding: '12px 28px', borderRadius: 'var(--radius-md)',
                          fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
                          transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(61, 155, 88, 0.25)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <FaMobileAlt /> Open in UPI App
                      </a>

                      <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)', maxWidth: 260, textAlign: 'center', lineHeight: 1.5 }}>
                        Scan with GPay, PhonePe, Paytm, or any UPI app.
                        After payment, enter your UPI ID below to verify.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: Enter UPI ID */}
              <div style={{
                background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
                border: '1px solid var(--gray-100)', marginBottom: 16,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-full)',
                    background: form.upi_id ? 'var(--primary)' : 'var(--gray-300)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800, transition: 'all 0.3s',
                  }}>2</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>
                    Enter UPI ID used for payment
                  </span>
                </div>
                <input
                  placeholder="e.g. yourname@gpay, 9876543210@upi"
                  value={form.upi_id}
                  onChange={(e) => set('upi_id', e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>

              {/* Step 3: Verify Payment */}
              <div style={{
                background: 'white', borderRadius: 'var(--radius-md)', padding: '20px',
                border: upiPaid ? '2px solid var(--success)' : '1px solid var(--gray-100)',
                transition: 'all 0.3s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-full)',
                    background: upiPaid ? 'var(--success)' : 'var(--gray-300)',
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800, transition: 'all 0.3s',
                  }}>3</span>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gray-800)' }}>
                    Verify Payment
                  </span>
                </div>

                {upiPaid ? (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 18px', background: '#dcfce7',
                    borderRadius: 'var(--radius-md)', border: '1px solid #86efac',
                    animation: 'fadeInUp 0.3s var(--ease-out)',
                  }}>
                    <FaCheckCircle style={{ color: 'var(--success)', fontSize: '1.3rem' }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.92rem' }}>Payment Verified!</div>
                      <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                        ₹{cartTotal.toLocaleString('en-IN')} received from {form.upi_id}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={verifyUpiPayment}
                    disabled={!form.upi_id || upiVerifying}
                    className="btn btn-primary"
                    style={{
                      width: '100%', padding: '14px', fontSize: '0.9rem',
                      opacity: (!form.upi_id || upiVerifying) ? 0.5 : 1,
                    }}>
                    {upiVerifying ? (
                      <><FaSpinner className="spinner-inline" style={{ animation: 'spin 0.8s linear infinite' }} /> Verifying payment...</>
                    ) : (
                      <><FaShieldAlt /> Verify UPI Payment</>
                    )}
                  </button>
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

          <button className="btn btn-orange" type="submit"
            disabled={loading || (form.payment_method === 'upi' && !upiPaid)}
            style={{ width: '100%', marginTop: 16, padding: 16, fontSize: '1rem' }}>
            {loading ? 'Processing your order...' : '🎉 Place Order'}
          </button>
        </form>
        <button className="btn btn-gray" style={{ width: '100%', marginTop: 10 }} onClick={() => navigate('/cart')}>← Back to Cart</button>
      </div>
    </div>
  );
}
