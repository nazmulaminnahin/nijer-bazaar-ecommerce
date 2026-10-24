import { useState } from 'react';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTaka, formatDateTime } from '@/lib/utils';
import api from '@/services/api';

const orderStatuses = [
  { key: 'pending', label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, color: 'text-blue-500' },
  { key: 'processing', label: 'Processing', icon: Package, color: 'text-purple-500' },
  { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-500' },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'text-green-500' },
];

interface OrderData {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: string | number;
  shippingAddress: { name: string; phone: string; address: string; city: string; district: string };
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  items: { id: number; productName: string; quantity: number; price: string | number }[];
  timeline: { id: number; status: string; note?: string; createdAt: string }[];
}

export default function OrderTrackingPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;

    setIsLoading(true);
    setError('');
    setOrderData(null);

    try {
      const res = await api.get(`/orders/track?orderNumber=${orderNumber.trim().toUpperCase()}`);
      if (res.data.success) {
        setOrderData(res.data.data);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Order not found. Please check your order number.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStatusIndex = orderStatuses.findIndex(s => s.key === orderData?.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Track Your Order</h1>
          <p className="text-orange-100 text-lg mb-8">
            Enter your order number to see real-time status
          </p>

          <form onSubmit={handleTrack} className="max-w-lg mx-auto flex gap-2">
            <input
              type="text"
              placeholder="Enter order number (e.g. NB12345678)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="flex-1 px-5 py-3 rounded-full text-gray-800 text-sm outline-none"
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-gray-800 font-medium flex items-center gap-2"
            >
              <Search className="w-4 h-4" /> Track
            </Button>
          </form>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <X className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Order Result */}
        {orderData && (
          <div className="space-y-4">

            {/* Order Header */}
            <div className="bg-white rounded-xl border p-6">
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Order #{orderData.orderNumber}</h2>
                  <p className="text-gray-500 text-sm mt-1">Placed on {formatDateTime(orderData.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-orange-500">{formatTaka(Number(orderData.total))}</p>
                  <Badge
                    variant={orderData.paymentStatus === 'paid' ? 'delivered' : 'pending'}
                    className="mt-1"
                  >
                    Payment: {orderData.paymentStatus}
                  </Badge>
                </div>
              </div>

              {orderData.trackingNumber && (
                <div className="bg-blue-50 rounded-lg p-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    Tracking Number: <strong>{orderData.trackingNumber}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 mb-6">Order Status</h3>

              {/* Progress Bar */}
              <div className="relative mb-8">
                <div className="flex justify-between items-center relative z-10">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;

                    return (
                      <div key={status.key} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${
                          isCompleted
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'bg-white border-gray-200 text-gray-300'
                        } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}>
                          <status.icon className="w-4 h-4" />
                        </div>
                        <span className={`text-xs font-medium text-center ${isCompleted ? 'text-orange-600' : 'text-gray-400'}`}>
                          {status.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Connecting Line */}
                <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 -z-0">
                  <div
                    className="h-full bg-orange-500 transition-all duration-500"
                    style={{ width: `${(currentStatusIndex / (orderStatuses.length - 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Status History */}
              {orderData.timeline.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">History</h4>
                  <div className="space-y-3">
                    {orderData.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-1.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700 capitalize">{event.status}</span>
                          {event.note && <span className="text-gray-500"> — {event.note}</span>}
                          <p className="text-gray-400 text-xs">{formatDateTime(event.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatTaka(Number(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-500" /> Delivery Address
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-800">{orderData.shippingAddress.name}</p>
                <p>{orderData.shippingAddress.phone}</p>
                <p>{orderData.shippingAddress.address}</p>
                <p>{orderData.shippingAddress.city}, {orderData.shippingAddress.district}</p>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        {!orderData && !error && (
          <div className="text-center py-8">
            <div className="bg-white rounded-xl border p-8 max-w-md mx-auto">
              <Package className="w-16 h-16 mx-auto text-orange-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">How to track your order?</h3>
              <div className="text-sm text-gray-500 space-y-2 text-left">
                <p>1. Enter your Order Number (starts with NB)</p>
                <p>2. You can find it in your email confirmation</p>
                <p>3. Or check your profile → My Orders</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}