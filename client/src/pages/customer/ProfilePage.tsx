import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Package, Heart, MapPin, Lock, LogOut, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import { formatTaka, formatDate } from '@/lib/utils';
import { toast, Toaster } from '@/components/ui/toast';
import api from '@/services/api';

const tabs = [
  { key: 'profile', label: 'My Profile', icon: User },
  { key: 'orders', label: 'My Orders', icon: Package },
  { key: 'wishlist', label: 'Wishlist', icon: Heart },
  { key: 'addresses', label: 'Addresses', icon: MapPin },
  { key: 'security', label: 'Security', icon: Lock },
];

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  total: string | number;
  createdAt: string;
  items: { productName: string; quantity: number }[];
}

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });

  const { user, setUser, logout } = useAuthStore();

  useEffect(() => {
    if (user) setProfileForm({ name: user.name, phone: user.phone });
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/orders/my');
      setOrders(res.data?.data || []);
    } catch {
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', profileForm);
      if (res.data.success && user) {
        setUser({ ...user, ...res.data.data }, localStorage.getItem('nijer_bazaar_token') || '');
        toast.success('Profile updated successfully!');
      }
    } catch {
      toast.error('Failed to update profile');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    try {
      await api.put('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const getStatusBadgeVariant = (status: string) => {
    const map: Record<string, string> = {
      pending: 'pending', confirmed: 'confirmed', processing: 'processing',
      shipped: 'shipped', delivered: 'delivered', cancelled: 'cancelled',
    };
    return (map[status] || 'secondary') as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'secondary';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* User Info */}
              <div className="p-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="font-semibold">{user?.name}</h3>
                <p className="text-orange-100 text-xs mt-1">{user?.email}</p>
                <div className="mt-2 bg-white/20 rounded-full px-3 py-1 inline-block text-xs">
                  <Star className="w-3 h-3 inline mr-1" />{user?.loyaltyPoints} Points
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleTabChange(tab.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors mb-1 ${
                      activeTab === tab.key
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
                <hr className="my-2" />
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">My Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-5 max-w-md">
                  <Input
                    label="Full Name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 text-sm border rounded-md bg-gray-50 text-gray-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
                  </div>
                  <Input
                    label="Phone Number"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                  <Button type="submit" variant="brand" className="rounded-full px-6">
                    Save Changes
                  </Button>
                </form>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">My Orders</h2>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-6">Start shopping to see your orders here!</p>
                    <Link to="/shop">
                      <Button variant="brand" className="rounded-full">Browse Products</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-xl p-4">
                        <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-gray-800">#{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={getStatusBadgeVariant(order.status)}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                            <span className="font-bold text-orange-500">{formatTaka(Number(order.total))}</span>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500 mb-3">
                          {order.items.slice(0, 2).map((item, i) => (
                            <span key={i}>
                              {item.productName} × {item.quantity}
                              {i < order.items.length - 1 && i < 1 ? ', ' : ''}
                            </span>
                          ))}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </div>
                        <Link to={`/track?orderNumber=${order.orderNumber}`}>
                          <Button variant="outline" size="sm" className="rounded-full">
                            Track Order
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                  <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                    placeholder="Enter current password"
                  />
                  <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter new password (min 6 chars)"
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter new password"
                  />
                  <Button type="submit" variant="brand" className="rounded-full px-6">
                    Change Password
                  </Button>
                </form>
              </div>
            )}

            {/* Placeholder for other tabs */}
            {(activeTab === 'wishlist' || activeTab === 'addresses') && (
              <div className="bg-white rounded-xl border shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {activeTab === 'wishlist' ? 'Wishlist' : 'Address Book'}
                </h3>
                <p className="text-gray-400">Coming soon! This section is under development.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}