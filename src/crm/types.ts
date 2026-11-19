import { Order, ShippingAddress } from '../types';

export type CrmSegmentStatus =
  | 'novo'
  | 'carrinho_abandonado'
  | 'pagamento_pendente'
  | 'ativo'
  | 'vip'
  | 'em_risco'
  | 'inativo'
  | 'aniversariante';

export type CrmUserRole = 'admin' | 'gerente' | 'vendedor';

export interface CrmUser {
  id: string;
  name: string;
  email: string;
  role: CrmUserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CrmCartItemSnapshot {
  productId: string;
  productName: string;
  productImage: string;
  sku: string;
  size: string;
  colorName: string;
  price: number;
  quantity: number;
}

export interface CrmCartRecord {
  id: string;
  sessionId: string;
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CrmCartItemSnapshot[];
  subtotal: number;
  total: number;
  couponCode?: string;
  checkoutStep: number; // 0=carrinho, 1=identificação, 2=frete, 3=pagamento
  status: 'active' | 'abandoned' | 'recovered' | 'converted';
  recoveryContactedAt?: string;
  convertedOrderId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface CrmCustomerNote {
  id: string;
  customerId: string;
  customerEmail: string;
  authorName: string;
  type: 'note' | 'whatsapp' | 'call' | 'alert' | 'follow_up';
  content: string;
  followUpDate?: string;
  isResolved: boolean;
  createdAt: string;
}

export interface CrmTimelineEvent {
  id: string;
  customerId: string;
  customerEmail: string;
  eventType:
    | 'registered'
    | 'cart_updated'
    | 'cart_abandoned'
    | 'order_created'
    | 'order_paid'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'message_sent'
    | 'birthday_coupon'
    | 'note_added'
    | 'attention_flagged';
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CrmAutomationRule {
  id: string;
  name: string;
  description: string;
  triggerType:
    | 'welcome'
    | 'cart_abandoned_2h'
    | 'cart_abandoned_24h'
    | 'pix_pending_1h'
    | 'order_paid'
    | 'order_shipped'
    | 'post_sale_review'
    | 'repurchase_45d'
    | 'birthday'
    | 'winback_60d'
    | 'winback_120d';
  delayMinutes: number;
  channel: 'whatsapp' | 'email' | 'both';
  subject?: string;
  template: string;
  autoCouponPrefix?: string;
  autoCouponDiscount?: number;
  isActive: boolean;
  totalTriggered: number;
  totalConverted: number;
  revenueGenerated: number;
  updatedAt: string;
}

export interface CrmQueuedMessage {
  id: string;
  automationId?: string;
  automationName?: string;
  campaignId?: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  channel: 'whatsapp' | 'email';
  subject?: string;
  body: string;
  couponCode?: string;
  scheduledFor: string;
  sentAt?: string;
  status: 'pending' | 'ready_manual' | 'sent' | 'delivered' | 'failed' | 'cancelled' | 'converted';
  errorMessage?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CrmCampaign {
  id: string;
  name: string;
  segment: 'all' | CrmSegmentStatus;
  channel: 'whatsapp' | 'email' | 'both';
  subject?: string;
  messageTemplate: string;
  couponCode?: string;
  scheduledAt?: string;
  sentAt?: string;
  status: 'draft' | 'scheduled' | 'sent';
  recipientsCount: number;
  convertedCount: number;
  revenueGenerated: number;
  createdAt: string;
}

export interface CrmSettingsConfig {
  vipMinOrders: number;
  vipMinSpent: number;
  atRiskDays: number;
  inactiveDays: number;
  abandonedCartMinutes: number;
  pendingPaymentMinutes: number;
  birthdayLookaheadDays: number;
  birthdayDiscountPercent: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  antiSpamCooldownHours: number;
  whatsappProvider: 'manual_1click' | 'zapi' | 'evolution' | 'meta_cloud';
  whatsappApiUrl?: string;
  whatsappApiToken?: string;
  whatsappInstanceId?: string;
  emailProvider: 'resend' | 'webhook';
  resendApiKey?: string;
  senderEmail: string;
}

export interface CrmCustomer360 {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate?: string; // YYYY-MM-DD
  daysUntilBirthday?: number | null;
  isBirthdayMonth?: boolean;
  isBirthdayWeek?: boolean;
  isBirthdayToday?: boolean;
  city?: string;
  state?: string;
  addresses: ShippingAddress[];
  // Métricas sincronizadas com compras reais
  totalOrders: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  cancelledOrdersCount: number;
  totalSpent: number;
  pendingAmount: number;
  averageTicket: number;
  lastOrderDate?: string;
  lastOrderNumber?: string;
  lastOrderStatus?: Order['status'];
  firstOrderDate?: string;
  daysSinceLastPurchase: number | null;
  // Carrinho sincronizado
  activeCart?: CrmCartRecord;
  hasAbandonedCart: boolean;
  abandonedCartValue: number;
  // Inteligência de Produto
  preferredSizes: string[];
  preferredColors: string[];
  favoriteProducts: { name: string; count: number; image?: string }[];
  // Segmentação e Termômetro de Atenção
  crmStatus: CrmSegmentStatus;
  secondaryBadges: CrmSegmentStatus[];
  attentionScore: number; // 0..100
  attentionLevel: 'critica' | 'alta' | 'media' | 'baixa';
  attentionReason: string;
  recommendedAction: string;
  needsManualAttention: boolean;
  // Relacionamento
  tags: string[];
  origin: 'site' | 'instagram' | 'whatsapp' | 'indicacao' | 'google';
  optinWhatsapp: boolean;
  optinEmail: boolean;
  assignedTo?: string;
  lastContactedAt?: string;
  lastAccess: string;
  createdAt: string;
  // Relacionados
  orders: Order[];
  notes: CrmCustomerNote[];
  timeline: CrmTimelineEvent[];
}

export interface CrmDashboardSummary {
  totalCustomers: number;
  AttentionRequiredCount: number;
  abandonedCartsCount: number;
  abandonedCartsTotalValue: number;
  pendingOrdersCount: number;
  pendingOrdersTotalValue: number;
  birthdaysThisWeekCount: number;
  birthdaysThisMonthCount: number;
  atRiskCount: number;
  inactiveCount: number;
  vipCount: number;
  activeCount: number;
  newCustomersCount: number;
  queuedMessagesCount: number;
  sentMessagesCount: number;
  recoveredRevenueTotal: number;
  segmentBreakdown: Record<CrmSegmentStatus, { count: number; revenue: number }>;
}
