import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { cartStorage, orderStorage, userStorage, productStorage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { CreditCard, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CartItem, Product } from '@/lib/storage';


export const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [shippingOption, setShippingOption] = useState('standard');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUser = userStorage.getCurrentUser();
  const { t } = useTranslation();

  const shippingOptions = [
    { id: 'standard', name: t('checkout.standard'), cost: 9.99 },
    { id: 'express', name: t('checkout.express'), cost: 19.99 },
    { id: 'overnight', name: t('checkout.overnight'), cost: 39.99 }
  ];

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    const cart = cartStorage.getCart();
    if (cart.length === 0) {
      navigate('/cart');
      return;
    }
    
    setCartItems(cart);
    setProducts(productStorage.getProducts());
  }, [currentUser, navigate]);

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getShippingCost = () => {
    const option = shippingOptions.find(opt => opt.id === shippingOption);
    return option?.cost || 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + getShippingCost();
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;

    // Validate shipping address
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      toast({
        title: t('checkout.missing_shipping_info'),
        description: t('checkout.fill_shipping_fields'),
        variant: "destructive"
      });
      return;
    }

    // Validate payment info
    if (!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv || !paymentInfo.cardName) {
      toast({
        title: t('checkout.missing_payment_info'),
        description: t('checkout.fill_payment_fields'),
        variant: "destructive"
      });
      return;
    }

    const addressString = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`;
    const selectedShipping = shippingOptions.find(opt => opt.id === shippingOption);
    
    const order = orderStorage.createOrder(
      currentUser.id,
      cartItems,
      addressString,
      selectedShipping?.name || t('checkout.standard')
    );

    // Clear cart after successful order
    cartStorage.clearCart();

    toast({
      title: t('checkout.order_placed'),
      description: `${t('orders.order_id')}#${order.id.slice(0, 8)} ${t('checkout.order_confirmation')}`
    });

    navigate('/orders');
  };

  if (!currentUser || cartItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} cartItemCount={cartItems.length} />
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">{t('checkout.title')}</h1>
        
        <form onSubmit={handlePlaceOrder}>
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="space-y-6">
              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    {t('checkout.shipping_address')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">{t('checkout.street_address')}</Label>
                    <Input
                      id="street"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('checkout.city')}</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('checkout.state')}</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, state: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{t('checkout.zip_code')}</Label>
                      <Input
                        id="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('checkout.country')}</Label>
                      <Input
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                        placeholder={t('checkout.country_placeholder')}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Options */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('checkout.shipping_options')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={shippingOption} onValueChange={setShippingOption}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name} - ${option.cost.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    {t('checkout.payment_information')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardName">{t('checkout.cardholder_name')}</Label>
                    <Input
                      id="cardName"
                      value={paymentInfo.cardName}
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardName: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">{t('checkout.card_number')}</Label>
                    <Input
                      id="cardNumber"
                      placeholder={t('checkout.card_number_placeholder')}
                      value={paymentInfo.cardNumber}
                      onChange={(e) => setPaymentInfo(prev => ({ ...prev, cardNumber: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryDate">{t('checkout.expiry_date')}</Label>
                      <Input
                        id="expiryDate"
                        placeholder={t('checkout.expiry_placeholder')}
                        value={paymentInfo.expiryDate}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, expiryDate: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv">{t('checkout.cvv')}</Label>
                      <Input
                        id="cvv"
                        placeholder={t('checkout.cvv_placeholder')}
                        value={paymentInfo.cvv}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cvv: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
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
                  
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>{t('checkout.subtotal')}</span>
                      <span>${calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t('checkout.shipping')}</span>
                      <span>${getShippingCost().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t('checkout.total')}</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" size="lg">
                    {t('checkout.place_order')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};