import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Maximize2,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Upload,
  Star,
  Eye,
  ImageIcon,
  FolderTree,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getProducts,
  fetchProductsAsync,
  saveProduct,
  saveProductAsync,
  saveAllProducts,
  deleteProduct,
  bulkDeleteProductsAsync,
  deleteAllProductsAsync,
  aiGenerateProductDescription,
  aiGenerateSeoMeta,
} from '../../lib/dataClient';
import { formatCurrency } from '../../lib/utils';
import { Product, ProductColor } from '../../types';
import { ProductImporterModal } from '../../components/admin/ProductImporterModal';
import { ProductCard } from '../../components/store/ProductCard';
import { ProductMediaView } from '../../components/store/ProductMediaView';
import {
  classifyProduct,
  cleanModelName,
  consolidateDuplicateProducts,
  STORE_CATEGORIES,
  STORE_COLORS,
  AvailableColor,
  AvailableCategory,
  normalizeCategoryName,
  isProductMatchingCategory,
  getProductCategories,
  removeProductFromCategory,
  assignProductToCategory,
  getStoredCategories,
  saveNewCategory,
  resizeImageFile,
  isVideoMedia,
  getProductMediaSlides,
} from '../../lib/productClassifier';
import { useLightbox } from '../../contexts/LightboxContext';

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'visual'>('table');
  const [organizeMode, setOrganizeMode] = useState<'category' | 'color'>('category');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('todos');

  // Lightbox for image expansion
  const { openLightbox } = useLightbox();

  // Multi-selection & Bulk Delete states
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Drag & Drop Feedback States
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null);
  const [activeHoverZone, setActiveHoverZone] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporterOpen, setIsImporterOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [pendingCategoryMove, setPendingCategoryMove] = useState<{
    product: Product;
    sourceCategory: string;
    targetCategory: string;
  } | null>(null);

  // Image organizer & Live Preview states
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to reorder images in carousel
  const handleMoveImage = (index: number, direction: -1 | 1) => {
    if (!editingProduct?.images) return;
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= editingProduct.images.length) return;

    const updated = [...editingProduct.images];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;

    setEditingProduct({
      ...editingProduct,
      images: updated,
    });
  };

  // Helper to set image as main cover (position 0)
  const handleSetCoverImage = (index: number) => {
    if (!editingProduct?.images || index === 0) return;
    const updated = [...editingProduct.images];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);

    setEditingProduct({
      ...editingProduct,
      images: updated,
    });
    showToast('✓ Foto definida como Capa Principal da vitrine!');
  };

  // Helper to remove an image
  const handleRemoveImage = (index: number) => {
    if (!editingProduct?.images) return;
    if (editingProduct.images.length <= 1) {
      alert('O produto precisa ter pelo menos 1 foto.');
      return;
    }
    const updated = editingProduct.images.filter((_, idx) => idx !== index);
    setEditingProduct({
      ...editingProduct,
      images: updated,
    });
  };

  // Helper to add an image or video by URL
  const handleAddImageUrl = () => {
    const trimmed = newImageUrl.trim();
    if (!trimmed || !editingProduct) return;
    const current = [...(editingProduct.images || [])];
    const isVid = isVideoMedia(trimmed);
    if (isVid && current.length >= 1 && !isVideoMedia(current[0])) {
      current.splice(1, 0, trimmed);
    } else {
      current.push(trimmed);
    }
    setEditingProduct({
      ...editingProduct,
      images: current,
      videoUrl: isVid ? trimmed : editingProduct.videoUrl,
    });
    setNewImageUrl('');
    showToast(isVid ? '✓ Vídeo adicionado ao carrossel (#2 Hover)!' : '✓ Foto adicionada ao carrossel!');
  };

  // Helper to upload images or videos from local computer / device
  const handleUploadPhotoFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;

    setIsUploadingPhoto(true);
    try {
      const updated = [...(editingProduct.images || [])];
      let latestVideoUrl = editingProduct.videoUrl;
      let addedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await resizeImageFile(file, 1200, 1200, 0.85);
        if (!dataUrl) continue;
        addedCount++;
        if (isVideoMedia(dataUrl)) {
          latestVideoUrl = dataUrl;
          // Posiciona o vídeo logo após a foto de capa (índice 1) para reproduzir ao passar o mouse
          if (updated.length >= 1 && !isVideoMedia(updated[0])) {
            updated.splice(1, 0, dataUrl);
          } else {
            updated.push(dataUrl);
          }
        } else {
          updated.push(dataUrl);
        }
      }

      setEditingProduct({
        ...editingProduct,
        images: updated,
        videoUrl: latestVideoUrl,
      });
      showToast(`✓ ${addedCount} arquivo(s) de mídia adicionado(s) ao carrossel!`);
    } catch (err) {
      console.error('Erro ao processar mídias:', err);
      showToast('Erro ao carregar mídias.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Live preview product object matching storefront ProductCard
  const previewProduct: Product = {
    id: editingProduct?.id || 'preview-temp',
    name: editingProduct?.name || 'Nome do Produto',
    slug: editingProduct?.slug || 'produto-preview',
    description: editingProduct?.description || 'Descrição do produto na vitrine...',
    fullDescription: editingProduct?.fullDescription || '',
    category: editingProduct?.category || categories[0]?.name || 'Leggings',
    price: editingProduct?.price || 149.9,
    promotionalPrice: editingProduct?.promotionalPrice,
    sku: editingProduct?.sku || 'AUR-SKU-001',
    barcode: editingProduct?.barcode || '7890000000000',
    weight: editingProduct?.weight || 250,
    brand: editingProduct?.brand || 'Aura Fitness',
    images:
      Array.isArray(editingProduct?.images) && editingProduct.images.length > 0
        ? editingProduct.images
        : ['/images/look-3103.png'],
    sizes: editingProduct?.sizes || ['P', 'M', 'G', 'GG'],
    colors:
      Array.isArray(editingProduct?.colors) && editingProduct.colors.length > 0
        ? editingProduct.colors
        : [{ name: 'Preto', hex: '#111111' }],
    materials: editingProduct?.materials || ['Poliamida', 'Elastano'],
    stock: editingProduct?.stock || { 'P-Preto': 10 },
    isFeatured: editingProduct?.isFeatured || false,
    isNewArrival: editingProduct?.isNewArrival ?? true,
    isBestSeller: editingProduct?.isBestSeller || false,
    isActive: editingProduct?.isActive ?? true,
    rating: editingProduct?.rating || 5.0,
    reviewCount: editingProduct?.reviewCount || 18,
    seo: editingProduct?.seo || { title: '', description: '', keywords: [] },
    createdAt: editingProduct?.createdAt || new Date().toISOString(),
  };

  const refreshProducts = () => {
    fetchProductsAsync().then((prods) => {
      setProducts([...prods]);
    });
  };

  useEffect(() => {
    refreshProducts();
    setCategories(getStoredCategories());

    const handleCategoriesUpdate = () => {
      setCategories(getStoredCategories());
    };
    const handleProductsUpdate = () => {
      setProducts([...getProducts()]);
    };
    window.addEventListener('aura_categories_updated', handleCategoriesUpdate);
    window.addEventListener('aura_products_updated', handleProductsUpdate);
    window.addEventListener('storage', handleCategoriesUpdate);
    return () => {
      window.removeEventListener('aura_categories_updated', handleCategoriesUpdate);
      window.removeEventListener('aura_products_updated', handleProductsUpdate);
      window.removeEventListener('storage', handleCategoriesUpdate);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Filtered List with safe null-checks
  const filteredProducts = products.filter((p) => {
    const name = p.name || '';
    const sku = p.sku || '';
    const category = p.category || '';
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      name.toLowerCase().includes(q) ||
      sku.toLowerCase().includes(q) ||
      category.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategoryFilter === 'todos' ||
      isProductMatchingCategory(p, selectedCategoryFilter);

    return matchesSearch && matchesCategory;
  });

  // Toggle selection for a single product
  const handleToggleSelectProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered products
  const handleToggleSelectAll = () => {
    if (filteredProducts.length === 0) return;
    const allFilteredSelected = filteredProducts.every((p) => selectedProductIds.has(p.id));
    if (allFilteredSelected) {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        filteredProducts.forEach((p) => next.add(p.id));
        return next;
      });
    }
  };

  // Clear all selections
  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  // Bulk delete selected products
  const handleBulkDeleteSelected = async () => {
    const count = selectedProductIds.size;
    if (count === 0) return;

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente os ${count} produtos selecionados?`)) {
      return;
    }

    setIsBulkDeleting(true);
    try {
      await bulkDeleteProductsAsync(Array.from(selectedProductIds));
      setSelectedProductIds(new Set());
      refreshProducts();
      showToast(`✓ ${count} produto(s) excluído(s) com sucesso.`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao excluir produtos selecionados.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Delete all products in catalog (Catalog Reset)
  const handleDeleteAllProducts = async () => {
    if (products.length === 0) {
      showToast('O catálogo já está vazio.');
      return;
    }

    const confirm1 = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a excluir TODOS os ${products.length} produtos do catálogo!\n\nEsta ação apagará permanentemente todos os produtos e não poderá ser desfeita.\n\nDeseja continuar?`
    );
    if (!confirm1) return;

    const confirm2 = window.prompt(
      'Para confirmar a exclusão de TODOS os produtos, digite a palavra EXCLUIR abaixo:'
    );
    if (confirm2?.trim().toUpperCase() !== 'EXCLUIR') {
      showToast('Exclusão cancelada (palavra de confirmação não confere).');
      return;
    }

    setIsBulkDeleting(true);
    try {
      await deleteAllProductsAsync();
      setSelectedProductIds(new Set());
      refreshProducts();
      showToast('✓ Todos os produtos foram excluídos com sucesso. Catálogo limpo!');
    } catch (err) {
      console.error(err);
      showToast('Erro ao limpar catálogo.');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Detecta se existem variações do mesmo modelo com numeração separada (ex: Rosa (2), Purple ())
  const duplicateStats = React.useMemo(() => {
    const modelKeys = new Set<string>();
    let count = 0;
    for (const p of products) {
      const key = cleanModelName(p.name).groupKey;
      if (modelKeys.has(key)) count++;
      else modelKeys.add(key);
    }
    return count;
  }, [products]);

  // Unifica automaticamente produtos duplicados com numeração no catálogo
  const handleConsolidateDuplicates = () => {
    const { consolidated, mergedCount } = consolidateDuplicateProducts(products);
    if (mergedCount === 0) {
      showToast('Nenhum modelo repetido foi encontrado.');
      return;
    }

    if (
      !window.confirm(
        `Detectamos ${mergedCount} variações de modelos duplicadas com numeração (ex: Rosa (2), Purple ()).\n\nDeseja unificar tudo em anúncios únicos, limpando os nomes e reunindo todas as fotos no carrossel do produto?`
      )
    ) {
      return;
    }

    try {
      saveAllProducts(consolidated);
      refreshProducts();
      showToast(`✓ ${mergedCount} modelo(s) e fotos foram unificados com sucesso!`);
    } catch (err) {
      console.error(err);
      showToast('Erro ao unificar modelos.');
    }
  };

  const handleOpenNewModal = () => {
    setEditingProduct({
      name: '',
      category: categories[0]?.name || 'Leggings',
      price: 149.9,
      promotionalPrice: 129.9,
      sku: `AUR-${Date.now().toString().slice(-4)}`,
      barcode: '7891234560000',
      weight: 250,
      brand: 'Aura Fitness',
      description: '',
      fullDescription: '',
      images: ['/images/look-3103.png'],
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
    setNewImageUrl('');
    setIsModalOpen(true);
  };

  const handleEdit = (prod: Product) => {
    setEditingProduct({
      ...prod,
      images:
        Array.isArray(prod.images) && prod.images.length > 0
          ? [...prod.images]
          : ['/images/look-3103.png'],
    });
    setNewImageUrl('');
    setIsModalOpen(true);
  };

  const handleRemoveFromSpecificCategory = async (prod: Product, categoryName: string) => {
    if (
      !window.confirm(
        `Remover "${prod.name}" apenas da categoria "${categoryName}"?\n\nO produto continuará salvo na loja (nas demais categorias ou em Sem Categoria).`
      )
    ) {
      return;
    }
    const { updatedProduct } = removeProductFromCategory(prod, categoryName);
    try {
      await saveProductAsync(updatedProduct);
    } catch {
      saveProduct(updatedProduct);
    }
    refreshProducts();
    showToast(`✓ Produto removido apenas da categoria "${categoryName}"!`);
  };

  const handleDelete = async (id: string) => {
    const prod = products.find((p) => p.id === id);
    if (prod && selectedCategoryFilter !== 'todos') {
      await handleRemoveFromSpecificCategory(prod, selectedCategoryFilter);
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir permanentemente este produto da loja?')) {
      await bulkDeleteProductsAsync([id]);
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      refreshProducts();
      showToast('Produto excluído com sucesso.');
    }
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    try {
      await saveProductAsync(editingProduct);
      setSelectedCategoryFilter('todos');
      setSearchQuery('');
      refreshProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
      showToast(`✓ Produto "${editingProduct.name}" salvo com sucesso!`);
    } catch (err) {
      console.error('Erro ao salvar no Supabase:', err);
      saveProduct(editingProduct);
      setProducts(getProducts());
      setIsModalOpen(false);
      setEditingProduct(null);
      showToast(`✓ Produto "${editingProduct.name}" salvo localmente!`);
    }
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
      handleQuickAssociateCategory(product, dropValue);
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

  // Quick Action: Associate Category / Color directly with confirmation for dual-category
  const handleQuickAssociateCategory = (product: Product, categoryName: string) => {
    if (isProductMatchingCategory(product, categoryName)) {
      showToast(`O produto já pertence à categoria "${categoryName}".`);
      return;
    }

    const currentCats = getProductCategories(product);
    if (currentCats.length === 0 || product.category === 'Sem Categoria') {
      const updated = assignProductToCategory(product, categoryName, 'move');
      saveProductAsync(updated).catch(() => saveProduct(updated));
      setProducts(getProducts());
      showToast(`✓ "${product.name}" movido para a categoria "${categoryName}"!`);
      return;
    }

    const sourceCat =
      selectedCategoryFilter !== 'todos' ? selectedCategoryFilter : currentCats[0];
    setPendingCategoryMove({
      product,
      sourceCategory: sourceCat,
      targetCategory: categoryName,
    });
  };

  const handleExecuteCategoryMove = async (mode: 'move' | 'both') => {
    if (!pendingCategoryMove) return;
    const { product, sourceCategory, targetCategory } = pendingCategoryMove;
    setPendingCategoryMove(null);

    const updated = assignProductToCategory(
      product,
      targetCategory,
      mode === 'both' ? 'add-both' : 'move',
      sourceCategory
    );
    try {
      await saveProductAsync(updated);
    } catch {
      saveProduct(updated);
    }
    refreshProducts();

    if (mode === 'both') {
      showToast(
        `✓ "${product.name}" agora consta em "${sourceCategory}" e "${targetCategory}"!`
      );
    } else {
      showToast(`✓ "${product.name}" movido apenas para "${targetCategory}"!`);
    }
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
          <Link
            to="/admin/categorias"
            className="bg-muted hover:bg-muted/80 text-foreground border border-border font-bold text-xs py-3 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            title="Gerenciar Categorias da Loja"
          >
            <FolderTree className="w-4 h-4 text-primary" />
            <span>Categorias</span>
          </Link>

          <Link
            to="/admin/fotos-catalogos"
            className="bg-muted hover:bg-muted/80 text-foreground border border-border font-bold text-xs py-3 px-3.5 rounded-xl shadow-sm transition-all flex items-center gap-2"
            title="Alterar Fotos dos Catálogos"
          >
            <ImageIcon className="w-4 h-4 text-amber-500" />
            <span>Fotos Catálogos</span>
          </Link>

          <button
            onClick={handleDeleteAllProducts}
            disabled={isBulkDeleting || products.length === 0}
            className="bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 font-bold text-xs py-3 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            title="Excluir todos os produtos do catálogo"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar Catálogo</span>
          </button>

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

      {/* Banner de Unificação de Modelos Repetidos */}
      {duplicateStats > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs sm:text-sm">
                {duplicateStats} modelo(s) duplicado(s) com numeração detectados (ex: Serena Rosa (2), Purple ())
              </h5>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Identificamos fotos repetidas do mesmo modelo salvas em anúncios separados. Clique no botão ao lado para unificá-las em um anúncio único oficial com carrossel completo de fotos!
              </p>
            </div>
          </div>
          <button
            onClick={handleConsolidateDuplicates}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 flex items-center gap-2 self-start sm:self-auto"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Unificar Modelos & Fotos</span>
          </button>
        </div>
      )}

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
            {categories.map((cat) => (
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
                {categories.map((cat) => {
                  const count = products.filter((p) =>
                    isProductMatchingCategory(p, cat.name)
                  ).length;
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
                  className={`touch-none select-none bg-card border-2 ${
                    selectedProductIds.has(prod.id)
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  } rounded-3xl p-3.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing flex flex-col justify-between gap-3 relative group`}
                >
                  <div className="space-y-2.5">
                    {/* Imagem / Vídeo, Checkbox e Lightbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(getProductMediaSlides(prod), 0, prod.name);
                      }}
                      className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted cursor-pointer group/zoom"
                      title="Clique para ampliar a foto/vídeo do produto"
                    >
                      <ProductMediaView
                        src={prod.images?.[0] || '/images/look-3103.png'}
                        alt={prod.name}
                        autoPlay={false}
                        muted={true}
                        showVideoBadge={getProductMediaSlides(prod).some((m) => isVideoMedia(m))}
                        className="w-full h-full object-cover pointer-events-none transition-transform duration-300 group-hover/zoom:scale-105"
                      />
                      <span className="absolute top-2 left-2 bg-black/75 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                        {prod.category}
                      </span>
                      <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow">
                        {formatCurrency(prod.promotionalPrice || prod.price)}
                      </span>

                      {/* Botão de Zoom */}
                      <div className="absolute top-2 right-2 bg-black/60 hover:bg-black/90 text-white p-1.5 rounded-lg opacity-80 group-hover/zoom:opacity-100 transition-opacity">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Nome do Produto e Checkbox de Seleção */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-serif font-bold text-xs text-foreground line-clamp-1">
                          {prod.name}
                        </h4>
                        <span className="text-[10px] font-mono text-muted-foreground">{prod.sku}</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelectProduct(prod.id);
                        }}
                        className={`p-1.5 rounded-lg border transition-all shrink-0 ${
                          selectedProductIds.has(prod.id)
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-muted text-muted-foreground border-border hover:text-foreground'
                        }`}
                        title={selectedProductIds.has(prod.id) ? 'Desmarcar produto' : 'Selecionar produto'}
                      >
                        {selectedProductIds.has(prod.id) ? (
                          <CheckSquare className="w-3.5 h-3.5" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                      </button>
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
                          {categories.map((cat) => (
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
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        filteredProducts.every((p) => selectedProductIds.has(p.id))
                      }
                      onChange={handleToggleSelectAll}
                      title="Selecionar / Desmarcar todos os produtos listados"
                      className="w-4 h-4 accent-primary rounded cursor-pointer"
                    />
                  </th>
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
                  const isSelected = selectedProductIds.has(prod.id);
                  return (
                    <tr
                      key={prod.id}
                      className={`hover:bg-muted/30 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectProduct(prod.id)}
                          className="w-4 h-4 accent-primary rounded cursor-pointer"
                          title={isSelected ? 'Desmarcar produto' : 'Selecionar produto'}
                        />
                      </td>
                      <td className="p-3.5">
                        <div
                          onClick={() => openLightbox(getProductMediaSlides(prod), 0, prod.name)}
                          className="relative group w-10 h-12 rounded-lg overflow-hidden border border-border cursor-pointer shrink-0"
                          title="Clique para ampliar a mídia"
                        >
                          <ProductMediaView
                            src={prod.images?.[0] || '/images/look-3103.png'}
                            alt={prod.name}
                            autoPlay={false}
                            muted={true}
                            showVideoBadge={getProductMediaSlides(prod).some((m) => isVideoMedia(m))}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-serif font-bold text-sm text-foreground block">
                          {prod.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Avaliações: {prod.rating} ★ ({prod.reviewCount})
                        </span>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap items-center gap-1 max-w-[190px]">
                          {getProductCategories(prod).map((catName) => (
                            <span
                              key={catName}
                              className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold text-[10px] px-2 py-0.5 rounded-lg border border-primary/20"
                            >
                              <span>{catName}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFromSpecificCategory(prod, catName);
                                }}
                                title={`Remover apenas da categoria "${catName}"`}
                                className="hover:text-destructive ml-0.5 font-extrabold"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                          {getProductCategories(prod).length === 0 && (
                            <span className="text-[10px] text-muted-foreground italic">
                              Sem Categoria
                            </span>
                          )}
                        </div>
                      </td>
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
                          title={
                            selectedCategoryFilter !== 'todos'
                              ? `Remover apenas da categoria "${selectedCategoryFilter}"`
                              : 'Excluir produto'
                          }
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
      {/* MODAL DE CADASTRO E EDIÇÃO COM ORGANIZADOR DE CARROSSEL E PRÉVIA */}
      {/* ============================================================== */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-6xl rounded-3xl p-5 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs text-primary font-bold uppercase tracking-wider">
                  Catálogo Aura Fitness
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-foreground">
                  {editingProduct.id ? 'Editar Produto & Carrossel' : 'Cadastrar Novo Produto'}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize as fotos do carrossel da vitrine e visualize em tempo real como o cliente verá o produto.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-6 text-xs">
              <div className="lg:grid lg:grid-cols-12 gap-8 items-start">
                {/* ============================================================== */}
                {/* COLUNA 1: DADOS DO PRODUTO & ORGANIZADOR DE FOTOS (7 COLS)    */}
                {/* ============================================================== */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Nome do Produto com Reconhecimento em Tempo Real */}
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Nome do Produto * (ex: Conjunto Top e Legging Style Black)
                    </label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name || ''}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, name: e.target.value })
                      }
                      placeholder="Digite o nome do produto..."
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
                    />

                    {/* Banner de Reconhecimento Automático de Padrões */}
                    {modalClassification &&
                      editingProduct.name &&
                      editingProduct.name.length >= 3 && (
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

                  {/* Categorias & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-foreground">
                          Categoria *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newCatName = window.prompt('Digite o nome da nova categoria (ex: Bodies, Macaquinhos, Bolsas):');
                            if (newCatName && newCatName.trim()) {
                              const trimmed = newCatName.trim();
                              const updated = saveNewCategory(trimmed);
                              setCategories(updated);
                              setEditingProduct({ ...editingProduct, category: trimmed });
                            }
                          }}
                          className="text-[10px] text-primary hover:underline font-bold"
                        >
                          + Nova Categoria
                        </button>
                      </div>
                      <select
                        value={editingProduct.category || (categories[0]?.name || 'Leggings')}
                        onChange={(e) => {
                          if (e.target.value === '__NEW__') {
                            const newCatName = window.prompt('Digite o nome da nova categoria:');
                            if (newCatName && newCatName.trim()) {
                              const trimmed = newCatName.trim();
                              const updated = saveNewCategory(trimmed);
                              setCategories(updated);
                              setEditingProduct({ ...editingProduct, category: trimmed });
                            }
                          } else {
                            setEditingProduct({ ...editingProduct, category: e.target.value });
                          }
                        }}
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-primary outline-none"
                      >
                        {/* Inclui a categoria atual se porventura não constar ainda na lista salva */}
                        {editingProduct.category &&
                          !categories.some(
                            (c) => c.name.toLowerCase() === editingProduct.category?.toLowerCase()
                          ) && (
                            <option value={editingProduct.category}>
                              {editingProduct.category} (Personalizada)
                            </option>
                          )}
                        {categories.map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                        <option value="__NEW__" className="text-primary font-bold">
                          + Adicionar nova categoria...
                        </option>
                      </select>

                      {/* Segunda Categoria Opcional (Com Confirmação Explícita) */}
                      <div className="mt-2 space-y-1.5">
                        {Array.isArray(editingProduct.additionalCategories) &&
                          editingProduct.additionalCategories.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                Também em:
                              </span>
                              {editingProduct.additionalCategories.map((extraCat) => (
                                <span
                                  key={extraCat}
                                  className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold"
                                >
                                  <span>{extraCat}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingProduct({
                                        ...editingProduct,
                                        additionalCategories: (
                                          editingProduct.additionalCategories || []
                                        ).filter((c) => c !== extraCat),
                                      })
                                    }
                                    className="hover:text-destructive font-extrabold ml-0.5"
                                    title={`Remover da categoria "${extraCat}"`}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}

                        <select
                          value=""
                          onChange={(e) => {
                            const extra = e.target.value;
                            if (!extra) return;
                            const primary =
                              editingProduct.category || categories[0]?.name || 'Leggings';
                            if (extra.toLowerCase() === primary.toLowerCase()) {
                              alert('O produto já está nesta categoria principal.');
                              return;
                            }
                            if (
                              (editingProduct.additionalCategories || []).some(
                                (c) => c.toLowerCase() === extra.toLowerCase()
                              )
                            ) {
                              return;
                            }
                            if (
                              window.confirm(
                                `Deseja realmente colocar este produto em DUAS categorias simultaneamente ("${primary}" e "${extra}")?`
                              )
                            ) {
                              setEditingProduct({
                                ...editingProduct,
                                additionalCategories: [
                                  ...(editingProduct.additionalCategories || []),
                                  extra,
                                ],
                              });
                            }
                          }}
                          className="w-full bg-muted/60 border border-dashed border-border rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground outline-none cursor-pointer"
                        >
                          <option value="">
                            + Exibir também em uma 2ª categoria (opcional)...
                          </option>
                          {categories
                            .filter(
                              (c) =>
                                c.name.toLowerCase() !==
                                (editingProduct.category || '').toLowerCase()
                            )
                            .map((cat) => (
                              <option key={`extra-${cat.name}`} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-foreground mb-1">SKU</label>
                      <input
                        type="text"
                        value={editingProduct.sku || ''}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, sku: e.target.value })
                        }
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Preços */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">
                        Preço De (R$) *
                      </label>
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
                        placeholder="Opcional..."
                        className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                      />
                    </div>
                  </div>

                  {/* ========================================================== */}
                  {/* ORGANIZADOR DE FOTOS DO CARROSSEL (ORDENAÇÃO & CAPA)       */}
                  {/* ========================================================== */}
                  <div className="bg-muted/40 border border-border rounded-2xl p-4 sm:p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                      <div>
                        <h4 className="font-bold text-xs text-foreground flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          <span>Organizador de Fotos do Carrossel</span>
                          <span className="bg-primary/10 text-primary text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                            {(editingProduct.images || []).length}{' '}
                            {(editingProduct.images || []).length === 1 ? 'foto' : 'fotos'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          A foto <strong>#1</strong> é a <strong>Capa Principal</strong> na vitrine.
                          Use <strong>←</strong> e <strong>→</strong> para mudar a ordem ou clique em{' '}
                          <strong>Tornar Capa</strong>.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*,.mp4,.webm,.mov,.m4v,.ogg"
                          onChange={handleUploadPhotoFiles}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingPhoto}
                          className="bg-primary hover:bg-primary-hover text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {isUploadingPhoto ? 'Processando...' : '+ Upload Fotos / Vídeos'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Galeria de Miniaturas Reordenáveis */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {(editingProduct.images || []).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group/photo rounded-2xl overflow-hidden border-2 bg-card transition-all ${
                            idx === 0
                              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                              : 'border-border hover:border-primary/50 shadow-sm'
                          }`}
                        >
                          {/* Miniatura da Imagem ou Vídeo */}
                          <div className="relative aspect-[3/4] bg-muted overflow-hidden">
                            <ProductMediaView
                              src={img}
                              alt={`Mídia ${idx + 1}`}
                              autoPlay={true}
                              muted={true}
                              showVideoBadge={isVideoMedia(img)}
                              className="w-full h-full object-cover object-top"
                            />

                            {/* Badge de Posição / Capa */}
                            <div className="absolute top-1.5 left-1.5 z-10">
                              {idx === 0 ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                                  <Star className="w-2.5 h-2.5 fill-white" />
                                  <span>Capa</span>
                                </span>
                              ) : (
                                <span className="bg-black/75 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow">
                                  #{idx + 1}
                                </span>
                              )}
                            </div>

                            {/* Botão de Excluir Foto */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 hover:scale-110 active:scale-95 transition-all shadow"
                              title="Remover foto do carrossel"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Ações de Reordenação e Capa */}
                          <div className="p-1.5 flex items-center justify-between gap-1 border-t border-border bg-card">
                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 rounded-md hover:bg-muted text-foreground disabled:opacity-20 disabled:hover:bg-transparent"
                              title="Mover foto para trás (←)"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>

                            {idx !== 0 ? (
                              <button
                                type="button"
                                onClick={() => handleSetCoverImage(idx)}
                                className="px-1.5 py-0.5 rounded bg-primary/10 hover:bg-primary text-primary hover:text-white font-bold text-[9px] transition-colors truncate"
                                title="Definir esta foto como a capa da vitrine"
                              >
                                Tornar Capa
                              </button>
                            ) : (
                              <span className="text-[9px] font-bold text-emerald-600">
                                Principal
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleMoveImage(idx, 1)}
                              disabled={idx === (editingProduct.images?.length || 1) - 1}
                              className="p-1 rounded-md hover:bg-muted text-foreground disabled:opacity-20 disabled:hover:bg-transparent"
                              title="Mover foto para frente (→)"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Adicionar Foto por URL */}
                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-border/50">
                      <input
                        type="text"
                        placeholder="Ou digite/cole a URL de uma foto..."
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                        className="flex-1 w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="w-full sm:w-auto bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
                      >
                        + Adicionar Foto por Link
                      </button>
                    </div>
                  </div>

                  {/* Seletor Rápido de Cores Disponíveis */}
                  <div className="p-3.5 bg-muted/30 border border-border rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-semibold text-foreground flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-primary" />
                        <span>Cores Ativas:</span>
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
                        Adicionar cor com 1 clique:
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

                  {/* Descrições */}
                  <div>
                    <label className="block font-semibold text-foreground mb-1">
                      Descrição Curta
                    </label>
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
                </div>

                {/* ============================================================== */}
                {/* COLUNA 2: PRÉ-VISUALIZAÇÃO NA VITRINE DA LOJA (5 COLS)        */}
                {/* ============================================================== */}
                <div className="lg:col-span-5 lg:sticky lg:top-4 space-y-4 pt-4 lg:pt-0">
                  <div className="bg-muted/40 border-2 border-primary/20 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-primary text-white shadow-sm">
                          <Eye className="w-4 h-4" />
                        </span>
                        <h4 className="font-serif font-bold text-sm text-foreground">
                          Pré-visualização na Vitrine (Ao Vivo)
                        </h4>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Veja exatamente como este produto e o carrossel de fotos agrupadas aparecerão
                        para os clientes na loja:
                      </p>
                    </div>

                    {/* Card Real da Vitrine com Carrossel */}
                    <div className="max-w-[270px] mx-auto bg-card rounded-2xl p-2.5 shadow-xl border border-border">
                      <ProductCard product={previewProduct} />
                    </div>

                    {/* Informações da Vitrine */}
                    <div className="bg-background/90 border border-border rounded-2xl p-3.5 text-[11px] text-muted-foreground space-y-2">
                      <div className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Carrossel de Fotos ({previewProduct.images.length})</span>
                      </div>
                      <p className="leading-relaxed">
                        Passe o mouse ou use as setas do card acima para navegar entre as fotos agrupadas.
                        A foto <strong>#1</strong> é a capa que o cliente verá primeiro na loja.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões do Formulário */}
              <div className="pt-4 border-t border-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-secondary text-foreground px-4 py-2.5 rounded-xl font-semibold hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectedProductIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-md border-2 border-primary/40 shadow-2xl rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 max-w-xl w-[92%]"
          >
            <div className="flex items-center gap-3">
              <span className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm">
                {selectedProductIds.size} selecionado{selectedProductIds.size > 1 ? 's' : ''}
              </span>
              <span className="text-xs text-foreground font-semibold hidden sm:inline">
                de {filteredProducts.length} produto(s) listado(s)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors"
              >
                Desmarcar Todos
              </button>
              <button
                type="button"
                onClick={handleBulkDeleteSelected}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-destructive hover:bg-destructive/90 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {isBulkDeleting ? 'Excluindo...' : `Excluir (${selectedProductIds.size})`}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação: Mover vs Manter em 2 Categorias */}
      <AnimatePresence>
        {pendingCategoryMove && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border-2 border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    Confirmação de Categoria
                  </span>
                  <h3 className="font-serif font-bold text-lg text-foreground mt-2">
                    Como deseja categorizar este produto?
                  </h3>
                </div>
                <button
                  onClick={() => setPendingCategoryMove(null)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/50 border border-border">
                <img
                  src={pendingCategoryMove.product.images?.[0] || '/images/look-3103.png'}
                  alt={pendingCategoryMove.product.name}
                  className="w-12 h-14 rounded-xl object-cover border border-border shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">
                    {pendingCategoryMove.product.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Categoria atual:{' '}
                    <strong className="text-foreground">
                      {pendingCategoryMove.sourceCategory}
                    </strong>
                  </p>
                  <p className="text-[11px] text-primary font-semibold">
                    Nova selecionada: <strong>{pendingCategoryMove.targetCategory}</strong>
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Deseja <strong>apenas mover</strong> o produto para{' '}
                <strong className="text-foreground">"{pendingCategoryMove.targetCategory}"</strong>{' '}
                (saindo de "{pendingCategoryMove.sourceCategory}") ou você realmente deseja que ele
                fique nas <strong>duas categorias ao mesmo tempo</strong>?
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleExecuteCategoryMove('move')}
                  className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center justify-between"
                >
                  <span>
                    1. Apenas Mover para "{pendingCategoryMove.targetCategory}" (1 categoria)
                  </span>
                  <Check className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => handleExecuteCategoryMove('both')}
                  className="w-full py-3 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 font-bold text-xs transition-all flex items-center justify-between"
                >
                  <span>
                    2. Sim, colocar nas 2 categorias ("{pendingCategoryMove.sourceCategory}" + "
                    {pendingCategoryMove.targetCategory}")
                  </span>
                  <Layers className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => setPendingCategoryMove(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground font-semibold text-xs transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Importer Modal */}
      <ProductImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={() => {
          setSelectedCategoryFilter('todos');
          setSearchQuery('');
          setCategories(getStoredCategories());
          setProducts([...getProducts()]);
          refreshProducts();
          showToast('✓ Importação de produtos processada com sucesso!');
        }}
      />
    </div>
  );
};
