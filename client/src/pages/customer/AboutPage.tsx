import { Link } from 'react-router-dom';
import { Users, Package, Star, Truck, Target, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { label: 'Happy Customers', value: '50,000+', icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Products Available', value: '10,000+', icon: Package, color: 'text-purple-500', bg: 'bg-purple-50' },
  { label: 'Orders Delivered', value: '100,000+', icon: Truck, color: 'text-green-500', bg: 'bg-green-50' },
  { label: 'Average Rating', value: '4.8 ★', icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50' },
];

const team = [
  { name: 'Ahmad Karim', role: 'CEO & Founder', emoji: '👨‍💼' },
  { name: 'Fatima Akter', role: 'Head of Operations', emoji: '👩‍💼' },
  { name: 'Rahim Ali', role: 'CTO', emoji: '👨‍💻' },
  { name: 'Nadia Islam', role: 'Customer Success', emoji: '👩‍💻' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Nijer Bazaar</h1>
          <p className="text-orange-100 text-lg max-w-2xl mx-auto">
            Bangladesh's trusted online marketplace — bringing quality products to your doorstep.
          </p>
        </div>
      </div>

      {/* Our Story */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Nijer Bazaar (নিজের বাজার) was founded with a simple vision: to make quality products accessible to everyone in Bangladesh at fair prices, with the convenience of online shopping.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            We started in 2024 with just a handful of products and a passionate team. Today, we serve thousands of customers across Bangladesh, offering over 10,000 products in categories from electronics to fashion, home goods to groceries.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our mission is simple: <strong className="text-orange-500">Your bazaar, your way</strong> — authentic products, transparent prices, and reliable delivery.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-6 text-center shadow-sm border">
                <div className={`w-14 h-14 ${stat.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-gray-500 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Target,
              title: 'Our Mission',
              color: 'text-orange-500',
              bg: 'bg-orange-50',
              desc: 'To provide every Bangladeshi with access to quality products at the best prices, delivered safely to their door.',
            },
            {
              icon: Eye,
              title: 'Our Vision',
              color: 'text-blue-500',
              bg: 'bg-blue-50',
              desc: 'To become Bangladesh\'s most loved and trusted e-commerce platform, empowering both buyers and sellers.',
            },
            {
              icon: Heart,
              title: 'Our Values',
              color: 'text-red-500',
              bg: 'bg-red-50',
              desc: 'Authenticity, transparency, customer-first thinking, and a deep love for Bangladesh drives everything we do.',
            },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border p-6 text-center shadow-sm">
              <div className={`w-14 h-14 ${item.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-800 mb-3">Meet Our Team</h2>
            <p className="text-gray-500">The passionate people behind Nijer Bazaar</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-xl border p-6 text-center shadow-sm">
                <div className="text-5xl mb-3">{member.emoji}</div>
                <h4 className="font-semibold text-gray-800 text-sm">{member.name}</h4>
                <p className="text-orange-500 text-xs mt-1">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Start Shopping Today!</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Join thousands of happy customers and experience the joy of shopping with Nijer Bazaar.
        </p>
        <Link to="/shop">
          <Button variant="brand" size="xl" className="rounded-full px-10">
            Explore Our Products
          </Button>
        </Link>
      </section>
    </div>
  );
}