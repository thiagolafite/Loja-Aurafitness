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
import { supabase, isSupabaseConfigured } from './supabaseClient';

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

// In-memory cache for synchronous reads with background Supabase sync
let cachedProducts: Product[] = getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
let cachedOrders: Order[] = getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
let cachedCustomers: CustomerProfile[] = getStorageItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
let cachedReviews: Review[] = getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
let cachedBlogPosts: BlogPost[] = getStorageItem<BlogPost[]>(STORAGE_KEYS.BLOG, initialBlogPosts);
let cachedCoupons: Coupon[] = getStorageItem<Coupon[]>(STORAGE_KEYS.COUPONS, initialCoupons);
let cachedPromotions: Promotion[] = getStorageItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, initialPromotions);
let cachedLookSets: LookSet[] = getStorageItem<LookSet[]>(STORAGE_KEYS.LOOK_SETS, initialLookSets);
let cachedSettings: StoreSettings = getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, initialStoreSettings);

// Synchronize Supabase in background
export async function syncWithSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // 1. Products
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prods && prods.length > 0) {
      cachedProducts = prods.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || '',
        fullDescription: p.full_description || '',
        category: p.category,
        price: Number(p.price),
        promotionalPrice: p.promotional_price ? Number(p.promotional_price) : undefined,
        sku: p.sku,
        barcode: p.barcode || '7890000000000',
        weight: Number(p.weight) || 200,
        brand: p.brand || 'Aura Fitness',
        images: p.images || [],
        videoUrl: p.video_url,
        sizes: p.sizes || ['P', 'M', 'G'],
        colors: p.colors || [],
        materials: p.materials || [],
        stock: p.stock || {},
        isFeatured: Boolean(p.is_featured),
        isNewArrival: Boolean(p.is_new_arrival),
        isBestSeller: Boolean(p.is_best_seller),
        isActive: Boolean(p.is_active),
        rating: Number(p.rating) || 5.0,
        reviewCount: Number(p.review_count) || 0,
        seo: p.seo || { title: p.name, description: '', keywords: [] },
        createdAt: p.created_at,
      }));
      setStorageItem(STORAGE_KEYS.PRODUCTS, cachedProducts);
    }

    // 2. Settings
    const { data: sett } = await supabase.from('store_settings').select('*').eq('id', 'default').maybeSingle();
    if (sett) {
      cachedSettings = {
        companyName: sett.company_name,
        cnpj: sett.cnpj,
        phone: sett.phone,
        whatsappNumber: sett.whatsapp_number,
        pixKey: sett.pix_key,
        pixKeyType: sett.pix_key_type,
        email: sett.email,
        address: sett.address,
        social: sett.social,
        logoUrl: sett.logo_url,
        bannerUrl: sett.banner_url,
        shipping: sett.shipping,
        seo: sett.seo,
      };
      setStorageItem(STORAGE_KEYS.SETTINGS, cachedSettings);
    }

    // 3. Coupons
    const { data: coups } = await supabase.from('coupons').select('*');
    if (coups) {
      cachedCoupons = coups.map((c) => ({
        id: c.id,
        code: c.code,
        discountType: c.discount_type,
        value: Number(c.value),
        minSpend: c.min_spend ? Number(c.min_spend) : undefined,
        maxUses: c.max_uses,
        usedCount: c.used_count || 0,
        expiresAt: c.expires_at || '',
        isFirstPurchaseOnly: Boolean(c.is_first_purchase_only),
        isActive: Boolean(c.is_active),
      }));
      setStorageItem(STORAGE_KEYS.COUPONS, cachedCoupons);
    }

    // 4. Blog Posts
    const { data: posts } = await supabase.from('blog_posts').select('*').order('published_at', { ascending: false });
    if (posts) {
      cachedBlogPosts = posts.map((b) => ({
        id: b.id,
        title: b.title,
        slug: b.slug,
        summary: b.summary || '',
        content: b.content || '',
        category: b.category,
        author: b.author,
        imageUrl: b.image_url,
        readTimeMinutes: b.read_time_minutes || 5,
        publishedAt: b.published_at,
        isPublished: Boolean(b.is_published),
        seo: b.seo,
      }));
      setStorageItem(STORAGE_KEYS.BLOG, cachedBlogPosts);
    }

    // 5. Reviews
    const { data: revs } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (revs) {
      cachedReviews = revs.map((r) => ({
        id: r.id,
        productId: r.product_id,
        productName: r.product_name,
        productImage: r.product_image,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        rating: Number(r.rating),
        title: r.title || '',
        comment: r.comment || '',
        status: r.status,
        adminReply: r.admin_reply,
        isSpam: Boolean(r.is_spam),
        createdAt: r.created_at,
      }));
      setStorageItem(STORAGE_KEYS.REVIEWS, cachedReviews);
    }
  } catch (err) {
    console.error('Supabase background sync error:', err);
  }
}

