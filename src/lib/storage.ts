// Local storage utilities for PC Shop data persistence

export interface User {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  image?: string;
  profileImage?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  specs: Record<string, string>;
  inStock: number;
  featured: boolean;
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  shippingAddress: string;
  shippingMethod?: string;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order_status' | 'message' | 'general';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Storage keys
const STORAGE_KEYS = {
  USERS: 'pc_shop_users',
  PRODUCTS: 'pc_shop_products',
  CATEGORIES: 'pc_shop_categories',
  ORDERS: 'pc_shop_orders',
  CART: 'pc_shop_cart',
  CURRENT_USER: 'pc_shop_current_user',
  MESSAGES: 'pc_shop_messages',
  NOTIFICATIONS: 'pc_shop_notifications'
} as const;

// Generic storage functions
export const storage = {
  get: <T>(key: string): T[] => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  set: <T>(key: string, data: T[]): void => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  getSingle: <T>(key: string): T | null => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setSingle: <T>(key: string, data: T): void => {
    localStorage.setItem(key, JSON.stringify(data));
  },

  remove: (key: string): void => {
    localStorage.removeItem(key);
  }
};

// User management
export const userStorage = {
  getUsers: (): User[] => storage.get<User>(STORAGE_KEYS.USERS),
  saveUsers: (users: User[]): void => storage.set(STORAGE_KEYS.USERS, users),
  getCurrentUser: (): User | null => storage.getSingle<User>(STORAGE_KEYS.CURRENT_USER),
  setCurrentUser: (user: User): void => storage.setSingle(STORAGE_KEYS.CURRENT_USER, user),
  logout: (): void => storage.remove(STORAGE_KEYS.CURRENT_USER),
  
  register: (userData: Omit<User, 'id' | 'createdAt'>): User | null => {
    const users = userStorage.getUsers();
    if (users.find(u => u.email === userData.email)) {
      return null; // Email already exists
    }
    
    const newUser: User = {
      ...userData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    userStorage.saveUsers(users);
    return newUser;
  },
  
  login: (email: string, password: string): User | null => {
    const users = userStorage.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      userStorage.setCurrentUser(user);
    }
    return user || null;
  }
};

// Product management
export const productStorage = {
  getProducts: (): Product[] => storage.get<Product>(STORAGE_KEYS.PRODUCTS),
  saveProducts: (products: Product[]): void => storage.set(STORAGE_KEYS.PRODUCTS, products),
  
  addProduct: (product: Omit<Product, 'id'>): Product => {
    const products = productStorage.getProducts();
    const newProduct: Product = {
      ...product,
      id: crypto.randomUUID()
    };
    products.push(newProduct);
    productStorage.saveProducts(products);
    return newProduct;
  },
  
  updateProduct: (id: string, updates: Partial<Product>): boolean => {
    const products = productStorage.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      productStorage.saveProducts(products);
      return true;
    }
    return false;
  },
  
  deleteProduct: (id: string): boolean => {
    const products = productStorage.getProducts();
    const filtered = products.filter(p => p.id !== id);
    productStorage.saveProducts(filtered);
    return filtered.length < products.length;
  }
};

// Category management
export const categoryStorage = {
  getCategories: (): Category[] => storage.get<Category>(STORAGE_KEYS.CATEGORIES),
  saveCategories: (categories: Category[]): void => storage.set(STORAGE_KEYS.CATEGORIES, categories)
};

// Cart management
export const cartStorage = {
  getCart: (): CartItem[] => storage.get<CartItem>(STORAGE_KEYS.CART),
  saveCart: (cart: CartItem[]): void => storage.set(STORAGE_KEYS.CART, cart),
  
  addToCart: (productId: string, price: number, quantity: number = 1): void => {
    const cart = cartStorage.getCart();
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity, price });
    }
    
    cartStorage.saveCart(cart);
  },
  
  removeFromCart: (productId: string): void => {
    const cart = cartStorage.getCart();
    const filtered = cart.filter(item => item.productId !== productId);
    cartStorage.saveCart(filtered);
  },
  
  updateQuantity: (productId: string, quantity: number): void => {
    const cart = cartStorage.getCart();
    const item = cart.find(item => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        cartStorage.removeFromCart(productId);
      } else {
        item.quantity = quantity;
        cartStorage.saveCart(cart);
      }
    }
  },
  
  clearCart: (): void => {
    cartStorage.saveCart([]);
  },
  
  getCartTotal: (): number => {
    const cart = cartStorage.getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
};

