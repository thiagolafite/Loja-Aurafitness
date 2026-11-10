/**
 * Classificador Inteligente de Produtos Aura Fitness
 * Analisa nomes, títulos e descrições para identificar automaticamente:
 * - Categoria (Leggings, Tops, Conjuntos, Shorts, Macacões, etc.)
 * - Cores e Códigos Hexadecimais
 * - Identificação de Conjuntos / Kits (Look Completo)
 */

import { Product } from '../types';

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
  { name: 'Verde Oliva', hex: '#5F6F3A', keywords: ['verde oliva', 'verde militar', 'oliva', 'militar', 'olive', 'army', 'musgo', 'safari'] },
  { name: 'Verde Esmeralda', hex: '#1E5E3A', keywords: ['verde esmeralda', 'verde', 'green', 'esmeralda', 'menta', 'sage', 'folha', 'pistache', 'abacate'] },
  { name: 'Azul Marinho', hex: '#1B2A4A', keywords: ['azul marinho', 'marinho', 'navy', 'azul escuro', 'midnight', 'oceano', 'deep blue'] },
  { name: 'Azul Celeste', hex: '#5A9BD5', keywords: ['azul celeste', 'azul claro', 'celeste', 'baby blue', 'indigo', 'índigo', 'royal', 'turquesa', 'azul'] },
  { name: 'Rosa Claro', hex: '#F4B6C2', keywords: ['rosa claro', 'baby pink', 'blush', 'rosa bebe', 'rosa bebê', 'rosê', 'rose', 'quartz', 'quartzo'] },
  { name: 'Pink / Fúcsia', hex: '#E0218A', keywords: ['pink', 'fucsia', 'fúcsia', 'fuchsia', 'magenta', 'rosa choque', 'neon pink', 'rosa'] },
  { name: 'Vinho / Marsala', hex: '#5B1425', keywords: ['vinho', 'marsala', 'bordo', 'bordô', 'burgundy', 'cereja', 'amora', 'rubi'] },
  { name: 'Lilás / Lavanda', hex: '#9D81BA', keywords: ['lilas', 'lilás', 'lavanda', 'roxo', 'roxa', 'purple', 'violeta', 'ametista'] },
  { name: 'Terracota / Telha', hex: '#C86D51', keywords: ['terracota', 'telha', 'caramelo', 'argila', 'rust', 'cobre', 'canela'] },
  { name: 'Cinza Mescla', hex: '#71797E', keywords: ['cinza mescla', 'cinza', 'mescla', 'grafite', 'gray', 'grey', 'chumbo', 'prata', 'silver'] },
  { name: 'Nude / Bege', hex: '#D2B48C', keywords: ['nude', 'bege', 'areia', 'sand', 'creme', 'cacau', 'pele', 'marfim'] },
  { name: 'Vermelho', hex: '#C41E3A', keywords: ['vermelho', 'vermelha', 'red', 'escarlate', 'carmim'] },
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
    name: 'Macacão',
    slug: 'macacao',
    icon: '🩱',
    image: '/images/macaco-bless.png',
    description: 'Macacões longos anatômicos com costas abertas e efeito modelador.',
    keywords: [
      'macacao', 'macacão', 'macacoes', 'macacões', 'jumpsuit',
      'catsuit', 'one piece'
    ],
  },
  {
    name: 'Macaquinho',
    slug: 'macaquinho',
    icon: '🩱',
    image: '/images/macaco-bless.png',
    description: 'Macaquinhos curtos esportivos com alta sustentação e liberdade de movimentos.',
    keywords: [
      'macaquinho', 'macaquinhos', 'romper', 'short jumpsuit'
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
 * Verifica se dois nomes de categoria representam a mesma categoria lógica/canônica
 * (ex: "Macaquinho" <-> "Macacões", "Conjunto" <-> "Conjuntos", "Top" <-> "Tops")
 */
export function areCategoriesEquivalent(catA?: string, catB?: string): boolean {
  if (!catA || !catB) return false;
  const a = catA
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const b = catB
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (!a || !b) return false;
  if (a === b) return true;

  // Variações de singular/plural diretas
  const stripPlural = (s: string) => s.replace(/oes$/, 'ao').replace(/es$/, '').replace(/s$/, '');
  if (stripPlural(a) === stripPlural(b)) return true;

  // Grupos de equivalência canônica de moda fitness (Macacão e Macaquinho são categorias DISTINTAS!)
  const isMacacao = (s: string) =>
    (s.includes('macac') && !s.includes('macaquinh')) || s === 'jumpsuit';
  if (isMacacao(a) && isMacacao(b)) return true;

  const isMacaquinho = (s: string) => s.includes('macaquinh');
  if (isMacaquinho(a) && isMacaquinho(b)) return true;

  const isConjunto = (s: string) => s.includes('conjunt');
  if (isConjunto(a) && isConjunto(b)) return true;

  const isLegging = (s: string) => s.includes('legging') || s.includes('leging') || s.includes('calca');
  if (isLegging(a) && isLegging(b)) return true;

  const isTop = (s: string) => s === 'top' || s === 'tops' || s.includes('cropped');
  if (isTop(a) && isTop(b)) return true;

  const isShort = (s: string) => s.includes('short') || s.includes('bermuda');
  if (isShort(a) && isShort(b)) return true;

  const isRegata = (s: string) => s.includes('regata') || s.includes('camiseta') || s.includes('blusa');
  if (isRegata(a) && isRegata(b)) return true;

  const isJaqueta = (s: string) => s.includes('jaqueta') || s.includes('casaco') || s.includes('corta');
  if (isJaqueta(a) && isJaqueta(b)) return true;

  const isAcessorio = (s: string) => s.includes('acessorio') || s.includes('meia');
  if (isAcessorio(a) && isAcessorio(b)) return true;

  return false;
}

/**
 * Extrai a categoria canônica real a partir exclusivamente do nome da peça (quando explícito no título)
 */
export function getCanonicalGarmentCategoryFromName(name?: string): string | null {
  if (!name || !name.trim()) return null;
  const norm = name
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (/\b(macaquinh\w*)\b/.test(norm)) {
    return 'Macaquinho';
  }
  if (/\b(macacao|macacoes|jumpsuit|catsuit)\b/.test(norm)) {
    return 'Macacão';
  }
  if (
    /\b(conjunt\w*|kit|combo|look completo)\b/.test(norm) ||
    norm.includes('top + legging') ||
    norm.includes('top e legging') ||
    norm.includes('short + top') ||
    norm.includes('short e top')
  ) {
    return 'Conjuntos';
  }
  if (/\b(top|tops|cropped\w*|sutia)\b/.test(norm)) {
    return 'Tops';
  }
  if (/\b(short\w*|bermuda\w*|ciclista|biker)\b/.test(norm)) {
    return 'Shorts & Bermudas';
  }
  if (/\b(legging\w*|leging\w*|calca\w*|corsario\w*|flare)\b/.test(norm)) {
    return 'Leggings';
  }
  if (/\b(regata\w*|camiseta\w*|t-shirt\w*|tshirt\w*|blusa\w*)\b/.test(norm)) {
    return 'Regatas & Camisetas';
  }
  if (/\b(jaqueta\w*|casaco\w*|moletom|corta-vento|corta vento)\b/.test(norm)) {
    return 'Jaquetas';
  }
  if (/\b(meia\w*|garrafa\w*|squeeze|mochila\w*|bolsa\w*|faixa\w*|bone|viseira)\b/.test(norm)) {
    return 'Acessórios';
  }
  return null;
}

/**
 * Resolve um nome de categoria individual para o nome canônico exato da loja (1 para 1),
 * corrigindo automaticamente sinônimos ("Macaquinho" / "MACAQUINHOS" -> "Macacões")
 * e produtos de Macaquinho que foram importados com o fallback antigo "Conjuntos".
 */
export function resolveSingleCategoryName(rawCategory?: string, productName?: string): string {
  const trimmed = (rawCategory || '').trim();
  if (trimmed.toLowerCase() === 'sem categoria') {
    return 'Sem Categoria';
  }

  const norm = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Só usa productName para inferir quando productName é passado explicitamente (migração inicial ou categoria vazia)
  if (productName) {
    const nameGarment = getCanonicalGarmentCategoryFromName(productName);
    if (
      nameGarment === 'Macaquinho' &&
      (!trimmed ||
        norm === 'conjuntos' ||
        norm === 'leggings' ||
        norm === 'macacao' ||
        norm === 'macacoes')
    ) {
      return 'Macaquinho';
    }
    if (
      nameGarment === 'Macacão' &&
      (!trimmed ||
        norm === 'conjuntos' ||
        norm === 'leggings' ||
        norm === 'macaquinho' ||
        norm === 'macaquinhos')
    ) {
      return 'Macacão';
    }
    if (!trimmed && nameGarment) {
      return nameGarment;
    }
  }

  if (!trimmed) {
    return 'Conjuntos';
  }

  if (norm === 'macaquinho' || norm === 'macaquinhos') {
    return 'Macaquinho';
  }
  if (norm === 'macacao' || norm === 'macacoes') {
    return 'Macacão';
  }
  if (norm === 'conjunto' || norm === 'conjuntos') {
    return 'Conjuntos';
  }
  if (norm === 'top' || norm === 'tops') {
    return 'Tops';
  }
  if (norm === 'short' || norm === 'shorts' || norm === 'shorts & bermudas') {
    return 'Shorts & Bermudas';
  }
  if (norm === 'legging' || norm === 'leggings') {
    return 'Leggings';
  }
  if (norm === 'jaqueta' || norm === 'jaquetas') {
    return 'Jaquetas';
  }
  if (norm === 'acessorio' || norm === 'acessorios') {
    return 'Acessórios';
  }

  return trimmed;
}

/**
 * Retorna a lista exata de categorias às quais o produto pertence.
 * Por padrão cada produto pertence a 1 única categoria (product.category).
 * Só pertence a mais de uma se o administrador tiver confirmado explicitamente (product.additionalCategories).
 */
export function getProductCategories(product: {
  name?: string;
  category?: string;
  additionalCategories?: string[];
}): string[] {
  const list: string[] = [];
  const rawPrimary = (product.category || '').trim();
  if (rawPrimary && rawPrimary.toLowerCase() !== 'sem categoria') {
    const primary = resolveSingleCategoryName(rawPrimary);
    if (primary && primary.toLowerCase() !== 'sem categoria') {
      list.push(primary);
    }
  }
  if (Array.isArray(product.additionalCategories)) {
    product.additionalCategories.forEach((c) => {
      const resolved = resolveSingleCategoryName(c);
      if (
        resolved &&
        resolved.toLowerCase() !== 'sem categoria' &&
        !list.some((existing) => existing.toLowerCase() === resolved.toLowerCase())
      ) {
        list.push(resolved);
      }
    });
  }
  return list;
}

/**
 * Remove um produto APENAS da categoria informada, preservando-o nas demais categorias
 * (ou marcando-o como 'Sem Categoria' caso estivesse apenas nela, sem apagar o produto do catálogo geral).
 */
export function removeProductFromCategory<
  T extends { name?: string; category?: string; additionalCategories?: string[] }
>(
  product: T,
  categoryToRemove: string
): { updatedProduct: T; remainingCategories: string[] } {
  const targetRaw = categoryToRemove.trim().toLowerCase();
  const targetResolved = resolveSingleCategoryName(categoryToRemove).trim().toLowerCase();
  const currentCats = getProductCategories(product);

  const remaining = currentCats.filter((c) => {
    const cRaw = c.trim().toLowerCase();
    const cResolved = resolveSingleCategoryName(c).trim().toLowerCase();
    return (
      cRaw !== targetRaw &&
      cResolved !== targetResolved &&
      !areCategoriesEquivalent(c, categoryToRemove)
    );
  });

  const newPrimary = remaining[0] || 'Sem Categoria';
  const newAdditional = remaining.slice(1);

  return {
    updatedProduct: {
      ...product,
      category: newPrimary,
      additionalCategories: newAdditional,
    },
    remainingCategories: remaining,
  };
}

/**
 * Atribui um produto a uma categoria:
 * - mode === 'move': move o produto para targetCategory (removendo da categoria anterior)
 * - mode === 'add-both': mantém na(s) categoria(s) atual(is) e adiciona também em targetCategory
 */
export function assignProductToCategory<
  T extends { name?: string; category?: string; additionalCategories?: string[] }
>(
  product: T,
  targetCategory: string,
  mode: 'move' | 'add-both',
  sourceCategory?: string
): T {
  const trimmedTarget = targetCategory.trim();
  const resolvedTarget = resolveSingleCategoryName(trimmedTarget).trim().toLowerCase();
  const currentCats = getProductCategories(product);

  if (mode === 'move') {
    if (sourceCategory) {
      const sourceRaw = sourceCategory.trim().toLowerCase();
      const sourceResolved = resolveSingleCategoryName(sourceCategory).trim().toLowerCase();
      const filtered = currentCats.filter((c) => {
        const cRaw = c.trim().toLowerCase();
        const cResolved = resolveSingleCategoryName(c).trim().toLowerCase();
        return (
          cRaw !== sourceRaw &&
          cResolved !== sourceResolved &&
          !areCategoriesEquivalent(c, sourceCategory) &&
          cRaw !== trimmedTarget.toLowerCase() &&
          cResolved !== resolvedTarget &&
          !areCategoriesEquivalent(c, trimmedTarget)
        );
      });
      const nextCats = [trimmedTarget, ...filtered];
      return {
        ...product,
        category: nextCats[0],
        additionalCategories: nextCats.slice(1),
      };
    }
    return {
      ...product,
      category: trimmedTarget,
      additionalCategories: [],
    };
  }

  // mode === 'add-both'
  const nextCats = [...currentCats];
  if (
    !nextCats.some(
      (c) =>
        c.toLowerCase() === trimmedTarget.toLowerCase() ||
        resolveSingleCategoryName(c).toLowerCase() === resolvedTarget ||
        areCategoriesEquivalent(c, trimmedTarget)
    )
  ) {
    nextCats.push(trimmedTarget);
  }
  return {
    ...product,
    category: nextCats[0] || trimmedTarget,
    additionalCategories: nextCats.slice(1),
  };
}

/**
 * Determina a categoria efetiva de um produto, respeitando 100% a categoria atribuída pelo administrador.
 */
export function getEffectiveProductCategory(
  product: { name?: string; category?: string; additionalCategories?: string[] },
  _categoriesList?: AvailableCategory[]
): string {
  const cats = getProductCategories(product);
  if (cats.length > 0) {
    return cats[0];
  }
  if ((product.category || '').trim().toLowerCase() === 'sem categoria') {
    return 'Sem Categoria';
  }
  return getCanonicalGarmentCategoryFromName(product.name) || 'Conjuntos';
}

/**
 * Obtém a foto da categoria configurada pelo administrador,
 * com fallback para a primeira foto de produto daquela categoria,
 * ou a imagem padrão editorial da categoria.
 */
export function getCategoryPhoto(
  categoryName: string,
  productsList: {
    name?: string;
    category?: string;
    additionalCategories?: string[];
    images?: string[];
  }[] = []
): string {
  const storedCats = getStoredCategories();
  const catDef = storedCats.find(
    (c) => c.name.trim().toLowerCase() === categoryName.trim().toLowerCase()
  );

  const defaultDef = STORE_CATEGORIES.find((c) => areCategoriesEquivalent(c.name, categoryName));
  const hasCustomAdminImage =
    catDef?.image &&
    typeof catDef.image === 'string' &&
    catDef.image.trim() &&
    catDef.image !== defaultDef?.image;

  if (hasCustomAdminImage && catDef?.image) {
    return catDef.image;
  }

  if (Array.isArray(productsList) && productsList.length > 0) {
    for (const p of productsList) {
      if (!isProductMatchingCategory(p, categoryName)) continue;
      if (Array.isArray(p.images) && p.images.length > 0) {
        const firstImage = p.images.find((img) => Boolean(img) && !isVideoMedia(img));
        if (firstImage) return firstImage;
      }
    }
  }

  if (catDef?.image && typeof catDef.image === 'string' && catDef.image.trim()) {
    return catDef.image;
  }

  return defaultDef?.image || '/images/look-3103.png';
}

/**
 * Normaliza qualquer nome de categoria para a categoria canônica oficial ativa
 */
export function normalizeCategoryName(rawCategory?: string): string {
  if (!rawCategory) return '';
  const trimmed = rawCategory.trim();
  const lower = trimmed.toLowerCase();

  // 1. Prioridade absoluta: categoria ativa salva pelo usuário/loja (por igualdade ou equivalência)
  const allCategories = getStoredCategories();
  const exact = allCategories.find(
    (c) => c.name.toLowerCase() === lower || c.slug === lower || areCategoriesEquivalent(c.name, trimmed)
  );
  if (exact) return exact.name;

  // 2. Não mapear para categorias que foram excluídas pelo administrador
  const deletedList = getDeletedCategories().map((d) => d.toLowerCase());
  const isNotDeleted = (name: string) => !deletedList.includes(name.toLowerCase());

  // 3. Normalização canônica por palavras-chave apenas se a categoria padrão não tiver sido excluída
  const norm = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (norm.includes('conjunto') && isNotDeleted('Conjuntos')) return 'Conjuntos';
  if (norm.includes('macaquinh') && isNotDeleted('Macaquinho')) return 'Macaquinho';
  if (norm.includes('macac') && !norm.includes('macaquinh') && isNotDeleted('Macacão')) return 'Macacão';
  if ((norm.includes('legging') || norm.includes('calca')) && isNotDeleted('Leggings')) return 'Leggings';
  if ((norm.includes('top') || norm.includes('sutia') || norm.includes('cropped')) && isNotDeleted('Tops')) return 'Tops';
  if ((norm.includes('short') || norm.includes('bermuda')) && isNotDeleted('Shorts & Bermudas')) return 'Shorts & Bermudas';
  if ((norm.includes('regata') || norm.includes('camiseta') || norm.includes('t-shirt') || norm.includes('blusa')) && isNotDeleted('Regatas & Camisetas')) return 'Regatas & Camisetas';
  if ((norm.includes('jaqueta') || norm.includes('casaco') || norm.includes('corta')) && isNotDeleted('Jaquetas')) return 'Jaquetas';
  if ((norm.includes('acessorio') || norm.includes('meia')) && isNotDeleted('Acessórios')) return 'Acessórios';

  // 4. Se houver correspondência com palavras-chave de qualquer categoria ativa
  for (const cat of allCategories) {
    if (Array.isArray(cat.keywords)) {
      if (cat.keywords.some((kw) => norm.includes(kw.toLowerCase()))) {
        return cat.name;
      }
    }
  }

  return trimmed;
}

const CATEGORIES_STORAGE_KEY = 'aura_store_categories_v1';
const DELETED_CATEGORIES_KEY = 'aura_deleted_categories_v1';

let inMemoryCategories: AvailableCategory[] | null = null;

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
 * Obtém a lista dinâmica de categorias da loja salvas pelo administrador,
 * desduplicando sinônimos equivalentes (ex: evita criar "Macaquinho" duplicado se "Macacões" já existe).
 */
export function getStoredCategories(): AvailableCategory[] {
  // Garante que "Macacão" e "Macaquinho" existam como duas categorias independentes e nunca misturadas
  try {
    if (
      typeof window !== 'undefined' &&
      localStorage.getItem('aura_separate_macacao_macaquinho_cat_v5') !== 'true'
    ) {
      const rawDel = localStorage.getItem(DELETED_CATEGORIES_KEY);
      if (rawDel) {
        const parsedDel: string[] = JSON.parse(rawDel);
        const cleanedDel = parsedDel.filter((d) => {
          const n = d
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
          return !['macacao', 'macacoes', 'macaquinho', 'macaquinhos'].includes(n);
        });
        localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(cleanedDel));
      }

      const rawCats = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (rawCats) {
        const parsedCats: AvailableCategory[] = JSON.parse(rawCats);
        if (Array.isArray(parsedCats)) {
          // Normaliza eventual "Macacões" para "Macacão" e garante que ambos "Macacão" e "Macaquinho" estejam presentes separadamente
          const normalizedCats = parsedCats.map((c) => {
            const n = (c.name || '')
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .trim();
            if (n === 'macacoes' || n === 'macacao') {
              return {
                ...c,
                name: 'Macacão',
                slug: 'macacao',
                keywords: ['macacao', 'macacão', 'macacoes', 'macacões', 'jumpsuit', 'catsuit'],
              };
            }
            if (n === 'macaquinhos' || n === 'macaquinho') {
              return {
                ...c,
                name: 'Macaquinho',
                slug: 'macaquinho',
                keywords: ['macaquinho', 'macaquinhos', 'romper'],
              };
            }
            return c;
          });

          const hasMacacao = normalizedCats.some((c) => c.name === 'Macacão');
          const hasMacaquinho = normalizedCats.some((c) => c.name === 'Macaquinho');

          if (!hasMacacao) {
            const officialMacacao = STORE_CATEGORIES.find((sc) => sc.name === 'Macacão');
            if (officialMacacao) normalizedCats.splice(1, 0, officialMacacao);
          }
          if (!hasMacaquinho) {
            const officialMacaquinho = STORE_CATEGORIES.find((sc) => sc.name === 'Macaquinho');
            if (officialMacaquinho) normalizedCats.splice(2, 0, officialMacaquinho);
          }

          localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(normalizedCats));
        }
      }
      localStorage.setItem('aura_separate_macacao_macaquinho_cat_v5', 'true');
    }
  } catch {}

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
    if (inMemoryCategories && inMemoryCategories.length > 0) {
      categories = [...inMemoryCategories];
    } else {
      categories = [...STORE_CATEGORIES];
    }
  }

  const deletedList = getDeletedCategories().map((d) => d.toLowerCase());
  categories = categories.filter((c) => !deletedList.includes(c.name.toLowerCase()));

  // Desduplica apenas categorias com exatamente o mesmo nome (case-insensitive)
  const dedupedCategories: AvailableCategory[] = [];
  for (const cat of categories) {
    if (cat.name.trim().toLowerCase() === 'sem categoria') continue;
    const existingExact = dedupedCategories.find(
      (dc) => dc.name.trim().toLowerCase() === cat.name.trim().toLowerCase()
    );
    if (!existingExact) {
      const official = STORE_CATEGORIES.find((sc) => areCategoriesEquivalent(sc.name, cat.name));
      dedupedCategories.push({
        ...cat,
        icon: cat.icon && cat.icon !== '🏷️' ? cat.icon : official?.icon || '🏷️',
        image: cat.image || official?.image,
        keywords: Array.from(
          new Set([...(cat.keywords || []), ...(official?.keywords || []), cat.name.toLowerCase()])
        ),
      });
    }
  }
  categories = dedupedCategories;

  // Auto-descoberta: se existirem produtos com categorias personalizadas que ainda não estão na lista, inclui dinamicamente
  try {
    const rawProducts = typeof window !== 'undefined' ? localStorage.getItem('aura_products_v1') : null;
    if (rawProducts) {
      const parsedProds = JSON.parse(rawProducts);
      if (Array.isArray(parsedProds)) {
        parsedProds.forEach((p: { category?: string; additionalCategories?: string[] }) => {
          const prodCats = getProductCategories(p);
          prodCats.forEach((catName) => {
            const isDeleted = deletedList.includes(catName.toLowerCase());
            const alreadyExists = categories.some(
              (c) => c.name.trim().toLowerCase() === catName.toLowerCase()
            );
            if (!alreadyExists && !isDeleted && catName.toLowerCase() !== 'sem categoria') {
              categories.push({
                name: catName,
                slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                icon: '🏷️',
                description: `Peças exclusivas da categoria ${catName}.`,
                keywords: [catName.toLowerCase()],
              });
            }
          });
        });
      }
    }
  } catch {
    // fallback seguro
  }

  inMemoryCategories = [...categories];
  return categories;
}

