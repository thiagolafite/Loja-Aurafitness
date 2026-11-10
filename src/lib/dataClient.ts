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
  StoreSection,
  HeroBannerSlide,
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
import {
  getCanonicalGarmentCategoryFromName,
  areCategoriesEquivalent,
  resolveSingleCategoryName,
  getEffectiveProductColors,
  getProductSizes,
  getStoredCategories,
  saveNewCategory,
  getImportedFilesRegistry,
  saveImportedFilesRegistry,
  IMPORTED_FILES_REGISTRY_KEY,
} from './productClassifier';

function normalizeProductData(p: Product, _activeCategories = getStoredCategories()): Product {
  const effectiveColors = getEffectiveProductColors(p);
  const effectiveSizes = getProductSizes(p);
  const seoExtraCats = Array.isArray((p.seo as any)?.additionalCategories)
    ? (p.seo as any).additionalCategories
    : [];
  const rawAdditional = Array.isArray(p.additionalCategories)
    ? p.additionalCategories
    : seoExtraCats;

  return {
    ...p,
    category: resolveSingleCategoryName(p.category),
    additionalCategories: rawAdditional.map((c: string) => resolveSingleCategoryName(c)),
    colors: effectiveColors.length > 0 ? effectiveColors : p.colors,
    sizes: effectiveSizes.length > 0 ? effectiveSizes : p.sizes || ['P', 'M', 'G'],
  };
}

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
  SECTIONS: 'aura_store_sections_v1',
  HERO_BANNERS: 'aura_hero_banners_v1',
};

