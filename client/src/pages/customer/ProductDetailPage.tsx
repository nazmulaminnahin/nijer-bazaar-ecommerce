import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Minus, Plus, Truck, Shield, RefreshCw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cartStore';
import { formatTaka } from '@/lib/utils';
import { toast } from '@/components/ui/toast';
import api from '@/services/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: string | number;
  salePrice?: string | number | null;
  rating: string | number;
  reviewCount: number;
  stock: number;
  sku: string;
  images: { id: number; imageUrl: string; isMain: boolean }[];
  variants: { id: number; name: string; value: string; stock: number }[];
  category?: { name: string };
  tags: string[];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { addItem } = useCartStore();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data.data);
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
          <div className="bg-gray-200 rounded-xl h-96" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-12 bg-gray-200 rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Product Not Found</h2>
        <p className="text-gray-500 mb-6">This product may have been removed or is unavailable.</p>
        <Link to="/shop">
          <Button variant="brand">Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const discount = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;
  const displayPrice = salePrice || price;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price,
      salePrice: salePrice || undefined,
      stock: product.stock,
      images: product.images,
      variants: product.variants,
      slug: '',
      rating: Number(product.rating),
      reviewCount: product.reviewCount,
      tags: product.tags,
      isActive: true,
      isFeatured: false,
      isNewArrival: false,
      categoryId: null,
      description: product.description,
      sku: product.sku,
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
    }, quantity);
    toast.success('Added to cart!');
  };

  const images = product.images.length > 0
    ? product.images
    : [{ id: 0, imageUrl: '', isMain: true }];

  const variantGroups = product.variants.reduce((acc, v) => {
    if (!acc[v.name]) acc[v.name] = [];
    acc[v.name].push(v);
    return acc;
  }, {} as Record<string, typeof product.variants>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">

        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6 flex items-center gap-2">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <span>›</span>
          <Link to="/shop" className="hover:text-orange-500">Shop</Link>
          <span>›</span>
          {product.category && (
            <>
              <Link to={`/shop?category=${product.category.name.toLowerCase()}`} className="hover:text-orange-500">
                {product.category.name}
              </Link>
              <span>›</span>
            </>
          )}
          <span className="text-gray-800 line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* Image Gallery */}
          <div>
            <div className="bg-white rounded-xl overflow-hidden border mb-3 aspect-square">
              {images[selectedImage]?.imageUrl ? (
                <img
                  src={images[selectedImage].imageUrl}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
                  <span className="text-8xl">🛍️</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden ${
                      selectedImage === i ? 'border-orange-500' : 'border-transparent'
                    }`}
                  >
                    {img.imageUrl ? (
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-orange-100 flex items-center justify-center">
                        <span>🛍️</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-xl border p-6">
            {/* Category & SKU */}
            <div className="flex items-center justify-between mb-3">
              {product.category && (
                <Badge variant="secondary">{product.category.name}</Badge>
              )}
              <span className="text-xs text-gray-400">SKU: {product.sku}</span>
            </div>

            {/* Name */}
            <h1 className="text-2xl font-bold text-gray-800 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(Number(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {Number(product.rating).toFixed(1)}
              </span>
              <span className="text-sm text-gray-400">({product.reviewCount} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b">
              <span className="text-3xl font-bold text-orange-500">
                {formatTaka(displayPrice)}
              </span>
              {salePrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatTaka(price)}</span>
                  <Badge variant="destructive">{discount}% OFF</Badge>
                </>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {product.stock > 10 ? (
                <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                  ✅ In Stock ({product.stock} available)
                </span>
              ) : product.stock > 0 ? (
                <span className="text-yellow-600 text-sm font-medium">
                  ⚠️ Only {product.stock} left in stock!
                </span>
              ) : (
                <span className="text-red-600 text-sm font-medium">❌ Out of Stock</span>
              )}
            </div>

            {/* Variants */}
            {Object.entries(variantGroups).map(([variantName, variants]) => (
              <div key={variantName} className="mb-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {variantName}: {selectedVariant[variantName] && (
                    <span className="text-orange-500">{selectedVariant[variantName]}</span>
                  )}
                </label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(prev => ({ ...prev, [variantName]: v.value }))}
                      disabled={v.stock === 0}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                        selectedVariant[variantName] === v.value
                          ? 'border-orange-500 bg-orange-50 text-orange-600'
                          : v.stock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-gray-200 text-gray-700 hover:border-orange-300'
                      }`}
                    >
                      {v.value}
                      {v.stock === 0 && ' (Out)'}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Quantity */}
            <div className="mb-6">
              <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity:</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-6 py-2 font-semibold text-center min-w-[60px]">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-gray-500 text-sm">Max: {product.stock}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                variant="brand"
                size="lg"
                className="flex-1 rounded-full"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
              <button
                onClick={() => setIsWishlisted(!isWishlisted)}
                className={`p-3 rounded-full border-2 transition-colors ${
                  isWishlisted
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-gray-300 hover:border-red-300 text-gray-400'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
              </button>
              <button className="p-3 rounded-full border-2 border-gray-300 hover:border-orange-300 text-gray-400">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Truck className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>Free delivery inside Dhaka on orders over ৳999</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>100% authentic product guaranteed</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <RefreshCw className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <span>7-day easy return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description + Reviews */}
        <div className="bg-white rounded-xl border">
          <div className="flex border-b">
            {(['description', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 text-sm font-medium transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-orange-500 text-orange-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab} {tab === 'reviews' && `(${product.reviewCount})`}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'description' ? (
              <div className="prose max-w-none text-gray-600 leading-relaxed">
                {product.description || 'No description available for this product.'}
                {product.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-gray-700 font-medium">Tags:</span>
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {product.reviewCount === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading reviews...</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}