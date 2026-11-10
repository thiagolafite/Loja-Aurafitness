import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Search,
  Grid,
  ListFilter,
  ArrowRight,
  Sparkles,
  Tag,
  Check,
  Layers,
} from 'lucide-react';
import { ProductCard } from '../../components/store/ProductCard';
import { ManualMergeProductsModal } from '../../components/admin/ManualMergeProductsModal';
import { getProducts, getStoreSections } from '../../lib/dataClient';
import { formatCurrency } from '../../lib/utils';
import {
  STORE_CATEGORIES,
  STORE_COLORS,
  normalizeCategoryName,
  AvailableCategory,
  getCategoryPhoto,
  getStoredCategories,
  isProductMatchingCategory,
  isColorQuery,
  productMatchesColor,
  areCategoriesEquivalent,
  getEffectiveProductColors,
  getProductSizes,
  productMatchesSize,
  cleanModelName,
  normalizeText,
} from '../../lib/productClassifier';
import { Product, StoreSection } from '../../types';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allProducts, setAllProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [storeSections, setStoreSections] = useState<StoreSection[]>(() => getStoreSections());

  // Sync categories, sections, and products if changed
  useEffect(() => {
    setCategories(getStoredCategories());
    setStoreSections(getStoreSections());
    setAllProducts([...getProducts()]);

    const syncCats = () => {
      setCategories(getStoredCategories());
      setAllProducts([...getProducts()]);
    };
    const syncSections = () => setStoreSections(getStoreSections());
    const syncProds = () => {
      setCategories(getStoredCategories());
      setAllProducts([...getProducts()]);
    };

    window.addEventListener('aura_categories_updated', syncCats);
    window.addEventListener('aura_sections_updated', syncSections);
    window.addEventListener('aura_products_updated', syncProds);
    window.addEventListener('storage', syncCats);
    window.addEventListener('storage', syncSections);
    return () => {
      window.removeEventListener('aura_categories_updated', syncCats);
      window.removeEventListener('aura_sections_updated', syncSections);
      window.removeEventListener('aura_products_updated', syncProds);
      window.removeEventListener('storage', syncCats);
      window.removeEventListener('storage', syncSections);
    };
  }, []);

  // Read URL params
  const initialSearch = searchParams.get('search') || '';
  const initialCategoryParam = searchParams.get('categoria') || '';
  const initialPromo = searchParams.get('promocao') === 'true';
  const secaoParam = searchParams.get('secao') || searchParams.get('colecao') || '';

  const activeSection = useMemo(() => {
    if (!secaoParam) return null;
    const norm = secaoParam.toLowerCase().trim();
    return (
      storeSections.find(
        (s) => s.slug.toLowerCase() === norm || s.id.toLowerCase() === norm || s.name.toLowerCase() === norm
      ) || null
    );
  }, [secaoParam, storeSections]);

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryParam);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(1000);
  const [onlyPromotions, setOnlyPromotions] = useState<boolean>(initialPromo);
  const [sortBy, setSortBy] = useState<string>('relevancia');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [isManualMergeOpen, setIsManualMergeOpen] = useState<boolean>(false);
  const [mergeCategoryTarget, setMergeCategoryTarget] = useState<string>('todos');

  // Sync all state when URL query params change (ex: cliques na Navbar ou HomePage)
  useEffect(() => {
    const cat = searchParams.get('categoria') || '';
    const s = searchParams.get('search') || '';
    const promo = searchParams.get('promocao') === 'true';
    const ord = searchParams.get('ordenar') || '';

    setSelectedCategory((prevCat) => {
      if (!areCategoriesEquivalent(prevCat, cat) && prevCat !== cat) {
        // Ao navegar para outra categoria pelo menu superior, limpa sub-filtros restritivos anteriores
        setSelectedColors([]);
        setSelectedSizes([]);
        setSelectedMaterials([]);
      }
      return cat;
    });

    setSearchQuery(s);
    setOnlyPromotions(promo);

    if (ord) {
      const normalizedSort = ord.replace(/_/g, '-').toLowerCase();
      setSortBy(normalizedSort);
    }
  }, [searchParams]);

  // Produtos pertencentes à seção ativa (ou todos os produtos se nenhuma seção ativa)
  const sectionScopedProducts = useMemo(() => {
    if (!activeSection) return allProducts;
    return allProducts.filter((product) => {
      const isDirectlyIncluded = (activeSection.productIds || []).includes(product.id);
      const isCategoryIncluded = (activeSection.includedCategories || []).some((c) =>
        isProductMatchingCategory(product, c)
      );
      return isDirectlyIncluded || isCategoryIncluded;
    });
  }, [allProducts, activeSection]);

  // Categorias sincronizadas com contagem exata
  const categoriesWithCounts = useMemo(() => {
    return categories.map((cat) => {
      const count = sectionScopedProducts.filter((p) =>
        isProductMatchingCategory(p, cat.name)
      ).length;
      return { category: cat, count };
    });
  }, [categories, sectionScopedProducts]);

  // Produtos do escopo da categoria selecionada (base para sincronizar Cores, Tamanhos e Faixa de Preço sem gaps)
  const categoryScopedProducts = useMemo(() => {
    if (!selectedCategory) return sectionScopedProducts;
    return sectionScopedProducts.filter((p) => isProductMatchingCategory(p, selectedCategory));
  }, [sectionScopedProducts, selectedCategory]);

  // Faixa de preço dinâmica e sincronizada com os produtos reais da categoria ativa
  const { minPriceBound, maxPriceBound } = useMemo(() => {
    const source = categoryScopedProducts.length > 0 ? categoryScopedProducts : allProducts;
    if (source.length === 0) {
      return { minPriceBound: 50, maxPriceBound: 450 };
    }
    const prices = source.map((p) => Number(p.promotionalPrice || p.price) || 0).filter((v) => v > 0);
    if (prices.length === 0) {
      return { minPriceBound: 50, maxPriceBound: 450 };
    }
    const minP = Math.max(10, Math.floor(Math.min(...prices) / 10) * 10);
    const maxP = Math.max(minP + 10, Math.ceil(Math.max(...prices) / 10) * 10);
    return { minPriceBound: minP, maxPriceBound: maxP };
  }, [categoryScopedProducts, allProducts]);

  // Mantém o slider de preço sincronizado no teto da categoria ao trocar de categoria
  useEffect(() => {
    setMaxPrice(maxPriceBound);
  }, [maxPriceBound, selectedCategory]);

  // Tamanhos disponíveis dinamicamente sincronizados com a categoria atual (sem tamanhos vazios)
  const availableSizesWithCount = useMemo(() => {
    const standardOrder = ['PP', 'P', 'M', 'G', 'GG', 'XG', 'U'];
    const discovered = new Set<string>(standardOrder);
    categoryScopedProducts.forEach((p) => {
      getProductSizes(p).forEach((s) => discovered.add(s));
    });

    const items = Array.from(discovered).map((sz) => {
      const count = categoryScopedProducts.filter((p) => productMatchesSize(p, sz)).length;
      return { size: sz, count };
    });

    const nonEmpty = items.filter((it) => it.count > 0 || selectedSizes.includes(it.size));
    return nonEmpty.length > 0 ? nonEmpty : items.slice(0, 5);
  }, [categoryScopedProducts, selectedSizes]);

  // Cores disponíveis dinamicamente sincronizadas com os produtos da categoria atual (todas as 16 cores + personalizadas)
  const availableColorsWithCount = useMemo(() => {
    const colorMap = new Map<string, { name: string; hex: string; count: number }>();

    STORE_COLORS.forEach((sc) => {
      const count = categoryScopedProducts.filter((p) => productMatchesColor(p, sc.name)).length;
      if (count > 0 || selectedColors.includes(sc.name)) {
        colorMap.set(sc.name.toLowerCase(), { name: sc.name, hex: sc.hex, count });
      }
    });

    // Inclui também qualquer cor personalizada presente nos produtos
    categoryScopedProducts.forEach((p) => {
      getEffectiveProductColors(p).forEach((c) => {
        const key = c.name.toLowerCase();
        if (!colorMap.has(key)) {
          const count = categoryScopedProducts.filter((prod) =>
            productMatchesColor(prod, c.name)
          ).length;
          if (count > 0 || selectedColors.includes(c.name)) {
            colorMap.set(key, { name: c.name, hex: c.hex || '#111111', count });
          }
        }
      });
    });

    const list = Array.from(colorMap.values());
    return list.length > 0
      ? list
      : STORE_COLORS.map((c) => ({ name: c.name, hex: c.hex, count: 0 }));
  }, [categoryScopedProducts, selectedColors]);

  // Toggle size helper
  const toggleSize = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  // Toggle color helper
  const toggleColor = (colorName: string) => {
    setSelectedColors((prev) =>
      prev.includes(colorName) ? prev.filter((c) => c !== colorName) : [...prev, colorName]
    );
  };

  // Selecionar "Todas as Peças" (limpa categoria e sub-filtros que causariam gaps)
  const handleSelectAllCategories = () => {
    setSelectedCategory('');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSearchQuery('');
    setOnlyPromotions(false);
    setMaxPrice(maxPriceBound);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('categoria');
      next.delete('search');
      next.delete('promocao');
      return next;
    });
  };

  // Select category & update URL (limpa filtros incompatíveis para exibir a categoria clicada imediatamente)
  const handleSelectCategory = (catName: string) => {
    if (!catName) {
      handleSelectAllCategories();
      return;
    }

    const isSameCategory =
      Boolean(selectedCategory) && areCategoriesEquivalent(selectedCategory, catName);

    // Sempre limpa sub-filtros de cor/tamanho/busca ao alternar entre categorias para nunca travar em tela vazia ou na mesma cor
    setSelectedColors([]);
    setSelectedSizes([]);
    setSelectedMaterials([]);
    setSearchQuery('');
    setOnlyPromotions(false);

    if (isSameCategory) {
      setSelectedCategory('');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('categoria');
        next.delete('search');
        next.delete('promocao');
        return next;
      });
    } else {
      setSelectedCategory(catName);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('categoria', catName);
        next.delete('search');
        next.delete('promocao');
        return next;
      });
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setMaxPrice(maxPriceBound);
    setOnlyPromotions(false);
    setSortBy('relevancia');
    setSearchParams({});
  };

  // Verifica se o termo de busca é uma pesquisa por cor (ex: "Rosa", "Preto", "Vinho", "Marrom")
  const isColorSearch = useMemo(() => isColorQuery(searchQuery), [searchQuery]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const sorted = allProducts
      .filter((product) => {
        // Se o cliente pesquisou por cor, traz TODOS os produtos que possuem aquela cor independentemente da categoria!
        if (isColorSearch) {
          if (!productMatchesColor(product, searchQuery)) {
            return false;
          }
        } else {
          // Busca textual comum por nome, descrição, categoria ou cor
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const matchesName = (product.name || '').toLowerCase().includes(query);
            const matchesDesc = (product.description || '').toLowerCase().includes(query);
            const matchesCat = (product.category || '').toLowerCase().includes(query);
            const matchesColor = productMatchesColor(product, query);
            if (!matchesName && !matchesDesc && !matchesCat && !matchesColor) return false;
          }

          // Filtro por Categoria clicada
          if (selectedCategory) {
            if (!isProductMatchingCategory(product, selectedCategory)) {
              return false;
            }
          }
        }

        // Filter by Store Section (ex: 'Moda Verão', 'Black Friday')
        if (activeSection && !isColorSearch) {
          const isDirectlyIncluded = (activeSection.productIds || []).includes(product.id);
          const isCategoryIncluded = (activeSection.includedCategories || []).some(
            (c) => isProductMatchingCategory(product, c)
          );
          if (!isDirectlyIncluded && !isCategoryIncluded) {
            return false;
          }
        }

        // Filtro por Cores Selecionadas na sidebar
        if (selectedColors.length > 0) {
          const hasColor = selectedColors.some((sc) => productMatchesColor(product, sc));
          if (!hasColor) return false;
        }

        // Filtro por Tamanhos sincronizado com product.sizes e product.stock
        if (selectedSizes.length > 0) {
          const hasSize = selectedSizes.some((sz) => productMatchesSize(product, sz));
          if (!hasSize) return false;
        }

        // Materials
        if (selectedMaterials.length > 0) {
          const hasMaterial = (product.materials || []).some((m) =>
            selectedMaterials.some((sm) => m.toLowerCase().includes(sm.toLowerCase()))
          );
          if (!hasMaterial) return false;
        }

        // Max price
        const effectivePrice = Number(product.promotionalPrice || product.price) || 0;
        if (effectivePrice > maxPrice) {
          return false;
        }

        // Promotions only
        if (onlyPromotions && !product.promotionalPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.promotionalPrice || a.price;
        const priceB = b.promotionalPrice || b.price;

        if (sortBy === 'menor-preco') return priceA - priceB;
        if (sortBy === 'maior-preco') return priceB - priceA;
        if (sortBy === 'mais-vendidos') return (b.reviewCount || 0) - (a.reviewCount || 0);
        if (sortBy === 'mais-recentes')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'mais-avaliados') return (b.rating || 0) - (a.rating || 0);

        return 0;
      });

    // Salvaguarda visual: deduplicação por modelo e ID para impedir exibição de cards repetidos
    const seenIds = new Set<string>();
    const seenModelKeys = new Set<string>();
    return sorted.filter((prod) => {
      if (!prod || !prod.id) return false;
      if (seenIds.has(prod.id)) return false;
      seenIds.add(prod.id);

      const modelKey = cleanModelName(prod.name || '').groupKey || normalizeText(prod.name || '');
      if (modelKey) {
        if (seenModelKeys.has(modelKey)) return false;
        seenModelKeys.add(modelKey);
      }
      return true;
    });
  }, [
    allProducts,
    searchQuery,
    isColorSearch,
    selectedCategory,
    activeSection,
    selectedSizes,
    selectedColors,
    selectedMaterials,
    maxPrice,
    onlyPromotions,
    sortBy,
  ]);

  // Group filtered products by category for organized section display
  const groupedByCategory = useMemo(() => {
    const groups: { category: AvailableCategory; items: Product[] }[] = [];

    categories.forEach((cat) => {
      const items = filteredProducts.filter(
        (p) => isProductMatchingCategory(p, cat.name)
      );
      if (items.length > 0) {
        groups.push({ category: cat, items });
      }
    });

    // Check for any uncategorized items
    const categorizedIds = new Set(groups.flatMap((g) => g.items.map((i) => i.id)));
    const others = filteredProducts.filter((p) => !categorizedIds.has(p.id));
    if (others.length > 0) {
      groups.push({
        category: {
          name: 'Outras Peças',
          slug: 'outras',
          icon: '✨',
          description: 'Outras peças exclusivas do catálogo.',
          keywords: [],
        },
        items: others,
      });
    }

    return groups;
  }, [filteredProducts, categories]);

  // Active category object if single category selected
  const currentCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      categories.find((c) => areCategoriesEquivalent(c.name, selectedCategory)) || {
        name: selectedCategory,
        slug: 'categoria',
        icon: '🏷️',
        description: `Coleção completa de produtos da categoria ${selectedCategory}.`,
        keywords: [],
      }
    );
  }, [selectedCategory, categories]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Active Section Banner (ex: Moda Verão, Black Friday) */}
      {activeSection && (
        <div className="bg-gradient-to-r from-[#17381d] via-[#234d2b] to-[#15341a] text-white p-6 sm:p-8 rounded-3xl mb-8 shadow-xl relative overflow-hidden border border-[#3e6f4e]">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-extrabold text-[10px] uppercase px-3 py-1 rounded-full shadow-sm">
                {activeSection.badge || 'COLEÇÃO EM EXPOSIÇÃO'}
              </span>
              <span className="text-emerald-200 text-xs font-semibold">
                {filteredProducts.length} peças nesta seleção
              </span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-4xl text-white tracking-wide">
              {activeSection.name}
            </h1>
            {activeSection.description && (
              <p className="text-xs sm:text-sm text-white/80 max-w-xl">
                {activeSection.description}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('secao');
                next.delete('colecao');
                return next;
              });
            }}
            className="mt-4 sm:mt-0 sm:absolute sm:top-6 sm:right-6 text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl transition-all border border-white/20 flex items-center gap-1.5"
          >
            <span>✕ Ver Catálogo Completo</span>
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="border-b border-border pb-6 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Moda Fitness Premium</span>
          </span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mt-1">
            {selectedCategory ? `${currentCategoryObj?.icon || '🏷️'} ${selectedCategory}` : 'Catálogo Completo'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCategory
              ? currentCategoryObj?.description
              : `Organizado por categorias com ${filteredProducts.length} de ${allProducts.length} peças disponíveis`}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="lg:hidden bg-secondary text-secondary-foreground border border-border px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Filter className="w-4 h-4 text-primary" />
            Filtros
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs">
            <ListFilter className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium text-muted-foreground hidden sm:inline">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none outline-none font-semibold text-foreground cursor-pointer"
            >
              <option value="relevancia">Destaques Aura</option>
              <option value="menor-preco">Menor Preço</option>
              <option value="maior-preco">Maior Preço</option>
              <option value="mais-vendidos">Mais Vendidos</option>
              <option value="mais-recentes">Mais Recentes</option>
              <option value="mais-avaliados">Melhores Avaliações</option>
            </select>
          </div>
        </div>
      </div>

      {/* HORIZONTAL CATEGORY MENU BAR */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            Navegar por Categoria
          </span>
          {selectedCategory && (
            <button
              onClick={handleSelectAllCategories}
              className="text-xs text-primary font-bold hover:underline"
            >
              Ver Todas as Categorias
            </button>
          )}
        </div>

        {/* Horizontal scrollable category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {/* "Todas as Peças" Pill */}
          <button
            onClick={handleSelectAllCategories}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
              selectedCategory === ''
                ? 'bg-primary text-white border-primary shadow-md'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            }`}
          >
            <span>✨</span>
            <span>Todas as Peças</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === '' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {sectionScopedProducts.length}
            </span>
          </button>

          {/* Individual Category Pills (Sincronizadas e sem gaps de categorias vazias) */}
          {categoriesWithCounts.map(({ category: cat, count }) => {
            const isSelected = Boolean(
              selectedCategory && areCategoriesEquivalent(selectedCategory, cat.name)
            );

            return (
              <button
                key={cat.name}
                onClick={() => handleSelectCategory(cat.name)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                }`}
              >
                <img
                  src={getCategoryPhoto(cat.name, allProducts)}
                  alt={cat.name}
                  className="w-5 h-5 rounded-full object-cover object-top border border-black/10 dark:border-white/20 shrink-0"
                />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Filter Sidebar */}
        <aside
          className={`lg:col-span-3 space-y-6 ${
            isMobileFilterOpen ? 'block' : 'hidden lg:block'
          } bg-card border border-border p-5 rounded-2xl h-fit sticky top-24 z-20 shadow-sm`}
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              Filtrar Produtos
            </h3>
            <button
              onClick={handleResetFilters}
              className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
            >
              <RotateCcw className="w-3 h-3" /> Limpar
            </button>
          </div>

          {/* Real-time Search Input */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Buscar por Nome</label>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ex: Legging, Top, Macaquinho..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Categories Sidebar List */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Categorias
            </h4>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={handleSelectAllCategories}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  selectedCategory === ''
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>Todas as Categorias</span>
                <span className="text-[10px] opacity-75">{sectionScopedProducts.length}</span>
              </button>

              {categoriesWithCounts.map(({ category: cat, count }) => {
                const isSelected = Boolean(
                  selectedCategory && areCategoriesEquivalent(selectedCategory, cat.name)
                );

                return (
                  <button
                    key={cat.name}
                    onClick={() => handleSelectCategory(cat.name)}
                    className={`w-full text-left text-xs py-2 px-2.5 rounded-xl transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary/10 font-bold text-primary'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <img
                        src={getCategoryPhoto(cat.name, allProducts)}
                        alt={cat.name}
                        className="w-4 h-4 rounded-full object-cover object-top border border-black/10 dark:border-white/20 shrink-0"
                      />
                      <span>{cat.name}</span>
                    </span>
                    <span className="text-[10px] font-semibold opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider (Dinamicamente sincronizado com os preços reais da categoria) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <span className="font-semibold text-foreground uppercase tracking-wider">Faixa de Preço</span>
              <span className="font-serif font-bold text-primary">
                Até {formatCurrency(maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min={minPriceBound}
              max={maxPriceBound}
              step="10"
              value={Math.min(Math.max(maxPrice, minPriceBound), maxPriceBound)}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1">
              <span>Mín: {formatCurrency(minPriceBound)}</span>
              <span>Máx: {formatCurrency(maxPriceBound)}</span>
            </div>
          </div>

          {/* Size Filter (Sincronizado com tamanhos disponíveis na categoria ativa) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Tamanhos
              </h4>
              {selectedSizes.length > 0 && (
                <button
                  onClick={() => setSelectedSizes([])}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Limpar
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {availableSizesWithCount.map(({ size: sz, count }) => (
                <button
                  key={sz}
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${
                    selectedSizes.includes(sz)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                  title={`${count} ${count === 1 ? 'peça disponível' : 'peças disponíveis'} no tamanho ${sz}`}
                >
                  <span>{sz}</span>
                  {count > 0 && (
                    <span
                      className={`text-[9px] px-1 rounded-full ${
                        selectedSizes.includes(sz)
                          ? 'bg-white/20 text-white'
                          : 'text-muted-foreground/70'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Filter (Sincronizado com as cores reais disponíveis nos produtos da categoria) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Cores
              </h4>
              {selectedColors.length > 0 && (
                <button
                  onClick={() => setSelectedColors([])}
                  className="text-[10px] text-primary hover:underline font-semibold"
                >
                  Limpar ({selectedColors.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {availableColorsWithCount.map((c) => {
                const isColorSelected = selectedColors.includes(c.name);
                return (
                  <button
                    key={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={`w-6 h-6 rounded-full border border-black/15 dark:border-white/25 transition-transform relative flex items-center justify-center ${
                      isColorSelected
                        ? 'ring-2 ring-primary ring-offset-2 scale-110'
                        : 'hover:scale-110 opacity-90 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={`${c.name}${c.count > 0 ? ` (${c.count} ${c.count === 1 ? 'peça' : 'peças'})` : ''}`}
                  >
                    {isColorSelected && (
                      <Check
                        className={`w-3 h-3 ${
                          c.name === 'Branco' || c.name === 'Nude / Bege' || c.name === 'Rosa Claro'
                            ? 'text-slate-900'
                            : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {selectedColors.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedColors.map((sc) => (
                  <span
                    key={sc}
                    onClick={() => toggleColor(sc)}
                    className="text-[10px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full cursor-pointer hover:bg-primary/20 flex items-center gap-1"
                  >
                    <span>{sc}</span>
                    <span>✕</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Promotion Only Toggle */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Apenas em Promoção</span>
            <input
              type="checkbox"
              checked={onlyPromotions}
              onChange={(e) => setOnlyPromotions(e.target.checked)}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </div>
        </aside>

        {/* Product Grid / Category Sections */}
        <main className="lg:col-span-9 space-y-6">
          {isColorSearch && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-foreground font-semibold">
                  Exibindo todas as peças na cor <strong className="text-emerald-600 dark:text-emerald-400">"{searchQuery}"</strong> em todas as categorias ({filteredProducts.length} {filteredProducts.length === 1 ? 'peça encontrada' : 'peças encontradas'})
                </span>
              </div>
              <button
                onClick={() => setSearchQuery('')}
                className="text-muted-foreground hover:text-foreground font-bold underline shrink-0"
              >
                ✕ Limpar busca
              </button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-4">
              <Grid className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-lg text-foreground">Nenhuma peça encontrada</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente ajustar seus filtros ou selecionar outra categoria para visualizar mais opções.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : selectedCategory && !isColorSearch ? (
            /* Single Category Grid View */
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl p-2.5 rounded-xl bg-card border border-border shadow-sm">
                    {currentCategoryObj?.icon}
                  </span>
                  <div>
                    <h2 className="font-serif font-bold text-xl text-foreground">
                      {selectedCategory}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentCategoryObj?.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {filteredProducts.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMergeCategoryTarget(selectedCategory);
                        setIsManualMergeOpen(true);
                      }}
                      className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                      title="Selecionar produtos/poses separadas e transformar em 1 único produto"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Agrupar Poses em 1 Só</span>
                    </button>
                  )}
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'modelo' : 'modelos'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ) : !searchQuery.trim() && selectedSizes.length === 0 && selectedColors.length === 0 && !onlyPromotions ? (
            /* ALL PRODUCTS ORGANIZED BY CATEGORY SECTIONS */
            <div className="space-y-12">
              {groupedByCategory.map(({ category, items }) => (
                <section
                  key={category.name}
                  id={`cat-${category.slug}`}
                  className="space-y-4 border-b border-border pb-10 last:border-b-0 last:pb-0"
                >
                  {/* Category Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-l-4 border-primary pl-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        <h2 className="font-serif font-bold text-2xl text-foreground">
                          {category.name}
                        </h2>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {category.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-end">
                      {items.length >= 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setMergeCategoryTarget(category.name);
                            setIsManualMergeOpen(true);
                          }}
                          className="text-xs font-bold px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition-colors"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Agrupar Poses em 1 Só</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleSelectCategory(category.name)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        <span>Ver todos os {items.length} de {category.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Products Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {items.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            /* Filtered Search Results Grid */
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                Exibindo <strong>{filteredProducts.length}</strong> peças correspondentes aos filtros aplicados:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Agrupamento Manual de Produtos / Poses */}
      <ManualMergeProductsModal
        isOpen={isManualMergeOpen}
        onClose={() => setIsManualMergeOpen(false)}
        initialSelectedIds={
          mergeCategoryTarget && mergeCategoryTarget !== 'todos'
            ? allProducts
                .filter((p) => isProductMatchingCategory(p, mergeCategoryTarget))
                .map((p) => p.id)
            : []
        }
        defaultCategoryFilter={mergeCategoryTarget || selectedCategory || 'todos'}
        onSuccess={() => {
          setCategories(getStoredCategories());
          setAllProducts([...getProducts()]);
        }}
      />
    </div>
  );
};
