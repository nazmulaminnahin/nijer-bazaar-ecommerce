import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Tag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { formatTaka } from '@/lib/utils';
import api from '@/services/api';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, appliedCoupon, discount, applyCoupon, removeCoupon } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const shippingCost = totalPrice > 999 ? 0 : 60;
  const finalTotal = totalPrice - discount + shippingCost;

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput.toUpperCase(),
        orderAmount: totalPrice,
      });
      if (res.data.success) {
        applyCoupon(couponInput.toUpperCase(), res.data.data.discountAmount);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCouponError(error.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty!</h2>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Link to="/shop">
            <Button variant="brand" size="lg" className="rounded-full px-8">
              <ShoppingBag className="w-5 h-5 mr-2" /> Start Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Shopping Cart ({items.length} items)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border p-4 flex gap-4">
                {/* Image */}
                <Link to={`/product/${item.productId}`} className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {item.product.images?.[0]?.imageUrl ? (
                      <img src={item.product.images[0].imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.productId}`}>
                    <h3 className="font-medium text-gray-800 hover:text-orange-500 transition-colors line-clamp-2 mb-1">
                      {item.product.name}
                    </h3>
                  </Link>
                  {item.selectedVariant && (
                    <p className="text-xs text-gray-500 mb-2">Variant: {item.selectedVariant}</p>
                  )}
                  <p className="text-orange-500 font-bold mb-3">{formatTaka(item.price)}</p>

                  <div className="flex items-center justify-between">
                    {/* Quantity */}
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-4 py-1.5 font-medium text-sm">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Item Total + Remove */}
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-800">
                        {formatTaka(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Continue Shopping */}
            <Link to="/shop">
              <Button variant="outline" className="w-full">
                ← Continue Shopping
              </Button>
            </Link>
          </div>

          {/* Order Summary */}
          <div className="space-y-4">
            {/* Coupon */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4 text-orange-500" /> Coupon Code
              </h3>

              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                  <div>
                    <p className="text-green-700 font-medium text-sm">{appliedCoupon}</p>
                    <p className="text-green-600 text-xs">-{formatTaka(discount)} saved!</p>
                  </div>
                  <button onClick={removeCoupon} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      className="flex-1 px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
                    />
                    <Button
                      variant="brand"
                      size="sm"
                      onClick={handleApplyCoupon}
                      isLoading={couponLoading}
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-2">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-xl border p-4">
              <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.length} items)</span>
                  <span>{formatTaka(totalPrice)}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount</span>
                    <span>-{formatTaka(discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">FREE</span>
                    ) : (
                      formatTaka(shippingCost)
                    )}
                  </span>
                </div>

                {shippingCost > 0 && (
                  <p className="text-xs text-blue-500 bg-blue-50 p-2 rounded-lg">
                    💡 Add {formatTaka(999 - totalPrice)} more for free shipping!
                  </p>
                )}

                <div className="border-t pt-3 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-500">{formatTaka(finalTotal)}</span>
                </div>
              </div>

              <Button
                variant="brand"
                size="lg"
                className="w-full mt-4 rounded-full font-bold"
                onClick={handleCheckout}
              >
                Proceed to Checkout <ArrowRight className="ml-2 w-4 h-4" />
              </Button>

              {/* Payment Icons */}
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400 mb-2">Secure Payment Options</p>
                <div className="flex justify-center gap-2">
                  {['bKash', 'Nagad', 'COD'].map((m) => (
                    <span key={m} className="text-xs bg-gray-100 px-2 py-1 rounded">{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}