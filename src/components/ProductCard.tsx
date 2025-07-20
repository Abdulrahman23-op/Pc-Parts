import { useState } from 'react';
import { ShoppingCart, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { cartStorage, type Product } from '@/lib/storage';

interface ProductCardProps {
  product: Product;
  onAddToCart?: () => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { t } = useLanguage();

  const handleAddToCart = async () => {
    setIsAdding(true);
    
    try {
      cartStorage.addToCart(product.id, product.price, 1);
      
      toast({
        title: t('common.success'),
        description: `${product.name} has been added to your cart.`,
      });
      
      onAddToCart?.();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow hover:scale-105 animate-fade-in">
      {product.featured && (
        <Badge className="absolute top-2 left-2 z-10 bg-gradient-accent text-accent-foreground">
          <Zap className="h-3 w-3 mr-1" />
          Featured
        </Badge>
      )}
      
      <div className="aspect-square relative overflow-hidden bg-muted">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMUExQTFBIi8+CjxwYXRoIGQ9Ik0xMDAgNTBMMTUwIDEwMEgxNTBMMTAwIDU0LjE0MjFMNTAgMTAwSDUwTDEwMCA1MFoiIGZpbGw9IiM0Rjk3QjMiLz4KPHA+UEMgUGFydDwvcD4KPC9zdmc+';
          }}
        />
        
        {product.inStock <= 5 && product.inStock > 0 && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Only {product.inStock} left!
          </Badge>
        )}
        
        {product.inStock === 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {t('product.out_of_stock')}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-3 sm:p-4">
        <h3 className="font-bold text-base sm:text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <p className="text-muted-foreground text-xs sm:text-sm mb-3 line-clamp-2">
          {product.description}
        </p>
        
        {/* Key Specs */}
        <div className="space-y-1 mb-4">
          {Object.entries(product.specs).slice(0, 2).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-muted-foreground capitalize">{key}:</span>
              <span className="font-medium truncate ml-2">{value}</span>
            </div>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xl sm:text-2xl font-bold text-primary">
            ${product.price.toLocaleString()}
          </div>
          
          <div className="text-xs text-muted-foreground">
            {product.inStock} {t('product.in_stock')}
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.inStock === 0 || isAdding}
          className="w-full text-sm sm:text-base"
          variant={product.featured ? "glow" : "default"}
          size="sm"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-current mr-2" />
              <span className="truncate">{t('common.loading')}</span>
            </>
          ) : (
            <>
              <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{t('product.add_to_cart')}</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}