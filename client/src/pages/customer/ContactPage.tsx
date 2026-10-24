import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, Facebook, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from '@/components/ui/toast';

export default function ContactPage() {
  const [form, setForm] = useState({
    name: '', email: '', subject: '', message: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('Message sent! We will reply within 24 hours.');
    setForm({ name: '', email: '', subject: '', message: '' });
    setIsLoading(false);
  };

  const contactInfo = [
    { icon: Phone, label: 'Phone', value: '01700-000000', href: 'tel:01700000000', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Mail, label: 'Email', value: 'info@nijerbazaar.com', href: 'mailto:info@nijerbazaar.com', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: MapPin, label: 'Address', value: 'Dhaka, Bangladesh', href: '#', color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Clock, label: 'Support Hours', value: 'Sat-Thu: 9AM - 8PM', href: '#', color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster />

      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Contact Us</h1>
          <p className="text-orange-100 text-lg">
            We're here to help! Reach out to us anytime.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Contact Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 text-lg mb-5">Get in Touch</h3>
              <div className="space-y-4">
                {contactInfo.map((info) => (
                  <a key={info.label} href={info.href} className="flex items-center gap-4 group">
                    <div className={`w-12 h-12 ${info.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <info.icon className={`w-6 h-6 ${info.color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">{info.label}</p>
                      <p className="text-gray-700 font-medium text-sm group-hover:text-orange-500 transition-colors">
                        {info.value}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-xl border p-6 shadow-sm">
              <h3 className="font-semibold text-gray-800 mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors">
                  <Facebook className="w-4 h-4" /> Facebook
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg text-sm hover:bg-pink-700 transition-colors">
                  <Instagram className="w-4 h-4" /> Instagram
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border p-8 shadow-sm">
              <h3 className="font-bold text-gray-800 text-xl mb-6">Send us a Message</h3>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Input
                    label="Your Name *"
                    name="name"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Email Address *"
                    name="email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                  >
                    <option value="">Select a topic</option>
                    <option value="order">Order Inquiry</option>
                    <option value="return">Return/Refund</option>
                    <option value="product">Product Question</option>
                    <option value="payment">Payment Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 text-sm border rounded-md outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  variant="brand"
                  size="lg"
                  className="rounded-full px-8"
                  isLoading={isLoading}
                >
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}