// Initial sync call
syncWithSupabase();

// --- PRODUCTS SERVICE ---
export function getProducts(): Product[] {
  return cachedProducts;
}

export async function fetchProductsAsync(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    await syncWithSupabase();
  }
  return cachedProducts;
}

export function getProductById(id: string): Product | undefined {
  return cachedProducts.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return cachedProducts.find((p) => p.slug === slug);
}

export async function saveProductAsync(productData: Partial<Product>): Promise<Product> {
  if (!isSupabaseConfigured()) {
    return saveProduct(productData);
  }

  const slug = productData.slug || (productData.name
    ? productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    : `produto-${Date.now()}`);

  const payload: any = {
    name: productData.name || 'Novo Produto',
    slug,
    description: productData.description || '',
    full_description: productData.fullDescription || '',
    category: productData.category || 'Leggings',
    price: productData.price || 0,
    promotional_price: productData.promotionalPrice || null,
    sku: productData.sku || `SKU-${Date.now()}`,
    barcode: productData.barcode || '7890000000000',
    weight: productData.weight || 200,
    brand: productData.brand || 'Aura Fitness',
    images: productData.images || ['/images/look-3103.png'],
    video_url: productData.videoUrl || null,
    sizes: productData.sizes || ['P', 'M', 'G'],
    colors: productData.colors || [{ name: 'Verde Oliva', hex: '#5F6F3A' }],
    materials: productData.materials || ['Poliamida'],
    stock: productData.stock || { 'P-Verde Oliva': 10 },
    is_featured: productData.isFeatured ?? false,
    is_new_arrival: productData.isNewArrival ?? true,
    is_best_seller: productData.isBestSeller ?? false,
    is_active: productData.isActive ?? true,
    seo: productData.seo || { title: productData.name || '', description: '', keywords: [] },
  };

  if (productData.id && productData.id.length > 10 && !productData.id.startsWith('prod-')) {
    payload.id = productData.id;
  }

  const { data, error } = await supabase.from('products').upsert(payload).select().single();
  if (error) throw error;

  await syncWithSupabase();
  return getProductById(data.id) || (productData as Product);
}

export function saveProduct(productData: Partial<Product>): Product {
  saveProductAsync(productData).catch((e) => console.error(e));

  const products = getProducts();
  let updatedProduct: Product;

  if (productData.id) {
    const index = products.findIndex((p) => p.id === productData.id);
    if (index !== -1) {
      updatedProduct = { ...products[index], ...productData } as Product;
      products[index] = updatedProduct;
    } else {
      updatedProduct = productData as Product;
      products.push(updatedProduct);
    }
  } else {
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
      images: productData.images || ['/images/look-3103.png'],
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

  cachedProducts = products;
  setStorageItem(STORAGE_KEYS.PRODUCTS, products);
  return updatedProduct;
}

export function deleteProduct(id: string): void {
  if (isSupabaseConfigured()) {
    supabase.from('products').delete().eq('id', id).then(() => syncWithSupabase());
  }
  cachedProducts = cachedProducts.filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.PRODUCTS, cachedProducts);
}

export function bulkImportProducts(items: Partial<Product>[]): Product[] {
  items.forEach((item) => saveProduct(item));
  return getProducts();
}

// --- ORDERS SERVICE ---
export function getOrders(): Order[] {
  return getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, cachedOrders);
}

