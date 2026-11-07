import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Move,
  Table,
  Layers,
  Palette,
  CheckCircle2,
  HelpCircle,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getProducts,
  saveProduct,
  deleteProduct,
  aiGenerateProductDescription,
  aiGenerateSeoMeta,
} from '../../lib/dataClient';
import { formatCurrency } from '../../lib/utils';
import { Product, ProductColor } from '../../types';
import { ProductImporterModal } from '../../components/admin/ProductImporterModal';
import {
  classifyProduct,
  STORE_CATEGORIES,
  STORE_COLORS,
  AvailableColor,
} from '../../lib/productClassifier';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'visual'>('table');
  const [organizeMode, setOrganizeMode] = useState<'category' | 'color'>('category');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');

  // Drag & Drop Feedback States
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [activeHoverZone, setActiveHoverZone] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filtered List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'todos' || p.category === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleOpenNewModal = () => {
    setEditingProduct({
      name: '',
      category: 'Leggings',
      price: 149.9,
      promotionalPrice: 129.9,
      sku: `AUR-${Date.now().toString().slice(-4)}`,
      barcode: '7891234560000',
      weight: 250,
      brand: 'Aura Fitness',
      description: '',
      fullDescription: '',
      images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80'],
      sizes: ['P', 'M', 'G', 'GG'],
      colors: [{ name: 'Preto', hex: '#111111' }],
      materials: ['Poliamida', 'Elastano'],
      stock: { 'P-Preto': 10, 'M-Preto': 15, 'G-Preto': 10, 'GG-Preto': 5 },
      isFeatured: true,
      isNewArrival: true,
      isBestSeller: false,
      isActive: true,
      seo: { title: '', description: '', keywords: [] },
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      deleteProduct(id);
      setProducts(getProducts());
      showToast('Produto excluído com sucesso.');
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    saveProduct(editingProduct);
    setProducts(getProducts());
    setIsModalOpen(false);
    setEditingProduct(null);
    showToast(`✓ Produto "${editingProduct.name}" salvo com sucesso!`);
  };

  // AI Assistant Integration: Generate Product Description & SEO
  const handleGenerateAiDescription = async () => {
    if (!editingProduct?.name) {
      alert('Digite primeiro o nome do produto para a IA gerar a descrição.');
      return;
    }

    setIsAiLoading(true);
    try {
      const res = await aiGenerateProductDescription(
        editingProduct.name,
        editingProduct.category || 'Leggings',
        'Cós alto anatômico, tecnologia de alta compressão, zero transparência e efeito modelador.'
      );

      const seoRes = await aiGenerateSeoMeta(editingProduct.name, res.shortDescription);

      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              description: res.shortDescription,
              fullDescription: res.fullDescription,
              seo: {
                title: seoRes.seoTitle,
                description: seoRes.seoDescription,
                keywords: seoRes.keywords,
              },
            }
          : null
      );
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Drag & Drop Handler (Works on both Desktop Mouse and Smartphone Touch)
  const handleDropProduct = (product: Product, clientX: number, clientY: number) => {
    setDraggedProduct(null);
    setActiveHoverZone(null);

    const targetEl = document.elementFromPoint(clientX, clientY);
    const dropZone = targetEl?.closest('[data-drop-zone="true"]') as HTMLElement | null;

    if (!dropZone) return;

    const dropType = dropZone.getAttribute('data-drop-type');
    const dropValue = dropZone.getAttribute('data-drop-value');

    if (!dropValue) return;

    if (dropType === 'category') {
      if (product.category === dropValue) {
        showToast(`O produto já pertence à categoria "${dropValue}".`);
        return;
      }
      const updated = { ...product, category: dropValue };
      saveProduct(updated);
      setProducts(getProducts());
      showToast(`✓ "${product.name}" associado à categoria "${dropValue}"!`);
    } else if (dropType === 'color') {
      const colorObj =
        STORE_COLORS.find((c) => c.name === dropValue) || { name: dropValue, hex: '#111111' };
      const alreadyHas = product.colors?.some(
        (c) => c.name.toLowerCase() === dropValue.toLowerCase()
      );

      if (alreadyHas) {
        showToast(`"${product.name}" já possui a cor "${dropValue}".`);
        return;
      }

      const updatedColors: ProductColor[] = [
        ...(product.colors || []),
        { name: colorObj.name, hex: colorObj.hex },
      ];

      // Add default stock for new color
      const newStock = { ...product.stock };
      ['P', 'M', 'G'].forEach((sz) => {
        newStock[`${sz}-${colorObj.name}`] = 10;
      });

      const updated = { ...product, colors: updatedColors, stock: newStock };
      saveProduct(updated);
      setProducts(getProducts());
      showToast(`✓ Cor "${dropValue}" associada a "${product.name}"!`);
    }
  };

  // Quick Action: Associate Category / Color directly with 1 tap (mobile shortcut)
  const handleQuickAssociateCategory = (product: Product, categoryName: string) => {
    const updated = { ...product, category: categoryName };
    saveProduct(updated);
    setProducts(getProducts());
    showToast(`✓ "${product.name}" associado à categoria "${categoryName}"!`);
  };

  const handleQuickAssociateColor = (product: Product, color: AvailableColor) => {
    const alreadyHas = product.colors?.some(
      (c) => c.name.toLowerCase() === color.name.toLowerCase()
    );
    if (alreadyHas) {
      showToast(`O produto já possui a cor "${color.name}".`);
      return;
    }
    const updatedColors = [...(product.colors || []), { name: color.name, hex: color.hex }];
    const newStock = { ...product.stock };
    ['P', 'M', 'G'].forEach((sz) => {
      newStock[`${sz}-${color.name}`] = 10;
    });
    const updated = { ...product, colors: updatedColors, stock: newStock };
    saveProduct(updated);
    setProducts(getProducts());
    showToast(`✓ Cor "${color.name}" adicionada a "${product.name}"!`);
  };

  // Real-time classification calculation for editing modal
  const modalClassification = editingProduct?.name
    ? classifyProduct(editingProduct.name, editingProduct.description)
    : null;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Catálogo</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Produtos & Variações</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reconhecimento inteligente por cor, categoria e conjunto, com organizador visual por arrastar e soltar (Mouse & Touch).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setIsImporterOpen(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Importar Tabela / Fotos</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3 px-5 rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Toggle Mode: Tabela vs Organizador Visual */}
        <div className="inline-flex p-1 bg-muted rounded-2xl border border-border">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Modo Tabela</span>
          </button>

          <button
            onClick={() => setViewMode('visual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'visual'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Move className="w-4 h-4" />
            <span>Organizador Visual (Arrastar)</span>
            <span className="bg-accent text-slate-950 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
              Mouse & Touch
            </span>
          </button>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU ou cor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <select
            value={selectedCategoryFilter}
            onChange={(e) => setSelectedCategoryFilter(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold text-foreground outline-none"
          >
            <option value="todos">Todas as Categorias</option>
            {STORE_CATEGORIES.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODO 1: ORGANIZADOR VISUAL (DRAG & DROP PARA MOUSE E SMARTPHONE) */}
      {/* ============================================================== */}
      {viewMode === 'visual' && (
        <div className="space-y-6">
          {/* Instrução e seletor de alvo (Categorias vs Cores) */}
          <div className="bg-card border-2 border-primary/20 p-4 sm:p-6 rounded-3xl space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <Move className="w-5 h-5 text-primary" />
                  <span>Zonas de Associação (Alvos de Arraste)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Arraste qualquer produto com o <strong>mouse</strong> no computador ou com o{' '}
                  <strong>dedo (touch)</strong> no celular e solte dentro do alvo desejado.
                </p>
              </div>

              {/* Sub-toggle: Categorias vs Cores */}
              <div className="inline-flex p-1 bg-muted rounded-xl self-start sm:self-auto text-xs font-bold">
                <button
                  onClick={() => setOrganizeMode('category')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    organizeMode === 'category'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Categorias</span>
                </button>
                <button
                  onClick={() => setOrganizeMode('color')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                    organizeMode === 'color'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Cores</span>
                </button>
              </div>
            </div>

            {/* DROP ZONES: CATEGORIAS */}
            {organizeMode === 'category' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {STORE_CATEGORIES.map((cat) => {
                  const count = products.filter((p) => p.category === cat.name).length;
                  return (
                    <div
                      key={cat.name}
                      data-drop-zone="true"
                      data-drop-type="category"
                      data-drop-value={cat.name}
                      className="p-3.5 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-background/80 hover:bg-primary/5 transition-all flex flex-col justify-between gap-2 text-center group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground group-hover:text-primary">
                          Alvo Categoria
                        </span>
                        <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {count} itens
                        </span>
                      </div>
                      <div className="font-serif font-bold text-sm text-foreground group-hover:text-primary">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground border-t border-border/50 pt-1">
                        Solte o produto aqui ⬇
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* DROP ZONES: CORES */}
            {organizeMode === 'color' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 pt-2">
                {STORE_COLORS.map((color) => {
                  const count = products.filter((p) =>
                    p.colors?.some((c) => c.name.toLowerCase() === color.name.toLowerCase())
                  ).length;
                  return (
                    <div
                      key={color.name}
                      data-drop-zone="true"
                      data-drop-type="color"
                      data-drop-value={color.name}
                      className="p-2.5 rounded-2xl border-2 border-dashed border-border hover:border-primary bg-background/80 hover:bg-primary/5 transition-all flex flex-col items-center text-center gap-1.5 group cursor-pointer"
                    >
                      <div
                        className="w-7 h-7 rounded-full border-2 border-black/20 shadow-md transition-transform group-hover:scale-110"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="text-xs font-bold text-foreground leading-tight">
                        {color.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        {count} prods
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GRID DE PRODUTOS ARRASTÁVEIS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif font-bold text-foreground text-sm flex items-center gap-1.5">
                <span>Produtos no Catálogo ({filteredProducts.length})</span>
              </h4>
              <span className="text-xs text-muted-foreground">
                Toque e arraste o card para o alvo desejado no topo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((prod) => (
                <motion.div
                  key={prod.id}
                  layout
                  drag
                  dragSnapToOrigin
                  whileDrag={{
                    scale: 1.05,
                    zIndex: 100,
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                    cursor: 'grabbing',
                  }}
                  dragTransition={{ bounceStiffness: 600, bounceDamping: 25 }}
                  onDragStart={() => setDraggedProduct(prod)}
                  onDragEnd={(_e, info) => handleDropProduct(prod, info.point.x, info.point.y)}
                  className="touch-none select-none bg-card border-2 border-border hover:border-primary/50 rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between gap-3 relative group"
                >
                  <div className="space-y-2.5">
                    {/* Imagem e Badge de Categoria */}
                    <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                      <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                        {prod.category}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                        {formatCurrency(prod.promotionalPrice || prod.price)}
                      </span>
                    </div>

                    {/* Nome do Produto */}
                    <div>
                      <h4 className="font-serif font-bold text-xs text-foreground line-clamp-1">
                        {prod.name}
                      </h4>
                      <span className="text-[10px] font-mono text-muted-foreground">{prod.sku}</span>
                    </div>

                    {/* Cores Atuais */}
                    <div className="flex items-center gap-1 flex-wrap">
                      {prod.colors?.map((c, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded-md"
                          title={c.name}
                        >
                          <span
                            className="w-2 h-2 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="truncate max-w-[65px]">{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Arraste & Ações Rápidas de Toque */}
                  <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-primary group-hover:text-primary-hover">
                      <Move className="w-3.5 h-3.5 shrink-0" />
                      <span>Arraste para o alvo ⬆</span>
                    </div>

                    {/* Botão de toque rápido (atalho para celular sem arraste) */}
                    <div className="relative">
                      <select
                        onChange={(e) => {
                          if (e.target.value.startsWith('cat:')) {
                            handleQuickAssociateCategory(prod, e.target.value.replace('cat:', ''));
                          } else if (e.target.value.startsWith('col:')) {
                            const found = STORE_COLORS.find(
                              (c) => c.name === e.target.value.replace('col:', '')
                            );
                            if (found) handleQuickAssociateColor(prod, found);
                          }
                          e.target.value = '';
                        }}
                        defaultValue=""
                        className="bg-muted hover:bg-muted/80 text-foreground text-[10px] font-bold px-2 py-1 rounded-lg border border-border outline-none cursor-pointer"
                        title="Atalho de Toque Rápido"
                      >
                        <option value="" disabled>
                          + Mover rápido
                        </option>
                        <optgroup label="Associar Categoria">
                          {STORE_CATEGORIES.map((cat) => (
                            <option key={`cat-${cat.name}`} value={`cat:${cat.name}`}>
                              {cat.name}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Adicionar Cor">
                          {STORE_COLORS.map((col) => (
                            <option key={`col-${col.name}`} value={`col:${col.name}`}>
                              {col.name}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODO 2: TABELA CLÁSSICA COMPLETA DE PRODUTOS                    */}
      {/* ============================================================== */}
      {viewMode === 'table' && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
                <tr>
                  <th className="p-3.5">Imagem</th>
                  <th className="p-3.5">Produto</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Cores Ativas</th>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Preço</th>
                  <th className="p-3.5">Estoque</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map((prod) => {
                  const totalStock = Object.values(prod.stock || {}).reduce((a, b) => a + b, 0);
                  return (
                    <tr key={prod.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3.5">
                        <img
                          src={prod.images[0]}
                          alt={prod.name}
                          className="w-10 h-12 object-cover rounded-lg border border-border"
                        />
                      </td>
                      <td className="p-3.5">
                        <span className="font-serif font-bold text-sm text-foreground block">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Avaliações: {prod.rating} ★ ({prod.reviewCount})
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-primary">{prod.category}</td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                          {prod.colors?.map((col, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 text-[10px] bg-background border border-border px-1.5 py-0.5 rounded-md"
                            >
                              <span
                                className="w-2 h-2 rounded-full border border-black/20"
                                style={{ backgroundColor: col.hex }}
                              />
                              <span className="truncate max-w-[70px]">{col.name}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-muted-foreground">{prod.sku}</td>
                      <td className="p-3.5">
                        {prod.promotionalPrice ? (
                          <div>
                            <span className="font-serif font-bold text-primary block">
                              {formatCurrency(prod.promotionalPrice)}
                            </span>
                            <span className="text-[10px] text-muted-foreground line-through">
                              {formatCurrency(prod.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-serif font-bold text-foreground">
                            {formatCurrency(prod.price)}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-bold ${
                            totalStock === 0 ? 'text-destructive' : 'text-foreground'
                          }`}
                        >
                          {totalStock} un.
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {prod.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          onClick={() => handleEdit(prod)}
                          className="p-1.5 hover:bg-muted text-foreground rounded-lg"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id)}
                          className="p-1.5 hover:bg-muted text-destructive rounded-lg"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL DE CADASTRO E EDIÇÃO COM RECONHECIMENTO DE PADRÕES POR NOME */}
      {/* ============================================================== */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-3xl rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">
                  Catálogo Aura Fitness
                </span>
                <h3 className="font-serif font-bold text-xl text-foreground">
                  {editingProduct.id ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              {/* Nome do Produto com Reconhecimento em Tempo Real */}
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Nome do Produto * (ex: Conjunto Top e Legging Style Black)
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Digite o nome do produto..."
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                />

                {/* Banner de Reconhecimento Automático de Padrões */}
                {modalClassification && editingProduct.name && editingProduct.name.length >= 3 && (
                  <div className="mt-2.5 p-3.5 bg-primary/10 border border-primary/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-accent animate-pulse" />
                        Padrões Detectados Automaticamente pelo Nome:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct({
                            ...editingProduct,
                            category: modalClassification.category,
                            colors: modalClassification.colors,
                          });
                          showToast('✓ Padrões de categoria e cores aplicados ao produto!');
                        }}
                        className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1 rounded-lg shadow-sm transition-colors"
                      >
                        ✨ Aplicar Padrões no Produto
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      <span className="text-muted-foreground">Categoria detectada:</span>
                      <span className="bg-background font-bold text-foreground px-2 py-0.5 rounded-lg border border-border">
                        {modalClassification.category}
                      </span>

                      {modalClassification.isSet && (
                        <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-lg border border-purple-300">
                          👗 Conjunto Identificado
                        </span>
                      )}

                      <span className="text-muted-foreground ml-2">Cores detectadas:</span>
                      {modalClassification.colors.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 bg-background font-semibold px-2 py-0.5 rounded-lg border border-border"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Categorias & Cores */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Categoria *</label>
                  <select
                    value={editingProduct.category || 'Leggings'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                  >
                    {STORE_CATEGORIES.map((cat) => (
                      <option key={cat.name} value={cat.name}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              {/* Seletor Rápido de Cores Disponíveis */}
              <div className="p-3 bg-muted/30 border border-border rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-primary" />
                    <span>Cores Associadas a este Produto:</span>
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Clique abaixo para ativar ou desativar cores
                  </span>
                </div>

                {/* Cores ativas */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {editingProduct.colors && editingProduct.colors.length > 0 ? (
                    editingProduct.colors.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-xl border border-primary/30"
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newCols = editingProduct.colors?.filter((_, idx) => idx !== i);
                            setEditingProduct({ ...editingProduct, colors: newCols });
                          }}
                          className="hover:text-destructive ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground italic">Nenhuma cor selecionada.</span>
                  )}
                </div>

                {/* Paleta rápida de cores da AuraFitness */}
                <div className="pt-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground block mb-1">
                    Adicionar cor rápida com 1 clique:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {STORE_COLORS.map((col) => {
                      const isSelected = editingProduct.colors?.some(
                        (c) => c.name.toLowerCase() === col.name.toLowerCase()
                      );
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditingProduct({
                                ...editingProduct,
                                colors: editingProduct.colors?.filter((c) => c.name !== col.name),
                              });
                            } else {
                              setEditingProduct({
                                ...editingProduct,
                                colors: [
                                  ...(editingProduct.colors || []),
                                  { name: col.name, hex: col.hex },
                                ],
                              });
                            }
                          }}
                          className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                            isSelected
                              ? 'bg-primary text-white border-primary font-bold'
                              : 'bg-background hover:bg-muted text-foreground border-border'
                          }`}
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: col.hex }}
                          />
                          <span>{col.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Preços e Fotos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">Preço De (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.price || 0}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Preço Promocional (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.promotionalPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        promotionalPrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">URL da Imagem</label>
                  <input
                    type="text"
                    value={editingProduct.images?.[0] || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, images: [e.target.value] })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Descrições */}
              <div>
                <label className="block font-semibold text-foreground mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none resize-none"
                />
              </div>

              {/* Assistente IA */}
              <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-primary flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-accent" /> Assistente de Descrição IA
                  </h5>
                  <p className="text-[10px] text-muted-foreground">
                    Gera texto técnico e palavras-chave de SEO automaticamente para o nome digitado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAiDescription}
                  disabled={isAiLoading}
                  className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {isAiLoading ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isFeatured || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <span>Produto em Destaque</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isNewArrival || false}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <span>Novidade</span>
                </label>

                <label className="flex items-center gap-2 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive ?? true}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, isActive: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  <span>Ativo na Loja</span>
                </label>
              </div>

              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Importer Modal */}
      <ProductImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={() => {
          setProducts(getProducts());
          showToast('✓ Importação de produtos processada com sucesso!');
        }}
      />
    </div>
  );
};
