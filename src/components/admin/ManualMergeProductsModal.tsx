import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Layers,
  Check,
  Sparkles,
  Star,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Search,
  Palette,
  Loader2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, ProductColor } from '../../types';
import {
  getProducts,
  saveProductAsync,
  saveProduct,
  bulkDeleteProductsAsync,
} from '../../lib/dataClient';
import {
  AvailableCategory,
  getStoredCategories,
  STORE_COLORS,
  mergeProductsIntoOne,
  suggestCleanMergedProductName,
  getProductMediaSlides,
  isVideoMedia,
  isProductMatchingCategory,
} from '../../lib/productClassifier';
import { formatCurrency } from '../../lib/utils';
import { ProductMediaView } from '../store/ProductMediaView';

interface ManualMergeProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedIds?: string[];
  defaultCategoryFilter?: string;
  onSuccess: (mergedProduct: Product, mergedCount: number) => void;
}

export const ManualMergeProductsModal: React.FC<ManualMergeProductsModalProps> = ({
  isOpen,
  onClose,
  initialSelectedIds = [],
  defaultCategoryFilter = 'todos',
  onSuccess,
}) => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AvailableCategory[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Unified Product Fields
  const [mergedName, setMergedName] = useState<string>('');
  const [mergedCategory, setMergedCategory] = useState<string>('Conjuntos');
  const [mergedPrice, setMergedPrice] = useState<number>(183);
  const [mergedPromoPrice, setMergedPromoPrice] = useState<number | undefined>(undefined);
  const [mergedColors, setMergedColors] = useState<ProductColor[]>([]);
  const [mergedImages, setMergedImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const prods = getProducts();
    const cats = getStoredCategories();
    setAllProducts(prods);
    setCategories(cats);
    setCategoryFilter(defaultCategoryFilter || 'todos');
    setSearchQuery('');

    const validInitial = initialSelectedIds.filter((id) => prods.some((p) => p.id === id));
    setSelectedIds(validInitial);
  }, [isOpen, initialSelectedIds, defaultCategoryFilter]);

  const selectedProducts = useMemo(() => {
    return selectedIds
      .map((id) => allProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p));
  }, [selectedIds, allProducts]);

  // Recalculate suggested unified fields whenever selection changes
  useEffect(() => {
    if (selectedProducts.length === 0) {
      setMergedImages([]);
      return;
    }

    const preview = mergeProductsIntoOne(selectedProducts);
    setMergedName(suggestCleanMergedProductName(selectedProducts));
    setMergedCategory(preview.mergedProduct.category);
    setMergedPrice(preview.mergedProduct.price);
    setMergedPromoPrice(preview.mergedProduct.promotionalPrice);
    setMergedColors(preview.mergedProduct.colors || []);
    setMergedImages(preview.mergedProduct.images || []);
  }, [selectedProducts]);

  const filteredCatalogProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesCat =
        categoryFilter === 'todos' || isProductMatchingCategory(p, categoryFilter);
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [allProducts, categoryFilter, searchQuery]);

  const handleToggleProduct = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredCatalogProducts.map((p) => p.id);
    const allAlreadySelected =
      filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id));

    if (allAlreadySelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedIds((prev) => {
        const next = [...prev];
        for (const id of filteredIds) {
          if (!next.includes(id)) next.push(id);
        }
        return next;
      });
    }
  };

  const handleSetCoverImage = (idx: number) => {
    if (idx === 0) return;
    setMergedImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const handleMoveImage = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= mergedImages.length) return;
    setMergedImages((prev) => {
      const next = [...prev];
      const temp = next[idx];
      next[idx] = next[target];
      next[target] = temp;
      return next;
    });
  };

  const handleRemoveImage = (idx: number) => {
    if (mergedImages.length <= 1) return;
    setMergedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length < 2) {
      alert('Selecione pelo menos 2 produtos para agrupar em um só.');
      return;
    }

    setIsSaving(true);
    try {
      const { mergedProduct, removedIds } = mergeProductsIntoOne(selectedProducts, {
        name: mergedName.trim() || suggestCleanMergedProductName(selectedProducts),
        category: mergedCategory,
        price: mergedPrice,
        promotionalPrice: mergedPromoPrice,
        colors: mergedColors,
        images: mergedImages,
      });

      // 1. Salva o produto unificado com todas as fotos/poses no carrossel
      try {
        await saveProductAsync(mergedProduct);
      } catch {
        saveProduct(mergedProduct);
      }

      // 2. Exclui os produtos duplicados que foram absorvidos
      if (removedIds.length > 0) {
        await bulkDeleteProductsAsync(removedIds);
      }

      onSuccess(mergedProduct, selectedProducts.length);
      onClose();
    } catch (err) {
      console.error('Erro ao agrupar produtos:', err);
      alert('Ocorreu um erro ao agrupar os produtos.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-card text-card-foreground border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#1c3022] text-white p-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg sm:text-xl">
                  Agrupar Produtos Manualmente em 1 Só Anúncio
                </h3>
                <p className="text-xs text-white/75 mt-0.5">
                  Selecione as fotos/poses separadas da mesma roupa para unificá-las em um único produto com carrossel completo.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-white/70 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleConfirmMerge} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs">
            {/* Step 1: Select Products to Merge */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-extrabold">
                      1
                    </span>
                    <span>Clique nos produtos que são a mesma peça (poses diferentes)</span>
                    <span className="bg-primary/15 text-primary px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                      {selectedIds.length} selecionado{selectedIds.length === 1 ? '' : 's'}
                    </span>
                  </h4>
                </div>

                {/* Filters & Select All */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filtrar por nome..."
                      className="bg-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary w-40"
                    />
                  </div>

                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs font-semibold outline-none"
                  >
                    <option value="todos">Todas as Categorias</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-bold text-xs border border-border flex items-center gap-1.5"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-primary" />
                    <span>Selecionar Todos da Lista ({filteredCatalogProducts.length})</span>
                  </button>
                </div>
              </div>

              {/* Selectable Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-60 overflow-y-auto p-2.5 rounded-2xl bg-muted/40 border border-border">
                {filteredCatalogProducts.map((prod) => {
                  const isSelected = selectedIds.includes(prod.id);
                  const orderIndex = selectedIds.indexOf(prod.id);
                  return (
                    <div
                      key={prod.id}
                      onClick={() => handleToggleProduct(prod.id)}
                      className={`relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all select-none flex flex-col bg-card ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/30 shadow-md scale-[0.99]'
                          : 'border-border/70 opacity-80 hover:opacity-100 hover:border-primary/40'
                      }`}
                    >
                      <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                        <ProductMediaView
                          src={prod.images?.[0] || '/images/look-3103.png'}
                          alt={prod.name}
                          autoPlay={false}
                          muted={true}
                          showVideoBadge={getProductMediaSlides(prod).some((m) => isVideoMedia(m))}
                          className="w-full h-full object-cover object-top"
                        />

                        {/* Selection Badge */}
                        <div className="absolute top-1.5 right-1.5 z-10">
                          {isSelected ? (
                            <span className="w-6 h-6 rounded-full bg-primary text-white font-extrabold text-[11px] flex items-center justify-center shadow-md">
                              {orderIndex + 1}
                            </span>
                          ) : (
                            <span className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center">
                              <Square className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        {prod.images && prod.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {prod.images.length} mídias
                          </span>
                        )}
                      </div>

                      <div className="p-2 space-y-0.5">
                        <span className="text-[9px] font-bold uppercase text-primary block truncate">
                          {prod.category}
                        </span>
                        <p className="font-semibold text-[11px] text-foreground truncate" title={prod.name}>
                          {prod.name}
                        </p>
                        <p className="text-[10px] font-bold text-muted-foreground">
                          {formatCurrency(prod.promotionalPrice || prod.price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Configure Unified Product & Carousel Order */}
            {selectedProducts.length >= 2 ? (
              <div className="bg-primary/5 border-2 border-primary/25 rounded-3xl p-4 sm:p-5 space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-[11px] flex items-center justify-center font-extrabold">
                      2
                    </span>
                    <span>Resultado Unificado ({mergedImages.length} fotos/vídeos no mesmo anúncio)</span>
                  </h4>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-500/15 px-3 py-1 rounded-full">
                    {selectedProducts.length} produtos serão unidos em 1 só
                  </span>
                </div>

                {/* Form Inputs: Name, Category, Price */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block font-bold text-foreground mb-1">
                      Nome Oficial do Produto Unificado *
                    </label>
                    <input
                      type="text"
                      required
                      value={mergedName}
                      onChange={(e) => setMergedName(e.target.value)}
                      placeholder="Ex: Macaquinho Fitness Poliamida Pink"
                      className="w-full bg-card border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-foreground mb-1">
                      Categoria *
                    </label>
                    <select
                      value={mergedCategory}
                      onChange={(e) => setMergedCategory(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-foreground mb-1">
                      Preço (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={mergedPrice}
                      onChange={(e) => setMergedPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <span>Cor da Peça (Clique para definir a cor real do produto):</span>
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STORE_COLORS.map((col) => {
                      const active = mergedColors.some(
                        (c) => c.name.toLowerCase() === col.name.toLowerCase()
                      );
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => {
                            if (active && mergedColors.length > 1) {
                              setMergedColors(
                                mergedColors.filter(
                                  (c) => c.name.toLowerCase() !== col.name.toLowerCase()
                                )
                              );
                            } else if (!active) {
                              setMergedColors([{ name: col.name, hex: col.hex }]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] transition-all ${
                            active
                              ? 'bg-primary text-white border-primary font-bold shadow-sm scale-105'
                              : 'bg-card text-foreground border-border hover:bg-muted'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Unified Carousel Preview & Cover Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-foreground">
                      Ordem das Poses / Fotos no Carrossel ({mergedImages.length} mídias):
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      A foto <strong>#1 (Capa)</strong> aparece na vitrine e a <strong>#2 (Hover)</strong> aparece ao passar o mouse
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
                    {mergedImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden border-2 bg-card transition-all ${
                          idx === 0
                            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                            : idx === 1
                              ? 'border-amber-500/80 shadow-sm'
                              : 'border-border'
                        }`}
                      >
                        <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                          <ProductMediaView
                            src={img}
                            alt={`Pose ${idx + 1}`}
                            autoPlay={true}
                            muted={true}
                            showVideoBadge={isVideoMedia(img)}
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute top-1.5 left-1.5 z-10">
                            {idx === 0 ? (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1">
                                <Star className="w-2.5 h-2.5 fill-white" />
                                <span>#1 Capa</span>
                              </span>
                            ) : idx === 1 ? (
                              <span className="bg-amber-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow">
                                #2 Hover
                              </span>
                            ) : (
                              <span className="bg-black/75 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </span>
                            )}
                          </div>

                          {mergedImages.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 z-10 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center shadow hover:scale-110"
                              title="Remover esta foto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <div className="p-1.5 flex items-center justify-between gap-1 bg-card border-t border-border">
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 rounded hover:bg-muted disabled:opacity-25"
                            title="Mover para a esquerda"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>

                          {idx !== 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSetCoverImage(idx)}
                              className="px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-[9px] transition-colors truncate"
                            >
                              Tornar Capa
                            </button>
                          ) : (
                            <span className="text-[9px] font-bold text-emerald-600">Principal</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 1)}
                            disabled={idx === mergedImages.length - 1}
                            className="p-1 rounded hover:bg-muted disabled:opacity-25"
                            title="Mover para a direita"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-1">
                <p className="font-bold text-sm text-amber-800 dark:text-amber-200">
                  Selecione pelo menos 2 produtos na grade acima para agrupá-los em um só anúncio!
                </p>
                <p className="text-xs text-muted-foreground">
                  Dica: Você pode filtrar pela categoria (ex: Macaquinho) e clicar em "Selecionar Todos da Lista" ou clicar nas fotos desejadas.
                </p>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-secondary text-foreground font-semibold hover:bg-secondary/80"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={selectedProducts.length < 2 || isSaving}
                className="px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>
                  Confirmar e Transformar {selectedProducts.length >= 2 ? `${selectedProducts.length} Produtos` : ''} em 1 Só Produto
                </span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
