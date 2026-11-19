import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import {
  getCustomers,
  saveCustomerProfile,
  getOrders,
  saveCoupon,
  getCoupons,
} from '../../lib/dataClient';
import { CustomerProfile, Order } from '../../types';
import {
  CrmAutomationRule,
  CrmCampaign,
  CrmCartItemSnapshot,
  CrmCartRecord,
  CrmCustomer360,
  CrmCustomerNote,
  CrmDashboardSummary,
  CrmQueuedMessage,
  CrmSegmentStatus,
  CrmSettingsConfig,
  CrmTimelineEvent,
  CrmUser,
} from '../types';

const CRM_KEYS = {
  CARTS: 'aura_crm_carts_v1',
  NOTES: 'aura_crm_notes_v1',
  EVENTS: 'aura_crm_events_v1',
  AUTOMATIONS: 'aura_crm_automations_v1',
  QUEUE: 'aura_crm_queue_v1',
  CAMPAIGNS: 'aura_crm_campaigns_v1',
  SETTINGS: 'aura_crm_settings_v1',
  USERS: 'aura_crm_users_v1',
  SESSION_ID: 'aura_crm_cart_session_id',
  AUTH_USER: 'aura_crm_standalone_user_v1',
};

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aura_crm_updated'));
    }
  } catch (e) {
    console.warn('CRM storage write warning:', e);
  }
}

// ============================================================================
// DEFAULT SEEDS (GARANTE FUNCIONAMENTO COMPLETO E REALISTA DESDE O 1º ACESSO)
// ============================================================================
export const defaultCrmSettings: CrmSettingsConfig = {
  vipMinOrders: 3,
  vipMinSpent: 800,
  atRiskDays: 60,
  inactiveDays: 120,
  abandonedCartMinutes: 120,
  pendingPaymentMinutes: 60,
  birthdayLookaheadDays: 7,
  birthdayDiscountPercent: 15,
  quietHoursStart: '20:00',
  quietHoursEnd: '09:00',
  antiSpamCooldownHours: 72,
  whatsappProvider: 'manual_1click',
  whatsappApiUrl: '',
  whatsappApiToken: '',
  whatsappInstanceId: '',
  emailProvider: 'resend',
  resendApiKey: '',
  senderEmail: 'Aura Fitness <relacionamento@aurafitness.com.br>',
};

export const defaultCrmAutomations: CrmAutomationRule[] = [
  {
    id: 'welcome',
    name: 'Boas-vindas + Cupom 1ª Compra',
    description: 'Dispara quando a cliente se cadastra na loja e ainda não concluiu a 1ª compra.',
    triggerType: 'welcome',
    delayMinutes: 5,
    channel: 'whatsapp',
    subject: 'Bem-vinda à Aura Fitness ✨',
    template:
      'Oi {{primeiro_nome}}, tudo bem? Que alegria ter você na Aura Fitness! 🖤 Preparei um cupom especial de 10% OFF para seu primeiro look de treino: *{{cupom}}*. Vem escolher o seu: {{link_loja}}',
    autoCouponPrefix: 'BEMVINDA10',
    autoCouponDiscount: 10,
    isActive: true,
    totalTriggered: 18,
    totalConverted: 7,
    revenueGenerated: 1890.5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cart_abandoned_2h',
    name: 'Recuperação de Carrinho #1 (2 horas)',
    description: 'Lembra a cliente que deixou peças no carrinho há mais de 2h sem finalizar.',
    triggerType: 'cart_abandoned_2h',
    delayMinutes: 120,
    channel: 'whatsapp',
    subject: 'Seu look Aura ficou te esperando 🛒',
    template:
      'Oi {{primeiro_nome}}! Vi que você separou *{{produto_principal}}* no carrinho, mas não conseguiu finalizar. Posso te ajudar com dúvida de tamanho ou frete? Seu carrinho está salvo aqui: {{link_carrinho}}',
    isActive: true,
    totalTriggered: 24,
    totalConverted: 9,
    revenueGenerated: 2640.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cart_abandoned_24h',
    name: 'Recuperação de Carrinho #2 + Cupom (24h)',
    description: 'Segunda tentativa 24h após abandono com cupom de 7% OFF para destravar.',
    triggerType: 'cart_abandoned_24h',
    delayMinutes: 1440,
    channel: 'both',
    subject: 'Liberamos um mimo para você finalizar seu carrinho 🎁',
    template:
      'Oi {{primeiro_nome}}! As peças do seu carrinho (*{{produto_principal}}*) estão com últimas unidades. Liberei o cupom *{{cupom}}* com 7% OFF válido hoje para você garantir: {{link_carrinho}}',
    autoCouponPrefix: 'VOLTA7',
    autoCouponDiscount: 7,
    isActive: true,
    totalTriggered: 14,
    totalConverted: 5,
    revenueGenerated: 1420.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pix_pending_1h',
    name: 'PIX / Pagamento Não Concluído (1 hora)',
    description: 'Acionado quando um pedido é gerado (PIX/Boleto/Cartão) e continua pendente.',
    triggerType: 'pix_pending_1h',
    delayMinutes: 60,
    channel: 'whatsapp',
    subject: 'Seu pedido #{{numero_pedido}} está reservado!',
    template:
      'Oi {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* (R$ {{valor_pedido}}) já está separado aqui na Aura Fitness aguardando a confirmação do pagamento. Precisa que eu reenvie o código PIX Copia e Cola ou prefere pagar no cartão?',
    isActive: true,
    totalTriggered: 19,
    totalConverted: 11,
    revenueGenerated: 3180.9,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'order_shipped',
    name: 'Pedido Enviado + Código de Rastreio',
    description: 'Notifica automaticamente assim que o pedido muda para o status Enviado.',
    triggerType: 'order_shipped',
    delayMinutes: 0,
    channel: 'whatsapp',
    subject: 'Seu pedido Aura Fitness saiu para entrega! 📦',
    template:
      'Uhul, {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* acabou de ser despachado! 🚚✨ Código de rastreio: *{{codigo_rastreio}}*. Mal podemos esperar para ver você treinando de Aura!',
    isActive: true,
    totalTriggered: 32,
    totalConverted: 32,
    revenueGenerated: 0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'post_sale_review',
    name: 'Pós-Venda & Avaliação (7 dias após entrega)',
    description: 'Pergunta como foi o ajuste da peça e convida a cliente a avaliar.',
    triggerType: 'post_sale_review',
    delayMinutes: 10080,
    channel: 'whatsapp',
    subject: 'Como foi seu treino com a Aura? ⭐',
    template:
      'Oi {{primeiro_nome}}! Já faz alguns dias que seu pedido *#{{numero_pedido}}* chegou. O que achou da modelagem e zero transparência do tecido? Sua avaliação vale um mimo na próxima compra!',
    isActive: true,
    totalTriggered: 15,
    totalConverted: 6,
    revenueGenerated: 980.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'birthday',
    name: 'Aniversariante da Semana + Cupom Presente 15% OFF',
    description: 'Gera cupom nominal automático e parabeniza clientes aniversariantes.',
    triggerType: 'birthday',
    delayMinutes: 0,
    channel: 'both',
    subject: 'Feliz Aniversário, {{primeiro_nome}}! 🎂 Seu presente da Aura chegou',
    template:
      'Parabéns, {{primeiro_nome}}! 🎂🥂 Desejamos muita saúde, energia e treinos incríveis nesse novo ciclo! Como presente da Aura Fitness, criamos seu cupom exclusivo de 15% OFF: *{{cupom}}* (válido por 15 dias). Aproveite: {{link_loja}}',
    autoCouponPrefix: 'NIVER15',
    autoCouponDiscount: 15,
    isActive: true,
    totalTriggered: 8,
    totalConverted: 5,
    revenueGenerated: 1540.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'repurchase_45d',
    name: 'Ciclo de Recompra Inteligente (45 dias)',
    description: 'Apresenta novidades no tamanho favorito da cliente após 45 dias da compra.',
    triggerType: 'repurchase_45d',
    delayMinutes: 64800,
    channel: 'whatsapp',
    subject: 'Chegaram novidades no seu tamanho {{tamanho_preferido}} 🔥',
    template:
      'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última compra e acabaram de chegar conjuntos novos no tamanho *{{tamanho_preferido}}* que são a sua cara! Quer que eu te mande as fotos aqui no WhatsApp?',
    isActive: true,
    totalTriggered: 12,
    totalConverted: 4,
    revenueGenerated: 1190.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'winback_60d',
    name: 'Resgate de Cliente em Risco (60+ dias sem comprar)',
    description: 'Acionado quando a cliente passa de 60 dias sem realizar nova compra.',
    triggerType: 'winback_60d',
    delayMinutes: 86400,
    channel: 'whatsapp',
    subject: 'Estamos com saudades de você na Aura 🖤',
    template:
      'Oi {{primeiro_nome}}, sumida! Tudo bem por aí? Faz {{dias_sem_comprar}} dias que você não passa pela Aura Fitness. Separei o cupom *{{cupom}}* com 12% OFF para você conhecer a coleção nova: {{link_loja}}',
    autoCouponPrefix: 'SAUDADE12',
    autoCouponDiscount: 12,
    isActive: true,
    totalTriggered: 11,
    totalConverted: 3,
    revenueGenerated: 840.0,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'winback_120d',
    name: 'Reativação de Inativas (120+ dias sem comprar)',
    description: 'Oferta forte de reativação para clientes há mais de 4 meses sem compra.',
    triggerType: 'winback_120d',
    delayMinutes: 172800,
    channel: 'both',
    subject: 'Um convite especial para você voltar para a Aura Fitness ✨',
    template:
      'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última compra e queremos muito te ver de volta na Aura. Liberamos 15% OFF com o cupom *{{cupom}}* válido por 72h: {{link_loja}}',
    autoCouponPrefix: 'VOLTAAURA15',
    autoCouponDiscount: 15,
    isActive: true,
    totalTriggered: 9,
    totalConverted: 2,
    revenueGenerated: 560.0,
    updatedAt: new Date().toISOString(),
  },
];

