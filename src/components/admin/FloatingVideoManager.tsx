import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Upload,
  Plus,
  Trash2,
  Edit,
  Check,
  X,
  ExternalLink,
  ShoppingBag,
  Sparkles,
  Play,
  Eye,
  Palette,
  Search,
  CheckCircle2,
  Link as LinkIcon,
} from 'lucide-react';
import {
  getFloatingVideoConfig,
  saveFloatingVideoConfig,
  saveFloatingVideoItem,
  deleteFloatingVideoItem,
  saveVideoFileToStorage,
  resolvePlayableVideoUrl,
} from '../../lib/videoStorage';
import { getProducts } from '../../lib/dataClient';
import { FloatingVideoConfig, FloatingVideoItem, Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

const BORDER_PRESETS = [
  { name: 'Coral Lê Rose (Padrão)', hex: '#F27474' },
  { name: 'Verde Aura', hex: '#284e20' },
  { name: 'Pink / Fúcsia', hex: '#E0218A' },
  { name: 'Dourado Solar', hex: '#E5A93C' },
  { name: 'Vinho / Marsala', hex: '#5B1425' },
  { name: 'Preto Clássico', hex: '#111111' },
];

export const FloatingVideoManager: React.FC = () => {
  const [config, setConfig] = useState<FloatingVideoConfig>(() => getFloatingVideoConfig());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [editingItem, setEditingItem] = useState<Partial<FloatingVideoItem> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [draftPreviewUrl, setDraftPreviewUrl] = useState<string>('');
  const [toast, setToast] = useState<string | null>(null);

  const videoInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const sync = () => setConfig(getFloatingVideoConfig());
    const syncProds = () => setProducts(getProducts());
    window.addEventListener('aura_floating_video_updated', sync);
    window.addEventListener('aura_products_updated', syncProds);
    return () => {
      window.removeEventListener('aura_floating_video_updated', sync);
      window.removeEventListener('aura_products_updated', syncProds);
    };
  }, []);

  // Resolve playable URLs for all items
  useEffect(() => {
    let mounted = true;
    const loadUrls = async () => {
      const map: Record<string, string> = {};
      for (const item of config.items) {
        if (item.videoUrl) {
          const url = await resolvePlayableVideoUrl(item.videoUrl);
          if (url) map[item.id] = url;
        }
      }
      if (mounted) setPreviewUrls(map);
    };
    loadUrls();
    return () => {
      mounted = false;
    };
  }, [config.items]);

  // Resolve draft preview URL when editingItem changes
  useEffect(() => {
    let mounted = true;
    if (!editingItem?.videoUrl) {
      setDraftPreviewUrl('');
      return;
    }
    resolvePlayableVideoUrl(editingItem.videoUrl).then((url) => {
      if (mounted) setDraftPreviewUrl(url);
    });
    return () => {
      mounted = false;
    };
  }, [editingItem?.videoUrl]);

  const handleUpdateGlobalConfig = (patch: Partial<FloatingVideoConfig>) => {
    const updated: FloatingVideoConfig = {
      ...config,
      ...patch,
    };
    setConfig(updated);
    saveFloatingVideoConfig(updated);
    showToast('Configurações do mini-vídeo salvas!');
  };

  const handleOpenCreateModal = () => {
    const firstProd = products[0];
    setEditingItem({
      title: firstProd ? firstProd.name : 'Look em Vídeo Aura',
      videoUrl: '',
      productId: firstProd?.id || '',
      customLink: firstProd ? `/produto/${firstProd.id}` : '/catalogo',
      buttonText: 'Ver Produto',
      badgeText: 'NOVIDADE',
      fallbackImages: firstProd?.images || ['/images/macaco-bless.png'],
      active: true,
      order: config.items.length + 1,
    });
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FloatingVideoItem) => {
    setEditingItem({ ...item });
    setProductSearch('');
    setIsModalOpen(true);
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingItem) return;

    setIsUploadingVideo(true);
    try {
      const storedRef = await saveVideoFileToStorage(file);
      const cleanFileTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ');
      setEditingItem((prev) => ({
        ...prev,
        videoUrl: storedRef,
        title: prev?.title && prev.title !== 'Look em Vídeo Aura' ? prev.title : cleanFileTitle,
      }));
      showToast(`Vídeo "${file.name}" carregado com sucesso!`);
    } catch (err) {
      console.error('Erro no upload de vídeo:', err);
      showToast('Erro ao carregar arquivo de vídeo.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleSelectLinkedProduct = (prod: Product) => {
    setEditingItem((prev) => ({
      ...prev,
      productId: prod.id,
      title: prod.name,
      customLink: `/produto/${prod.id}`,
      fallbackImages: prod.images && prod.images.length > 0 ? prod.images : ['/images/macaco-bless.png'],
    }));
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = saveFloatingVideoItem(editingItem);
    setConfig(updated);
    setIsModalOpen(false);
    setEditingItem(null);
    showToast('Mini-vídeo salvo e publicado no canto inferior da loja!');
  };

  const handleDeleteItem = async (id: string) => {
    const updated = await deleteFloatingVideoItem(id);
    setConfig(updated);
    showToast('Vídeo removido.');
  };

  const handleToggleItemActive = (item: FloatingVideoItem) => {
    const updated = saveFloatingVideoItem({
      ...item,
      active: !item.active,
    });
    setConfig(updated);
  };

  const filteredProducts = products.filter(
    (p) =>
      !productSearch.trim() ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header & Global Settings Card */}
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-xl text-foreground">
                  Mini-Vídeo Flutuante (Estilo Lê Rose)
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    config.enabled
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {config.enabled ? '● Ativo na Loja' : '○ Desativado'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Exibe um mini-vídeo vertical com moldura dupla no canto inferior esquerdo da loja, levando o cliente direto para a peça ao clicar.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleUpdateGlobalConfig({ enabled: !config.enabled })}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                config.enabled
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-secondary text-foreground border-border'
              }`}
            >
              {config.enabled ? '✓ Mini-Vídeo Ativado' : 'Ativar Mini-Vídeo'}
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Novo Vídeo</span>
            </button>
          </div>
        </div>

        {/* Visual & Interaction Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Border Color */}
          <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Cor da Moldura Dupla</span>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {BORDER_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => handleUpdateGlobalConfig({ borderColor: preset.hex })}
                  className={`w-7 h-7 rounded-full border transition-transform ${
                    config.borderColor.toLowerCase() === preset.hex.toLowerCase()
                      ? 'ring-2 ring-primary ring-offset-2 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                  title={preset.name}
                />
              ))}
              <input
                type="color"
                value={config.borderColor || '#F27474'}
                onChange={(e) => handleUpdateGlobalConfig({ borderColor: e.target.value })}
                className="w-8 h-8 rounded-lg cursor-pointer border border-border bg-transparent"
                title="Escolher cor personalizada"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Borda dupla selecionada: <span className="font-mono font-bold">{config.borderColor}</span>
            </p>
          </div>

          {/* 2. Click Action */}
          <div className="bg-background border border-border rounded-2xl p-4 space-y-2.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              <span>Ação ao Clicar no Mini-Vídeo</span>
            </label>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => handleUpdateGlobalConfig({ clickAction: 'direct-link' })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-all flex items-center justify-between ${
                  config.clickAction === 'direct-link'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>Ir direto para o Produto (Estilo Lê Rose)</span>
                {config.clickAction === 'direct-link' && <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => handleUpdateGlobalConfig({ clickAction: 'expand-player' })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-all flex items-center justify-between ${
                  config.clickAction === 'expand-player'
                    ? 'bg-primary/10 border-primary text-primary font-bold'
                    : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>Expandir Player com Som e Botão</span>
                {config.clickAction === 'expand-player' && <Check className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 3. Position & Size */}
          <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1.5">
                Posição e Tamanho na Loja
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleUpdateGlobalConfig({ position: 'bottom-left' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    config.position === 'bottom-left'
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  ↙ Inferior Esquerdo
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateGlobalConfig({ position: 'bottom-right' })}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    config.position === 'bottom-right'
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  ↘ Inferior Direito
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {(['sm', 'md', 'lg'] as const).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleUpdateGlobalConfig({ size: sz })}
                  className={`py-1.5 rounded-lg text-[11px] font-bold border ${
                    config.size === sz
                      ? 'bg-primary/15 border-primary text-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {sz === 'sm' ? 'Compacto' : sz === 'md' ? 'Médio (Lê Rose)' : 'Grande'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Registered Videos Grid + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Videos List */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-base text-foreground">
              Vídeos Cadastrados ({config.items.length})
            </h3>
            <span className="text-xs text-muted-foreground">
              Você pode enviar arquivos <strong>.mp4 / .mov</strong> direto do computador
            </span>
          </div>

          {config.items.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-3xl p-10 text-center space-y-3">
              <Video className="w-10 h-10 text-muted-foreground mx-auto" />
              <h4 className="font-serif font-bold text-base text-foreground">
                Nenhum vídeo cadastrado
              </h4>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Adicione um vídeo curto mostrando o caimento das peças para aparecer no canto inferior esquerdo do site.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Incluir Primeiro Vídeo</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {config.items.map((item) => {
                const linkedProd = item.productId
                  ? products.find((p) => p.id === item.productId)
                  : undefined;
                const resolvedUrl = previewUrls[item.id] || '';

                return (
                  <div
                    key={item.id}
                    className={`bg-card border rounded-2xl p-4 flex gap-4 items-center transition-all ${
                      item.active ? 'border-border shadow-sm' : 'border-border/50 opacity-60'
                    }`}
                  >
                    {/* Mini Frame Preview */}
                    <div
                      style={{ borderColor: config.borderColor || '#F27474' }}
                      className="w-[76px] h-[126px] rounded-2xl border-2 bg-white p-[2px] shrink-0 shadow-md"
                    >
                      <div
                        style={{ borderColor: config.borderColor || '#F27474' }}
                        className="w-full h-full rounded-xl border overflow-hidden bg-neutral-900 relative"
                      >
                        {resolvedUrl ? (
                          <video
                            src={resolvedUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <img
                            src={
                              linkedProd?.images?.[0] ||
                              item.fallbackImages?.[0] ||
                              '/images/macaco-bless.png'
                            }
                            alt={item.title}
                            className="w-full h-full object-cover object-top"
                          />
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                            item.active
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {item.active ? 'No Ar' : 'Pausado'}
                        </span>
                        {item.videoUrl?.startsWith('idb://') && (
                          <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Arquivo Local
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-foreground truncate">{item.title}</h4>

                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <LinkIcon className="w-3 h-3 text-primary shrink-0" />
                        <span>
                          {linkedProd
                            ? `Produto: ${linkedProd.name}`
                            : `Link: ${item.customLink || '/catalogo'}`}
                        </span>
                      </p>

                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Editar / Trocar Vídeo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleItemActive(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-secondary hover:bg-muted text-foreground text-xs font-semibold transition-colors"
                        >
                          {item.active ? 'Pausar' : 'Ativar'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors ml-auto"
                          title="Excluir vídeo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Storefront Corner Preview */}
        <div className="lg:col-span-4 bg-card border border-border rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-primary block">
              PRÉ-VISUALIZAÇÃO REAL
            </span>
            <h4 className="font-serif font-bold text-base text-foreground">
              Como aparece no canto do site
            </h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Simulação fiel da moldura dupla no canto inferior esquerdo da vitrine.
            </p>
          </div>

          <div className="relative h-[280px] rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-neutral-900 dark:to-neutral-950 border border-border overflow-hidden flex items-end p-5">
            <div className="absolute top-3 right-3 text-[10px] font-semibold text-muted-foreground bg-background/80 backdrop-blur px-2.5 py-1 rounded-full border border-border">
              Vitrine da Loja
            </div>

            {config.items[0] && (
              <div
                style={{ borderColor: config.borderColor || '#F27474' }}
                className="rounded-[20px] border-[2.5px] bg-white p-[2.5px] shadow-2xl"
              >
                <div
                  style={{ borderColor: config.borderColor || '#F27474' }}
                  className="w-[122px] h-[204px] rounded-[15px] border-[1.5px] overflow-hidden relative bg-neutral-900"
                >
                  {previewUrls[config.items[0].id] ? (
                    <video
                      src={previewUrls[config.items[0].id]}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <img
                      src={
                        config.items[0].fallbackImages?.[0] ||
                        products[0]?.images?.[0] ||
                        '/images/macaco-bless.png'
                      }
                      alt="Preview"
                      className="w-full h-full object-cover object-top"
                    />
                  )}
                </div>
              </div>
            )}

            <div className="ml-4 mb-2 space-y-1">
              <span className="text-[10px] font-bold uppercase text-primary block">
                ↗ Clique Direto
              </span>
              <p className="text-xs font-semibold text-foreground">
                {config.clickAction === 'direct-link'
                  ? 'Leva o cliente direto para a página da roupa clicada'
                  : 'Expande o vídeo em tela maior com áudio e card do produto'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal to Add / Edit Video */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <Video className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-foreground">
                  {editingItem.id ? 'Editar Mini-Vídeo Flutuante' : 'Incluir Novo Mini-Vídeo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-5 text-xs">
              {/* Step 1: Upload Video File or Paste URL */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 space-y-3">
                <label className="font-bold text-foreground text-sm flex items-center gap-2">
                  <span>1. Escolha o Vídeo (.mp4, .mov, .webm)</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/*"
                    onChange={handleVideoFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                    className="px-4 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all shrink-0"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploadingVideo
                        ? 'Carregando Vídeo...'
                        : 'Enviar Vídeo do Computador (.mp4 / .mov)'}
                    </span>
                  </button>

                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Ou cole o link/URL direto de um vídeo .mp4..."
                      value={
                        editingItem.videoUrl?.startsWith('idb://')
                          ? '✓ Arquivo de vídeo carregado do computador'
                          : editingItem.videoUrl || ''
                      }
                      onChange={(e) =>
                        setEditingItem({ ...editingItem, videoUrl: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Live Video Preview inside Modal */}
                {draftPreviewUrl && (
                  <div className="flex items-center gap-4 pt-2">
                    <div
                      style={{ borderColor: config.borderColor || '#F27474' }}
                      className="w-[84px] h-[140px] rounded-2xl border-2 bg-white p-[2px] shrink-0 shadow"
                    >
                      <video
                        src={draftPreviewUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover object-top rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block">
                        ✓ Vídeo pronto para reprodução automática!
                      </span>
                      <p className="text-[11px] text-muted-foreground">
                        O vídeo tocará automaticamente em loop silencioso no canto inferior esquerdo do site.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Link to a Store Product (Just like Lê Rose) */}
              <div className="space-y-2.5">
                <label className="font-bold text-foreground text-sm block">
                  2. Vincular a qual Produto da Loja? (Ao clicar no vídeo, abre este produto)
                </label>

                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar produto pelo nome ou categoria..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1 border border-border rounded-2xl bg-background">
                  {filteredProducts.map((prod) => {
                    const isSelected = editingItem.productId === prod.id;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectLinkedProduct(prod)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-primary/10 border-primary ring-1 ring-primary'
                            : 'border-border/60 hover:bg-muted'
                        }`}
                      >
                        <img
                          src={prod.images?.[0] || '/images/macaco-bless.png'}
                          alt={prod.name}
                          className="w-9 h-11 rounded-lg object-cover object-top shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-foreground truncate">{prod.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {prod.category} • {formatCurrency(prod.promotionalPrice || prod.price)}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Title & Custom URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Título de Identificação
                  </label>
                  <input
                    type="text"
                    required
                    value={editingItem.title || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                    placeholder="Ex: Macaquinho Fitness Serena"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">
                    Link de Destino ao Clicar
                  </label>
                  <input
                    type="text"
                    value={editingItem.customLink || ''}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, customLink: e.target.value })
                    }
                    placeholder="Ex: /produto/prod-1 ou /catalogo"
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-secondary text-foreground font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-md flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar e Publicar no Site</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
