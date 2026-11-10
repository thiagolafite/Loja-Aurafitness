export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductSEO {
  title: string;
  description: string;
  keywords: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  fullDescription: string;
  category: string;
  additionalCategories?: string[];
  price: number;
  promotionalPrice?: number;
  sku: string;
  barcode: string;
  weight: number; // in grams
  brand: string;
  images: string[];
  videoUrl?: string;
  sizes: string[]; // e.g. ['PP', 'P', 'M', 'G', 'GG']
  colors: ProductColor[];
  materials: string[];
  stock: Record<string, number>; // e.g. { "P-Preto": 10, "M-Preto": 5 }
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  seo: ProductSEO;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: ProductColor;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  size: string;
  colorName: string;
  price: number;
  quantity: number;
  total: number;
}

export interface ShippingAddress {
  id?: string;
  recipientName: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isDefault?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  deliveryDays: number;
  price: number;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

export type OrderStatus = 'pendente' | 'pago' | 'em_separacao' | 'enviado' | 'entregue' | 'cancelado';
export type PaymentMethod = 'pix' | 'picpay' | 'credit_card' | 'debit_card' | 'boleto';

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    pixQrCode?: string;
    pixCopyPaste?: string;
    cardBrand?: string;
    cardLastFour?: string;
    boletoBarcode?: string;
    picpayUser?: string;
    picpayPaymentUrl?: string;
    picpayQrCode?: string;
    transactionId?: string;
    expirationDate?: string;
  };
  totals: OrderTotals;
  status: OrderStatus;
  trackingCode?: string;
  couponCode?: string;
  notes?: string;
}

export interface SavedPaymentMethod {
  id: string;
  type: 'credit_card' | 'pix';
  cardBrand?: string;
  cardLastFour?: string;
  cardHolderName?: string;
  expiryDate?: string;
  isDefault?: boolean;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  password?: string;
  addresses: ShippingAddress[];
  savedPaymentMethods?: SavedPaymentMethod[];
  totalOrders: number;
  totalSpent: number;
  averageTicket: number;
  lastAccess: string;
  lastOrderDate?: string;
  wishlist: string[]; // Product IDs
}

export interface StoreSettings {
  companyName: string;
  cnpj: string;
  phone: string;
  whatsappNumber: string;
  pixKey: string;
  pixKeyType: string; // e.g. 'CNPJ', 'E-mail', 'Chave Aleatória'
  email: string;
  address: string;
  social: {
    instagram: string;
    facebook: string;
    youtube: string;
    tiktok: string;
  };
  logoUrl: string;
  bannerUrl: string;
  shipping: {
    freeShippingThreshold: number;
    defaultFlatRate: number;
    enableCorreios: boolean;
    regions: {
      id: string;
      regionName: string;
      states: string[];
      price: number;
      deliveryDays: number;
    }[];
  };
  seo: {
    defaultTitle: string;
    defaultDescription: string;
  };
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  customerName: string;
  customerEmail: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  adminReply?: string;
  isSpam?: boolean;
}

