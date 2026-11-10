import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Play,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getFloatingVideoConfig,
  resolvePlayableVideoUrl,
} from '../../lib/videoStorage';
import { getProducts } from '../../lib/dataClient';
import { getProductMediaSlides, isVideoMedia } from '../../lib/productClassifier';
import { FloatingVideoConfig, Product } from '../../types';
import { formatCurrency } from '../../lib/utils';

export const FloatingMiniVideo: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<FloatingVideoConfig>(() => getFloatingVideoConfig());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playableUrl, setPlayableUrl] = useState<string>('');
  const [videoFailed, setVideoFailed] = useState(false);
  const [fallbackSlideIdx, setFallbackSlideIdx] = useState(0);

  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

  // Sync configuration and products in real time
  useEffect(() => {
    const syncConfig = () => {
      setConfig(getFloatingVideoConfig());
      setIsDismissed(false);
    };
    const syncProds = () => setProducts(getProducts());

    window.addEventListener('aura_floating_video_updated', syncConfig);
    window.addEventListener('aura_products_updated', syncProds);
    window.addEventListener('storage', syncConfig);
    return () => {
      window.removeEventListener('aura_floating_video_updated', syncConfig);
      window.removeEventListener('aura_products_updated', syncProds);
      window.removeEventListener('storage', syncConfig);
    };
  }, []);

  const activeItems = (config.items || []).filter((item) => item.active);
  const safeIndex = activeIndex < activeItems.length ? activeIndex : 0;
  const currentItem = activeItems[safeIndex];

  // Linked product resolution
  const linkedProduct = currentItem?.productId
    ? products.find((p) => p.id === currentItem.productId)
    : undefined;

  const productEmbeddedVideo =
    (linkedProduct && getProductMediaSlides(linkedProduct).find((m) => isVideoMedia(m))) ||
    products.flatMap((p) => getProductMediaSlides(p)).find((m) => isVideoMedia(m));

  const effectiveVideoSource =
    currentItem?.videoUrl &&
    !currentItem.videoUrl.includes('assets.mixkit.co')
      ? currentItem.videoUrl
      : productEmbeddedVideo || currentItem?.videoUrl || '';

  // Resolve IndexedDB or direct video URL
  useEffect(() => {
    let isMounted = true;
    setVideoFailed(false);

    if (!effectiveVideoSource) {
      setPlayableUrl('');
      setVideoFailed(true);
      return;
    }

    resolvePlayableVideoUrl(effectiveVideoSource).then((resolved) => {
      if (isMounted) {
        if (resolved) {
          setPlayableUrl(resolved);
          setVideoFailed(false);
        } else {
          setPlayableUrl('');
          setVideoFailed(true);
        }
      }
    });

    const handleBlobReady = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.idbRef === effectiveVideoSource && detail.url && isMounted) {
        setPlayableUrl(detail.url);
        setVideoFailed(false);
      }
    };

    window.addEventListener('aura_video_blob_ready', handleBlobReady);
    return () => {
      isMounted = false;
      window.removeEventListener('aura_video_blob_ready', handleBlobReady);
    };
  }, [effectiveVideoSource, currentItem?.id]);

  const targetLink =
    currentItem?.customLink?.trim() ||
    (linkedProduct ? `/produto/${linkedProduct.id}` : '/catalogo');

  // Fallback motion images if video URL is empty or fails to load
  const fallbackImages =
    linkedProduct?.images && linkedProduct.images.length > 0
      ? linkedProduct.images
      : currentItem?.fallbackImages && currentItem.fallbackImages.length > 0
      ? currentItem.fallbackImages
      : products.flatMap((p) => p.images || []).filter(Boolean).slice(0, 5);

  useEffect(() => {
    if (!videoFailed && playableUrl) return;
    if (fallbackImages.length <= 1) return;
    const timer = setInterval(() => {
      setFallbackSlideIdx((prev) => (prev + 1) % fallbackImages.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [videoFailed, playableUrl, fallbackImages.length]);

  if (!config.enabled || activeItems.length === 0 || !currentItem) {
    return null;
  }

  const positionClass =
    config.position === 'bottom-right'
      ? 'bottom-24 right-5'
      : 'bottom-5 left-5';

  const sizeClasses = {
    sm: 'w-[100px] h-[170px]',
    md: 'w-[122px] h-[204px] sm:w-[132px] sm:h-[220px]',
    lg: 'w-[148px] h-[248px] sm:w-[160px] sm:h-[268px]',
  }[config.size || 'md'];

  const borderColor = config.borderColor || '#F27474';

  const handleNextStory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setActiveIndex((prev) => (prev + 1) % activeItems.length);
  };

  const handlePrevStory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setActiveIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
  };

  // Minimized pill when dismissed by visitor
  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        style={{ borderColor }}
        className={`fixed ${positionClass} z-40 bg-card/95 backdrop-blur-md text-foreground px-3 py-2 rounded-full shadow-xl border-2 flex items-center gap-2 text-xs font-bold hover:scale-105 transition-all`}
        title="Abrir Vídeo em Destaque"
      >
        <span
          style={{ backgroundColor: borderColor }}
          className="w-5 h-5 rounded-full text-white flex items-center justify-center"
        >
          <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
        </span>
        <span>Ver Vídeo</span>
      </button>
    );
  }

  return (
    <>
      {/* FLOATING MINI-VIDEO WIDGET (ESTILO LÊ ROSE) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            className={`fixed ${positionClass} z-40 group select-none`}
          >
            {/* Outer Colored Ring + Inner White Frame (Idêntico à borda dupla da Lê Rose) */}
            <div
              style={{
                borderColor,
                boxShadow: '0 12px 32px -6px rgba(0, 0, 0, 0.35)',
              }}
              className="rounded-[20px] border-[2.5px] bg-white p-[2.5px] transition-transform duration-300 group-hover:scale-[1.03] relative"
            >
              {/* Inner Container */}
              <div
                style={{ borderColor }}
                className={`${sizeClasses} rounded-[15px] border-[1.5px] overflow-hidden relative bg-neutral-900`}
              >
                {/* Close / Minimize Button (Top Right) */}
                {config.showCloseButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDismissed(true);
                    }}
                    className="absolute top-1.5 right-1.5 z-30 w-5 h-5 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                    title="Minimizar vídeo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Expand with Sound Button (Top Left) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(true);
                    setIsMuted(false);
                  }}
                  className="absolute top-1.5 left-1.5 z-30 w-5 h-5 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  title="Expandir vídeo com som"
                >
                  <Maximize2 className="w-2.5 h-2.5" />
                </button>

                {/* Story Progress Bars if multiple videos */}
                {activeItems.length > 1 && (
                  <div className="absolute top-1 inset-x-2 z-20 flex gap-1 pointer-events-none">
                    {activeItems.map((it, idx) => (
                      <div
                        key={it.id}
                        className={`h-0.5 flex-1 rounded-full ${
                          idx === safeIndex ? 'bg-white' : 'bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Clickable Area: Either Direct Product Link (Lê Rose style) or Expand Player */}
                {config.clickAction === 'direct-link' ? (
                  <Link
                    to={targetLink}
                    className="block w-full h-full relative cursor-pointer"
                    title={linkedProduct ? `Ver ${linkedProduct.name}` : currentItem.title}
                  >
                    {!videoFailed && playableUrl ? (
                      <video
                        ref={miniVideoRef}
                        key={playableUrl}
                        src={playableUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onLoadedData={(e) => {
                          const el = e.currentTarget;
                          el.defaultMuted = true;
                          el.muted = true;
                          if (el.paused) el.play().catch(() => {});
                        }}
                        onError={() => setVideoFailed(true)}
                        onEnded={() => {
                          if (activeItems.length > 1) {
                            handleNextStory();
                          }
                        }}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      /* Fallback Reels Motion Lookbook */
                      <div className="w-full h-full relative overflow-hidden bg-neutral-900">
                        <img
                          src={fallbackImages[fallbackSlideIdx % Math.max(1, fallbackImages.length)] || '/images/macaco-bless.png'}
                          alt={currentItem.title}
                          className="w-full h-full object-cover object-top animate-pulse-slow scale-105 transition-all duration-1000"
                        />
                      </div>
                    )}

                    {/* Subtle Bottom Gradient & Product Label on Hover */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between">
                      <span className="text-[10px] font-bold text-white leading-tight line-clamp-2">
                        {linkedProduct ? linkedProduct.name : currentItem.buttonText || 'Ver Produto'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-white shrink-0 ml-1" />
                    </div>
                  </Link>
                ) : (
                  <div
                    onClick={() => {
                      setIsExpanded(true);
                      setIsMuted(false);
                    }}
                    className="w-full h-full relative cursor-pointer"
                    title="Clique para assistir e ver a peça"
                  >
                    {!videoFailed && playableUrl ? (
                      <video
                        ref={miniVideoRef}
                        key={playableUrl}
                        src={playableUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="auto"
                        onLoadedData={(e) => {
                          const el = e.currentTarget;
                          el.defaultMuted = true;
                          el.muted = true;
                          if (el.paused) el.play().catch(() => {});
                        }}
                        onError={() => setVideoFailed(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <div className="w-full h-full relative overflow-hidden bg-neutral-900">
                        <img
                          src={fallbackImages[fallbackSlideIdx % Math.max(1, fallbackImages.length)] || '/images/macaco-bless.png'}
                          alt={currentItem.title}
                          className="w-full h-full object-cover object-top scale-105 transition-all duration-1000"
                        />
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-2 pt-6 flex items-end justify-between">
                      <span className="text-[10px] font-bold text-white leading-tight line-clamp-1">
                        {currentItem.badgeText || 'Ver Look'}
                      </span>
                      <Play className="w-3 h-3 text-white fill-white shrink-0" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXPANDED STORY VIDEO PLAYER MODAL / CARD */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{ borderColor }}
              className="relative w-full max-w-[340px] h-[580px] rounded-3xl border-[3px] bg-white p-1 shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full rounded-[20px] overflow-hidden relative bg-neutral-950 flex flex-col justify-between">
                {/* Video / Motion Background */}
                {!videoFailed && playableUrl ? (
                  <video
                    ref={expandedVideoRef}
                    key={`exp-${playableUrl}`}
                    src={playableUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onLoadedData={(e) => {
                      const el = e.currentTarget;
                      el.defaultMuted = isMuted;
                      el.muted = isMuted;
                      if (el.paused) {
                        el.play().catch(() => {
                          el.muted = true;
                          el.play().catch(() => {});
                        });
                      }
                    }}
                    onError={() => setVideoFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                ) : (
                  <img
                    src={fallbackImages[fallbackSlideIdx % Math.max(1, fallbackImages.length)] || '/images/macaco-bless.png'}
                    alt={currentItem.title}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                  />
                )}

                {/* Top Controls Bar */}
                <div className="relative z-20 p-3.5 bg-gradient-to-b from-black/75 via-black/30 to-transparent">
                  {/* Story bars */}
                  {activeItems.length > 1 && (
                    <div className="flex gap-1.5 mb-2.5">
                      {activeItems.map((it, idx) => (
                        <button
                          key={it.id}
                          onClick={() => setActiveIndex(idx)}
                          className={`h-1 flex-1 rounded-full transition-all ${
                            idx === safeIndex ? 'bg-white' : 'bg-white/35'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ backgroundColor: borderColor }}
                        className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white shadow"
                      >
                        {currentItem.badgeText || 'DESTAQUE'}
                      </span>
                      <span className="text-xs font-bold text-white truncate max-w-[160px] drop-shadow">
                        {currentItem.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!videoFailed && playableUrl && (
                        <button
                          type="button"
                          onClick={() => setIsMuted(!isMuted)}
                          className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                          title={isMuted ? 'Ativar Som' : 'Silenciar'}
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        title="Minimizar para o canto"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          setIsDismissed(true);
                        }}
                        className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prev / Next Navigation Arrows if multiple stories */}
                {activeItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevStory}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStory}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Bottom Shoppable Product Card */}
                <div className="relative z-20 p-3.5 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-10">
                  {linkedProduct ? (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 flex items-center gap-3 shadow-xl border border-white/20">
                      <img
                        src={linkedProduct.images?.[0] || '/images/macaco-bless.png'}
                        alt={linkedProduct.name}
                        className="w-12 h-14 rounded-xl object-cover object-top shrink-0 border border-border"
                      />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[10px] font-bold uppercase text-primary tracking-wider">
                          {linkedProduct.category}
                        </p>
                        <h4 className="text-xs font-bold text-foreground truncate">
                          {linkedProduct.name}
                        </h4>
                        <p className="text-xs font-serif font-bold text-primary mt-0.5">
                          {formatCurrency(linkedProduct.promotionalPrice || linkedProduct.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsExpanded(false);
                          navigate(targetLink);
                        }}
                        style={{ backgroundColor: borderColor }}
                        className="px-3.5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md hover:opacity-95 transition-opacity shrink-0 flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Ver</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsExpanded(false);
                        navigate(targetLink);
                      }}
                      style={{ backgroundColor: borderColor }}
                      className="w-full py-3 rounded-2xl text-white font-bold text-xs shadow-xl hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{currentItem.buttonText || 'Ver Produto em Destaque'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