// Order management
export const orderStorage = {
  getOrders: (): Order[] => storage.get<Order>(STORAGE_KEYS.ORDERS),
  saveOrders: (orders: Order[]): void => storage.set(STORAGE_KEYS.ORDERS, orders),
  
  createOrder: (userId: string, items: CartItem[], shippingAddress: string, shippingMethod?: string): Order => {
    const orders = orderStorage.getOrders();
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newOrder: Order = {
      id: crypto.randomUUID(),
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
      shippingAddress,
      shippingMethod
    };
    
    orders.push(newOrder);
    orderStorage.saveOrders(orders);
    
    // Create notification for the user
    notificationStorage.createNotification(
      userId,
      'order_status',
      'Order Placed',
      `Your order #${newOrder.id.slice(0, 8)} has been placed successfully.`
    );
    
    return newOrder;
  },

  updateOrderStatus: (orderId: string, status: Order['status']): void => {
    const orders = orderStorage.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex !== -1) {
      const order = orders[orderIndex];
      const oldStatus = order.status;
      order.status = status;
      orderStorage.saveOrders(orders);
      
      // Create notification for status change
      if (oldStatus !== status) {
        notificationStorage.createNotification(
          order.userId,
          'order_status',
          'Order Status Updated',
          `Your order #${orderId.slice(0, 8)} status changed to ${status}.`
        );
      }
    }
  }
};

