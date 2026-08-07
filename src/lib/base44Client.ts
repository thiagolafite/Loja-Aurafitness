import {
  Product,
  Order,
  CustomerProfile,
  Review,
  BlogPost,
  Coupon,
  Promotion,
  LookSet,
  StoreSettings,
  InventoryMovement,
  PaymentLog,
  NotificationItem,
} from '../types';
import {
  initialProducts,
  initialOrders,
  initialCustomers,
  initialReviews,
  initialBlogPosts,
  initialCoupons,
  initialPromotions,
  initialLookSets,
  initialStoreSettings,
} from '../data/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'aura_products_v1',
  ORDERS: 'aura_orders_v1',
  CUSTOMERS: 'aura_customers_v1',
  REVIEWS: 'aura_reviews_v1',
  BLOG: 'aura_blog_v1',
  COUPONS: 'aura_coupons_v1',
  PROMOTIONS: 'aura_promotions_v1',
  LOOK_SETS: 'aura_look_sets_v1',
  SETTINGS: 'aura_settings_v1',
  INVENTORY_LOGS: 'aura_inventory_logs_v1',
  PAYMENT_LOGS: 'aura_payment_logs_v1',
  NOTIFICATIONS: 'aura_notifications_v1',
};

function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from LocalStorage:`, error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to LocalStorage:`, error);
  }
}

// Initialize seed data if empty
export function initBase44Database(): void {
  if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
    setStorageItem(STORAGE_KEYS.PRODUCTS, initialProducts);
  }
  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
    setStorageItem(STORAGE_KEYS.ORDERS, initialOrders);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
    setStorageItem(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  }
  if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
    setStorageItem(STORAGE_KEYS.REVIEWS, initialReviews);
  }
  if (!localStorage.getItem(STORAGE_KEYS.BLOG)) {
    setStorageItem(STORAGE_KEYS.BLOG, initialBlogPosts);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COUPONS)) {
    setStorageItem(STORAGE_KEYS.COUPONS, initialCoupons);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROMOTIONS)) {
    setStorageItem(STORAGE_KEYS.PROMOTIONS, initialPromotions);
  }
  if (!localStorage.getItem(STORAGE_KEYS.LOOK_SETS)) {
    setStorageItem(STORAGE_KEYS.LOOK_SETS, initialLookSets);
  }
  if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
    setStorageItem(STORAGE_KEYS.SETTINGS, initialStoreSettings);
  }
  if (!localStorage.getItem(STORAGE_KEYS.INVENTORY_LOGS)) {
    setStorageItem(STORAGE_KEYS.INVENTORY_LOGS, [
      {
        id: 'log-1',
        productId: 'prod-1',
        productName: 'Legging Aura Compression High Waist',
        sku: 'AUR-LEG-001',
        type: 'in',
        quantity: 60,
        variant: 'M-Verde Oliva',
        reason: 'Estoque inicial da fábrica',
        date: '2026-07-01T10:00:00Z',
        user: 'Admin Sistema',
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PAYMENT_LOGS)) {
    setStorageItem(STORAGE_KEYS.PAYMENT_LOGS, [
      {
        id: 'pay-1',
        orderId: 'ord-1001',
        orderNumber: 'AURA-84912',
        amount: 274.70,
        method: 'pix',
        status: 'success',
        timestamp: '2026-08-03T14:22:00Z',
        transactionId: 'TX-PIX-9821379',
      },
    ]);
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, [
      {
        id: 'notif-1',
        title: 'Novo pedido recebido!',
        message: 'Pedido #AURA-84913 pago via Cartão de Crédito.',
        type: 'order',
        read: false,
        timestamp: '2026-08-04T09:15:00Z',
        actionUrl: '/admin/pedidos',
      },
    ]);
  }
}

// Call initialization immediately
initBase44Database();