export const initialStoreSections: StoreSection[] = [
  {
    id: 'sec-moda-verao',
    name: 'Moda Verão',
    slug: 'moda-verao',
    badge: '☀️ VERÃO 2026',
    description: 'Peças frescas, ultra leves e com proteção UV para treinos impecáveis no calor.',
    bannerImage: '/images/banner-style.png',
    showInMenu: true,
    showInHome: true,
    active: true,
    order: 1,
    productIds: ['prod-1', 'prod-2', 'prod-4'],
    includedCategories: ['Conjuntos', 'Tops'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sec-black-friday',
    name: 'Black Friday',
    slug: 'black-friday',
    badge: '🔥 BLACK FRIDAY',
    description: 'As melhores ofertas da temporada em conjuntos de alta compressão e macacões fitness.',
    bannerImage: '/images/macaco-bless.png',
    showInMenu: true,
    showInHome: true,
    active: true,
    order: 2,
    productIds: ['prod-3', 'prod-5', 'prod-6'],
    includedCategories: ['Conjuntos', 'Macacões'],
    createdAt: new Date().toISOString(),
  },
];

export const initialHeroBanners: HeroBannerSlide[] = [
  {
    id: 'banner-1',
    badge: 'NOVA COLEÇÃO',
    title: 'FORÇA & ESTILO',
    subtitle: 'Conjuntos que abraçam seu movimento com toque aveludado e zero transparência',
    buttonText: 'VER CONJUNTOS',
    link: '/catalogo?categoria=Conjuntos',
    leftImage: '/images/look-3214.png',
    rightImage: '/images/macaco-bless.png',
    centerBgColor: '#163923',
    active: true,
    order: 1,
  },
  {
    id: 'banner-2',
    badge: '☀️ MODA VERÃO',
    title: 'BRILHO & LEVEZA',
    subtitle: 'Tecidos em poliamida respirável para você treinar com máxima performance no verão',
    buttonText: 'VER MODA VERÃO',
    link: '/catalogo?secao=moda-verao',
    leftImage: '/images/look-3656.png',
    rightImage: '/images/banner-style.png',
    centerBgColor: '#1a3c26',
    active: true,
    order: 2,
  },
  {
    id: 'banner-3',
    badge: '🔥 BLACK FRIDAY',
    title: 'BLACK FRIDAY AURA',
    subtitle: 'Aproveite as maiores ofertas do ano com descontos imperdíveis e pronta entrega',
    buttonText: 'APROVEITAR BLACK FRIDAY',
    link: '/catalogo?secao=black-friday',
    leftImage: '/images/look-3603.png',
    rightImage: '/images/look-3103.png',
    centerBgColor: '#182b1d',
    active: true,
    order: 3,
  },
];

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

const IDB_NAME = 'aura_fitness_media_db';
const IDB_STORE = 'products_store';
const IDB_KEY = 'aura_products_full_v1';

function openProductsIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveProductsToIDB(products: Product[]): Promise<void> {
  const db = await openProductsIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(products, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function loadProductsFromIDB(): Promise<Product[] | null> {
  const db = await openProductsIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => {
        resolve(Array.isArray(req.result) ? req.result : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

function saveProductsToStorage(products: Product[]): void {
  // Sempre salva 100% das fotos e vídeos completos no IndexedDB (suporta centenas de MBs sem erro de cota)
  saveProductsToIDB(products).catch(() => {});

  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    return;
  } catch {
    // QuotaExceededError: libera cache auxiliar e remove vídeos pesados apenas da cópia do localStorage
  }

  try {
    localStorage.removeItem('aura_updated_products_v1');
    const withoutHeavyInlineVideos = products.map((p) => ({
      ...p,
      videoUrl: p.videoUrl?.startsWith('data:video/') ? undefined : p.videoUrl,
      images: Array.isArray(p.images)
        ? p.images.filter((m) => !m?.startsWith('data:video/'))
        : p.images,
    }));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(withoutHeavyInlineVideos));
    return;
  } catch {
    // Continua para otimização gradual de fotos base64 no localStorage
  }

  for (const maxImages of [2, 1]) {
    try {
      const slimmed = products.map((p) => {
        const nonVideoImgs = Array.isArray(p.images)
          ? p.images.filter((m) => !m?.startsWith('data:video/'))
          : [];
        return {
          ...p,
          videoUrl: p.videoUrl?.startsWith('data:video/') ? undefined : p.videoUrl,
          images: nonVideoImgs.length > maxImages ? nonVideoImgs.slice(0, maxImages) : nonVideoImgs,
        };
      });
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(slimmed));
      return;
    } catch {
      // Tenta o próximo nível
    }
  }

  try {
    const ultraSlimmed = products.map((p, idx) => {
      const firstPhoto = Array.isArray(p.images)
        ? p.images.find((m) => !m?.startsWith('data:video/'))
        : undefined;
      return {
        ...p,
        videoUrl: p.videoUrl?.startsWith('data:video/') ? undefined : p.videoUrl,
        images:
          idx >= products.length - 5
            ? [firstPhoto || '/images/look-3103.png']
            : [
                firstPhoto?.startsWith('data:')
                  ? '/images/look-3103.png'
                  : firstPhoto || '/images/look-3103.png',
              ],
      };
    });
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(ultraSlimmed));
  } catch (error) {
    console.error('Error writing products to LocalStorage even after slimming:', error);
  }
}

function ensureCategoryIsActive(categoryName?: string): void {
  if (!categoryName || !categoryName.trim()) return;
  const resolved = resolveSingleCategoryName(categoryName).trim();
  if (!resolved || resolved.toLowerCase() === 'sem categoria' || resolved.toLowerCase() === 'geral') {
    return;
  }
  const active = getStoredCategories();
  if (!active.some((c) => c.name.toLowerCase() === resolved.toLowerCase())) {
    saveNewCategory(resolved);
  }
}

// In-memory cache for synchronous reads with background Supabase sync
let cachedProducts: Product[] = (() => {
  // Limpa sempre fotos base64 duplicadas dentro de aura_updated_products_v1 para liberar espaço no localStorage
  if (typeof window !== 'undefined') {
    try {
      const rawOv = localStorage.getItem('aura_updated_products_v1');
      if (rawOv && rawOv.length > 50000) {
        const parsedOv = JSON.parse(rawOv);
        const slimOv: Record<string, Partial<Product>> = {};
        Object.entries(parsedOv || {}).forEach(([id, val]: [string, any]) => {
          if (val && typeof val === 'object') {
            const { images: _img, fullDescription: _fd, ...rest } = val;
            slimOv[id] = rest;
          }
        });
        localStorage.setItem('aura_updated_products_v1', JSON.stringify(slimOv));
      }
    } catch {
      localStorage.removeItem('aura_updated_products_v1');
    }
  }

  const rawList = getStorageItem<Product[]>(STORAGE_KEYS.PRODUCTS, initialProducts);
  const migratedKey = 'aura_separate_macacao_macaquinho_prods_v5';
  const alreadyMigrated =
    typeof window !== 'undefined' && localStorage.getItem(migratedKey) === 'true';

  if (!alreadyMigrated && typeof window !== 'undefined') {
    // Limpa exclusões ou overrides acidentais gerados quando Macacão e Macaquinho estavam unificados
    localStorage.removeItem('aura_deleted_product_ids_v1');
    localStorage.removeItem('aura_updated_products_v1');

    const cleaned = rawList.map((p) =>
      normalizeProductData({
        ...p,
        category: resolveSingleCategoryName(p.category, p.name),
        additionalCategories: [],
      })
    );
    setStorageItem(STORAGE_KEYS.PRODUCTS, cleaned);
    localStorage.setItem(migratedKey, 'true');
    return cleaned;
  }

  return rawList.map((p) => normalizeProductData(p));
})();
let cachedOrders: Order[] = getStorageItem<Order[]>(STORAGE_KEYS.ORDERS, initialOrders);
let cachedCustomers: CustomerProfile[] = getStorageItem<CustomerProfile[]>(STORAGE_KEYS.CUSTOMERS, initialCustomers);
let cachedReviews: Review[] = getStorageItem<Review[]>(STORAGE_KEYS.REVIEWS, initialReviews);
let cachedBlogPosts: BlogPost[] = getStorageItem<BlogPost[]>(STORAGE_KEYS.BLOG, initialBlogPosts);
let cachedCoupons: Coupon[] = getStorageItem<Coupon[]>(STORAGE_KEYS.COUPONS, initialCoupons);
let cachedPromotions: Promotion[] = getStorageItem<Promotion[]>(STORAGE_KEYS.PROMOTIONS, initialPromotions);
let cachedLookSets: LookSet[] = getStorageItem<LookSet[]>(STORAGE_KEYS.LOOK_SETS, initialLookSets);
let cachedSettings: StoreSettings = getStorageItem<StoreSettings>(STORAGE_KEYS.SETTINGS, initialStoreSettings);
let cachedSections: StoreSection[] = getStorageItem<StoreSection[]>(STORAGE_KEYS.SECTIONS, initialStoreSections);
let cachedHeroBanners: HeroBannerSlide[] = getStorageItem<HeroBannerSlide[]>(STORAGE_KEYS.HERO_BANNERS, initialHeroBanners);

// Synchronize Supabase in background
export async function syncWithSupabase(): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // 1. Products
    const { data: prods, error: prodsError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!prodsError && prods) {
      const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
      const localOverrides = getStorageItem<Record<string, Partial<Product>>>(
        'aura_updated_products_v1',
        {}
      );

      const dbProducts: Product[] = prods.map((p) => {
        const override = localOverrides[p.id];
        const memProd = cachedProducts.find((cp) => cp.id === p.id);
        const dbImages = Array.isArray(p.images) ? p.images : [];
        const memImages = Array.isArray(memProd?.images) ? memProd!.images : [];
        const resolvedImages =
          override?.images ??
          (memImages.length > dbImages.length ? memImages : dbImages);

        return {
          id: p.id,
          name: override?.name ?? p.name,
          slug: override?.slug ?? p.slug,
          description: override?.description ?? (p.description || ''),
          fullDescription: override?.fullDescription ?? (p.full_description || ''),
          category: override?.category !== undefined ? override.category : p.category,
          additionalCategories:
            override?.additionalCategories !== undefined
              ? override.additionalCategories
              : Array.isArray(p.seo?.additionalCategories)
                ? p.seo.additionalCategories
                : [],
          price: override?.price !== undefined ? Number(override.price) : Number(p.price),
          promotionalPrice:
            override?.promotionalPrice !== undefined
              ? override.promotionalPrice
              : p.promotional_price
                ? Number(p.promotional_price)
                : undefined,
          sku: override?.sku ?? (p.sku || `SKU-${Date.now()}`),
          barcode: override?.barcode ?? (p.barcode || '7890000000000'),
          weight: override?.weight !== undefined ? Number(override.weight) : Number(p.weight) || 200,
          brand: override?.brand ?? (p.brand || 'Aura Fitness'),
          images: resolvedImages,
          videoUrl: override?.videoUrl ?? p.video_url,
          sizes: override?.sizes ?? (p.sizes || ['P', 'M', 'G']),
          colors: override?.colors ?? (p.colors || []),
          materials: override?.materials ?? (p.materials || []),
          stock: override?.stock ?? (p.stock || {}),
          isFeatured:
            override?.isFeatured !== undefined ? Boolean(override.isFeatured) : Boolean(p.is_featured),
          isNewArrival:
            override?.isNewArrival !== undefined
              ? Boolean(override.isNewArrival)
              : Boolean(p.is_new_arrival),
          isBestSeller:
            override?.isBestSeller !== undefined
              ? Boolean(override.isBestSeller)
              : Boolean(p.is_best_seller),
          isActive:
            override?.isActive !== undefined ? Boolean(override.isActive) : Boolean(p.is_active),
          rating: Number(p.rating) || 5.0,
          reviewCount: Number(p.review_count) || 0,
          seo: override?.seo ?? (p.seo || { title: p.name, description: '', keywords: [] }),
          createdAt: p.created_at,
        };
      });

      // Apenas produtos que não foram excluídos pelo usuário
      const cleanDbProducts = dbProducts.filter((p) => !deletedSet.has(p.id));

      // Preserva itens locais criados/importados que ainda não constam no banco remoto
      const pendingLocalProducts = cachedProducts.filter(
        (p) =>
          !deletedSet.has(p.id) &&
          !cleanDbProducts.some(
            (db) =>
              db.id === p.id ||
              (db.sku && p.sku && db.sku.toLowerCase().trim() === p.sku.toLowerCase().trim())
          )
      );

      const activeCats = getStoredCategories();
      cachedProducts = [...cleanDbProducts, ...pendingLocalProducts].map((p) =>
        normalizeProductData(p, activeCats)
      );
      saveProductsToStorage(cachedProducts);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
      }
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
loadProductsFromIDB()
  .then((idbProducts) => {
    if (idbProducts && idbProducts.length > 0) {
      const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
      const validIdb = idbProducts.filter((p) => !deletedSet.has(p.id));
      if (validIdb.length >= cachedProducts.length) {
        const activeCats = getStoredCategories();
        cachedProducts = validIdb.map((p) => normalizeProductData(p, activeCats));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
        }
      }
    }
  })
  .finally(() => {
    syncWithSupabase();
  });

// --- PRODUCTS SERVICE ---
export function getProducts(): Product[] {
  const activeCats = getStoredCategories();
  cachedProducts = cachedProducts.map((p) => normalizeProductData(p, activeCats));
  return [...cachedProducts];
}

export async function fetchProductsAsync(): Promise<Product[]> {
  if (isSupabaseConfigured()) {
    await syncWithSupabase();
  }
  return getProducts();
}

export function getProductById(id: string): Product | undefined {
  return getProducts().find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return getProducts().find((p) => p.slug === slug);
}

export async function saveProductAsync(productData: Partial<Product>): Promise<Product> {
  // Sempre persiste localmente primeiro (garante que alterações de categoria/preço/fotos nunca se percam por RLS)
  const localSaved = saveProductLocalOnly(productData);

  if (!isSupabaseConfigured()) {
    return localSaved;
  }

  let baseSlug =
    localSaved.slug ||
    (localSaved.name
      ? localSaved.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : `produto-${Date.now()}`);

  const slugCollision = cachedProducts.some(
    (p) => p.id !== localSaved.id && p.slug === baseSlug
  );
  const slug = slugCollision
    ? `${baseSlug}-${Date.now().toString().slice(-4)}`
    : baseSlug;

  let sku = localSaved.sku || `SKU-${Date.now()}`;
  const skuCollision = cachedProducts.some(
    (p) => p.id !== localSaved.id && p.sku.toLowerCase() === sku.toLowerCase()
  );
  if (skuCollision) {
    sku = `${sku}-${Date.now().toString().slice(-3)}`;
  }

  const payload: any = {
    name: localSaved.name || 'Novo Produto',
    slug,
    description: localSaved.description || '',
    full_description: localSaved.fullDescription || '',
    category: localSaved.category || getStoredCategories()[0]?.name || 'Conjuntos',
    price: localSaved.price || 0,
    promotional_price: localSaved.promotionalPrice || null,
    sku,
    barcode: localSaved.barcode || '7890000000000',
    weight: localSaved.weight || 200,
    brand: localSaved.brand || 'Aura Fitness',
    images: localSaved.images || ['/images/look-3103.png'],
    video_url: localSaved.videoUrl || null,
    sizes: localSaved.sizes || ['P', 'M', 'G'],
    colors: localSaved.colors || [{ name: 'Verde Oliva', hex: '#5F6F3A' }],
    materials: localSaved.materials || ['Poliamida'],
    stock: localSaved.stock || { 'P-Verde Oliva': 10 },
    is_featured: localSaved.isFeatured ?? false,
    is_new_arrival: localSaved.isNewArrival ?? true,
    is_best_seller: localSaved.isBestSeller ?? false,
    is_active: localSaved.isActive ?? true,
    seo: {
      ...(localSaved.seo || { title: localSaved.name || '', description: '', keywords: [] }),
      additionalCategories: Array.isArray(localSaved.additionalCategories)
        ? localSaved.additionalCategories
        : [],
    },
  };

  if (localSaved.id && localSaved.id.length > 10 && !localSaved.id.startsWith('prod-')) {
    payload.id = localSaved.id;
  }

  try {
    const { data, error } = await supabase.from('products').upsert(payload).select().maybeSingle();
    if (!error && data?.id) {
      const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
      if (deletedSet.has(data.id)) {
        deletedSet.delete(data.id);
        setStorageItem('aura_deleted_product_ids_v1', Array.from(deletedSet));
      }
      // Se o produto tinha ID temporário local (prod-...), atualiza para o UUID real do Supabase
      if (localSaved.id !== data.id) {
        const idx = cachedProducts.findIndex((p) => p.id === localSaved.id);
        if (idx !== -1) {
          cachedProducts[idx] = { ...cachedProducts[idx], id: data.id, slug, sku };
          saveProductsToStorage(cachedProducts);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
          }
        }
      }
    }
  } catch (e) {
    console.warn('Aviso ao sincronizar produto com Supabase (mantido localmente):', e);
  }

  return localSaved;
}

