import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Sparkles, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '../../components/store/ProductCard';
import { TrustBar } from '../../components/store/TrustBar';
import {
  getProducts,
  fetchProductsAsync,
  getHeroBanners,
  getStoreSections,
  initialHeroBanners,
} from '../../lib/dataClient';
import { Product, HeroBannerSlide, StoreSection } from '../../types';
import {
  getImageInlineStyle,
  getBannerBackgroundStyle,
  getBannerHeightClass,
  getBannerButtonStyle,
  getBannerButtonRadiusClass,
  resolveTitleFontSize,
  resolveMobileTitleFontSize,
  getImageCardContainerStyle,
} from '../../lib/bannerStyles';
import {
  STORE_CATEGORIES,
  normalizeCategoryName,
  getCategoryPhoto,
  getStoredCategories,
  AvailableCategory,
  isProductMatchingCategory,
} from '../../lib/productClassifier';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<AvailableCategory[]>(() => getStoredCategories());
  const [heroBanners, setHeroBanners] = useState<HeroBannerSlide[]>(() => getHeroBanners());
  const [storeSections, setStoreSections] = useState<StoreSection[]>(() => getStoreSections());
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    setProducts(getProducts());
    setCategories(getStoredCategories());
    setHeroBanners(getHeroBanners());
    setStoreSections(getStoreSections());

    fetchProductsAsync().then((prods) => {
      if (prods && prods.length > 0) {
        setProducts([...prods]);
      }
    });

    const syncCats = () => {
      setCategories(getStoredCategories());
      setProducts(getProducts());
    };
    const syncProds = () => {
      setCategories(getStoredCategories());
      setProducts(getProducts());
    };
    const syncBanners = () => setHeroBanners(getHeroBanners());
    const syncSections = () => setStoreSections(getStoreSections());

    window.addEventListener('aura_categories_updated', syncCats);
    window.addEventListener('aura_products_updated', syncProds);
    window.addEventListener('aura_banners_updated', syncBanners);
    window.addEventListener('aura_sections_updated', syncSections);
    window.addEventListener('storage', syncCats);
    window.addEventListener('storage', syncBanners);
    window.addEventListener('storage', syncSections);

    return () => {
      window.removeEventListener('aura_categories_updated', syncCats);
      window.removeEventListener('aura_products_updated', syncProds);
      window.removeEventListener('aura_banners_updated', syncBanners);
      window.removeEventListener('aura_sections_updated', syncSections);
      window.removeEventListener('storage', syncCats);
      window.removeEventListener('storage', syncBanners);
      window.removeEventListener('storage', syncSections);
    };
  }, []);

  const activeBanners = heroBanners.filter((b) => b.active);
  const heroSlides =
    activeBanners.length > 0
      ? activeBanners
      : getHeroBanners().length > 0
      ? getHeroBanners()
      : initialHeroBanners;

  const [copiedCoupon, setCopiedCoupon] = useState<string | null>(null);

  const handleCopyCoupon = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(code);
      setCopiedCoupon(code);
      setTimeout(() => setCopiedCoupon(null), 2500);
    } catch (err) {
      console.warn('Erro ao copiar cupom:', err);
    }
  };

  const handleNextSlide = () => {
    if (heroSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    if (heroSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) handleNextSlide();
      else handlePrevSlide();
    }
    setTouchStartX(null);
  };

  const safeSlideIndex =
    heroSlides.length > 0 ? Math.min(Math.max(currentSlide, 0), heroSlides.length - 1) : 0;
  const slide: HeroBannerSlide =
    heroSlides[safeSlideIndex] ||
    initialHeroBanners[0] || {
      id: 'default-fallback',
      title: 'Aura Fitness',
      subtitle: 'Moda fitness de alta performance',
      badge: 'NOVA COLEÇÃO',
      buttonText: 'VER PRODUTOS',
      link: '/catalogo',
      leftImage: '/images/look-3214.png',
      rightImage: '/images/macaco-bless.png',
      active: true,
      order: 1,
    };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Carousel Banner Full-Width Edge-to-Edge (Aura High-Fashion) */}
      <section
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden select-none p-0 m-0"
      >
        <div className={`relative w-full flex items-center justify-center ${getBannerHeightClass(slide.bannerHeight)}`}>
          {/* Floating Left Arrow (Apenas Desktop) */}
          <button
            onClick={handlePrevSlide}
            className="hidden md:flex absolute left-3 sm:left-6 lg:left-8 z-30 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 backdrop-blur-sm"
            aria-label="Slide Anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Floating Right Arrow (Apenas Desktop) */}
          <button
            onClick={handleNextSlide}
            className="hidden md:flex absolute right-3 sm:right-6 lg:right-8 z-30 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 backdrop-blur-sm"
            aria-label="Próximo Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* BANNER PRINCIPAL RESPONSIVO & UNIFICADO (ALTA-COSTURA AURA FITNESS) */}
          <div
            style={getBannerBackgroundStyle(slide)}
            className="w-full h-full relative overflow-hidden flex items-center justify-between text-neutral-900 transition-all duration-500"
          >
            {/* Brilho Aura Ambiente (Configurado pelo Usuário) */}
            {slide.ambientGlow && (
              <div
                style={{
                  background: `radial-gradient(circle at center, ${slide.ambientGlowColor || '#10b981'}40 0%, transparent 70%)`,
                }}
                className="absolute inset-0 pointer-events-none z-0 blur-3xl"
              />
            )}

            {/* Escurecimento / Overlay Opacity (Configurado pelo Usuário) */}
            {slide.overlayOpacity ? (
              <div
                style={{ opacity: slide.overlayOpacity / 100 }}
                className="absolute inset-0 bg-black pointer-events-none z-10"
              />
            ) : null}

            {/* Sutil textura e reflexo nobre */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5 pointer-events-none" />

            {/* ======================================================== */}
            {/* VERSÃO MOBILE COMPACTA E RESPONSIVA (< md)              */}
            {/* ======================================================== */}
            <div className="flex md:hidden w-full h-full relative z-10 items-center justify-between px-3 py-2">
              {/* Lado Esquerdo Mobile: Foto 1 com Enquadramento Limpo */}
              <div
                style={getImageCardContainerStyle('left', slide, true)}
                className="relative overflow-hidden shadow-md border border-white/20 shrink-0 select-none"
              >
                <img
                  src={slide.leftImage || '/images/look-3214.png'}
                  alt={slide.title || 'Aura Fitness'}
                  style={getImageInlineStyle('left', slide)}
                  className="h-full w-full object-top"
                />
              </div>

              {/* Lado Direito Mobile: Textos & Botão Sem Sobreposição */}
              <div className="relative z-20 w-[56%] h-full flex flex-col items-center justify-center text-center px-2 py-1.5 my-auto overflow-hidden">
                {slide.badge && (
                  <span
                    style={{
                      backgroundColor: slide.badgeBgColor || 'rgba(0,0,0,0.15)',
                      color: slide.badgeTextColor || '#eab308',
                    }}
                    className="text-[8px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full border border-white/15 mb-1 line-clamp-1"
                  >
                    ★ {slide.badge}
                  </span>
                )}

                {/* Se houver destaque de desconto/subtítulo forte, o title vira kicker */}
                {slide.discountHighlight ? (
                  <>
                    <span
                      style={{ color: slide.titleColor || undefined }}
                      className="text-[9px] font-extrabold tracking-widest uppercase opacity-85 line-clamp-1 mb-0.5"
                    >
                      {slide.title}
                    </span>
                    <h2
                      style={{
                        color: slide.titleColor || undefined,
                        fontFamily: slide.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                        fontSize: resolveMobileTitleFontSize(slide.titleFontSize),
                      }}
                      className="text-base sm:text-lg font-black uppercase leading-tight tracking-tight line-clamp-2 my-0.5"
                    >
                      {slide.discountHighlight}
                    </h2>
                  </>
                ) : (
                  <h2
                    style={{
                      color: slide.titleColor || undefined,
                      fontFamily: slide.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                      fontSize: resolveMobileTitleFontSize(slide.titleFontSize),
                    }}
                    className="text-base sm:text-lg font-black uppercase leading-tight tracking-tight line-clamp-2 my-0.5"
                  >
                    {slide.title}
                  </h2>
                )}

                {slide.couponCode && (
                  <button
                    type="button"
                    onClick={(e) => handleCopyCoupon(slide.couponCode!, e)}
                    className="inline-flex items-center gap-1 bg-black/70 text-white font-mono text-[9px] px-2 py-0.5 rounded-md border border-white/20 my-1 cursor-pointer active:scale-95"
                  >
                    <span className="text-neutral-400 font-sans text-[8px]">CUPOM:</span>
                    <span className="text-amber-300 font-bold">{slide.couponCode}</span>
                    {copiedCoupon === slide.couponCode ? (
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-2.5 h-2.5 text-neutral-400" />
                    )}
                  </button>
                )}

                {slide.subtitle && (
                  <p
                    style={{ color: slide.subtitleColor || undefined }}
                    className="text-[9px] opacity-85 line-clamp-2 leading-tight my-1 max-w-[180px]"
                  >
                    {slide.subtitle}
                  </p>
                )}

                <Link
                  to={slide.link || '/catalogo'}
                  style={getBannerButtonStyle(slide)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 ${getBannerButtonRadiusClass(slide.buttonRadius)} font-black text-[10px] tracking-wider uppercase transition-all shadow-md active:scale-95 mt-1`}
                >
                  <span>{slide.buttonText || 'COMPRAR'}</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>

                {/* Bolinhas de Navegação Mobile */}
                <div className="flex items-center gap-1.5 mt-2">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Ir para banner ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === currentSlide ? 'w-4 bg-primary' : 'w-1.5 bg-black/30 dark:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* VERSÃO DESKTOP HARMONIOSA & EDITORIAL (>= md)            */}
            {/* ======================================================== */}
            <div className="hidden md:flex max-w-7xl mx-auto w-full h-full items-center justify-between px-6 lg:px-12 relative z-10 gap-6">
              {/* Foto 1 (Esquerda) com Enquadramento Nobre */}
              <div
                style={getImageCardContainerStyle('left', slide, false)}
                className="overflow-hidden shadow-2xl relative border border-white/20 shrink-0 select-none"
              >
                <img
                  src={slide.leftImage || '/images/look-3214.png'}
                  alt={slide.title || 'Aura Fitness'}
                  style={getImageInlineStyle('left', slide)}
                  className="w-full h-full object-top transition-transform duration-700"
                />
              </div>

              {/* Coluna Central: Tipografia Nobre Sem Colisão */}
              <div className="flex-1 max-w-xl mx-auto flex flex-col items-center justify-center text-center px-4 py-4 z-20 my-auto">
                {slide.badge && (
                  <div className="mb-2">
                    <span
                      style={{
                        backgroundColor: slide.badgeBgColor || 'rgba(0,0,0,0.15)',
                        color: slide.badgeTextColor || '#eab308',
                      }}
                      className="text-xs font-extrabold tracking-[0.25em] uppercase px-4 py-1 rounded-full border border-white/20 backdrop-blur-xs inline-block shadow-xs"
                    >
                      ★ {slide.badge}
                    </span>
                  </div>
                )}

                {/* Se houver discountHighlight, o título vira um kicker superior elegante */}
                {slide.discountHighlight ? (
                  <div className="space-y-1 mb-2">
                    <span
                      style={{ color: slide.titleColor || undefined }}
                      className="text-xs sm:text-sm font-extrabold tracking-[0.25em] uppercase opacity-80 block"
                    >
                      {slide.title}
                    </span>
                    <h1
                      style={{
                        color: slide.titleColor || undefined,
                        fontFamily: slide.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                        fontSize: resolveTitleFontSize(slide.titleFontSize),
                      }}
                      className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight drop-shadow-sm"
                    >
                      {slide.discountHighlight}
                    </h1>
                  </div>
                ) : (
                  <h1
                    style={{
                      color: slide.titleColor || undefined,
                      fontFamily: slide.titleFontFamily === 'sans' ? 'sans-serif' : 'serif',
                      fontSize: resolveTitleFontSize(slide.titleFontSize),
                      textAlign: slide.textAlign || 'center',
                    }}
                    className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight drop-shadow-sm mb-2 max-w-lg"
                  >
                    {slide.title}
                  </h1>
                )}

                {/* Box de Cupom com Cópia Rápida */}
                {slide.couponCode && (
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoupon(slide.couponCode!, e)}
                      title="Clique para copiar o cupom"
                      className="group inline-flex items-center gap-2 bg-black/75 hover:bg-black text-white font-mono font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 border border-white/20 cursor-pointer"
                    >
                      <span className="text-neutral-400 font-sans text-xs uppercase tracking-wider font-semibold">CUPOM:</span>
                      <span className="tracking-widest text-amber-300 font-extrabold">{slide.couponCode}</span>
                      {copiedCoupon === slide.couponCode ? (
                        <span className="flex items-center gap-1 text-[11px] font-sans text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> Copiado!
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                )}

                {/* Subtítulo Descritivo com Espaçamento Limpo */}
                {slide.subtitle && (
                  <p
                    style={{
                      color: slide.subtitleColor || undefined,
                      textAlign: slide.textAlign || 'center',
                    }}
                    className="text-xs sm:text-sm font-medium opacity-85 max-w-md mb-4 leading-relaxed line-clamp-3"
                  >
                    {slide.subtitle}
                  </p>
                )}

                {/* Botão de Compra CTA */}
                {slide.buttonText && (
                  <Link
                    to={slide.link || '/catalogo'}
                    style={getBannerButtonStyle(slide)}
                    className={`inline-flex items-center gap-2 px-8 py-3.5 ${getBannerButtonRadiusClass(slide.buttonRadius)} font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95`}
                  >
                    <span>{slide.buttonText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}

                {/* Bolinhas de Navegação Desktop */}
                <div className="flex items-center gap-2 mt-5">
                  {heroSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Ir para banner ${idx + 1}`}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentSlide ? 'w-6 bg-primary shadow-md' : 'w-2 bg-black/30 dark:bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Foto 2 (Direita) com Enquadramento Nobre */}
              <div
                style={getImageCardContainerStyle('right', slide, false)}
                className="overflow-hidden shadow-2xl relative border border-white/20 shrink-0 select-none"
              >
                <img
                  src={slide.rightImage || slide.leftImage}
                  alt="Modelo 2"
                  style={getImageInlineStyle('right', slide)}
                  className="w-full h-full object-top transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Ticker Bar (Matching Image 2) */}
      <TrustBar />

      {/* Compre por Categorias Showcase (Design Ampliado Inspirado no Padrão Fashion) */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif sm:font-sans font-medium text-foreground tracking-tight">
            Compre por categorias
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4.5">
          {categories
            .filter((cat) => {
              const nonEmptyCount = categories.filter(
                (c) => products.filter((p) => isProductMatchingCategory(p, c.name)).length > 0
              ).length;
              if (nonEmptyCount === 0) return true;
              return products.filter((p) => isProductMatchingCategory(p, cat.name)).length > 0;
            })
            .slice(0, 5)
            .map((cat) => {
              const photo = getCategoryPhoto(cat.name, products);

              return (
                <Link
                  key={cat.name}
                  to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                  className="group relative h-[250px] sm:h-[300px] lg:h-[350px] xl:h-[380px] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-black/5 dark:border-white/10"
                >
                  {/* Foto de Destaque da Categoria em Alta Resolução */}
                  <img
                    src={photo}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover object-top filter brightness-[0.96] group-hover:scale-105 group-hover:brightness-100 transition-all duration-700 ease-out"
                  />

                  {/* Gradiente Suave de Fundo para Leitura Cristalina do Texto */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Nome da Categoria Centralizado na Base */}
                  <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-center z-10">
                    <h3 className="font-semibold text-sm sm:text-base lg:text-lg text-white tracking-wide drop-shadow-md group-hover:text-amber-200 transition-colors">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>

      {/* Vitrines de Seções em Exposição (ex: Moda Verão, Black Friday) */}
      {storeSections
        .filter((sec) => sec.active && sec.showInHome)
        .map((sec) => {
          const secProducts = (sec.productIds || [])
            .map((id) => products.find((p) => p.id === id))
            .filter((p): p is Product => Boolean(p));

          if (secProducts.length === 0) return null;

          return (
            <section
              key={sec.id}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6"
            >
              <div className="flex items-end justify-between border-b border-border pb-4">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#38672b] dark:text-amber-400 block">
                      {sec.badge || 'COLEÇÃO EXCLUSIVA'}
                    </span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground flex items-center gap-2">
                    <span>{sec.name}</span>
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  </h2>
                  {sec.description && (
                    <p className="text-xs text-muted-foreground">{sec.description}</p>
                  )}
                </div>

                <Link
                  to={`/catalogo?secao=${encodeURIComponent(sec.slug)}`}
                  className="text-xs font-semibold uppercase tracking-wider text-[#38672b] hover:text-[#23421b] dark:text-amber-400 flex items-center gap-1 transition-colors"
                >
                  <span>VER COLEÇÃO COMPLETA ({secProducts.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* 4-Column Products Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {secProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          );
        })}

      {/* As peças mais amadas 💚 (Matching Image 2) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-4">
        {/* Section Header */}
        <div className="flex items-end justify-between border-b border-border pb-4">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#38672b] dark:text-amber-400 block">
              MAIS VENDIDOS
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground flex items-center gap-2">
              <span>As peças mais amadas</span>
              <span className="text-emerald-500">💚</span>
            </h2>
          </div>

          <Link
            to="/catalogo?ordenar=mais_vendidos"
            className="text-xs font-semibold uppercase tracking-wider text-[#38672b] hover:text-[#23421b] dark:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>VER TODOS</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4-Column Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Outras novidades */}
      {products.length > 4 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pt-6">
          <div className="flex items-end justify-between border-b border-border pb-4">
            <div className="space-y-1 text-left">
              <span className="text-[11px] font-bold tracking-widest uppercase text-[#38672b] dark:text-amber-400 block">
                LANÇAMENTOS
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground">
                Coleção Completa
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(4, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
