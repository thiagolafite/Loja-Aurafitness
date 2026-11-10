import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, ShoppingBag, Sparkles, ChevronRight, Video, ArrowRight } from 'lucide-react';
import { getFloatingVideoConfig, resolvePlayableVideoUrl } from '../../lib/videoStorage';
import { getProducts } from '../../lib/dataClient';
import { FloatingVideoConfig, FloatingVideoItem, Product } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { getProductMediaSlides, isVideoMedia } from '../../lib/productClassifier';

export const HomeVideoStoriesSection: React.FC = () => {
  const [config, setConfig] = useState<FloatingVideoConfig>(() => getFloatingVideoConfig());
  const [products, setProducts] = useState<Product[]>(() => getProducts());
  const [resolvedUrls, setResolvedUrls] = useState<Record<string, string>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const handleUpdate = () => {
      setConfig(getFloatingVideoConfig());
      setProducts(getProducts());
    };
    window.addEventListener('aura_floating_video_updated', handleUpdate);
    window.addEventListener('aura_products_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('aura_floating_video_updated', handleUpdate);
      window.removeEventListener('aura_products_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeItems = useMemo(() => {
    return (config.items || []).filter((item) => item.active);
  }, [config.items]);

  // Se houver poucos vídeos cadastrados manualmente, inclui automaticamente produtos que possuem vídeos cadastrados
  const displayStories = useMemo(() => {
    const stories: Array<{
      id: string;
      title: string;
      videoUrl: string;
      fallbackImage: string;
      badgeText: string;
      targetLink: string;
      product?: Product;
    }> = [];

    // 1. Vídeos cadastrados pelo admin
    activeItems.forEach((it) => {
      const linkedProd = it.productId
        ? products.find((p) => p.id === it.productId)
        : undefined;
      const fallbackImg =
        linkedProd?.images?.[0] ||
        it.fallbackImages?.[0] ||
        '/images/macaco-bless.png';

      stories.push({
        id: it.id,
        title: it.title || linkedProd?.name || 'Look Aura Fitness',
        videoUrl: it.videoUrl,
        fallbackImage: fallbackImg,
        badgeText: it.badgeText || (linkedProd ? 'VER LOOK' : 'NOVIDADE'),
        targetLink: it.customLink || (linkedProd ? `/produto/${linkedProd.id}` : '/catalogo'),
        product: linkedProd,
      });
    });

    // 2. Se houver produtos com vídeo cadastrado que ainda não estão nos stories, inclui também
    products.forEach((p) => {
      const pVid = getProductMediaSlides(p).find((m) => isVideoMedia(m));
      if (pVid && !stories.some((s) => s.product?.id === p.id || s.videoUrl === pVid)) {
        stories.push({
          id: `prod-vid-${p.id}`,
          title: p.name,
          videoUrl: pVid,
          fallbackImage: p.images?.[0] || '/images/macaco-bless.png',
          badgeText: p.promotionalPrice ? 'PROMOÇÃO' : 'BEST SELLER',
          targetLink: `/produto/${p.id}`,
          product: p,
        });
      }
    });

    return stories;
  }, [activeItems, products]);

  // Resolve URLs de vídeo (idb:// ou links de armazenamento)
  useEffect(() => {
    let isMounted = true;
    displayStories.forEach(async (story) => {
      if (story.videoUrl && !resolvedUrls[story.id]) {
        const url = await resolvePlayableVideoUrl(story.videoUrl);
        if (url && isMounted) {
          setResolvedUrls((prev) => ({ ...prev, [story.id]: url }));
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [displayStories]);

  if (displayStories.length === 0) return null;

  const borderColor = config.borderColor || '#F27474';

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-2">
      {/* Header da Seção de Vídeos */}
      <div className="flex items-end justify-between border-b border-border pb-4">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span
              style={{ backgroundColor: `${borderColor}20`, color: borderColor }}
              className="text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase px-2.5 py-0.5 rounded-full border border-current"
            >
              ★ PROVADOR VIRTUAL
            </span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider hidden sm:inline">
              Caimento Real em Movimento
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground">
            Looks em Vídeo
          </h2>
        </div>

        <Link
          to="/catalogo"
          className="text-xs font-semibold uppercase tracking-wider text-[#38672b] hover:text-[#23421b] dark:text-amber-400 flex items-center gap-1 transition-colors"
        >
          <span>VER TODOS OS MODELOS</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Carrossel de Stories e Vídeos Horizontais (Mobile Touch Scroll + Desktop Grid) */}
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none snap-x snap-mandatory">
        {displayStories.map((story) => {
          const playable = resolvedUrls[story.id] || (story.videoUrl.startsWith('http') ? story.videoUrl : '');

          return (
            <div
              key={story.id}
              className="shrink-0 snap-start w-[160px] sm:w-[200px] md:w-[220px] group"
            >
              {/* Card Vertical de Vídeo (Estilo Stories / TikTok com moldura dupla) */}
              <div
                style={{ borderColor }}
                className="w-full aspect-[9/16] rounded-3xl border-2 bg-white p-[2.5px] shadow-lg transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl relative flex flex-col justify-between overflow-hidden"
              >
                <div
                  style={{ borderColor }}
                  className="w-full h-full rounded-[22px] border overflow-hidden relative bg-neutral-900"
                >
                  {/* Vídeo com Autoplay Mudo para Smartphone e Desktop */}
                  {playable ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[story.id] = el;
                        if (el) {
                          el.defaultMuted = true;
                          el.muted = true;
                          el.playsInline = true;
                          el.play().catch(() => {});
                        }
                      }}
                      src={playable}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <img
                      src={story.fallbackImage}
                      alt={story.title}
                      className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-700"
                    />
                  )}

                  {/* Vinheta Escura Suave no Topo e na Base */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40 pointer-events-none" />

                  {/* Badge Superior */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <span
                      style={{ backgroundColor: borderColor }}
                      className="text-[9px] font-extrabold uppercase text-white px-2 py-0.5 rounded-full shadow"
                    >
                      {story.badgeText}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center">
                      <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Card Inferior do Produto Vinculado */}
                  <Link
                    to={story.targetLink}
                    className="absolute bottom-2.5 left-2.5 right-2.5 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-2 border border-white/30 shadow-lg text-left block hover:scale-[1.02] transition-transform"
                  >
                    <p className="text-[11px] font-bold text-foreground truncate leading-tight">
                      {story.title}
                    </p>
                    {story.product && (
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/50">
                        <span className="text-[10px] font-extrabold text-[#38672b] dark:text-emerald-400">
                          {formatCurrency(story.product.promotionalPrice || story.product.price)}
                        </span>
                        <span
                          style={{ backgroundColor: `${borderColor}25`, color: borderColor }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5"
                        >
                          <ShoppingBag className="w-2.5 h-2.5" />
                          <span>Ver</span>
                        </span>
                      </div>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
