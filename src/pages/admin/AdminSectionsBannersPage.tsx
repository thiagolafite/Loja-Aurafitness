import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Eye,
  Upload,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Move,
  ShoppingBag,
  SlidersHorizontal,
  FolderTree,
  Tag,
  Star,
  Flame,
  Sun,
  LayoutGrid,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getStoreSections,
  saveStoreSection,
  deleteStoreSection,
  addProductToSection,
  removeProductFromSection,
  addCategoryProductsToSection,
  getHeroBanners,
  saveHeroBanner,
  deleteHeroBanner,
  reorderHeroBanners,
  getProducts,
} from '../../lib/dataClient';
import { getStoredCategories, resizeImageFile, normalizeCategoryName } from '../../lib/productClassifier';
import { Product, StoreSection, HeroBannerSlide } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const AdminSectionsBannersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sections' | 'banners'>('sections');

  // Products & Categories
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const categories = getStoredCategories();

  // Sections State
  const [sections, setSections] = useState<StoreSection[]>(() => getStoreSections());
  const [selectedSectionId, setSelectedSectionId] = useState<string>(() => {
    const list = getStoreSections();
    return list[0]?.id || '';
  });

  // Section Modal & Editing State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<Partial<StoreSection> | null>(null);

  // Search & Filters for Catalog selection inside Section Manager
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');
  const [draggedProductId, setDraggedProductId] = useState<string | null>(null);
  const [isDragOverZone, setIsDragOverZone] = useState(false);

  // Banners State
  const [banners, setBanners] = useState<HeroBannerSlide[]>(() => getHeroBanners());
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HeroBannerSlide> | null>(null);
  const [isUploadingBannerLeft, setIsUploadingBannerLeft] = useState(false);
  const [isUploadingBannerRight, setIsUploadingBannerRight] = useState(false);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Sync data on events
  useEffect(() => {
    const syncSections = () => setSections(getStoreSections());
    const syncBanners = () => setBanners(getHeroBanners());
    window.addEventListener('aura_sections_updated', syncSections);
    window.addEventListener('aura_banners_updated', syncBanners);
    return () => {
      window.removeEventListener('aura_sections_updated', syncSections);
      window.removeEventListener('aura_banners_updated', syncBanners);
    };
  }, []);

  const activeSection = sections.find((s) => s.id === selectedSectionId) || sections[0];

  // Products belonging to the active section
  const sectionProducts = (activeSection?.productIds || [])
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  // Catalog products available for selection
  const catalogProducts = products.filter((p) => {
    const matchesSearch =
      !productSearchQuery.trim() ||
      p.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearchQuery.toLowerCase());

    const matchesCategory =
      selectedCategoryFilter === 'todos' ||
      normalizeCategoryName(p.category) === normalizeCategoryName(selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  // ==========================================
  // SECTION HANDLERS
  // ==========================================
  const handleOpenNewSectionModal = () => {
    setEditingSection({
      name: '',
      badge: '☀️ DESTAQUE',
      description: '',
      showInMenu: true,
      showInHome: true,
      active: true,
      productIds: [],
      includedCategories: [],
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSectionModal = (sec: StoreSection) => {
    setEditingSection({ ...sec });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection || !editingSection.name?.trim()) return;

    const saved = saveStoreSection(editingSection);
    setSections(getStoreSections());
    setSelectedSectionId(saved.id);
    setIsSectionModalOpen(false);
    setEditingSection(null);
    showToast(`Seção "${saved.name}" salva com sucesso!`);
  };

  const handleDeleteSection = (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a seção "${name}"?`)) {
      deleteStoreSection(id);
      const remaining = getStoreSections();
      setSections(remaining);
      if (selectedSectionId === id) {
        setSelectedSectionId(remaining[0]?.id || '');
      }
      showToast(`Seção "${name}" excluída.`);
    }
  };

  const handleAddProduct = (productId: string) => {
    if (!activeSection) return;
    const updated = addProductToSection(activeSection.id, productId);
    if (updated) {
      setSections(getStoreSections());
      showToast('Produto adicionado à seção!');
    }
  };

  const handleRemoveProduct = (productId: string) => {
    if (!activeSection) return;
    removeProductFromSection(activeSection.id, productId);
    setSections(getStoreSections());
    showToast('Produto removido da seção.');
  };

  const handleAddCategoryInBulk = (categoryName: string) => {
    if (!activeSection) return;
    addCategoryProductsToSection(activeSection.id, categoryName);
    setSections(getStoreSections());
    showToast(`Todos os itens de "${categoryName}" foram incluídos na seção!`);
  };

  const handleAddAllFilteredProducts = () => {
    if (!activeSection || catalogProducts.length === 0) return;
    catalogProducts.forEach((p) => {
      addProductToSection(activeSection.id, p.id);
    });
    setSections(getStoreSections());
    showToast(`${catalogProducts.length} produtos adicionados à seção!`);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, productId: string) => {
    setDraggedProductId(productId);
    e.dataTransfer.setData('text/plain', productId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverZone(true);
  };

  const handleDragLeave = () => {
    setIsDragOverZone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverZone(false);
    const productId = e.dataTransfer.getData('text/plain') || draggedProductId;
    if (productId && activeSection) {
      handleAddProduct(productId);
    }
    setDraggedProductId(null);
  };

  // ==========================================
  // BANNER HANDLERS
  // ==========================================
  const handleOpenNewBannerModal = () => {
    setEditingBanner({
      badge: 'NOVA COLEÇÃO',
      title: 'AURA FITNESS',
      subtitle: 'Peças em compressão inteligente e zero transparência',
      buttonText: 'CONFERIR COLEÇÃO',
      link: '/catalogo',
      leftImage: '/images/look-3214.png',
      rightImage: '/images/macaco-bless.png',
      centerBgColor: '#163923',
      active: true,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBannerModal = (banner: HeroBannerSlide) => {
    setEditingBanner({ ...banner });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title?.trim()) return;

    saveHeroBanner(editingBanner);
    setBanners(getHeroBanners());
    setIsBannerModalOpen(false);
    setEditingBanner(null);
    showToast('Banner salvo com sucesso!');
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm('Excluir este banner do carrossel principal?')) {
      deleteHeroBanner(id);
      setBanners(getHeroBanners());
      showToast('Banner excluído.');
    }
  };

  const handleMoveBanner = (index: number, direction: -1 | 1) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= banners.length) return;
    const reordered = [...banners];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIdx, 0, moved);
    reorderHeroBanners(reordered);
    setBanners(reordered);
  };

  const handleUploadBannerFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'left' | 'right'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editingBanner) return;

    if (side === 'left') setIsUploadingBannerLeft(true);
    else setIsUploadingBannerRight(true);

    try {
      const dataUrl = await resizeImageFile(file, 1200, 1500, 0.88);
      if (side === 'left') {
        setEditingBanner({ ...editingBanner, leftImage: dataUrl });
      } else {
        setEditingBanner({ ...editingBanner, rightImage: dataUrl });
      }
      showToast(`Foto ${side === 'left' ? 'esquerda' : 'direita'} atualizada!`);
    } catch (err) {
      alert('Erro ao processar imagem.');
    } finally {
      if (side === 'left') setIsUploadingBannerLeft(false);
      else setIsUploadingBannerRight(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#142318] border border-emerald-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="font-serif font-bold text-2xl text-foreground">
              Seções de Exposição & Banners da Loja
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Crie seções como <strong>Moda Verão</strong> ou <strong>Black Friday</strong>, mova
            produtos por categoria ou arrastando, e gerencie as fotos do banner principal.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('sections')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'sections'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Seções da Loja & Menus</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'banners'
                ? 'bg-primary text-white shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Banners do Carrossel Principal</span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* ABA 1: SEÇÕES DA LOJA & MENUS (MODA VERÃO, BLACK FRIDAY, ETC.)         */}
      {/* ===================================================================== */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          {/* Top Bar with Sections Pills & Create Button */}
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                  <span>Seções em Exposição na Loja</span>
                  <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    {sections.length} ativas
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Selecione uma seção abaixo para gerenciar seus produtos ou crie uma nova seção para
                  expor na vitrine e nos menus.
                </p>
              </div>

              <button
                onClick={handleOpenNewSectionModal}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>+ Criar Nova Seção da Loja</span>
              </button>
            </div>

            {/* Sections Pills List */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
              {sections.map((sec) => {
                const isSelected = sec.id === selectedSectionId;
                const count = sec.productIds?.length || 0;

                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs cursor-pointer select-none transition-all shrink-0 ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-lg scale-102 font-bold'
                        : 'bg-muted/30 hover:bg-muted/70 text-foreground border-border'
                    }`}
                  >
                    <span className="text-sm">{sec.badge?.slice(0, 2) || '🏷️'}</span>
                    <span className="tracking-wide">{sec.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {count} peças
                    </span>

                    {/* Small Edit Button on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditSectionModal(sec);
                      }}
                      className="p-1 rounded-md hover:bg-black/10 ml-1"
                      title="Configurar Seção"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Section Info Bar */}
          {activeSection && (
            <div className="bg-muted/30 border border-border rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full">
                    {activeSection.badge || 'DESTAQUE'}
                  </span>
                  <h2 className="font-serif font-bold text-xl text-foreground">
                    {activeSection.name}
                  </h2>
                  {activeSection.showInMenu && (
                    <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ No Menu da Loja
                    </span>
                  )}
                  {activeSection.showInHome && (
                    <span className="bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Na Home da Loja
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {activeSection.description || 'Arraste produtos ou adicione por categoria inteira.'}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  to={`/catalogo?secao=${encodeURIComponent(activeSection.slug)}`}
                  target="_blank"
                  className="bg-card hover:bg-muted text-foreground border border-border px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Ver como os clientes vêem essa seção na loja"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Ver na Loja</span>
                </Link>
                <button
                  onClick={() => handleOpenEditSectionModal(activeSection)}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Editar Seção</span>
                </button>
                {sections.length > 1 && (
                  <button
                    onClick={() => handleDeleteSection(activeSection.id, activeSection.name)}
                    className="p-2 rounded-xl text-destructive hover:bg-destructive/10 transition-colors"
                    title="Excluir Seção"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TWO-COLUMN WORKSPACE: LEFT = CATALOG / RIGHT = SECTION DROP ZONE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* COLUMN 1: CATALOG OF PRODUCTS & CONJUNTOS (7 COLS) */}
            <div className="lg:col-span-6 bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div>
                  <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <span>Catálogo de Produtos & Conjuntos</span>
                  </h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Arraste o card ou clique em <strong>+ Incluir</strong> para colocar na seção.
                  </p>
                </div>

                {/* Bulk Actions Button */}
                {selectedCategoryFilter !== 'todos' && (
                  <button
                    onClick={() => handleAddCategoryInBulk(selectedCategoryFilter)}
                    className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 self-start sm:self-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Incluir Todos os "{selectedCategoryFilter}"</span>
                  </button>
                )}
              </div>

              {/* Filters & Search */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou SKU..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="relative">
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="todos">Todas as Categorias</option>
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Category Buttons for 1-Click Inclusion */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                <span className="text-muted-foreground font-semibold shrink-0">Atalho:</span>
                <button
                  onClick={() => handleAddCategoryInBulk('Conjuntos')}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold px-2 py-1 rounded-lg transition-colors shrink-0"
                >
                  + Todos os Conjuntos
                </button>
                <button
                  onClick={() => handleAddCategoryInBulk('Macacões')}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold px-2 py-1 rounded-lg transition-colors shrink-0"
                >
                  + Todos os Macacões
                </button>
                <button
                  onClick={() => handleAddCategoryInBulk('Leggings')}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary font-bold px-2 py-1 rounded-lg transition-colors shrink-0"
                >
                  + Todas as Leggings
                </button>
              </div>

              {/* Catalog Products List */}
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
                {catalogProducts.map((p) => {
                  const isAlreadyInSection = activeSection?.productIds?.includes(p.id);

                  return (
                    <div
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 select-none cursor-grab active:cursor-grabbing ${
                        isAlreadyInSection
                          ? 'bg-muted/40 border-emerald-500/30 opacity-75'
                          : 'bg-card hover:bg-muted/30 border-border hover:border-primary/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-muted shrink-0 relative">
                          <img
                            src={p.images[0] || '/images/look-3103.png'}
                            alt={p.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-primary block uppercase">
                            {p.category}
                          </span>
                          <h5 className="font-semibold text-xs text-foreground truncate">
                            {p.name}
                          </h5>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                            <span className="font-bold text-foreground">
                              {formatCurrency(p.promotionalPrice || p.price)}
                            </span>
                            <span>• SKU: {p.sku}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAlreadyInSection ? (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Incluso</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAddProduct(p.id)}
                            className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Incluir</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {catalogProducts.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground text-xs">
                    Nenhum produto encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: SECTION DROP ZONE & INCLUDED PRODUCTS (6 COLS) */}
            <div className="lg:col-span-6 space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`bg-card border-2 rounded-3xl p-5 shadow-sm space-y-4 transition-all min-h-[480px] ${
                  isDragOverZone
                    ? 'border-emerald-500 bg-emerald-500/5 ring-4 ring-emerald-500/20'
                    : 'border-dashed border-primary/30'
                }`}
              >
                {/* Drop Zone Header */}
                <div className="flex items-center justify-between border-b border-border/70 pb-3">
                  <div>
                    <h4 className="font-serif font-bold text-sm text-foreground flex items-center gap-2">
                      <Move className="w-4 h-4 text-emerald-600" />
                      <span>Produtos na Seção "{activeSection?.name}"</span>
                      <span className="bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        {sectionProducts.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Solte produtos aqui ou use os botões de inclusão rápida.
                    </p>
                  </div>

                  {sectionProducts.length > 0 && (
                    <button
                      onClick={() => {
                        if (window.confirm('Limpar todos os produtos desta seção?')) {
                          if (activeSection) {
                            saveStoreSection({ ...activeSection, productIds: [] });
                            setSections(getStoreSections());
                            showToast('Seção esvaziada.');
                          }
                        }
                      }}
                      className="text-[10px] text-muted-foreground hover:text-destructive font-semibold"
                    >
                      Limpar todos
                    </button>
                  )}
                </div>

                {/* Drop Zone Visual Target */}
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-center text-xs text-primary flex items-center justify-center gap-2">
                  <Move className="w-4 h-4" />
                  <span>
                    {isDragOverZone
                      ? 'Solte o produto aqui para adicionar à seção!'
                      : 'Arraste os produtos da coluna esquerda e solte aqui'}
                  </span>
                </div>

                {/* Section Products Grid */}
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                  {sectionProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-2xl border border-border bg-background flex items-center justify-between gap-3 shadow-sm hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="w-12 h-14 rounded-xl overflow-hidden bg-muted shrink-0">
                          <img
                            src={p.images[0] || '/images/look-3103.png'}
                            alt={p.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-primary block uppercase">
                            {p.category}
                          </span>
                          <h5 className="font-semibold text-xs text-foreground truncate">
                            {p.name}
                          </h5>
                          <span className="text-xs font-bold text-foreground">
                            {formatCurrency(p.promotionalPrice || p.price)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveProduct(p.id)}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Remover desta seção"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {sectionProducts.length === 0 && (
                    <div className="py-16 text-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                        <Layers className="w-6 h-6" />
                      </div>
                      <h5 className="font-bold text-xs text-foreground">
                        Nenhum produto nesta seção ainda
                      </h5>
                      <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                        Arraste produtos do catálogo ao lado ou clique nos botões de inclusão em lote
                        para começar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 2: BANNERS DO CARROSSEL PRINCIPAL (HERO BANNERS DA HOME)          */}
      {/* ===================================================================== */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-serif font-bold text-base text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                <span>Banners do Carrossel Principal da Loja</span>
                <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  {banners.length} slides
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Altere ou inclua fotos do banner principal, configure botões que levam direto para suas
                seções (ex: <strong>Moda Verão</strong> ou <strong>Black Friday</strong>) e mude a ordem dos slides.
              </p>
            </div>

            <button
              onClick={handleOpenNewBannerModal}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Adicionar Novo Banner</span>
            </button>
          </div>

          {/* Banners List with Mini Previews */}
          <div className="space-y-4">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4 hover:border-primary/40 transition-all"
              >
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border/60 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-400 text-slate-950 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                          {banner.badge}
                        </span>
                        <h4 className="font-serif font-bold text-base text-foreground">
                          {banner.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{banner.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-auto">
                    <button
                      onClick={() => handleMoveBanner(idx, -1)}
                      disabled={idx === 0}
                      className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:hover:bg-muted"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveBanner(idx, 1)}
                      disabled={idx === banners.length - 1}
                      className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground disabled:opacity-30 disabled:hover:bg-muted"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleOpenEditBannerModal(banner)}
                      className="bg-primary/10 hover:bg-primary hover:text-white text-primary text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Fotos e Textos</span>
                    </button>
                    {banners.length > 1 && (
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                        title="Excluir Banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Banner 3-Box Live Preview Mock */}
                <div className="rounded-2xl overflow-hidden p-3 bg-[#183521] border border-[#275336] flex items-center justify-between gap-3 text-white">
                  {/* Left Photo Preview */}
                  <div className="w-24 sm:w-36 h-28 sm:h-36 rounded-xl overflow-hidden bg-black/20 shrink-0 relative">
                    <img
                      src={banner.leftImage}
                      alt="Modelo Esquerda"
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      Foto 1
                    </span>
                  </div>

                  {/* Center Content Preview */}
                  <div className="flex-1 text-center py-2 px-3 space-y-1">
                    <span className="text-[9px] font-bold tracking-widest uppercase text-amber-200">
                      {banner.badge}
                    </span>
                    <h5 className="font-serif font-bold text-sm sm:text-lg uppercase text-white truncate">
                      {banner.title}
                    </h5>
                    <p className="text-[10px] sm:text-xs text-white/80 line-clamp-1 max-w-sm mx-auto">
                      {banner.subtitle}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                        <span>{banner.buttonText}</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  {/* Right Photo Preview */}
                  <div className="w-24 sm:w-36 h-28 sm:h-36 rounded-xl overflow-hidden bg-black/20 shrink-0 relative">
                    <img
                      src={banner.rightImage || banner.leftImage}
                      alt="Modelo Direita"
                      className="w-full h-full object-cover object-top"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[8px] font-bold px-1.5 py-0.5 rounded">
                      Foto 2
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR OU EDITAR SEÇÃO DA LOJA (MODA VERÃO, BLACK FRIDAY)       */}
      {/* ===================================================================== */}
      {isSectionModalOpen && editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsSectionModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative bg-card text-card-foreground border border-border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {editingSection.id ? 'Editar Seção da Loja' : 'Nova Seção da Loja em Exposição'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Exemplos: <strong>Moda Verão</strong>, <strong>Black Friday</strong>,{' '}
                  <strong>Lançamentos de Outono</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nome da Seção *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Moda Verão, Black Friday, Serena Style..."
                  value={editingSection.name || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, name: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Badge Promocional</label>
                  <input
                    type="text"
                    placeholder="Ex: ☀️ VERÃO 2026, 🔥 BLACK FRIDAY, 40% OFF"
                    value={editingSection.badge || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, badge: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL Amigável (Slug)</label>
                  <input
                    type="text"
                    placeholder="Ex: moda-verao, black-friday"
                    value={editingSection.slug || ''}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, slug: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  placeholder="Texto atrativo explicando os modelos selecionados para esta seção..."
                  value={editingSection.description || ''}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, description: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Toggles for Menus & Homepage Display */}
              <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-3">
                <span className="font-bold text-foreground block">Exposição na Loja:</span>

                <label className="flex items-center gap-2.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={editingSection.showInMenu ?? true}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, showInMenu: e.target.checked })
                    }
                    className="w-4 h-4 accent-primary"
                  />
                  <span>Exibir no Menu Principal da Loja (Navbar Superior e Mobile)</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={editingSection.showInHome ?? true}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, showInHome: e.target.checked })
                    }
                    className="w-4 h-4 accent-primary"
                  />
                  <span>Exibir Vitrine Temática Desta Seção na Página Inicial (Home)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all"
                >
                  Salvar Seção
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CRIAR OU EDITAR BANNER PRINCIPAL (HERO SLIDE COM FOTOS)        */}
      {/* ===================================================================== */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsBannerModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative bg-card text-card-foreground border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {editingBanner.id ? 'Editar Banner Principal' : 'Novo Banner do Carrossel Principal'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Adicione fotos do seu computador e configure o destino do clique.
                </p>
              </div>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* Fotos do Banner (Esquerda e Direita) */}
              <div className="p-4 bg-muted/30 border border-border rounded-2xl space-y-3">
                <span className="font-bold text-foreground block">
                  Fotos dos Modelos no Banner (Upload Fácil):
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Foto Esquerda */}
                  <div className="space-y-2">
                    <label className="block font-semibold">Foto 1 (Esquerda)</label>
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border">
                      <img
                        src={editingBanner.leftImage || '/images/look-3214.png'}
                        alt="Foto 1"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <input
                      ref={leftFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadBannerFile(e, 'left')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => leftFileRef.current?.click()}
                      disabled={isUploadingBannerLeft}
                      className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingBannerLeft ? 'Enviando...' : 'Upload da Foto 1'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem 1..."
                      value={editingBanner.leftImage || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, leftImage: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-[11px] outline-none"
                    />
                  </div>

                  {/* Foto Direita */}
                  <div className="space-y-2">
                    <label className="block font-semibold">Foto 2 (Direita)</label>
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-muted border border-border">
                      <img
                        src={editingBanner.rightImage || editingBanner.leftImage || '/images/macaco-bless.png'}
                        alt="Foto 2"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                    <input
                      ref={rightFileRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUploadBannerFile(e, 'right')}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => rightFileRef.current?.click()}
                      disabled={isUploadingBannerRight}
                      className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingBannerRight ? 'Enviando...' : 'Upload da Foto 2'}</span>
                    </button>
                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem 2..."
                      value={editingBanner.rightImage || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, rightImage: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-[11px] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Textos Centrais do Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Badge Superior</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NOVA COLEÇÃO, 🔥 BLACK FRIDAY, ☀️ VERÃO 2026"
                    value={editingBanner.badge || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, badge: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Título de Impacto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: FORÇA & ESTILO, ATÉ 50% OFF"
                    value={editingBanner.title || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, title: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Subtítulo Descritivo</label>
                <input
                  type="text"
                  placeholder="Ex: Conjuntos que abraçam seu movimento com toque aveludado e zero transparência..."
                  value={editingBanner.subtitle || ''}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                />
              </div>

              {/* Botão de Chamada & Destino do Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Texto do Botão CTA</label>
                  <input
                    type="text"
                    placeholder="Ex: VER CONJUNTOS, APROVEITAR OFERTAS, VER MODA VERÃO"
                    value={editingBanner.buttonText || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, buttonText: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Destino do Botão (Onde o cliente vai ao clicar):
                  </label>
                  <select
                    value={editingBanner.link || '/catalogo'}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, link: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                  >
                    <optgroup label="Seções Criadas da Loja">
                      {sections.map((sec) => (
                        <option key={sec.id} value={`/catalogo?secao=${sec.slug}`}>
                          Seção: {sec.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Categorias Principais">
                      {categories.map((c) => (
                        <option key={c.name} value={`/catalogo?categoria=${encodeURIComponent(c.name)}`}>
                          Categoria: {c.name}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Páginas Gerais">
                      <option value="/catalogo">Catálogo Completo</option>
                      <option value="/catalogo?promocao=true">Apenas Promoções</option>
                      <option value="/catalogo?ordenar=mais-recentes">Lançamentos</option>
                      <option value="/catalogo?ordenar=mais-vendidos">Mais Vendidos</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-secondary/80"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all"
                >
                  Salvar Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
