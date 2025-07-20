import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { userStorage, productStorage, categoryStorage, orderStorage, messageStorage, notificationStorage } from '@/lib/storage';
import { Header } from '@/components/Header';
import { Users, Package, ShoppingCart, BarChart3, Plus, Edit, Trash2, Image, MessageSquare, Send, Bell } from 'lucide-react';
import type { User, Product, Category, Order, Message } from '@/lib/storage';

export const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [messageContent, setMessageContent] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  });
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    imageUrl: '',
    specs: {} as Record<string, string>,
    inStock: 0,
    featured: false
  });
  
  const { toast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = userStorage.getCurrentUser();

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }
    
    setUsers(userStorage.getUsers());
    setProducts(productStorage.getProducts());
    setCategories(categoryStorage.getCategories());
    setOrders(orderStorage.getOrders());
    setMessages(messageStorage.getMessages());
  }, [currentUser, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isEditing = false) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (isEditing && editingProduct) {
          setEditingProduct(prev => prev ? { ...prev, imageUrl: result } : null);
        } else {
          setNewProduct(prev => ({ ...prev, imageUrl: result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newProduct.name || !newProduct.categoryId || newProduct.price <= 0) {
      toast({
        title: "Invalid product data",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const product = productStorage.addProduct(newProduct);
    setProducts(productStorage.getProducts());
    setNewProduct({
      name: '',
      description: '',
      price: 0,
      categoryId: '',
      imageUrl: '',
      specs: {},
      inStock: 0,
      featured: false
    });
    
    toast({
      title: "Product added",
      description: `${product.name} has been added successfully`
    });
  };

  const updateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingProduct) return;

    productStorage.updateProduct(editingProduct.id, editingProduct);
    setProducts(productStorage.getProducts());
    setEditingProduct(null);
    
    toast({
      title: "Product updated",
      description: `${editingProduct.name} has been updated successfully`
    });
  };

  const deleteProduct = (id: string) => {
    productStorage.deleteProduct(id);
    setProducts(productStorage.getProducts());
    
    toast({
      title: "Product deleted",
      description: "Product has been deleted successfully"
    });
  };

  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    orderStorage.updateOrderStatus(orderId, status);
    setOrders(orderStorage.getOrders());
    
    toast({
      title: "Order status updated",
      description: `Order #${orderId.slice(0, 8)} status changed to ${status}`
    });
  };

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Invalid user data",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const user = userStorage.register(newUser);
    if (user) {
      setUsers(userStorage.getUsers());
      setNewUser({
        name: '',
        email: '',
        password: '',
        role: 'user'
      });
      
      toast({
        title: "User added",
        description: `${user.name} has been added successfully`
      });
    } else {
      toast({
        title: "Email already exists",
        description: "A user with this email already exists",
        variant: "destructive"
      });
    }
  };

  const deleteUser = (userId: string) => {
    // Prevent admin from deleting themselves
    if (currentUser && currentUser.id === userId) {
      toast({
        title: "Cannot delete yourself",
        description: "Admin cannot delete their own account",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    userStorage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    toast({
      title: "User deleted",
      description: "User has been deleted successfully"
    });
  };

  const updateUserRole = (userId: string, newRole: 'admin' | 'user') => {
    // Prevent admin from changing their own role
    if (currentUser && currentUser.id === userId) {
      toast({
        title: "Cannot change your own role",
        description: "Admin cannot modify their own role",
        variant: "destructive"
      });
      return;
    }

    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    );
    userStorage.saveUsers(updatedUsers);
    setUsers(updatedUsers);
    
    toast({
      title: "User role updated",
      description: `User role changed to ${newRole}`
    });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !messageContent.trim() || !currentUser) {
      toast({
        title: "Invalid message",
        description: "Please select a user and enter a message",
        variant: "destructive"
      });
      return;
    }

    messageStorage.sendMessage(currentUser.id, selectedUser, messageContent);
    setMessages(messageStorage.getMessages());
    setMessageContent('');
    
    toast({
      title: "Message sent",
      description: "Your message has been sent successfully"
    });
  };

  const getUser = (userId: string) => {
    return users.find(u => u.id === userId);
  };

  const getProduct = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  const getCategory = (categoryId: string) => {
    return categories.find(c => c.id === categoryId);
  };

  const getUserMessages = (userId: string) => {
    if (!currentUser) return [];
    return messageStorage.getConversation(currentUser.id, userId);
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = orders.length;
  const totalUsers = users.filter(u => u.role === 'user').length;
  const totalProducts = products.length;

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={() => {}} cartItemCount={0} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">{t('admin.dashboard')}</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.total_revenue')}</p>
                  <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.total_orders')}</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.total_users')}</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.total_products')}</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full max-w-3xl">
            <TabsTrigger value="products">{t('admin.manage_products')}</TabsTrigger>
            <TabsTrigger value="orders">{t('admin.manage_orders')}</TabsTrigger>
            <TabsTrigger value="users">{t('admin.manage_users')}</TabsTrigger>
            <TabsTrigger value="add-product">{t('admin.add_product')}</TabsTrigger>
            <TabsTrigger value="manage-users">{t('admin.add_user')}</TabsTrigger>
            <TabsTrigger value="messages">{t('admin.send_messages')}</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.products_management')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <img src={product.imageUrl} alt={product.name} className="h-16 w-16 object-cover rounded" />
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{getCategory(product.categoryId)?.name}</p>
                          <p className="text-lg font-bold text-primary">${product.price}</p>
                          <p className="text-sm">{t('admin.stock')}: {product.inStock}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Product Modal */}
            {editingProduct && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>{t('admin.edit_product')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={updateProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-name">{t('admin.product_name')}</Label>
                        <Input
                          id="edit-name"
                          value={editingProduct.name}
                          onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-price">{t('admin.price')}</Label>
                        <Input
                          id="edit-price"
                          type="number"
                          step="0.01"
                          value={editingProduct.price}
                          onChange={(e) => setEditingProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) } : null)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingProduct.description}
                        onChange={(e) => setEditingProduct(prev => prev ? { ...prev, description: e.target.value } : null)}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-category">Category</Label>
                        <Select value={editingProduct.categoryId} onValueChange={(value) => setEditingProduct(prev => prev ? { ...prev, categoryId: value } : null)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-stock">Stock</Label>
                        <Input
                          id="edit-stock"
                          type="number"
                          value={editingProduct.inStock}
                          onChange={(e) => setEditingProduct(prev => prev ? { ...prev, inStock: parseInt(e.target.value) } : null)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-image">Product Image</Label>
                      <div className="flex items-center gap-4">
                        {editingProduct.imageUrl && (
                          <img src={editingProduct.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
                        )}
                        <Input
                          id="edit-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, true)}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit">Update Product</Button>
                      <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.orders_management')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => {
                    const user = getUser(order.userId);
                    return (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{t('admin.order_id')}{order.id.slice(0, 8)}</h3>
                            <p className="text-sm text-muted-foreground">
                              {t('admin.customer')}: {user?.name} ({user?.email})
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {t('admin.date')}: {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">${order.total.toFixed(2)}</p>
                            <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}>
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">{t('orders.pending')}</SelectItem>
                                <SelectItem value="processing">{t('orders.processing')}</SelectItem>
                                <SelectItem value="shipped">{t('orders.shipped')}</SelectItem>
                                <SelectItem value="delivered">{t('orders.delivered')}</SelectItem>
                                <SelectItem value="cancelled">{t('orders.cancelled')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-medium">{t('admin.items')}:</h4>
                          {order.items.map((item, index) => {
                            const product = getProduct(item.productId);
                            return (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{product?.name || 'Unknown Product'} × {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-4">
                          <h4 className="font-medium">{t('admin.shipping_address')}:</h4>
                          <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.users_management')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {user.image ? (
                            <img src={user.image} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-12 w-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{user.name}</h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {t(`admin.${user.role}`)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Select 
                          value={user.role} 
                          onValueChange={(value) => updateUserRole(user.id, value as 'admin' | 'user')}
                          disabled={currentUser?.id === user.id}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">{t('admin.user')}</SelectItem>
                            <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={currentUser?.id === user.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Add Product Tab */}
          <TabsContent value="add-product">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.add_new_product')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addProduct} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('admin.product_name')}</Label>
                      <Input
                        id="name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">{t('admin.price')}</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('admin.description')}</Label>
                    <Textarea
                      id="description"
                      value={newProduct.description}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('admin.category')}</Label>
                      <Select value={newProduct.categoryId} onValueChange={(value) => setNewProduct(prev => ({ ...prev, categoryId: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.select_category')} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">{t('admin.stock')}</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={newProduct.inStock}
                        onChange={(e) => setNewProduct(prev => ({ ...prev, inStock: parseInt(e.target.value) }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image">{t('admin.product_image')}</Label>
                    <div className="flex items-center gap-4">
                      {newProduct.imageUrl && (
                        <img src={newProduct.imageUrl} alt="Preview" className="h-16 w-16 object-cover rounded" />
                      )}
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e)}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('admin.add_product')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manage Users Tab */}
          <TabsContent value="manage-users">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.add_new_user')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={addUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-name">{t('admin.name')}</Label>
                      <Input
                        id="user-name"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-email">{t('admin.email')}</Label>
                      <Input
                        id="user-email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-password">{t('admin.password')}</Label>
                      <Input
                        id="user-password"
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="user-role">{t('admin.role')}</Label>
                      <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value as 'admin' | 'user' }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">{t('admin.user')}</SelectItem>
                          <SelectItem value="admin">{t('admin.admin')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('admin.add_user')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Send Message */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.send_message_to_user')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={sendMessage} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="user-select">{t('admin.select_user')}</Label>
                      <Select value={selectedUser} onValueChange={setSelectedUser}>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin.choose_user')} />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'user').map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} ({user.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="message-content">{t('admin.message')}</Label>
                      <Textarea
                        id="message-content"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        placeholder={t('admin.type_message_here')}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      <Send className="mr-2 h-4 w-4" />
                      {t('admin.send_message')}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Message History */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.recent_messages')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {selectedUser ? (
                      getUserMessages(selectedUser).map((message) => {
                        const sender = getUser(message.fromUserId);
                        const isFromAdmin = message.fromUserId === currentUser?.id;
                        return (
                          <div key={message.id} className={`p-3 rounded-lg ${isFromAdmin ? 'bg-primary text-primary-foreground ml-8' : 'bg-secondary mr-8'}`}>
                            <div className="text-xs opacity-75 mb-1">
                              {sender?.name} - {new Date(message.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm">{message.content}</div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-muted-foreground text-center">{t('admin.select_user_view_history')}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};