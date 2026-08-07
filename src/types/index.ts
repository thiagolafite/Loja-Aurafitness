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
export type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'boleto';

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
