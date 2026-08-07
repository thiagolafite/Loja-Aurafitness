import { Product, BlogPost, Review, Coupon, Promotion, LookSet, StoreSettings, Order, CustomerProfile } from '../types';

export const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Conjunto Style Black',
    slug: 'conjunto-style-black',
    description: 'Conjunto Top + Legging de alta sustentação na cor preta.',
    fullDescription: 'O Conjunto Style Black é o favorito das nossas clientes. Confeccionado em malha premium com alta compressão, toque aveludado e zero transparência.',
    category: 'CONJUNTOS',
    price: 349.90,
    promotionalPrice: 289.90,
    sku: 'AUR-STY-BLK',
    barcode: '7891234560101',
    weight: 420,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/76bc2834c_CpiadeDSC_3103.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Preto', hex: '#111111' },
      { name: 'Verde Oliva', hex: '#2b5022' }
    ],
    materials: ['86% Poliamida', '14% Elastano'],
    stock: {
      'P-Preto': 15, 'M-Preto': 20, 'G-Preto': 12,
      'P-Verde Oliva': 10, 'M-Verde Oliva': 14
    },
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
    rating: 5.0,
    reviewCount: 48,
    seo: {
      title: 'Conjunto Style Black | Aura Fitness',
      description: 'Conjunto top e legging preto com compressão firme.',
      keywords: ['conjunto fitness', 'moda fitness']
    },
    createdAt: '2026-07-01T10:00:00Z'
  },
  {
    id: 'prod-2',
    name: 'Macaquinho Bless Black',
    slug: 'macaquinho-bless-black',
    description: 'Macaquinho esportivo anatômico com costas abertas.',
    fullDescription: 'O Macaquinho Bless Black combina liberdade de movimentos com design moderno e decote funcional nas costas.',
    category: 'MACAQUINHOS',
    price: 299.00,
    promotionalPrice: 249.90,
    sku: 'AUR-MAC-BLK',
    barcode: '7891234560102',
    weight: 320,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/f28126454_MacacoBless.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/5144dcde1_CpiadeDSC_3656.png'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Preto', hex: '#111111' }
    ],
    materials: ['88% Poliamida', '12% Elastano'],
    stock: {
      'P-Preto': 12, 'M-Preto': 18, 'G-Preto': 8
    },
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 35,
    seo: {
      title: 'Macaquinho Bless Black | Aura Fitness',
      description: 'Macaquinho esportivo preto para treino e pilates.',
      keywords: ['macaquinho fitness', 'macaquinho preto']
    },
    createdAt: '2026-07-02T11:00:00Z'
  },
  {
    id: 'prod-3',
    name: 'Conjunto Cinza Power',
    slug: 'conjunto-cinza-power',
    description: 'Conjunto modelador em tom cinza atemporal.',
    fullDescription: 'Confeccionado com elasticidade quadridirecional, o Conjunto Cinza Power proporciona um ajuste impecável que realça suas curvas.',
    category: 'CONJUNTOS',
    price: 399.00,
    promotionalPrice: 319.90,
    sku: 'AUR-CNJ-GRY',
    barcode: '7891234560103',
    weight: 450,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/72c2cce78_CpiadeDSC_3603.png'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Cinza Power', hex: '#778899' }
    ],
    materials: ['85% Poliamida', '15% Elastano'],
    stock: {
      'P-Cinza Power': 8, 'M-Cinza Power': 15, 'G-Cinza Power': 10
    },
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 29,
    seo: {
      title: 'Conjunto Cinza Power | Aura Fitness',
      description: 'Conjunto cinza de alta sustentação.',
      keywords: ['conjunto cinza', 'look treino']
    },
    createdAt: '2026-07-03T12:00:00Z'
  },
  {
    id: 'prod-4',
    name: 'Shorts Navy Power',
    slug: 'shorts-navy-power',
    description: 'Conjunto Shorts + Blusa ajustada em Azul Navy.',
    fullDescription: 'Projetado para treinos de alta performance, o Shorts Navy Power entrega respirabilidade e caimento anatômico.',
    category: 'SHORTS',
    price: 229.00,
    promotionalPrice: 189.90,
    sku: 'AUR-SHO-NVY',
    barcode: '7891234560104',
    weight: 280,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/64c91e414_Conjuntostyle.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/5144dcde1_CpiadeDSC_3656.png'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Azul Navy', hex: '#1B2A4A' }
    ],
    materials: ['87% Poliamida', '13% Elastano'],
    stock: {
      'P-Azul Navy': 14, 'M-Azul Navy': 22, 'G-Azul Navy': 9
    },
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
    rating: 4.9,
    reviewCount: 41,
    seo: {
      title: 'Shorts Navy Power | Aura Fitness',
      description: 'Conjunto shorts e top azul marinho.',
      keywords: ['shorts fitness', 'conjunto azul']
    },
    createdAt: '2026-07-04T14:00:00Z'
  },
  {
    id: 'prod-5',
    name: 'Top Cross Back Olive',
    slug: 'top-cross-back-olive',
    description: 'Top fitness verde oliva com alças cruzadas nas costas.',
    fullDescription: 'O Top Cross Back oferece média/alta sustentação para seus treinos diários com visual sofisticado.',
    category: 'TOPS',
    price: 159.90,
    promotionalPrice: 129.90,
    sku: 'AUR-TOP-OLV',
    barcode: '7891234560105',
    weight: 160,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/72c2cce78_CpiadeDSC_3603.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/76bc2834c_CpiadeDSC_3103.png'
    ],
    sizes: ['PP', 'P', 'M', 'G'],
    colors: [
      { name: 'Verde Oliva', hex: '#2b5022' }
    ],
    materials: ['90% Poliamida', '10% Elastano'],
    stock: {
      'P-Verde Oliva': 18, 'M-Verde Oliva': 25, 'G-Verde Oliva': 12
    },
    isFeatured: true,
    isNewArrival: false,
    isBestSeller: true,
    isActive: true,
    rating: 5.0,
    reviewCount: 52,
    seo: {
      title: 'Top Cross Back Olive | Aura Fitness',
      description: 'Top verde oliva com sustentação reforçada.',
      keywords: ['top fitness', 'top verde oliva']
    },
    createdAt: '2026-07-05T15:00:00Z'
  },
  {
    id: 'prod-6',
    name: 'Legging High Waist Nude',
    slug: 'legging-high-waist-nude',
    description: 'Legging cós alto modeladora em tom nude aveludado.',
    fullDescription: 'Legging de compressão nobre com toque macio e zero transparência.',
    category: 'LEGGINGS',
    price: 229.00,
    promotionalPrice: 189.90,
    sku: 'AUR-LEG-NUD',
    barcode: '7891234560106',
    weight: 290,
    brand: 'Aura Fitness',
    images: [
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/5144dcde1_CpiadeDSC_3656.png',
      'https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png'
    ],
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
    colors: [
      { name: 'Nude', hex: '#D2B48C' }
    ],
    materials: ['86% Poliamida', '14% Elastano'],
    stock: {
      'P-Nude': 11, 'M-Nude': 16, 'G-Nude': 7
    },
    isFeatured: true,
    isNewArrival: true,
    isBestSeller: true,
    isActive: true,
    rating: 4.8,
    reviewCount: 37,
    seo: {
      title: 'Legging High Waist Nude | Aura Fitness',
      description: 'Legging nude de alta sustentação.',
      keywords: ['legging nude', 'legging fitness']
    },
    createdAt: '2026-07-06T16:00:00Z'
  }
];