export async function fetchOrdersAsync(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return getOrders();

  const { data: ords } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (ords) {
    cachedOrders = ords.map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      customer: o.customer,
      items: (o.order_items || []).map((it: any) => ({
        productId: it.product_id,
        productName: it.product_name,
        productImage: it.product_image,
        sku: it.sku,
        size: it.size,
        colorName: it.color_name,
        price: Number(it.price),
        quantity: Number(it.quantity),
        total: Number(it.total),
      })),
      shippingAddress: o.shipping_address,
      shippingMethod: o.shipping_method,
      paymentMethod: o.payment_method,
      paymentDetails: o.payment_details,
      totals: o.totals,
      status: o.status,
      trackingCode: o.tracking_code,
      couponCode: o.coupon_code,
      notes: o.notes,
    }));
    setStorageItem(STORAGE_KEYS.ORDERS, cachedOrders);
  }
  return cachedOrders;
}

export function getOrderById(id: string): Order | undefined {
  return getOrders().find((o) => o.id === id || o.orderNumber === id);
}

export function createOrder(orderInput: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt'>): Order {
  const orderNumber = `AURA-${Math.floor(10000 + Math.random() * 90000)}`;
  const newOrder: Order = {
    ...orderInput,
    id: `ord-${Date.now()}`,
    orderNumber,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const orderPayload = {
      customer: orderInput.customer,
      shipping_address: orderInput.shippingAddress,
      shipping_method: orderInput.shippingMethod,
      payment_method: orderInput.paymentMethod,
      payment_details: orderInput.paymentDetails,
      totals: orderInput.totals,
      status: orderInput.status || 'pendente',
      coupon_code: orderInput.couponCode || null,
      notes: orderInput.notes || null,
    };

    const itemsPayload = orderInput.items.map((it) => ({
      product_id: it.productId,
      product_name: it.productName,
      product_image: it.productImage,
      sku: it.sku,
      size: it.size,
      color_name: it.colorName,
      price: it.price,
      quantity: it.quantity,
      total: it.total,
    }));

    supabase.rpc('create_order_atomic', { p_order: orderPayload, p_items: itemsPayload })
      .then(({ data, error }: any) => {
        if (error) {
          console.error('Atomic order creation error:', error);
        } else if (data && data.order_id) {
          newOrder.id = data.order_id;
          newOrder.orderNumber = data.order_number;
        }
      });
  }

  const orders = getOrders();
  orders.unshift(newOrder);
  cachedOrders = orders;
  setStorageItem(STORAGE_KEYS.ORDERS, orders);

  return newOrder;
}

export function updateOrderStatus(orderId: string, status: Order['status'], trackingCode?: string): Order | undefined {
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    if (trackingCode !== undefined) {
      order.trackingCode = trackingCode;
    }
    setStorageItem(STORAGE_KEYS.ORDERS, orders);

    if (isSupabaseConfigured()) {
      supabase.from('orders')
        .update({ status, tracking_code: trackingCode, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .then(() => fetchOrdersAsync());
    }
  }
  return order;
}

// --- CUSTOMER SERVICE ---
export function getCustomers(): CustomerProfile[] {
  return getStorageItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, cachedCustomers);
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

  cachedCustomers = customers;
  setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
  return updated;
}

// --- REVIEWS SERVICE ---
export function getReviews(): Review[] {
  return cachedReviews;
}

export function getApprovedReviewsByProductId(productId: string): Review[] {
  return cachedReviews.filter((r) => r.productId === productId && r.status === 'approved');
}

