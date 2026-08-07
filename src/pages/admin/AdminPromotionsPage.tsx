import React, { useState } from 'react';
import {
  Plus,
  Sparkles,
  Trash2,
  Tag,
  Check,
  Search,
  Filter,
  Layers,
  ShoppingBag,
  Percent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  getPromotions,
  savePromotion,
  deletePromotion,
  getProducts,
  applyPromotionToProducts,
} from '../../lib/base44Client';
import { Promotion, Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(() => getPromotions());
  const [products] = useState<Product[]>(() => getProducts());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appliedSuccessMsg, setAppliedSuccessMsg] = useState('');

  // Form Target Selection: 'category' | 'products' | 'all'
  const [targetType, setTargetType] = useState<'category' | 'products' | 'all'>('category');
  const [selectedCategory, setSelectedCategory] = useState<string>('Leggings');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Form Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(20);
  const [badgeText, setBadgeText] = useState('20% OFF');
  const [applyImmediateDiscount, setApplyImmediateDiscount] = useState<boolean>(true);

  // Available categories extracted from current products
  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filtered products for target selection
  const filteredProductsForSelect = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase())
  );

  // Preview Affected Products
  const affectedProductsPreview = products.filter((p) => {
    if (targetType === 'all') return true;
    if (targetType === 'category') return p.category.toLowerCase() === selectedCategory.toLowerCase();
    if (targetType === 'products') return selectedProductIds.includes(p.id);
    return false;
  });

  const toggleSelectProduct = (id: string) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const handleSelectAllFiltered = () => {
    const ids = filteredProductsForSelect.map((p) => p.id);
    setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...ids])));
  };

  const handleClearSelected = () => {
    setSelectedProductIds([]);
  };

  const handleSavePromotion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Save Promotion entity
    const saved = savePromotion({
      title,
      description,
      discountPercentage,
      badgeText: badgeText || `${discountPercentage}% OFF`,
      category: targetType === 'category' ? selectedCategory : undefined,
      productIds: targetType === 'products' ? selectedProductIds : undefined,
      bannerUrl:
        'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    });

    // Optionally apply immediate discount to product catalog prices in base44Client
    let affectedCount = 0;
    if (applyImmediateDiscount) {
      affectedCount = applyPromotionToProducts(
        discountPercentage,
        targetType,
        selectedCategory,
        selectedProductIds
      );
    }

    setPromotions(getPromotions());
    setIsModalOpen(false);
    setAppliedSuccessMsg(
      `Promoção "${title}" criada com sucesso! Desconto de ${discountPercentage}% aplicado a ${affectedProductsPreview.length} produtos.`
    );
    setTimeout(() => setAppliedSuccessMsg(''), 5000);

    // Reset Form
    setTitle('');
    setDescription('');
    setSelectedProductIds([]);
  };

  const handleDelete = (id: string) => {
    deletePromotion(id);
    setPromotions(getPromotions());
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            Gestão Didática de Marketing
          </span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">
            Promoções & Descontos em Lote
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Crie campanhas promocionais por Categoria Inteira ou Seleção de Produtos com 1 clique.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-lg transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Criar Nova Promoção
        </button>
      </div>

      {/* Success Notification Alert */}
      {appliedSuccessMsg && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{appliedSuccessMsg}</span>
        </div>
      )}

      {/* List of Active Promotions */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" /> Campanhas Promocionais Cadastradas ({promotions.length})
        </h2>

        {promotions.length === 0 ? (
          <div className="bg-card border border-dashed border-border p-8 rounded-3xl text-center text-xs text-muted-foreground space-y-2">
            <Tag className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="font-semibold text-foreground">Nenhuma promoção ativa no momento.</p>
            <p>Clique em "Criar Nova Promoção" para aplicar descontos por categoria ou produtos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-sm">
                      {promo.badgeText}
                    </span>
                    <button
                      onClick={() => handleDelete(promo.id)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                      title="Excluir Promoção"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-lg text-foreground">{promo.title}</h3>
                    {promo.description && (
                      <p className="text-xs text-muted-foreground mt-1">{promo.description}</p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Desconto Aplicado:</span>
                    <strong className="text-primary font-bold">{promo.discountPercentage}% OFF</strong>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Alvo da Promoção:</span>
                    <span className="font-semibold text-foreground">
                      {promo.category ? `Categoria: ${promo.category}` : promo.productIds ? `${promo.productIds.length} Produtos` : 'Toda a Loja'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL CREATION WORKFLOW */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSavePromotion}
            className="bg-card border border-border p-6 sm:p-8 rounded-3xl w-full max-w-3xl space-y-6 text-xs max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="border-b border-border pb-4 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Criar Nova Campanha
                </span>
                <h3 className="font-serif font-bold text-2xl text-foreground">
                  Configurar Promoção & Desconto Didático
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground font-bold text-base px-2"
              >
                ✕
              </button>
            </div>

            {/* PASSO 1: Selecionar Alvo da Promoção */}
            <div className="space-y-3 bg-muted/30 p-4 rounded-2xl border border-border">
              <label className="font-bold text-sm text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Passo 1: Onde aplicar a promoção?
              </label>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTargetType('category')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'category'
                      ? 'border-primary bg-primary/10 font-bold text-primary ring-2 ring-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Filter className="w-4 h-4 mx-auto mb-1" />
                  <span>Por Categoria</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('products')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'products'
                      ? 'border-primary bg-primary/10 font-bold text-primary ring-2 ring-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 mx-auto mb-1" />
                  <span>Produtos Específicos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTargetType('all')}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    targetType === 'all'
                      ? 'border-primary bg-primary/10 font-bold text-primary ring-2 ring-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 mx-auto mb-1" />
                  <span>Toda a Loja</span>
                </button>
              </div>

              {/* Dynamic Target Input */}
              {targetType === 'category' && (
                <div className="pt-2">
                  <label className="block font-semibold mb-1">Selecione a Categoria Alvo:</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 font-bold text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        Categoria: {cat.toUpperCase()} ({products.filter((p) => p.category === cat).length} produtos)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === 'products' && (
                <div className="pt-2 space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold">
                      Selecione os Produtos ({selectedProductIds.length} selecionados):
                    </label>
                    <div className="flex gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-primary font-bold hover:underline"
                      >
                        Marcar Todos
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        type="button"
                        onClick={handleClearSelected}
                        className="text-muted-foreground hover:underline"
                      >
                        Desmarcar Todos
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar produto por nome ou SKU..."
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs outline-none"
                    />
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-background">
                    {filteredProductsForSelect.map((prod) => (
                      <label
                        key={prod.id}
                        className="flex items-center justify-between p-2.5 hover:bg-muted/40 cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedProductIds.includes(prod.id)}
                            onChange={() => toggleSelectProduct(prod.id)}
                            className="accent-primary"
                          />
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            className="w-8 h-10 object-cover rounded-md border border-border"
                          />
                          <div>
                            <span className="font-semibold text-foreground block">{prod.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {prod.category} • {formatCurrency(prod.price)}
                            </span>
                          </div>
                        </div>
                        {selectedProductIds.includes(prod.id) && (
                          <Check className="w-4 h-4 text-primary font-bold" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* PASSO 2: Regra de Desconto e Informações */}
            <div className="space-y-4">
              <label className="font-bold text-sm text-foreground flex items-center gap-2 border-b border-border pb-2">
                <Percent className="w-4 h-4 text-primary" /> Passo 2: Regra do Desconto & Campanha
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Título da Campanha *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Semana do Legging 20% OFF"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Texto do Selo / Badge</label>
                  <input
                    type="text"
                    placeholder="Ex: 20% OFF, BLACK FRIDAY"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Desconto a Aplicar (%) *</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="5"
                      max="70"
                      step="5"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <span className="font-serif font-bold text-base text-primary bg-primary/10 px-3 py-1 rounded-xl">
                      {discountPercentage}%
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Descrição Curta</label>
                  <input
                    type="text"
                    placeholder="Ex: Ofertas imperdíveis na coleção fitness"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* PASSO 3: Pré-visualização Simulação em Tempo Real */}
            <div className="space-y-3 bg-muted/40 p-4 rounded-2xl border border-border">
              <label className="font-bold text-xs text-foreground flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" /> Pré-visualização dos Produtos Afetados ({affectedProductsPreview.length})
                </span>
                <span className="text-primary font-bold">-{discountPercentage}% de Desconto</span>
              </label>

              {affectedProductsPreview.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  Nenhum produto selecionado para aplicar o desconto.
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                  {affectedProductsPreview.slice(0, 5).map((p) => {
                    const simPrice = Math.round(p.price * (1 - discountPercentage / 100) * 100) / 100;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-card border border-border text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <img src={p.images[0]} alt={p.name} className="w-7 h-9 object-cover rounded-md" />
                          <div>
                            <span className="font-semibold text-foreground block">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">{p.category}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-muted-foreground line-through block text-[10px]">
                            {formatCurrency(p.price)}
                          </span>
                          <span className="font-serif font-bold text-emerald-600">
                            {formatCurrency(simPrice)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {affectedProductsPreview.length > 5 && (
                    <span className="text-[10px] text-muted-foreground text-center block pt-1">
                      + e mais {affectedProductsPreview.length - 5} produtos nesta categoria
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 bg-secondary text-foreground font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={affectedProductsPreview.length === 0}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Aplicar Promoção aos {affectedProductsPreview.length} Produtos</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
