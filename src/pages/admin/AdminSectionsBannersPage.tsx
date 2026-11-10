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
  ArrowRight,
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
  Package,
  Smartphone,
  Monitor,
  Sliders,
  Type,
  MousePointer,
  RotateCcw,
  ZoomIn,
  Maximize2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getImageInlineStyle,
  getBannerBackgroundStyle,
  getBannerHeightClass,
  getBannerButtonStyle,
  getBannerButtonRadiusClass,
  getImageCardContainerStyle,
} from '../../lib/bannerStyles';
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
  const [bannerProductPhotoPickerSide, setBannerProductPhotoPickerSide] = useState<'left' | 'right' | null>(null);
  const [bannerStudioTab, setBannerStudioTab] = useState<'fotos' | 'filtros' | 'design' | 'textos' | 'botao'>('fotos');
  const [bannerPreviewDevice, setBannerPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [bannerFilterSide, setBannerFilterSide] = useState<'left' | 'right' | 'both'>('left');
  const [isUploadingBannerLeft, setIsUploadingBannerLeft] = useState(false);
  const [isUploadingBannerRight, setIsUploadingBannerRight] = useState(false);
  const leftFileRef = useRef<HTMLInputElement>(null);
  const rightFileRef = useRef<HTMLInputElement>(null);

  // Redimensionamento de Imagem Arrastável pelo Mouse
  const [activeResizingSide, setActiveResizingSide] = useState<'left' | 'right' | null>(null);

  const handleStartCardResize = (
    e: React.MouseEvent | React.TouchEvent,
    side: 'left' | 'right'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const currentW = (side === 'left' ? editingBanner?.leftImageCardWidth : editingBanner?.rightImageCardWidth) ?? 26;
    const currentH = (side === 'left' ? editingBanner?.leftImageCardHeight : editingBanner?.rightImageCardHeight) ?? 85;

    const startX = clientX;
    const startY = clientY;

    setActiveResizingSide(side);

    const onMove = (moveEvent: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const curY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = curX - startX;
      const deltaY = curY - startY;

      // Sensibilidade suave (~0.08% por pixel)
      const factorX = side === 'left' ? 0.08 : -0.08;
      const newWidth = Math.min(42, Math.max(16, Math.round(currentW + deltaX * factorX)));
      const newHeight = Math.min(95, Math.max(65, Math.round(currentH + deltaY * 0.08)));

      setEditingBanner((prev) => {
        if (!prev) return prev;
        return side === 'left'
          ? { ...prev, leftImageCardWidth: newWidth, leftImageCardHeight: newHeight }
          : { ...prev, rightImageCardWidth: newWidth, rightImageCardHeight: newHeight };
      });
    };

    const onEnd = () => {
      setActiveResizingSide(null);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

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
  const DEFAULT_BANNER_SETTINGS: Partial<HeroBannerSlide> = {
    bannerHeight: 'normal',
    backgroundType: 'solid',
    centerBgColor: '#f5f5f3',
    bgGradientEndColor: '#e0e7dd',
    gradientDirection: 'to-r',
    overlayOpacity: 0,
    ambientGlow: false,
    ambientGlowColor: '#10b981',
    leftImageScale: 100,
    leftImagePositionX: 50,
    leftImagePositionY: 20,
    leftImageFit: 'cover',
    leftImageBrightness: 100,
    leftImageContrast: 100,
    leftImageSaturate: 100,
    leftImageBlur: 0,
    leftImageGrayscale: 0,
    leftImageSepia: 0,
    leftImageOpacity: 100,
    leftImageFlipX: false,
    leftImageCardWidth: 26,
    leftImageCardHeight: 85,
    leftImageCardRadius: 24,
    rightImageScale: 100,
    rightImagePositionX: 50,
    rightImagePositionY: 20,
    rightImageFit: 'cover',
    rightImageBrightness: 100,
    rightImageContrast: 100,
    rightImageSaturate: 100,
    rightImageBlur: 0,
    rightImageGrayscale: 0,
    rightImageSepia: 0,
    rightImageOpacity: 100,
    rightImageFlipX: false,
    rightImageCardWidth: 26,
    rightImageCardHeight: 85,
    rightImageCardRadius: 24,
    titleColor: '#171717',
    subtitleColor: '#525252',
    titleFontSize: 36,
    titleFontFamily: 'serif',
    textAlign: 'center',
    badgeBgColor: '#00000015',
    badgeTextColor: '#171717',
    buttonBgColor: '#ffffff',
    buttonTextColor: '#0a0a0a',
    buttonBorderColor: '#d4d4d4',
    buttonRadius: 'rounded-full',
    buttonGlow: false,
  };

  const handleOpenNewBannerModal = () => {
    setEditingBanner({
      ...DEFAULT_BANNER_SETTINGS,
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
    setBannerStudioTab('fotos');
    setBannerProductPhotoPickerSide(null);
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBannerModal = (banner: HeroBannerSlide) => {
    setEditingBanner({
      ...DEFAULT_BANNER_SETTINGS,
      ...banner,
    });
    setBannerStudioTab('fotos');
    setBannerProductPhotoPickerSide(null);
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner || !editingBanner.title?.trim()) return;

    const saved = saveHeroBanner(editingBanner);
    setBanners([...getHeroBanners()]);
    setIsBannerModalOpen(false);
    setEditingBanner(null);
    setBannerProductPhotoPickerSide(null);
    showToast(`✓ Banner "${saved.title}" salvo com sucesso!`);
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm('Excluir este banner do carrossel principal?')) {
      deleteHeroBanner(id);
      setBanners([...getHeroBanners()]);
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
    if (!file) return;

    if (side === 'left') setIsUploadingBannerLeft(true);
    else setIsUploadingBannerRight(true);

    try {
      // 800x1000 @ 0.8 quality gera fotos nítidas e leves (~85KB), evitando sobrecarga de memória
      const dataUrl = await resizeImageFile(file, 800, 1000, 0.8);
      setEditingBanner((prev) => {
        if (!prev) return prev;
        return side === 'left'
          ? { ...prev, leftImage: dataUrl, rightImage: prev.rightImage || dataUrl }
          : { ...prev, rightImage: dataUrl };
      });
      showToast(`✓ Foto ${side === 'left' ? '1 (esquerda)' : '2 (direita)'} atualizada!`);
    } catch (err) {
      console.error(err);
      alert('Erro ao processar imagem.');
    } finally {
      if (side === 'left') setIsUploadingBannerLeft(false);
      else setIsUploadingBannerRight(false);
      e.target.value = '';
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
      {/* MODAL: AURA BANNER STUDIO - CONTROLE TOTAL DE DESIGN E FOTOS         */}
      {/* ===================================================================== */}
      {isBannerModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            onClick={() => setIsBannerModalOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <div className="relative bg-card text-card-foreground border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[94vh]">
            {/* Cabeçalho do Banner Studio */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                    {editingBanner.id ? 'Studio de Design do Banner' : 'Novo Banner no Studio'}
                    <span className="text-[10px] font-sans font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Controle Total
                    </span>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Ajuste fotos, escala, posição, filtros, cores, sombras, tipografia e botões com pré-visualização ao vivo.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl font-bold shadow-md transition-all text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Corpo com Scroll: Pré-Visualização + Tabs de Customização */}
            <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* ÁREA DE PRÉ-VISUALIZAÇÃO AO VIVO (DESKTOP & CELULAR) */}
              <div className="bg-muted/40 border border-border rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                    <Eye className="w-3.5 h-3.5 text-primary" />
                    Pré-visualização em Tempo Real:
                  </span>

                  {/* Toggle de Dispositivo: Computador vs Celular */}
                  <div className="inline-flex items-center bg-background border border-border rounded-xl p-0.5 shadow-xs">
                    <button
                      type="button"
                      onClick={() => setBannerPreviewDevice('desktop')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        bannerPreviewDevice === 'desktop'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Computador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerPreviewDevice('mobile')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        bannerPreviewDevice === 'mobile'
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Celular</span>
                    </button>
                  </div>
                </div>

                {/* Dica de Redimensionamento Interativo */}
                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                  <span className="flex items-center gap-1.5 font-medium text-foreground">
                    <Move className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <strong>Dica:</strong> Arraste com o mouse na foto ou nas alças laterais para redimensionar no tamanho que quiser!
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold hidden sm:inline-block">
                    ✓ Proporcional & Responsivo
                  </span>
                </div>

                {/* Container do Banner Preview */}
                <div className="flex items-center justify-center p-2 bg-neutral-950/20 rounded-xl overflow-hidden">
                  {bannerPreviewDevice === 'desktop' ? (
                    /* PREVIEW DESKTOP */
                    <div
                      style={getBannerBackgroundStyle(editingBanner)}
                      className="w-full h-56 sm:h-64 rounded-2xl overflow-hidden relative border border-white/10 shadow-lg flex items-center justify-between px-6 transition-all select-none"
                    >
                      {editingBanner.ambientGlow && (
                        <div
                          style={{
                            background: `radial-gradient(circle at center, ${editingBanner.ambientGlowColor || '#10b981'}40 0%, transparent 70%)`,
                          }}
                          className="absolute inset-0 pointer-events-none z-0 blur-2xl"
                        />
                      )}
                      {editingBanner.overlayOpacity ? (
                        <div
                          style={{ opacity: editingBanner.overlayOpacity / 100 }}
                          className="absolute inset-0 bg-black pointer-events-none z-10"
                        />
                      ) : null}

                      {/* Sutil textura e reflexo nobre */}
                      <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />

                      {/* Foto Esquerda (Card Proporcional e Arrastável pelo Mouse) */}
                      <div
                        style={getImageCardContainerStyle('left', editingBanner, false)}
                        className={`relative overflow-hidden shadow-2xl border-2 transition-all group shrink-0 select-none bg-neutral-900/40 ${
                          activeResizingSide === 'left' ? 'border-primary ring-2 ring-primary/40' : 'border-white/20 hover:border-primary/60'
                        }`}
                      >
                        <img
                          src={editingBanner.leftImage || '/images/look-3214.png'}
                          alt="Foto 1"
                          style={getImageInlineStyle('left', editingBanner)}
                          className="h-full w-full object-top pointer-events-none"
                        />

                        {/* Alça visual no canto inferior direito para arrasto com o mouse */}
                        <div
                          onMouseDown={(e) => handleStartCardResize(e, 'left')}
                          onTouchStart={(e) => handleStartCardResize(e, 'left')}
                          title="Clique e arraste com o mouse para alterar a dimensão da foto"
                          className="absolute bottom-1.5 right-1.5 z-30 flex items-center gap-1 bg-neutral-900/90 text-white border border-primary/50 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-nwse-resize hover:bg-primary transition-all shadow-md active:scale-95"
                        >
                          <Move className="w-2.5 h-2.5 text-amber-300" />
                          <span>{editingBanner.leftImageCardWidth ?? 26}%</span>
                        </div>

                        {/* Borda direita com alça de arraste horizontal */}
                        <div
                          onMouseDown={(e) => handleStartCardResize(e, 'left')}
                          onTouchStart={(e) => handleStartCardResize(e, 'left')}
                          title="Arraste horizontalmente para redimensionar"
                          className="absolute inset-y-0 right-0 w-3 cursor-ew-resize hover:bg-primary/30 flex items-center justify-center transition-colors z-20 group-hover:bg-primary/20"
                        >
                          <div className="w-1 h-6 bg-primary rounded-full shadow" />
                        </div>
                      </div>

                      {/* Textos Centrais */}
                      <div className="relative z-20 flex-1 max-w-sm mx-auto flex flex-col items-center justify-center text-center px-3 py-2 my-auto">
                        {editingBanner.badge && (
                          <span
                            style={{
                              backgroundColor: editingBanner.badgeBgColor || 'rgba(0,0,0,0.15)',
                              color: editingBanner.badgeTextColor || '#171717',
                            }}
                            className="text-[9px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-white/20 mb-1"
                          >
                            ★ {editingBanner.badge}
                          </span>
                        )}

                        {editingBanner.discountHighlight ? (
                          <div className="space-y-0.5 mb-1">
                            <span
                              style={{ color: editingBanner.titleColor || undefined }}
                              className="text-[10px] font-extrabold tracking-widest uppercase opacity-80 block"
                            >
                              {editingBanner.title}
                            </span>
                            <h2
                              style={{
                                color: editingBanner.titleColor || '#ffffff',
                                fontFamily: editingBanner.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                                fontSize: typeof editingBanner.titleFontSize === 'number' ? `${Math.min(editingBanner.titleFontSize, 30)}px` : '26px',
                              }}
                              className="font-black uppercase leading-tight tracking-tight drop-shadow-md"
                            >
                              {editingBanner.discountHighlight}
                            </h2>
                          </div>
                        ) : (
                          <h2
                            style={{
                              color: editingBanner.titleColor || '#ffffff',
                              fontFamily: editingBanner.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                              fontSize: typeof editingBanner.titleFontSize === 'number' ? `${Math.min(editingBanner.titleFontSize, 30)}px` : '26px',
                            }}
                            className="font-black uppercase leading-tight tracking-tight drop-shadow-md mb-1"
                          >
                            {editingBanner.title || 'TÍTULO DO BANNER'}
                          </h2>
                        )}

                        {editingBanner.couponCode && (
                          <div className="inline-flex items-center gap-1 bg-black/60 text-white font-mono text-[9px] px-2 py-0.5 rounded-md border border-white/20 mb-1">
                            <span className="text-neutral-400 font-sans text-[8px]">CUPOM:</span>
                            <span className="text-amber-300 font-bold">{editingBanner.couponCode}</span>
                          </div>
                        )}

                        <p
                          style={{ color: editingBanner.subtitleColor || 'rgba(255,255,255,0.8)' }}
                          className="text-[9px] line-clamp-2 max-w-xs mb-2 leading-tight"
                        >
                          {editingBanner.subtitle || 'Subtítulo descritivo com toque nobre e aveludado.'}
                        </p>

                        <div
                          style={getBannerButtonStyle(editingBanner)}
                          className={`inline-flex items-center gap-1 px-4 py-1.5 ${getBannerButtonRadiusClass(editingBanner.buttonRadius)} text-[10px] font-extrabold uppercase shadow-md select-none`}
                        >
                          <span>{editingBanner.buttonText || 'COMPRAR AGORA'}</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>

                      {/* Foto Direita (Card Proporcional e Arrastável pelo Mouse) */}
                      <div
                        style={getImageCardContainerStyle('right', editingBanner, false)}
                        className={`relative overflow-hidden shadow-2xl border-2 transition-all group shrink-0 select-none bg-neutral-900/40 ${
                          activeResizingSide === 'right' ? 'border-primary ring-2 ring-primary/40' : 'border-white/20 hover:border-primary/60'
                        }`}
                      >
                        <img
                          src={editingBanner.rightImage || editingBanner.leftImage || '/images/macaco-bless.png'}
                          alt="Foto 2"
                          style={getImageInlineStyle('right', editingBanner)}
                          className="h-full w-full object-top pointer-events-none"
                        />

                        {/* Alça visual no canto inferior esquerdo para arrasto com o mouse */}
                        <div
                          onMouseDown={(e) => handleStartCardResize(e, 'right')}
                          onTouchStart={(e) => handleStartCardResize(e, 'right')}
                          title="Clique e arraste com o mouse para alterar a dimensão da foto"
                          className="absolute bottom-1.5 left-1.5 z-30 flex items-center gap-1 bg-neutral-900/90 text-white border border-primary/50 text-[9px] font-bold px-1.5 py-0.5 rounded cursor-nesw-resize hover:bg-primary transition-all shadow-md active:scale-95"
                        >
                          <Move className="w-2.5 h-2.5 text-amber-300" />
                          <span>{editingBanner.rightImageCardWidth ?? 26}%</span>
                        </div>

                        {/* Borda esquerda com alça de arraste horizontal */}
                        <div
                          onMouseDown={(e) => handleStartCardResize(e, 'right')}
                          onTouchStart={(e) => handleStartCardResize(e, 'right')}
                          title="Arraste horizontalmente para redimensionar"
                          className="absolute inset-y-0 left-0 w-3 cursor-ew-resize hover:bg-primary/30 flex items-center justify-center transition-colors z-20 group-hover:bg-primary/20"
                        >
                          <div className="w-1 h-6 bg-primary rounded-full shadow" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* PREVIEW CELULAR */
                    <div
                      style={getBannerBackgroundStyle(editingBanner)}
                      className="w-full max-w-[340px] h-44 rounded-2xl overflow-hidden relative border border-white/20 shadow-xl flex items-center justify-between p-2 transition-all"
                    >
                      {editingBanner.ambientGlow && (
                        <div
                          style={{
                            background: `radial-gradient(circle at center, ${editingBanner.ambientGlowColor || '#10b981'}40 0%, transparent 70%)`,
                          }}
                          className="absolute inset-0 pointer-events-none z-0 blur-xl"
                        />
                      )}
                      {editingBanner.overlayOpacity ? (
                        <div
                          style={{ opacity: editingBanner.overlayOpacity / 100 }}
                          className="absolute inset-0 bg-black pointer-events-none z-10"
                        />
                      ) : null}

                      {/* Lado Esquerdo Mobile: Foto Proporcional */}
                      <div
                        style={getImageCardContainerStyle('left', editingBanner, true)}
                        className="relative overflow-hidden shadow-md border border-white/20 shrink-0 select-none"
                      >
                        <img
                          src={editingBanner.leftImage || '/images/look-3214.png'}
                          alt="Foto Modelo"
                          style={getImageInlineStyle('left', editingBanner)}
                          className="h-full w-full object-top"
                        />
                      </div>

                      {/* Lado Direito Mobile: Textos & Botão */}
                      <div className="relative z-20 w-[55%] h-full flex flex-col items-center justify-center text-center px-1.5 py-1 my-auto overflow-hidden">
                        <span
                          style={{ color: editingBanner.titleColor || '#ffffff' }}
                          className="text-[8px] font-extrabold tracking-widest uppercase mb-0.5 line-clamp-1"
                        >
                          {editingBanner.title || 'TÍTULO'}
                        </span>

                        {editingBanner.discountHighlight && (
                          <div className="text-[11px] font-black uppercase text-amber-300 leading-tight line-clamp-1">
                            {editingBanner.discountHighlight}
                          </div>
                        )}

                        {editingBanner.couponCode && (
                          <div className="text-[8px] font-mono bg-black/60 text-amber-300 px-1.5 py-0.5 rounded my-0.5 border border-white/20">
                            CUPOM: {editingBanner.couponCode}
                          </div>
                        )}

                        <p
                          style={{ color: editingBanner.subtitleColor || 'rgba(255,255,255,0.8)' }}
                          className="text-[8px] line-clamp-1 my-0.5"
                        >
                          {editingBanner.subtitle || 'Subtítulo da peça'}
                        </p>

                        <div
                          style={getBannerButtonStyle(editingBanner)}
                          className={`inline-flex items-center gap-0.5 px-2.5 py-1 ${getBannerButtonRadiusClass(editingBanner.buttonRadius)} text-[9px] font-bold uppercase shadow-sm select-none mt-1`}
                        >
                          <span>{editingBanner.buttonText || 'COMPRAR'}</span>
                          <ArrowRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BARRA DE NAVEGAÇÃO DAS ABAS DO STUDIO */}
              <div className="flex items-center gap-1.5 border-b border-border pb-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setBannerStudioTab('fotos')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    bannerStudioTab === 'fotos'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Fotos & Enquadramento</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerStudioTab('filtros')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    bannerStudioTab === 'filtros'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Filtros & Efeitos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerStudioTab('design')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    bannerStudioTab === 'design'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Design & Fundo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerStudioTab('textos')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    bannerStudioTab === 'textos'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Textos & Tipografia</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBannerStudioTab('botao')}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                    bannerStudioTab === 'botao'
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-muted/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MousePointer className="w-4 h-4" />
                  <span>Botão de Ação (CTA)</span>
                </button>
              </div>

              {/* ========================================================= */}
              {/* ABA 1: FOTOS & ENQUADRAMENTO (TAMANHO, POSIÇÃO, ESPELHO) */}
              {/* ========================================================= */}
              {bannerStudioTab === 'fotos' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Banner Explicativo de Redimensionamento Interativo */}
                  <div className="md:col-span-2 p-3 bg-primary/10 border border-primary/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-foreground font-semibold">
                      <Move className="w-4 h-4 text-primary shrink-0 animate-pulse" />
                      <span>
                        <strong>Redimensionamento com o Mouse:</strong> Arraste diretamente as alças nas fotos do preview acima para mudar a dimensão, ou use os controles de precisão abaixo.
                      </span>
                    </div>
                    <span className="text-[10px] text-primary font-bold bg-background px-2.5 py-1 rounded-full border border-primary/20 shrink-0">
                      ✓ Proporcional & Responsivo
                    </span>
                  </div>

                  {/* FOTO 1 (ESQUERDA / PRINCIPAL) */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        Foto 1 (Esquerda / Principal)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Dimensão: {editingBanner.leftImageCardWidth ?? 26}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
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
                        className="bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 text-[11px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingBannerLeft ? 'Enviando...' : 'Do Computador'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBannerProductPhotoPickerSide(
                            bannerProductPhotoPickerSide === 'left' ? null : 'left'
                          )
                        }
                        className="bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors border border-border text-[11px]"
                      >
                        <Package className="w-3.5 h-3.5 text-primary" />
                        <span>{bannerProductPhotoPickerSide === 'left' ? 'Fechar' : 'Do Catálogo'}</span>
                      </button>
                    </div>

                    {bannerProductPhotoPickerSide === 'left' && (
                      <div className="p-2.5 bg-muted/60 border border-primary/30 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-primary block">
                          Clique na foto de produto desejada:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {products.flatMap((p) =>
                            (p.images || []).map((imgUrl, i) => (
                              <button
                                key={`banner-left-${p.id}-${i}`}
                                type="button"
                                onClick={() => {
                                  setEditingBanner((prev) =>
                                    prev ? { ...prev, leftImage: imgUrl } : prev
                                  );
                                  setBannerProductPhotoPickerSide(null);
                                  showToast(`Foto do produto "${p.name}" aplicada à Foto 1!`);
                                }}
                                className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                              >
                                <img src={imgUrl} alt={p.name} className="w-full h-full object-cover object-top" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem 1..."
                      value={editingBanner.leftImage || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, leftImage: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-[11px] outline-none"
                    />

                    {/* DIMENSÃO / LARGURA DO CARD (ARRASTÁVEL COM O MOUSE) */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-primary" />
                          Dimensão / Largura do Card:
                        </span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {editingBanner.leftImageCardWidth ?? 26}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="40"
                        step="1"
                        value={editingBanner.leftImageCardWidth ?? 26}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImageCardWidth: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: 'Compacto', val: 20 },
                          { label: 'Editorial', val: 26 },
                          { label: 'Destaque', val: 32 },
                          { label: 'Amplo', val: 38 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() =>
                              setEditingBanner({
                                ...editingBanner,
                                leftImageCardWidth: preset.val,
                              })
                            }
                            className={`py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                              (editingBanner.leftImageCardWidth ?? 26) === preset.val
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Altura Proporcional */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-semibold text-muted-foreground">Altura do Card:</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.leftImageCardHeight ?? 85}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="65"
                        max="95"
                        step="1"
                        value={editingBanner.leftImageCardHeight ?? 85}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImageCardHeight: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />

                      {/* Arredondamento dos Cantos */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-semibold text-muted-foreground">Arredondamento dos Cantos:</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.leftImageCardRadius ?? 24}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={editingBanner.leftImageCardRadius ?? 24}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImageCardRadius: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Escala / Zoom */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-primary" />
                          Zoom / Tamanho:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.leftImageScale ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={editingBanner.leftImageScale ?? 100}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImageScale: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Posição Horizontal (X) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground">Posição Horizontal (X):</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.leftImagePositionX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingBanner.leftImagePositionX ?? 50}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImagePositionX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Posição Vertical (Y) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground">Posição Vertical (Y):</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.leftImagePositionY ?? 20}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingBanner.leftImagePositionY ?? 20}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImagePositionY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Ajuste (Cover/Contain) e Espelhar Horizontal */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingBanner({
                              ...editingBanner,
                              leftImageFit: 'cover',
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            (editingBanner.leftImageFit || 'cover') === 'cover'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Preencher (Cover)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingBanner({
                              ...editingBanner,
                              leftImageFit: 'contain',
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            editingBanner.leftImageFit === 'contain'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Conter (Contain)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingBanner({
                            ...editingBanner,
                            leftImageFlipX: !editingBanner.leftImageFlipX,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          editingBanner.leftImageFlipX
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-muted-foreground border-border'
                        }`}
                      >
                        {editingBanner.leftImageFlipX ? '✓ Espelhado' : '⇄ Espelhar'}
                      </button>
                    </div>
                  </div>

                  {/* FOTO 2 (DIREITA / DETALHES) */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-primary" />
                        Foto 2 (Direita / Detalhes)
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Dimensão: {editingBanner.rightImageCardWidth ?? 26}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
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
                        className="bg-primary hover:bg-primary-hover text-white py-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 text-[11px]"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingBannerRight ? 'Enviando...' : 'Do Computador'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setBannerProductPhotoPickerSide(
                            bannerProductPhotoPickerSide === 'right' ? null : 'right'
                          )
                        }
                        className="bg-muted hover:bg-muted/80 text-foreground py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition-colors border border-border text-[11px]"
                      >
                        <Package className="w-3.5 h-3.5 text-primary" />
                        <span>{bannerProductPhotoPickerSide === 'right' ? 'Fechar' : 'Do Catálogo'}</span>
                      </button>
                    </div>

                    {bannerProductPhotoPickerSide === 'right' && (
                      <div className="p-2.5 bg-muted/60 border border-primary/30 rounded-xl space-y-1.5">
                        <span className="text-[10px] font-bold text-primary block">
                          Clique na foto de produto desejada:
                        </span>
                        <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {products.flatMap((p) =>
                            (p.images || []).map((imgUrl, i) => (
                              <button
                                key={`banner-right-${p.id}-${i}`}
                                type="button"
                                onClick={() => {
                                  setEditingBanner((prev) =>
                                    prev ? { ...prev, rightImage: imgUrl } : prev
                                  );
                                  setBannerProductPhotoPickerSide(null);
                                  showToast(`Foto do produto "${p.name}" aplicada à Foto 2!`);
                                }}
                                className="aspect-[3/4] rounded-lg overflow-hidden border border-border hover:border-primary transition-all"
                              >
                                <img src={imgUrl} alt={p.name} className="w-full h-full object-cover object-top" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <input
                      type="text"
                      placeholder="Ou cole a URL da imagem 2..."
                      value={editingBanner.rightImage || ''}
                      onChange={(e) =>
                        setEditingBanner({ ...editingBanner, rightImage: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-2.5 py-1.5 text-[11px] outline-none"
                    />

                    {/* DIMENSÃO / LARGURA DO CARD (ARRASTÁVEL COM O MOUSE) */}
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-foreground flex items-center gap-1.5">
                          <Maximize2 className="w-3.5 h-3.5 text-primary" />
                          Dimensão / Largura do Card:
                        </span>
                        <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {editingBanner.rightImageCardWidth ?? 26}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="40"
                        step="1"
                        value={editingBanner.rightImageCardWidth ?? 26}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImageCardWidth: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { label: 'Compacto', val: 20 },
                          { label: 'Editorial', val: 26 },
                          { label: 'Destaque', val: 32 },
                          { label: 'Amplo', val: 38 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() =>
                              setEditingBanner({
                                ...editingBanner,
                                rightImageCardWidth: preset.val,
                              })
                            }
                            className={`py-1 text-[10px] font-semibold rounded-lg border transition-all ${
                              (editingBanner.rightImageCardWidth ?? 26) === preset.val
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background hover:bg-muted text-muted-foreground border-border'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      {/* Altura Proporcional */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-semibold text-muted-foreground">Altura do Card:</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.rightImageCardHeight ?? 85}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="65"
                        max="95"
                        step="1"
                        value={editingBanner.rightImageCardHeight ?? 85}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImageCardHeight: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />

                      {/* Arredondamento dos Cantos */}
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="font-semibold text-muted-foreground">Arredondamento dos Cantos:</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.rightImageCardRadius ?? 24}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        step="2"
                        value={editingBanner.rightImageCardRadius ?? 24}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImageCardRadius: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Escala / Zoom */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground flex items-center gap-1">
                          <ZoomIn className="w-3 h-3 text-primary" />
                          Zoom / Tamanho:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.rightImageScale ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={editingBanner.rightImageScale ?? 100}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImageScale: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Posição Horizontal (X) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground">Posição Horizontal (X):</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.rightImagePositionX ?? 50}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingBanner.rightImagePositionX ?? 50}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImagePositionX: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Controles de Posição Vertical (Y) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-muted-foreground">Posição Vertical (Y):</span>
                        <span className="font-mono font-bold text-foreground">
                          {editingBanner.rightImagePositionY ?? 20}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={editingBanner.rightImagePositionY ?? 20}
                        onChange={(e) =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImagePositionY: Number(e.target.value),
                          })
                        }
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Ajuste (Cover/Contain) e Espelhar Horizontal */}
                    <div className="flex items-center justify-between pt-1 gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditingBanner({
                              ...editingBanner,
                              rightImageFit: 'cover',
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            (editingBanner.rightImageFit || 'cover') === 'cover'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Preencher (Cover)
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingBanner({
                              ...editingBanner,
                              rightImageFit: 'contain',
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                            editingBanner.rightImageFit === 'contain'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Conter (Contain)
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingBanner({
                            ...editingBanner,
                            rightImageFlipX: !editingBanner.rightImageFlipX,
                          })
                        }
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                          editingBanner.rightImageFlipX
                            ? 'bg-primary text-white border-primary'
                            : 'bg-background text-muted-foreground border-border'
                        }`}
                      >
                        {editingBanner.rightImageFlipX ? '✓ Espelhado' : '⇄ Espelhar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ABA 2: FILTROS & EFEITOS (BRILHO, CONTRASTE, P&B, SÉPIA)  */}
              {/* ========================================================= */}
              {bannerStudioTab === 'filtros' && (
                <div className="space-y-4">
                  {/* Seletor de alvo dos filtros */}
                  <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-xl border border-border">
                    <span className="text-xs font-bold text-foreground">
                      Ajustar Filtros Para:
                    </span>
                    <div className="inline-flex gap-1">
                      <button
                        type="button"
                        onClick={() => setBannerFilterSide('left')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          bannerFilterSide === 'left'
                            ? 'bg-primary text-white'
                            : 'bg-background text-muted-foreground border border-border'
                        }`}
                      >
                        Foto 1 (Esquerda)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerFilterSide('right')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          bannerFilterSide === 'right'
                            ? 'bg-primary text-white'
                            : 'bg-background text-muted-foreground border border-border'
                        }`}
                      >
                        Foto 2 (Direita)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBannerFilterSide('both')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          bannerFilterSide === 'both'
                            ? 'bg-primary text-white'
                            : 'bg-background text-muted-foreground border border-border'
                        }`}
                      >
                        Ambas as Fotos
                      </button>
                    </div>
                  </div>

                  {/* Presets Rápidos de 1 Clique */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                      ⚡ Efeitos & Presets Rápidos:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const reset = {
                            brightness: 100,
                            contrast: 100,
                            saturate: 100,
                            blur: 0,
                            grayscale: 0,
                            sepia: 0,
                            opacity: 100,
                          };
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageBrightness = reset.brightness;
                              update.leftImageContrast = reset.contrast;
                              update.leftImageSaturate = reset.saturate;
                              update.leftImageBlur = reset.blur;
                              update.leftImageGrayscale = reset.grayscale;
                              update.leftImageSepia = reset.sepia;
                              update.leftImageOpacity = reset.opacity;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageBrightness = reset.brightness;
                              update.rightImageContrast = reset.contrast;
                              update.rightImageSaturate = reset.saturate;
                              update.rightImageBlur = reset.blur;
                              update.rightImageGrayscale = reset.grayscale;
                              update.rightImageSepia = reset.sepia;
                              update.rightImageOpacity = reset.opacity;
                            }
                            return update;
                          });
                          showToast('Filtros resetados para Padrão!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">Original</div>
                        <div className="text-[10px] text-muted-foreground">Sem efeitos</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageGrayscale = 100;
                              update.leftImageContrast = 115;
                              update.leftImageBrightness = 102;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageGrayscale = 100;
                              update.rightImageContrast = 115;
                              update.rightImageBrightness = 102;
                            }
                            return update;
                          });
                          showToast('Preset P&B Nobre aplicado!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">🖤 P&B Nobre</div>
                        <div className="text-[10px] text-muted-foreground">Grayscale 100%</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageSaturate = 140;
                              update.leftImageContrast = 112;
                              update.leftImageBrightness = 102;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageSaturate = 140;
                              update.rightImageContrast = 112;
                              update.rightImageBrightness = 102;
                            }
                            return update;
                          });
                          showToast('Preset Vibrante aplicado!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">✨ Vibrante</div>
                        <div className="text-[10px] text-muted-foreground">Cores vivas</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageBrightness = 108;
                              update.leftImageSaturate = 88;
                              update.leftImageContrast = 96;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageBrightness = 108;
                              update.rightImageSaturate = 88;
                              update.rightImageContrast = 96;
                            }
                            return update;
                          });
                          showToast('Preset Suave Editorial aplicado!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">🌸 Editorial</div>
                        <div className="text-[10px] text-muted-foreground">Luz suave</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageContrast = 125;
                              update.leftImageBrightness = 92;
                              update.leftImageSaturate = 110;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageContrast = 125;
                              update.rightImageBrightness = 92;
                              update.rightImageSaturate = 110;
                            }
                            return update;
                          });
                          showToast('Preset Noturno aplicado!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">🌙 Noturno</div>
                        <div className="text-[10px] text-muted-foreground">Alto contraste</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const update: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') {
                              update.leftImageSepia = 50;
                              update.leftImageBrightness = 104;
                              update.leftImageContrast = 98;
                            }
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') {
                              update.rightImageSepia = 50;
                              update.rightImageBrightness = 104;
                              update.rightImageContrast = 98;
                            }
                            return update;
                          });
                          showToast('Preset Vintage aplicado!');
                        }}
                        className="p-2.5 rounded-xl border border-border bg-card hover:border-primary text-left text-xs transition-all"
                      >
                        <div className="font-bold text-foreground">🌾 Vintage</div>
                        <div className="text-[10px] text-muted-foreground">Sépia quente</div>
                      </button>
                    </div>
                  </div>

                  {/* Sliders Detalhados de Filtros */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Brilho */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Brilho (Brightness):</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageBrightness : editingBanner.leftImageBrightness) ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageBrightness : editingBanner.leftImageBrightness) ?? 100}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageBrightness = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageBrightness = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Contraste */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Contraste (Contrast):</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageContrast : editingBanner.leftImageContrast) ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="180"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageContrast : editingBanner.leftImageContrast) ?? 100}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageContrast = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageContrast = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Saturação */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Saturação de Cores:</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageSaturate : editingBanner.leftImageSaturate) ?? 100}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageSaturate : editingBanner.leftImageSaturate) ?? 100}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageSaturate = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageSaturate = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Desfoque (Blur) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Desfoque (Blur):</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageBlur : editingBanner.leftImageBlur) ?? 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="15"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageBlur : editingBanner.leftImageBlur) ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageBlur = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageBlur = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Tons de Cinza (Grayscale) */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Preto & Branco (Grayscale):</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageGrayscale : editingBanner.leftImageGrayscale) ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageGrayscale : editingBanner.leftImageGrayscale) ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageGrayscale = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageGrayscale = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>

                    {/* Efeito Sépia */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-muted-foreground">Efeito Sépia Vintage:</span>
                        <span className="font-mono font-bold text-foreground">
                          {(bannerFilterSide === 'right' ? editingBanner.rightImageSepia : editingBanner.leftImageSepia) ?? 0}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={(bannerFilterSide === 'right' ? editingBanner.rightImageSepia : editingBanner.leftImageSepia) ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingBanner((prev) => {
                            if (!prev) return prev;
                            const u: any = { ...prev };
                            if (bannerFilterSide === 'left' || bannerFilterSide === 'both') u.leftImageSepia = val;
                            if (bannerFilterSide === 'right' || bannerFilterSide === 'both') u.rightImageSepia = val;
                            return u;
                          });
                        }}
                        className="w-full accent-primary cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ABA 3: DESIGN, FUNDO & AURA GLOW                          */}
              {/* ========================================================= */}
              {bannerStudioTab === 'design' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Estilo Visual do Banner */}
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2">
                      <label className="block text-xs font-bold text-foreground">
                        Diagramação do Banner:
                      </label>
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
                        <option value="classic-3col">🌿 Carrossel Clássico 3 Colunas (Verde Nobre)</option>
                      </select>
                    </div>

                    {/* Altura do Banner */}
                    <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2">
                      <label className="block text-xs font-bold text-foreground">
                        Altura do Banner na Loja:
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, bannerHeight: 'compact' })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            editingBanner.bannerHeight === 'compact'
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Compacto
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, bannerHeight: 'normal' })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            (editingBanner.bannerHeight || 'normal') === 'normal'
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Padrão (Médio)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, bannerHeight: 'tall' })}
                          className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                            editingBanner.bannerHeight === 'tall'
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Alto / Imersivo
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Fundo: Sólido vs Gradiente & Seletor de Cores */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">
                        Cor e Efeito do Fundo:
                      </span>
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, backgroundType: 'solid' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            (editingBanner.backgroundType || 'solid') === 'solid'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Cor Sólida
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingBanner({ ...editingBanner, backgroundType: 'gradient' })}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                            editingBanner.backgroundType === 'gradient'
                              ? 'bg-primary text-white border-primary'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          Gradiente
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Cor Primária */}
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-muted-foreground">
                          Cor Principal do Fundo:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.centerBgColor || '#123922'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, centerBgColor: e.target.value })
                            }
                            className="w-10 h-10 rounded-xl cursor-pointer border border-border bg-transparent p-0.5"
                          />
                          <input
                            type="text"
                            value={editingBanner.centerBgColor || '#123922'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, centerBgColor: e.target.value })
                            }
                            className="w-32 bg-background border border-border rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none"
                          />
                        </div>

                        {/* Cores Sugeridas Aura */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-muted-foreground">Aura:</span>
                          {[
                            { name: 'Verde Aura', hex: '#123922' },
                            { name: 'Dark Chic', hex: '#0b1610' },
                            { name: 'Off-White', hex: '#f5f5f3' },
                            { name: 'Slate', hex: '#0f172a' },
                            { name: 'Terracota', hex: '#3b1d11' },
                            { name: 'Dourado', hex: '#453209' },
                          ].map((col) => (
                            <button
                              key={col.hex}
                              type="button"
                              onClick={() => setEditingBanner({ ...editingBanner, centerBgColor: col.hex })}
                              title={col.name}
                              style={{ backgroundColor: col.hex }}
                              className="w-6 h-6 rounded-full border border-white/30 shadow-xs hover:scale-110 transition-transform"
                            />
                          ))}
                        </div>
                      </div>

                      {/* Gradiente Secundário (Se Gradiente) */}
                      {editingBanner.backgroundType === 'gradient' ? (
                        <div className="space-y-1.5">
                          <label className="block text-[11px] font-semibold text-muted-foreground">
                            Cor Final do Gradiente:
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={editingBanner.bgGradientEndColor || '#0d2818'}
                              onChange={(e) =>
                                setEditingBanner({ ...editingBanner, bgGradientEndColor: e.target.value })
                              }
                              className="w-10 h-10 rounded-xl cursor-pointer border border-border bg-transparent p-0.5"
                            />
                            <input
                              type="text"
                              value={editingBanner.bgGradientEndColor || '#0d2818'}
                              onChange={(e) =>
                                setEditingBanner({ ...editingBanner, bgGradientEndColor: e.target.value })
                              }
                              className="w-32 bg-background border border-border rounded-xl px-2.5 py-2 text-xs font-mono font-bold outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-1 pt-1">
                            <span className="text-[10px] text-muted-foreground mr-1">Direção:</span>
                            {(['to-r', 'to-b', 'to-br'] as const).map((dir) => (
                              <button
                                key={dir}
                                type="button"
                                onClick={() => setEditingBanner({ ...editingBanner, gradientDirection: dir })}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                  (editingBanner.gradientDirection || 'to-r') === dir
                                    ? 'bg-primary text-white border-primary'
                                    : 'bg-background text-muted-foreground border-border'
                                }`}
                              >
                                {dir === 'to-r' ? '→ Horizontal' : dir === 'to-b' ? '↓ Vertical' : '↘ Diagonal'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-muted-foreground">Escurecimento Geral (Overlay):</span>
                            <span className="font-mono font-bold text-foreground">
                              {editingBanner.overlayOpacity ?? 0}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="80"
                            value={editingBanner.overlayOpacity ?? 0}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, overlayOpacity: Number(e.target.value) })
                            }
                            className="w-full accent-primary cursor-pointer"
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Ajuda a destacar textos sobre fotos muito claras.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aura Glow Efeito de Luz de Fundo */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        Efeito Aura Glow (Luz Ambiente Radiante)
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Adiciona um halo de luz difusa e sofisticada atrás dos modelos e textos.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {editingBanner.ambientGlow && (
                        <div className="flex items-center gap-1">
                          {['#10b981', '#eab308', '#f43f5e', '#38bdf8', '#a855f7'].map((glowColor) => (
                            <button
                              key={glowColor}
                              type="button"
                              onClick={() => setEditingBanner({ ...editingBanner, ambientGlowColor: glowColor })}
                              style={{ backgroundColor: glowColor }}
                              className={`w-6 h-6 rounded-full border-2 transition-transform ${
                                (editingBanner.ambientGlowColor || '#10b981') === glowColor
                                  ? 'border-white scale-110 shadow-md'
                                  : 'border-transparent opacity-60'
                              }`}
                            />
                          ))}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setEditingBanner({
                            ...editingBanner,
                            ambientGlow: !editingBanner.ambientGlow,
                          })
                        }
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          editingBanner.ambientGlow
                            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                            : 'bg-background text-muted-foreground border-border'
                        }`}
                      >
                        {editingBanner.ambientGlow ? '✓ Brilho Ativado' : 'Desativado'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ABA 4: TEXTOS, CUPOM, DESCONTO & TIPOGRAFIA               */}
              {/* ========================================================= */}
              {bannerStudioTab === 'textos' && (
                <div className="space-y-4">
                  {/* Badge Superior */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-foreground block">
                      Badge / Selo Superior (Destaque):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Texto do Badge:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: NOVA COLEÇÃO 2026, 🔥 BLACK FRIDAY, ★ MAIS DESEJADOS"
                          value={editingBanner.badge || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, badge: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none font-bold"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            Cor Fundo:
                          </label>
                          <input
                            type="color"
                            value={editingBanner.badgeBgColor || '#e5a93c'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, badgeBgColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                            Cor Texto:
                          </label>
                          <input
                            type="color"
                            value={editingBanner.badgeTextColor || '#000000'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, badgeTextColor: e.target.value })}
                            className="w-full h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Título Principal */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-foreground block">
                      Título Principal do Banner:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Texto do Título:
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: FORÇA & EFEITO LIPO, BEST SELLERS"
                          value={editingBanner.title || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm outline-none font-black"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Cor do Título:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.titleColor || '#ffffff'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, titleColor: e.target.value })}
                            className="w-9 h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBanner.titleColor || '#ffffff'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, titleColor: e.target.value })}
                            className="w-24 bg-background border border-border rounded-xl px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Estilo da Fonte:
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, titleFontFamily: 'serif' })}
                            className={`py-1.5 rounded-xl text-xs font-serif font-bold border transition-all ${
                              (editingBanner.titleFontFamily || 'serif') === 'serif'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            Serifada Chic (Aura)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, titleFontFamily: 'sans' })}
                            className={`py-1.5 rounded-xl text-xs font-sans font-bold border transition-all ${
                              editingBanner.titleFontFamily === 'sans'
                                ? 'bg-primary text-white border-primary'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            Sem Serifa (Moderna)
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                          <span>Tamanho da Fonte:</span>
                          <span className="font-mono text-foreground">{editingBanner.titleFontSize || 36}px</span>
                        </div>
                        <input
                          type="range"
                          min="24"
                          max="72"
                          value={editingBanner.titleFontSize || 36}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, titleFontSize: Number(e.target.value) })
                          }
                          className="w-full accent-primary cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Subtítulo */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-bold text-foreground block">
                      Subtítulo Descritivo:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Texto do Subtítulo:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Conjuntos anatômicos que abraçam seu movimento com sustentação premium..."
                          value={editingBanner.subtitle || ''}
                          onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                          className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                          Cor do Subtítulo:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.subtitleColor || '#e2e8f0'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, subtitleColor: e.target.value })}
                            className="w-9 h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBanner.subtitleColor || '#e2e8f0'}
                            onChange={(e) => setEditingBanner({ ...editingBanner, subtitleColor: e.target.value })}
                            className="w-24 bg-background border border-border rounded-xl px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desconto, Cupom e Regras */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none font-bold"
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
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none font-mono font-bold"
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
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================= */}
              {/* ABA 5: BOTÃO DE AÇÃO (CTA), FORMATO, CORES & GLOW         */}
              {/* ========================================================= */}
              {bannerStudioTab === 'botao' && (
                <div className="space-y-4">
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Texto do Botão CTA:
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: COMPRAR AGORA, VER CONJUNTOS, MODA VERÃO"
                          value={editingBanner.buttonText || ''}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, buttonText: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1">
                          Destino ao Clicar no Botão:
                        </label>
                        <select
                          value={editingBanner.link || '/catalogo'}
                          onChange={(e) =>
                            setEditingBanner({ ...editingBanner, link: e.target.value })
                          }
                          className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs font-semibold outline-none"
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

                    {/* Cores do Botão (Fundo, Texto e Borda) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-muted-foreground">
                          Cor de Fundo do Botão:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.buttonBgColor || '#ffffff'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonBgColor: e.target.value })
                            }
                            className="w-9 h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBanner.buttonBgColor || '#ffffff'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonBgColor: e.target.value })
                            }
                            className="w-24 bg-background border border-border rounded-xl px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>

                        {/* Cores Rápidas para o Botão */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {[
                            { name: 'Branco', hex: '#ffffff' },
                            { name: 'Dourado', hex: '#E5A93C' },
                            { name: 'Verde Aura', hex: '#123922' },
                            { name: 'Preto', hex: '#0a0a0a' },
                            { name: 'Rosa Vibrante', hex: '#f43f5e' },
                          ].map((bCol) => (
                            <button
                              key={bCol.hex}
                              type="button"
                              onClick={() => setEditingBanner({ ...editingBanner, buttonBgColor: bCol.hex })}
                              title={bCol.name}
                              style={{ backgroundColor: bCol.hex }}
                              className="w-5 h-5 rounded-full border border-black/20 shadow-xs hover:scale-110 transition-transform"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-muted-foreground">
                          Cor do Texto do Botão:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.buttonTextColor || '#0a0a0a'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonTextColor: e.target.value })
                            }
                            className="w-9 h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBanner.buttonTextColor || '#0a0a0a'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonTextColor: e.target.value })
                            }
                            className="w-24 bg-background border border-border rounded-xl px-2 py-1.5 text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-semibold text-muted-foreground">
                          Cor da Borda (Opcional):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={editingBanner.buttonBorderColor || '#e2e8f0'}
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonBorderColor: e.target.value })
                            }
                            className="w-9 h-9 rounded-xl border border-border p-1 bg-background cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingBanner.buttonBorderColor || ''}
                            placeholder="Nenhuma"
                            onChange={(e) =>
                              setEditingBanner({ ...editingBanner, buttonBorderColor: e.target.value })
                            }
                            className="w-24 bg-background border border-border rounded-xl px-2 py-1.5 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Formato do Botão & Brilho Glow */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                      <div>
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Formato e Cantos do Botão:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, buttonRadius: 'rounded-full' })}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              (editingBanner.buttonRadius || 'rounded-full') === 'rounded-full'
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            Pílula (Redondo)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, buttonRadius: 'rounded-2xl' })}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              editingBanner.buttonRadius === 'rounded-2xl'
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            Suave (2xl)
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingBanner({ ...editingBanner, buttonRadius: 'rounded-none' })}
                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                              editingBanner.buttonRadius === 'rounded-none'
                                ? 'bg-primary text-white border-primary shadow-xs'
                                : 'bg-background text-muted-foreground border-border'
                            }`}
                          >
                            Reto Moderno
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="block text-xs font-bold text-foreground mb-1.5">
                          Brilho Neon / Glow no Botão:
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setEditingBanner({
                              ...editingBanner,
                              buttonGlow: !editingBanner.buttonGlow,
                            })
                          }
                          className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                            editingBanner.buttonGlow
                              ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black'
                              : 'bg-background text-muted-foreground border-border'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{editingBanner.buttonGlow ? '✓ Brilho Luminoso Ativado' : 'Sem Brilho Glow'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com Ações */}
            <div className="border-t border-border px-6 py-3.5 bg-muted/20 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Dica: Você pode visualizar em 💻 Computador e 📱 Celular no topo antes de salvar.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-secondary/80 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveBanner}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all text-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Todas as Alterações</span>
                </button>
              </div>
            </div>
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
