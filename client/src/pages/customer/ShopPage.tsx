import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/services/api';
import { useCartStore } from '@/store/cartStore';
import { formatTaka } from '@/lib/utils';
import { Star, Heart, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Selling', value: 'best_selling' },
  { label: 'Top Rated', value: 'rating' },
];

const categories = [
  { name: 'All Categories', slug: '' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Living', slug: 'home-living' },
  { name: 'Beauty & Health', slug: 'beauty-health' },
  { name: 'Sports', slug: 'sports-outdoors' },
  { name: 'Books', slug: 'books-stationery' },
  { name: 'Food', slug: 'food-grocery' },
  { name: 'Toys', slug: 'toys-kids' },
];

interface Product {
  id: number;
  name: string;
  price: string | number;
  salePrice?: string | number | null;
  rating: string | number;
  reviewCount: number;
  stock: number;
  mainImage?: string;
  categoryId?: number;
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const [isWishlisted, setIsWishlisted] = useState(false);

  const price = Number(product.price);
  const salePrice = product.salePrice ? Number(product.salePrice) : null;
  const discount = salePrice ? Math.round(((price - salePrice) / price) * 100) : 0;

  return (
    <Link to={`/product/${product.id}`} className="group">
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-gray-100">
        <div className="relative aspect-square bg-gray-100 overflow-hidden">
          {product.mainImage ? (
            <img src={product.mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
              <span className="text-5xl">🛍️</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          <button
            onClick={(e) => { e.preventDefault(); setIsWishlisted(!isWishlisted); }}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-orange-500 text-white py-2 text-center text-sm font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button onClick={(e) => { e.preventDefault(); addItem({ id: product.id, name: product.name, price, salePrice: salePrice || undefined, stock: product.stock, images: [], variants: [], slug: '', rating: Number(product.rating), reviewCount: product.reviewCount, tags: [], isActive: true, isFeatured: false, isNewArrival: false, categoryId: null, description: '', sku: '', totalSold: 0, isFlashSale: false, flashSaleEndTime: null, lowStockThreshold: 10, weight: null, shortDescription: null, metaTitle: null, metaDescription: null, createdAt: '', updatedAt: '' }); }} className="flex items-center justify-center gap-2 w-full">
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>
        </div>
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 group-hover:text-orange-500 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className={`w-3 h-3 ${star <= Math.round(Number(product.rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
            ))}
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
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

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || 'newest',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    page: parseInt(searchParams.get('page') || '1'),
    limit: 12,
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.category) params.set('category', filters.category);
      if (filters.sort) params.set('sort', filters.sort);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      params.set('page', filters.page.toString());
      params.set('limit', filters.limit.toString());

      const res = await api.get(`/products?${params.toString()}`);
      setProducts(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const totalPages = Math.ceil(total / filters.limit);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {filters.category
              ? categories.find(c => c.slug === filters.category)?.name || 'Shop'
              : filters.search
                ? `Search: "${filters.search}"`
                : 'All Products'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {total} products found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">

          {/* Sidebar Filter — Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-24">
              <h3 className="font-semibold text-gray-800 mb-4">Filters</h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.slug}
                      onClick={() => updateFilter('category', cat.slug)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        filters.category === cat.slug
                          ? 'bg-orange-50 text-orange-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range (৳)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => updateFilter('minPrice', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter('maxPrice', e.target.value)}
                    className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setFilters({ search: '', category: '', sort: 'newest', minPrice: '', maxPrice: '', page: 1, limit: 12 })}
              >
                Clear All Filters
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-xl shadow-sm border px-4 py-3 mb-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Mobile filter button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSidebarOpen(true)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="w-4 h-4 mr-1" /> Filters
                </Button>

                {/* Search */}
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border rounded-lg outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="text-sm border rounded-lg px-3 py-1.5 outline-none focus:border-orange-400 bg-white"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl h-64 animate-pulse border" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page <= 1}
                      onClick={() => updateFilter('page', filters.page - 1)}
                    >
                      Previous
                    </Button>
                    {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <Button
                          key={pageNum}
                          variant={filters.page === pageNum ? 'brand' : 'outline'}
                          size="sm"
                          onClick={() => updateFilter('page', pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page >= totalPages}
                      onClick={() => updateFilter('page', filters.page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl border p-16 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Products Found</h3>
                <p className="text-gray-500 mb-6">Try adjusting your filters or search terms.</p>
                <Button
                  variant="brand"
                  onClick={() => setFilters({ search: '', category: '', sort: 'newest', minPrice: '', maxPrice: '', page: 1, limit: 12 })}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sidebar */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsSidebarOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-80 bg-white z-50 shadow-xl p-5 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button onClick={() => setIsSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Category</h4>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => { updateFilter('category', cat.slug); setIsSidebarOpen(false); }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${filters.category === cat.slug ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Price Range (৳)</h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => updateFilter('minPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <Button variant="brand" className="w-full" onClick={() => setIsSidebarOpen(false)}>
              Apply Filters
            </Button>
          </div>
        </>
      )}
    </div>
  );
}