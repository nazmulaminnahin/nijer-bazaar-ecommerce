import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { formatTaka } from '@/lib/utils';
import { toast, Toaster } from '@/components/ui/toast';
import api from '@/services/api';

const districts = [
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Sylhet', 'Barishal',
  'Rangpur', 'Mymensingh', 'Gazipur', 'Narayanganj', 'Comilla', 'Bogura',
];

const paymentMethods = [
  { value: 'cod', label: 'Cash on Delivery (COD)', emoji: '💵', desc: 'Pay when you receive' },
  { value: 'bkash', label: 'bKash', emoji: '📱', desc: 'Pay via bKash mobile banking' },
  { value: 'nagad', label: 'Nagad', emoji: '📱', desc: 'Pay via Nagad mobile banking' },
];

export default function CheckoutPage() {
  const { items, totalPrice, discount, clearCart, appliedCoupon } = useCartStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [address, setAddress] = useState({
    name: '', phone: '', address: '', city: '', district: 'Dhaka', postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const shippingCost = address.district === 'Dhaka' ? 60 : 120;
  const finalTotal = totalPrice - discount + shippingCost;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!address.name) newErrors.name = 'Name is required';
    if (!address.phone) newErrors.phone = 'Phone is required';
    else if (!/^01[3-9]\d{8}$/.test(address.phone)) newErrors.phone = 'Invalid Bangladesh phone number';
    if (!address.address) newErrors.address = 'Address is required';
    if (!address.city) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setIsLoading(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        variant: item.selectedVariant,
      }));

      const res = await api.post('/orders', {
        items: orderItems,
        shippingAddress: address,
        paymentMethod,
        couponCode: appliedCoupon || undefined,
        notes,
      });

      if (res.data.success) {
        setOrderNumber(res.data.data.orderNumber);
        clearCart();
        setIsOrderPlaced(true);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Order Success Screen
  if (isOrderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg border p-10 max-w-md w-full text-center mx-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-4">Your order has been placed successfully.</p>
          <div className="bg-orange-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">Order Number</p>
            <p className="text-xl font-bold text-orange-500 mt-1">{orderNumber}</p>
            <p className="text-xs text-gray-400 mt-1">Save this for tracking your order</p>
          </div>
          <div className="text-sm text-gray-500 mb-6 space-y-1">
            <p>💳 Payment: {paymentMethod.toUpperCase()}</p>
            <p>🚚 {address.district === 'Dhaka' ? 'Delivery in 1-2 days' : 'Delivery in 3-5 days'}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={() => navigate('/track?orderNumber=' + orderNumber)}>
              Track Order
            </Button>
            <Button variant="brand" className="flex-1 rounded-full" onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
                📦 Shipping Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  placeholder="Recipient's full name"
                  value={address.name}
                  onChange={(e) => setAddress(prev => ({ ...prev, name: e.target.value }))}
                  error={errors.name}
                />
                <Input
                  label="Phone Number *"
                  placeholder="01XXXXXXXXX"
                  value={address.phone}
                  onChange={(e) => setAddress(prev => ({ ...prev, phone: e.target.value }))}
                  error={errors.phone}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Full Address *"
                    placeholder="House no, Road, Area"
                    value={address.address}
                    onChange={(e) => setAddress(prev => ({ ...prev, address: e.target.value }))}
                    error={errors.address}
                  />
                </div>
                <Input
                  label="City *"
                  placeholder="Your city"
                  value={address.city}
                  onChange={(e) => setAddress(prev => ({ ...prev, city: e.target.value }))}
                  error={errors.city}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                  <select
                    value={address.district}
                    onChange={(e) => setAddress(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <Input
                  label="Postal Code"
                  placeholder="Optional"
                  value={address.postalCode}
                  onChange={(e) => setAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">💳 Payment Method</h2>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === method.value
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method.value}
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value)}
                      className="text-orange-500"
                    />
                    <span className="text-2xl">{method.emoji}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{method.label}</p>
                      <p className="text-gray-500 text-xs">{method.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Order Notes (Optional)</h2>
              <textarea
                rows={3}
                placeholder="Any special instructions for your order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-xl border shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-5">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-1">{item.product.name} × {item.quantity}</span>
                    <span className="text-gray-800 font-medium ml-2 flex-shrink-0">
                      {formatTaka(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatTaka(totalPrice)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatTaka(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Shipping ({address.district})</span>
                  <span>{formatTaka(shippingCost)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-500">{formatTaka(finalTotal)}</span>
                </div>
              </div>

              <Button
                variant="brand"
                size="lg"
                className="w-full mt-5 rounded-full font-bold"
                onClick={handlePlaceOrder}
                disabled={isLoading || items.length === 0}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin" /> Placing Order...
                  </span>
                ) : (
                  `Place Order — ${formatTaka(finalTotal)}`
                )}
              </Button>

              <p className="text-xs text-gray-400 text-center mt-3">
                By placing order, you agree to our Terms & Conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}