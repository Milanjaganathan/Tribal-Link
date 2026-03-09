import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OrdersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Order failed');
    } finally { setLoading(false); }
  };

  if (!isAuthenticated) { navigate('/login'); return null; }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 560 }}>
        <h2 style={{ color: '#2d5a27', textAlign: 'center' }}>Checkout</h2>
        <form onSubmit={placeOrder}>
          <input placeholder="Full Name" value={form.shipping_name} onChange={(e) => set('shipping_name', e.target.value)} />
          <input placeholder="Phone Number" value={form.shipping_phone} onChange={(e) => set('shipping_phone', e.target.value)} />
          <textarea placeholder="Full Address" value={form.shipping_address} onChange={(e) => set('shipping_address', e.target.value)}
            style={{ width: '100%', padding: 12, margin: '8px 0', border: '1px solid #ddd', borderRadius: 6, fontFamily: 'inherit', minHeight: 80 }} />
          <div className="form-row">
            <input placeholder="City" value={form.shipping_city} onChange={(e) => set('shipping_city', e.target.value)} />
            <input placeholder="State" value={form.shipping_state} onChange={(e) => set('shipping_state', e.target.value)} />
          </div>
          <input placeholder="PIN Code" value={form.shipping_pincode} onChange={(e) => set('shipping_pincode', e.target.value)} />

          <select value={form.payment_method} onChange={(e) => set('payment_method', e.target.value)}>
            <option value="cod">Cash on Delivery</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>

          {form.payment_method === 'upi' && (
            <input placeholder="UPI ID (e.g. name@upi)" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} />
          )}
          {form.payment_method === 'bank_transfer' && (
            <>
              <input placeholder="Bank Name" value={form.bank_name} onChange={(e) => set('bank_name', e.target.value)} />
              <input placeholder="Account Number" value={form.account_number} onChange={(e) => set('account_number', e.target.value)} />
              <input placeholder="IFSC Code" value={form.ifsc_code} onChange={(e) => set('ifsc_code', e.target.value)} />
            </>
          )}

          <button className="btn btn-orange" type="submit" disabled={loading} style={{ width: '100%', marginTop: 15 }}>
            {loading ? 'Processing...' : 'Place Order'}
          </button>
        </form>
        <button className="btn btn-gray" onClick={() => navigate('/cart')}>Back to Cart</button>
      </div>
    </div>
  );
}