export function addReview(reviewData: Omit<Review, 'id' | 'createdAt' | 'status'>): Review {
  const newReview: Review = {
    ...reviewData,
    id: `rev-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };

  if (isSupabaseConfigured()) {
    supabase.from('reviews').insert({
      product_id: reviewData.productId,
      product_name: reviewData.productName,
      product_image: reviewData.productImage || null,
      customer_name: reviewData.customerName,
      customer_email: reviewData.customerEmail,
      rating: reviewData.rating,
      title: reviewData.title || '',
      comment: reviewData.comment || '',
      status: 'pending',
    }).then(() => syncWithSupabase());
  }

  cachedReviews.unshift(newReview);
  setStorageItem(STORAGE_KEYS.REVIEWS, cachedReviews);
  return newReview;
}

export function updateReviewStatus(reviewId: string, status: Review['status'], adminReply?: string): Review | undefined {
  const rev = cachedReviews.find((r) => r.id === reviewId);
  if (rev) {
    rev.status = status;
    if (adminReply !== undefined) {
      rev.adminReply = adminReply;
    }
    setStorageItem(STORAGE_KEYS.REVIEWS, cachedReviews);

    if (isSupabaseConfigured()) {
      supabase.from('reviews')
        .update({ status, admin_reply: adminReply })
        .eq('id', reviewId)
        .then(() => syncWithSupabase());
    }
  }
  return rev;
}

// --- BLOG SERVICE ---
export function getBlogPosts(): BlogPost[] {
  return cachedBlogPosts;
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return cachedBlogPosts.find((p) => p.slug === slug);
}

export function saveBlogPost(postData: Partial<BlogPost>): BlogPost {
  if (isSupabaseConfigured()) {
    const slug = postData.slug || (postData.title
      ? postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      : `post-${Date.now()}`);

    supabase.from('blog_posts').upsert({
      id: postData.id && postData.id.length > 10 ? postData.id : undefined,
      title: postData.title || 'Novo Artigo',
      slug,
      summary: postData.summary || '',
      content: postData.content || '',
      category: postData.category || 'Moda Fitness',
      author: postData.author || { name: 'Equipe Aura Fitness', avatar: '' },
      image_url: postData.imageUrl || '',
      read_time_minutes: postData.readTimeMinutes || 4,
      is_published: postData.isPublished ?? true,
      seo: postData.seo || { title: postData.title || '', description: '' },
    }).then(() => syncWithSupabase());
  }

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
    updated = {
      id: `post-${Date.now()}`,
      title: postData.title || 'Título do Artigo',
      slug: postData.title ? postData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `post-${Date.now()}`,
      summary: postData.summary || '',
      content: postData.content || '',
      category: postData.category || 'Moda Fitness',
      author: postData.author || { name: 'Equipe Aura Fitness', avatar: '' },
      imageUrl: postData.imageUrl || '',
      readTimeMinutes: postData.readTimeMinutes || 4,
      publishedAt: new Date().toISOString(),
      isPublished: postData.isPublished ?? true,
      seo: postData.seo || { title: postData.title || '', description: '' },
    };
    posts.unshift(updated);
  }

  cachedBlogPosts = posts;
  setStorageItem(STORAGE_KEYS.BLOG, posts);
  return updated;
}

export function deleteBlogPost(id: string): void {
  if (isSupabaseConfigured()) {
    supabase.from('blog_posts').delete().eq('id', id).then(() => syncWithSupabase());
  }
  cachedBlogPosts = cachedBlogPosts.filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.BLOG, cachedBlogPosts);
}

// --- COUPONS SERVICE ---
export function getCoupons(): Coupon[] {
  return cachedCoupons;
}

export function saveCoupon(couponData: Partial<Coupon>): Coupon {
  if (isSupabaseConfigured()) {
    supabase.from('coupons').upsert({
      id: couponData.id && couponData.id.length > 10 ? couponData.id : undefined,
      code: (couponData.code || 'AURA10').toUpperCase().trim(),
      discount_type: couponData.discountType || 'percentage',
      value: couponData.value || 10,
      min_spend: couponData.minSpend || 0,
      max_uses: couponData.maxUses || null,
      expires_at: couponData.expiresAt || null,
      is_active: couponData.isActive ?? true,
    }).then(() => syncWithSupabase());
  }

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

  cachedCoupons = coupons;
  setStorageItem(STORAGE_KEYS.COUPONS, coupons);
  return updated;
}

export function deleteCoupon(id: string): void {
  if (isSupabaseConfigured()) {
    supabase.from('coupons').delete().eq('id', id).then(() => syncWithSupabase());
  }
  cachedCoupons = cachedCoupons.filter((c) => c.id !== id);
  setStorageItem(STORAGE_KEYS.COUPONS, cachedCoupons);
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
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
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
  return cachedPromotions;
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
      bannerUrl: promo.bannerUrl || '/images/banner-style.png',
      discountPercentage: promo.discountPercentage || 10,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      ...promo,
    };
    promos.unshift(updated);
  }
  cachedPromotions = promos;
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

  cachedProducts = updatedProducts;
  setStorageItem(STORAGE_KEYS.PRODUCTS, updatedProducts);
  return affectedCount;
}

export function deletePromotion(id: string): void {
  cachedPromotions = cachedPromotions.filter((p) => p.id !== id);
  setStorageItem(STORAGE_KEYS.PROMOTIONS, cachedPromotions);
}

export function getLookSets(): LookSet[] {
  return cachedLookSets;
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
      imageUrl: lookSet.imageUrl || '/images/look-3103.png',
      productIds: lookSet.productIds || [],
      setDiscountPercentage: lookSet.setDiscountPercentage || 15,
      totalPrice: lookSet.totalPrice || 299.9,
      discountedPrice: lookSet.discountedPrice || 254.91,
      isActive: true,
    };
    sets.push(updated);
  }
  cachedLookSets = sets;
  setStorageItem(STORAGE_KEYS.LOOK_SETS, sets);
  return updated;
}

export function deleteLookSet(id: string): void {
  cachedLookSets = cachedLookSets.filter((s) => s.id !== id);
  setStorageItem(STORAGE_KEYS.LOOK_SETS, cachedLookSets);
}

// --- SETTINGS SERVICE ---
export function getStoreSettings(): StoreSettings {
  return cachedSettings;
}

export function updateStoreSettings(settings: Partial<StoreSettings>): StoreSettings {
  const current = getStoreSettings();
  const updated = { ...current, ...settings };
  cachedSettings = updated;
  setStorageItem(STORAGE_KEYS.SETTINGS, updated);

  if (isSupabaseConfigured()) {
    supabase.from('store_settings')
      .upsert({
        id: 'default',
        company_name: updated.companyName,
        cnpj: updated.cnpj,
        phone: updated.phone,
        whatsapp_number: updated.whatsappNumber,
        pix_key: updated.pixKey,
        pix_key_type: updated.pixKeyType,
        email: updated.email,
        address: updated.address,
        social: updated.social,
        logo_url: updated.logoUrl,
        banner_url: updated.bannerUrl,
        shipping: updated.shipping,
        seo: updated.seo,
      })
      .then(() => syncWithSupabase());
  }

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

// --- ASSISTANT & CONTENT HELPERS ---
export async function aiGenerateProductDescription(productName: string, category: string, keyFeatures: string): Promise<{ shortDescription: string; fullDescription: string }> {
  await new Promise((res) => setTimeout(res, 400));

  return {
    shortDescription: `${productName} projetado com tecnologia de alta compressão e toque aveludado para proporcionar máximo conforto, modelagem anatômica perfeita e zero transparência em treinos intensos.`,
    fullDescription: `Eleve sua experiência de treino com o novo **${productName}**. Desenvolvido com malha inteligente de alta sustentação, este produto combina regulação térmica avançada, elasticidade multidirecional e costuras reforçadas que não marcam a pele. Destaques: ${keyFeatures || 'Efeito modelador, secagem rápida e proteção solar UV50+.'}`,
  };
}

export async function aiGenerateBlogPost(topic: string, _category: string): Promise<{ title: string; summary: string; content: string }> {
  await new Promise((res) => setTimeout(res, 400));

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

export async function aiGenerateSeoMeta(title: string, _content: string): Promise<{ seoTitle: string; seoDescription: string; keywords: string[] }> {
  await new Promise((res) => setTimeout(res, 300));

  return {
    seoTitle: `${title} | Aura Fitness Moda Esportiva`,
    seoDescription: `Confira ${title} na Aura Fitness. Peças esportivas com tecnologia de compressão sem transparência e frete rápido para todo o Brasil.`,
    keywords: ['aura fitness', 'moda fitness', 'legging compressão', 'top fitness', 'roupa de academia feminina'],
  };
}