// --- PRODUCTS SERVICE ---
export function getProducts(): Product[] {
  return getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export function saveProduct(productData: Partial<Product>): Product {
  const products = getProducts();
  let updatedProduct: Product;

  if (productData.id) {
    // Update
    const index = products.findIndex((p) => p.id === productData.id);
    if (index !== -1) {
      updatedProduct = { ...products[index], ...productData } as Product;
      products[index] = updatedProduct;
    } else {
      updatedProduct = productData as Product;
      products.push(updatedProduct);
    }
  } else {
    // Create
    const newId = `prod-${Date.now()}`;
    const slug = productData.name
      ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `produto-${Date.now()}`;

    updatedProduct = {
      id: newId,
      name: productData.name || 'Novo Produto',
      slug,
      description: productData.description || '',
      fullDescription: productData.fullDescription || '',
      category: productData.category || 'Leggings',
      price: productData.price || 0,
      promotionalPrice: productData.promotionalPrice,
      sku: productData.sku || `SKU-${Date.now()}`,
      barcode: productData.barcode || '7890000000000',
      weight: productData.weight || 200,
      brand: 'Aura Fitness',
      images: productData.images || ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'],
      sizes: productData.sizes || ['P', 'M', 'G'],
      colors: productData.colors || [{ name: 'Verde Oliva', hex: '#5F6F3A' }],
      materials: productData.materials || ['Poliamida'],
      stock: productData.stock || { 'P-Verde Oliva': 10 },
      isFeatured: productData.isFeatured || false,
      isNewArrival: productData.isNewArrival || true,
      isBestSeller: productData.isBestSeller || false,
      isActive: productData.isActive ?? true,
      rating: 5.0,
      reviewCount: 0,
      seo: productData.seo || { title: productData.name || '', description: '', keywords: [] },
      createdAt: new Date().toISOString(),
    };
    products.push(updatedProduct);
  }

  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

export function deleteProduct(id: string): void {
  const products = getProducts().filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
}

export function bulkImportProducts(items: Partial<Product>[]): Product[] {
  const products = getProducts();
  const importedList: Product[] = [];

  items.forEach((item) => {
    let existingIndex = -1;
    if (item.id) {
      existingIndex = products.findIndex((p) => p.id === item.id);
    } else if (item.sku) {
      existingIndex = products.findIndex((p) => p.sku.toLowerCase() === item.sku?.toLowerCase());
    } else if (item.name) {
      existingIndex = products.findIndex((p) => p.name.toLowerCase() === item.name?.toLowerCase());
    }

    if (existingIndex !== -1) {
      const existing = products[existingIndex];
      const updated: Product = {
        ...existing,
        ...item,
        price: item.price !== undefined && item.price > 0 ? item.price : existing.price,
        promotionalPrice: item.promotionalPrice !== undefined ? item.promotionalPrice : existing.promotionalPrice,
        stock: item.stock ? { ...existing.stock, ...item.stock } : existing.stock,
      };
      products[existingIndex] = updated;
      importedList.push(updated);
    } else {
      const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const slug = item.name
        ? item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
        : `produto-${Date.now()}`;

      const newProduct: Product = {
        id: newId,
        name: item.name || 'Novo Produto',
        slug,
        description: item.description || '',
        fullDescription: item.fullDescription || '',
        category: item.category || 'Leggings',
        price: item.price || 189.90,
        promotionalPrice: item.promotionalPrice,
        sku: item.sku || `SKU-${Date.now()}`,
        barcode: item.barcode || '7890000000000',
        weight: item.weight || 200,
        brand: 'Aura Fitness',
        images: item.images || ['https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png'],
        sizes: item.sizes || ['PP', 'P', 'M', 'G', 'GG'],
        colors: item.colors || [{ name: 'Verde Oliva', hex: '#2b5022' }],
        materials: item.materials || ['86% Poliamida', '14% Elastano'],
        stock: item.stock || { 'P-Verde Oliva': 10, 'M-Verde Oliva': 15 },
        isFeatured: item.isFeatured ?? true,
        isNewArrival: item.isNewArrival ?? true,
        isBestSeller: item.isBestSeller ?? false,
        isActive: item.isActive ?? true,
        rating: 5.0,
        reviewCount: 0,
        seo: item.seo || { title: item.name || '', description: '', keywords: ['aura fitness'] },
        createdAt: new Date().toISOString(),
      };
      products.push(newProduct);
      importedList.push(newProduct);
    }
  });

  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  return importedList;
}

// --- ORDERS SERVICE ---
export function getOrders(): Order[] {
  return getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id || o.orderNumber === id);
}

export function createOrder(orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
  const orders = getOrders();
  const orderNumber = `AURA-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    ...orderInput,
    id: `ord-${Date.now()}`,
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  setStorageItem(STORAGE_KEYS.ORDERS, orders);

  // Decrement stock for ordered items
  const products = getProducts();
  const inventoryLogs = getStorageItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_LOGS, []);

  newOrder.items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (product && product.stock) {
      const variantKey = `${item.size}-${item.colorName}`;
      if (product.stock[variantKey] !== undefined) {
        product.stock[variantKey] = Math.max(0, product.stock[variantKey] - item.quantity);
      }
      // Add inventory movement log
      inventoryLogs.unshift({
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: product.id,
        productName: product.name,
        sku: item.sku,
        type: 'out',
        quantity: item.quantity,
        variant: variantKey,
        reason: `Venda do Pedido #${orderNumber}`,
        date: new Date().toISOString(),
        user: 'Cliente (Checkout)',
      });
    }
  });

  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  setStorageItem(STORAGE_KEYS.INVENTORY_LOGS, inventoryLogs);

  // Log payment
  const paymentLogs = getStorageItem<PaymentLog[]>(STORAGE_KEYS.PAYMENT_LOGS, []);
  paymentLogs.unshift({
    id: `pay-${Date.now()}`,
    orderId: newOrder.id,
    orderNumber: newOrder.orderNumber,
    amount: newOrder.totals.total,
    method: newOrder.paymentMethod,
    status: 'success',
    timestamp: new Date().toISOString(),
    transactionId: `TX-${newOrder.paymentMethod.toUpperCase()}-${Date.now()}`,
  });
  setStorageItem(STORAGE_KEYS.PAYMENT_LOGS, paymentLogs);

  // Push notification for Admin
  const notifications = getStorageItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'Novo pedido criado!',
    message: `Pedido #${orderNumber} no valor de R$ ${newOrder.totals.total.toFixed(2)} por ${newOrder.customer.name}`,
    type: 'order',
    read: false,
    timestamp: new Date().toISOString(),
    actionUrl: `/admin/pedidos`,
  });
  setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications);

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order['status'], trackingCode?: string): Order | undefined {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (trackingCode !== undefined) {
      order.trackingCode = trackingCode;
    }
    setStorageItem(STORAGE_KEYS.ORDERS, orders);
  }
  return order;
}

