import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowRight,
  Check,
  X,
  Move,
  Sparkles,
  Store,
  Layers,
  Package,
  Eye,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Tag,
  Boxes,
  TrendingUp,
  DollarSign,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getProducts,
  fetchProductsAsync,
  saveProduct,
  deleteProduct,
  aiGenerateProductDescription,
  aiGenerateSeoMeta,
} from '../../lib/dataClient';
import { Product, ProductColor } from '../../types';
import { formatCurrency } from '../../lib/utils';
import {
  STORE_CATEGORIES,
  STORE_COLORS,
  AvailableCategory,
  normalizeCategoryName,
  getStoredCategories,
  saveStoredCategories,
} from '../../lib/productClassifier';
import { ProductImporterModal } from '../../components/admin/ProductImporterModal';

export const AdminCategoriesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('todos');
  const [hideEmptyCategories, setHideEmptyCategories] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<AvailableCategory> | null>(null);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [isImporterOpen, setIsImporterOpen] = useState(false);

  // Sync products on load
  const refreshProducts = () => {
    fetchProductsAsync().then((prods) => {
      setProducts([...prods]);
    });
  };

  useEffect(() => {
    refreshProducts();
    setCategories(getStoredCategories());
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Group products by category
  const categoryData = useMemo(() => {
    return categories.map((cat) => {
      const items = products.filter(
        (p) => normalizeCategoryName(p.category) === cat.name
      );

      // Filter by search query if any
      const matchingItems = items.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q)
        );
      });

      const totalStock = items.reduce((sum, p) => {
        const itemStock = Object.values(p.stock || {}).reduce((s, count) => s + (count || 0), 0);
        return sum + itemStock;
      }, 0);

      const avgPrice =
        items.length > 0
          ? items.reduce((sum, p) => sum + (p.promotionalPrice || p.price), 0) / items.length
          : 0;

      return {
        category: cat,
        items,
        matchingItems,
        totalStock,
        avgPrice,
      };
    });
  }, [categories, products, searchQuery]);

  // Statistics
  const totalCategories = categories.length;
  const categoriesWithProducts = categoryData.filter((c) => c.items.length > 0).length;
  const totalProducts = products.length;

  // Change category of product in 1 click
  const handleChangeProductCategory = (product: Product, newCategoryName: string) => {
    if (normalizeCategoryName(product.category) === newCategoryName) return;

    const updated = {
      ...product,
      category: newCategoryName,
    };

    saveProduct(updated);
    setProducts(getProducts());
    showToast(`✓ Produto "${product.name}" movido para a categoria "${newCategoryName}"!`);
  };

  // Delete product
  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${product.name}"?`)) {
      deleteProduct(product.id);
      setProducts(getProducts());
      showToast(`✓ Produto "${product.name}" removido com sucesso.`);
    }
  };

  // Open New Category Modal
  const handleOpenNewCategoryModal = () => {
    setEditingCategory({
      name: '',
      slug: '',
      icon: '✨',
      description: '',
      keywords: [],
    });
    setIsCategoryModalOpen(true);
  };

  // Open Edit Category Modal
  const handleOpenEditCategoryModal = (cat: AvailableCategory) => {
    setEditingCategory({ ...cat });
    setIsCategoryModalOpen(true);
  };

  // Save Category Submit
  const handleSaveCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;

    const trimmedName = editingCategory.name.trim();
    const slug =
      editingCategory.slug ||
      trimmedName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

    const existingIndex = categories.findIndex(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() || c.slug === slug
    );

    let updatedList: AvailableCategory[];

    if (existingIndex !== -1) {
      updatedList = [...categories];
      updatedList[existingIndex] = {
        ...updatedList[existingIndex],
        ...editingCategory,
        name: trimmedName,
        slug,
        icon: editingCategory.icon || '🏷️',
        description: editingCategory.description || '',
        keywords: editingCategory.keywords || [trimmedName.toLowerCase()],
      };
      showToast(`✓ Categoria "${trimmedName}" atualizada com sucesso!`);
    } else {
      const newCat: AvailableCategory = {
        name: trimmedName,
        slug,
        icon: editingCategory.icon || '🏷️',
        description: editingCategory.description || '',
        keywords: editingCategory.keywords || [trimmedName.toLowerCase()],
      };
      updatedList = [...categories, newCat];
      showToast(`✓ Nova categoria "${trimmedName}" criada com sucesso!`);
    }

    setCategories(updatedList);
    saveStoredCategories(updatedList);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // Delete Category
  const handleDeleteCategory = (catName: string) => {
    const hasProducts = products.some((p) => normalizeCategoryName(p.category) === catName);
    if (hasProducts) {
      alert(
        `Não é possível excluir a categoria "${catName}" pois ainda existem produtos associados a ela. Mova os produtos para outra categoria primeiro.`
      );
      return;
    }

    if (window.confirm(`Deseja realmente remover a categoria "${catName}"?`)) {
      const updatedList = categories.filter((c) => c.name !== catName);
      setCategories(updatedList);
      saveStoredCategories(updatedList);
      showToast(`✓ Categoria "${catName}" excluída.`);
    }
  };

  // Open New Product in Category Modal
  const handleOpenNewProductInCategory = (catName: string) => {
    setEditingProduct({
      name: '',
      category: catName,
      price: 189.9,
      promotionalPrice: 159.9,
      sku: `AUR-${catName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
      barcode: '7891234560000',
      weight: 250,
      brand: 'Aura Fitness',
      description: `Peça oficial Aura Fitness da categoria ${catName}. Modelagem anatômica, toque aveludado e zero transparência.`,
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
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  // Save Product Submit
  const handleSaveProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.name) return;

    saveProduct(editingProduct);
    setProducts(getProducts());
    setIsProductModalOpen(false);
    setEditingProduct(null);
    showToast(`✓ Produto "${editingProduct.name}" salvo com sucesso!`);
  };

  // AI Description Generation
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
        'Cós anatômico, alta compressão, toque aveludado e zero transparência.'
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

  const emojiChoices = ['👗', '🩱', '👖', '👚', '🩳', '👕', '🧥', '🎒', '👙', '👟', '✨', '🏷️'];

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed top-6 right-6 z-50 bg-[#1c3022] text-white px-5 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-semibold backdrop-blur-md"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-[11px] font-bold tracking-widest uppercase text-primary block">
            ESTRUTURA DE CATÁLOGO
          </span>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground flex items-center gap-2.5 mt-1">
            <FolderTree className="w-7 h-7 text-primary" />
            <span>Categorias & Organização de Produtos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visualize as categorias cadastradas na loja e gerencie os produtos organizados dentro de cada uma.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/catalogo"
            target="_blank"
            className="px-4 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Store className="w-4 h-4 text-primary" />
            <span>Ver na Loja</span>
          </Link>

          <button
            onClick={() => setIsImporterOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Boxes className="w-4 h-4" />
            <span>Importar Produtos</span>
          </button>

          <button
            onClick={handleOpenNewCategoryModal}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>
        </div>
      </div>

      {/* Quick Statistics KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Total de Categorias</span>
            <FolderTree className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">{totalCategories}</div>
          <span className="text-[11px] text-muted-foreground">Estrutura oficial da loja</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Categorias Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">{categoriesWithProducts}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            Com produtos disponíveis
          </span>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Produtos Cadastrados</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">{totalProducts}</div>
          <span className="text-[11px] text-muted-foreground">Distribuídos no catálogo</span>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Categorias Vazias</span>
            <AlertCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-serif font-bold text-foreground">
            {totalCategories - categoriesWithProducts}
          </div>
          <span className="text-[11px] text-muted-foreground">Aguardando novos produtos</span>
        </div>
      </div>

      {/* Control Bar: Filter Tabs & Search */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar categoria ou produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* Toggle empty categories */}
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hideEmptyCategories}
                onChange={(e) => setHideEmptyCategories(e.target.checked)}
                className="w-4 h-4 accent-primary rounded cursor-pointer"
              />
              <span>Ocultar categorias sem produtos</span>
            </label>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategoryTab('todos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              selectedCategoryTab === 'todos'
                ? 'bg-primary text-white shadow-sm'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>Todas as Categorias</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/15">
              {totalCategories}
            </span>
          </button>

          {categories.map((cat) => {
            const count = products.filter(
              (p) => normalizeCategoryName(p.category) === cat.name
            ).length;
            const isSelected = selectedCategoryTab === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategoryTab(cat.name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-black/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold'
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

      {/* ============================================================== */}
      {/* CATEGORIES & ORGANIZED PRODUCTS CONTAINER                      */}
      {/* ============================================================== */}
      <div className="space-y-8">
        {categoryData
          .filter(({ category, items }) => {
            if (selectedCategoryTab !== 'todos' && category.name !== selectedCategoryTab) {
              return false;
            }
            if (hideEmptyCategories && items.length === 0) {
              return false;
            }
            return true;
          })
          .map(({ category, items, matchingItems, totalStock, avgPrice }) => (
            <div
              key={category.name}
              className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-all"
            >
              {/* Category Header Card */}
              <div className="bg-secondary/40 border-b border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <span className="text-3xl p-2.5 rounded-2xl bg-card border border-border shadow-sm shrink-0">
                    {category.icon}
                  </span>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="font-serif font-bold text-xl text-foreground">
                        {category.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                        {items.length} {items.length === 1 ? 'produto' : 'produtos'}
                      </span>
                      {totalStock > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {totalStock} un. em estoque
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                      {category.description || 'Categoria oficial de produtos Aura Fitness.'}
                    </p>
                  </div>
                </div>

                {/* Category Actions */}
                <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                  <Link
                    to={`/catalogo?categoria=${encodeURIComponent(category.name)}`}
                    target="_blank"
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border hover:bg-muted transition-colors text-xs flex items-center gap-1"
                    title="Ver esta categoria na loja virtual"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Ver na Loja</span>
                  </Link>

                  <button
                    onClick={() => handleOpenEditCategoryModal(category)}
                    className="p-2 text-muted-foreground hover:text-foreground rounded-xl border border-border hover:bg-muted transition-colors text-xs flex items-center gap-1"
                    title="Editar informações da categoria"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Editar</span>
                  </button>

                  <button
                    onClick={() => handleOpenNewProductInCategory(category.name)}
                    className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Adicionar Produto</span>
                  </button>
                </div>
              </div>

              {/* Products inside this category */}
              <div className="p-4 sm:p-5">
                {matchingItems.length === 0 ? (
                  <div className="py-10 text-center bg-muted/20 border border-dashed border-border rounded-xl p-6 space-y-3">
                    <Package className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                    <h3 className="font-serif font-bold text-sm text-foreground">
                      Nenhum produto associado à categoria "{category.name}"
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Você pode cadastrar um novo produto diretamente nesta categoria ou mover produtos existentes de outras categorias para cá.
                    </p>
                    <button
                      onClick={() => handleOpenNewProductInCategory(category.name)}
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Primeiro Produto</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          <th className="pb-3 pl-2">Produto & SKU</th>
                          <th className="pb-3">Preço</th>
                          <th className="pb-3">Cores</th>
                          <th className="pb-3">Estoque & Tamanhos</th>
                          <th className="pb-3">Mover de Categoria</th>
                          <th className="pb-3 text-right pr-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {matchingItems.map((prod) => {
                          const stockCount = Object.values(prod.stock || {}).reduce(
                            (acc, c) => acc + (c || 0),
                            0
                          );

                          return (
                            <tr key={prod.id} className="hover:bg-muted/30 transition-colors group">
                              {/* Product Info & Thumb */}
                              <td className="py-3.5 pl-2">
                                <div className="flex items-center gap-3">
                                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                                    <img
                                      src={prod.images?.[0] || '/images/look-3103.png'}
                                      alt={prod.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {prod.images && prod.images.length > 1 && (
                                      <span className="absolute bottom-0 right-0 bg-black/80 text-white text-[8px] font-bold px-1 rounded-tl">
                                        +{prod.images.length - 1}
                                      </span>
                                    )}
                                  </div>

                                  <div>
                                    <div className="font-bold text-foreground text-xs group-hover:text-primary transition-colors">
                                      {prod.name}
                                    </div>
                                    <div className="text-[10px] font-mono text-muted-foreground">
                                      SKU: {prod.sku}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Price */}
                              <td className="py-3.5">
                                <div className="font-bold text-foreground">
                                  {formatCurrency(prod.promotionalPrice || prod.price)}
                                </div>
                                {prod.promotionalPrice && (
                                  <div className="text-[10px] text-muted-foreground line-through">
                                    {formatCurrency(prod.price)}
                                  </div>
                                )}
                              </td>

                              {/* Colors */}
                              <td className="py-3.5">
                                <div className="flex items-center gap-1 flex-wrap max-w-[140px]">
                                  {prod.colors?.map((c, cIdx) => (
                                    <span
                                      key={cIdx}
                                      className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                                      style={{ backgroundColor: c.hex }}
                                      title={c.name}
                                    />
                                  ))}
                                  <span className="text-[10px] text-muted-foreground ml-1">
                                    {prod.colors?.[0]?.name || 'Preto'}
                                  </span>
                                </div>
                              </td>

                              {/* Stock & Sizes */}
                              <td className="py-3.5">
                                <div className="space-y-0.5">
                                  <span
                                    className={`text-[11px] font-bold ${
                                      stockCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                                    }`}
                                  >
                                    {stockCount} peças totais
                                  </span>
                                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                                    {prod.sizes?.slice(0, 4).map((s) => (
                                      <span key={s} className="bg-muted px-1 rounded">
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </td>

                              {/* Quick Move Category Dropdown */}
                              <td className="py-3.5">
                                <div className="flex items-center gap-1.5">
                                  <Move className="w-3.5 h-3.5 text-muted-foreground" />
                                  <select
                                    value={category.name}
                                    onChange={(e) =>
                                      handleChangeProductCategory(prod, e.target.value)
                                    }
                                    className="bg-background border border-border rounded-lg px-2.5 py-1 text-[11px] font-semibold text-foreground focus:ring-1 focus:ring-primary cursor-pointer hover:border-primary transition-colors"
                                  >
                                    {categories.map((c) => (
                                      <option key={c.name} value={c.name}>
                                        Mover para: {c.icon} {c.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3.5 text-right pr-2">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleOpenEditProduct(prod)}
                                    className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                                    title="Editar produto completo"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() => handleDeleteProduct(prod)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-muted transition-colors"
                                    title="Excluir produto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* ============================================================== */}
      {/* MODAL: NOVA / EDITAR CATEGORIA                                 */}
      {/* ============================================================== */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsCategoryModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl p-6 z-10 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <FolderTree className="w-5 h-5 text-primary" />
                <span>
                  {editingCategory.name ? 'Editar Categoria' : 'Nova Categoria de Produtos'}
                </span>
              </h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Macacões, Leggings, Biquínis..."
                  value={editingCategory.name || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, name: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Ícone Representativo (Emoji)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl p-2 rounded-xl bg-muted border border-border">
                    {editingCategory.icon || '🏷️'}
                  </span>
                  <input
                    type="text"
                    value={editingCategory.icon || ''}
                    onChange={(e) =>
                      setEditingCategory({ ...editingCategory, icon: e.target.value })
                    }
                    placeholder="Cole um emoji..."
                    className="w-32 bg-background border border-border rounded-xl p-2 text-foreground outline-none text-center"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {emojiChoices.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditingCategory({ ...editingCategory, icon: emoji })}
                      className="p-1.5 rounded-lg border border-border hover:bg-muted text-base"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Descrição da modelagem e peças desta categoria..."
                  value={editingCategory.description || ''}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, description: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-sm"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CRIAR / EDITAR PRODUTO NA CATEGORIA                    */}
      {/* ============================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsProductModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl p-6 z-10 max-h-[90vh] overflow-y-auto space-y-5"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                <span>
                  {editingProduct.id ? 'Editar Produto' : `Novo Produto em "${editingProduct.category}"`}
                </span>
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Categoria Associada *
                  </label>
                  <select
                    value={editingProduct.category || 'Leggings'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground focus:ring-2 focus:ring-primary outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & SKU */}
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
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground outline-none font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Preço Por (Promocional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingProduct.promotionalPrice || ''}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        promotionalPrice: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">SKU</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sku: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground font-mono outline-none"
                  />
                </div>
              </div>

              {/* Description & AI Button */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-foreground">Descrição do Produto</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiDescription}
                    disabled={isAiLoading}
                    className="text-[10px] text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>{isAiLoading ? 'Gerando com IA...' : 'Gerar com IA Aura'}</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full bg-background border border-border rounded-xl p-2.5 text-foreground outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 shadow-sm"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Product Importer Modal */}
      <ProductImporterModal
        isOpen={isImporterOpen}
        onClose={() => setIsImporterOpen(false)}
        onSuccess={() => {
          refreshProducts();
          showToast('✓ Importação concluída com sucesso!');
        }}
      />
    </div>
  );
};
