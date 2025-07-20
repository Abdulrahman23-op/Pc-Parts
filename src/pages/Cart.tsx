import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cartStorage, productStorage, userStorage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CartItem, Product } from '@/lib/storage';

export const Cart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = userStorage.getCurrentUser();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    setCartItems(cartStorage.getCart());
    setProducts(productStorage.getProducts());
  }, [currentUser, navigate]);

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    cartStorage.updateQuantity(productId, newQuantity);
    setCartItems(cartStorage.getCart());
  };

  const removeFromCart = (productId: string) => {
    cartStorage.removeFromCart(productId);
    setCartItems(cartStorage.getCart());
    toast({
      title: t('cart.remove'),
      description: t('cart.remove')
    });
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (!currentUser) {
    return null;
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} cartItemCount={cartItems.length} />
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">{t('cart.empty')}</h2>
          <p className="text-muted-foreground mb-6">{t('cart.empty_subtitle')}</p>
          <Link to="/">
            <Button>{t('cart.continue_shopping')}</Button>
          </Link>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} cartItemCount={cartItems.length} />
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{t('cart.title')}</h1>
        
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const product = getProduct(item.productId);
              if (!product) return null;
              
              return (
                <Card key={item.productId}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-24 w-24 sm:h-20 sm:w-20 object-cover rounded-lg mx-auto sm:mx-0 flex-shrink-0"
                      />
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="font-semibold text-lg sm:text-base">{product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2 sm:mb-1">{product.description}</p>
                        <p className="text-xl sm:text-lg font-bold text-primary">${product.price}</p>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-8 w-8 sm:h-10 sm:w-10"
                          >
                            <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                            className="w-14 sm:w-16 text-center h-8 sm:h-10"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-8 w-8 sm:h-10 sm:w-10"
                          >
                            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFromCart(item.productId)}
                          className="h-8 w-8 sm:h-10 sm:w-10"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>{t('checkout.order_summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {cartItems.map((item) => {
                    const product = getProduct(item.productId);
                    if (!product) return null;
                    
                    return (
                      <div key={item.productId} className="flex justify-between text-sm">
                        <span>{product.name} × {item.quantity}</span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>{t('checkout.total')}</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <Button className="w-full" onClick={handleCheckout}>
                  {t('cart.proceed_to_checkout')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};