// --- CUSTOMER SERVICE ---
export function getCustomers(): CustomerProfile[] {
  return getStorageItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
}

export function saveCustomerProfile(profile: Partial<CustomerProfile>): CustomerProfile {
  const customers = getCustomers();
  const index = customers.findIndex((c) => c.id === profile.id || c.email === profile.email);
  let updated: CustomerProfile;
  if (index !== -1) {
    updated = { ...customers[index], ...profile };
    customers[index] = updated;
  } else {
    updated = {
      id: `cust-${Date.now()}`,
      name: profile.name || 'Cliente Aura',
      email: profile.email || '',
      cpf: profile.cpf || '',
      phone: profile.phone || '',
      addresses: profile.addresses || [],
      totalOrders: 0,
      totalSpent: 0,
      averageTicket: 0,
      lastAccess: new Date().toISOString(),
      wishlist: [],
    };
    customers.push(updated);
  }
  setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
  return updated;
}

// --- REVIEWS SERVICE ---
export function getReviews(): Review[] {
  return getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
}

export function getApprovedReviewsByProductId(productId: string): Review[] {
  return getReviews().filter((r) => r.productId === productId && r.status === 'approved');
}

export function addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>): Review {
  const reviews = getReviews();
  const newReview: Review = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending', // Requires admin approval
  };
  reviews.unshift(newReview);
  setStorageItem(STORAGE_KEYS.REVIEWS, reviews);
  return newReview;
}

