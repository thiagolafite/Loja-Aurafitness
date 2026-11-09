/**
 * Classificador Inteligente de Produtos Aura Fitness
 * Analisa nomes, títulos e descrições para identificar automaticamente:
 * - Categoria (Leggings, Tops, Conjuntos, Shorts, Macacões, etc.)
 * - Cores e Códigos Hexadecimais
 * - Identificação de Conjuntos / Kits (Look Completo)
 */

export interface AvailableColor {
  name: string;
  hex: string;
  keywords: string[];
}

export interface AvailableCategory {
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description: string;
  keywords: string[];
}

export const STORE_COLORS: AvailableColor[] = [
  { name: 'Preto', hex: '#111111', keywords: ['preto', 'preta', 'black', 'noir', 'onix', 'ônix', 'dark', 'grafite escuro'] },
  { name: 'Branco', hex: '#FFFFFF', keywords: ['branco', 'branca', 'white', 'off-white', 'off white', 'offwhite', 'gelo', 'neve'] },
  { name: 'Verde Oliva', hex: '#5F6F3A', keywords: ['oliva', 'militar', 'verde militar', 'verde oliva', 'olive', 'army', 'musgo', 'safari'] },
  { name: 'Verde Esmeralda', hex: '#1E5E3A', keywords: ['verde', 'green', 'esmeralda', 'menta', 'sage', 'folha', 'pistache', 'abacate'] },
  { name: 'Azul Marinho', hex: '#1B2A4A', keywords: ['marinho', 'navy', 'azul escuro', 'midnight', 'oceano', 'deep blue'] },
  { name: 'Azul Celeste', hex: '#5A9BD5', keywords: ['celeste', 'baby blue', 'indigo', 'índigo', 'royal', 'turquesa', 'azul claro', 'azul'] },
  { name: 'Rosa Claro', hex: '#F4B6C2', keywords: ['rosa claro', 'baby pink', 'blush', 'rosa bebe', 'rosa bebê', 'rosê', 'rose', 'quartz'] },
  { name: 'Pink / Fúcsia', hex: '#E0218A', keywords: ['pink', 'fucsia', 'fúcsia', 'magenta', 'rosa choque', 'neon pink'] },
  { name: 'Vinho / Marsala', hex: '#5B1425', keywords: ['vinho', 'marsala', 'bordo', 'bordô', 'burgundy', 'cereja', 'amora'] },
  { name: 'Lilás / Lavanda', hex: '#9D81BA', keywords: ['lilas', 'lilás', 'lavanda', 'roxo', 'purple', 'violeta', 'amestista'] },
  { name: 'Terracota / Telha', hex: '#C86D51', keywords: ['terracota', 'telha', 'caramelo', 'argila', 'rust', 'cobre', 'canela'] },
  { name: 'Cinza Mescla', hex: '#71797E', keywords: ['cinza', 'mescla', 'grafite', 'gray', 'grey', 'chumbo', 'prata', 'silver'] },
  { name: 'Nude / Bege', hex: '#D2B48C', keywords: ['nude', 'bege', 'areia', 'sand', 'creme', 'cacau', 'pele', 'marfim'] },
  { name: 'Vermelho', hex: '#C41E3A', keywords: ['vermelho', 'vermelha', 'red', 'escarlate', 'rubi', 'carmim'] },
  { name: 'Amarelo / Mostarda', hex: '#E5A93C', keywords: ['amarelo', 'mostarda', 'yellow', 'ouro', 'dourado', 'solar'] },
  { name: 'Marrom / Chocolate', hex: '#4A2E1B', keywords: ['marrom', 'chocolate', 'brown', 'cafe', 'café', 'avelã'] },
];

