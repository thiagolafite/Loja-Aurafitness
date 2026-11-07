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
} from 'lucide-react';
import { ProductCard } from '../../components/store/ProductCard';
import { getProducts } from '../../lib/dataClient';
import { formatCurrency } from '../../lib/utils';
import {
  STORE_CATEGORIES,
  normalizeCategoryName,
  AvailableCategory,
} from '../../lib/productClassifier';
import { Product } from '../../types';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const allProducts = getProducts();

  // Read URL params
  const initialSearch = searchParams.get('search') || '';
  const initialCategoryParam = searchParams.get('categoria') || '';
  const initialPromo = searchParams.get('promocao') === 'true';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategoryParam ? normalizeCategoryName(initialCategoryParam) : ''
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(450);
  const [onlyPromotions, setOnlyPromotions] = useState<boolean>(initialPromo);
  const [sortBy, setSortBy] = useState<string>('relevancia');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync category state when URL query params change
  useEffect(() => {
    const cat = searchParams.get('categoria');
    if (cat) {
      setSelectedCategory(normalizeCategoryName(cat));
    } else if (cat === '') {
      setSelectedCategory('');
    }
  }, [searchParams]);

  const sizes = ['PP', 'P', 'M', 'G', 'GG'];
  const colors = [
    { name: 'Preto', hex: '#111111' },
    { name: 'Branco', hex: '#FFFFFF' },
    { name: 'Verde Oliva', hex: '#5F6F3A' },
    { name: 'Azul Marinho', hex: '#1B2A4A' },
    { name: 'Rosa Claro', hex: '#F4B6C2' },
    { name: 'Cinza Mescla', hex: '#71797E' },
  ];
  const materials = ['Poliamida', 'Elastano', 'Viscose', 'Nylon', 'LYCRA® Black'];

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

  // Select category & update URL
  const handleSelectCategory = (catName: string) => {
    if (selectedCategory === catName) {
      setSelectedCategory('');
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('categoria');
        return next;
      });
    } else {
      setSelectedCategory(catName);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('categoria', catName);
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
    setMaxPrice(450);
    setOnlyPromotions(false);
    setSortBy('relevancia');
    setSearchParams({});
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((product) => {
        // Search term
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesName = product.name.toLowerCase().includes(query);
          const matchesDesc = product.description.toLowerCase().includes(query);
          const matchesCat = product.category.toLowerCase().includes(query);
          if (!matchesName && !matchesDesc && !matchesCat) return false;
        }

        // Category comparison with normalization (e.g. MACAQUINHOS -> Macacões, CONJUNTOS -> Conjuntos)
        if (selectedCategory) {
          const productNormCat = normalizeCategoryName(product.category);
          const selectedNormCat = normalizeCategoryName(selectedCategory);
          if (productNormCat !== selectedNormCat) {
            return false;
          }
        }

        // Sizes
        if (selectedSizes.length > 0) {
          const hasSize = product.sizes.some((s) => selectedSizes.includes(s));
          if (!hasSize) return false;
        }

        // Colors
        if (selectedColors.length > 0) {
          const hasColor = product.colors.some((c) =>
            selectedColors.some(
              (sc) => sc.toLowerCase() === c.name.toLowerCase() || c.name.toLowerCase().includes(sc.toLowerCase())
            )
          );
          if (!hasColor) return false;
        }

        // Materials
        if (selectedMaterials.length > 0) {
          const hasMaterial = product.materials.some((m) =>
            selectedMaterials.some((sm) => m.toLowerCase().includes(sm.toLowerCase()))
          );
          if (!hasMaterial) return false;
        }

        // Max price
        const effectivePrice = product.promotionalPrice || product.price;
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
        if (sortBy === 'mais-vendidos') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
        if (sortBy === 'mais-recentes')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'mais-avaliados') return b.rating - a.rating;

        return 0;
      });
  }, [
    allProducts,
    searchQuery,
    selectedCategory,
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

    STORE_CATEGORIES.forEach((cat) => {
      const items = filteredProducts.filter(
        (p) => normalizeCategoryName(p.category) === cat.name
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
  }, [filteredProducts]);

  // Active category object if single category selected
  const currentCategoryObj = useMemo(() => {
    if (!selectedCategory) return null;
    return (
      STORE_CATEGORIES.find((c) => c.name === selectedCategory) || {
        name: selectedCategory,
        slug: 'categoria',
        icon: '🏷️',
        description: `Coleção completa de produtos da categoria ${selectedCategory}.`,
        keywords: [],
      }
    );
  }, [selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
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
              onClick={() => handleSelectCategory(selectedCategory)}
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
            onClick={() => handleSelectCategory(selectedCategory)}
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
              {allProducts.length}
            </span>
          </button>

          {/* Individual Category Pills */}
          {STORE_CATEGORIES.map((cat) => {
            const count = allProducts.filter(
              (p) => normalizeCategoryName(p.category) === cat.name
            ).length;
            const isSelected = selectedCategory === cat.name;

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
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {count}
                  </span>
                )}
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
                onClick={() => handleSelectCategory(selectedCategory)}
                className={`w-full text-left text-xs py-2 px-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  selectedCategory === ''
                    ? 'bg-primary/10 font-bold text-primary'
                    : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>Todas as Categorias</span>
                <span className="text-[10px] opacity-75">{allProducts.length}</span>
              </button>

              {STORE_CATEGORIES.map((cat) => {
                const count = allProducts.filter(
                  (p) => normalizeCategoryName(p.category) === cat.name
                ).length;
                const isSelected = selectedCategory === cat.name;

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
                    <span className="flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </span>
                    {count > 0 && (
                      <span className="text-[10px] font-semibold opacity-75">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range Slider */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground uppercase tracking-wider">Faixa de Preço</span>
              <span className="font-serif font-bold text-primary">{formatCurrency(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="50"
              max="450"
              step="10"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          {/* Size Filter */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Tamanhos</h4>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => toggleSize(sz)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${
                    selectedSizes.includes(sz)
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Filter */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Cores</h4>
            <div className="flex flex-wrap gap-2">
              {colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => toggleColor(c.name)}
                  className={`w-6 h-6 rounded-full border transition-transform ${
                    selectedColors.includes(c.name)
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
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
        <main className="lg:col-span-9 space-y-10">
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
          ) : selectedCategory ? (
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

                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                  {filteredProducts.length} {filteredProducts.length === 1 ? 'modelo' : 'modelos'}
                </span>
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

                    <button
                      onClick={() => handleSelectCategory(category.name)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1 self-start sm:self-end"
                    >
                      <span>Ver todos os {items.length} de {category.name}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
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
    </div>
  );
};
