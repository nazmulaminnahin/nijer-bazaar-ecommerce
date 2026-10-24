import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, ShoppingCart,
  Heart, Star, Truck, Shield, RefreshCw,
  Headphones, ArrowRight, Timer, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { formatTaka } from '@/lib/utils';
import api from '@/services/api';

// ============================
// HERO SLIDER
// ============================
const heroSlides = [
  {
    id: 1,
    title: 'নতুন কালেকশন এসেছে!',
    subtitle: 'New Collection Arrived',
    description: 'Shop the latest trends with up to 50% off on selected items.',
    cta: 'Shop Now',
    href: '/shop',
    bg: 'from-orange-600 to-orange-400',
    badge: 'New Arrival',
  },
  {
    id: 2,
    title: 'Flash Sale চলছে!',
    subtitle: 'Limited Time Offer',
    description: 'Grab amazing deals before they are gone. Up to 70% off!',
    cta: 'See Deals',
    href: '/shop?flashSale=true',
    bg: 'from-red-600 to-orange-500',
    badge: 'Flash Sale 🔥',
  },
  {
    id: 3,
    title: 'ফ্রি ডেলিভারি',
    subtitle: 'Free Delivery Inside Dhaka',
    description: 'Order above ৳999 and get free delivery anywhere in Dhaka.',
    cta: 'Order Now',
    href: '/shop',
    bg: 'from-blue-600 to-blue-400',
    badge: 'Free Shipping',
  },
];