// Message management
export const messageStorage = {
  getMessages: (): Message[] => storage.get<Message>(STORAGE_KEYS.MESSAGES),
  saveMessages: (messages: Message[]): void => storage.set(STORAGE_KEYS.MESSAGES, messages),
  
  sendMessage: (fromUserId: string, toUserId: string, content: string): Message => {
    const messages = messageStorage.getMessages();
    const newMessage: Message = {
      id: crypto.randomUUID(),
      fromUserId,
      toUserId,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    messages.push(newMessage);
    messageStorage.saveMessages(messages);
    
    // Create notification for the recipient
    notificationStorage.createNotification(
      toUserId,
      'message',
      'New Message',
      `You have a new message from ${userStorage.getUsers().find(u => u.id === fromUserId)?.name || 'Unknown'}.`
    );
    
    return newMessage;
  },
  
  markAsRead: (messageId: string): void => {
    const messages = messageStorage.getMessages();
    const message = messages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      messageStorage.saveMessages(messages);
    }
  },
  
  getConversation: (userId1: string, userId2: string): Message[] => {
    const messages = messageStorage.getMessages();
    return messages.filter(m => 
      (m.fromUserId === userId1 && m.toUserId === userId2) ||
      (m.fromUserId === userId2 && m.toUserId === userId1)
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
};

// Notification management
export const notificationStorage = {
  getNotifications: (): Notification[] => storage.get<Notification>(STORAGE_KEYS.NOTIFICATIONS),
  saveNotifications: (notifications: Notification[]): void => storage.set(STORAGE_KEYS.NOTIFICATIONS, notifications),
  
  createNotification: (userId: string, type: Notification['type'], title: string, message: string): Notification => {
    const notifications = notificationStorage.getNotifications();
    const newNotification: Notification = {
      id: crypto.randomUUID(),
      userId,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    notifications.push(newNotification);
    notificationStorage.saveNotifications(notifications);
    return newNotification;
  },
  
  markAsRead: (notificationId: string): void => {
    const notifications = notificationStorage.getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notificationStorage.saveNotifications(notifications);
    }
  },
  
  getUserNotifications: (userId: string): Notification[] => {
    const notifications = notificationStorage.getNotifications();
    return notifications.filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};

// Initialize default data
export const initializeDefaultData = (): void => {
  // Create default admin user
  const users = userStorage.getUsers();
  if (users.length === 0) {
    userStorage.register({
      email: 'admin@pcshop.com',
      password: 'admin123',
      name: 'Admin User',
      role: 'admin'
    });
  }

  // Create default categories
  const categories = categoryStorage.getCategories();
  if (categories.length === 0) {
    const defaultCategories: Category[] = [
      { id: '1', name: 'CPUs', description: 'Central Processing Units' },
      { id: '2', name: 'Graphics Cards', description: 'Video Graphics Cards' },
      { id: '3', name: 'Motherboards', description: 'Main Circuit Boards' },
      { id: '4', name: 'Memory', description: 'RAM and Storage' },
      { id: '5', name: 'Power Supplies', description: 'PSU Units' },
      { id: '6', name: 'Cases', description: 'PC Cases and Enclosures' }
    ];
    categoryStorage.saveCategories(defaultCategories);
  }

  // Create default products
  const products = productStorage.getProducts();
  if (products.length === 0) {
    const defaultProducts: Product[] = [
      // CPUs (Category 1)
      {
        id: '1',
        name: 'AMD Ryzen 9 7950X',
        description: 'High-performance 16-core processor for gaming and content creation',
        price: 699,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
        specs: { cores: '16', threads: '32', 'base clock': '4.5 GHz', 'boost clock': '5.7 GHz', socket: 'AM5' },
        inStock: 25,
        featured: true
      },
      {
        id: '2',
        name: 'Intel Core i9-13900K',
        description: 'Latest generation Intel processor with incredible performance',
        price: 589,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { cores: '24', threads: '32', 'base clock': '3.0 GHz', 'boost clock': '5.8 GHz', socket: 'LGA1700' },
        inStock: 30,
        featured: true
      },
      {
        id: '101',
        name: 'AMD Ryzen 7 7800X3D',
        description: '3D V-Cache gaming processor with exceptional performance',
        price: 449,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
        specs: { cores: '8', threads: '16', 'base clock': '4.2 GHz', 'boost clock': '5.0 GHz', socket: 'AM5' },
        inStock: 40,
        featured: false
      },
      {
        id: '102',
        name: 'Intel Core i7-13700K',
        description: 'High-performance processor for enthusiasts',
        price: 409,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
        specs: { cores: '16', threads: '24', 'base clock': '3.4 GHz', 'boost clock': '5.4 GHz', socket: 'LGA1700' },
        inStock: 35,
        featured: false
      },
      {
        id: '103',
        name: 'AMD Ryzen 5 7600X',
        description: 'Mid-range gaming processor with excellent value',
        price: 299,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { cores: '6', threads: '12', 'base clock': '4.7 GHz', 'boost clock': '5.3 GHz', socket: 'AM5' },
        inStock: 50,
        featured: false
      },
      {
        id: '104',
        name: 'Intel Core i5-13600K',
        description: 'Perfect balance of performance and price',
        price: 319,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
        specs: { cores: '14', threads: '20', 'base clock': '3.5 GHz', 'boost clock': '5.1 GHz', socket: 'LGA1700' },
        inStock: 45,
        featured: false
      },
      {
        id: '105',
        name: 'AMD Ryzen 9 7900X',
        description: '12-core powerhouse for creators and gamers',
        price: 549,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
        specs: { cores: '12', threads: '24', 'base clock': '4.7 GHz', 'boost clock': '5.6 GHz', socket: 'AM5' },
        inStock: 28,
        featured: false
      },
      {
        id: '106',
        name: 'Intel Core i7-12700K',
        description: 'Previous generation flagship with great value',
        price: 369,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { cores: '12', threads: '20', 'base clock': '3.6 GHz', 'boost clock': '5.0 GHz', socket: 'LGA1700' },
        inStock: 33,
        featured: false
      },
      {
        id: '107',
        name: 'AMD Ryzen 5 5600X',
        description: 'Budget gaming processor with solid performance',
        price: 199,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
        specs: { cores: '6', threads: '12', 'base clock': '3.7 GHz', 'boost clock': '4.6 GHz', socket: 'AM4' },
        inStock: 60,
        featured: false
      },
      {
        id: '108',
        name: 'Intel Core i5-12400F',
        description: 'Affordable gaming processor without integrated graphics',
        price: 149,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400',
        specs: { cores: '6', threads: '12', 'base clock': '2.5 GHz', 'boost clock': '4.4 GHz', socket: 'LGA1700' },
        inStock: 55,
        featured: false
      },
      {
        id: '109',
        name: 'AMD Ryzen 7 5800X3D',
        description: '3D V-Cache gaming champion',
        price: 349,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { cores: '8', threads: '16', 'base clock': '3.4 GHz', 'boost clock': '4.5 GHz', socket: 'AM4' },
        inStock: 25,
        featured: false
      },
      {
        id: '110',
        name: 'Intel Core i9-12900K',
        description: 'Flagship 12th gen processor',
        price: 499,
        categoryId: '1',
        imageUrl: 'https://images.unsplash.com/photo-1555617981-dac3880eac6e?w=400',
        specs: { cores: '16', threads: '24', 'base clock': '3.2 GHz', 'boost clock': '5.2 GHz', socket: 'LGA1700' },
        inStock: 20,
        featured: false
      },

      // Graphics Cards (Category 2)
      {
        id: '3',
        name: 'NVIDIA RTX 4090',
        description: 'Ultimate gaming graphics card with 24GB VRAM',
        price: 1599,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '24GB GDDR6X', 'memory speed': '21 Gbps', 'cuda cores': '16384', 'boost clock': '2520 MHz', power: '450W' },
        inStock: 15,
        featured: true
      },
      {
        id: '4',
        name: 'AMD Radeon RX 7900 XTX',
        description: 'High-end AMD graphics card for 4K gaming',
        price: 999,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '24GB GDDR6', 'memory speed': '20 Gbps', 'stream processors': '6144', 'game clock': '2300 MHz', power: '355W' },
        inStock: 20,
        featured: false
      },
      {
        id: '201',
        name: 'NVIDIA RTX 4080',
        description: '4K gaming powerhouse with 16GB VRAM',
        price: 1199,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '16GB GDDR6X', 'memory speed': '22.4 Gbps', 'cuda cores': '9728', 'boost clock': '2505 MHz', power: '320W' },
        inStock: 25,
        featured: true
      },
      {
        id: '202',
        name: 'AMD Radeon RX 7900 XT',
        description: 'High-performance gaming at 1440p and 4K',
        price: 899,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '20GB GDDR6', 'memory speed': '20 Gbps', 'stream processors': '5376', 'game clock': '2000 MHz', power: '300W' },
        inStock: 30,
        featured: false
      },
      {
        id: '203',
        name: 'NVIDIA RTX 4070 Ti',
        description: '1440p gaming excellence with ray tracing',
        price: 799,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '12GB GDDR6X', 'memory speed': '21 Gbps', 'cuda cores': '7680', 'boost clock': '2610 MHz', power: '285W' },
        inStock: 35,
        featured: false
      },
      {
        id: '204',
        name: 'AMD Radeon RX 7800 XT',
        description: 'Perfect for 1440p gaming enthusiasts',
        price: 649,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '16GB GDDR6', 'memory speed': '19.5 Gbps', 'stream processors': '3840', 'game clock': '2124 MHz', power: '263W' },
        inStock: 40,
        featured: false
      },
      {
        id: '205',
        name: 'NVIDIA RTX 4070',
        description: 'Excellent 1440p performance with DLSS 3',
        price: 599,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '12GB GDDR6X', 'memory speed': '21 Gbps', 'cuda cores': '5888', 'boost clock': '2475 MHz', power: '200W' },
        inStock: 45,
        featured: false
      },
      {
        id: '206',
        name: 'AMD Radeon RX 7700 XT',
        description: 'Great value for 1440p gaming',
        price: 449,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '12GB GDDR6', 'memory speed': '18 Gbps', 'stream processors': '3456', 'game clock': '2171 MHz', power: '245W' },
        inStock: 38,
        featured: false
      },
      {
        id: '207',
        name: 'NVIDIA RTX 4060 Ti',
        description: '1080p and 1440p gaming with ray tracing',
        price: 399,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '8GB GDDR6X', 'memory speed': '18 Gbps', 'cuda cores': '4352', 'boost clock': '2535 MHz', power: '165W' },
        inStock: 50,
        featured: false
      },
      {
        id: '208',
        name: 'AMD Radeon RX 6700 XT',
        description: 'Solid 1440p gaming performance',
        price: 349,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '12GB GDDR6', 'memory speed': '16 Gbps', 'stream processors': '2560', 'game clock': '2424 MHz', power: '230W' },
        inStock: 42,
        featured: false
      },
      {
        id: '209',
        name: 'NVIDIA RTX 4060',
        description: 'Entry-level ray tracing for 1080p gaming',
        price: 299,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { memory: '8GB GDDR6', 'memory speed': '17 Gbps', 'cuda cores': '3072', 'boost clock': '2460 MHz', power: '115W' },
        inStock: 55,
        featured: false
      },
      {
        id: '210',
        name: 'AMD Radeon RX 6600',
        description: 'Budget-friendly 1080p gaming',
        price: 229,
        categoryId: '2',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { memory: '8GB GDDR6', 'memory speed': '14 Gbps', 'stream processors': '1792', 'game clock': '2044 MHz', power: '132W' },
        inStock: 60,
        featured: false
      },

      // Motherboards (Category 3)
      {
        id: '301',
        name: 'ASUS ROG Strix X670E-E',
        description: 'Premium AM5 motherboard with PCIe 5.0 and DDR5',
        price: 499,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { socket: 'AM5', chipset: 'X670E', 'memory support': 'DDR5-5600', 'expansion slots': 'PCIe 5.0 x16', form: 'ATX' },
        inStock: 25,
        featured: true
      },
      {
        id: '302',
        name: 'MSI Z790 Gaming Pro WiFi',
        description: 'Intel Z790 motherboard with WiFi 6E',
        price: 389,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { socket: 'LGA1700', chipset: 'Z790', 'memory support': 'DDR5-5600', 'expansion slots': 'PCIe 5.0 x16', form: 'ATX' },
        inStock: 30,
        featured: false
      },
      {
        id: '303',
        name: 'Gigabyte B650 Aorus Elite',
        description: 'Mid-range AM5 motherboard with great features',
        price: 229,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { socket: 'AM5', chipset: 'B650', 'memory support': 'DDR5-4800', 'expansion slots': 'PCIe 4.0 x16', form: 'ATX' },
        inStock: 40,
        featured: false
      },
      {
        id: '304',
        name: 'ASRock B760M Pro RS',
        description: 'Micro-ATX motherboard for compact builds',
        price: 179,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { socket: 'LGA1700', chipset: 'B760', 'memory support': 'DDR5-4800', 'expansion slots': 'PCIe 4.0 x16', form: 'mATX' },
        inStock: 35,
        featured: false
      },
      {
        id: '305',
        name: 'ASUS TUF Gaming X570-Plus',
        description: 'Reliable AM4 motherboard for Ryzen processors',
        price: 199,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { socket: 'AM4', chipset: 'X570', 'memory support': 'DDR4-3200', 'expansion slots': 'PCIe 4.0 x16', form: 'ATX' },
        inStock: 45,
        featured: false
      },
      {
        id: '306',
        name: 'MSI B550M Pro VDH WiFi',
        description: 'Budget-friendly AM4 micro-ATX with WiFi',
        price: 129,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { socket: 'AM4', chipset: 'B550', 'memory support': 'DDR4-3200', 'expansion slots': 'PCIe 4.0 x16', form: 'mATX' },
        inStock: 50,
        featured: false
      },
      {
        id: '307',
        name: 'Gigabyte Z690 Aorus Master',
        description: 'High-end Intel motherboard with premium features',
        price: 549,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { socket: 'LGA1700', chipset: 'Z690', 'memory support': 'DDR5-6000', 'expansion slots': 'PCIe 5.0 x16', form: 'ATX' },
        inStock: 20,
        featured: false
      },
      {
        id: '308',
        name: 'ASRock X670E Taichi',
        description: 'Premium AM5 motherboard for enthusiasts',
        price: 629,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { socket: 'AM5', chipset: 'X670E', 'memory support': 'DDR5-6400', 'expansion slots': 'PCIe 5.0 x16', form: 'ATX' },
        inStock: 15,
        featured: false
      },
      {
        id: '309',
        name: 'ASUS Prime B450M-A',
        description: 'Basic AM4 motherboard for budget builds',
        price: 89,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { socket: 'AM4', chipset: 'B450', 'memory support': 'DDR4-2933', 'expansion slots': 'PCIe 3.0 x16', form: 'mATX' },
        inStock: 60,
        featured: false
      },
      {
        id: '310',
        name: 'MSI MAG B550 Tomahawk',
        description: 'Popular AM4 motherboard with great value',
        price: 169,
        categoryId: '3',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { socket: 'AM4', chipset: 'B550', 'memory support': 'DDR4-4400', 'expansion slots': 'PCIe 4.0 x16', form: 'ATX' },
        inStock: 38,
        featured: false
      },

      // Memory (Category 4)
      {
        id: '401',
        name: 'Corsair Vengeance DDR5-5600 32GB',
        description: 'High-performance DDR5 memory kit',
        price: 199,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { capacity: '32GB (2x16GB)', speed: 'DDR5-5600', latency: 'CL36', voltage: '1.25V', type: 'DIMM' },
        inStock: 40,
        featured: true
      },
      {
        id: '402',
        name: 'G.Skill Trident Z5 DDR5-6000 16GB',
        description: 'Premium DDR5 memory with RGB lighting',
        price: 149,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { capacity: '16GB (2x8GB)', speed: 'DDR5-6000', latency: 'CL36', voltage: '1.35V', type: 'DIMM' },
        inStock: 35,
        featured: false
      },
      {
        id: '403',
        name: 'Kingston Fury Beast DDR4-3200 32GB',
        description: 'Reliable DDR4 memory for gaming builds',
        price: 119,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { capacity: '32GB (2x16GB)', speed: 'DDR4-3200', latency: 'CL16', voltage: '1.35V', type: 'DIMM' },
        inStock: 50,
        featured: false
      },
      {
        id: '404',
        name: 'Samsung 980 PRO 2TB NVMe SSD',
        description: 'Ultra-fast PCIe 4.0 NVMe SSD',
        price: 179,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        specs: { capacity: '2TB', interface: 'PCIe 4.0 x4', 'read speed': '7000 MB/s', 'write speed': '5100 MB/s', form: 'M.2 2280' },
        inStock: 45,
        featured: false
      },
      {
        id: '405',
        name: 'WD Black SN850X 1TB NVMe SSD',
        description: 'Gaming-focused NVMe SSD with heatsink',
        price: 129,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        specs: { capacity: '1TB', interface: 'PCIe 4.0 x4', 'read speed': '7300 MB/s', 'write speed': '6300 MB/s', form: 'M.2 2280' },
        inStock: 40,
        featured: false
      },
      {
        id: '406',
        name: 'Crucial MX4 2TB SATA SSD',
        description: 'Affordable 2.5" SATA SSD for mass storage',
        price: 149,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        specs: { capacity: '2TB', interface: 'SATA 6Gb/s', 'read speed': '560 MB/s', 'write speed': '510 MB/s', form: '2.5"' },
        inStock: 55,
        featured: false
      },
      {
        id: '407',
        name: 'TeamGroup T-Force Delta RGB DDR4-3600 16GB',
        description: 'RGB DDR4 memory with excellent performance',
        price: 89,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400',
        specs: { capacity: '16GB (2x8GB)', speed: 'DDR4-3600', latency: 'CL18', voltage: '1.35V', type: 'DIMM' },
        inStock: 42,
        featured: false
      },
      {
        id: '408',
        name: 'Seagate BarraCuda 4TB HDD',
        description: 'High-capacity mechanical hard drive',
        price: 89,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        specs: { capacity: '4TB', interface: 'SATA 6Gb/s', speed: '5400 RPM', cache: '256MB', form: '3.5"' },
        inStock: 60,
        featured: false
      },
      {
        id: '409',
        name: 'Corsair Vengeance LPX DDR4-3000 64GB',
        description: 'High-capacity DDR4 kit for workstations',
        price: 229,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { capacity: '64GB (4x16GB)', speed: 'DDR4-3000', latency: 'CL16', voltage: '1.35V', type: 'DIMM' },
        inStock: 25,
        featured: false
      },
      {
        id: '410',
        name: 'Intel Optane 905P 480GB NVMe SSD',
        description: 'Ultra-low latency enterprise SSD',
        price: 399,
        categoryId: '4',
        imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=400',
        specs: { capacity: '480GB', interface: 'PCIe 3.0 x4', 'read speed': '2600 MB/s', 'write speed': '2200 MB/s', form: 'M.2 2280' },
        inStock: 15,
        featured: false
      },

      // Power Supplies (Category 5)
      {
        id: '501',
        name: 'Corsair RM850x 850W 80+ Gold',
        description: 'Fully modular power supply with 80+ Gold efficiency',
        price: 149,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { wattage: '850W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '135mm', warranty: '10 years' },
        inStock: 35,
        featured: true
      },
      {
        id: '502',
        name: 'EVGA SuperNOVA 1000 G6 1000W',
        description: 'High-wattage PSU for high-end systems',
        price: 199,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { wattage: '1000W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '135mm', warranty: '10 years' },
        inStock: 25,
        featured: false
      },
      {
        id: '503',
        name: 'Seasonic Focus GX-750 750W',
        description: 'Reliable 750W PSU with hybrid fan control',
        price: 129,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { wattage: '750W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '120mm', warranty: '10 years' },
        inStock: 40,
        featured: false
      },
      {
        id: '504',
        name: 'Thermaltake Toughpower GF1 650W',
        description: 'Mid-range PSU perfect for gaming builds',
        price: 99,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { wattage: '650W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '140mm', warranty: '10 years' },
        inStock: 50,
        featured: false
      },
      {
        id: '505',
        name: 'be quiet! Straight Power 11 550W',
        description: 'Silent operation PSU with 80+ Gold efficiency',
        price: 89,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { wattage: '550W', efficiency: '80+ Gold', modular: 'Semi-Modular', 'fan size': '135mm', warranty: '5 years' },
        inStock: 45,
        featured: false
      },
      {
        id: '506',
        name: 'Cooler Master V850 SFX Gold',
        description: 'Compact SFX PSU for small form factor builds',
        price: 169,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { wattage: '850W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '92mm', warranty: '10 years' },
        inStock: 20,
        featured: false
      },
      {
        id: '507',
        name: 'ASUS ROG Strix 1200W 80+ Platinum',
        description: 'Premium PSU for extreme gaming systems',
        price: 299,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { wattage: '1200W', efficiency: '80+ Platinum', modular: 'Fully Modular', 'fan size': '135mm', warranty: '10 years' },
        inStock: 15,
        featured: false
      },
      {
        id: '508',
        name: 'MSI MPG A750GF 750W',
        description: 'Gaming-focused PSU with RGB lighting',
        price: 119,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { wattage: '750W', efficiency: '80+ Gold', modular: 'Fully Modular', 'fan size': '120mm', warranty: '10 years' },
        inStock: 32,
        featured: false
      },
      {
        id: '509',
        name: 'Fractal Design Ion+ 560P',
        description: 'Ultra-quiet PSU with platinum efficiency',
        price: 139,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { wattage: '560W', efficiency: '80+ Platinum', modular: 'Fully Modular', 'fan size': '140mm', warranty: '10 years' },
        inStock: 28,
        featured: false
      },
      {
        id: '510',
        name: 'Antec EarthWatts Gold Pro 650W',
        description: 'Eco-friendly PSU with excellent efficiency',
        price: 79,
        categoryId: '5',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { wattage: '650W', efficiency: '80+ Gold', modular: 'Semi-Modular', 'fan size': '120mm', warranty: '7 years' },
        inStock: 55,
        featured: false
      },

      // Cases (Category 6)
      {
        id: '601',
        name: 'Lian Li PC-O11 Dynamic',
        description: 'Premium tempered glass case with excellent airflow',
        price: 149,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '420mm', 'fan support': '10x 120mm', 'radiator support': '360mm' },
        inStock: 30,
        featured: true
      },
      {
        id: '602',
        name: 'NZXT H7 Flow',
        description: 'Modern case with exceptional cooling performance',
        price: 129,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '400mm', 'fan support': '7x 120mm', 'radiator support': '280mm' },
        inStock: 35,
        featured: false
      },
      {
        id: '603',
        name: 'Fractal Design Define 7',
        description: 'Silent-focused case with sound dampening',
        price: 169,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { 'form factor': 'Full Tower', material: 'Steel', 'max gpu length': '440mm', 'fan support': '9x 140mm', 'radiator support': '420mm' },
        inStock: 25,
        featured: false
      },
      {
        id: '604',
        name: 'Corsair 4000D Airflow',
        description: 'Balanced airflow case for mainstream builds',
        price: 99,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '360mm', 'fan support': '6x 120mm', 'radiator support': '280mm' },
        inStock: 45,
        featured: false
      },
      {
        id: '605',
        name: 'Phanteks Eclipse P500A',
        description: 'High airflow case with RGB lighting',
        price: 139,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '435mm', 'fan support': '9x 120mm', 'radiator support': '360mm' },
        inStock: 28,
        featured: false
      },
      {
        id: '606',
        name: 'be quiet! Pure Base 500DX',
        description: 'Silent case with excellent build quality',
        price: 109,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '369mm', 'fan support': '7x 120mm', 'radiator support': '240mm' },
        inStock: 32,
        featured: false
      },
      {
        id: '607',
        name: 'Cooler Master MasterBox TD500',
        description: 'RGB mesh front panel for optimal cooling',
        price: 89,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '410mm', 'fan support': '6x 120mm', 'radiator support': '240mm' },
        inStock: 40,
        featured: false
      },
      {
        id: '608',
        name: 'Thermaltake View 71 TG',
        description: 'Full tower case with massive expansion',
        price: 199,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { 'form factor': 'Full Tower', material: 'Steel/Glass', 'max gpu length': '500mm', 'fan support': '12x 120mm', 'radiator support': '420mm' },
        inStock: 20,
        featured: false
      },
      {
        id: '609',
        name: 'Silverstone SG13',
        description: 'Ultra-compact Mini-ITX case',
        price: 59,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400',
        specs: { 'form factor': 'Mini-ITX', material: 'Steel', 'max gpu length': '267mm', 'fan support': '2x 120mm', 'radiator support': '120mm' },
        inStock: 35,
        featured: false
      },
      {
        id: '610',
        name: 'ASUS TUF Gaming GT501',
        description: 'Gaming-focused case with tempered glass',
        price: 159,
        categoryId: '6',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400',
        specs: { 'form factor': 'Mid Tower', material: 'Steel/Glass', 'max gpu length': '420mm', 'fan support': '8x 120mm', 'radiator support': '360mm' },
        inStock: 22,
        featured: false
      }
    ];
    productStorage.saveProducts(defaultProducts);
  }
};