export const STORE_CATEGORIES: AvailableCategory[] = [
  {
    name: 'Conjuntos',
    slug: 'conjuntos',
    icon: '👗',
    image: '/images/look-3103.png',
    description: 'Looks completos de top e legging/short com alta sustentação e modelagem impecável.',
    keywords: [
      'conjunto', 'conjuntos', 'kit', 'combo', 'duo',
      'top + legging', 'top+legging', 'top e legging',
      'short + top', 'short+top', 'short e top',
      'cropped + legging', 'dueto', 'look completo', 'par'
    ],
  },
  {
    name: 'Macacões',
    slug: 'macacoes',
    icon: '🩱',
    image: '/images/macaco-bless.png',
    description: 'Macaquinhos e macacões anatômicos com costas abertas e efeito modelador.',
    keywords: [
      'macacao', 'macacão', 'macaquinho', 'macaquinhos', 'jumpsuit',
      'body', 'bodies', 'catsuit', 'one piece', 'maiô'
    ],
  },
  {
    name: 'Leggings',
    slug: 'leggings',
    icon: '👖',
    image: '/images/look-3656.png',
    description: 'Cós alto anatômico, compressão firme, zero transparência e toque aveludado.',
    keywords: [
      'legging', 'leggings', 'leging', 'calca', 'calça',
      'corsario', 'corsário', 'fusô', 'fuso', 'boca de sino', 'flare',
      'pant', 'pants', 'tights', 'montaria'
    ],
  },
  {
    name: 'Tops',
    slug: 'tops',
    icon: '👚',
    image: '/images/look-3603.png',
    description: 'Tops esportivos e croppeds com alças reforçadas e sustentação perfeita.',
    keywords: [
      'top', 'tops', 'sutia', 'sutiã', 'cropped', 'bra',
      'sports bra', 'sustentacao', 'sustentação', 'nadador',
      'alça cruzada', 'decote', 'tomara que caia'
    ],
  },
  {
    name: 'Shorts & Bermudas',
    slug: 'shorts-bermudas',
    icon: '🩳',
    image: '/images/look-3214.png',
    description: 'Shorts duplos anti-assadura, bermudas ciclistas e modelos de alta mobilidade.',
    keywords: [
      'short', 'shorts', 'bermuda', 'bermudas', 'ciclista',
      'shortinho', 'duplo', 'saia short', 'saia-short', 'biker'
    ],
  },
  {
    name: 'Regatas & Camisetas',
    slug: 'regatas-camisetas',
    icon: '👕',
    image: 'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&w=800&q=80',
    description: 'Tecidos dry-fit ultra leves, frescos e com respirabilidade avançada.',
    keywords: [
      'regata', 'regatas', 'camiseta', 'camisetas', 't-shirt',
      'tshirt', 'blusa', 't-shirts', 'baby look', 'manga curta',
      'manga longa', 'dry fit', 'sobreposição'
    ],
  },
  {
    name: 'Jaquetas',
    slug: 'jaquetas',
    icon: '🧥',
    image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=800&q=80',
    description: 'Corta-vento, agasalhos esportivos e jaquetas térmicas para pré e pós treino.',
    keywords: [
      'jaqueta', 'jaquetas', 'corta-vento', 'corta vento',
      'moletom', 'casaco', 'windbreaker', 'bomber', 'agasalho', 'anorak'
    ],
  },
  {
    name: 'Acessórios',
    slug: 'acessorios',
    icon: '🎒',
    image: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=800&q=80',
    description: 'Meias esportivas, garrafas, faixas de cabelo e acessórios para seu treino.',
    keywords: [
      'meia', 'meias', 'faixa', 'garrafa', 'squeeze',
      'bolsa', 'mochila', 'tapete', 'mat', 'elastico',
      'elástico', 'strap', 'boné', 'viseira', 'caneleira', 'presilha'
    ],
  },
];

/**
 * Obtém a foto da categoria configurada pelo administrador,
 * com fallback para a primeira foto de produto daquela categoria,
 * ou a imagem padrão editorial da categoria.
 */
export function getCategoryPhoto(
  categoryName: string,
  productsList: { category?: string; images?: string[] }[] = []
): string {
  const norm = normalizeCategoryName(categoryName);
  const catDef = getStoredCategories().find((c) => normalizeCategoryName(c.name) === norm);

  // 1. Imagem configurada pelo administrador especificamente para a categoria
  if (catDef?.image && typeof catDef.image === 'string' && catDef.image.trim()) {
    return catDef.image;
  }

  // 2. Fallback: Procura produto real nessa categoria com imagem válida
  if (Array.isArray(productsList) && productsList.length > 0) {
    const productWithImg = productsList.find((p) => {
      const matchCat = normalizeCategoryName(p.category) === norm;
      const hasImg = Array.isArray(p.images) && p.images.length > 0 && Boolean(p.images[0]);
      return matchCat && hasImg;
    });

    if (productWithImg?.images?.[0]) {
      return productWithImg.images[0];
    }
  }

  return '/images/look-3103.png';
}

