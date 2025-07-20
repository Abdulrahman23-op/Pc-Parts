import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { ProductCard } from '@/components/ProductCard';
import { CategoryFilter } from '@/components/CategoryFilter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  productStorage, 
  categoryStorage, 
  cartStorage, 
  initializeDefaultData,
  type Product, 
  type Category 
} from '@/lib/storage';

export function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItemCount, setCartItemCount] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    // Initialize default data on first load
    initializeDefaultData();
    
    // Load data
    const loadedProducts = productStorage.getProducts();
    const loadedCategories = categoryStorage.getCategories();
    
    setProducts(loadedProducts);
    setCategories(loadedCategories);
    setFilteredProducts(loadedProducts);
    
    // Update cart count
    updateCartCount();
  }, []);

  useEffect(() => {
    // Filter products based on category and search
    let filtered = products;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        Object.values(product.specs).some(spec => 
          spec.toLowerCase().includes(query)
        )
      );
    }

    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  const updateCartCount = () => {
    const cart = cartStorage.getCart();
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    setCartItemCount(count);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

  const handleAddToCart = () => {
    updateCartCount();
  };

  const featuredProducts = products.filter(p => p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} cartItemCount={cartItemCount} />
      
      <main className="container mx-auto px-4 py-4 sm:py-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-primary p-6 sm:p-8 md:p-12 mb-8 sm:mb-12 text-center">
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-primary-foreground mb-4 leading-tight">
              {t('home.hero_title')}
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
              {t('home.hero_subtitle')}
            </p>
            <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90 w-full sm:w-auto">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              {t('home.shop_now')}
            </Button>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-background/10 to-transparent" />
        </section>

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <section className="mb-8 sm:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 mb-6">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h2 className="text-2xl sm:text-3xl font-bold">{t('home.featured_products')}</h2>
              </div>
              <Badge variant="secondary" className="bg-gradient-accent text-accent-foreground w-fit">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('home.hot')}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}

        {/* All Products */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold">{t('home.all_products')}</h2>
            <Badge variant="outline" className="text-muted-foreground w-fit">
              {filteredProducts.length} {t('home.items')}
            </Badge>
          </div>

          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />

          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">🔍</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{t('home.no_products_found')}</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                {t('home.no_products_subtitle')}
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
              >
                {t('home.clear_filters')}
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}