export function updateReviewStatus(reviewId: string, status: Review['status'], adminReply?: string): Review | undefined {
  const reviews = getReviews();
  const rev = reviews.find((r) => r.id === reviewId);
  if (rev) {
    rev.status = status;
    if (adminReply !== undefined) {
      rev.adminReply = adminReply;
    }
    setStorageItem(STORAGE_KEYS.REVIEWS, reviews);

    // Recalculate rating on product
    const approved = reviews.filter((r) => r.productId === rev.productId && r.status === 'approved');
    const products = getProducts();
    const product = products.find((p) => p.id === rev.productId);
    if (product) {
      product.reviewCount = approved.length;
      if (approved.length > 0) {
        const sum = approved.reduce((acc, curr) => acc + curr.rating, 0);
        product.rating = Number((sum / approved.length).toFixed(1));
      }
      setStorageItem(STORAGE_KEYS.PRODUCTS, products);
    }
  }
  return rev;
}

// --- BLOG SERVICE ---
export function getBlogPosts(): BlogPost[] {
  return getStorageItem<BlogPost[]>(STORAGE_KEYS.BLOG, initialBlogPosts);
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return getBlogPosts().find((p) => p.slug === slug);
}

export function saveBlogPost(postData: Partial<BlogPost>): BlogPost {
  const posts = getBlogPosts();
  let updated: BlogPost;

  if (postData.id) {
    const index = posts.findIndex((p) => p.id === postData.id);
    if (index !== -1) {
      updated = { ...posts[index], ...postData };
      posts[index] = updated;
    } else {
      updated = postData as BlogPost;
      posts.push(updated);
    }
  } else {
    const slug = postData.title
      ? postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `post-${Date.now()}`;

    updated = {
      id: `post-${Date.now()}`,
      title: postData.title || 'Título do Artigo',
      slug,
      summary: postData.summary || '',
      content: postData.content || '',
      category: postData.category || 'Moda Fitness',
      author: postData.author || {
        name: 'Equipe Aura Fitness',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
      },
      imageUrl: postData.imageUrl || 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=1200&q=80',
      readTimeMinutes: postData.readTimeMinutes || 4,
      publishedAt: new Date().toISOString(),
      isPublished: postData.isPublished ?? true,
      seo: postData.seo || { title: postData.title || '', description: postData.summary || '' },
    };
    posts.unshift(updated);
  }
  setStorageItem(STORAGE_KEYS.BLOG, posts);
  return updated;
}

export function deleteBlogPost(id: string): void {
  const posts = getBlogPosts().filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.BLOG, posts);
}

// --- COUPONS SERVICE ---
export function getCoupons(): Coupon[] {
  return getStorageItem<Coupon[]>(STORAGE_KEYS.COUPONS, initialCoupons);
}

export function saveCoupon(couponData: Partial<Coupon>): Coupon {
  const coupons = getCoupons();
  let updated: Coupon;
  if (couponData.id) {
    const idx = coupons.findIndex((c) => c.id === couponData.id);
    if (idx !== -1) {
      updated = { ...coupons[idx], ...couponData };
      coupons[idx] = updated;
    } else {
      updated = couponData as Coupon;
      coupons.push(updated);
    }
  } else {
    updated = {
      id: `coup-${Date.now()}`,
      code: (couponData.code || 'AURA10').toUpperCase().trim(),
      discountType: couponData.discountType || 'percentage',
      value: couponData.value || 10,
      minSpend: couponData.minSpend || 0,
      maxUses: couponData.maxUses,
      usedCount: 0,
      expiresAt: couponData.expiresAt || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      isFirstPurchaseOnly: couponData.isFirstPurchaseOnly || false,
      isActive: couponData.isActive ?? true,
    };
    coupons.push(updated);
  }
  setStorageItem(STORAGE_KEYS.COUPONS, coupons);
  return updated;
}

export function deleteCoupon(id: string): void {
  const coupons = getCoupons().filter((c) => c.id !== id);
  setStorageItem(STORAGE_KEYS.COUPONS, coupons);
}