/**
 * Salva a lista dinâmica de categorias da loja
 */
export function saveStoredCategories(categories: AvailableCategory[]): void {
  inMemoryCategories = [...categories];

  if (typeof window !== 'undefined') {
    // Garante que nenhuma categoria ativa sendo salva permaneça na lista de excluídas
    try {
      const activeNames = new Set(categories.map((c) => c.name.trim().toLowerCase()));
      const deletedList = getDeletedCategories().filter(
        (d) => !activeNames.has(d.trim().toLowerCase())
      );
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedList));
    } catch {}

    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.warn('Limpando cache redundante para salvar categorias no localStorage:', e);
      try {
        localStorage.removeItem('aura_updated_products_v1');
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
      } catch (err2) {
        console.error('Erro ao salvar categorias no localStorage:', err2);
      }
    }

    window.dispatchEvent(new CustomEvent('aura_categories_updated', { detail: categories }));

    fetch('/api/sync-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_store_extra',
        payload: {
          seoPatch: {
            customCategories: categories,
            deletedCategories: getDeletedCategories(),
          },
        },
      }),
    }).catch(() => {});
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
 * Renomeia uma categoria de produtos e migra fotos, configurações e produtos automaticamente
 */
export function renameStoredCategory(
  oldName: string,
  newName: string,
  extraData?: Partial<AvailableCategory>
): { updatedCategories: AvailableCategory[]; migratedCount: number } {
  const normOld = oldName.trim().toLowerCase();
  const trimmedNew = newName.trim();
  const current = getStoredCategories();

  let migratedCount = 0;

  const newSlug =
    extraData?.slug ||
    trimmedNew
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

  const existingIdx = current.findIndex((c) => c.name.toLowerCase() === normOld);
  let updatedCategories: AvailableCategory[];

  if (existingIdx !== -1) {
    updatedCategories = [...current];
    updatedCategories[existingIdx] = {
      ...updatedCategories[existingIdx],
      ...extraData,
      name: trimmedNew,
      slug: newSlug,
      keywords:
        extraData?.keywords && extraData.keywords.length > 0
          ? extraData.keywords
          : [trimmedNew.toLowerCase()],
    };
  } else {
    updatedCategories = [
      ...current,
      {
        name: trimmedNew,
        slug: newSlug,
        icon: extraData?.icon || '🏷️',
        description: extraData?.description || `Peças exclusivas da categoria ${trimmedNew}.`,
        keywords: [trimmedNew.toLowerCase()],
      },
    ];
  }

  // Se oldName era categoria padrão, adiciona oldName na lista de excluídas para não ressuscitar
  try {
    if (typeof window !== 'undefined') {
      const deletedList = getDeletedCategories();
      const isDefault = STORE_CATEGORIES.some((c) => c.name.toLowerCase() === normOld);
      if (isDefault && !deletedList.some((d) => d.toLowerCase() === normOld)) {
        deletedList.push(oldName.trim());
      }
      // Remove o novo nome da lista de excluídas caso estivesse
      const cleanedDeleted = deletedList.filter((d) => d.toLowerCase() !== trimmedNew.toLowerCase());
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(cleanedDeleted));
    }
  } catch {}

  // Migra imagem da categoria
  try {
    if (typeof window !== 'undefined') {
      const rawPhotos = localStorage.getItem('aura_category_photos_v1');
      if (rawPhotos) {
        const photosMap = JSON.parse(rawPhotos);
        if (photosMap[oldName.trim()]) {
          photosMap[trimmedNew] = photosMap[oldName.trim()];
          delete photosMap[oldName.trim()];
          localStorage.setItem('aura_category_photos_v1', JSON.stringify(photosMap));
        }
      }
    }
  } catch {}

  // Salva categorias atualizadas
  saveStoredCategories(updatedCategories);

  // Migra todos os produtos no localStorage
  try {
    if (typeof window !== 'undefined') {
      const rawProducts = localStorage.getItem('aura_products_v1');
      if (rawProducts) {
        const prods = JSON.parse(rawProducts);
        if (Array.isArray(prods)) {
          const remapped = prods.map((p) => {
            const cat = (p.category || '').trim();
            if (cat.toLowerCase() === normOld || cat === oldName.trim()) {
              migratedCount++;
              return { ...p, category: trimmedNew };
            }
            return p;
          });
          localStorage.setItem('aura_products_v1', JSON.stringify(remapped));
        }
      }
    }
  } catch {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aura_categories_updated', { detail: updatedCategories }));
    window.dispatchEvent(new CustomEvent('aura_products_updated'));
  }

  return { updatedCategories, migratedCount };
}

