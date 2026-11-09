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
 * Normaliza qualquer nome de categoria para a categoria canônica oficial ativa
 */
export function normalizeCategoryName(rawCategory?: string): string {
  if (!rawCategory) return '';
  const trimmed = rawCategory.trim();
  const lower = trimmed.toLowerCase();

  // 1. Prioridade absoluta: categoria ativa salva pelo usuário/loja
  const allCategories = getStoredCategories();
  const exact = allCategories.find(
    (c) => c.name.toLowerCase() === lower || c.slug === lower
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
  if ((norm.includes('macac') || norm.includes('macaquinh')) && isNotDeleted('Macacões')) return 'Macacões';
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

/**
 * Verifica se um produto pertence a uma determinada categoria, considerando:
 * - Correspondência exata de nome ou slug
 * - Normalização canônica oficial
 * - Variações de singular e plural (ex: Macaquinho vs Macaquinhos, Top vs Tops, Conjunto vs Conjuntos)
 * - Sinônimos essenciais de moda fitness (ex: Macaquinho e Macacão)
 * - Palavras-chave cadastradas na categoria
 * - Nome do produto contendo a categoria
 */
export function isProductMatchingCategory(
  product: { name?: string; category?: string; description?: string },
  targetCategoryName: string
): boolean {
  if (!targetCategoryName || !targetCategoryName.trim()) return true;

  const target = targetCategoryName.trim().toLowerCase();
  const prodCat = (product.category || '').trim().toLowerCase();
  const prodName = (product.name || '').trim().toLowerCase();

  // 1. Igualdade direta
  if (prodCat === target) return true;

  // 2. Normalização canônica
  const normProd = normalizeCategoryName(product.category).toLowerCase();
  const normTarget = normalizeCategoryName(targetCategoryName).toLowerCase();
  if (normProd && normTarget && normProd === normTarget) return true;

  // 3. Variações de singular / plural (ex: Macaquinho x Macaquinhos, Top x Tops, Conjunto x Conjuntos)
  const stripPlural = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/es$/, '')
      .replace(/s$/, '');

  const rootTarget = stripPlural(target);
  const rootProd = stripPlural(prodCat);

  if (rootTarget && rootProd && (rootTarget === rootProd || rootTarget.startsWith(rootProd) || rootProd.startsWith(rootTarget))) {
    return true;
  }

  // 4. Sinônimos fundamentais do segmento fitness
  // Macaquinho / Macacão / Jumpsuit
  const isMacacaoTarget = target.includes('macac') || target.includes('macaquinh');
  const isMacacaoProd =
    prodCat.includes('macac') ||
    prodCat.includes('macaquinh') ||
    prodName.includes('macaquinh') ||
    prodName.includes('macacao') ||
    prodName.includes('macacão');
  if (isMacacaoTarget && isMacacaoProd) return true;

  // Conjuntos / Kits / Combos
  const isConjuntoTarget = target.includes('conjunt') || target.includes('kit') || target.includes('look');
  const isConjuntoProd = prodCat.includes('conjunt') || prodName.includes('conjunto');
  if (isConjuntoTarget && isConjuntoProd) return true;

  // Tops / Croppeds / Sutiãs
  const isTopTarget = target === 'top' || target === 'tops' || target.includes('cropped');
  const isTopProd = prodCat === 'top' || prodCat === 'tops' || prodName.includes('top ') || prodName.startsWith('top');
  if (isTopTarget && isTopProd) return true;

  // Shorts / Bermudas
  const isShortTarget = target.includes('short') || target.includes('bermuda');
  const isShortProd = prodCat.includes('short') || prodCat.includes('bermuda') || prodName.includes('short') || prodName.includes('bermuda');
  if (isShortTarget && isShortProd) return true;

  // Leggings / Calças
  const isLeggingTarget = target.includes('legging') || target.includes('calca') || target.includes('calça');
  const isLeggingProd = prodCat.includes('legging') || prodCat.includes('calca') || prodName.includes('legging');
  if (isLeggingTarget && isLeggingProd) return true;

  // 5. Verifica se as palavras-chave da categoria batem com a categoria do produto ou com o nome do produto
  const allCategories = getStoredCategories();
  const catDef = allCategories.find((c) => c.name.toLowerCase() === target || c.slug === target);
  if (catDef && Array.isArray(catDef.keywords) && catDef.keywords.length > 0) {
    const matchesKeyword = catDef.keywords.some((kw) => {
      const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return prodCat.includes(kwNorm) || prodName.includes(kwNorm);
    });
    if (matchesKeyword) return true;
  }

  return false;
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
 * Verifica se um produto possui uma cor específica, buscando:
 * - No array de cores cadastradas (product.colors)
 * - Nas chaves de estoque (product.stock)
 * - No nome do produto (product.name)
 * - Na descrição do produto (product.description)
 * - Em sinônimos e termos compostos (ex: "Pink / Fúcsia", "Rosa Claro" ao buscar "Rosa")
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
  const q = colorQuery.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (q.length < 2) return false;

  // 1. Coleta todas as palavras-chave canônicas e sinônimos associados
  const targetKeywords = new Set<string>([q]);

  // Se for parte de uma cor cadastrada no STORE_COLORS
  STORE_COLORS.forEach((color) => {
    const cName = color.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const parts = cName.split(/[\/\s]+/).map((p) => p.trim());
    const isMatch =
      cName === q ||
      parts.includes(q) ||
      color.keywords.some((kw) => {
        const kwNorm = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return kwNorm === q || (q.length >= 4 && kwNorm.includes(q));
      });

    if (isMatch) {
      targetKeywords.add(cName);
      parts.forEach((p) => targetKeywords.add(p));
      color.keywords.forEach((kw) => {
        targetKeywords.add(kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
      });
    }
  });

  const checkTextMatches = (text: string): boolean => {
    if (!text) return false;
    const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const kw of targetKeywords) {
      if (norm.includes(kw)) return true;
    }
    return false;
  };

  // 2. Cores cadastradas no produto (product.colors)
  if (Array.isArray(product.colors) && product.colors.length > 0) {
    const hasInColors = product.colors.some((c) => checkTextMatches(c.name));
    if (hasInColors) return true;
  }

  // 3. Variações de estoque (ex: "P-Preto", "M-Rosa Claro")
  if (product.stock && typeof product.stock === 'object') {
    const hasInStock = Object.keys(product.stock).some((key) => checkTextMatches(key));
    if (hasInStock) return true;
  }

  // 4. Nome do produto (ex: "Macaquinho Fitness Serena ... Rosa (2)")
  if (product.name && checkTextMatches(product.name)) {
    return true;
  }

  // 5. Descrição do produto
  if (product.description && checkTextMatches(product.description)) {
    return true;
  }

  return false;
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
export function normalizeText(text: string): string {
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
      candidateName = cleanFileName;
      rawTextForExtraction = `${folderCandidate} ${cleanFileName}`;
    } else {
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

  // 3. Limpeza Inteligente e Canônica do Nome do Produto
  let { cleanName, groupKey } = cleanModelName(candidateName);

  // Se após a limpeza o nome ficou vazio ou genérico, tenta recuperar da pasta
  if (!cleanName || isGenericFileName(cleanName)) {
    if (hasValidFolder && !isCatFolder) {
      const folderClean = cleanModelName(folderCandidate);
      cleanName = folderClean.cleanName;
      groupKey = folderClean.groupKey;
    } else {
      cleanName = `Produto ${cleanFileName}`;
      groupKey = normalizeText(cleanName);
    }
  }

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
 * Verifica se um arquivo já foi importado anteriormente
 */
export function isFileAlreadyImported(
  file: File,
  registry: Record<string, ImportedFileRecord>,
  existingProducts: { id: string; name: string; images?: string[] }[] = []
): boolean {
  const sig = generateFileSignature(file);
  if (registry[sig]) return true;

  const simpleSig = `${file.name}|${file.size}`;
  if (registry[simpleSig]) return true;

  return false;
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
      // Define nome limpo sem "(2)", "()", etc.
      modelMap.set(key, {
        ...prod,
        name: cleanName || prod.name,
      });
    }
  }

  const consolidated = Array.from(modelMap.values());
  return { consolidated, mergedCount };
}