export type BlogCategory = 'Treinos' | 'Nutrição' | 'Moda Fitness' | 'Bem-estar' | 'Lifestyle';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: BlogCategory;
  author: {
    name: string;
    avatar: string;
  };
  imageUrl: string;
  readTimeMinutes: number;
  publishedAt: string;
  isPublished: boolean;
  seo: {
    title: string;
    description: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  value: number;
  minSpend?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt: string;
  isFirstPurchaseOnly?: boolean;
  isActive: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  badgeText: string;
  bannerUrl: string;
  discountPercentage: number;
  productIds?: string[];
  category?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface LookSet {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  productIds: string[];
  setDiscountPercentage: number;
  totalPrice: number;
  discountedPrice: number;
  isActive: boolean;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  variant: string;
  reason: string;
  date: string;
  user: string;
}

export interface PaymentLog {
  id: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  method: PaymentMethod;
  status: 'success' | 'failed' | 'pending';
  timestamp: string;
  transactionId: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'stock' | 'review' | 'system';
  read: boolean;
  timestamp: string;
  actionUrl?: string;
}

export interface StoreSection {
  id: string;
  name: string; // Ex: 'Moda Verão', 'Black Friday', 'Lançamentos'
  slug: string; // Ex: 'moda-verao', 'black-friday'
  badge?: string; // Ex: '☀️ VERÃO 2026', '🔥 BLACK FRIDAY', '50% OFF'
  description?: string;
  bannerImage?: string;
  showInMenu: boolean; // Se aparece no menu/navbar da loja
  showInHome: boolean; // Se aparece em exposição na home da loja
  active: boolean;
  order: number;
  productIds: string[]; // IDs dos produtos incluídos
  includedCategories?: string[]; // Categorias inteiras incluídas (ex: ['Conjuntos'])
  createdAt: string;
}

export interface HeroBannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  buttonText: string;
  link: string; // Ex: '/catalogo?secao=moda-verao' ou '/catalogo?categoria=Conjuntos'
  leftImage: string; // Foto da modelo / esquerda
  rightImage?: string; // Foto da modelo / direita
  centerBgColor?: string; // Cor de fundo (#163923 ou #f4f4f2)
  active: boolean;
  order: number;
  // Campos avançados inspirados em editoriais de moda fitness
  bannerStyle?: 'classic-3col' | 'editorial-light' | 'bold-dark' | 'single-full' | 'split-50';
  couponCode?: string; // Ex: 'PRIMEIRA30' ou 'BEMVINDAAURA'
  discountHighlight?: string; // Ex: 'R$ 30,00 DE DESCONTO'
  disclaimer?: string; // Ex: '*Cupom válido em pedidos de primeira compra a partir de R$ 299...'

  // === TOTAL DESIGN CONTROL ===
  // Layout e Dimensões
  bannerHeight?: 'compact' | 'normal' | 'tall';
  backgroundType?: 'solid' | 'gradient';
  bgGradientEndColor?: string;
  gradientDirection?: 'to-r' | 'to-b' | 'to-br';
  overlayOpacity?: number; // 0 a 100
  ambientGlow?: boolean;
  ambientGlowColor?: string;

  // Foto 1 (Esquerda / Principal)
  leftImageScale?: number; // 50 a 180 (padrão 100)
  leftImagePositionX?: number; // 0 a 100 (padrão 50)
  leftImagePositionY?: number; // 0 a 100 (padrão 20)
  leftImageFit?: 'cover' | 'contain';
  leftImageBrightness?: number; // 50 a 150 (padrão 100)
  leftImageContrast?: number; // 50 a 150 (padrão 100)
  leftImageSaturate?: number; // 0 a 200 (padrão 100)
  leftImageBlur?: number; // 0 a 15 (padrão 0)
  leftImageGrayscale?: number; // 0 a 100 (padrão 0)
  leftImageSepia?: number; // 0 a 100 (padrão 0)
  leftImageOpacity?: number; // 20 a 100 (padrão 100)
  leftImageFlipX?: boolean;
  leftImageCardWidth?: number; // 15 a 42 (padrão 26%)
  leftImageCardHeight?: number; // 60 a 95 (padrão 85%)
  leftImageCardRadius?: number; // 0 a 40 (padrão 24px)

  // Foto 2 (Direita)
  rightImageScale?: number;
  rightImagePositionX?: number;
  rightImagePositionY?: number;
  rightImageFit?: 'cover' | 'contain';
  rightImageBrightness?: number;
  rightImageContrast?: number;
  rightImageSaturate?: number;
  rightImageBlur?: number;
  rightImageGrayscale?: number;
  rightImageSepia?: number;
  rightImageOpacity?: number;
  rightImageFlipX?: boolean;
  rightImageCardWidth?: number; // 15 a 42 (padrão 26%)
  rightImageCardHeight?: number; // 60 a 95 (padrão 85%)
  rightImageCardRadius?: number; // 0 a 40 (padrão 24px)

  // Tipografia e Cores
  titleColor?: string;
  subtitleColor?: string;
  titleFontSize?: number | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  titleFontFamily?: 'serif' | 'sans';
  textAlign?: 'left' | 'center' | 'right';
  badgeBgColor?: string;
  badgeTextColor?: string;

  // Botão CTA
  buttonBgColor?: string;
  buttonTextColor?: string;
  buttonBorderColor?: string;
  buttonRadius?: 'rounded-full' | 'rounded-2xl' | 'rounded-xl' | 'rounded-none';
  buttonGlow?: boolean;
}

export interface FloatingVideoItem {
  id: string;
  title: string;
  videoUrl: string; // URL de vídeo (.mp4, .webm) ou 'idb://video/...' (arquivo local salvo no IndexedDB)
  fallbackImages?: string[]; // Fotos para Reels animado caso o vídeo esteja carregando ou seja lookbook
  productId?: string; // Produto vinculado (opcional)
  customLink?: string; // Link personalizado ex: '/produto/prod-1' ou '/catalogo?categoria=Macacões'
  buttonText?: string; // Ex: 'Ver Produto'
  badgeText?: string; // Ex: 'NOVIDADE'
  active: boolean;
  order: number;
}

export interface FloatingVideoConfig {
  enabled: boolean;
  position: 'bottom-left' | 'bottom-right';
  size: 'sm' | 'md' | 'lg';
  borderColor: string; // Ex: '#F27474' (Rosa Coral estilo Lê Rose) ou '#284e20' (Verde Aura)
  clickAction: 'direct-link' | 'expand-player'; // 'direct-link' vai direto ao produto como na Lê Rose; 'expand-player' abre player com som
  showCloseButton: boolean;
  showProductBadge: boolean;
  items: FloatingVideoItem[];
}

export interface TrustBarItem {
  id: string;
  iconName: 'Star' | 'ShieldCheck' | 'Truck' | 'Heart' | 'RefreshCw' | 'Sparkles' | 'Flame' | 'Zap' | 'Award' | 'Tag' | 'ThumbsUp';
  text: string;
  active: boolean;
  order: number;
}