function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[current];

  return (
    <div className="relative h-[400px] md:h-[500px] overflow-hidden rounded-none">
      <div className={`absolute inset-0 bg-gradient-to-r ${slide.bg} transition-all duration-700`}>
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              {slide.badge}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-2 font-bengali">
              {slide.title}
            </h1>
            <p className="text-xl md:text-2xl font-light mb-2 text-white/90">
              {slide.subtitle}
            </p>
            <p className="text-white/80 mb-8 text-base md:text-lg">
              {slide.description}
            </p>
            <div className="flex gap-4">
              <Link to={slide.href}>
                <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 font-semibold rounded-full px-8">
                  {slide.cta} <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link to="/track">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-8">
                  Track Order
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>

      {/* Arrow buttons */}
      <button
        onClick={() => setCurrent(p => (p - 1 + heroSlides.length) % heroSlides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => setCurrent(p => (p + 1) % heroSlides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================
// FEATURES STRIP
// ============================
const features = [
  { icon: Truck, title: 'Fast Delivery', desc: 'Inside Dhaka 24 hrs' },
  { icon: Shield, title: 'Secure Payment', desc: 'bKash, Nagad, COD' },
  { icon: RefreshCw, title: 'Easy Returns', desc: '7-day return policy' },
  { icon: Headphones, title: '24/7 Support', desc: 'Always here to help' },
];

function FeaturesStrip() {
  return (
    <div className="bg-white border-y">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <f.icon className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-gray-500 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================
// CATEGORIES SECTION
// ============================
const staticCategories = [
  { name: 'Electronics', slug: 'electronics', color: 'bg-blue-100', emoji: '📱' },
  { name: 'Fashion', slug: 'fashion', color: 'bg-pink-100', emoji: '👗' },
  { name: 'Home & Living', slug: 'home-living', color: 'bg-green-100', emoji: '🏠' },
  { name: 'Beauty', slug: 'beauty-health', color: 'bg-purple-100', emoji: '💄' },
  { name: 'Sports', slug: 'sports-outdoors', color: 'bg-yellow-100', emoji: '⚽' },
  { name: 'Books', slug: 'books-stationery', color: 'bg-red-100', emoji: '📚' },
  { name: 'Food', slug: 'food-grocery', color: 'bg-orange-100', emoji: '🍎' },
  { name: 'Toys', slug: 'toys-kids', color: 'bg-indigo-100', emoji: '🧸' },
];

function CategoriesSection() {
  return (
    <section className="py-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Shop by Category</h2>
            <p className="text-gray-500 text-sm mt-1">Find what you're looking for</p>
          </div>
          <Link to="/shop" className="text-orange-500 hover:text-orange-600 text-sm font-medium flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {staticCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/shop?category=${cat.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className={`w-full aspect-square rounded-2xl ${cat.color} flex items-center justify-center text-3xl md:text-4xl group-hover:scale-105 transition-transform shadow-sm`}>
                {cat.emoji}
              </div>
              <span className="text-xs font-medium text-gray-700 text-center group-hover:text-orange-500 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================
// COUNTDOWN TIMER
// ============================
function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) return;
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const timer = setInterval(calc, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      {[
        { label: 'HRS', value: timeLeft.hours },
        { label: 'MIN', value: timeLeft.minutes },
        { label: 'SEC', value: timeLeft.seconds },
      ].map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className="bg-gray-900 text-white rounded-lg px-3 py-1 text-center">
            <div className="text-xl font-bold font-mono">{pad(value)}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
          {i < 2 && <span className="text-gray-800 font-bold text-lg">:</span>}
        </div>
      ))}
    </div>
  );
}

// ============================
// PRODUCT CARD
// ============================
interface ProductCardProps {
  product: {
    id: number;
    name: string;
    price: string | number;
    salePrice?: string | number | null;
    rating: string | number;
    reviewCount: number;
    stock: number;
    mainImage?: string;
  };
}

function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const discount = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      id: product.id,
      name: product.name,
      price,
      salePrice: salePrice || undefined,
      stock: product.stock,
      images: [],
      variants: [],
      slug: '',
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      tags: [],
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      categoryId: null,
      description: '',
      sku: '',
      totalSold: 0,
      isFlashSale: false,
      flashSaleEndTime: null,
      lowStockThreshold: 10,
      weight: null,
      shortDescription: null,
      metaTitle: null,
      metaDescription: null,
      createdAt: '',
      updatedAt: '',
    });
  };

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.mainImage ? (
            <img
              src={product.mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
              <span className="text-5xl">🛍️</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>

          {/* Add to Cart overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white py-2 text-center text-sm font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="flex items-center justify-center gap-2 w-full"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= Math.round(Number(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
              />
            ))}
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-2">
            {salePrice ? (
              <>
                <span className="text-orange-500 font-bold">{formatTaka(salePrice)}</span>
                <span className="text-gray-400 text-xs line-through">{formatTaka(price)}</span>
              </>
            ) : (
              <span className="text-orange-500 font-bold">{formatTaka(price)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ============================
// MAIN HOME PAGE
// ============================
export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardProps['product'][]>([]);
  const [newArrivals, setNewArrivals] = useState<ProductCardProps['product'][]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<ProductCardProps['product'][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const flashSaleEnd = new Date(Date.now() + 6 * 60 * 60 * 1000);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const [featured, newArr, flash] = await Promise.all([
          api.get('/products?featured=true&limit=8'),
          api.get('/products?newArrival=true&limit=8'),
          api.get('/products?flashSale=true&limit=4'),
        ]);
        setFeaturedProducts(featured.data?.data || []);
        setNewArrivals(newArr.data?.data || []);
        setFlashSaleProducts(flash.data?.data || []);
      } catch {
        // Use empty arrays if API fails
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Demo products for display when API has no data yet
  const demoProducts = [
    { id: 1, name: 'Wireless Bluetooth Headphones', price: 2500, salePrice: 1999, rating: 4.5, reviewCount: 128, stock: 50 },
    { id: 2, name: 'Smart Watch Pro Series', price: 5000, salePrice: 3999, rating: 4.3, reviewCount: 89, stock: 30 },
    { id: 3, name: 'Premium Leather Wallet', price: 1200, salePrice: null, rating: 4.7, reviewCount: 45, stock: 100 },
    { id: 4, name: 'Portable Power Bank 20000mAh', price: 1800, salePrice: 1499, rating: 4.2, reviewCount: 203, stock: 75 },
    { id: 5, name: 'Cotton T-Shirt Collection', price: 650, salePrice: 499, rating: 4.0, reviewCount: 67, stock: 200 },
    { id: 6, name: 'Home Decor Plant Set', price: 800, salePrice: null, rating: 4.8, reviewCount: 34, stock: 40 },
    { id: 7, name: 'Running Shoes Sports', price: 3500, salePrice: 2799, rating: 4.4, reviewCount: 156, stock: 60 },
    { id: 8, name: 'Kitchen Utensils Set', price: 1500, salePrice: 1199, rating: 4.1, reviewCount: 78, stock: 90 },
  ];

  const displayFeatured = featuredProducts.length > 0 ? featuredProducts : demoProducts;
  const displayNew = newArrivals.length > 0 ? newArrivals : demoProducts.slice(4);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Slider */}
      <HeroSlider />

      {/* Features Strip */}
      <FeaturesStrip />

      {/* Categories */}
      <CategoriesSection />

      {/* Flash Sale Section */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Flash Sale 🔥
                </h2>
                <p className="text-gray-500 text-sm">Hurry up! Offer ends soon</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CountdownTimer targetDate={flashSaleEnd} />
              <Link to="/shop?flashSale=true">
                <Button variant="brand" size="sm" className="rounded-full">
                  See All <ArrowRight className="ml-1 w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(flashSaleProducts.length > 0 ? flashSaleProducts : demoProducts.slice(0, 4)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Featured Products</h2>
              <p className="text-gray-500 text-sm mt-1">Handpicked just for you</p>
            </div>
            <Link to="/shop?featured=true">
              <Button variant="brand-outline" size="sm" className="rounded-full">
                View All <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {displayFeatured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Banner - Special Offer */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-8 md:p-12 text-white text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Special Offer! 🎉
            </h2>
            <p className="text-lg text-orange-100 mb-6">
              Get FREE delivery on your first order! Use code: <strong className="bg-white/20 px-2 py-1 rounded">FIRST FREE</strong>
            </p>
            <Link to="/shop">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-white/90 rounded-full px-8 font-bold">
                Shop Now & Save!
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-10 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">New Arrivals</h2>
              <p className="text-gray-500 text-sm mt-1">Fresh products just added</p>
            </div>
            <Link to="/shop?newArrival=true">
              <Button variant="brand-outline" size="sm" className="rounded-full">
                View All <ArrowRight className="ml-1 w-3 h-3" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {displayNew.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-10 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">What Our Customers Say</h2>
            <p className="text-gray-500 mt-2">Trusted by thousands of happy customers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Rahim Ahmed',
                review: 'Great products and super fast delivery! I got my order within 24 hours. Will definitely shop again.',
                rating: 5,
                location: 'Dhaka'
              },
              {
                name: 'Fatima Khatun',
                review: 'Amazing quality at affordable prices. The customer service team was very helpful when I had questions.',
                rating: 5,
                location: 'Chittagong'
              },
              {
                name: 'Karim Hossain',
                review: 'Best online shopping experience in Bangladesh. Easy returns and genuine products. Highly recommended!',
                rating: 4,
                location: 'Sylhet'
              },
            ].map((testimonial, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= testimonial.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  "{testimonial.review}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{testimonial.name}</p>
                    <p className="text-gray-400 text-xs">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}