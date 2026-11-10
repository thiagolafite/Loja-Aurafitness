import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Layers,
  Image as ImageIcon,
  Video,
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
  Wand2,
  Zap,
  RefreshCw,
  Palette,
  Copy,
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
  aiGenerateHeroBanner,
  AiGeneratedBannerResult,
} from '../../lib/dataClient';
import { getStoredCategories, resizeImageFile, normalizeCategoryName } from '../../lib/productClassifier';
import { Product, StoreSection, HeroBannerSlide } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { FloatingVideoManager } from '../../components/admin/FloatingVideoManager';

export const AdminSectionsBannersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get('tab') === 'video'
      ? 'video'
      : searchParams.get('tab') === 'sections'
      ? 'sections'
      : 'banners';
  const [activeTab, setActiveTab] = useState<'sections' | 'banners' | 'video'>(initialTab);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'video' || t === 'banners' || t === 'sections') {
      setActiveTab(t);
    }
  }, [searchParams]);

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

  // AI Banner Generator State
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [aiThemeInput, setAiThemeInput] = useState('');
  const [isGeneratingAiBanner, setIsGeneratingAiBanner] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<AiGeneratedBannerResult | null>(null);
  const [aiBannerDraft, setAiBannerDraft] = useState<Partial<HeroBannerSlide> | null>(null);
  const [selectedStyleIndex, setSelectedStyleIndex] = useState(0);
  const [isSelectingLeftProductPhoto, setIsSelectingLeftProductPhoto] = useState(false);
  const [isSelectingRightProductPhoto, setIsSelectingRightProductPhoto] = useState(false);
  const [aiPhotoSearch, setAiPhotoSearch] = useState('');
  const aiLeftFileRef = useRef<HTMLInputElement>(null);
  const aiRightFileRef = useRef<HTMLInputElement>(null);

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
      badge: 'PRIMEIRA COMPRA',
      title: 'VISTA-SE DE CONFIANÇA!',
      discountHighlight: 'R$ 30,00 DE DESCONTO',
      couponCode: 'PRIMEIRA30',
      subtitle: '*CUPOM VÁLIDO EM PEDIDOS DE PRIMEIRA COMPRA A PARTIR DE R$ 299',
      disclaimer: '*Ação não cumulativa com outras ações, cupons e cashbacks.',
      buttonText: 'COMPRAR AGORA',
      link: '/catalogo',
      leftImage: '/images/look-3214.png',
      rightImage: '/images/macaco-bless.png',
      centerBgColor: '#f5f5f3',
      bannerStyle: 'editorial-light',
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

  // AI Banner Generator Handlers
  const handleOpenAiGenerator = (initialPrompt?: string) => {
    setActiveTab('banners');
    const prompt = (initialPrompt || aiThemeInput).trim() || 'Nova Coleção';
    setAiThemeInput(prompt);
    handleGenerateAiBanner(prompt);
    setIsAiGeneratorOpen(true);
  };

  const handleGenerateAiBanner = async (themeToUse?: string) => {
    const theme = (themeToUse || aiThemeInput).trim();
    if (!theme) {
      alert('Por favor, digite o tema ou promoção desejada para o banner.');
      return;
    }

    setIsGeneratingAiBanner(true);
    try {
      const res = await aiGenerateHeroBanner(theme, products);
      setAiGeneratedResult(res);
      setAiBannerDraft({
        badge: res.badge,
        title: res.title,
        subtitle: res.subtitle,
        buttonText: res.buttonText,
        link: res.link,
        centerBgColor: res.centerBgColor,
        leftImage: res.leftImage,
        rightImage: res.rightImage,
        bannerStyle: res.bannerStyle || 'classic-3col',
        couponCode: res.couponCode,
        discountHighlight: res.discountHighlight,
        disclaimer: res.disclaimer,
        active: true,
      });
      setSelectedStyleIndex(0);
      showToast('✨ Banner inteligente criado com IA!');
    } catch {
      alert('Erro ao gerar banner com IA. Tente novamente.');
    } finally {
      setIsGeneratingAiBanner(false);
    }
  };

  const handleSelectAlternativeStyle = (style: any, idx: number) => {
    setSelectedStyleIndex(idx);
    if (!aiBannerDraft) return;
    setAiBannerDraft({
      ...aiBannerDraft,
      badge: style.badge,
      title: style.title,
      subtitle: style.subtitle,
      buttonText: style.buttonText,
      centerBgColor: style.centerBgColor,
      bannerStyle: style.bannerStyle || 'classic-3col',
      couponCode: style.couponCode,
      discountHighlight: style.discountHighlight,
      disclaimer: style.disclaimer,
    });
  };

  const handlePublishAiBanner = () => {
    if (!aiBannerDraft || !aiBannerDraft.title?.trim()) {
      alert('Por favor, gere ou preencha o banner antes de publicar.');
      return;
    }

    const saved = saveHeroBanner({
      ...aiBannerDraft,
      bannerStyle: aiBannerDraft.bannerStyle || 'classic-3col',
      active: true,
      order: 1, // Coloca como o primeiro slide na Home para destaque imediato
    });

    setBanners(getHeroBanners());
    setIsAiGeneratorOpen(false);
    showToast(`✓ Banner "${saved.title}" publicado com sucesso na Página Principal!`);
  };

  const handleUploadAiDraftFile = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'left' | 'right'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !aiBannerDraft) return;

    try {
      const dataUrl = await resizeImageFile(file, 1200, 1500, 0.88);
      if (side === 'left') {
        setAiBannerDraft({ ...aiBannerDraft, leftImage: dataUrl });
      } else {
        setAiBannerDraft({ ...aiBannerDraft, rightImage: dataUrl });
      }
      showToast(`Foto ${side === 'left' ? 'esquerda' : 'direita'} do banner atualizada!`);
    } catch {
      alert('Erro ao processar imagem.');
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

        <div className="flex items-center gap-3 flex-wrap self-start sm:self-auto">
          {/* Botão de Destaque Gerador com IA */}
          <button
            onClick={() => handleOpenAiGenerator()}
            className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-600 hover:to-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-2xl shadow-lg transition-all flex items-center gap-2 group"
            title="Criar novo banner para a página principal com Inteligência Artificial"
          >
            <Sparkles className="w-4 h-4 text-amber-200 animate-pulse group-hover:rotate-12 transition-transform" />
            <span>Gerar Banner com IA</span>
            <span className="bg-white/20 text-[9px] uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider">
              IA Studio
            </span>
          </button>

          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-muted/60 border border-border rounded-2xl flex-wrap">
            <button
              onClick={() => {
                setActiveTab('sections');
                setSearchParams({ tab: 'sections' });
              }}
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
              onClick={() => {
                setActiveTab('banners');
                setSearchParams({ tab: 'banners' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'banners'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Banners do Carrossel Principal</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('video');
                setSearchParams({ tab: 'video' });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Mini-Vídeo Flutuante (Story)</span>
            </button>
          </div>
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

          {/* Caixa de Criação Rápida com IA */}
          <div className="bg-gradient-to-r from-emerald-950/80 via-neutral-900 to-amber-950/60 border border-emerald-500/30 rounded-3xl p-5 shadow-lg text-white space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm sm:text-base text-white">
                      Gerador Inteligente de Banners com IA
                    </h4>
                    <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Novo
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100/70">
                    Digite qualquer tema, campanha ou promoção e a IA criará o banner completo com fotos e textos de alta conversão!
                  </p>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Ex: Black Friday com 50% de desconto em conjuntos fitness..."
                  value={aiThemeInput}
                  onChange={(e) => setAiThemeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleOpenAiGenerator(aiThemeInput);
                    }
                  }}
                  className="w-full bg-black/40 border border-white/20 focus:border-emerald-400 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => handleOpenAiGenerator(aiThemeInput)}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>Gerar Banner Agora</span>
              </button>
            </div>

            {/* Sugestões Rápidas de Temas */}
            <div className="relative z-10 flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-white/50 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Sugestões:
              </span>
              {[
                '🔥 Black Friday 50% OFF',
                '☀️ Coleção Verão & Moda Solar',
                '⚡ Queima de Estoque Exclusiva',
                '🧘‍♀️ Macaquinhos & Segunda Pele',
                '🌸 Especial Dia das Mães',
                '💪 Nova Coleção de Inverno',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleOpenAiGenerator(chip)}
                  className="bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium px-2.5 py-1 rounded-full border border-white/10 transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-amber-400 text-slate-950 font-bold text-[9px] uppercase px-2 py-0.5 rounded-md">
                          {banner.badge}
                        </span>
                        <h4 className="font-serif font-bold text-base text-foreground">
                          {banner.title}
                        </h4>
                        {/* Formato Visual do Slide */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-muted/60 text-muted-foreground">
                          {banner.bannerStyle === 'editorial-light'
                            ? '🎟️ Editorial Clean'
                            : banner.bannerStyle === 'bold-dark'
                            ? '🖤 Dark Chic'
                            : '🌿 Clássico 3 Colunas'}
                        </span>
                        {banner.couponCode && (
                          <span className="bg-neutral-900 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-neutral-700">
                            CUPOM: {banner.couponCode}
                          </span>
                        )}
                        {banner.discountHighlight && (
                          <span className="bg-rose-500/10 text-rose-500 text-[10px] font-bold px-2 py-0.5 rounded border border-rose-500/20">
                            {banner.discountHighlight}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{banner.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
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
                      className="bg-primary hover:bg-primary-hover text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Editar Banner & Fotos</span>
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

                {/* Banner Live Preview Mock Adaptativo */}
                {banner.bannerStyle === 'editorial-light' ? (
                  <div
                    style={{ backgroundColor: banner.centerBgColor || '#f5f5f3' }}
                    className="rounded-2xl overflow-hidden p-4 flex flex-col md:flex-row items-center justify-between text-neutral-900 border border-neutral-300 min-h-[160px] gap-4"
                  >
                    <div className="w-24 sm:w-32 h-28 sm:h-36 rounded-xl overflow-hidden bg-neutral-200 shrink-0 relative">
                      <img
                        src={banner.leftImage}
                        alt="Modelo 1"
                        className="w-full h-full object-cover object-top"
                      />
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        Foto 1
                      </span>
                    </div>

                    <div className="flex-1 text-center py-1 px-3 space-y-1">
                      <span className="text-[10px] font-extrabold tracking-widest uppercase text-neutral-600 block">
                        {banner.title}
                      </span>
                      {banner.discountHighlight && (
                        <div className="text-xl sm:text-2xl font-black text-neutral-900 leading-none">
                          {banner.discountHighlight}
                        </div>
                      )}
                      {banner.couponCode && (
                        <div className="inline-block bg-neutral-900 text-white font-mono text-[10px] px-2.5 py-0.5 rounded border border-neutral-700">
                          <span className="text-neutral-400 text-[8px] mr-1">CUPOM:</span>
                          <span className="text-amber-300 font-bold">{banner.couponCode}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-neutral-600 line-clamp-1 max-w-sm mx-auto">
                        {banner.subtitle}
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 bg-white text-neutral-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow border border-neutral-300">
                          <span>{banner.buttonText}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>

                    <div className="w-24 sm:w-32 h-28 sm:h-36 rounded-xl overflow-hidden bg-neutral-200 shrink-0 relative hidden sm:block">
                      <img
                        src={banner.rightImage || banner.leftImage}
                        alt="Modelo 2"
                        className="w-full h-full object-cover object-top opacity-85"
                      />
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                        Foto 2
                      </span>
                    </div>
                  </div>
                ) : banner.bannerStyle === 'bold-dark' ? (
                  <div
                    style={{ backgroundColor: banner.centerBgColor || '#0b1610' }}
                    className="rounded-2xl overflow-hidden p-4 flex flex-col md:flex-row items-center justify-between text-white border border-white/10 min-h-[160px] gap-4"
                  >
                    <div className="w-24 sm:w-36 h-28 sm:h-36 rounded-xl overflow-hidden bg-black/40 shrink-0 relative">
                      <img
                        src={banner.leftImage}
                        alt="Modelo 1"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>

                    <div className="flex-1 text-center md:text-left py-1 px-4 space-y-1">
                      <span className="text-[9px] font-extrabold tracking-widest text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full inline-block">
                        ★ {banner.badge}
                      </span>
                      <h4 className="text-2xl sm:text-3xl font-serif font-black uppercase text-white leading-tight">
                        {banner.title}
                      </h4>
                      {banner.discountHighlight && (
                        <p className="text-xs italic text-rose-200/90 font-serif">
                          {banner.discountHighlight}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-300 line-clamp-1 max-w-sm">
                        {banner.subtitle}
                      </p>
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 bg-white text-neutral-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow">
                          <span>{banner.buttonText}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{ backgroundColor: banner.centerBgColor || '#183521' }}
                    className="rounded-2xl overflow-hidden p-3 border border-white/15 flex items-center justify-between gap-3 text-white"
                  >
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
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* ABA 3: MINI-VÍDEO FLUTUANTE NO CANTO INFERIOR ESQUERDO (ESTILO LÊ ROSE) */}
      {/* ===================================================================== */}
      {activeTab === 'video' && <FloatingVideoManager />}

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

              {/* Estilo Visual do Banner */}
              <div className="bg-muted/40 p-3.5 rounded-2xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-foreground">
                    Estilo Visual do Banner:
                  </label>
                  <span className="text-[10px] text-muted-foreground">
                    Altera a diagramação do slide na Home
                  </span>
                </div>
                <select
                  value={editingBanner.bannerStyle || 'classic-3col'}
                  onChange={(e) =>
                    setEditingBanner({
                      ...editingBanner,
                      bannerStyle: e.target.value as any,
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                >
                  <option value="editorial-light">🎟️ Editorial Clean (Fundo Claro / Cupom / Desconto R$30)</option>
                  <option value="bold-dark">🖤 Dark Chic (Best Sellers / Contraste Noturno)</option>
                  <option value="classic-3col">🌿 Carrossel Clássico 3 Colunas (Verde Floresta Nobre)</option>
                </select>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Destaque de Desconto:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: R$ 30,00 DE DESCONTO"
                      value={editingBanner.discountHighlight || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, discountHighlight: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Código do Cupom:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: PRIMEIRA30"
                      value={editingBanner.couponCode || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, couponCode: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                      Regras / Disclaimer:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: *Cupom válido acima de R$ 299..."
                      value={editingBanner.disclaimer || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, disclaimer: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none"
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

      {/* ===================================================================== */}
      {/* MODAL: AURA AI BANNER STUDIO (GERADOR INTELIGENTE DE BANNERS)         */}
      {/* ===================================================================== */}
      {isAiGeneratorOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Hidden File Inputs for AI draft */}
            <input
              ref={aiLeftFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadAiDraftFile(e, 'left')}
              className="hidden"
            />
            <input
              ref={aiRightFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleUploadAiDraftFile(e, 'right')}
              className="hidden"
            />

            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-emerald-950/70 via-background to-amber-950/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-white shadow-md">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif font-bold text-base sm:text-lg text-foreground">
                      Aura AI Banner Studio
                    </h3>
                    <span className="bg-gradient-to-r from-amber-500 to-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      Gerador com IA
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Crie campanhas de alta conversão, vitrines sazonais e promoções prontas para a página principal.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiGeneratorOpen(false)}
                className="w-8 h-8 rounded-full bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                title="Fechar Studio"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
              {/* Barra de Comando do Tema */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-foreground">
                  Tema ou Objetivo da Campanha:
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Ex: Black Friday com até 50% de desconto em macaquinhos e conjuntos..."
                      value={aiThemeInput}
                      onChange={(e) => setAiThemeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleGenerateAiBanner(aiThemeInput);
                        }
                      }}
                      className="w-full bg-background border border-border focus:border-primary rounded-2xl px-4 py-3 text-xs sm:text-sm text-foreground outline-none shadow-inner transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerateAiBanner(aiThemeInput)}
                    disabled={isGeneratingAiBanner}
                    className="bg-gradient-to-r from-primary to-emerald-700 hover:from-primary-hover hover:to-emerald-800 text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                  >
                    {isGeneratingAiBanner ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                        <span>Gerando Banner...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Gerar Banner com IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Sugestões Rápidas */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500" /> Testar temas:
                  </span>
                  {[
                    '🎟️ Cupom Primeira Compra (R$30 OFF)',
                    '★ Best Sellers (As Queridinhas)',
                    '💎 Minimalista Off-White & Sálvia',
                    '🌿 Efeito Lipo & Sálvia Oficial',
                    '🖤 All Black Alta Compressão',
                    '🔥 Black Friday 50% OFF',
                    '☀️ Coleção Verão & Moda Solar',
                    '⚡ Queima de Estoque Relâmpago',
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => {
                        setAiThemeInput(chip);
                        handleGenerateAiBanner(chip);
                      }}
                      className="bg-muted hover:bg-muted/80 text-foreground text-[10px] font-medium px-2.5 py-1 rounded-full border border-border/80 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Variações de Estilo da IA */}
              {aiGeneratedResult && aiGeneratedResult.alternativeStyles.length > 0 && (
                <div className="bg-muted/40 border border-border rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-primary" />
                      <span>Variações de Tom Sugeridas pela IA:</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Clique para alternar o texto e cor instantaneamente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {aiGeneratedResult.alternativeStyles.map((style, idx) => {
                      const isSelected = selectedStyleIndex === idx;
                      return (
                        <button
                          key={style.name}
                          type="button"
                          onClick={() => handleSelectAlternativeStyle(style, idx)}
                          className={`text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-foreground shadow-sm ring-1 ring-primary'
                              : 'bg-card border-border hover:border-primary/40 text-muted-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-foreground text-xs">{style.name}</span>
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: style.centerBgColor }}
                            />
                          </div>
                          <div className="text-[11px] font-semibold text-foreground truncate">
                            {style.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {style.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live Realistic Preview of the Banner */}
              {aiBannerDraft && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      <span>Pré-Visualização ao Vivo na Página Principal (Carrossel Home):</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Banner responsivo com fotos de modelos e chamada para ação
                    </span>
                  </div>

                  <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xl bg-neutral-950 p-2 sm:p-4">
                    {aiBannerDraft.bannerStyle === 'editorial-light' ? (
                      /* Preview Estilo Editorial Claro (Cupom / R$30 OFF) */
                      <div
                        style={{ backgroundColor: aiBannerDraft.centerBgColor || '#f5f5f3' }}
                        className="rounded-2xl overflow-hidden p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between text-neutral-900 min-h-[300px] relative border border-neutral-300"
                      >
                        {/* Foto Esquerda */}
                        <div className="w-full md:w-3/12 h-44 md:h-64 relative rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                          <img
                            src={aiBannerDraft.leftImage || '/images/look-3214.png'}
                            alt="Modelo Esquerda"
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute bottom-2 left-2 w-10 h-10 rounded-full border border-neutral-700/30 flex flex-col items-center justify-center text-center p-0.5 bg-white/20 select-none">
                            <span className="text-[5px] font-extrabold text-neutral-800">AURA</span>
                            <span className="text-[4px] text-neutral-600">FITNESS</span>
                          </div>
                        </div>

                        {/* Centro Conteúdo */}
                        <div className="w-full md:w-6/12 flex flex-col items-center text-center px-4 py-3 my-auto">
                          <span className="text-[10px] font-extrabold tracking-widest text-neutral-600 uppercase mb-1">
                            {aiBannerDraft.title || 'VISTA-SE DE CONFIANÇA!'}
                          </span>
                          {aiBannerDraft.discountHighlight && (
                            <div className="mb-2">
                              <span className="text-2xl sm:text-3xl font-black text-neutral-900 leading-none">
                                {aiBannerDraft.discountHighlight}
                              </span>
                            </div>
                          )}
                          {aiBannerDraft.couponCode && (
                            <div className="mb-2 bg-neutral-900 text-white font-mono text-xs px-3 py-1 rounded-lg border border-neutral-700">
                              <span className="text-neutral-400 text-[9px] mr-1">CUPOM:</span>
                              <span className="text-amber-300 font-bold">{aiBannerDraft.couponCode}</span>
                            </div>
                          )}
                          <p className="text-[10px] text-neutral-600 font-medium max-w-xs mb-3">
                            {aiBannerDraft.subtitle || '*CUPOM VÁLIDO EM PEDIDOS DE PRIMEIRA COMPRA'}
                          </p>
                          <span className="inline-flex items-center gap-1.5 bg-white text-neutral-950 font-bold text-xs px-5 py-2 rounded-full shadow border border-neutral-300">
                            <span>{aiBannerDraft.buttonText || 'COMPRAR AGORA'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        {/* Foto Direita */}
                        <div className="hidden md:flex w-3/12 h-64 relative rounded-xl overflow-hidden bg-neutral-200 shrink-0">
                          <img
                            src={aiBannerDraft.rightImage || aiBannerDraft.leftImage || '/images/macaco-bless.png'}
                            alt="Modelo Direita"
                            className="w-full h-full object-cover object-top opacity-85"
                          />
                          {aiBannerDraft.disclaimer && (
                            <div className="absolute bottom-2 right-2 text-right max-w-[140px]">
                              <p className="text-[7px] text-neutral-500 leading-tight">
                                {aiBannerDraft.disclaimer}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : aiBannerDraft.bannerStyle === 'bold-dark' ? (
                      /* Preview Estilo Bold Dark (Best Sellers) */
                      <div
                        style={{ backgroundColor: aiBannerDraft.centerBgColor || '#0b1610' }}
                        className="rounded-2xl overflow-hidden p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between text-white min-h-[300px] relative border border-white/10"
                      >
                        <div className="w-full md:w-4/12 h-44 md:h-64 relative rounded-xl overflow-hidden bg-neutral-900 shrink-0">
                          <img
                            src={aiBannerDraft.leftImage || '/images/look-3656.png'}
                            alt="Modelo Esquerda"
                            className="w-full h-full object-cover object-top"
                          />
                        </div>

                        <div className="w-full md:w-8/12 flex flex-col items-center md:items-start text-center md:text-left px-4 sm:px-8 py-3 my-auto">
                          <span className="text-[9px] font-extrabold tracking-widest text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-full mb-1">
                            ★ {aiBannerDraft.badge || 'MAIS DESEJADOS'}
                          </span>
                          <h2 className="text-3xl sm:text-4xl font-serif font-black uppercase tracking-tight text-white leading-none mb-1">
                            {aiBannerDraft.title || 'BEST SELLERS'}
                          </h2>
                          {aiBannerDraft.discountHighlight && (
                            <p className="text-xs sm:text-sm italic text-rose-200/90 font-serif mb-2">
                              {aiBannerDraft.discountHighlight}
                            </p>
                          )}
                          <p className="text-[11px] text-neutral-300 font-light max-w-sm mb-4">
                            {aiBannerDraft.subtitle}
                          </p>
                          <span className="inline-flex items-center gap-1.5 bg-white text-neutral-950 font-bold text-xs px-5 py-2 rounded-full shadow">
                            <span>{aiBannerDraft.buttonText || 'COMPRAR AGORA'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Preview Estilo Clássico 3 Colunas */
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch min-h-[300px]">
                        {/* Foto Esquerda */}
                        <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-neutral-900 group min-h-[200px]">
                          <img
                            src={aiBannerDraft.leftImage || '/images/macaco-bless.png'}
                            alt="Modelo Esquerda"
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Foto 1
                          </span>
                        </div>

                        {/* Card Central de Conteúdo */}
                        <div
                          className="md:col-span-6 relative rounded-2xl p-6 flex flex-col items-center justify-center text-center text-white overflow-hidden shadow-2xl transition-colors duration-300"
                          style={{ backgroundColor: aiBannerDraft.centerBgColor || '#163923' }}
                        >
                          <div className="relative z-10 max-w-md space-y-2">
                            <div className="inline-block bg-white/15 backdrop-blur-md border border-white/25 px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase">
                              {aiBannerDraft.badge || 'CAMPANHA AURA'}
                            </div>
                            <h2 className="font-serif text-2xl sm:text-3xl font-bold leading-tight">
                              {aiBannerDraft.title || 'Título da Campanha'}
                            </h2>
                            <p className="text-xs text-white/80 line-clamp-2 max-w-xs mx-auto font-light">
                              {aiBannerDraft.subtitle}
                            </p>
                            <div className="pt-1">
                              <span className="inline-flex items-center gap-1.5 bg-white text-neutral-950 font-extrabold text-xs px-5 py-2 rounded-full shadow">
                                <span>{aiBannerDraft.buttonText || 'Ver Ofertas'}</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Foto Direita */}
                        <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-neutral-900 group min-h-[200px]">
                          <img
                            src={aiBannerDraft.rightImage || aiBannerDraft.leftImage || '/images/macaco-bless.png'}
                            alt="Modelo Direita"
                            className="w-full h-full object-cover object-top"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
                          <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                            Foto 2
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ajustes Finos e Personalização */}
              {aiBannerDraft && (
                <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      Ajuste Fino dos Textos, Cores e Destino
                    </h4>
                  </div>

                  {/* Seletor do Padrão Visual do Banner */}
                  <div className="bg-muted/40 p-3 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-foreground">
                        Estilo Visual do Banner:
                      </label>
                      <span className="text-[10px] text-muted-foreground">
                        Alterne entre os formatos editoriais
                      </span>
                    </div>
                    <select
                      value={aiBannerDraft.bannerStyle || 'classic-3col'}
                      onChange={(e) =>
                        setAiBannerDraft({
                          ...aiBannerDraft,
                          bannerStyle: e.target.value as any,
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none"
                    >
                      <option value="editorial-light">🎟️ Editorial Clean (Fundo Claro / Cupom / Desconto R$30)</option>
                      <option value="bold-dark">🖤 Dark Chic (Best Sellers / Contraste Noturno)</option>
                      <option value="classic-3col">🌿 Carrossel Clássico 3 Colunas (Verde Floresta)</option>
                    </select>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                          Destaque de Desconto:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: R$ 30,00 DE DESCONTO"
                          value={aiBannerDraft.discountHighlight || ''}
                          onChange={(e) =>
                            setAiBannerDraft({
                              ...aiBannerDraft,
                              discountHighlight: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                          Código do Cupom:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: PRIMEIRA30"
                          value={aiBannerDraft.couponCode || ''}
                          onChange={(e) =>
                            setAiBannerDraft({
                              ...aiBannerDraft,
                              couponCode: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                          Regras / Disclaimer:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: *Cupom válido acima de R$ 299..."
                          value={aiBannerDraft.disclaimer || ''}
                          onChange={(e) =>
                            setAiBannerDraft({
                              ...aiBannerDraft,
                              disclaimer: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <h4 className="font-bold text-xs sm:text-sm text-foreground">
                      Ajuste Fino dos Textos, Cores e Destino
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Badge e Título */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Badge Superior:
                        </label>
                        <input
                          type="text"
                          value={aiBannerDraft.badge || ''}
                          onChange={(e) =>
                            setAiBannerDraft({ ...aiBannerDraft, badge: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-bold"
                          placeholder="Ex: 🔥 BLACK FRIDAY 50% OFF"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Título Principal:
                        </label>
                        <input
                          type="text"
                          value={aiBannerDraft.title || ''}
                          onChange={(e) =>
                            setAiBannerDraft({ ...aiBannerDraft, title: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-bold"
                          placeholder="Ex: PODER EM CADA DETALHE"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Subtítulo:
                        </label>
                        <textarea
                          rows={2}
                          value={aiBannerDraft.subtitle || ''}
                          onChange={(e) =>
                            setAiBannerDraft({ ...aiBannerDraft, subtitle: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary resize-none"
                          placeholder="Ex: Peças com compressão inteligente que modelam sem marcar..."
                        />
                      </div>
                    </div>

                    {/* Botão, Destino e Cores */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Texto do Botão:
                        </label>
                        <input
                          type="text"
                          value={aiBannerDraft.buttonText || ''}
                          onChange={(e) =>
                            setAiBannerDraft({ ...aiBannerDraft, buttonText: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-bold"
                          placeholder="Ex: GARANTIR MEU CONJUNTO"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1">
                          Onde o cliente vai ao clicar:
                        </label>
                        <select
                          value={aiBannerDraft.link || '/catalogo'}
                          onChange={(e) =>
                            setAiBannerDraft({ ...aiBannerDraft, link: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary font-semibold"
                        >
                          <optgroup label="Seções Criadas na Loja">
                            {sections.map((sec) => (
                              <option key={sec.id} value={`/catalogo?secao=${sec.slug}`}>
                                Seção: {sec.name}
                              </option>
                            ))}
                          </optgroup>
                          <optgroup label="Categorias Principais">
                            {categories.map((c) => (
                              <option
                                key={c.name}
                                value={`/catalogo?categoria=${encodeURIComponent(c.name)}`}
                              >
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

                      {/* Paleta de Cores de Luxo */}
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                          <span>Cor de Fundo do Card Central:</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {aiBannerDraft.centerBgColor}
                          </span>
                        </label>

                        <div className="flex items-center gap-2 flex-wrap">
                          {[
                            { name: 'Esmeralda', hex: '#163923' },
                            { name: 'Rubi Black', hex: '#1c1114' },
                            { name: 'Plum Velvet', hex: '#2b1428' },
                            { name: 'Navy Midnight', hex: '#142538' },
                            { name: 'Terra Cotta', hex: '#2d1812' },
                            { name: 'Ônix Titan', hex: '#181c20' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              onClick={() =>
                                setAiBannerDraft({ ...aiBannerDraft, centerBgColor: col.hex })
                              }
                              className={`w-7 h-7 rounded-full border transition-transform flex items-center justify-center ${
                                aiBannerDraft.centerBgColor === col.hex
                                  ? 'scale-110 border-white ring-2 ring-primary shadow-md'
                                  : 'border-border/60 hover:scale-105'
                              }`}
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            >
                              {aiBannerDraft.centerBgColor === col.hex && (
                                <Check className="w-3.5 h-3.5 text-white" />
                              )}
                            </button>
                          ))}

                          <div className="flex items-center gap-1.5 ml-1">
                            <input
                              type="color"
                              value={aiBannerDraft.centerBgColor || '#163923'}
                              onChange={(e) =>
                                setAiBannerDraft({
                                  ...aiBannerDraft,
                                  centerBgColor: e.target.value,
                                })
                              }
                              className="w-7 h-7 rounded-xl border border-border cursor-pointer bg-transparent"
                              title="Escolher cor personalizada"
                            />
                            <span className="text-[10px] text-muted-foreground">Personalizada</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-muted/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground text-center sm:text-left">
                Ao publicar, o banner será salvo e colocado em <strong>1º lugar no carrossel da Página Principal</strong>.
              </p>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsAiGeneratorOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold text-xs hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handlePublishAiBanner}
                  disabled={!aiBannerDraft || isGeneratingAiBanner}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>🚀 Salvar e Publicar na Página Principal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SELETOR DE FOTO DO CATÁLOGO DE PRODUTOS PARA O BANNER                 */}
      {/* ===================================================================== */}
      {(isSelectingLeftProductPhoto || isSelectingRightProductPhoto) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-primary" />
                  <span>
                    Escolha a Foto para a{' '}
                    {isSelectingLeftProductPhoto ? 'Esquerda' : 'Direita'} do Banner
                  </span>
                </h4>
                <p className="text-xs text-muted-foreground">
                  Clique na foto de qualquer produto cadastrado para utilizá-la no banner da Home.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSelectingLeftProductPhoto(false);
                  setIsSelectingRightProductPhoto(false);
                }}
                className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 border-b border-border bg-muted/30">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Pesquisar produto por nome ou categoria..."
                  value={aiPhotoSearch}
                  onChange={(e) => setAiPhotoSearch(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {products
                .filter(
                  (p) =>
                    !aiPhotoSearch.trim() ||
                    p.name.toLowerCase().includes(aiPhotoSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(aiPhotoSearch.toLowerCase())
                )
                .map((product) => {
                  const photoUrl = product.images?.[0] || '/images/macaco-bless.png';
                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        if (isSelectingLeftProductPhoto && aiBannerDraft) {
                          setAiBannerDraft({ ...aiBannerDraft, leftImage: photoUrl });
                          showToast('Foto esquerda atualizada a partir do produto!');
                        } else if (isSelectingRightProductPhoto && aiBannerDraft) {
                          setAiBannerDraft({ ...aiBannerDraft, rightImage: photoUrl });
                          showToast('Foto direita atualizada a partir do produto!');
                        }
                        setIsSelectingLeftProductPhoto(false);
                        setIsSelectingRightProductPhoto(false);
                      }}
                      className="group text-left border border-border rounded-2xl overflow-hidden hover:border-primary hover:shadow-md transition-all bg-muted/20"
                    >
                      <div className="aspect-[3/4] relative bg-neutral-900 overflow-hidden">
                        <img
                          src={photoUrl}
                          alt={product.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
                            Usar esta foto
                          </span>
                        </div>
                      </div>
                      <div className="p-2">
                        <div className="text-[11px] font-bold text-foreground truncate">
                          {product.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {product.category}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