export const initialReviews: Review[] = [
  {
    id: 'rev-1',
    productId: 'prod-1',
    productName: 'Conjunto Style Black',
    productImage: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/76bc2834c_CpiadeDSC_3103.png',
    customerName: 'Camila Rodrigues',
    customerEmail: 'camila.r@gmail.com',
    rating: 5,
    title: 'Simplesmente perfeito!',
    comment: 'A qualidade do tecido é surreal. Fiz o teste do agachamento e zero transparência! O cós não enrola nem escorrega durante o treino de perna.',
    createdAt: '2026-07-12T14:30:00Z',
    status: 'approved',
    adminReply: 'Muito obrigado Camila! Ficamos felizes que amou nosso ajuste AuraFit! ✨'
  }
];

export const initialBlogPosts: BlogPost[] = [
  {
    id: 'post-1',
    title: 'Como Escolher a Legging Ideal para Seu Treino',
    slug: 'como-escolher-a-legging-ideal',
    summary: 'Entenda como a gramatura da malha e a elasticidade interferem na sua performance esportiva.',
    content: `
      <h2>A Importância da Compressão Certa</h2>
      <p>Na hora de escolher roupas de treino, a legging é a peça chave de qualquer composição.</p>
    `,
    category: 'Moda Fitness',
    author: {
      name: 'Equipe Aura Fitness',
      avatar: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/3f1e331bf_Logo_Aura_PDFpdf-removebg-preview.png'
    },
    imageUrl: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png',
    readTimeMinutes: 5,
    publishedAt: '2026-07-08T08:00:00Z',
    isPublished: true,
    seo: {
      title: 'Guia de Leggings | Aura Fitness Blog',
      description: 'Dicas essenciais para escolher a melhor legging sem transparência.'
    }
  }
];

export const initialCoupons: Coupon[] = [
  {
    id: 'coup-1',
    code: 'AURA10',
    discountType: 'percentage',
    value: 10,
    minSpend: 150,
    usedCount: 45,
    expiresAt: '2026-12-31T23:59:59Z',
    isActive: true
  }
];

export const initialPromotions: Promotion[] = [];

export const initialLookSets: LookSet[] = [];

export const initialStoreSettings: StoreSettings = {
  companyName: 'Aura Fitness Moda Esportiva',
  cnpj: '48.912.345/0001-99',
  phone: '(11) 99999-8888',
  whatsappNumber: '5511999998888',
  pixKey: 'aurafitnesswork@gmail.com',
  pixKeyType: 'E-mail',
  email: 'aurafitnesswork@gmail.com',
  address: 'São Paulo - SP',
  social: {
    instagram: 'https://www.instagram.com/adoro.aura/',
    facebook: 'https://facebook.com/adoro.aura',
    youtube: 'https://youtube.com',
    tiktok: 'https://tiktok.com/@adoro.aura'
  },
  logoUrl: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/3f1e331bf_Logo_Aura_PDFpdf-removebg-preview.png',
  bannerUrl: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/64c91e414_Conjuntostyle.png',
  shipping: {
    freeShippingThreshold: 299.00,
    defaultFlatRate: 19.90,
    enableCorreios: true,
    regions: [
      { id: 'reg-1', regionName: 'Sudeste (SP, RJ, MG, ES)', states: ['SP', 'RJ', 'MG', 'ES'], price: 14.90, deliveryDays: 2 },
      { id: 'reg-2', regionName: 'Sul & Demais Regiões', states: ['PR', 'SC', 'RS', 'DF', 'GO', 'MT', 'MS', 'BA', 'PE', 'CE'], price: 19.90, deliveryDays: 5 }
    ]
  },
  seo: {
    defaultTitle: 'Aura Fitness | Boutique de Moda Fitness Feminina',
    defaultDescription: 'Uma boutique de moda fitness feminina com peças exclusivas, unindo performance, conforto e elegância.'
  }
};

export const initialOrders: Order[] = [];
export const initialCustomers: CustomerProfile[] = [];
