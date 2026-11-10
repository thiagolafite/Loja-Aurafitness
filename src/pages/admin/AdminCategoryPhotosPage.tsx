import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Image as ImageIcon,
  Upload,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Package,
  Layers,
  FolderTree,
  ExternalLink,
  Info,
  X,
  Trash2,
  ArrowLeft,
  ArrowUpDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getStoredCategories,
  updateCategoryPhoto,
  resetCategoryPhoto,
  moveCategoryToPosition,
  deleteStoredCategory,
  getCategoryPhoto,
  normalizeCategoryName,
  isProductMatchingCategory,
  STORE_CATEGORIES,
  AvailableCategory,
  resizeImageFile,
} from '../../lib/productClassifier';
import { getProducts } from '../../lib/dataClient';
import { Product } from '../../types';

export const AdminCategoryPhotosPage: React.FC = () => {
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [products, setProducts] = useState<Product[]>(() => getProducts());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AvailableCategory | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [activePhotoTab, setActivePhotoTab] = useState<'upload' | 'products' | 'url'>('upload');
  const [customUrl, setCustomUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const syncData = () => {
      setCategories(getStoredCategories());
      setProducts(getProducts());
    };

    window.addEventListener('aura_categories_updated', syncData);
    window.addEventListener('storage', syncData);
    return () => {
      window.removeEventListener('aura_categories_updated', syncData);
      window.removeEventListener('storage', syncData);
    };
  }, []);

  // Open modal for a category
  const handleOpenPhotoModal = (category: AvailableCategory) => {
    setSelectedCategory(category);
    const currentPhoto = getCategoryPhoto(category.name, products);
    setPreviewImage(currentPhoto);
    setCustomUrl(category.image || '');
    setActivePhotoTab('upload');
    setIsModalOpen(true);
  };

  // Upload file handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await resizeImageFile(file, 900, 1200, 0.9);
      setPreviewImage(dataUrl);
      showToast('Imagem carregada! Clique em "Salvar Foto" para confirmar.');
    } catch (err) {
      alert('Erro ao processar imagem.');
    } finally {
      setIsUploading(false);
    }
  };

  // Save selected photo
  const handleSavePhoto = () => {
    if (!selectedCategory || !previewImage) return;

    const updated = updateCategoryPhoto(selectedCategory.name, previewImage);
    setCategories(updated);
    setIsModalOpen(false);
    showToast(`✓ Foto do catálogo "${selectedCategory.name}" atualizada com sucesso!`);
  };

  // Reset to original photo
  const handleResetPhoto = (categoryName: string) => {
    if (window.confirm(`Deseja restaurar a foto padrão original para a categoria "${categoryName}"?`)) {
      const updated = resetCategoryPhoto(categoryName);
      setCategories(updated);
      showToast(`Foto padrão restaurada para "${categoryName}".`);
    }
  };

  // Products belonging to the selected category (for picking from catalog)
  const categoryProducts = selectedCategory
    ? products.filter((p) => isProductMatchingCategory(p, selectedCategory.name))
    : [];

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 right-6 z-50 bg-[#142318] border border-emerald-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-primary/10 text-primary">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="font-serif font-bold text-2xl text-foreground">
              Fotos dos Catálogos na Home da Loja
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Altere as fotos de capa que aparecem na seção <strong>"Navegue por Categoria"</strong> na
            página inicial da sua loja virtual.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            to="/admin/categorias"
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Ver Gestão de Categorias</span>
          </Link>
          <Link
            to="/"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Vitrine na Loja</span>
          </Link>
        </div>
      </div>

      {/* Instructions Card */}
      <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 flex items-start gap-3.5 text-xs text-foreground">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-bold text-primary">
            Como funcionam as fotos dos catálogos na vitrine:
          </p>
          <p className="text-muted-foreground">
            Cada cartão abaixo representa a imagem de capa em destaque da coleção na página inicial.
            Você pode <strong>enviar uma foto do seu computador/celular</strong>,{' '}
            <strong>escolher uma das peças do seu estoque</strong> ou{' '}
            <strong>colar um link de imagem</strong>. Ao salvar, a vitrine da loja atualiza
            imediatamente.
          </p>
        </div>
      </div>

      {/* Categories Cards Grid Matching Home Page Look */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {categories.map((cat) => {
          const count = products.filter((p) => isProductMatchingCategory(p, cat.name)).length;
          const photo = getCategoryPhoto(cat.name, products);
          const defaultDef = STORE_CATEGORIES.find(
            (c) => c.name.toLowerCase() === cat.name.toLowerCase()
          );
          const hasCustomImage = Boolean(cat.image && cat.image.trim() && cat.image !== defaultDef?.image);

          return (
            <div
              key={cat.name}
              className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              {/* Live Preview Card */}
              <div className="group relative h-[320px] rounded-t-3xl overflow-hidden flex flex-col justify-between p-4 bg-black/10">
                {/* Background Photo */}
                <img
                  src={photo}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-700 filter brightness-[0.92]"
                />

                {/* Elegant Dark Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />

                {/* Top Badge: Model Count */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                    {count > 0 ? `${count} ${count === 1 ? 'modelo' : 'modelos'}` : 'Explorar'}
                  </span>

                  {hasCustomImage && (
                    <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow">
                      Personalizada
                    </span>
                  )}
                </div>

                {/* Bottom Info on Card */}
                <div className="relative z-10 space-y-1 text-left">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-300/90 block">
                    COLEÇÕES AURA
                  </span>
                  <h3 className="font-serif font-bold text-lg text-white tracking-wide drop-shadow-md">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 pt-0.5">
                    <span>Ver Coleção</span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Action Buttons Below Card */}
              <div className="p-3.5 bg-card border-t border-border space-y-2">
                <button
                  type="button"
                  onClick={() => handleOpenPhotoModal(cat)}
                  className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Alterar Foto da Capa</span>
                </button>

                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <Link
                    to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 font-semibold"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ver na Loja</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleResetPhoto(cat.name)}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1"
                    title="Restaurar foto padrão original"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restaurar Padrão</span>
                  </button>
                </div>

                <div className="pt-1 border-t border-border/50">
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Deseja realmente excluir a categoria "${cat.name}" da loja?`)) {
                        deleteStoredCategory(cat.name);
                        setCategories(getStoredCategories());
                        showToast(`✓ Categoria "${cat.name}" excluída.`);
                      }
                    }}
                    className="w-full py-1.5 rounded-lg text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-300/60 dark:border-rose-900/40 text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
                    title="Excluir Categoria"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Excluir Categoria</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* MODAL: ALTERAR FOTO DE CAPA DO CATÁLOGO                               */}
      {/* ===================================================================== */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <div className="relative bg-card text-card-foreground border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary" />
                  <span>Alterar Foto do Catálogo: "{selectedCategory.name}"</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Escolha como deseja definir a foto de capa para esta categoria na vitrine da loja.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal 2-Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Column 1: Options & Upload (7 cols) */}
              <div className="md:col-span-7 space-y-4">
                {/* Method Tabs */}
                <div className="flex items-center gap-1 p-1 bg-muted/60 border border-border rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('upload')}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      activePhotoTab === 'upload'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    💻 Do Computador
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('products')}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      activePhotoTab === 'products'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    👗 Dos Produtos ({categoryProducts.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhotoTab('url')}
                    className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                      activePhotoTab === 'url'
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🔗 Por Link/URL
                  </button>
                </div>

                {/* TAB 1: UPLOAD DO COMPUTADOR */}
                {activePhotoTab === 'upload' && (
                  <div className="space-y-3 p-4 bg-muted/30 border border-border rounded-2xl text-xs">
                    <span className="font-semibold text-foreground block">
                      Selecione um arquivo de imagem do seu computador ou smartphone:
                    </span>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full py-4 rounded-2xl border-2 border-dashed border-primary/40 hover:border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-6 h-6" />
                      <span>{isUploading ? 'Processando imagem...' : 'Clique para selecionar arquivo de foto'}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Formatos suportados: JPG, PNG, WEBP (Otimização automática)
                      </span>
                    </button>
                  </div>
                )}

                {/* TAB 2: ESCOLHER DE PRODUTOS DA CATEGORIA */}
                {activePhotoTab === 'products' && (
                  <div className="space-y-3 p-4 bg-muted/30 border border-border rounded-2xl text-xs">
                    <span className="font-semibold text-foreground block">
                      Clique em qualquer foto de produto abaixo para usar como capa da categoria:
                    </span>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
                      {categoryProducts.flatMap((p) =>
                        (p.images || []).map((imgUrl, i) => {
                          const isSelected = previewImage === imgUrl;
                          return (
                            <button
                              key={`${p.id}-${i}`}
                              type="button"
                              onClick={() => {
                                setPreviewImage(imgUrl);
                                showToast(`Foto do produto "${p.name}" selecionada!`);
                              }}
                              className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? 'border-emerald-500 ring-2 ring-emerald-500/30 scale-102 shadow-md'
                                  : 'border-border hover:border-primary/50 opacity-85 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="w-full h-full object-cover object-top"
                              />
                              {isSelected && (
                                <span className="absolute top-1 right-1 bg-emerald-600 text-white p-0.5 rounded-full shadow">
                                  <Check className="w-3 h-3" />
                                </span>
                              )}
                            </button>
                          );
                        })
                      )}

                      {categoryProducts.length === 0 && (
                        <div className="col-span-full py-6 text-center text-muted-foreground">
                          Nenhum produto cadastrado nesta categoria ainda. Use a opção de upload ou link.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: POR LINK / URL */}
                {activePhotoTab === 'url' && (
                  <div className="space-y-3 p-4 bg-muted/30 border border-border rounded-2xl text-xs">
                    <span className="font-semibold text-foreground block">
                      Cole o link direto da imagem na internet:
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://exemplo.com/foto-modelo.jpg"
                        value={customUrl}
                        onChange={(e) => setCustomUrl(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customUrl.trim()) {
                            setPreviewImage(customUrl.trim());
                            showToast('Link aplicado à pré-visualização!');
                          }
                        }}
                        className="bg-primary text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-primary-hover transition-colors"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Column 2: Live Card Preview (5 cols) */}
              <div className="md:col-span-5 space-y-3">
                <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" />
                  <span>Pré-visualização na Loja:</span>
                </span>

                {/* Home Page Card Preview */}
                <div className="relative h-[320px] rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between p-4 border border-border">
                  <img
                    src={previewImage || '/images/look-3103.png'}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.92]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15" />

                  <div className="relative z-10 flex items-center justify-between">
                    <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                      {categoryProducts.length > 0
                        ? `${categoryProducts.length} ${
                            categoryProducts.length === 1 ? 'modelo' : 'modelos'
                          }`
                        : 'Explorar'}
                    </span>
                  </div>

                  <div className="relative z-10 space-y-1 text-left">
                    <span className="text-[9px] uppercase tracking-widest font-bold text-emerald-300/90 block">
                      COLEÇÕES AURA
                    </span>
                    <h3 className="font-serif font-bold text-lg text-white tracking-wide drop-shadow-md">
                      {selectedCategory.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90 pt-0.5">
                      <span>Ver Coleção</span>
                      <ArrowRight className="w-3 h-3 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-muted font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhoto}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Foto do Catálogo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
