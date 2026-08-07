import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, RotateCcw, Search, Grid, ListFilter } from 'lucide-react';
import { ProductCard } from '../../components/store/ProductCard';
import { getProducts } from '../../lib/base44Client';
import { formatCurrency } from '../../lib/utils';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const allProducts = getProducts();

  // Read URL params
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('categoria') || '';
  const initialPromo = searchParams.get('promocao') === 'true';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(350);
  const [onlyPromotions, setOnlyPromotions] = useState<boolean>(initialPromo);
  const [sortBy, setSortBy] = useState<string>('relevancia');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  const categories = ['Leggings', 'Tops', 'Conjuntos', 'Regatas & Camisetas', 'Jaquetas', 'Shorts & Bermudas', 'Macacões', 'Acessórios'];
  const sizes = ['PP', 'P', 'M', 'G', 'GG'];
  const colors = [
    { name: 'Verde Oliva', hex: '#5F6F3A' },
    { name: 'Preto Onyx', hex: '#1A1A1A' },
    { name: 'Areia Nude', hex: '#D4C4B5' },
    { name: 'Rosa Dust', hex: '#B58A8A' },
    { name: 'Branco Neve', hex: '#FFFFFF' },
    { name: 'Cinza Slate', hex: '#4A6B7C' },
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

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSizes([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setMaxPrice(350);
    setOnlyPromotions(false);
    setSortBy('relevancia');
    setSearchParams({});
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Search term
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Category
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Sizes
      if (selectedSizes.length > 0) {
        const hasSize = product.sizes.some((s) => selectedSizes.includes(s));
        if (!hasSize) return false;
      }

      // Colors
      if (selectedColors.length > 0) {
        const hasColor = product.colors.some((c) => selectedColors.includes(c.name));
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
    }).sort((a, b) => {
      const priceA = a.promotionalPrice || a.price;
      const priceB = b.promotionalPrice || b.price;

      if (sortBy === 'menor-preco') return priceA - priceB;
      if (sortBy === 'maior-preco') return priceB - priceA;
      if (sortBy === 'mais-vendidos') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      if (sortBy === 'mais-recentes') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'mais-avaliados') return b.rating - a.rating;

      return 0;
    });
  }, [allProducts, searchQuery, selectedCategory, selectedSizes, selectedColors, selectedMaterials, maxPrice, onlyPromotions, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header & Title */}
      <div className="border-b border-border pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Moda Fitness Premium</span>
          <h1 className="font-serif font-bold text-3xl sm:text-4xl text-foreground mt-1">
            {selectedCategory ? `Catálogo: ${selectedCategory}` : 'Catálogo Completo'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Mostrando {filteredProducts.length} de {allProducts.length} peças disponíveis
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
                placeholder="Ex: Legging, Top..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
          </div>

          {/* Categories Filter */}
          <div>
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">Categorias</h4>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                  selectedCategory === '' ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted text-muted-foreground'
                }`}
              >
                <span>Todas as Categorias</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === selectedCategory ? '' : cat)}
                  className={`w-full text-left text-xs py-1.5 px-2 rounded-lg transition-colors flex items-center justify-between ${
                    selectedCategory === cat ? 'bg-primary/10 font-bold text-primary' : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
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
              max="350"
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

        {/* Product Grid */}
        <main className="lg:col-span-9">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-4">
              <Grid className="w-12 h-12 text-muted-foreground mx-auto" />
              <h3 className="font-serif font-bold text-lg text-foreground">Nenhuma peça encontrada</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente ajustar seus filtros ou remover a busca por palavra-chave para visualizar mais opções.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs py-2.5 px-6 rounded-xl shadow-md transition-colors"
              >
                Limpar Todos os Filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