/**
 * Adiciona uma nova categoria e notifica toda a loja em tempo real
 */
export function saveNewCategory(
  name: string,
  extraData?: Partial<AvailableCategory>
): AvailableCategory[] {
  const trimmed = name.trim();
  if (!trimmed) return getStoredCategories();

  // Se estava na lista de deletadas, remove da lista de deletadas ANTES de ler getStoredCategories()
  try {
    if (typeof window !== 'undefined') {
      const deletedList = getDeletedCategories().filter(
        (d) => d.trim().toLowerCase() !== trimmed.toLowerCase()
      );
      localStorage.setItem(DELETED_CATEGORIES_KEY, JSON.stringify(deletedList));
    }
  } catch {}

  const current = getStoredCategories();
  const exists = current.some((c) => c.name.trim().toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    const newCat: AvailableCategory = {
      name: trimmed,
      slug:
        extraData?.slug ||
        trimmed
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, ''),
      icon: extraData?.icon || '🏷️',
      image: extraData?.image,
      description:
        extraData?.description || `Peças e modelos exclusivos da coleção ${trimmed}.`,
      keywords:
        extraData?.keywords && extraData.keywords.length > 0
          ? extraData.keywords
          : [trimmed.toLowerCase()],
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

/**
 * Verifica se um produto pertence a uma determinada categoria.
 * Compara estritamente com as categorias atribuídas ao produto (getProductCategories),
 * garantindo que nenhum produto apareça em duas categorias sem confirmação explícita do usuário.
 */
export function isProductMatchingCategory(
  product: {
    name?: string;
    category?: string;
    additionalCategories?: string[];
    description?: string;
  },
  targetCategoryName: string
): boolean {
  if (!targetCategoryName || !targetCategoryName.trim()) return true;
  const resolvedTarget = resolveSingleCategoryName(targetCategoryName).trim().toLowerCase();
  const rawTarget = targetCategoryName.trim().toLowerCase();
  const prodCats = getProductCategories(product);

  // Correspondência exata com a(s) categoria(s) do produto
  if (
    prodCats.some((c) => {
      const cLower = c.trim().toLowerCase();
      return cLower === resolvedTarget || cLower === rawTarget;
    })
  ) {
    return true;
  }

  return false;
}

/**
 * Extrai as cores explicitamente mencionadas em um texto (ex: nome do produto)
 */
export function extractColorsFromText(text?: string): { name: string; hex: string }[] {
  if (!text || !text.trim()) return [];
  const fullText = normalizeText(text);
  const detected: { name: string; hex: string }[] = [];
  const added = new Set<string>();

  const allColorRules: { color: AvailableColor; keyword: string }[] = [];
  STORE_COLORS.forEach((color) => {
    color.keywords.forEach((kw) => {
      allColorRules.push({ color, keyword: normalizeText(kw) });
    });
  });
  allColorRules.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const rule of allColorRules) {
    const regex = new RegExp(`(^|[^a-z0-9])${rule.keyword}([^a-z0-9]|$)`, 'i');
    if (regex.test(fullText)) {
      if (!added.has(rule.color.name)) {
        added.add(rule.color.name);
        detected.push({ name: rule.color.name, hex: rule.color.hex });
      }
    }
  }
  return detected;
}

/**
 * Retorna a lista efetiva e corrigida de cores de um produto.
 * Se o produto tinha apenas a cor padrão de fallback ("Preto") mas seu nome declara
 * explicitamente outra cor (ex: "Rosa", "Purple", "Vinho", "Marrom Café"), corrige automaticamente.
 */
export function getEffectiveProductColors(product: {
  name?: string;
  colors?: { name: string; hex?: string }[];
}): { name: string; hex: string }[] {
  const nameColors = extractColorsFromText(product.name);
  const rawColors = Array.isArray(product.colors) ? product.colors : [];

  // Mapeia cada cor cadastrada para a cor canônica oficial da loja quando aplicável
  const normalizedRawColors = rawColors
    .filter((c) => c && c.name && c.name.trim())
    .map((c) => {
      const cNorm = normalizeText(c.name);
      const exactStore = STORE_COLORS.find((sc) => normalizeText(sc.name) === cNorm);
      if (exactStore) return { name: exactStore.name, hex: exactStore.hex };
      const byKeyword = extractColorsFromText(c.name);
      if (byKeyword.length > 0) return byKeyword[0];
      return { name: c.name.trim(), hex: c.hex || '#111111' };
    });

  // Se o título do produto tem uma cor explícita (ex: "Rosa") e o array de cores só tinha o fallback "Preto"
  // (sem que o título mencione Preto), substitui pelo valor real do título
  if (nameColors.length > 0) {
    const nameHasPreto = nameColors.some((nc) => nc.name === 'Preto');
    const rawOnlyFallbackPreto =
      normalizedRawColors.length === 0 ||
      (normalizedRawColors.length === 1 && normalizedRawColors[0].name === 'Preto' && !nameHasPreto);

    if (rawOnlyFallbackPreto) {
      return nameColors;
    }

    // Combina cores do produto com as cores explícitas do título sem duplicar
    const merged = [...normalizedRawColors];
    nameColors.forEach((nc) => {
      if (!merged.some((m) => normalizeText(m.name) === normalizeText(nc.name))) {
        merged.push(nc);
      }
    });
    return merged;
  }

  return normalizedRawColors.length > 0
    ? normalizedRawColors
    : [{ name: 'Preto', hex: '#111111' }];
}

/**
 * Extrai os tamanhos reais disponíveis em um produto (combinando product.sizes e chaves de product.stock)
 */
export function getProductSizes(product: {
  sizes?: string[];
  stock?: Record<string, number>;
}): string[] {
  const VALID_ORDER = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U'];
  const sizeSet = new Set<string>();

  if (Array.isArray(product.sizes)) {
    product.sizes.forEach((s) => {
      if (typeof s === 'string' && s.trim()) {
        sizeSet.add(s.trim().toUpperCase());
      }
    });
  }

  if (product.stock && typeof product.stock === 'object') {
    Object.entries(product.stock).forEach(([key, qty]) => {
      if (typeof qty === 'number' && qty <= 0 && sizeSet.size > 0) return;
      const prefix = key.split('-')[0]?.trim().toUpperCase();
      if (prefix && VALID_ORDER.includes(prefix)) {
        sizeSet.add(prefix);
      }
    });
  }

  const list = Array.from(sizeSet);
  list.sort((a, b) => {
    const idxA = VALID_ORDER.indexOf(a);
    const idxB = VALID_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });
  return list;
}

/**
 * Verifica se um produto possui determinado tamanho disponível
 */
export function productMatchesSize(
  product: { sizes?: string[]; stock?: Record<string, number> },
  sizeQuery: string
): boolean {
  if (!sizeQuery || !sizeQuery.trim()) return true;
  const target = sizeQuery.trim().toUpperCase();
  return getProductSizes(product).includes(target);
}

/**
 * Detecta se uma string de busca corresponde a uma cor (ex: "Rosa", "Preto", "Vinho", "Marrom", etc.)
 */
export function isColorQuery(query: string): boolean {
  if (!query || !query.trim()) return false;
  const q = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (q.length < 3) return false;

  return STORE_COLORS.some((color) => {
    const cName = color.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const parts = cName.split(/[\/\s]+/).map((p) => p.trim());
    if (parts.some((p) => p === q || (q.length >= 3 && p.startsWith(q)))) return true;
    return color.keywords.some((kw) => {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return kwNorm === q || (q.length >= 3 && kwNorm.startsWith(q));
    });
  });
}

/**
 * Verifica se um produto possui uma cor específica, sincronizado com getEffectiveProductColors:
 * - Se colorQuery for o nome exato de uma cor da paleta (ex: clique na bolinha de cor da sidebar),
 *   compara diretamente com as cores efetivas do produto.
 * - Se colorQuery for um termo livre pesquisado (ex: "Rosa", "Verde", "Azul"),
 *   encontra todas as variações daquela família de cor.
 */
export function productMatchesColor(
  product: {
    name?: string;
    colors?: { name: string; hex?: string }[];
    stock?: Record<string, number>;
    description?: string;
  },
  colorQuery: string
): boolean {
  if (!colorQuery || !colorQuery.trim()) return false;
  const q = normalizeText(colorQuery.trim());
  if (q.length < 2) return false;

  const effectiveColors = getEffectiveProductColors(product);

  // 1. Se a busca corresponde exatamente ao nome de uma cor oficial da paleta (ex: clique no filtro lateral)
  const exactPaletteColor = STORE_COLORS.find((sc) => normalizeText(sc.name) === q);
  if (exactPaletteColor) {
    return effectiveColors.some(
      (ec) => normalizeText(ec.name) === normalizeText(exactPaletteColor.name)
    );
  }

  // 2. Busca textual por termo/família de cor (ex: cliente digitou "Rosa", "Verde", "Azul", "Marrom")
  const matchingPaletteNames = new Set<string>();
  STORE_COLORS.forEach((sc) => {
    const cName = normalizeText(sc.name);
    const parts = cName.split(/[\/\s]+/).map((p) => p.trim()).filter(Boolean);
    const matchesStoreColor =
      cName === q ||
      parts.some((p) => p === q || (q.length >= 3 && p.startsWith(q))) ||
      sc.keywords.some((kw) => {
        const kwNorm = normalizeText(kw);
        return kwNorm === q || (q.length >= 3 && kwNorm.startsWith(q));
      });
    if (matchesStoreColor) {
      matchingPaletteNames.add(cName);
    }
  });

  if (
    effectiveColors.some((ec) => {
      const ecNorm = normalizeText(ec.name);
      return matchingPaletteNames.has(ecNorm) || ecNorm.includes(q);
    })
  ) {
    return true;
  }

  // Fallback para nome do produto com fronteira de palavra
  if (product.name) {
    const normName = normalizeText(product.name);
    const wordRegex = new RegExp(`(^|[^a-z0-9])${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
    if (wordRegex.test(normName)) return true;
  }

  return false;
}

export interface ProductClassification {
  category: string;
  isSet: boolean;
  colors: { name: string; hex: string }[];
  detectedTags: string[];
  hasExplicitCategoryMatch?: boolean;
}

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas
 */
export function normalizeText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Analisa o nome e descrição do produto para extrair categoria, se é conjunto e cores
 */
export function classifyProduct(
  name: string,
  description?: string,
  fallbackCategory?: string
): ProductClassification {
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

  // 2. Detectar Categoria entre as categorias ativas da loja
  const currentCategories = getStoredCategories();
  const activeFallback =
    (fallbackCategory &&
      currentCategories.find((c) => c.name.toLowerCase() === fallbackCategory.toLowerCase())?.name) ||
    fallbackCategory ||
    currentCategories[0]?.name ||
    'Conjuntos';

  let detectedCategory = isSet
    ? currentCategories.find((c) => c.name.toLowerCase() === 'conjuntos')?.name || activeFallback
    : activeFallback;
  let highestScore = 0;

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

  // 3. Detectar Cores (do termo mais específico/composto para o mais genérico)
  const detectedColors: { name: string; hex: string }[] = [];
  const addedColorNames = new Set<string>();

  // Achata e ordena todas as palavras-chave por comprimento decrescente (ex: 'rosa claro' antes de 'rosa')
  const allColorRules: { color: AvailableColor; keyword: string }[] = [];
  STORE_COLORS.forEach((color) => {
    color.keywords.forEach((kw) => {
      allColorRules.push({ color, keyword: kw });
    });
  });
  allColorRules.sort((a, b) => b.keyword.length - a.keyword.length);

  for (const rule of allColorRules) {
    const regex = new RegExp(`(^|[^a-zA-Z0-9áéíóúãõâêîôûç])${rule.keyword}([^a-zA-Z0-9áéíóúãõâêîôûç]|$)`, 'i');
    if (regex.test(fullText)) {
      if (!addedColorNames.has(rule.color.name)) {
        addedColorNames.add(rule.color.name);
        detectedColors.push({ name: rule.color.name, hex: rule.color.hex });
        detectedTags.push(`Cor: ${rule.color.name}`);
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
    hasExplicitCategoryMatch: highestScore > 0 || isSet,
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
 * Limpa o nome do arquivo/modelo para extrair o Nome Canônico do Produto:
 * - Remove extensões (.jpg, .jpeg, .png, etc.)
 * - Remove numerações de sequência no início (ex: "01 - ", "1. ", "02_")
 * - Remove numerações de fotos entre parênteses ou colchetes (ex: " (1)", " (2)", " ()", " [03]")
 * - Remove sufixos de ângulos/posições (ex: "- frente", "- costas", "- detalhe", "- lateral")
 * - Remove sufixos como "_1", "_02", "- 1", "- 02", " foto 1", " img 2", " cópia"
 * - Remove valores monetários (ex: "183,00", "R$ 183")
 * - Remove tamanhos isolados (ex: " - G - ")
 * - Remove parênteses e colchetes vazios "()" ou "[]"
 * - Gera chave canônica de agrupamento (groupKey) para reunir todas as fotos do mesmo modelo
 */
export function cleanModelName(rawName: string): {
  cleanName: string;
  groupKey: string;
  sequenceNumber?: number;
  detectedAngle?: string;
} {
  if (!rawName) return { cleanName: '', groupKey: '' };

  // 1. Remove extensão se houver
  let name = rawName.replace(/\.[a-zA-Z0-9]{2,5}$/, '').trim();

  // 1b. Remove carimbos de data/hora do WhatsApp e câmeras (ex: "WhatsApp Image 2026-11-09 at 21.15.42")
  name = name.replace(
    /whatsapp\s*(?:image|video|img|vid)?\s*\d{4}[\s\-_.]*\d{1,2}[\s\-_.]*\d{1,2}\s*(?:at|as|às)?\s*\d{1,2}[\s\-_.:]*\d{1,2}(?:[\s\-_.:]*\d{1,2})?/gi,
    ' '
  );
  name = name.replace(/whatsapp\s*(?:image|video|img|vid)\b.*$/gi, ' ');
  name = name.replace(/\b(?:img|dsc|vid|pxl|mov|foto)[-_]?\d{4,8}[-_]?\d{0,6}\b/gi, ' ');

  // 2. Extrai e remove ângulo de foto se presente
  let detectedAngle: string | undefined = undefined;
  const angleMatch = name.match(/[\s\-_]+(frente|costas|costa|lateral|detalhe|zoom|look|crop|back|front|side|detail)\b/i);
  if (angleMatch) {
    detectedAngle = angleMatch[1].toLowerCase();
    name = name.replace(angleMatch[0], ' ');
  }

  // 3. Remove prefixos de sequência inicial (ex: "01 - ", "1. ", "02_")
  name = name.replace(/^(\d{1,4}[\s\-_\.]+)+/g, '');

  // 4. Extrai número de sequência se houver (ex: "(2)", "_02", "- 1")
  let sequenceNumber: number | undefined = undefined;
  const seqMatch = name.match(/\s*\((\d{1,3})\)\s*$/) || name.match(/[\s\-_]+(\d{1,3})$/);
  if (seqMatch) {
    sequenceNumber = parseInt(seqMatch[1], 10);
  }

  // 5. Remove números de sequência, parênteses e colchetes (inclusive vazios como "()" ou "[]")
  name = name.replace(/\s*\(\s*\d*\s*\)/g, ' '); // remove (1), (2), ()
  name = name.replace(/\s*\[\s*\d*\s*\]/g, ' '); // remove [1], [2], []
  name = name.replace(/\s*\{\s*\d*\s*\}/g, ' '); // remove {1}, {}
  name = name.replace(/[\s\-_]+(?:foto|img|imagem|shot|pic|angulo|ângulo)?\s*\d{1,3}$/i, ' ');
  name = name.replace(/[\s\-_]+(?:copia|cópia|copy)\b.*$/i, ' ');
  name = name.replace(/[\s\-_]+v\d+\b/i, ' '); // remove v1, v2

  // 6. Remove preços e valores monetários (ex: 183,00, R$ 183)
  name = name.replace(/(?:r\$\s*)?(\d{2,4})(?:[,\.](\d{2}))?\b/gi, ' ');

  // 7. Remove tamanhos isolados
  name = name.replace(/\b(PP|P|M|G|GG|XG|XGG)\b/gi, ' ');

  // 8. Remove qualquer parênteses ou colchetes vazios remanescentes
  name = name.replace(/\(\s*\)/g, ' ').replace(/\[\s*\]/g, ' ');

  // 9. Remove símbolos, hifens e pontuação sobressalente
  name = name.replace(/[-_–—,:;]+/g, ' ').replace(/\s+/g, ' ').trim();

  // 10. Capitalização agradável das palavras
  const cleanName = name
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      const lower = w.toLowerCase();
      if (['de', 'da', 'do', 'das', 'dos', 'com', 'e', 'em'].includes(lower)) {
        return lower;
      }
      return w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w.toUpperCase();
    })
    .join(' ');

  // 11. groupKey unificado para agrupar todas as fotos do mesmo modelo
  const groupKey = normalizeText(cleanName);

  return { cleanName, groupKey, sequenceNumber, detectedAngle };
}

/**
 * Analisa o caminho da pasta e nome do arquivo para extrair:
 * - Nome real e canônico do produto (sem "(2)", "()", etc.)
 * - Categoria oficial Aura
 * - Preço (ex: 183,00)
 * - Tamanho (ex: P, M, G, GG)
 * - Cores
 * - Chave de agrupamento única para reunir todas as fotos do mesmo modelo em 1 só anúncio
 */
export function parseProductFromFolderOrFile(
  relPath: string,
  fileName: string,
  defaultCategory = 'Conjuntos'
): ParsedItemInfo {
  const activeCategories = getStoredCategories();
  const safeDefaultCategory =
    activeCategories.find((c) => c.name.toLowerCase() === defaultCategory.toLowerCase())?.name ||
    defaultCategory ||
    activeCategories[0]?.name ||
    'Conjuntos';

  // Normalizar barras do caminho (Windows ou POSIX)
  const parts = (relPath || fileName).split(/[\\/]/).filter(Boolean);
  const cleanFileName = fileName.replace(/\.[^/.]+$/, '').trim();

  // Pasta pai se existir
  const folderCandidate = parts.length > 1 ? parts[parts.length - 2].trim() : '';
  const genericFolderIgnore = ['fotos', 'imagens', 'upload', 'produtos', 'aura', 'photos', 'images', 'downloads'];
  const hasValidFolder = !!folderCandidate && !genericFolderIgnore.includes(normalizeText(folderCandidate));

  let candidateName = cleanFileName;
  let rawTextForExtraction = cleanFileName;

  const isCatFolder = hasValidFolder && activeCategories.some(
    (c) => normalizeText(c.name) === normalizeText(folderCandidate)
  );

  if (hasValidFolder) {
    if (!isGenericFileName(cleanFileName)) {
      candidateName = cleanFileName;
      rawTextForExtraction = `${folderCandidate} ${cleanFileName}`;
    } else {
      candidateName = `${folderCandidate} ${cleanFileName}`;
      rawTextForExtraction = `${folderCandidate} ${cleanFileName}`;
    }
  }

  // 1. Extração de Preço (ignora datas/timestamps do WhatsApp antes de extrair preço)
  let price = 189.9;
  const textWithoutTimestamps = rawTextForExtraction
    .replace(
      /whatsapp\s*(?:image|video|img|vid)?\s*\d{4}[\s\-_.]*\d{1,2}[\s\-_.]*\d{1,2}\s*(?:at|as|às)?\s*\d{1,2}[\s\-_.:]*\d{1,2}(?:[\s\-_.:]*\d{1,2})?/gi,
      ' '
    )
    .replace(/\b202\d[\s\-_.]\d{1,2}[\s\-_.]\d{1,2}\b/g, ' ');
  const priceMatch = textWithoutTimestamps.match(/(?:r\$\s*)?(\d{2,4})(?:[,\.](\d{2}))?\b/i);
  if (priceMatch) {
    const integerPart = priceMatch[1];
    const decimalPart = priceMatch[2] || '00';
    const parsedVal = parseFloat(`${integerPart}.${decimalPart}`);
    if (!isNaN(parsedVal) && parsedVal > 10 && parsedVal < 1900) {
      price = parsedVal;
    }
  }

  // 2. Extração de Tamanho (ex: "PP", "P", "M", "G", "GG", "XG")
  let size: string | undefined = undefined;
  const sizeMatch = rawTextForExtraction.match(/\b(PP|P|M|G|GG|XG|XGG)\b/i);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
  }

  // 3. Limpeza Inteligente e Canônica do Nome do Produto
  let { cleanName, groupKey } = cleanModelName(candidateName);

  // Se após a limpeza o nome ficou vazio ou genérico, agrupa pelo nome da pasta/categoria em vez do timestamp individual
  if (!cleanName || isGenericFileName(cleanName)) {
    if (hasValidFolder && !isCatFolder) {
      const folderClean = cleanModelName(folderCandidate);
      cleanName = folderClean.cleanName || `${safeDefaultCategory} Fitness Aura`;
      groupKey = folderClean.groupKey || normalizeText(cleanName);
    } else {
      const prefix = hasValidFolder ? folderCandidate : safeDefaultCategory;
      cleanName = `${prefix} Fitness Aura`;
      groupKey = normalizeText(cleanName);
    }
  }

  // 4. Classificação de Categoria, Cores e Conjunto pela IA
  const classification = classifyProduct(
    `${cleanName} ${hasValidFolder ? folderCandidate : ''}`,
    rawTextForExtraction,
    safeDefaultCategory
  );

  // 5. Categoria final
  let finalCategory = classification.hasExplicitCategoryMatch
    ? classification.category
    : safeDefaultCategory;
  if (hasValidFolder) {
    const matchingCat = activeCategories.find(
      (c) => normalizeText(c.name) === normalizeText(folderCandidate)
    );
    if (matchingCat) {
      finalCategory = matchingCat.name;
    }
  }
  if (!finalCategory) {
    finalCategory = safeDefaultCategory;
  }

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
 * Detecta se uma URL ou DataURL é um vídeo de produto (.mp4, .webm, .mov, data:video/...)
 */
export function isVideoMedia(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('idb://')) return true;
  if (trimmed.startsWith('data:video/')) return true;
  if (trimmed.includes('#video') || trimmed.includes('mime=video')) return true;
  const cleanPath = trimmed.split('?')[0].split('#')[0];
  return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(cleanPath);
}

/**
 * Detecta se um File selecionado pelo usuário é um arquivo de vídeo
 */
export function isVideoFile(file?: File | null): boolean {
  if (!file) return false;
  if (file.type && file.type.toLowerCase().startsWith('video/')) return true;
  return /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name || '');
}

/**
 * Detecta se um File selecionado pelo usuário é um arquivo de imagem
 */
export function isImageFile(file?: File | null): boolean {
  if (!file) return false;
  if (file.type && file.type.toLowerCase().startsWith('image/')) return true;
  return /\.(jpg|jpeg|png|webp|gif|avif|bmp|svg)$/i.test(file.name || '');
}

function getSharedVideoUrlCache(): Map<string, string> {
  const g = globalThis as unknown as { __auraVideoObjectUrlCache?: Map<string, string> };
  if (!g.__auraVideoObjectUrlCache) {
    g.__auraVideoObjectUrlCache = new Map<string, string>();
  }
  return g.__auraVideoObjectUrlCache;
}

function openSharedVideoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }
    const req = window.indexedDB.open('aura_video_storage_db', 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('videos')) {
        db.createObjectStore('videos');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function normalizeVideoMime(nameOrMime?: string): string {
  const lower = (nameOrMime || '').toLowerCase();
  if (lower.includes('webm')) return 'video/webm';
  if (lower.includes('ogg') || lower.includes('ogv')) return 'video/ogg';
  return 'video/mp4';
}

/**
 * Lê um arquivo de vídeo como DataURL com MIME type padronizado (video/mp4 ou video/webm)
 */
export function readVideoFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = (e) => {
      let dataUrl = (e.target?.result as string) || '';
      if (!dataUrl) {
        resolve('');
        return;
      }
      if (
        dataUrl.startsWith('data:application/octet-stream;base64,') ||
        dataUrl.startsWith('data:;base64,') ||
        dataUrl.startsWith('data:video/quicktime;base64,')
      ) {
        const commaIdx = dataUrl.indexOf(',');
        if (commaIdx !== -1) {
          const base64Part = dataUrl.slice(commaIdx + 1);
          const mime = normalizeVideoMime(file.name || file.type);
          dataUrl = `data:${mime};base64,${base64Part}`;
        }
      }
      resolve(dataUrl);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Salva um vídeo de produto no IndexedDB ('aura_video_storage_db') com MIME normalizado
 * e cria imediatamente o ObjectURL em cache para reprodução instantânea sem erros.
 */
export async function saveProductVideoToIDB(file: File): Promise<string> {
  const videoId = `vid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const idbRef = `idb://${videoId}`;
  const mimeType = normalizeVideoMime(file.name || file.type);
  const cache = getSharedVideoUrlCache();

  try {
    const buffer = await file.arrayBuffer();
    const normalizedBlob = new Blob([buffer], { type: mimeType });
    const immediateObjUrl = URL.createObjectURL(normalizedBlob);
    cache.set(idbRef, immediateObjUrl);

    const db = await openSharedVideoDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('videos', 'readwrite');
      const store = tx.objectStore('videos');
      store.put(normalizedBlob, videoId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('aura_video_blob_ready', { detail: { idbRef, url: immediateObjUrl } })
      );
    }
    return idbRef;
  } catch (err) {
    console.warn('Fallback para DataURL de vídeo:', err);
    return readVideoFileAsDataUrl(file);
  }
}

/**
 * Resolve assincronamente qualquer fonte de vídeo ('idb://...', 'data:video/...', ou URL)
 * para uma URL reproduzível na tag <video>.
 */
export async function resolveVideoMediaUrl(src?: string): Promise<string> {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  const cache = getSharedVideoUrlCache();
  if (cache.has(trimmed)) {
    return cache.get(trimmed)!;
  }

  if (trimmed.startsWith('data:video/')) {
    return getPlayableVideoUrl(trimmed);
  }

  if (!trimmed.startsWith('idb://')) {
    return trimmed;
  }

  const videoId = trimmed.replace('idb://', '');
  try {
    const db = await openSharedVideoDb();
    const rawBlob = await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction('videos', 'readonly');
      const store = tx.objectStore('videos');
      const req = store.get(videoId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (rawBlob instanceof Blob) {
      let playableBlob = rawBlob;
      if (
        !rawBlob.type ||
        rawBlob.type === 'video/quicktime' ||
        rawBlob.type === 'application/octet-stream'
      ) {
        const buf = await rawBlob.arrayBuffer();
        playableBlob = new Blob([buf], { type: 'video/mp4' });
      }
      const objUrl = URL.createObjectURL(playableBlob);
      cache.set(trimmed, objUrl);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('aura_video_blob_ready', { detail: { idbRef: trimmed, url: objUrl } })
        );
      }
      return objUrl;
    }
  } catch (e) {
    console.error('Erro ao resolver vídeo do IndexedDB:', e);
  }
  return '';
}

/**
 * Converte vídeos em base64 (data:video/...) ou referências idb:// para ObjectURL (blob:) em memória,
 * garantindo reprodução 100% sem erros de range/buffer em todos os navegadores.
 */
export function getPlayableVideoUrl(src?: string): string {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';

  const cache = getSharedVideoUrlCache();
  const cached = cache.get(trimmed);
  if (cached) return cached;

  if (trimmed.startsWith('idb://')) {
    resolveVideoMediaUrl(trimmed).catch(() => {});
    return '';
  }

  if (!trimmed.startsWith('data:video/')) {
    return trimmed;
  }

  try {
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx === -1) return trimmed;
    const header = trimmed.slice(0, commaIdx);
    const base64 = trimmed.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/i);
    const mimeType = normalizeVideoMime(mimeMatch ? mimeMatch[1] : 'video/mp4');

    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    cache.set(trimmed, blobUrl);
    return blobUrl;
  } catch (e) {
    console.warn('Fallback to direct video dataUrl:', e);
    return trimmed;
  }
}