export function validateCoupon(code: string, subtotal: number): { valid: boolean; coupon?: Coupon; message?: string } {
  const coupons = getCoupons();
  const coupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase().trim());

  if (!coupon) {
    return { valid: false, message: 'Cupom de desconto não encontrado.' };
  }
  if (!coupon.isActive) {
    return { valid: false, message: 'Este cupom não está mais ativo.' };
  }
  if (new Date(coupon.expiresAt) < new Date()) {
    return { valid: false, message: 'Este cupom expirou.' };
  }
  if (coupon.minSpend && subtotal < coupon.minSpend) {
    return { valid: false, message: `Valor mínimo para este cupom é R$ ${coupon.minSpend.toFixed(2)}` };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { valid: false, message: 'Este cupom atingiu o limite de usos.' };
  }

  return { valid: true, coupon };
}

// --- PROMOTIONS & LOOK SETS ---
export function getPromotions(): Promotion[] {
  return getStorageItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, initialPromotions);
}

export function savePromotion(promo: Partial<Promotion>): Promotion {
  const promos = getPromotions();
  let updated: Promotion;
  if (promo.id) {
    const idx = promos.findIndex((p) => p.id === promo.id);
    if (idx !== -1) {
      updated = { ...promos[idx], ...promo };
      promos[idx] = updated;
    } else {
      updated = promo as Promotion;
      promos.push(updated);
    }
  } else {
    updated = {
      id: `promo-${Date.now()}`,
      title: promo.title || 'Nova Promoção',
      description: promo.description || '',
      badgeText: promo.badgeText || 'OFERTA',
      bannerUrl: promo.bannerUrl || 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      discountPercentage: promo.discountPercentage || 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      ...promo,
    };
    promos.unshift(updated);
  }
  setStorageItem(STORAGE_KEYS.PROMOTIONS, promos);
  return updated;
}

export function applyPromotionToProducts(
  discountPercentage: number,
  targetType: 'category' | 'products' | 'all',
  targetCategory?: string,
  selectedProductIds?: string[]
): number {
  const products = getProducts();
  let affectedCount = 0;

  const updatedProducts = products.map((p) => {
    let shouldApply = false;
    if (targetType === 'all') {
      shouldApply = true;
    } else if (targetType === 'category' && targetCategory) {
      shouldApply = p.category.toLowerCase() === targetCategory.toLowerCase();
    } else if (targetType === 'products' && selectedProductIds) {
      shouldApply = selectedProductIds.includes(p.id);
    }

    if (shouldApply) {
      affectedCount++;
      const discountedPrice = Math.round(p.price * (1 - discountPercentage / 100) * 100) / 100;
      return {
        ...p,
        promotionalPrice: discountedPrice,
      };
    }
    return p;
  });

  setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
  return affectedCount;
}

export function deletePromotion(id: string): void {
  setStorageItem(
    STORAGE_KEYS.PROMOTIONS,
    getPromotions().filter((p) => p.id !== id)
  );
}

export function getLookSets(): LookSet[] {
  return getStorageItem<LookSet[]>(STORAGE_KEYS.LOOK_SETS, initialLookSets);
}

export function saveLookSet(lookSet: Partial<LookSet>): LookSet {
  const sets = getLookSets();
  let updated: LookSet;
  if (lookSet.id) {
    const idx = sets.findIndex((s) => s.id === lookSet.id);
    if (idx !== -1) {
      updated = { ...sets[idx], ...lookSet };
      sets[idx] = updated;
    } else {
      updated = lookSet as LookSet;
      sets.push(updated);
    }
  } else {
    updated = {
      id: `set-${Date.now()}`,
      title: lookSet.title || 'Novo Conjunto Look',
      description: lookSet.description || '',
      imageUrl: lookSet.imageUrl || 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80',
      productIds: lookSet.productIds || [],
      setDiscountPercentage: lookSet.setDiscountPercentage || 15,
      totalPrice: lookSet.totalPrice || 299.9,
      discountedPrice: lookSet.discountedPrice || 254.91,
      isActive: true,
    };
    sets.push(updated);
  }
  setStorageItem(STORAGE_KEYS.LOOK_SETS, sets);
  return updated;
}

export function deleteLookSet(id: string): void {
  setStorageItem(
    STORAGE_KEYS.LOOK_SETS,
    getLookSets().filter((s) => s.id !== id)
  );
}

// --- SETTINGS SERVICE ---
export function getStoreSettings(): StoreSettings {
  return getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, initialStoreSettings);
}