/**
 * Normaliza qualquer nome de categoria para a categoria canônica oficial
 */
export function normalizeCategoryName(rawCategory?: string): string {
  if (!rawCategory) return '';
  const norm = rawCategory
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (norm.includes('conjunto')) return 'Conjuntos';
  if (norm.includes('macac') || norm.includes('macaquinh')) return 'Macacões';
  if (norm.includes('legging') || norm.includes('calca')) return 'Leggings';
  if (norm.includes('top') || norm.includes('sutia') || norm.includes('cropped')) return 'Tops';
  if (norm.includes('short') || norm.includes('bermuda')) return 'Shorts & Bermudas';
  if (norm.includes('regata') || norm.includes('camiseta') || norm.includes('t-shirt') || norm.includes('blusa')) return 'Regatas & Camisetas';
  if (norm.includes('jaqueta') || norm.includes('casaco') || norm.includes('corta')) return 'Jaquetas';
  if (norm.includes('acessorio') || norm.includes('meia')) return 'Acessórios';

  const allCategories = getStoredCategories();
  const exact = allCategories.find((c) => c.name.toLowerCase() === rawCategory.toLowerCase());
  if (exact) return exact.name;

  return rawCategory;
}

const CATEGORIES_STORAGE_KEY = 'aura_store_categories_v1';
const DELETED_CATEGORIES_KEY = 'aura_deleted_categories_v1';

export function getDeletedCategories(): string[] {
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(DELETED_CATEGORIES_KEY);
      return raw ? JSON.parse(raw) : [];
    }
  } catch {}
  return [];
}

/**
 * Obtém a lista dinâmica de categorias da loja salvas pelo administrador
 */
export function getStoredCategories(): AvailableCategory[] {
  let categories: AvailableCategory[] = [];
  let hasStoredValue = false;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(CATEGORIES_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        categories = parsed;
        hasStoredValue = true;
      }
    }
  } catch (e) {
    console.error('Error reading categories from localStorage:', e);
  }

  if (!hasStoredValue) {
    categories = [...STORE_CATEGORIES];
  }

  const deletedList = getDeletedCategories().map((d) => d.toLowerCase());
  categories = categories.filter((c) => !deletedList.includes(c.name.toLowerCase()));

  // Auto-descoberta: se existirem produtos com categorias que ainda não estão na lista, inclui dinamicamente
  try {
    const rawProducts = typeof window !== 'undefined' ? localStorage.getItem('aura_products_v1') : null;
    if (rawProducts) {
      const parsedProds = JSON.parse(rawProducts);
      if (Array.isArray(parsedProds)) {
        parsedProds.forEach((p: { category?: string }) => {
          if (p.category && typeof p.category === 'string' && p.category.trim()) {
            const catName = p.category.trim();
            const isDeleted = deletedList.includes(catName.toLowerCase());
            const alreadyExists = categories.some(
              (c) => c.name.toLowerCase() === catName.toLowerCase()
            );
            if (!alreadyExists && !isDeleted) {
              categories.push({
                name: catName,
                slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                icon: '🏷️',
                description: `Peças exclusivas da categoria ${catName}.`,
                keywords: [catName.toLowerCase()],
              });
            }
          }
        });
      }
    }
  } catch {
    // fallback seguro
  }

  return categories;
}

/**
 * Salva a lista dinâmica de categorias da loja
 */
export function saveStoredCategories(categories: AvailableCategory[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent('aura_categories_updated', { detail: categories }));
    }
  } catch (e) {
    console.error('Error saving categories to localStorage:', e);
  }
}

/**
 * Exclui uma categoria da loja de forma definitiva e notifica toda a loja
 */
