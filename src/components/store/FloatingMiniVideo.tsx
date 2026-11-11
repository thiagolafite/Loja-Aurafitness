import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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

  const miniVideoRef = useRef<HTMLVideoElement | null>(null);
  const expandedVideoRef = useRef<HTMLVideoElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

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

  const activeItems = useMemo(() => {
    const raw = (config.items || []).filter((item) => item.active);
    return [...raw].sort((a, b) => {
      const aHasVid = Boolean(a.videoUrl && a.videoUrl.trim() && !a.videoUrl.includes('assets.mixkit.co'));
      const bHasVid = Boolean(b.videoUrl && b.videoUrl.trim() && !b.videoUrl.includes('assets.mixkit.co'));
      if (aHasVid && !bHasVid) return -1;
      if (!aHasVid && bHasVid) return 1;
      return (a.order || 0) - (b.order || 0);
    });
  }, [config.items]);

  const safeIndex = activeIndex < activeItems.length ? activeIndex : 0;
  const currentItem = activeItems[safeIndex];

  // Linked product resolution (falls back to first available product if deleted/missing)
  const linkedProduct = useMemo(() => {
    if (currentItem?.productId) {
      const found = products.find((p) => p.id === currentItem.productId);
      if (found) return found;
    }
    const prodWithVideo = products.find((p) =>
      getProductMediaSlides(p).some((m) => isVideoMedia(m))
    );
    return prodWithVideo || products[0];
  }, [currentItem?.productId, products]);

  // Gather candidate video sources in priority order
  const candidateVideoSources = useMemo(() => {
    const candidates: string[] = [];
    if (
      currentItem?.videoUrl &&
      !currentItem.videoUrl.includes('assets.mixkit.co')
    ) {
      candidates.push(currentItem.videoUrl);
    }
    if (linkedProduct) {
      const linkedVid = getProductMediaSlides(linkedProduct).find((m) => isVideoMedia(m));
      if (linkedVid && !candidates.includes(linkedVid)) {
        candidates.push(linkedVid);
      }
    }
    for (const p of products) {
      const vid = getProductMediaSlides(p).find((m) => isVideoMedia(m));
      if (vid && !candidates.includes(vid)) {
        candidates.push(vid);
      }
    }
    return candidates;
  }, [currentItem?.videoUrl, linkedProduct, products]);

  // Resolve the first playable video URL from candidates
  useEffect(() => {
    let isMounted = true;
    setVideoFailed(false);

    const resolveFirstAvailable = async () => {
      for (const candidate of candidateVideoSources) {
        const resolved = await resolvePlayableVideoUrl(candidate);
        if (resolved && isMounted) {
          setPlayableUrl(resolved);
          setVideoFailed(false);
          return;
        }
      }
      if (isMounted) {
        setPlayableUrl('');
        setVideoFailed(true);
      }
    };

    if (candidateVideoSources.length === 0) {
      setPlayableUrl('');
      setVideoFailed(true);
    } else {
      resolveFirstAvailable();
    }

    const handleBlobReady = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (
        detail &&
        detail.url &&
        candidateVideoSources.includes(detail.idbRef) &&
        isMounted
      ) {
        setPlayableUrl(detail.url);
        setVideoFailed(false);
      }
    };

    window.addEventListener('aura_video_blob_ready', handleBlobReady);
    return () => {
      isMounted = false;
      window.removeEventListener('aura_video_blob_ready', handleBlobReady);
    };
  }, [candidateVideoSources, currentItem?.id]);

  // Force mobile video playback helper (solves iOS Safari & Android Chrome muted autoplay restrictions)
  const ensureVideoPlays = useCallback(
    (el: HTMLVideoElement | null, shouldMute: boolean) => {
      if (!el) return;
      el.defaultMuted = shouldMute;
      el.muted = shouldMute;
      el.playsInline = true;
      el.setAttribute('playsinline', '');
      el.setAttribute('webkit-playsinline', '');
      if (shouldMute) {
        el.setAttribute('muted', '');
      } else {
        el.removeAttribute('muted');
      }
      if (el.paused) {
        const p = el.play();
        if (p !== undefined) {
          p.catch(() => {
            el.defaultMuted = true;
            el.muted = true;
            el.setAttribute('muted', '');
            el.play().catch(() => {});
          });
        }
      }
    },
    []
  );

  // Trigger playback whenever playableUrl, expanded state, or mute state changes, plus unlock on mobile touch/scroll
  useEffect(() => {
    if (videoFailed || !playableUrl) return;

    if (!isExpanded && miniVideoRef.current) {
      ensureVideoPlays(miniVideoRef.current, true);
    }
    if (isExpanded && expandedVideoRef.current) {
      ensureVideoPlays(expandedVideoRef.current, isMuted);
    }

    const unlockMobilePlayback = () => {
      if (!isExpanded && miniVideoRef.current && miniVideoRef.current.paused) {
        ensureVideoPlays(miniVideoRef.current, true);
      }
      if (isExpanded && expandedVideoRef.current && expandedVideoRef.current.paused) {
        ensureVideoPlays(expandedVideoRef.current, isMuted);
      }
    };

    window.addEventListener('touchstart', unlockMobilePlayback, { passive: true });
    window.addEventListener('touchend', unlockMobilePlayback, { passive: true });
    window.addEventListener('scroll', unlockMobilePlayback, { passive: true });
    window.addEventListener('click', unlockMobilePlayback, { passive: true });

    return () => {
      window.removeEventListener('touchstart', unlockMobilePlayback);
      window.removeEventListener('touchend', unlockMobilePlayback);
      window.removeEventListener('scroll', unlockMobilePlayback);
      window.removeEventListener('click', unlockMobilePlayback);
    };
  }, [playableUrl, videoFailed, isExpanded, isMuted, isDismissed, ensureVideoPlays]);

  const targetLink =
    linkedProduct
      ? `/produto/${linkedProduct.id}`
      : currentItem?.customLink?.trim() || '/catalogo';

  // Multi-pose images for fluid Reels motion lookbook when no MP4 is active
  const fallbackImages = useMemo(() => {
    const prodPhotos =
      linkedProduct?.images?.filter((img) => Boolean(img) && !isVideoMedia(img)) || [];
    const itemFallbacks =
      currentItem?.fallbackImages?.filter((img) => Boolean(img) && !isVideoMedia(img)) || [];
    const catalogPhotos = products
      .flatMap((p) => p.images || [])
      .filter((img) => Boolean(img) && !isVideoMedia(img));

    const combined = Array.from(new Set([...prodPhotos, ...itemFallbacks, ...catalogPhotos])).slice(
      0,
      8
    );
    return combined.length > 0
      ? combined
      : ['/images/macaco-bless.png', '/images/look-3214.png', '/images/look-3656.png'];
  }, [linkedProduct, currentItem?.fallbackImages, products]);

  // Continuous Reels motion cycle across poses
  useEffect(() => {
    if (!videoFailed && playableUrl) return;
    if (fallbackImages.length <= 1) return;
    const timer = setInterval(() => {
      setFallbackSlideIdx((prev) => (prev + 1) % fallbackImages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [videoFailed, playableUrl, fallbackImages.length]);

  if (!config.enabled || activeItems.length === 0 || !currentItem) {
    return null;
  }

  const positionClass =
    config.position === 'bottom-right'
      ? 'bottom-20 right-2.5 sm:bottom-24 sm:right-5'
      : 'bottom-3 left-2.5 sm:bottom-5 sm:left-5';

  const sizeClasses = {
    sm: 'w-[64px] h-[106px] sm:w-[100px] sm:h-[170px]',
    md: 'w-[72px] h-[120px] sm:w-[132px] sm:h-[220px]',
    lg: 'w-[84px] h-[140px] sm:w-[160px] sm:h-[268px]',
  }[config.size || 'md'];

  const borderColor = config.borderColor || '#F27474';

  const handleNextStory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (activeItems.length > 1) {
      setActiveIndex((prev) => (prev + 1) % activeItems.length);
    } else if (fallbackImages.length > 1) {
      setFallbackSlideIdx((prev) => (prev + 1) % fallbackImages.length);
    }
  };

  const handlePrevStory = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (activeItems.length > 1) {
      setActiveIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    } else if (fallbackImages.length > 1) {
      setFallbackSlideIdx((prev) => (prev - 1 + fallbackImages.length) % fallbackImages.length);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const deltaX = endX - touchStartXRef.current;
    touchStartXRef.current = null;
    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) handleNextStory();
      else handlePrevStory();
    }
  };

  const handleMiniCardTap = () => {
    if (config.clickAction === 'direct-link') {
      navigate(targetLink);
    } else {
      setIsExpanded(true);
      setIsMuted(false);
    }
  };

  const activeFallbackImg =
    fallbackImages[fallbackSlideIdx % Math.max(1, fallbackImages.length)] ||
    '/images/macaco-bless.png';

  // Minimized pill when dismissed by visitor
  if (isDismissed) {
    return (
      <button
        type="button"
        onClick={() => setIsDismissed(false)}
        style={{ borderColor }}
        className={`fixed ${positionClass} z-40 bg-card/95 backdrop-blur-md text-foreground px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-full shadow-xl border-2 flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold hover:scale-105 active:scale-95 transition-all`}
        title="Abrir Vídeo em Destaque"
      >
        <span
          style={{ backgroundColor: borderColor }}
          className="w-4 h-4 sm:w-5 sm:h-5 rounded-full text-white flex items-center justify-center"
        >
          <Play className="w-2 h-2 sm:w-2.5 sm:h-2.5 fill-current ml-0.5" />
        </span>
        <span>Ver Vídeo</span>
      </button>
    );
  }

  return (
    <>
      {/* FLOATING MINI-VIDEO WIDGET (ESTILO LÊ ROSE - DESKTOP & SMARTPHONE) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`fixed ${positionClass} z-40 group select-none`}
          >
            {/* Outer Colored Ring + Inner White Frame (Moldura dupla estilo Lê Rose) */}
            <div
              style={{
                borderColor,
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.35)',
              }}
              className="rounded-[14px] sm:rounded-[20px] border-[2px] sm:border-[2.5px] bg-white p-[2px] sm:p-[2.5px] transition-transform duration-300 sm:group-hover:scale-[1.03] relative"
            >
              {/* Inner Container */}
              <div
                style={{ borderColor }}
                className={`${sizeClasses} rounded-[10px] sm:rounded-[15px] border sm:border-[1.5px] overflow-hidden relative bg-neutral-900`}
              >
                {/* Close / Minimize Button (Top Right - Always visible on smartphone) */}
                {config.showCloseButton && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsDismissed(true);
                    }}
                    className="absolute top-1 right-1 z-30 w-5 h-5 sm:w-5 sm:h-5 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
                    title="Minimizar vídeo"
                  >
                    <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  </button>
                )}

                {/* Expand with Sound Button (Top Left - Always visible on smartphone) */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsExpanded(true);
                    setIsMuted(false);
                  }}
                  className="absolute top-1 left-1 z-30 w-5 h-5 sm:w-5 sm:h-5 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shadow"
                  title="Expandir vídeo em tela cheia"
                >
                  <Maximize2 className="w-2.5 h-2.5 sm:w-2.5 sm:h-2.5" />
                </button>

                {/* Story / Reels Progress Bars */}
                <div className="absolute top-1 inset-x-2 z-20 flex gap-1 pointer-events-none">
                  {(activeItems.length > 1 ? activeItems : fallbackImages.slice(0, 5)).map(
                    (_, idx) => {
                      const currentIdx =
                        activeItems.length > 1
                          ? safeIndex
                          : fallbackSlideIdx % Math.min(5, fallbackImages.length);
                      return (
                        <div
                          key={idx}
                          className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                            idx === currentIdx ? 'bg-white' : 'bg-white/35'
                          }`}
                        />
                      );
                    }
                  )}
                </div>

                {/* Main Tap Area (Div instead of <a> so mobile browsers never block <video> playback) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={handleMiniCardTap}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleMiniCardTap();
                  }}
                  className="w-full h-full relative cursor-pointer"
                  title={
                    linkedProduct
                      ? `Ver ${linkedProduct.name}`
                      : currentItem.title || 'Assistir vídeo'
                  }
                >
                  {!videoFailed && playableUrl ? (
                    <video
                      ref={(el) => {
                        miniVideoRef.current = el;
                        if (el) {
                          el.defaultMuted = true;
                          el.muted = true;
                          el.playsInline = true;
                          el.setAttribute('muted', '');
                          el.setAttribute('playsinline', '');
                          el.setAttribute('webkit-playsinline', '');
                        }
                      }}
                      key={playableUrl}
                      src={playableUrl}
                      autoPlay
                      loop={activeItems.length <= 1}
                      muted
                      playsInline
                      preload="auto"
                      onLoadedMetadata={(e) => ensureVideoPlays(e.currentTarget, true)}
                      onLoadedData={(e) => ensureVideoPlays(e.currentTarget, true)}
                      onCanPlay={(e) => ensureVideoPlays(e.currentTarget, true)}
                      onError={() => setVideoFailed(true)}
                      onEnded={() => {
                        if (activeItems.length > 1) {
                          handleNextStory();
                        } else if (miniVideoRef.current) {
                          miniVideoRef.current.currentTime = 0;
                          ensureVideoPlays(miniVideoRef.current, true);
                        }
                      }}
                      className="w-full h-full object-cover object-top pointer-events-none"
                    />
                  ) : (
                    /* Fluid Ken-Burns Reels Motion Lookbook (for when no external MP4 is active) */
                    <div className="w-full h-full relative overflow-hidden bg-neutral-900 pointer-events-none">
                      <AnimatePresence mode="sync">
                        <motion.img
                          key={activeFallbackImg}
                          src={activeFallbackImg}
                          alt={currentItem.title}
                          initial={{ opacity: 0.25, scale: 1.02 }}
                          animate={{ opacity: 1, scale: 1.14, y: [0, -4, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{
                            opacity: { duration: 0.45 },
                            scale: { duration: 2.2, ease: 'linear' },
                            y: { duration: 2.2, ease: 'easeInOut' },
                          }}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Bottom Product Badge (Scaled down on mobile) */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-1 sm:p-2 pt-3 sm:pt-6 opacity-100 sm:opacity-90 sm:group-hover:opacity-100 transition-opacity flex items-end justify-between pointer-events-none">
                    <span className="text-[8px] sm:text-[10px] font-bold text-white leading-tight line-clamp-1 sm:line-clamp-2 drop-shadow">
                      {linkedProduct
                        ? linkedProduct.name
                        : currentItem.buttonText || currentItem.badgeText || 'Ver Look'}
                    </span>
                    {config.clickAction === 'direct-link' ? (
                      <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white shrink-0 ml-0.5" />
                    ) : (
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white fill-white shrink-0 ml-0.5" />
                    )}
                  </div>
                </div>
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
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
            onClick={() => setIsExpanded(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              style={{ borderColor }}
              className="relative w-[92vw] max-w-[350px] h-[78dvh] max-h-[590px] rounded-3xl border-[3px] bg-white p-1 shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full rounded-[20px] overflow-hidden relative bg-neutral-950 flex flex-col justify-between">
                {/* Video / Motion Background */}
                {!videoFailed && playableUrl ? (
                  <video
                    ref={(el) => {
                      expandedVideoRef.current = el;
                      if (el) {
                        el.defaultMuted = isMuted;
                        el.muted = isMuted;
                        el.playsInline = true;
                        el.setAttribute('playsinline', '');
                        el.setAttribute('webkit-playsinline', '');
                        if (isMuted) el.setAttribute('muted', '');
                      }
                    }}
                    key={`exp-${playableUrl}`}
                    src={playableUrl}
                    autoPlay
                    loop
                    muted={isMuted}
                    playsInline
                    preload="auto"
                    onLoadedMetadata={(e) => ensureVideoPlays(e.currentTarget, isMuted)}
                    onLoadedData={(e) => ensureVideoPlays(e.currentTarget, isMuted)}
                    onCanPlay={(e) => ensureVideoPlays(e.currentTarget, isMuted)}
                    onError={() => setVideoFailed(true)}
                    className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full overflow-hidden bg-neutral-950 pointer-events-none">
                    <AnimatePresence mode="sync">
                      <motion.img
                        key={`exp-img-${activeFallbackImg}`}
                        src={activeFallbackImg}
                        alt={currentItem.title}
                        initial={{ opacity: 0.3, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1.12 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          opacity: { duration: 0.45 },
                          scale: { duration: 2.2, ease: 'linear' },
                        }}
                        className="absolute inset-0 w-full h-full object-cover object-top"
                      />
                    </AnimatePresence>
                  </div>
                )}

                {/* Top Controls Bar */}
                <div className="relative z-20 p-3.5 bg-gradient-to-b from-black/80 via-black/35 to-transparent">
                  {/* Story bars */}
                  <div className="flex gap-1.5 mb-2.5">
                    {(activeItems.length > 1 ? activeItems : fallbackImages.slice(0, 6)).map(
                      (it, idx) => {
                        const currentIdx =
                          activeItems.length > 1
                            ? safeIndex
                            : fallbackSlideIdx % Math.min(6, fallbackImages.length);
                        return (
                          <button
                            key={typeof it === 'string' ? idx : it.id}
                            type="button"
                            onClick={() => {
                              if (activeItems.length > 1) setActiveIndex(idx);
                              else setFallbackSlideIdx(idx);
                            }}
                            className={`h-1 flex-1 rounded-full transition-all ${
                              idx === currentIdx ? 'bg-white' : 'bg-white/35'
                            }`}
                          />
                        );
                      }
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        style={{ backgroundColor: borderColor }}
                        className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-white shadow shrink-0"
                      >
                        {currentItem.badgeText || 'DESTAQUE'}
                      </span>
                      <span className="text-xs font-bold text-white truncate drop-shadow">
                        {linkedProduct?.name || currentItem.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!videoFailed && playableUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextMuted = !isMuted;
                            setIsMuted(nextMuted);
                            if (expandedVideoRef.current) {
                              expandedVideoRef.current.muted = nextMuted;
                              expandedVideoRef.current.play().catch(() => {});
                            }
                          }}
                          className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                          title={isMuted ? 'Ativar Som' : 'Silenciar'}
                        >
                          {isMuted ? (
                            <VolumeX className="w-4 h-4" />
                          ) : (
                            <Volume2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsExpanded(false)}
                        className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
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
                        className="w-8 h-8 rounded-full bg-black/55 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                        title="Fechar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prev / Next Navigation Arrows */}
                {(activeItems.length > 1 || fallbackImages.length > 1) && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevStory}
                      className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStory}
                      className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/45 hover:bg-black/75 text-white flex items-center justify-center"
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
                          {formatCurrency(
                            linkedProduct.promotionalPrice || linkedProduct.price
                          )}
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