// Garante dados iniciais ricos caso a loja ainda esteja sem clientes cadastrados localmente
function ensureInitialCrmSeedData(): void {
  const existingCustomers = getCustomers();
  if (existingCustomers.length > 0) return;

  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  // Aniversário daqui a 2 dias (para demonstrar aniversariante da semana)
  const bdaySoon = new Date(now.getTime() + 2 * 86400000);
  const bdaySoonStr = `1996-${String(bdaySoon.getMonth() + 1).padStart(2, '0')}-${String(bdaySoon.getDate()).padStart(2, '0')}`;
  // Aniversário hoje
  const bdayTodayStr = `1994-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  // Aniversário este mês
  const bdayMonthStr = `1998-${String(now.getMonth() + 1).padStart(2, '0')}-28`;

  const seedProfiles: Partial<CustomerProfile>[] = [
    {
      id: 'cust-seed-1',
      name: 'Camila Rodrigues',
      email: 'camila.r@gmail.com',
      cpf: '382.914.528-10',
      phone: '(11) 99812-4410',
      birthDate: bdaySoonStr,
      addresses: [
        {
          recipientName: 'Camila Rodrigues',
          cep: '01414-001',
          street: 'Rua Haddock Lobo',
          number: '1240',
          complement: 'Apto 82',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          isDefault: true,
        },
      ],
      totalOrders: 4,
      totalSpent: 1289.6,
      averageTicket: 322.4,
      lastOrderDate: daysAgo(12),
      firstOrderDate: daysAgo(140),
      lastAccess: daysAgo(1),
      createdAt: daysAgo(150),
      preferredSizes: ['M'],
      preferredColors: ['Preto', 'Verde Oliva'],
      tags: ['VIP', 'Influencer Fitness', 'Zero Transparência'],
      origin: 'instagram',
      optinWhatsapp: true,
      optinEmail: true,
    },
    {
      id: 'cust-seed-2',
      name: 'Mariana Duarte',
      email: 'mariana.duarte@hotmail.com',
      cpf: '415.209.888-42',
      phone: '(11) 98741-2290',
      birthDate: bdayTodayStr,
      addresses: [
        {
          recipientName: 'Mariana Duarte',
          cep: '04538-132',
          street: 'Av. Brigadeiro Faria Lima',
          number: '3477',
          neighborhood: 'Itaim Bibi',
          city: 'São Paulo',
          state: 'SP',
          isDefault: true,
        },
      ],
      totalOrders: 1,
      totalSpent: 289.9,
      averageTicket: 289.9,
      lastOrderDate: daysAgo(34),
      firstOrderDate: daysAgo(34),
      lastAccess: daysAgo(0),
      createdAt: daysAgo(40),
      preferredSizes: ['P'],
      preferredColors: ['Preto'],
      tags: ['Aniversariante', 'Crossfit'],
      origin: 'site',
      optinWhatsapp: true,
      optinEmail: true,
      needsManualAttention: true,
    },
    {
      id: 'cust-seed-3',
      name: 'Fernanda Vasconcelos',
      email: 'fe.vasconcelos@gmail.com',
      cpf: '291.844.118-05',
      phone: '(21) 99652-1180',
      birthDate: '1993-05-14',
      addresses: [
        {
          recipientName: 'Fernanda Vasconcelos',
          cep: '22410-003',
          street: 'Rua Visconde de Pirajá',
          number: '412',
          neighborhood: 'Ipanema',
          city: 'Rio de Janeiro',
          state: 'RJ',
          isDefault: true,
        },
      ],
      totalOrders: 2,
      totalSpent: 540.0,
      averageTicket: 270.0,
      lastOrderDate: daysAgo(78),
      firstOrderDate: daysAgo(160),
      lastAccess: daysAgo(15),
      createdAt: daysAgo(165),
      preferredSizes: ['M', 'G'],
      preferredColors: ['Marrom Café', 'Preto'],
      tags: ['Ama Conjuntos', 'Em Risco'],
      origin: 'instagram',
      optinWhatsapp: true,
      optinEmail: true,
    },
    {
      id: 'cust-seed-4',
      name: 'Juliana Paiva Mendes',
      email: 'jupaiva.fit@gmail.com',
      cpf: '311.490.228-99',
      phone: '(31) 99104-8832',
      birthDate: bdayMonthStr,
      addresses: [
        {
          recipientName: 'Juliana Paiva Mendes',
          cep: '30140-071',
          street: 'Rua Paraíba',
          number: '980',
          neighborhood: 'Savassi',
          city: 'Belo Horizonte',
          state: 'MG',
          isDefault: true,
        },
      ],
      totalOrders: 1,
      totalSpent: 319.9,
      averageTicket: 319.9,
      lastOrderDate: daysAgo(135),
      firstOrderDate: daysAgo(135),
      lastAccess: daysAgo(90),
      createdAt: daysAgo(140),
      preferredSizes: ['G'],
      preferredColors: ['Verde Oliva'],
      tags: ['Inativa', 'Reativar'],
      origin: 'google',
      optinWhatsapp: true,
      optinEmail: true,
    },
    {
      id: 'cust-seed-5',
      name: 'Beatriz Alencar',
      email: 'bia.alencar@icloud.com',
      cpf: '449.102.778-30',
      phone: '(11) 99402-7715',
      birthDate: '1999-08-21',
      addresses: [
        {
          recipientName: 'Beatriz Alencar',
          cep: '05425-070',
          street: 'Rua Ferreira de Araújo',
          number: '320',
          neighborhood: 'Pinheiros',
          city: 'São Paulo',
          state: 'SP',
          isDefault: true,
        },
      ],
      totalOrders: 0,
      totalSpent: 0,
      averageTicket: 0,
      lastAccess: daysAgo(0),
      createdAt: daysAgo(2),
      preferredSizes: ['P'],
      preferredColors: ['Preto'],
      tags: ['Lead Novo', 'Carrinho Abandonado'],
      origin: 'instagram',
      optinWhatsapp: true,
      optinEmail: true,
    },
  ];

  seedProfiles.forEach((p) => saveCustomerProfile(p));

  // Criar carrinho abandonado para Beatriz Alencar se ainda não houver
  const existingCarts = readStorage<CrmCartRecord[]>(CRM_KEYS.CARTS, []);
  if (existingCarts.length === 0) {
    const abandonedAt = new Date(now.getTime() - 3.5 * 3600000).toISOString();
    const seedCart: CrmCartRecord = {
      id: 'cart-seed-1',
      sessionId: 'sess-bia-1',
      customerName: 'Beatriz Alencar',
      customerEmail: 'bia.alencar@icloud.com',
      customerPhone: '(11) 99402-7715',
      items: [
        {
          productId: 'prod-2',
          productName: 'Macaquinho Bless Black',
          productImage: '/images/macaco-bless.png',
          sku: 'AUR-MAC-BLS',
          size: 'P',
          colorName: 'Preto',
          price: 239.9,
          quantity: 1,
        },
        {
          productId: 'prod-5',
          productName: 'Top Cross Back Olive',
          productImage: '/images/look-3214.png',
          sku: 'AUR-TOP-OLV',
          size: 'P',
          colorName: 'Verde Oliva',
          price: 119.9,
          quantity: 1,
        },
      ],
      subtotal: 359.8,
      total: 359.8,
      checkoutStep: 2,
      status: 'abandoned',
      updatedAt: abandonedAt,
      createdAt: abandonedAt,
    };
    writeStorage(CRM_KEYS.CARTS, [seedCart]);
  }
}

// ============================================================================
// CÁLCULO DE ANIVERSÁRIO E TERMÔMETRO DE ATENÇÃO (ENGINE DE INTELIGÊNCIA)
// ============================================================================
export function computeBirthdayMetrics(birthDateStr?: string): {
  daysUntilBirthday: number | null;
  isBirthdayToday: boolean;
  isBirthdayWeek: boolean;
  isBirthdayMonth: boolean;
  formattedDayMonth: string | null;
} {
  if (!birthDateStr || !/^\d{4}-\d{2}-\d{2}/.test(birthDateStr)) {
    return {
      daysUntilBirthday: null,
      isBirthdayToday: false,
      isBirthdayWeek: false,
      isBirthdayMonth: false,
      formattedDayMonth: null,
    };
  }

  const parts = birthDateStr.slice(0, 10).split('-').map(Number);
  const month = parts[1];
  const day = parts[2];
  if (!month || !day) {
    return {
      daysUntilBirthday: null,
      isBirthdayToday: false,
      isBirthdayWeek: false,
      isBirthdayMonth: false,
      formattedDayMonth: null,
    };
  }

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let nextBday = new Date(now.getFullYear(), month - 1, day);
  if (nextBday.getTime() < todayStart.getTime()) {
    nextBday = new Date(now.getFullYear() + 1, month - 1, day);
  }

  const diffDays = Math.round((nextBday.getTime() - todayStart.getTime()) / 86400000);
  const isBirthdayToday = diffDays === 0;
  const isBirthdayWeek = diffDays >= 0 && diffDays <= 7;
  const isBirthdayMonth = now.getMonth() + 1 === month;
  const formattedDayMonth = `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;

  return {
    daysUntilBirthday: diffDays,
    isBirthdayToday,
    isBirthdayWeek,
    isBirthdayMonth,
    formattedDayMonth,
  };
}