export function deleteStoredCategory(categoryName: string, reassignProductsTo?: string): AvailableCategory[] {
  const norm = categoryName.trim().toLowerCase();
  const current = getStoredCategories();
  const updated = current.filter((c) => c.name.toLowerCase() !== norm);

  // Salva na lista de categorias excluídas para não ser ressuscitada por auto-discovery
  try {
    if (typeof window !== 'undefined') {
      const deletedList = getDeletedCategories();
      if (!deletedList.some((d) => d.toLowerCase() === norm)) {
        deletedList.push(categoryName.trim());
        localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedList));
      }
    }
  } catch {}

  saveStoredCategories(updated);

  // Se solicitado, reatribui os produtos dessa categoria para outra categoria segura
  if (reassignProductsTo && typeof window !== 'undefined') {
    try {
      const rawProducts = localStorage.getItem('aura_products_v1');
      if (rawProducts) {
        const prods = JSON.parse(rawProducts);
        if (Array.isArray(prods)) {
          const remapped = prods.map((p) => {
            if ((p.category || '').toLowerCase() === norm) {
              return { ...p, category: reassignProductsTo };
            }
            return p;
          });
          localStorage.setItem('aura_products_v1', JSON.stringify(remapped));
          window.dispatchEvent(new CustomEvent('aura_products_updated'));
        }
      }
    } catch {}
  }

  return updated;
}

/**
 * Adiciona uma nova categoria e notifica toda a loja em tempo real
 */
export function saveNewCategory(name: string): AvailableCategory[] {
  const current = getStoredCategories();
  const trimmed = name.trim();
  if (!trimmed) return current;

  // Se estava na lista de deletadas, remove da lista de deletadas
  try {
    if (typeof window !== 'undefined') {
      const deletedList = getDeletedCategories().filter(
        (d) => d.toLowerCase() !== trimmed.toLowerCase()
      );
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedList));
    }
  } catch {}

  const exists = current.some((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const newCat: AvailableCategory = {
      name: trimmed,
      slug: trimmed
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
      icon: '🏷️',
      description: `Peças e modelos exclusivos da coleção ${trimmed}.`,
      keywords: [trimmed.toLowerCase()],
    };
    const updated = [...current, newCat];
    saveStoredCategories(updated);
    return updated;
  }
  return current;
}

/**
 * Atualiza a foto de capa de uma categoria específica e notifica toda a loja em tempo real
 */
export function updateCategoryPhoto(categoryName: string, imageUrl: string): AvailableCategory[] {
  const current = getStoredCategories();
  const norm = normalizeCategoryName(categoryName);
  const updated = current.map((cat) => {
    if (normalizeCategoryName(cat.name) === norm) {
      return { ...cat, image: imageUrl };
    }
    return cat;
  });
  saveStoredCategories(updated);
  return updated;
}

/**
 * Restaura a foto padrão original de uma categoria específica
 */
export function resetCategoryPhoto(categoryName: string): AvailableCategory[] {
  const current = getStoredCategories();
  const norm = normalizeCategoryName(categoryName);
  const defaultDef = STORE_CATEGORIES.find((c) => normalizeCategoryName(c.name) === norm);
  const updated = current.map((cat) => {
    if (normalizeCategoryName(cat.name) === norm) {
      return { ...cat, image: defaultDef?.image || '/images/look-3103.png' };
    }
    return cat;
  });
  saveStoredCategories(updated);
  return updated;
}