function saveProductLocalOnly(productData: Partial<Product>): Product {
  const products = getProducts();
  let updatedProduct: Product;
  const defaultCategory = getStoredCategories()[0]?.name || 'Conjuntos';

  if (productData.id) {
    const index = products.findIndex((p) => p.id === productData.id);
    if (index !== -1) {
      updatedProduct = { ...products[index], ...productData } as Product;
      products[index] = updatedProduct;
    } else {
      updatedProduct = productData as Product;
      products.unshift(updatedProduct);
    }
  } else {
    const newId = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const baseSlug = productData.name
      ? productData.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      : `produto-${Date.now()}`;
    const slug = products.some((p) => p.slug === baseSlug)
      ? `${baseSlug}-${Date.now().toString().slice(-4)}`
      : baseSlug;

    updatedProduct = {
      id: newId,
      name: productData.name || 'Novo Produto',
      slug,
      description: productData.description || '',
      fullDescription: productData.fullDescription || '',
      category: resolveSingleCategoryName(productData.category || defaultCategory),
      additionalCategories: Array.isArray(productData.additionalCategories)
        ? productData.additionalCategories
        : [],
      price: productData.price || 0,
      promotionalPrice: productData.promotionalPrice,
      sku: productData.sku || `SKU-${Date.now()}`,
      barcode: productData.barcode || '7890000000000',
      weight: productData.weight || 200,
      brand: 'Aura Fitness',
      images: productData.images || ['/images/look-3103.png'],
      videoUrl: productData.videoUrl,
      sizes: productData.sizes || ['P', 'M', 'G'],
      colors: productData.colors || [{ name: 'Verde Oliva', hex: '#5F6F3A' }],
      materials: productData.materials || ['Poliamida'],
      stock: productData.stock || { 'P-Verde Oliva': 10 },
      isFeatured: productData.isFeatured || false,
      isNewArrival: productData.isNewArrival ?? true,
      isBestSeller: productData.isBestSeller || false,
      isActive: productData.isActive ?? true,
      rating: 5.0,
      reviewCount: 0,
      seo: productData.seo || { title: productData.name || '', description: '', keywords: [] },
      createdAt: new Date().toISOString(),
    };
    products.unshift(updatedProduct);
  }

  ensureCategoryIsActive(updatedProduct.category);

  // Remove de excluídos caso estivesse marcado
  if (updatedProduct.id) {
    const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
    if (deletedSet.has(updatedProduct.id)) {
      deletedSet.delete(updatedProduct.id);
      setStorageItem('aura_deleted_product_ids_v1', Array.from(deletedSet));
    }

    // Salva apenas metadados leves no dicionário de edições locais (sem duplicar imagens ou vídeos base64 no localStorage)
    const localOverrides = getStorageItem<Record<string, Partial<Product>>>(
      'aura_updated_products_v1',
      {}
    );
    const { images: _images, fullDescription: _fullDesc, videoUrl, ...lightweightOverride } = updatedProduct;
    if (videoUrl && !videoUrl.startsWith('data:video/')) {
      (lightweightOverride as Partial<Product>).videoUrl = videoUrl;
    }
    localOverrides[updatedProduct.id] = lightweightOverride;
    setStorageItem('aura_updated_products_v1', localOverrides);
  }

  cachedProducts = products;
  saveProductsToStorage(products);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: products }));
  }
  return updatedProduct;
}