export function updateStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const updated = { ...current, ...settings };
  setStorageItem(STORAGE_KEYS.SETTINGS, updated);
  return updated;
}

// --- LOGS & NOTIFICATIONS ---
export function getInventoryMovements(): InventoryMovement[] {
  return getStorageItem<InventoryMovement[]>(STORAGE_KEYS.INVENTORY_LOGS, []);
}

export function getPaymentLogs(): PaymentLog[] {
  return getStorageItem<PaymentLog[]>(STORAGE_KEYS.PAYMENT_LOGS, []);
}

export function getNotifications(): NotificationItem[] {
  return getStorageItem<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, []);
}

export function markNotificationRead(id: string): void {
  const notifs = getNotifications();
  const item = notifs.find((n) => n.id === id);
  if (item) {
    item.read = true;
    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifs);
  }
}

// --- BASE44 SMART AI SERVICES ---
export async function aiGenerateProductDescription(productName: string, category: string, keyFeatures: string): Promise<{ shortDescription: string; fullDescription: string }> {
  // Simulate AI Latency
  await new Promise((res) => setTimeout(res, 1200));

  return {
    shortDescription: `${productName} projetado com tecnologia de alta compressão e toque aveludado para proporcionar máximo conforto, modelagem anatômica perfeita e zero transparência em treinos intensos.`,
    fullDescription: `Eleve sua experiência de treino com o novo **${productName}**. Desenvolvido com nossa malha inteligente AuraFit™, este produto combina regulação térmica avançada, elasticidade multidirecional e costuras reforçadas que não marcam a pele. Destaques: ${keyFeatures || 'Efeito modelador, secagem rápida e proteção solar UV50+.'}`,
  };
}

export async function aiGenerateBlogPost(topic: string, category: string): Promise<{ title: string; summary: string; content: string }> {
  await new Promise((res) => setTimeout(res, 1500));

  return {
    title: topic ? `Como Otimizar Seu Treino com ${topic}` : `O Poder da Consistência no Seu Estilo de Vida Fitness`,
    summary: `Descubra as principais dicas e estratégias comprovadas pela ciência para atingir seus objetivos de forma saudável e sustentável.`,
    content: `
      <h2>Introdução ao ${topic || 'Estilo de Vida Ativo'}</h2>
      <p>A constante evolução nos treinos exige mais do que disciplina; exige os equipamentos, roupas e estratégias certas. Quando alinhamos vestuário de alta performance com a nutrição adequada, os resultados surgem naturalmente.</p>
      
      <h3>Benefícios Fundamentais</h3>
      <ul>
        <li>Aumento substancial no foco e energia diária;</li>
        <li>Recuperação muscular otimizada através de roupas com tecnologia de compressão gradual;</li>
        <li>Maior autoconfiança e sensação de bem-estar corporal.</li>
      </ul>
      
      <p>Na <strong>Aura Fitness</strong>, desenvolvemos cada peça pensando na sincronia entre seu corpo e sua mente durante o movimento.</p>
    `,
  };
}

export async function aiGenerateSeoMeta(title: string, content: string): Promise<{ seoTitle: string; seoDescription: string; keywords: string[] }> {
  await new Promise((res) => setTimeout(res, 800));

  return {
    seoTitle: `${title} | Aura Fitness Moda Esportiva`,
    seoDescription: `Confira ${title} na Aura Fitness. Peças esportivas com tecnologia de compressão sem transparência e frete rápido para todo o Brasil.`,
    keywords: ['aura fitness', 'moda fitness', 'legging compressão', 'top fitness', 'roupa de academia feminina'],
  };
}

export function resetToInitialData(): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(initialProducts));
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(initialOrders));
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(initialReviews));
  localStorage.setItem(STORAGE_KEYS.BLOG, JSON.stringify(initialBlogPosts));
  localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(initialCoupons));
  localStorage.setItem(STORAGE_KEYS.PROMOTIONS, JSON.stringify(initialPromotions));
  localStorage.setItem(STORAGE_KEYS.LOOK_SETS, JSON.stringify(initialLookSets));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialStoreSettings));
}