export interface ProductClassification {
  category: string;
  isSet: boolean;
  colors: { name: string; hex: string }[];
  detectedTags: string[];
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 */
function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Analisa o nome e descrição do produto para extrair categoria, se é conjunto e cores
 */
export function classifyProduct(name: string, description?: string): ProductClassification {
  const fullText = normalizeText(`${name} ${description || ''}`);
  const detectedTags: string[] = [];

  // 1. Detectar se é Conjunto
  const isSetKeywords = [
    'conjunto', 'conjuntos', 'kit', 'combo', 'duo',
    'top + legging', 'top+legging', 'top e legging',
    'short + top', 'short+top', 'short e top',
    'cropped + legging', 'look completo', 'dueto'
  ];
  const isSet = isSetKeywords.some((kw) => fullText.includes(kw));
  if (isSet) {
    detectedTags.push('Conjunto');
  }

  // 2. Detectar Categoria
  let detectedCategory = isSet ? 'Conjuntos' : 'Leggings';
  let highestScore = 0;

  const currentCategories = getStoredCategories();
  for (const cat of currentCategories) {
    let score = 0;
    const kws = Array.isArray(cat.keywords) && cat.keywords.length > 0 ? cat.keywords : [cat.name.toLowerCase()];
    for (const kw of kws) {
      if (fullText.includes(kw)) {
        // Se a palavra exata estiver no nome, pontua mais alto
        const inName = normalizeText(name).includes(kw);
        score += inName ? 3 : 1;
      }
    }

    // Se detectou conjunto e a categoria for Conjuntos, prioriza
    if (cat.name === 'Conjuntos' && isSet) {
      score += 5;
    }

    if (score > highestScore) {
      highestScore = score;
      detectedCategory = cat.name;
    }
  }

  // 3. Detectar Cores
  const detectedColors: { name: string; hex: string }[] = [];
  const addedColorNames = new Set<string>();

  for (const color of STORE_COLORS) {
    for (const kw of color.keywords) {
      // Regex para encontrar palavra inteira ou composta
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(fullText) || fullText.includes(kw)) {
        if (!addedColorNames.has(color.name)) {
          addedColorNames.add(color.name);
          detectedColors.push({ name: color.name, hex: color.hex });
          detectedTags.push(`Cor: ${color.name}`);
        }
        break;
      }
    }
  }

  // Se nenhuma cor foi detectada, define Preto como padrão clássico Aura
  if (detectedColors.length === 0) {
    detectedColors.push({ name: 'Preto', hex: '#111111' });
  }

  return {
    category: detectedCategory,
    isSet,
    colors: detectedColors,
    detectedTags,
  };
}

export interface ParsedItemInfo {
  productName: string;
  category: string;
  price: number;
  size?: string;
  colors: { name: string; hex: string }[];
  isSet: boolean;
  groupKey: string;
  tags: string[];
}

/**
 * Detecta se o nome do arquivo é genérico (câmera, WhatsApp, print, timestamp)
 */
export function isGenericFileName(name: string): boolean {
  const norm = normalizeText(name);
  return (
    norm.startsWith('whatsapp') ||
    norm.startsWith('image') ||
    norm.startsWith('img') ||
    norm.startsWith('dsc') ||
    norm.startsWith('photo') ||
    norm.startsWith('foto') ||
    norm.startsWith('screenshot') ||
    norm.startsWith('captura') ||
    norm.startsWith('capture') ||
    norm.startsWith('pasted') ||
    /^\d+$/.test(norm.replace(/[-_\s]/g, '')) ||
    norm.length <= 4
  );
}

/**
 * Analisa o caminho da pasta e nome do arquivo para extrair:
 * - Nome real do produto
 * - Categoria oficial Aura
 * - Preço (ex: 183,00)
 * - Tamanho (ex: P, M, G, GG)
 * - Cores
 * - Chave de agrupamento única para reunir fotos do mesmo produto
 */
