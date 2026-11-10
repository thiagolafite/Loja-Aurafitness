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
} from '../../lib/dataClient';
import { Product, HeroBannerSlide, StoreSection } from '../../types';
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
  const heroSlides = activeBanners.length > 0 ? activeBanners : getHeroBanners();

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
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
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

  const safeSlideIndex = currentSlide < heroSlides.length ? currentSlide : 0;
  const slide = heroSlides[safeSlideIndex];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Carousel Banner Full-Width Edge-to-Edge (Aura High-Fashion) */}
      <section
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full overflow-hidden select-none p-0 m-0"
      >
        <div className="relative w-full flex items-center justify-center h-[340px] sm:h-[390px] md:h-[500px] lg:h-[540px]">
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

          {/* ESTILO 1: EDITORIAL LIGHT (Inspirado no Banner de Primeira Compra / R$30 OFF) */}
          {slide.bannerStyle === 'editorial-light' ? (
            <div
              style={{ backgroundColor: slide.centerBgColor || '#f5f5f3' }}
              className="w-full h-full relative overflow-hidden flex items-center text-neutral-900 transition-all duration-500"
            >
              {/* Gradiente sutil e nobre que preenche toda a tela */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ecefe9] via-transparent to-[#ecefe9] pointer-events-none opacity-80" />

              {/* VERSÃO MOBILE COMPACTA E RESPONSIVA (< md) */}
              <div className="flex md:hidden w-full h-full relative z-10 items-center justify-between">
                {/* Lado Esquerdo: Modelo em Corpo Inteiro (Sem Cortes, Proporção Perfeita) */}
                <div className="relative w-[45%] h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-100 contrast-[1.02]"
                  />
                  {/* Gradiente suave na borda direita para fundir harmoniosamente com a área de texto */}
                  <div
                    style={{ background: `linear-gradient(to left, ${slide.centerBgColor || '#f5f5f3'}, transparent)` }}
                    className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                  />

                  {/* Selo Redondo Watermark Aura Mini */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <div className="w-8 h-8 rounded-full border border-neutral-700/30 flex flex-col items-center justify-center text-center p-0.5 backdrop-blur-xs select-none bg-white/40 shadow-xs">
                      <span className="text-[5px] font-black tracking-widest text-neutral-800 uppercase">AURA</span>
                      <span className="text-[4px] tracking-tighter text-neutral-600 uppercase">FITNESS</span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Tipografia Compacta, Legível e Botão de Ação */}
                <div className="relative z-20 w-[55%] h-full flex flex-col items-center justify-center text-center px-2 py-3 overflow-hidden my-auto">
                  {/* Kicker / Título Superior */}
                  <span className="text-[9px] sm:text-[10px] font-extrabold tracking-widest text-neutral-600 uppercase mb-0.5 line-clamp-1 max-w-full">
                    {slide.title}
                  </span>

                  {/* Destaque Principal (Desconto ou Nome da Linha) com quebra responsiva de linha */}
                  {slide.discountHighlight && (
                    <div className="my-0.5 max-w-full">
                      <div className="text-base sm:text-xl font-black text-neutral-900 tracking-tight leading-tight uppercase break-words line-clamp-2">
                        {slide.discountHighlight.replace(/de desconto/i, '').trim()}
                      </div>
                      {slide.discountHighlight.toLowerCase().includes('desconto') && (
                        <div className="text-[9px] font-bold tracking-widest text-neutral-600 uppercase">
                          DE DESCONTO
                        </div>
                      )}
                    </div>
                  )}

                  {/* Box de Cupom Compacto */}
                  {slide.couponCode && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoupon(slide.couponCode!, e)}
                      title="Copiar cupom"
                      className="inline-flex items-center gap-1 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-[9px] px-2 py-0.5 rounded-lg shadow-sm my-1 border border-neutral-700 cursor-pointer active:scale-95"
                    >
                      <span className="text-neutral-400 font-sans text-[8px] uppercase">CUPOM:</span>
                      <span className="text-amber-300 font-extrabold">{slide.couponCode}</span>
                      {copiedCoupon === slide.couponCode ? (
                        <Check className="w-2.5 h-2.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-2.5 h-2.5 text-neutral-400" />
                      )}
                    </button>
                  )}

                  {/* Subtítulo Compacto (máx 2 linhas) */}
                  <p className="text-[9px] sm:text-[10px] text-neutral-600 font-medium line-clamp-2 leading-tight my-1 max-w-[190px]">
                    {slide.subtitle}
                  </p>

                  {/* Botão de Compra CTA */}
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-black text-[10px] tracking-wider uppercase transition-all shadow-md active:scale-95 border border-neutral-300 mt-1"
                  >
                    <span>{slide.buttonText || 'COMPRAR'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  {/* Bolinhas de Navegação */}
                  <div className="flex items-center gap-1.5 mt-2.5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para banner ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlide ? 'w-4 bg-neutral-900' : 'w-1.5 bg-neutral-400/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* VERSÃO DESKTOP (>= md) */}
              <div className="hidden md:flex max-w-7xl mx-auto w-full h-full items-center justify-between px-8 lg:px-12 relative z-10">
                {/* Foto da Modelo / Esquerda */}
                <div className="relative w-4/12 h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-100 contrast-[1.02] group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-6 left-6 z-10">
                    <div className="w-16 h-16 rounded-full border-2 border-neutral-700/30 flex flex-col items-center justify-center text-center p-1 backdrop-blur-xs select-none bg-white/20">
                      <span className="text-[8px] font-extrabold tracking-widest text-neutral-800 uppercase">AURA</span>
                      <span className="text-[6px] tracking-tighter text-neutral-600 uppercase">MODA FITNESS</span>
                    </div>
                  </div>
                </div>

                {/* Centro: Chamada, Desconto, Box de Cupom e Botão */}
                <div className="relative z-20 w-5/12 flex flex-col items-center text-center px-6 py-6 my-auto">
                  <h3 className="text-xs sm:text-sm lg:text-base font-extrabold tracking-[0.25em] text-neutral-700 uppercase mb-2">
                    {slide.title}
                  </h3>
                  {slide.discountHighlight && (
                    <div className="mb-3">
                      <div className="text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-none">
                        {slide.discountHighlight.replace(/de desconto/i, '').trim()}
                      </div>
                      {slide.discountHighlight.toLowerCase().includes('desconto') && (
                        <div className="text-sm font-bold tracking-[0.2em] text-neutral-600 uppercase mt-1">
                          DE DESCONTO
                        </div>
                      )}
                    </div>
                  )}
                  {slide.couponCode && (
                    <div className="mb-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyCoupon(slide.couponCode!, e)}
                        title="Clique para copiar o cupom"
                        className="group inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 border border-neutral-700 cursor-pointer"
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
                  <p className="text-xs text-neutral-600 font-medium max-w-sm mb-5 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/95 hover:bg-white text-neutral-950 font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 border border-neutral-300/80"
                  >
                    <span>{slide.buttonText || 'COMPRAR AGORA'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-2 mt-5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para banner ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide ? 'w-6 bg-neutral-900 shadow-sm' : 'w-2 bg-neutral-400/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Foto Detalhe Modelo / Direita */}
                <div className="relative w-3/12 h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.rightImage || slide.leftImage}
                    alt="Detalhes da peça"
                    className="h-full w-full object-cover object-top opacity-85 filter contrast-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#ecefe9]/40" />
                  {slide.disclaimer && (
                    <div className="absolute bottom-4 right-6 max-w-[240px] text-right pointer-events-none">
                      <p className="text-[9px] text-neutral-500 leading-tight">
                        {slide.disclaimer}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : slide.bannerStyle === 'bold-dark' ? (
            /* ESTILO 2: BOLD DARK (Inspirado no Banner Best Sellers) */
            <div
              style={{ backgroundColor: slide.centerBgColor || '#0b1610' }}
              className="w-full h-full relative overflow-hidden flex items-center justify-between text-white transition-all duration-500"
            >
              {/* Brilhos radiantes de fundo */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* VERSÃO MOBILE COMPACTA E RESPONSIVA (< md) */}
              <div className="flex md:hidden w-full h-full relative z-10 items-center justify-between">
                {/* Lado Esquerdo: Modelo em Corpo Inteiro (Sem Cortes) */}
                <div className="relative w-[45%] h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-95 contrast-105"
                  />
                  {/* Gradiente suave na borda direita para fundir harmoniosamente */}
                  <div
                    style={{ background: `linear-gradient(to left, ${slide.centerBgColor || '#0b1610'}, transparent)` }}
                    className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                  />
                  {/* Selo Redondo Watermark */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <div className="w-8 h-8 rounded-full border border-white/30 flex flex-col items-center justify-center text-center p-0.5 backdrop-blur-xs select-none bg-black/40">
                      <span className="text-[5px] font-black tracking-widest text-white uppercase">AURA</span>
                      <span className="text-[4px] tracking-tighter text-white/70 uppercase">FITNESS</span>
                    </div>
                  </div>
                </div>

                {/* Lado Direito: Tipografia Best Sellers Compacta */}
                <div className="relative z-20 w-[55%] h-full flex flex-col items-start justify-center text-left pl-2 pr-3 py-3 overflow-hidden my-auto">
                  <span className="text-[8px] sm:text-[9px] font-extrabold tracking-widest uppercase text-amber-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/15 mb-1">
                    ★ {slide.badge || 'MAIS DESEJADOS'}
                  </span>

                  <h1 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-white uppercase leading-none mb-1 break-words line-clamp-2 drop-shadow-md">
                    {slide.title}
                  </h1>

                  {slide.discountHighlight && (
                    <p className="text-[10px] sm:text-xs font-serif italic text-rose-200/90 mb-1 line-clamp-1">
                      {slide.discountHighlight}
                    </p>
                  )}

                  <p className="text-[9px] sm:text-[10px] text-neutral-300 font-light line-clamp-2 leading-tight mb-2">
                    {slide.subtitle}
                  </p>

                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-black text-[10px] tracking-wider uppercase transition-all shadow-md active:scale-95"
                  >
                    <span>{slide.buttonText || 'COMPRAR'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para banner ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlide ? 'w-4 bg-white shadow-sm' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* VERSÃO DESKTOP (>= md) */}
              <div className="hidden md:flex max-w-7xl mx-auto w-full h-full items-center justify-between px-8 lg:px-12 relative z-10">
                <div className="relative w-5/12 h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-95 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b1610]" />
                  <div className="absolute bottom-6 left-6 z-10">
                    <div className="w-16 h-16 rounded-full border border-white/30 flex flex-col items-center justify-center text-center p-1 backdrop-blur-xs select-none bg-black/20">
                      <span className="text-[8px] font-extrabold tracking-widest text-white uppercase">AURA</span>
                      <span className="text-[6px] tracking-tighter text-white/70 uppercase">MODA FITNESS</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-20 w-7/12 flex flex-col items-start text-left px-8 lg:px-12 py-6 my-auto">
                  <div className="mb-2">
                    <span className="text-xs font-extrabold tracking-[0.3em] uppercase text-amber-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/15">
                      ★ {slide.badge || 'MAIS DESEJADOS'}
                    </span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-serif font-black tracking-tight text-white uppercase leading-[0.95] mb-2 drop-shadow-md">
                    {slide.title}
                  </h1>
                  {slide.discountHighlight && (
                    <p className="text-base lg:text-lg font-serif italic text-rose-200/95 mb-3">
                      {slide.discountHighlight}
                    </p>
                  )}
                  <p className="text-xs sm:text-sm text-neutral-300 font-light max-w-md mb-7 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    <span>{slide.buttonText || 'COMPRAR AGORA'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="flex items-center gap-2 mt-7">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para banner ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide ? 'w-6 bg-white shadow-md' : 'w-2 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ESTILO 3: CARROSSEL CLÁSSICO 3 COLUNAS (Verde Floresta Nobre) */
            <div
              style={{ backgroundColor: slide.centerBgColor || '#123922' }}
              className="w-full h-full relative overflow-hidden flex items-center justify-center text-white py-2 sm:py-4 md:py-6 px-3 sm:px-6"
            >
              {/* VERSÃO MOBILE COMPACTA E RESPONSIVA (< md) */}
              <div className="flex md:hidden w-full h-full relative z-10 items-center justify-between rounded-2xl overflow-hidden border border-emerald-400/20 bg-gradient-to-r from-[#0d2818] via-[#123922] to-[#0d2818] shadow-lg">
                <div className="relative w-[45%] h-full flex items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-95"
                  />
                  <div
                    style={{ background: `linear-gradient(to left, ${slide.centerBgColor || '#123922'}, transparent)` }}
                    className="absolute inset-y-0 right-0 w-8 pointer-events-none"
                  />
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="text-[7px] uppercase font-bold tracking-wider text-amber-200 bg-black/60 px-1.5 py-0.5 rounded-full border border-white/10 backdrop-blur-xs">
                      Alta Compressão
                    </span>
                  </div>
                </div>

                <div className="relative z-20 w-[55%] h-full flex flex-col items-center justify-center text-center px-2 py-3 overflow-hidden my-auto">
                  <span className="text-[8px] font-extrabold tracking-widest uppercase text-amber-300 mb-1 bg-white/10 px-2 py-0.5 rounded-full border border-amber-300/30">
                    ✨ {slide.badge}
                  </span>

                  <h1 className="text-lg sm:text-xl font-serif tracking-wide text-[#fff9f3] uppercase leading-tight line-clamp-2 mb-1 drop-shadow-md">
                    {slide.title}
                  </h1>

                  <p className="text-[9px] sm:text-[10px] text-rose-100/90 font-light line-clamp-2 leading-tight my-1 max-w-[190px]">
                    {slide.subtitle}
                  </p>

                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-slate-950 font-black text-[10px] uppercase shadow-md active:scale-95 mt-1"
                  >
                    <span>{slide.buttonText || 'VER PEÇAS'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>

                  <div className="flex items-center gap-1.5 mt-2.5">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para slide ${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentSlide ? 'w-4 bg-amber-300 shadow-sm' : 'w-1.5 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* VERSÃO DESKTOP (>= md) */}
              <div className="hidden md:flex max-w-7xl mx-auto w-full items-center justify-center gap-5 h-full">
                <div className="w-1/4 h-[450px] lg:h-[510px] rounded-3xl overflow-hidden shadow-2xl relative group border border-white/15 shrink-0">
                  <img
                    src={slide.leftImage}
                    alt="Model Aura 1"
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/15">
                      Alta Compressão
                    </span>
                  </div>
                </div>

                <div
                  style={{ backgroundColor: slide.centerBgColor || '#123922' }}
                  className="w-2/4 h-[450px] lg:h-[510px] rounded-3xl p-8 lg:p-12 flex flex-col items-center justify-center text-center text-white relative shadow-2xl overflow-hidden border border-emerald-400/30"
                >
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />
                  <span className="text-[11px] font-extrabold tracking-[0.3em] uppercase text-amber-300 mb-3 bg-white/10 px-4 py-1 rounded-full border border-amber-300/30 backdrop-blur-sm">
                    ✨ {slide.badge}
                  </span>
                  <h1 className="text-4xl lg:text-5xl font-serif tracking-wide font-normal text-[#fff9f3] uppercase mb-4 drop-shadow-md">
                    {slide.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-rose-100/90 font-light max-w-sm mb-8 leading-relaxed">
                    {slide.subtitle}
                  </p>
                  <Link
                    to={slide.link}
                    className="inline-block px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 hover:shadow-amber-400/30"
                  >
                    {slide.buttonText} &rarr;
                  </Link>
                  <div className="absolute bottom-6 flex items-center gap-2">
                    {heroSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        aria-label={`Ir para slide ${idx + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          idx === currentSlide ? 'w-6 bg-amber-300 shadow-md' : 'w-2 bg-white/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="w-1/4 h-[450px] lg:h-[510px] rounded-3xl overflow-hidden shadow-2xl relative group border border-white/15 shrink-0">
                  <img
                    src={slide.rightImage}
                    alt="Model Aura 2"
                    className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-200 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm border border-white/15">
                      Zero Transparência
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