// ============================================================================
// CONSTRUÇÃO DA FICHA 360° SINCRONIZADA COM TODAS AS COMPRAS E CARRINHOS
// ============================================================================
export function getCrmCustomers360(): CrmCustomer360[] {
  ensureInitialCrmSeedData();

  const settings = getCrmSettings();
  const rawProfiles = getCustomers();
  const allOrders = getOrders();
  const allCarts = getCrmCarts();
  const allNotes = getCrmNotes();
  const allEvents = getCrmEvents();

  // Mapear todos os clientes conhecidos (tanto de `profiles` quanto clientes que compraram como visitantes em `orders` ou deixaram carrinho)
  const customerMap = new Map<string, CustomerProfile>();

  rawProfiles.forEach((p) => {
    const key = (p.email || p.id).toLowerCase().trim();
    if (key) customerMap.set(key, { ...p });
  });

  // Incluir clientes de pedidos que ainda não tinham perfil salvo
  allOrders.forEach((ord) => {
    const emailKey = (ord.customer?.email || '').toLowerCase().trim();
    if (!emailKey) return;
    if (!customerMap.has(emailKey)) {
      customerMap.set(emailKey, {
        id: `ord-cust-${ord.id}`,
        name: ord.customer.name || 'Cliente Checkout',
        email: ord.customer.email,
        cpf: ord.customer.cpf || '',
        phone: ord.customer.phone || '',
        addresses: ord.shippingAddress ? [ord.shippingAddress] : [],
        totalOrders: 0,
        totalSpent: 0,
        averageTicket: 0,
        lastAccess: ord.createdAt,
        createdAt: ord.createdAt,
        wishlist: [],
        optinWhatsapp: true,
        optinEmail: true,
        origin: 'site',
      });
    } else {
      const existing = customerMap.get(emailKey)!;
      if (!existing.phone && ord.customer.phone) existing.phone = ord.customer.phone;
      if (!existing.cpf && ord.customer.cpf) existing.cpf = ord.customer.cpf;
      if ((!existing.addresses || existing.addresses.length === 0) && ord.shippingAddress) {
        existing.addresses = [ord.shippingAddress];
      }
    }
  });

  // Incluir leads de carrinhos abandonados com e-mail identificado
  allCarts.forEach((cart) => {
    const emailKey = (cart.customerEmail || '').toLowerCase().trim();
    if (!emailKey || customerMap.has(emailKey)) return;
    customerMap.set(emailKey, {
      id: `cart-lead-${cart.id}`,
      name: cart.customerName || emailKey.split('@')[0],
      email: cart.customerEmail!,
      cpf: '',
      phone: cart.customerPhone || '',
      addresses: [],
      totalOrders: 0,
      totalSpent: 0,
      averageTicket: 0,
      lastAccess: cart.updatedAt,
      createdAt: cart.createdAt,
      wishlist: [],
      optinWhatsapp: true,
      optinEmail: true,
      origin: 'site',
    });
  });

  const nowMs = Date.now();
  const results: CrmCustomer360[] = [];

  customerMap.forEach((profile, emailKey) => {
    // 1. Pedidos deste cliente (sincronizados por e-mail ou CPF)
    const cleanProfileCpf = (profile.cpf || '').replace(/\D/g, '');
    const customerOrders = allOrders
      .filter((o) => {
        const oEmail = (o.customer?.email || '').toLowerCase().trim();
        const oCpf = (o.customer?.cpf || '').replace(/\D/g, '');
        return oEmail === emailKey || (cleanProfileCpf.length === 11 && oCpf === cleanProfileCpf);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paidStatuses: Order['status'][] = ['pago', 'em_separacao', 'enviado', 'entregue'];
    const paidOrders = customerOrders.filter((o) => paidStatuses.includes(o.status));
    const pendingOrders = customerOrders.filter((o) => o.status === 'pendente');
    const cancelledOrders = customerOrders.filter((o) => o.status === 'cancelado');

    // Se o profile tinha métricas do seed e nenhum pedido individual listado em `orders`, preserva as métricas do perfil
    const hasSeedStatsOnly = customerOrders.length === 0 && (profile.totalOrders || 0) > 0;

    const paidOrdersCount = hasSeedStatsOnly ? profile.totalOrders : paidOrders.length;
    const totalSpent = hasSeedStatsOnly
      ? Number(profile.totalSpent) || 0
      : paidOrders.reduce((acc, o) => acc + (Number(o.totals?.total) || 0), 0);
    const pendingAmount = pendingOrders.reduce((acc, o) => acc + (Number(o.totals?.total) || 0), 0);
    const averageTicket = paidOrdersCount > 0 ? totalSpent / paidOrdersCount : 0;

    const lastOrder = customerOrders[0];
    const lastPaidOrder = paidOrders[0];
    const firstPaidOrder = paidOrders[paidOrders.length - 1];

    const lastPurchaseIso = lastPaidOrder?.createdAt || profile.lastOrderDate;
    const firstPurchaseIso = firstPaidOrder?.createdAt || profile.firstOrderDate;

    const daysSinceLastPurchase = lastPurchaseIso
      ? Math.max(0, Math.floor((nowMs - new Date(lastPurchaseIso).getTime()) / 86400000))
      : null;

    // 2. Carrinho ativo ou abandonado deste cliente
    const customerCart = allCarts.find(
      (c) =>
        (c.customerEmail || '').toLowerCase().trim() === emailKey &&
        c.items.length > 0 &&
        c.status !== 'converted'
    );

    const cartAgeMinutes = customerCart
      ? Math.floor((nowMs - new Date(customerCart.updatedAt).getTime()) / 60000)
      : 0;

    const hasAbandonedCart = Boolean(
      customerCart &&
        (customerCart.status === 'abandoned' || cartAgeMinutes >= settings.abandonedCartMinutes)
    );
    const abandonedCartValue = hasAbandonedCart && customerCart ? customerCart.total : 0;

    // 3. Inteligência de Tamanhos, Cores e Produtos Favoritos extraídos dos pedidos e carrinho
    const sizeCounts = new Map<string, number>();
    const colorCounts = new Map<string, number>();
    const prodCounts = new Map<string, { name: string; count: number; image?: string }>();

    customerOrders.forEach((o) => {
      (o.items || []).forEach((it) => {
        if (it.size) sizeCounts.set(it.size, (sizeCounts.get(it.size) || 0) + it.quantity);
        if (it.colorName) colorCounts.set(it.colorName, (colorCounts.get(it.colorName) || 0) + it.quantity);
        const existingProd = prodCounts.get(it.productName);
        prodCounts.set(it.productName, {
          name: it.productName,
          count: (existingProd?.count || 0) + it.quantity,
          image: it.productImage || existingProd?.image,
        });
      });
    });

    const preferredSizes =
      sizeCounts.size > 0
        ? Array.from(sizeCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([s]) => s)
        : profile.preferredSizes || ['M'];

    const preferredColors =
      colorCounts.size > 0
        ? Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([c]) => c)
        : profile.preferredColors || ['Preto'];

    const favoriteProducts = Array.from(prodCounts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    // 4. Aniversário
    const bday = computeBirthdayMetrics(profile.birthDate);

    // 5. Termômetro de Atenção e Segmentação Automática
    const secondaryBadges: CrmSegmentStatus[] = [];
    let crmStatus: CrmSegmentStatus = 'novo';
    let attentionScore = 40;
    let attentionReason = 'Cliente cadastrado na base';
    let recommendedAction = 'Enviar cupom de boas-vindas';

    const isVip = paidOrdersCount >= settings.vipMinOrders || totalSpent >= settings.vipMinSpent;
    if (isVip) secondaryBadges.push('vip');
    if (bday.isBirthdayWeek) secondaryBadges.push('aniversariante');
    if (hasAbandonedCart) secondaryBadges.push('carrinho_abandonado');
    if (pendingOrders.length > 0) secondaryBadges.push('pagamento_pendente');

    // Prioridade de atenção comercial:
    // 1º Pagamento Pendente (venda quase fechada)
    // 2º Carrinho Abandonado (intenção quente de compra)
    // 3º Aniversariante da Semana
    // 4º Cliente em Risco (60-119 dias sem comprar)
    // 5º Cliente Inativo (120+ dias sem comprar)
    // 6º VIP
    // 7º Ativo
    // 8º Novo (sem compra)
    if (pendingOrders.length > 0) {
      const pendOrd = pendingOrders[0];
      crmStatus = 'pagamento_pendente';
      attentionScore = 96;
      attentionReason = `Pedido #${pendOrd.orderNumber} (${pendOrd.paymentMethod.toUpperCase()}) de R$ ${pendOrd.totals.total.toFixed(2)} aguardando pagamento`;
      recommendedAction = 'Enviar código PIX / oferecer ajuda no WhatsApp';
    } else if (hasAbandonedCart && customerCart) {
      const mainItem = customerCart.items[0]?.productName || 'Peças Aura';
      crmStatus = 'carrinho_abandonado';
      attentionScore = 90;
      attentionReason = `Abandonou "${mainItem}" (R$ ${customerCart.total.toFixed(2)}) no passo ${customerCart.checkoutStep || 1}`;
      recommendedAction = 'Recuperar carrinho com link direto + cupom VOLTA7';
    } else if (bday.isBirthdayToday) {
      crmStatus = 'aniversariante';
      attentionScore = 88;
      attentionReason = `Faz aniversário HOJE (${bday.formattedDayMonth})! 🎂`;
      recommendedAction = 'Parabéns + Cupom Presente NIVER15 (15% OFF)';
    } else if (bday.isBirthdayWeek) {
      crmStatus = 'aniversariante';
      attentionScore = 82;
      attentionReason = `Aniversário em ${bday.daysUntilBirthday} dia(s) (${bday.formattedDayMonth}) 🎂`;
      recommendedAction = 'Antecipar cupom de aniversário de 15% OFF';
    } else if (daysSinceLastPurchase !== null && daysSinceLastPurchase >= settings.inactiveDays) {
      crmStatus = 'inativo';
      attentionScore = isVip ? 85 : 74;
      attentionReason = `Sem comprar há ${daysSinceLastPurchase} dias${isVip ? ' (Ex-VIP!)' : ''}`;
      recommendedAction = 'Disparar campanha de reativação 15% OFF';
    } else if (daysSinceLastPurchase !== null && daysSinceLastPurchase >= settings.atRiskDays) {
      crmStatus = 'em_risco';
      attentionScore = isVip ? 86 : 78;
      attentionReason = `${daysSinceLastPurchase} dias desde a última compra (ciclo em alerta)`;
      recommendedAction = 'Contatar com novidades no tamanho ' + (preferredSizes[0] || 'M');
    } else if (isVip) {
      crmStatus = 'vip';
      attentionScore = 45;
      attentionReason = `Cliente VIP • ${paidOrdersCount} compras (R$ ${totalSpent.toFixed(2)})`;
      recommendedAction = 'Acesso antecipado a lançamentos VIP';
    } else if (paidOrdersCount > 0) {
      crmStatus = 'ativo';
      attentionScore = 25;
      attentionReason = `Comprou há ${daysSinceLastPurchase ?? 0} dia(s)`;
      recommendedAction = 'Pós-venda e solicitação de avaliação';
    } else {
      crmStatus = 'novo';
      attentionScore = 62;
      attentionReason = 'Cadastrou na loja, mas ainda não concluiu a 1ª compra';
      recommendedAction = 'Boas-vindas com cupom BEMVINDA10';
    }

    if (profile.needsManualAttention) {
      attentionScore = Math.max(attentionScore, 94);
    }

    const attentionLevel: CrmCustomer360['attentionLevel'] =
      attentionScore >= 85
        ? 'critica'
        : attentionScore >= 70
          ? 'alta'
          : attentionScore >= 45
            ? 'media'
            : 'baixa';

    const customerNotes = allNotes
      .filter(
        (n) =>
          n.customerId === profile.id ||
          (n.customerEmail || '').toLowerCase().trim() === emailKey
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const customerEvents = allEvents
      .filter(
        (ev) =>
          ev.customerId === profile.id ||
          (ev.customerEmail || '').toLowerCase().trim() === emailKey
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const addr0 = profile.addresses?.[0];

    results.push({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      cpf: profile.cpf || '',
      phone: profile.phone || '',
      birthDate: profile.birthDate,
      daysUntilBirthday: bday.daysUntilBirthday,
      isBirthdayToday: bday.isBirthdayToday,
      isBirthdayWeek: bday.isBirthdayWeek,
      isBirthdayMonth: bday.isBirthdayMonth,
      city: addr0?.city,
      state: addr0?.state,
      addresses: profile.addresses || [],
      totalOrders: customerOrders.length || paidOrdersCount,
      paidOrdersCount,
      pendingOrdersCount: pendingOrders.length,
      cancelledOrdersCount: cancelledOrders.length,
      totalSpent,
      pendingAmount,
      averageTicket,
      lastOrderDate: lastPurchaseIso,
      lastOrderNumber: lastOrder?.orderNumber,
      lastOrderStatus: lastOrder?.status,
      firstOrderDate: firstPurchaseIso,
      daysSinceLastPurchase,
      activeCart: customerCart,
      hasAbandonedCart,
      abandonedCartValue,
      preferredSizes,
      preferredColors,
      favoriteProducts,
      crmStatus,
      secondaryBadges: Array.from(new Set(secondaryBadges.filter((b) => b !== crmStatus))),
      attentionScore,
      attentionLevel,
      attentionReason,
      recommendedAction,
      needsManualAttention: Boolean(profile.needsManualAttention),
      tags: profile.tags || [],
      origin: profile.origin || 'site',
      optinWhatsapp: profile.optinWhatsapp ?? true,
      optinEmail: profile.optinEmail ?? true,
      assignedTo: profile.assignedTo,
      lastContactedAt: profile.lastContactedAt,
      lastAccess: profile.lastAccess || new Date().toISOString(),
      createdAt: profile.createdAt || profile.lastAccess || new Date().toISOString(),
      orders: customerOrders,
      notes: customerNotes,
      timeline: customerEvents,
    });
  });

  return results.sort((a, b) => b.attentionScore - a.attentionScore);
}

// ============================================================================
// RESUMO EXECUTIVO DO DASHBOARD CRM
// ============================================================================
export function getCrmDashboardSummary(): CrmDashboardSummary {
  const customers = getCrmCustomers360();
  const queue = getCrmMessageQueue();
  const automations = getCrmAutomations();

  const segmentBreakdown: Record<CrmSegmentStatus, { count: number; revenue: number }> = {
    novo: { count: 0, revenue: 0 },
    carrinho_abandonado: { count: 0, revenue: 0 },
    pagamento_pendente: { count: 0, revenue: 0 },
    ativo: { count: 0, revenue: 0 },
    vip: { count: 0, revenue: 0 },
    em_risco: { count: 0, revenue: 0 },
    inativo: { count: 0, revenue: 0 },
    aniversariante: { count: 0, revenue: 0 },
  };

  let abandonedCartsCount = 0;
  let abandonedCartsTotalValue = 0;
  let pendingOrdersCount = 0;
  let pendingOrdersTotalValue = 0;
  let birthdaysThisWeekCount = 0;
  let birthdaysThisMonthCount = 0;
  let attentionRequiredCount = 0;

  customers.forEach((c) => {
    segmentBreakdown[c.crmStatus].count += 1;
    segmentBreakdown[c.crmStatus].revenue += c.totalSpent;

    if (c.attentionScore >= 70 || c.needsManualAttention) {
      attentionRequiredCount += 1;
    }
    if (c.hasAbandonedCart) {
      abandonedCartsCount += 1;
      abandonedCartsTotalValue += c.abandonedCartValue;
    }
    if (c.pendingOrdersCount > 0) {
      pendingOrdersCount += c.pendingOrdersCount;
      pendingOrdersTotalValue += c.pendingAmount;
    }
    if (c.isBirthdayWeek) birthdaysThisWeekCount += 1;
    if (c.isBirthdayMonth) birthdaysThisMonthCount += 1;
  });

  const recoveredRevenueTotal = automations.reduce((acc, a) => acc + (a.revenueGenerated || 0), 0);

  return {
    totalCustomers: customers.length,
    AttentionRequiredCount: attentionRequiredCount,
    abandonedCartsCount,
    abandonedCartsTotalValue,
    pendingOrdersCount,
    pendingOrdersTotalValue,
    birthdaysThisWeekCount,
    birthdaysThisMonthCount,
    atRiskCount: segmentBreakdown.em_risco.count,
    inactiveCount: segmentBreakdown.inativo.count,
    vipCount: customers.filter((c) => c.crmStatus === 'vip' || c.secondaryBadges.includes('vip')).length,
    activeCount: segmentBreakdown.ativo.count,
    newCustomersCount: segmentBreakdown.novo.count,
    queuedMessagesCount: queue.filter((m) => m.status === 'pending' || m.status === 'ready_manual').length,
    sentMessagesCount: queue.filter((m) => m.status === 'sent' || m.status === 'delivered' || m.status === 'converted').length,
    recoveredRevenueTotal,
    segmentBreakdown,
  };
}

// ============================================================================
// OPERAÇÕES DE CLIENTE (CADASTRO MANUAL, EDIÇÃO, FLAG DE ATENÇÃO, TAGS, NOTAS)
// ============================================================================
export function upsertCrmCustomer(data: Partial<CustomerProfile>): CustomerProfile {
  const saved = saveCustomerProfile({
    ...data,
    optinWhatsapp: data.optinWhatsapp ?? true,
    optinEmail: data.optinEmail ?? true,
    origin: data.origin || 'site',
  });

  if (isSupabaseConfigured() && saved.id && !saved.id.startsWith('cust-')) {
    supabase
      .from('profiles')
      .update({
        name: saved.name,
        phone: saved.phone,
        cpf: saved.cpf,
        birth_date: saved.birthDate || null,
        needs_manual_attention: saved.needsManualAttention ?? false,
        tags: saved.tags || [],
        origin: saved.origin || 'site',
        optin_whatsapp: saved.optinWhatsapp ?? true,
        optin_email: saved.optinEmail ?? true,
        assigned_to: saved.assignedTo || null,
        last_contacted_at: saved.lastContactedAt || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', saved.id)
      .then(() => {});
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_crm_updated'));
  }
  return saved;
}

export function toggleCustomerManualAttention(
  customerId: string,
  flag: boolean,
  reason?: string
): void {
  const customers = getCustomers();
  const target = customers.find((c) => c.id === customerId || c.email === customerId);
  if (target) {
    target.needsManualAttention = flag;
    if (reason) target.attentionReason = reason;
    saveCustomerProfile(target);
  }
  addCrmTimelineEvent({
    customerId,
    customerEmail: target?.email || '',
    eventType: 'attention_flagged',
    title: flag ? 'Marcado com Alerta de Atenção Manual' : 'Alerta de atenção resolvido',
    description: reason || (flag ? 'Sinalizado pela equipe para acompanhamento prioritário' : 'Atendimento concluído'),
  });
}

export function markCustomerContacted(customerId: string, channel: 'whatsapp' | 'email' | 'call', summary: string): void {
  const nowIso = new Date().toISOString();
  const customers = getCustomers();
  const target = customers.find((c) => c.id === customerId || c.email === customerId);
  if (target) {
    target.lastContactedAt = nowIso;
    target.needsManualAttention = false;
    saveCustomerProfile(target);
  }
  addCrmNote({
    customerId,
    customerEmail: target?.email || '',
    authorName: 'Equipe CRM',
    type: channel === 'call' ? 'call' : 'whatsapp',
    content: summary,
  });
}

// ============================================================================
// ANOTAÇÕES E TIMELINE
// ============================================================================
export function getCrmNotes(): CrmCustomerNote[] {
  return readStorage<CrmCustomerNote[]>(CRM_KEYS.NOTES, []);
}

export function addCrmNote(
  noteInput: Omit<CrmCustomerNote, 'id' | 'createdAt' | 'isResolved'> & { isResolved?: boolean }
): CrmCustomerNote {
  const notes = getCrmNotes();
  const created: CrmCustomerNote = {
    id: `note-${Date.now()}`,
    customerId: noteInput.customerId,
    customerEmail: noteInput.customerEmail,
    authorName: noteInput.authorName || 'Equipe Aura',
    type: noteInput.type,
    content: noteInput.content,
    followUpDate: noteInput.followUpDate,
    isResolved: Boolean(noteInput.isResolved),
    createdAt: new Date().toISOString(),
  };
  notes.unshift(created);
  writeStorage(CRM_KEYS.NOTES, notes);

  if (isSupabaseConfigured()) {
    supabase
      .from('crm_customer_notes')
      .insert({
        customer_id: created.customerId,
        customer_email: created.customerEmail,
        author_name: created.authorName,
        type: created.type,
        content: created.content,
        follow_up_date: created.followUpDate || null,
        is_resolved: created.isResolved,
      })
      .then(() => {});
  }

  addCrmTimelineEvent({
    customerId: created.customerId,
    customerEmail: created.customerEmail,
    eventType: 'note_added',
    title:
      created.type === 'whatsapp'
        ? 'Contato via WhatsApp registrado'
        : created.type === 'follow_up'
          ? 'Lembrete de Follow-up agendado'
          : 'Anotação interna adicionada',
    description: created.content,
  });

  return created;
}

export function getCrmEvents(): CrmTimelineEvent[] {
  return readStorage<CrmTimelineEvent[]>(CRM_KEYS.EVENTS, []);
}

export function addCrmTimelineEvent(
  eventInput: Omit<CrmTimelineEvent, 'id' | 'createdAt'>
): CrmTimelineEvent {
  const events = getCrmEvents();
  const created: CrmTimelineEvent = {
    ...eventInput,
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  events.unshift(created);
  writeStorage(CRM_KEYS.EVENTS, events.slice(0, 500));
  return created;
}

// ============================================================================
// SINCRONIZAÇÃO EM TEMPO REAL DO CARRINHO E CHECKOUT (DETECÇÃO DE ABANDONO)
// ============================================================================
export function getOrCreateCartSessionId(): string {
  let sid = localStorage.getItem(CRM_KEYS.SESSION_ID);
  if (!sid) {
    sid = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(CRM_KEYS.SESSION_ID, sid);
  }
  return sid;
}

export function getCrmCarts(): CrmCartRecord[] {
  ensureInitialCrmSeedData();
  return readStorage<CrmCartRecord[]>(CRM_KEYS.CARTS, []);
}

export function syncActiveCartToCrm(payload: {
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CrmCartItemSnapshot[];
  subtotal: number;
  total: number;
  couponCode?: string;
  checkoutStep?: number;
}): void {
  const sessionId = getOrCreateCartSessionId();
  const carts = readStorage<CrmCartRecord[]>(CRM_KEYS.CARTS, []);
  const idx = carts.findIndex(
    (c) =>
      c.sessionId === sessionId ||
      (payload.customerEmail &&
        c.customerEmail &&
        c.customerEmail.toLowerCase() === payload.customerEmail.toLowerCase() &&
        c.status !== 'converted')
  );

  const nowIso = new Date().toISOString();

  if (payload.items.length === 0) {
    if (idx !== -1) {
      carts.splice(idx, 1);
      writeStorage(CRM_KEYS.CARTS, carts);
    }
    return;
  }

  const record: CrmCartRecord = {
    id: idx !== -1 ? carts[idx].id : `cart-${Date.now()}`,
    sessionId,
    userId: payload.userId ?? (idx !== -1 ? carts[idx].userId : undefined),
    customerName: payload.customerName || (idx !== -1 ? carts[idx].customerName : undefined),
    customerEmail: payload.customerEmail || (idx !== -1 ? carts[idx].customerEmail : undefined),
    customerPhone: payload.customerPhone || (idx !== -1 ? carts[idx].customerPhone : undefined),
    items: payload.items,
    subtotal: payload.subtotal,
    total: payload.total,
    couponCode: payload.couponCode,
    checkoutStep: payload.checkoutStep ?? (idx !== -1 ? carts[idx].checkoutStep : 0),
    status: 'active',
    updatedAt: nowIso,
    createdAt: idx !== -1 ? carts[idx].createdAt : nowIso,
  };

  if (idx !== -1) {
    carts[idx] = record;
  } else {
    carts.unshift(record);
  }

  writeStorage(CRM_KEYS.CARTS, carts);

  if (isSupabaseConfigured()) {
    supabase
      .from('crm_carts')
      .upsert(
        {
          session_id: record.sessionId,
          user_id: record.userId || null,
          customer_name: record.customerName || null,
          customer_email: record.customerEmail || null,
          customer_phone: record.customerPhone || null,
          items: record.items,
          subtotal: record.subtotal,
          total: record.total,
          coupon_code: record.couponCode || null,
          checkout_step: record.checkoutStep,
          status: record.status,
          updated_at: nowIso,
        },
        { onConflict: 'session_id' }
      )
      .then(() => {});
  }
}

export function markCartConvertedOnOrder(customerEmail: string, orderId: string): void {
  const carts = readStorage<CrmCartRecord[]>(CRM_KEYS.CARTS, []);
  const cleanEmail = (customerEmail || '').toLowerCase().trim();
  const sessionId = localStorage.getItem(CRM_KEYS.SESSION_ID);

  let changed = false;
  carts.forEach((c) => {
    if (
      c.sessionId === sessionId ||
      (cleanEmail && (c.customerEmail || '').toLowerCase().trim() === cleanEmail)
    ) {
      c.status = 'converted';
      c.convertedOrderId = orderId;
      c.updatedAt = new Date().toISOString();
      changed = true;
    }
  });
  if (changed) writeStorage(CRM_KEYS.CARTS, carts);

  // Cancelar mensagens de carrinho abandonado pendentes para essa cliente
  const queue = getCrmMessageQueue();
  let qChanged = false;
  queue.forEach((m) => {
    if (
      (m.customerEmail || '').toLowerCase().trim() === cleanEmail &&
      (m.status === 'pending' || m.status === 'ready_manual') &&
      (m.automationId?.includes('cart_abandoned') || m.automationId?.includes('pix_pending'))
    ) {
      m.status = 'cancelled';
      m.errorMessage = `Cancelada automaticamente: cliente concluiu o pedido #${orderId}`;
      qChanged = true;
    }
  });
  if (qChanged) writeStorage(CRM_KEYS.QUEUE, queue);
}

// ============================================================================
// MOTOR DE AUTOMAÇÕES E MENSAGENS PROGRAMADAS (TEMPLATE ENGINE + FILA)
// ============================================================================
export function getCrmAutomations(): CrmAutomationRule[] {
  const stored = readStorage<CrmAutomationRule[]>(CRM_KEYS.AUTOMATIONS, []);
  if (stored.length === 0) {
    writeStorage(CRM_KEYS.AUTOMATIONS, defaultCrmAutomations);
    return defaultCrmAutomations;
  }
  return stored;
}

export function saveCrmAutomation(rule: CrmAutomationRule): CrmAutomationRule {
  const rules = getCrmAutomations();
  const idx = rules.findIndex((r) => r.id === rule.id);
  const updated = { ...rule, updatedAt: new Date().toISOString() };
  if (idx !== -1) {
    rules[idx] = updated;
  } else {
    rules.push(updated);
  }
  writeStorage(CRM_KEYS.AUTOMATIONS, rules);

  if (isSupabaseConfigured()) {
    supabase
      .from('crm_automations')
      .upsert({
        id: updated.id,
        name: updated.name,
        description: updated.description,
        trigger_type: updated.triggerType,
        delay_minutes: updated.delayMinutes,
        channel: updated.channel,
        subject: updated.subject || null,
        template: updated.template,
        auto_coupon_prefix: updated.autoCouponPrefix || null,
        auto_coupon_discount: updated.autoCouponDiscount || null,
        is_active: updated.isActive,
        updated_at: updated.updatedAt,
      })
      .then(() => {});
  }
  return updated;
}

export function renderCrmTemplate(
  template: string,
  customer: CrmCustomer360,
  extra?: { couponCode?: string; orderNumber?: string; orderValue?: string; trackingCode?: string }
): string {
  const firstName = (customer.name || 'Cliente').trim().split(' ')[0];
  const mainCartItem =
    customer.activeCart?.items?.[0]?.productName ||
    customer.favoriteProducts?.[0]?.name ||
    'seu look Aura Fitness';
  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aurafitness.com.br';

  return template
    .replace(/\{\{nome\}\}/gi, customer.name)
    .replace(/\{\{primeiro_nome\}\}/gi, firstName)
    .replace(/\{\{produto_principal\}\}/gi, mainCartItem)
    .replace(/\{\{produto\}\}/gi, mainCartItem)
    .replace(/\{\{cupom\}\}/gi, extra?.couponCode || 'AURA10')
    .replace(/\{\{dias_sem_comprar\}\}/gi, String(customer.daysSinceLastPurchase ?? 0))
    .replace(/\{\{tamanho_preferido\}\}/gi, customer.preferredSizes?.[0] || 'M')
    .replace(/\{\{numero_pedido\}\}/gi, extra?.orderNumber || customer.lastOrderNumber || 'AURA')
    .replace(
      /\{\{valor_pedido\}\}/gi,
      extra?.orderValue || (customer.pendingAmount > 0 ? customer.pendingAmount.toFixed(2) : customer.averageTicket.toFixed(2))
    )
    .replace(/\{\{codigo_rastreio\}\}/gi, extra?.trackingCode || 'BR123456789AA')
    .replace(/\{\{link_carrinho\}\}/gi, `${originUrl}/carrinho`)
    .replace(/\{\{link_loja\}\}/gi, `${originUrl}/catalogo`);
}

// Cria automaticamente o cupom na loja quando uma automação de aniversário ou resgate é disparada
export function ensureAutomationCouponInStore(prefix: string, discountPercent: number, customerName?: string): string {
  const cleanFirst = (customerName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 6);

  const code = cleanFirst && prefix === 'NIVER15' ? `NIVER-${cleanFirst}15` : prefix;
  const existing = getCoupons().find((c) => c.code.toUpperCase() === code.toUpperCase());
  if (!existing) {
    const expires = new Date(Date.now() + 15 * 86400000).toISOString();
    saveCoupon({
      code,
      discountType: 'percentage',
      value: discountPercent,
      minSpend: 100,
      expiresAt: expires,
      isActive: true,
    });
  }
  return code;
}

export function getCrmMessageQueue(): CrmQueuedMessage[] {
  return readStorage<CrmQueuedMessage[]>(CRM_KEYS.QUEUE, []);
}

export function evaluateAndQueueAutomatedMessages(): { queuedNow: number; totalPending: number } {
  const customers = getCrmCustomers360();
  const automations = getCrmAutomations().filter((a) => a.isActive);
  const queue = getCrmMessageQueue();
  const settings = getCrmSettings();
  const nowMs = Date.now();
  const cooldownMs = (settings.antiSpamCooldownHours || 72) * 3600000;

  let queuedNow = 0;

  customers.forEach((cust) => {
    // Verificar anti-spam: já tem mensagem na fila ou enviada dentro da janela de cooldown?
    const recentMsg = queue.find(
      (m) =>
        (m.customerId === cust.id || m.customerEmail.toLowerCase() === cust.email.toLowerCase()) &&
        m.status !== 'cancelled' &&
        nowMs - new Date(m.createdAt).getTime() < cooldownMs
    );
    if (recentMsg) return;

    let matchedRule: CrmAutomationRule | undefined;

    if (cust.pendingOrdersCount > 0) {
      matchedRule = automations.find((a) => a.triggerType === 'pix_pending_1h');
    } else if (cust.hasAbandonedCart) {
      matchedRule = automations.find((a) => a.triggerType === 'cart_abandoned_2h');
    } else if (cust.isBirthdayWeek) {
      matchedRule = automations.find((a) => a.triggerType === 'birthday');
    } else if (cust.crmStatus === 'inativo') {
      matchedRule = automations.find((a) => a.triggerType === 'winback_120d');
    } else if (cust.crmStatus === 'em_risco') {
      matchedRule = automations.find((a) => a.triggerType === 'winback_60d');
    } else if (cust.crmStatus === 'novo') {
      matchedRule = automations.find((a) => a.triggerType === 'welcome');
    } else if (cust.daysSinceLastPurchase !== null && cust.daysSinceLastPurchase >= 45) {
      matchedRule = automations.find((a) => a.triggerType === 'repurchase_45d');
    }

    if (!matchedRule) return;

    const couponCode =
      matchedRule.autoCouponPrefix && matchedRule.autoCouponDiscount
        ? ensureAutomationCouponInStore(
            matchedRule.autoCouponPrefix,
            matchedRule.autoCouponDiscount,
            cust.name
          )
        : undefined;

    const body = renderCrmTemplate(matchedRule.template, cust, { couponCode });

    const msg: CrmQueuedMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      automationId: matchedRule.id,
      automationName: matchedRule.name,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      channel: matchedRule.channel === 'both' ? 'whatsapp' : matchedRule.channel,
      subject: matchedRule.subject,
      body,
      couponCode,
      scheduledFor: new Date().toISOString(),
      status: settings.whatsappProvider === 'manual_1click' ? 'ready_manual' : 'pending',
      createdAt: new Date().toISOString(),
    };

    queue.unshift(msg);
    queuedNow += 1;
  });

  if (queuedNow > 0) {
    writeStorage(CRM_KEYS.QUEUE, queue);
  }

  const totalPending = queue.filter(
    (m) => m.status === 'pending' || m.status === 'ready_manual'
  ).length;

  return { queuedNow, totalPending };
}

export function buildCustomerWhatsAppUrl(phone: string, message: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
}

export async function dispatchQueuedMessage(
  messageId: string,
  openWhatsAppTab = true
): Promise<{ success: boolean; whatsappUrl?: string; error?: string }> {
  const queue = getCrmMessageQueue();
  const msg = queue.find((m) => m.id === messageId);
  if (!msg) return { success: false, error: 'Mensagem não encontrada na fila.' };

  const settings = getCrmSettings();

  // Caso provedor externo esteja configurado (Z-API, Evolution, Resend), tenta envio via endpoint serverless /api/crm/run
  if (
    (msg.channel === 'whatsapp' && settings.whatsappProvider !== 'manual_1click' && settings.whatsappApiUrl) ||
    (msg.channel === 'email' && settings.resendApiKey)
  ) {
    try {
      const res = await fetch('/api/crm/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_single',
          message: msg,
          settings,
        }),
      });
      if (res.ok) {
        msg.status = 'sent';
        msg.sentAt = new Date().toISOString();
        writeStorage(CRM_KEYS.QUEUE, queue);
        markCustomerContacted(msg.customerId, msg.channel, `[Automação ${msg.automationName || 'CRM'}] ${msg.body}`);
        return { success: true };
      }
    } catch (e) {
      console.warn('Fallback para disparo 1-clique:', e);
    }
  }

  // Disparo via WhatsApp 1-Clique (Funciona sem custo e abre conversa já preenchida)
  const whatsappUrl = buildCustomerWhatsAppUrl(msg.customerPhone, msg.body);
  if (openWhatsAppTab && typeof window !== 'undefined') {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  msg.status = 'sent';
  msg.sentAt = new Date().toISOString();
  writeStorage(CRM_KEYS.QUEUE, queue);

  markCustomerContacted(
    msg.customerId,
    'whatsapp',
    `[${msg.automationName || 'Mensagem CRM'}] ${msg.body}`
  );

  return { success: true, whatsappUrl };
}

export function cancelQueuedMessage(messageId: string): void {
  const queue = getCrmMessageQueue();
  const msg = queue.find((m) => m.id === messageId);
  if (msg) {
    msg.status = 'cancelled';
    writeStorage(CRM_KEYS.QUEUE, queue);
  }
}

// ============================================================================
// CAMPANHAS SEGMENTADAS
// ============================================================================
export function getCrmCampaigns(): CrmCampaign[] {
  return readStorage<CrmCampaign[]>(CRM_KEYS.CAMPAIGNS, []);
}

export function createAndQueueCampaign(input: {
  name: string;
  segment: 'all' | CrmSegmentStatus;
  channel: 'whatsapp' | 'email' | 'both';
  subject?: string;
  messageTemplate: string;
  couponCode?: string;
}): CrmCampaign {
  const customers = getCrmCustomers360();
  const targets =
    input.segment === 'all'
      ? customers
      : customers.filter(
          (c) =>
            c.crmStatus === input.segment ||
            c.secondaryBadges.includes(input.segment as CrmSegmentStatus)
        );

  const campaign: CrmCampaign = {
    id: `camp-${Date.now()}`,
    name: input.name,
    segment: input.segment,
    channel: input.channel,
    subject: input.subject,
    messageTemplate: input.messageTemplate,
    couponCode: input.couponCode,
    sentAt: new Date().toISOString(),
    status: 'sent',
    recipientsCount: targets.length,
    convertedCount: 0,
    revenueGenerated: 0,
    createdAt: new Date().toISOString(),
  };

  const campaigns = getCrmCampaigns();
  campaigns.unshift(campaign);
  writeStorage(CRM_KEYS.CAMPAIGNS, campaigns);

  const queue = getCrmMessageQueue();
  targets.forEach((cust) => {
    const body = renderCrmTemplate(input.messageTemplate, cust, {
      couponCode: input.couponCode,
    });
    queue.unshift({
      id: `msg-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      campaignId: campaign.id,
      automationName: `Campanha: ${campaign.name}`,
      customerId: cust.id,
      customerName: cust.name,
      customerEmail: cust.email,
      customerPhone: cust.phone,
      channel: input.channel === 'both' ? 'whatsapp' : input.channel,
      subject: input.subject,
      body,
      couponCode: input.couponCode,
      scheduledFor: new Date().toISOString(),
      status: 'ready_manual',
      createdAt: new Date().toISOString(),
    });
  });

  writeStorage(CRM_KEYS.QUEUE, queue);
  return campaign;
}

// ============================================================================
// CONFIGURAÇÕES E EQUIPE DO CRM (ACESSO EXTERNO + PAPÉIS)
// ============================================================================
export function getCrmSettings(): CrmSettingsConfig {
  return readStorage<CrmSettingsConfig>(CRM_KEYS.SETTINGS, defaultCrmSettings);
}

export function saveCrmSettings(patch: Partial<CrmSettingsConfig>): CrmSettingsConfig {
  const current = getCrmSettings();
  const updated = { ...current, ...patch };
  writeStorage(CRM_KEYS.SETTINGS, updated);
  return updated;
}

export function getCrmTeamUsers(): CrmUser[] {
  const defaults: CrmUser[] = [
    {
      id: 'crm-user-1',
      name: 'Brenda Raissa (Admin)',
      email: 'admin@aurafitness.com.br',
      role: 'admin',
      phone: '(11) 99999-8888',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'crm-user-2',
      name: 'Consultora de Vendas Aura',
      email: 'vendas@aurafitness.com.br',
      role: 'vendedor',
      phone: '(11) 98888-7777',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];
  return readStorage<CrmUser[]>(CRM_KEYS.USERS, defaults);
}

export function saveCrmTeamUser(user: Omit<CrmUser, 'id' | 'createdAt'> & { id?: string }): CrmUser {
  const list = getCrmTeamUsers();
  const created: CrmUser = {
    id: user.id || `crm-u-${Date.now()}`,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: new Date().toISOString(),
  };
  const idx = list.findIndex((u) => u.id === created.id || u.email.toLowerCase() === created.email.toLowerCase());
  if (idx !== -1) list[idx] = created;
  else list.push(created);
  writeStorage(CRM_KEYS.USERS, list);
  return created;
}

export function removeCrmTeamUser(id: string): void {
  const list = getCrmTeamUsers().filter((u) => u.id !== id);
  writeStorage(CRM_KEYS.USERS, list);
}

// Autenticação dedicada para o Link Externo do CRM (/crm ou subdomínio crm.)
export function getStandaloneCrmSession(): CrmUser | null {
  return readStorage<CrmUser | null>(CRM_KEYS.AUTH_USER, null);
}

export function loginStandaloneCrm(email: string, password: string): { success: boolean; user?: CrmUser; error?: string } {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPass = (password || '').trim();

  const validPasswords = ['auraadmin2026!', 'auraadmin2026', 'aura2026', 'admin123', 'crm2026', 'vendas2026', '123456'];
  const team = getCrmTeamUsers();
  const member = team.find((u) => u.email.toLowerCase() === cleanEmail && u.isActive);

  if (member && validPasswords.includes(cleanPass.toLowerCase())) {
    writeStorage(CRM_KEYS.AUTH_USER, member);
    return { success: true, user: member };
  }

  if (validPasswords.includes(cleanPass.toLowerCase()) && cleanEmail.includes('@')) {
    const fallbackUser: CrmUser = {
      id: 'crm-master',
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: cleanEmail.includes('venda') ? 'vendedor' : 'admin',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    writeStorage(CRM_KEYS.AUTH_USER, fallbackUser);
    return { success: true, user: fallbackUser };
  }

  return {
    success: false,
    error: 'Credenciais inválidas. Use um membro cadastrado da equipe CRM ou a senha mestre.',
  };
}

export function logoutStandaloneCrm(): void {
  localStorage.removeItem(CRM_KEYS.AUTH_USER);
}