export function saveProduct(productData: Partial<Product>): Product {
  const updatedProduct = saveProductLocalOnly(productData);
  saveProductAsync(updatedProduct).catch((e) => console.error(e));
  return updatedProduct;
}

export function saveAllProducts(products: Product[]): void {
  const localOverrides = getStorageItem<Record<string, Partial<Product>>>(
    'aura_updated_products_v1',
    {}
  );
  products.forEach((p) => {
    if (p.id) {
      const { images: _images, fullDescription: _fullDesc, ...lightweightOverride } = p;
      localOverrides[p.id] = lightweightOverride;
    }
  });
  setStorageItem('aura_updated_products_v1', localOverrides);

  cachedProducts = products;
  saveProductsToStorage(products);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: products }));
  }
}

export async function bulkDeleteProductsAsync(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;

  const deletedNames = new Set(
    cachedProducts
      .filter((p) => ids.includes(p.id))
      .map((p) => p.name.toLowerCase().trim())
  );

  // 1. Marca no histórico de exclusões para nunca reviver
  const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
  ids.forEach((id) => deletedSet.add(id));
  setStorageItem('aura_deleted_product_ids_v1', Array.from(deletedSet));

  // Limpa arquivos vinculados aos produtos excluídos no registro de importação para permitir reimportá-los
  try {
    const reg = getImportedFilesRegistry();
    let regChanged = false;
    Object.keys(reg).forEach((k) => {
      const r = reg[k];
      if (
        (r.targetProductId && ids.includes(r.targetProductId)) ||
        (r.targetProductName && deletedNames.has(r.targetProductName.toLowerCase().trim()))
      ) {
        delete reg[k];
        regChanged = true;
      }
    });
    if (regChanged) {
      saveImportedFilesRegistry(reg);
    }
  } catch {
    // Ignora erro de limpeza de registro
  }

  // 2. Remove do cache local e localStorage imediatamente
  cachedProducts = cachedProducts.filter((p) => !ids.includes(p.id));
  saveProductsToStorage(cachedProducts);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
  }

  // 3. Exclui do banco Supabase
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase.from('products').delete().in('id', ids);
      if (error) console.error('Erro ao excluir produtos do Supabase:', error);
    } catch (e) {
      console.error('Exceção ao excluir produtos do Supabase:', e);
    }
  }
}

export async function deleteAllProductsAsync(): Promise<void> {
  // 1. Marca todos os itens atuais e iniciais como excluídos
  const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
  cachedProducts.forEach((p) => deletedSet.add(p.id));
  initialProducts.forEach((p) => deletedSet.add(p.id));
  setStorageItem('aura_deleted_product_ids_v1', Array.from(deletedSet));

  // Limpa registro de arquivos importados pois o catálogo foi zerado
  if (typeof window !== 'undefined') {
    localStorage.removeItem(IMPORTED_FILES_REGISTRY_KEY);
  }

  // 2. Esvazia cache local
  cachedProducts = [];
  saveProductsToStorage([]);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: [] }));
  }

  // 3. Exclui todas as linhas da tabela products no Supabase
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) console.error('Erro ao excluir todos os produtos no Supabase:', error);
    } catch (e) {
      console.error('Exceção ao excluir todos os produtos no Supabase:', e);
    }
  }
}

