import { Link } from 'react-router-dom';
import {
  Facebook, Instagram, Youtube,
  Phone, Mail, MapPin, Send
} from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Subscribed with: ${email}`);
    setEmail('');
  };

  return (
    <footer className="bg-gray-900 text-white">

      {/* Newsletter Section */}
      <div className="bg-orange-500">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Subscribe to our Newsletter
              </h3>
              <p className="text-orange-100 text-sm mt-1">
                Get the latest deals and offers directly to your inbox
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1 md:w-72 px-4 py-2 rounded-l-full text-gray-800 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-gray-900 text-white px-6 py-2 rounded-r-full hover:bg-gray-700 transition flex items-center gap-2 text-sm font-medium"
              >
                <Send className="w-4 h-4" /> Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand Column */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">NB</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white">নিজের</span>
                <span className="text-xl font-bold text-orange-500"> বাজার</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Bangladesh's trusted online shopping destination. Quality products, fast delivery, and excellent customer service.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-9 h-9 bg-gray-800 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', href: '/' },
                { label: 'Shop All Products', href: '/shop' },
                { label: 'Track Your Order', href: '/track' },
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-1"
                  >
                    <span className="text-orange-500">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Customer Service</h4>
            <ul className="space-y-2">
              {[
                { label: 'My Account', href: '/profile' },
                { label: 'Order History', href: '/profile?tab=orders' },
                { label: 'Wishlist', href: '/profile?tab=wishlist' },
                { label: 'Return Policy', href: '#' },
                { label: 'Privacy Policy', href: '#' },
                { label: 'Terms & Conditions', href: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-gray-400 hover:text-orange-400 text-sm transition-colors flex items-center gap-1"
                  >
                    <span className="text-orange-500">›</span> {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-base">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">
                  Dhaka, Bangladesh
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a href="tel:01700000000" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                  01700-000000
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <a href="mailto:info@nijerbazaar.com" className="text-gray-400 hover:text-orange-400 text-sm transition-colors">
                  info@nijerbazaar.com
                </a>
              </li>
            </ul>

            {/* Payment Methods */}
            <div className="mt-6">
              <p className="text-gray-400 text-xs mb-3">We Accept:</p>
              <div className="flex gap-2 flex-wrap">
                {['bKash', 'Nagad', 'COD', 'Card'].map((method) => (
                  <span
                    key={method}
                    className="bg-gray-800 text-gray-300 text-xs px-3 py-1 rounded-md border border-gray-700"
                  >
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Nijer Bazaar (নিজের বাজার). All rights reserved.
          </p>
          <p className="text-gray-500 text-xs">
            Made with ❤️ in Bangladesh 🇧🇩
          </p>
        </div>
      </div>
    </footer>
  );
}