/**
 * Retorna a lista unificada de mídias (fotos e vídeos) do carrossel de um produto.
 * Se product.videoUrl estiver preenchido e ainda não constar no array images,
 * posiciona o vídeo logo no 2º slide (índice 1) para reproduzir ao passar o mouse.
 */
export function getProductMediaSlides(product: {
  images?: string[];
  videoUrl?: string;
}): string[] {
  const rawImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const slides = [...rawImages];

  if (product.videoUrl && product.videoUrl.trim()) {
    const vUrl = product.videoUrl.trim();
    if (!slides.includes(vUrl)) {
      if (slides.length >= 1) {
        slides.splice(1, 0, vUrl);
      } else {
        slides.push(vUrl);
      }
    }
  }

  if (slides.length === 0) {
    return ['/images/look-3103.png'];
  }

  return slides;
}

/**
 * Redimensiona e comprime imagens client-side usando Canvas
 * Reduz fotos de 10MB para ~75KB sem perda perceptível de qualidade.
 * Se for vídeo, salva no IndexedDB (aura_video_storage_db) com MIME normalizado.
 */
export async function resizeImageFile(
  file: File,
  maxWidth = 900,
  maxHeight = 900,
  quality = 0.78
): Promise<string> {
  if (isVideoFile(file)) {
    return saveProductVideoToIDB(file);
  }

  return new Promise((resolve) => {
    if (!isImageFile(file)) {
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

// =========================================================================
// REGISTRO DE ARQUIVOS IMPORTADOS & PREVENÇÃO DE DUPLICATAS
// =========================================================================

export interface ImportedFileRecord {
  signature: string;
  fileName: string;
  fileSize: number;
  lastModified: number;
  groupKey: string;
  targetProductId?: string;
  targetProductName?: string;
  importedAt: string;
}

export const IMPORTED_FILES_REGISTRY_KEY = 'aura_imported_files_registry_v1';

export function getImportedFilesRegistry(): Record<string, ImportedFileRecord> {
  try {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem(IMPORTED_FILES_REGISTRY_KEY);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading imported files registry:', e);
  }
  return {};
}

export function saveImportedFilesRegistry(registry: Record<string, ImportedFileRecord>): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(IMPORTED_FILES_REGISTRY_KEY, JSON.stringify(registry));
    }
  } catch (e) {
    console.error('Error saving imported files registry:', e);
  }
}

export function registerImportedFiles(records: ImportedFileRecord[]): void {
  const current = getImportedFilesRegistry();
  records.forEach((rec) => {
    current[rec.signature] = rec;
    const simpleKey = `${rec.fileName}|${rec.fileSize}`;
    current[simpleKey] = rec;
  });
  saveImportedFilesRegistry(current);
}

export function generateFileSignature(file: File): string {
  const rel = file.webkitRelativePath || file.name;
  return `${rel}|${file.size}|${file.lastModified}`;
}

/**
 * Verifica se um arquivo já foi importado anteriormente E se o produto correspondente ainda existe na lista de produtos da loja
 */
export function isFileAlreadyImported(
  file: File,
  registry: Record<string, ImportedFileRecord>,
  existingProducts: { id: string; name: string; images?: string[] }[] = []
): boolean {
  if (!existingProducts || existingProducts.length === 0) {
    return false;
  }

  const sig = generateFileSignature(file);
  const simpleSig = `${file.name}|${file.size}`;
  const rec = registry[sig] || registry[simpleSig];

  if (!rec) return false;

  // Confirma se o produto vinculado a este arquivo realmente existe no catálogo atual
  const productStillExists = existingProducts.some((p) => {
    if (rec.targetProductId && p.id === rec.targetProductId) return true;
    if (
      rec.targetProductName &&
      normalizeText(p.name) === normalizeText(rec.targetProductName)
    ) {
      return true;
    }
    if (rec.groupKey && cleanModelName(p.name).groupKey === rec.groupKey) {
      return true;
    }
    return false;
  });

  if (!productStillExists) {
    // O produto foi excluído ou não está na lista: limpa registro órfão para permitir nova importação
    delete registry[sig];
    delete registry[simpleSig];
    saveImportedFilesRegistry(registry);
    return false;
  }

  return true;
}

/**
 * Unifica produtos repetidos no catálogo que possuem o mesmo modelo base
 * (ex: agrupa "Macaquinho Serena Rosa (2)" e "Macaquinho Serena Rosa ()" em um só anúncio oficial com todas as fotos)
 */
export function consolidateDuplicateProducts(products: Product[]): {
  consolidated: Product[];
  mergedCount: number;
} {
  const modelMap = new Map<string, Product>();
  let mergedCount = 0;

  for (const prod of products) {
    const { cleanName, groupKey } = cleanModelName(prod.name);
    const key = groupKey || normalizeText(prod.name);

    if (modelMap.has(key)) {
      // Mescla com o produto existente
      const existing = modelMap.get(key)!;
      mergedCount++;

      // Unifica imagens sem duplicar
      const combinedImages = [...(existing.images || [])];
      (prod.images || []).forEach((img) => {
        if (!combinedImages.includes(img)) {
          combinedImages.push(img);
        }
      });
      existing.images = combinedImages;

      // Unifica cores
      const existingColors = existing.colors || [];
      (prod.colors || []).forEach((c) => {
        if (!existingColors.some((ec) => ec.name.toLowerCase() === c.name.toLowerCase())) {
          existingColors.push(c);
        }
      });
      existing.colors = existingColors;

      // Unifica tamanhos
      const existingSizes = existing.sizes || [];
      (prod.sizes || []).forEach((s) => {
        if (!existingSizes.includes(s)) {
          existingSizes.push(s);
        }
      });
      existing.sizes = existingSizes;

      // Unifica estoque
      if (prod.stock) {
        existing.stock = existing.stock || {};
        Object.entries(prod.stock).forEach(([stKey, qty]) => {
          existing.stock![stKey] = (existing.stock![stKey] || 0) + qty;
        });
      }
    } else {
      // Define nome limpo sem "(2)", "()", etc., e sincroniza categoria e cores efetivas
      const healedName = cleanName || prod.name;
      modelMap.set(key, {
        ...prod,
        name: healedName,
        category: getEffectiveProductCategory({ name: healedName, category: prod.category }),
        colors: getEffectiveProductColors({ name: healedName, colors: prod.colors }),
        sizes: getProductSizes(prod),
      });
    }
  }

  const consolidated = Array.from(modelMap.values()).map((p) => ({
    ...p,
    category: getEffectiveProductCategory(p),
    colors: getEffectiveProductColors(p),
    sizes: getProductSizes(p),
  }));
  return { consolidated, mergedCount };
}

/**
 * Sugere um nome limpo e elegante ao agrupar manualmente vários produtos em um só
 */
export function suggestCleanMergedProductName(productsToMerge: Product[]): string {
  if (!productsToMerge || productsToMerge.length === 0) return 'Produto Aura Fitness';
  const primary = productsToMerge[0];
  const category = primary.category || 'Conjuntos';

  for (const p of productsToMerge) {
    const { cleanName } = cleanModelName(p.name || '');
    if (
      cleanName &&
      !isGenericFileName(cleanName) &&
      cleanName.toLowerCase() !== 'conjuntos' &&
      !cleanName.toLowerCase().includes('whatsapp')
    ) {
      return cleanName;
    }
  }

  const colorName = primary.colors?.[0]?.name;
  if (colorName && colorName.toLowerCase() !== 'preto') {
    return `${category} Fitness ${colorName}`;
  }
  return `${category} Fitness Aura`;
}

/**
 * Unifica manualmente uma lista de produtos selecionados pelo administrador em 1 único produto,
 * reunindo todas as fotos (poses diferentes) e vídeos no carrossel do anúncio principal.
 */
export function mergeProductsIntoOne(
  productsToMerge: Product[],
  overrides?: {
    name?: string;
    category?: string;
    price?: number;
    promotionalPrice?: number;
    colors?: { name: string; hex: string }[];
    images?: string[];
  }
): {
  mergedProduct: Product;
  removedIds: string[];
} {
  const base = productsToMerge[0];
  const removedIds = productsToMerge.slice(1).map((p) => p.id);

  // 1. Unifica todas as fotos e vídeos sem duplicatas
  let combinedImages: string[] = [];
  if (overrides?.images && overrides.images.length > 0) {
    combinedImages = [...overrides.images];
  } else {
    const photos: string[] = [];
    const videos: string[] = [];
    for (const prod of productsToMerge) {
      const slides = getProductMediaSlides(prod);
      for (const media of slides) {
        if (!media) continue;
        if (isVideoMedia(media)) {
          if (!videos.includes(media)) videos.push(media);
        } else {
          if (!photos.includes(media)) photos.push(media);
        }
      }
    }
    if (photos.length > 0 && videos.length > 0) {
      // Coloca a 1ª foto como capa (#1) e o 1º vídeo logo no #2 (hover), seguido das demais poses
      combinedImages = [photos[0], ...videos, ...photos.slice(1)];
    } else {
      combinedImages = [...photos, ...videos];
    }
  }

  if (combinedImages.length === 0) {
    combinedImages = ['/images/look-3103.png'];
  }

  // 2. Unifica cores
  let combinedColors = overrides?.colors ? [...overrides.colors] : [];
  if (combinedColors.length === 0) {
    for (const prod of productsToMerge) {
      for (const col of prod.colors || []) {
        if (!combinedColors.some((c) => c.name.toLowerCase() === col.name.toLowerCase())) {
          combinedColors.push(col);
        }
      }
    }
  }
  if (combinedColors.length === 0) {
    combinedColors = [{ name: 'Preto', hex: '#111111' }];
  }

  // 3. Unifica tamanhos
  const combinedSizes: string[] = [];
  for (const prod of productsToMerge) {
    for (const sz of prod.sizes || []) {
      if (!combinedSizes.includes(sz)) {
        combinedSizes.push(sz);
      }
    }
  }
  if (combinedSizes.length === 0) {
    combinedSizes.push('P', 'M', 'G');
  }

  // 4. Unifica estoque
  const combinedStock: Record<string, number> = { ...(base.stock || {}) };
  for (const prod of productsToMerge.slice(1)) {
    for (const [k, qty] of Object.entries(prod.stock || {})) {
      combinedStock[k] = Math.max(combinedStock[k] || 0, qty || 8);
    }
  }

  // 5. Unifica categorias adicionais
  const targetCategory = overrides?.category || base.category || 'Conjuntos';
  const extraCats: string[] = [];
  for (const prod of productsToMerge) {
    for (const extra of prod.additionalCategories || []) {
      if (
        extra.toLowerCase() !== targetCategory.toLowerCase() &&
        !extraCats.some((c) => c.toLowerCase() === extra.toLowerCase())
      ) {
        extraCats.push(extra);
      }
    }
  }

  const finalName =
    overrides?.name && overrides.name.trim()
      ? overrides.name.trim()
      : suggestCleanMergedProductName(productsToMerge);

  const firstVideo = combinedImages.find((m) => isVideoMedia(m)) || base.videoUrl;

  const mergedProduct: Product = {
    ...base,
    name: finalName,
    slug: finalName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, ''),
    category: targetCategory,
    additionalCategories: extraCats,
    price: overrides?.price !== undefined ? overrides.price : base.price,
    promotionalPrice:
      overrides?.promotionalPrice !== undefined
        ? overrides.promotionalPrice
        : base.promotionalPrice,
    colors: combinedColors,
    sizes: combinedSizes,
    images: combinedImages,
    videoUrl: firstVideo,
    stock: combinedStock,
  };

  return { mergedProduct, removedIds };
}