export function deleteProduct(id: string): void {
  bulkDeleteProductsAsync([id]).catch(console.error);
}

export async function bulkImportProductsAsync(items: Partial<Product>[]): Promise<Product[]> {
  if (!items || items.length === 0) return getProducts();

  const now = new Date().toISOString();
  const processedProducts: Product[] = [];
  const defaultCategory = getStoredCategories()[0]?.name || 'Conjuntos';
  const usedSlugs = new Set(cachedProducts.map((p) => p.slug));
  const usedSkus = new Set(cachedProducts.map((p) => p.sku.toLowerCase()));

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const existingIndex = item.id ? cachedProducts.findIndex((p) => p.id === item.id) : -1;
    const existing = existingIndex !== -1 ? cachedProducts[existingIndex] : null;

    const localId =
      item.id ||
      existing?.id ||
      `prod-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;

    let baseSlug =
      item.slug ||
      existing?.slug ||
      (item.name
        ? item.name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '')
        : `produto-${Date.now()}-${idx}`);

    if (!existing && usedSlugs.has(baseSlug)) {
      baseSlug = `${baseSlug}-${Date.now().toString().slice(-4)}-${idx + 1}`;
    }
    usedSlugs.add(baseSlug);

    const resolvedCategory = resolveSingleCategoryName(
      item.category || existing?.category || defaultCategory
    );
    ensureCategoryIsActive(resolvedCategory);

    let sku =
      item.sku ||
      existing?.sku ||
      `AUR-${resolvedCategory.slice(0, 3).toUpperCase() || 'FIT'}-${Date.now().toString().slice(-4)}-${idx + 1}`;

    if (!existing && usedSkus.has(sku.toLowerCase())) {
      sku = `${sku}-${idx + 1}`;
    }
    usedSkus.add(sku.toLowerCase());

    const finalProduct: Product = {
      id: localId,
      name: item.name || existing?.name || 'Novo Produto',
      slug: baseSlug,
      description: item.description ?? existing?.description ?? '',
      fullDescription: item.fullDescription ?? existing?.fullDescription ?? '',
      category: resolvedCategory,
      additionalCategories: Array.isArray(item.additionalCategories)
        ? item.additionalCategories
        : existing?.additionalCategories || [],
      price: typeof item.price === 'number' ? item.price : existing?.price ?? 189.9,
      promotionalPrice: item.promotionalPrice ?? existing?.promotionalPrice,
      sku,
      barcode: item.barcode || existing?.barcode || '7890000000000',
      weight: item.weight || existing?.weight || 200,
      brand: item.brand || existing?.brand || 'Aura Fitness',
      images:
        item.images && item.images.length > 0
          ? item.images
          : existing?.images && existing.images.length > 0
            ? existing.images
            : ['/images/look-3103.png'],
      videoUrl: item.videoUrl ?? existing?.videoUrl,
      sizes: item.sizes || existing?.sizes || ['P', 'M', 'G'],
      colors: item.colors || existing?.colors || [{ name: 'Preto', hex: '#111111' }],
      materials: item.materials || existing?.materials || ['Poliamida'],
      stock: item.stock || existing?.stock || { 'P-Preto': 10, 'M-Preto': 15, 'G-Preto': 10 },
      isFeatured: item.isFeatured ?? existing?.isFeatured ?? true,
      isNewArrival: item.isNewArrival ?? existing?.isNewArrival ?? true,
      isBestSeller: item.isBestSeller ?? existing?.isBestSeller ?? false,
      isActive: item.isActive ?? existing?.isActive ?? true,
      rating: item.rating || existing?.rating || 5.0,
      reviewCount: item.reviewCount || existing?.reviewCount || 0,
      seo: item.seo || existing?.seo || { title: item.name || '', description: '', keywords: [] },
      createdAt: item.createdAt || existing?.createdAt || now,
    };

    processedProducts.push(finalProduct);
  }

  // Atualização atômica imediata na memória e no LocalStorage
  const prodMap = new Map<string, Product>();
  // Coloca os novos produtos primeiro para aparecerem no topo da lista
  processedProducts.forEach((p) => {
    prodMap.set(p.id, p);
  });
  cachedProducts.forEach((p) => {
    if (!prodMap.has(p.id)) {
      prodMap.set(p.id, p);
    }
  });

  const deletedSet = new Set(getStorageItem<string[]>('aura_deleted_product_ids_v1', []));
  const localOverrides = getStorageItem<Record<string, Partial<Product>>>(
    'aura_updated_products_v1',
    {}
  );
  processedProducts.forEach((p) => {
    deletedSet.delete(p.id);
    const { images: _img, fullDescription: _fd, ...lightweightOverride } = p;
    localOverrides[p.id] = lightweightOverride;
  });
  setStorageItem('aura_deleted_product_ids_v1', Array.from(deletedSet));
  setStorageItem('aura_updated_products_v1', localOverrides);

  cachedProducts = Array.from(prodMap.values());
  saveProductsToStorage(cachedProducts);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
  }

  // Envio seguro item a item para o Supabase (evita erro PGRST102 de chaves mistas e colisões)
  if (isSupabaseConfigured()) {
    for (const finalProduct of processedProducts) {
      try {
        const payload: any = {
          name: finalProduct.name,
          slug: finalProduct.slug,
          description: finalProduct.description,
          full_description: finalProduct.fullDescription,
          category: finalProduct.category,
          price: finalProduct.price,
          promotional_price: finalProduct.promotionalPrice || null,
          sku: finalProduct.sku,
          barcode: finalProduct.barcode,
          weight: finalProduct.weight,
          brand: finalProduct.brand,
          images: finalProduct.images,
          video_url: finalProduct.videoUrl || null,
          sizes: finalProduct.sizes,
          colors: finalProduct.colors,
          materials: finalProduct.materials,
          stock: finalProduct.stock,
          is_featured: finalProduct.isFeatured,
          is_new_arrival: finalProduct.isNewArrival,
          is_best_seller: finalProduct.isBestSeller,
          is_active: finalProduct.isActive,
          seo: {
            ...(finalProduct.seo || { title: finalProduct.name, description: '', keywords: [] }),
            additionalCategories: finalProduct.additionalCategories || [],
          },
        };

        if (finalProduct.id && !finalProduct.id.startsWith('prod-')) {
          payload.id = finalProduct.id;
        }

        const { data, error } = await supabase
          .from('products')
          .upsert(payload)
          .select()
          .maybeSingle();

        if (!error && data?.id && finalProduct.id !== data.id) {
          const oldId = finalProduct.id;
          finalProduct.id = data.id;
          const idx = cachedProducts.findIndex((cp) => cp.id === oldId);
          if (idx !== -1) {
            cachedProducts[idx] = { ...cachedProducts[idx], id: data.id };
          }
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar item importado com Supabase (mantido localmente):', err);
      }
    }

    saveProductsToStorage(cachedProducts);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: cachedProducts }));
    }
  }

  return cachedProducts;
}

export function bulkImportProducts(items: Partial<Product>[]): Product[] {
  bulkImportProductsAsync(items).catch((err) => console.error('Bulk import error:', err));
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
  if (
    !cachedSettings.pixKey ||
    cachedSettings.pixKey === 'aurafitnesswork@gmail.com' ||
    cachedSettings.pixKey === 'brendaraissasousasilva@gmail.com'
  ) {
    cachedSettings.pixKey = 'brendaraissasousasilva@jim.com';
    cachedSettings.email = 'brendaraissasousasilva@jim.com';
    setStorageItem(STORAGE_KEYS.SETTINGS, cachedSettings);
  }
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

export interface AiGeneratedBannerResult {
  badge: string;
  title: string;
  subtitle: string;
  buttonText: string;
  link: string;
  centerBgColor: string;
  leftImage: string;
  rightImage: string;
  themeNotes?: string;
  alternativeStyles: {
    name: string;
    badge: string;
    title: string;
    subtitle: string;
    buttonText: string;
    centerBgColor: string;
  }[];
}

/**
 * Gerador Inteligente de Banners com IA para a Página Principal (Home)
 * Analisa o tema, promoção ou data digitada e elabora copywriting de alta conversão,
 * paleta de cores nobre e seleção inteligente das melhores fotos de produtos.
 */
export async function aiGenerateHeroBanner(
  themePrompt: string,
  storeProducts: Product[] = []
): Promise<AiGeneratedBannerResult> {
  // Simula o tempo de processamento cognitivo da IA
  await new Promise((res) => setTimeout(res, 500));

  const cleanTheme = (themePrompt || '').trim();
  const lower = cleanTheme
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Detecta porcentagem de desconto se houver
  const discountMatch = cleanTheme.match(/(\d{1,2}%|\d{1,2}\s*off)/i);
  const discountText = discountMatch ? discountMatch[0].toUpperCase() : '';

  // 2. Classificação de Tema
  const isBlackFriday = lower.includes('black friday') || lower.includes('black') || lower.includes('cyber');
  const isSale =
    isBlackFriday ||
    lower.includes('promoc') ||
    lower.includes('desconto') ||
    lower.includes('queima') ||
    lower.includes('liquida') ||
    lower.includes('outlet') ||
    Boolean(discountText);

  const isSummer = lower.includes('verao') || lower.includes('calor') || lower.includes('praia') || lower.includes('solar');
  const isWinter = lower.includes('inverno') || lower.includes('frio') || lower.includes('termic') || lower.includes('agasalho');
  const isMothers = lower.includes('mae') || lower.includes('maes');
  const isValentines = lower.includes('namorad') || lower.includes('amor');
  const isConsumer = lower.includes('consumidor');

  const isMacaquinho = lower.includes('macaquinh') || lower.includes('macac');
  const isConjunto = lower.includes('conjunt') || lower.includes('look') || lower.includes('duo');
  const isLegging = lower.includes('legging') || lower.includes('calca');
  const isTop = lower.includes('top') || lower.includes('cropped');

  // 3. Escolha das fotos ideais
  let matchingProductImages: string[] = [];
  if (Array.isArray(storeProducts) && storeProducts.length > 0) {
    const relevantProducts = storeProducts.filter((p) => {
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      if (isMacaquinho && (pName.includes('macaquinh') || pCat.includes('macac'))) return true;
      if (isConjunto && (pName.includes('conjunto') || pCat.includes('conjunt'))) return true;
      if (isLegging && (pName.includes('legging') || pCat.includes('legging'))) return true;
      if (isTop && (pName.includes('top') || pCat.includes('top'))) return true;
      return false;
    });

    relevantProducts.forEach((p) => {
      if (Array.isArray(p.images) && p.images[0]) {
        matchingProductImages.push(p.images[0]);
      }
    });
  }

  let leftImg = '/images/look-3103.png';
  let rightImg = '/images/macaco-bless.png';

  if (isMacaquinho) {
    leftImg = '/images/macaco-bless.png';
    rightImg = matchingProductImages[0] || '/images/look-3214.png';
  } else if (isSummer) {
    leftImg = '/images/banner-style.png';
    rightImg = '/images/look-3656.png';
  } else if (isWinter) {
    leftImg = '/images/look-3656.png';
    rightImg = '/images/look-3103.png';
  } else if (isConjunto) {
    leftImg = '/images/look-3103.png';
    rightImg = '/images/look-3214.png';
  } else if (matchingProductImages.length >= 2) {
    leftImg = matchingProductImages[0];
    rightImg = matchingProductImages[1];
  } else if (matchingProductImages.length === 1) {
    leftImg = matchingProductImages[0];
    rightImg = '/images/macaco-bless.png';
  }

  // 4. Criação das Chamadas, Badges e Cores
  let badge = '✨ LANÇAMENTO EXCLUSIVO';
  let title = 'FORÇA, ELEGÂNCIA & MOVIMENTO';
  let subtitle =
    'Tecnologia de alta sustentação com toque aveludado e zero transparência. O equilíbrio supremo entre conforto e modelagem anatômica.';
  let buttonText = 'CONFERIR COLEÇÃO';
  let link = '/catalogo';
  let centerBgColor = '#163923'; // Verde floresta Aura oficial

  if (isBlackFriday) {
    badge = discountText ? `🔥 BLACK FRIDAY • ATÉ ${discountText}` : '🔥 BLACK FRIDAY AURA';
    title = 'OS MAIORES DESCONTOS DO ANO';
    subtitle = `Condições imperdíveis nas peças mais desejadas da marca. Conjuntos e macaquinhos de alta performance com até ${discountText || '50% OFF'} por tempo estritamente limitado!`;
    buttonText = discountText ? `APROVEITAR ${discountText}` : 'GARANTIR OFERTAS BLACK';
    link = '/catalogo?promocao=true';
    centerBgColor = '#181112'; // Obsidian Ruby Black
  } else if (isSale) {
    badge = discountText ? `⚡ OFERTA RELÂMPAGO • ${discountText}` : '💥 QUEIMA DE ESTOQUE';
    title = discountText ? `DESCONTOS DE ATÉ ${discountText}` : 'SELEÇÃO ESPECIAL EM PROMOÇÃO';
    subtitle = 'Renove seu guarda-roupa fitness com tecnologia premium, toque macio e elasticidade 4D com preços imperdíveis.';
    buttonText = discountText ? `APROVEITAR ${discountText}` : 'VER TODAS AS OFERTAS';
    link = '/catalogo?promocao=true';
    centerBgColor = '#1c1418';
  } else if (isSummer) {
    badge = '☀️ VERÃO 2026 • MODA SOLAR';
    title = 'BRILHO, LEVEZA & MÁXIMA RESPIRAÇÃO';
    subtitle = 'Peças leves com proteção UV50+ e regulação térmica avançada para treinos intensos nos dias mais ensolarados.';
    buttonText = 'VER MODA VERÃO';
    link = '/catalogo?secao=moda-verao';
    centerBgColor = '#1a3c26';
  } else if (isWinter) {
    badge = '❄️ COLEÇÃO INVERNO • LINHA TÉRMICA';
    title = 'AQUECIMENTO, CONFORTO & ELEGÂNCIA';
    subtitle = 'Casacos corta-vento, agasalhos esportivos e leggings térmicas de alta compressão para treinar no frio com alto rendimento.';
    buttonText = 'VER LINHA INVERNO';
    link = '/catalogo?categoria=Jaquetas';
    centerBgColor = '#142538'; // Midnight Ocean
  } else if (isMothers) {
    badge = '🌸 ESPECIAL DIA DAS MÃES';
    title = 'O PRESENTE QUE CELEBRA A FORÇA DELA';
    subtitle = 'Surpreenda com looks exclusivos que unem sofisticação, conforto supremo e liberdade de movimento todos os dias.';
    buttonText = 'ESCOLHER PRESENTE';
    link = '/catalogo';
    centerBgColor = '#351829'; // Velvet Plum
  } else if (isValentines) {
    badge = '❤️ ESPECIAL DIA DOS NAMORADOS';
    title = 'AMOR, ESTILO & CONEXÃO EM MOVIMENTO';
    subtitle = 'Combinações sofisticadas para você treinar com quem te inspira a ir mais longe. Presentes inesquecíveis Aura.';
    buttonText = 'CONFERIR SELEÇÃO';
    link = '/catalogo';
    centerBgColor = '#3b1620';
  } else if (isConsumer) {
    badge = '⚡ SEMANA DO CONSUMIDOR';
    title = 'VANTAGENS EXCLUSIVAS PARA VOCÊ';
    subtitle = 'Uma semana inteira de promoções selecionadas a dedo para transformar seus treinos diários.';
    buttonText = 'APROVEITAR SEMANA DO CONSUMIDOR';
    link = '/catalogo?promocao=true';
    centerBgColor = '#192b1d';
  } else if (isMacaquinho) {
    badge = '🩱 ESPECIAL MACAQUINHOS & BODIES';
    title = 'MODELAGEM ANATÔMICA & COSTAS LIVRES';
    subtitle = 'O clássico preferido para musculação, corrida e pilates. Efeito compressivo que valoriza a silhueta com zero incômodo.';
    buttonText = 'VER MACAQUINHOS';
    link = '/catalogo?categoria=Macaquinhos';
    centerBgColor = '#163923';
  } else if (isConjunto) {
    badge = '👗 COLEÇÃO CONJUNTOS & DUOS';
    title = 'HARMONIA PERFEITA ENTRE TOP & LEGGING';
    subtitle = 'Praticidade e sofisticação no vestiário com looks completos que sustentam e desenham o corpo sem transparência.';
    buttonText = 'EXPLORAR CONJUNTOS';
    link = '/catalogo?categoria=Conjuntos';
    centerBgColor = '#1a3924';
  } else if (cleanTheme) {
    badge = `✨ ${cleanTheme.toUpperCase().slice(0, 32)}`;
    title = cleanTheme.length < 24 ? cleanTheme.toUpperCase() : 'COLEÇÃO EXCLUSIVA AURA';
    subtitle = `Peças confeccionadas com malha de alta densidade, toque aveludado e sustentação estratégica para o seu dia a dia. Especialmente para: ${cleanTheme}.`;
    buttonText = 'GARANTIR MEU LOOK';
    link = '/catalogo';
    centerBgColor = '#163923';
  }

  // 5. Gera 3 estilos alternativos para o usuário poder escolher com 1 clique
  const alternativeStyles = [
    {
      name: 'Impacto Promocional',
      badge: discountText ? `🔥 OFERTA LIMITADA • ${discountText}` : '🔥 DESCONTOS IMPERDÍVEIS',
      title: discountText ? `ATÉ ${discountText} DE DESCONTO` : 'OPORTUNIDADE EXCLUSIVA',
      subtitle: `Garanta as peças mais amadas do catálogo com preços especiais por tempo limitado. Aproveite antes que acabe o estoque!`,
      buttonText: discountText ? `APROVEITAR ${discountText}` : 'CONFERIR DESCONTOS',
      centerBgColor: '#1a1013',
    },
    {
      name: 'Editorial Luxo',
      badge: '💎 ALTA PERFORMANCE & ELEGÂNCIA',
      title: 'A EXCELÊNCIA EM CADA DETALHE',
      subtitle: 'Desenvolvido para quem não abre mão de conforto extremo, acabamento premium e elegância impecável dentro e fora do treino.',
      buttonText: 'CONHECER COLEÇÃO',
      centerBgColor: '#163923',
    },
    {
      name: 'Moderno & Ativo',
      badge: '⚡ NOVA ENERGIA EM MOVIMENTO',
      title: 'POTÊNCIA & LIBERDADE TOTAL',
      subtitle: 'Tecnologia com elasticidade multidirecional e toque fresco para acompanhar o ritmo dos seus melhores treinos.',
      buttonText: 'EU QUERO ESSA PEÇA',
      centerBgColor: '#142538',
    },
  ];

  return {
    badge,
    title,
    subtitle,
    buttonText,
    link,
    centerBgColor,
    leftImage: leftImg,
    rightImage: rightImg,
    themeNotes: `Banner gerado com sucesso pela IA com base no tema "${cleanTheme}".`,
    alternativeStyles,
  };
}

// ==========================================
// SEÇÕES DA LOJA EM EXPOSIÇÃO (MENUS & HOME)
// ==========================================

export function getStoreSections(): StoreSection[] {
  return getStorageItem<StoreSection[]>(STORAGE_KEYS.SECTIONS, cachedSections);
}

export function saveStoreSection(sectionData: Partial<StoreSection>): StoreSection {
  const sections = getStoreSections();
  let updatedSection: StoreSection;

  if (sectionData.id) {
    const idx = sections.findIndex((s) => s.id === sectionData.id);
    if (idx !== -1) {
      updatedSection = { ...sections[idx], ...sectionData };
      sections[idx] = updatedSection;
    } else {
      updatedSection = sectionData as StoreSection;
      sections.push(updatedSection);
    }
  } else {
    const slug = (sectionData.name || 'Nova Secao')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    updatedSection = {
      id: `sec-${Date.now()}`,
      name: sectionData.name || 'Nova Seção',
      slug: sectionData.slug || slug,
      badge: sectionData.badge || 'DESTAQUE',
      description: sectionData.description || '',
      bannerImage: sectionData.bannerImage || '/images/banner-style.png',
      showInMenu: sectionData.showInMenu ?? true,
      showInHome: sectionData.showInHome ?? true,
      active: sectionData.active ?? true,
      order: sectionData.order ?? sections.length + 1,
      productIds: sectionData.productIds || [],
      includedCategories: sectionData.includedCategories || [],
      createdAt: new Date().toISOString(),
      ...sectionData,
    };
    sections.push(updatedSection);
  }

  cachedSections = sections;
  setStorageItem(STORAGE_KEYS.SECTIONS, sections);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_sections_updated', { detail: sections }));
  }
  return updatedSection;
}

export function deleteStoreSection(id: string): void {
  const sections = getStoreSections().filter((s) => s.id !== id);
  cachedSections = sections;
  setStorageItem(STORAGE_KEYS.SECTIONS, sections);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_sections_updated', { detail: sections }));
  }
}

export function addProductToSection(sectionId: string, productId: string): StoreSection | null {
  const sections = getStoreSections();
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;

  const currentIds = sections[idx].productIds || [];
  if (!currentIds.includes(productId)) {
    sections[idx] = {
      ...sections[idx],
      productIds: [...currentIds, productId],
    };
    cachedSections = sections;
    setStorageItem(STORAGE_KEYS.SECTIONS, sections);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_sections_updated', { detail: sections }));
    }
  }
  return sections[idx];
}

export function removeProductFromSection(sectionId: string, productId: string): StoreSection | null {
  const sections = getStoreSections();
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;

  sections[idx] = {
    ...sections[idx],
    productIds: (sections[idx].productIds || []).filter((id) => id !== productId),
  };
  cachedSections = sections;
  setStorageItem(STORAGE_KEYS.SECTIONS, sections);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_sections_updated', { detail: sections }));
  }
  return sections[idx];
}

export function addCategoryProductsToSection(sectionId: string, categoryName: string): StoreSection | null {
  const sections = getStoreSections();
  const idx = sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) return null;

  const products = getProducts();
  const normCategory = categoryName.trim().toLowerCase();
  const matchingProductIds = products
    .filter((p) => (p.category || '').trim().toLowerCase() === normCategory)
    .map((p) => p.id);

  const existingIds = new Set(sections[idx].productIds || []);
  matchingProductIds.forEach((id) => existingIds.add(id));

  const existingCats = new Set(sections[idx].includedCategories || []);
  existingCats.add(categoryName);

  sections[idx] = {
    ...sections[idx],
    productIds: Array.from(existingIds),
    includedCategories: Array.from(existingCats),
  };
  cachedSections = sections;
  setStorageItem(STORAGE_KEYS.SECTIONS, sections);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_sections_updated', { detail: sections }));
  }
  return sections[idx];
}

// ==========================================
// BANNERS DO CARROSSEL PRINCIPAL (HERO SLIDES)
// ==========================================

export function getHeroBanners(): HeroBannerSlide[] {
  return getStorageItem<HeroBannerSlide[]>(STORAGE_KEYS.HERO_BANNERS, cachedHeroBanners);
}

export function saveHeroBanner(bannerData: Partial<HeroBannerSlide>): HeroBannerSlide {
  const banners = getHeroBanners();
  let updatedBanner: HeroBannerSlide;

  if (bannerData.id) {
    const idx = banners.findIndex((b) => b.id === bannerData.id);
    if (idx !== -1) {
      updatedBanner = { ...banners[idx], ...bannerData };
      banners[idx] = updatedBanner;
    } else {
      updatedBanner = bannerData as HeroBannerSlide;
      banners.push(updatedBanner);
    }
  } else {
    updatedBanner = {
      id: `banner-${Date.now()}`,
      badge: bannerData.badge || 'DESTAQUE',
      title: bannerData.title || 'NOVO BANNER AURA',
      subtitle: bannerData.subtitle || 'Moda fitness de alta performance e elegância',
      buttonText: bannerData.buttonText || 'VER PRODUTOS',
      link: bannerData.link || '/catalogo',
      leftImage: bannerData.leftImage || '/images/look-3214.png',
      rightImage: bannerData.rightImage || '/images/macaco-bless.png',
      centerBgColor: bannerData.centerBgColor || '#163923',
      active: bannerData.active ?? true,
      order: bannerData.order ?? banners.length + 1,
      ...bannerData,
    };
    banners.push(updatedBanner);
  }

  cachedHeroBanners = banners;
  setStorageItem(STORAGE_KEYS.HERO_BANNERS, banners);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_banners_updated', { detail: banners }));
  }
  return updatedBanner;
}

export function deleteHeroBanner(id: string): void {
  const banners = getHeroBanners().filter((b) => b.id !== id);
  cachedHeroBanners = banners;
  setStorageItem(STORAGE_KEYS.HERO_BANNERS, banners);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_banners_updated', { detail: banners }));
  }
}

export function reorderHeroBanners(newBanners: HeroBannerSlide[]): void {
  const reordered = newBanners.map((b, idx) => ({ ...b, order: idx + 1 }));
  cachedHeroBanners = reordered;
  setStorageItem(STORAGE_KEYS.HERO_BANNERS, reordered);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_banners_updated', { detail: reordered }));
  }
}