export function parseProductFromFolderOrFile(
  relPath: string,
  fileName: string,
  defaultCategory = 'Leggings'
): ParsedItemInfo {
  // Normalizar barras do caminho (Windows ou POSIX)
  const parts = (relPath || fileName).split(/[\\/]/).filter(Boolean);
  const cleanFileName = fileName.replace(/\.[^/.]+$/, '').trim();

  // Pasta pai se existir
  const folderCandidate = parts.length > 1 ? parts[parts.length - 2].trim() : '';
  const genericFolderIgnore = ['fotos', 'imagens', 'upload', 'produtos', 'aura', 'photos', 'images', 'downloads'];
  const hasValidFolder = !!folderCandidate && !genericFolderIgnore.includes(normalizeText(folderCandidate));

  let candidateName = cleanFileName;
  let rawTextForExtraction = cleanFileName;

  const isCatFolder = hasValidFolder && getStoredCategories().some(
    (c) => normalizeText(c.name) === normalizeText(folderCandidate)
  );

  if (hasValidFolder) {
    if (!isGenericFileName(cleanFileName)) {
      // O arquivo possui nome próprio e específico de produto
      candidateName = cleanFileName;
      rawTextForExtraction = `${folderCandidate} ${cleanFileName}`;
    } else {
      // O arquivo possui nome genérico (WhatsApp, IMG, etc.), então a pasta define o produto
      candidateName = folderCandidate;
      rawTextForExtraction = folderCandidate;
    }
  }

  // 1. Extração de Preço (ex: "183,00", "183.00", "R$ 183", "183")
  let price = 189.9;
  const priceMatch = rawTextForExtraction.match(/(?:r\$\s*)?(\d{2,4})(?:[,\.](\d{2}))?\b/i);
  if (priceMatch) {
    const integerPart = priceMatch[1];
    const decimalPart = priceMatch[2] || '00';
    const parsedVal = parseFloat(`${integerPart}.${decimalPart}`);
    if (!isNaN(parsedVal) && parsedVal > 10) {
      price = parsedVal;
    }
  }

  // 2. Extração de Tamanho (ex: "PP", "P", "M", "G", "GG", "XG")
  let size: string | undefined = undefined;
  const sizeMatch = rawTextForExtraction.match(/\b(PP|P|M|G|GG|XG|XGG)\b/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
  }

  // 3. Limpeza do Nome do Produto
  let cleanName = candidateName;
  // Remove valor monetário
  cleanName = cleanName.replace(/(?:r\$\s*)?(\d{2,4})(?:[,\.](\d{2}))?\b/gi, '');
  // Remove tamanho isolado (ex: " G ", " - G - ")
  cleanName = cleanName.replace(/\b(PP|P|M|G|GG|XG|XGG)\b/gi, '');
  // Remove símbolos, hifens e pontuação sobressalente
  cleanName = cleanName.replace(/[-_–—,:]+/g, ' ').replace(/\s+/g, ' ').trim();

  // Se após a limpeza o nome ficou vazio ou genérico, tenta recuperar
  if (!cleanName || isGenericFileName(cleanName)) {
    if (hasValidFolder && !isCatFolder) {
      cleanName = folderCandidate.replace(/[-_–—,:]+/g, ' ').replace(/\s+/g, ' ').trim();
    } else {
      cleanName = `Produto ${cleanFileName}`;
    }
  }

  // Capitalização suave
  cleanName = cleanName
    .split(' ')
    .filter(Boolean)
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase()))
    .join(' ');

  // 4. Classificação de Categoria, Cores e Conjunto pela IA
  const classification = classifyProduct(
    `${cleanName} ${hasValidFolder ? folderCandidate : ''}`,
    rawTextForExtraction
  );

  // 5. Categoria final
  let finalCategory = classification.category;
  if (hasValidFolder) {
    const matchingCat = getStoredCategories().find(
      (c) => normalizeText(c.name) === normalizeText(folderCandidate)
    );
    if (matchingCat) {
      finalCategory = matchingCat.name;
    }
  }
  if (!finalCategory) {
    finalCategory = defaultCategory;
  }

  // 6. Chave de Agrupamento Única (reúne fotos numeradas como 'Top 1.jpg', 'Top 2.jpg' no mesmo produto)
  const cleanNameForGroup = cleanName.replace(/[\s\-_]+(?:foto|img|imagem)?\s*\(?\d{1,2}\)?$/i, '').trim();
  const groupKey = normalizeText(cleanNameForGroup || cleanName);

  return {
    productName: cleanName,
    category: finalCategory,
    price,
    size,
    colors: classification.colors,
    isSet: classification.isSet,
    groupKey,
    tags: classification.detectedTags,
  };
}

/**
 * Redimensiona e comprime imagens client-side usando Canvas
 * Reduz fotos de 10MB para ~120KB sem perda perceptível de qualidade
 */
export async function resizeImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      const dataUrl = (e.target?.result as string) || '';
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

