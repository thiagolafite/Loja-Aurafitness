import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Sparkles, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '../../components/store/ProductCard';
import { TrustBar } from '../../components/store/TrustBar';
import { HomeVideoStoriesSection } from '../../components/store/HomeVideoStoriesSection';
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

  const safeSlideIndex = currentSlide < heroSlides.length ? currentSlide : 0;
  const slide = heroSlides[safeSlideIndex];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Carousel Banner Full-Width Edge-to-Edge (Aura High-Fashion) */}
      <section className="relative w-full overflow-hidden select-none p-0 m-0">
        <div className="relative w-full flex items-center justify-center min-h-[500px] lg:h-[560px]">
          {/* Floating Left Arrow */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-3 sm:left-6 lg:left-8 z-30 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 backdrop-blur-sm"
            aria-label="Slide Anterior"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* Floating Right Arrow */}
          <button
            onClick={handleNextSlide}
            className="absolute right-3 sm:right-6 lg:right-8 z-30 p-3 sm:p-3.5 rounded-full bg-black/40 hover:bg-black/80 text-white transition-all shadow-xl hover:scale-110 active:scale-95 border border-white/20 backdrop-blur-sm"
            aria-label="Próximo Slide"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          {/* ESTILO 1: EDITORIAL LIGHT (Inspirado no Banner de Primeira Compra / R$30 OFF) */}
          {slide.bannerStyle === 'editorial-light' ? (
            <div
              style={{ backgroundColor: slide.centerBgColor || '#f5f5f3' }}
              className="w-full min-h-[500px] lg:h-[560px] relative overflow-hidden flex items-center text-neutral-900 transition-all duration-500"
            >
              {/* Gradiente sutil e nobre que preenche toda a tela */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#ecefe9] via-transparent to-[#ecefe9] pointer-events-none opacity-80" />

              <div className="max-w-7xl mx-auto w-full h-full flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 lg:px-12 relative z-10">
                {/* Mobile: Modelos em proporção exata 3:4 portrait sem cortes */}
                <div className="flex md:hidden items-center justify-center gap-2.5 w-full max-w-sm mx-auto pt-4 pb-2 px-3">
                  <div className={`relative ${slide.rightImage ? 'w-1/2' : 'w-48 sm:w-56'} aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-neutral-300/70 bg-neutral-100 shrink-0`}>
                    <img
                      src={slide.leftImage}
                      alt={slide.title}
                      className="w-full h-full object-cover object-top filter brightness-100 contrast-[1.02]"
                    />
                    <div className="absolute bottom-2 left-2 z-10">
                      <div className="w-9 h-9 rounded-full border border-neutral-700/30 flex flex-col items-center justify-center text-center p-0.5 backdrop-blur-xs select-none bg-white/40">
                        <span className="text-[6px] font-black tracking-widest text-neutral-800 uppercase">AURA</span>
                        <span className="text-[5px] tracking-tighter text-neutral-600 uppercase">FITNESS</span>
                      </div>
                    </div>
                  </div>

                  {slide.rightImage && (
                    <div className="relative w-1/2 aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-neutral-300/70 bg-neutral-100 shrink-0">
                      <img
                        src={slide.rightImage}
                        alt="Detalhes da peça"
                        className="w-full h-full object-cover object-top opacity-90 filter contrast-[1.03]"
                      />
                    </div>
                  )}
                </div>

                {/* Desktop: Foto da Modelo / Esquerda */}
                <div className="hidden md:flex relative w-4/12 h-full items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-100 contrast-[1.02] group-hover:scale-105 transition-transform duration-700"
                  />
                  {/* Selo Redondo Watermark no Canto Inferior Esquerdo */}
                  <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-neutral-700/30 flex flex-col items-center justify-center text-center p-1 backdrop-blur-xs select-none bg-white/20">
                      <span className="text-[7px] sm:text-[8px] font-extrabold tracking-widest text-neutral-800 uppercase">AURA</span>
                      <span className="text-[6px] tracking-tighter text-neutral-600 uppercase">MODA FITNESS</span>
                    </div>
                  </div>
                </div>

              {/* Centro: Chamada, Desconto, Box de Cupom e Botão */}
              <div className="relative z-20 w-full md:w-5/12 flex flex-col items-center text-center px-4 sm:px-6 py-4 sm:py-6 my-auto">
                {/* Título de Confiança */}
                <motion.h3
                  key={`kicker-${currentSlide}`}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs sm:text-sm lg:text-base font-extrabold tracking-[0.25em] text-neutral-700 uppercase mb-1 sm:mb-2"
                >
                  {slide.title}
                </motion.h3>

                {/* Destaque de Desconto */}
                {slide.discountHighlight ? (
                  <motion.div
                    key={`disc-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-2 sm:mb-3"
                  >
                    <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight leading-none">
                      {slide.discountHighlight.replace(/de desconto/i, '').trim()}
                    </div>
                    {slide.discountHighlight.toLowerCase().includes('desconto') && (
                      <div className="text-xs sm:text-sm font-bold tracking-[0.2em] text-neutral-600 uppercase mt-1">
                        DE DESCONTO
                      </div>
                    )}
                  </motion.div>
                ) : null}

                {/* Box de Cupom Interativo com Cópia de 1 Clique */}
                {slide.couponCode && (
                  <motion.div
                    key={`coupon-${currentSlide}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2.5"
                  >
                    <button
                      type="button"
                      onClick={(e) => handleCopyCoupon(slide.couponCode!, e)}
                      title="Clique para copiar o cupom"
                      className="group inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 border border-neutral-700 cursor-pointer"
                    >
                      <span className="text-neutral-400 font-sans text-[10px] sm:text-xs uppercase tracking-wider font-semibold">CUPOM:</span>
                      <span className="tracking-widest text-amber-300 font-extrabold">{slide.couponCode}</span>
                      {copiedCoupon === slide.couponCode ? (
                        <span className="flex items-center gap-1 text-[11px] font-sans text-emerald-300 font-bold bg-emerald-950/80 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3" /> Copiado!
                        </span>
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
                      )}
                    </button>
                  </motion.div>
                )}

                {/* Subtítulo / Regra */}
                <motion.p
                  key={`sub-${currentSlide}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] sm:text-xs text-neutral-600 font-medium max-w-sm mb-5 leading-relaxed"
                >
                  {slide.subtitle}
                </motion.p>

                {/* Botão de Compra CTA */}
                <motion.div
                  key={`cta-${currentSlide}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link
                    to={slide.link}
                    className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-white/95 hover:bg-white text-neutral-950 font-extrabold text-xs sm:text-sm tracking-widest uppercase transition-all shadow-md hover:shadow-xl hover:scale-105 active:scale-95 border border-neutral-300/80"
                  >
                    <span>{slide.buttonText || 'COMPRAR AGORA'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </motion.div>

                {/* Indicador de Bolinhas do Slide */}
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

              {/* Foto de Detalhe da Modelo / Direita */}
              <div className="hidden md:flex relative w-3/12 h-full items-end justify-center overflow-hidden shrink-0">
                <img
                  src={slide.rightImage || slide.leftImage}
                  alt="Detalhes da peça"
                  className="h-full w-full object-cover object-top opacity-85 filter contrast-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#ecefe9]/40" />

                {/* Disclaimer no Canto Inferior Direito */}
                {slide.disclaimer && (
                  <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 max-w-[240px] text-right pointer-events-none">
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
              className="w-full min-h-[500px] lg:h-[560px] relative overflow-hidden flex items-center justify-between text-white transition-all duration-500"
            >
              {/* Brilhos radiantes de fundo que preenchem 100% da tela */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-7xl mx-auto w-full h-full flex flex-col md:flex-row items-center justify-between px-4 sm:px-8 lg:px-12 relative z-10">
                {/* Mobile: Modelo em proporção exata 3:4 portrait sem cortes */}
                <div className="flex md:hidden items-center justify-center w-full px-4 pt-4 pb-2">
                  <div className="relative w-52 sm:w-60 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/20 bg-neutral-900">
                    <img
                      src={slide.leftImage}
                      alt={slide.title}
                      className="w-full h-full object-cover object-top filter brightness-95 contrast-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-2.5 z-10">
                      <div className="w-10 h-10 rounded-full border border-white/30 flex flex-col items-center justify-center text-center p-0.5 backdrop-blur-xs select-none bg-black/40">
                        <span className="text-[6px] font-black tracking-widest text-white uppercase">AURA</span>
                        <span className="text-[5px] tracking-tighter text-white/70 uppercase">FITNESS</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop: Foto da Modelo / Esquerda */}
                <div className="hidden md:flex relative md:w-5/12 h-full items-end justify-center overflow-hidden shrink-0">
                  <img
                    src={slide.leftImage}
                    alt={slide.title}
                    className="h-full w-full object-cover object-top filter brightness-95 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0b1610]" />

                  {/* Selo Redondo Watermark */}
                  <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 z-10">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-white/30 flex flex-col items-center justify-center text-center p-1 backdrop-blur-xs select-none bg-black/20">
                      <span className="text-[7px] sm:text-[8px] font-extrabold tracking-widest text-white uppercase">AURA</span>
                      <span className="text-[6px] tracking-tighter text-white/70 uppercase">MODA FITNESS</span>
                    </div>
                  </div>
                </div>

                {/* Conteúdo Central e Tipografia Marcante */}
                <div className="relative z-20 w-full md:w-7/12 flex flex-col items-center md:items-start text-center md:text-left px-4 sm:px-8 lg:px-12 py-6 my-auto">
                  <motion.div
                    key={`badge-dark-${currentSlide}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-2"
                  >
                    <span className="text-[10px] sm:text-xs font-extrabold tracking-[0.3em] uppercase text-amber-300 bg-white/10 px-3.5 py-1 rounded-full border border-white/15">
                      ★ {slide.badge || 'MAIS DESEJADOS'}
                    </span>
                  </motion.div>

                  <motion.h1
                    key={`title-dark-${currentSlide}`}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight text-white uppercase leading-[0.95] mb-2 drop-shadow-md"
                  >
                    {slide.title}
                  </motion.h1>

                  {slide.discountHighlight && (
                    <motion.p
                      key={`high-dark-${currentSlide}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm sm:text-base lg:text-lg font-serif italic text-rose-200/95 mb-3"
                    >
                      {slide.discountHighlight}
                    </motion.p>
                  )}

                  <motion.p
                    key={`sub-dark-${currentSlide}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs sm:text-sm text-neutral-300 font-light max-w-md mb-7 leading-relaxed"
                  >
                    {slide.subtitle}
                  </motion.p>

                  <motion.div
                    key={`btn-dark-${currentSlide}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Link
                      to={slide.link}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-neutral-100 text-neutral-950 font-extrabold text-xs tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95"
                    >
                      <span>{slide.buttonText || 'COMPRAR AGORA'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>

                  {/* Indicador de Bolinhas do Slide */}
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
              className="w-full min-h-[500px] lg:h-[560px] relative overflow-hidden flex items-center justify-center text-white py-6 px-4 sm:px-8"
            >
              <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-center gap-3 sm:gap-5 h-full">
                {/* Mobile: Modelos em proporção 3:4 portrait lado a lado */}
                <div className="flex md:hidden items-center justify-center gap-2.5 w-full max-w-xs mx-auto pt-2 pb-2">
                  <div className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/20 relative bg-neutral-900 shrink-0">
                    <img src={slide.leftImage} alt="Model Aura 1" className="w-full h-full object-cover object-top filter brightness-95" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 inset-x-1 text-center text-[8px] uppercase font-bold tracking-wider text-amber-200 bg-black/60 px-1 py-0.5 rounded-full">
                      Alta Compressão
                    </span>
                  </div>
                  <div className="w-1/2 aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-white/20 relative bg-neutral-900 shrink-0">
                    <img src={slide.rightImage} alt="Model Aura 2" className="w-full h-full object-cover object-top filter brightness-95" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <span className="absolute bottom-1.5 inset-x-1 text-center text-[8px] uppercase font-bold tracking-wider text-amber-200 bg-black/60 px-1 py-0.5 rounded-full">
                      Zero Transparência
                    </span>
                  </div>
                </div>

                {/* Foto Modelo Esquerda */}
                <div className="hidden md:block w-1/4 h-[450px] lg:h-[510px] rounded-3xl overflow-hidden shadow-2xl relative group border border-white/15 shrink-0">
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

                {/* Card Central */}
                <div
                  style={{ backgroundColor: slide.centerBgColor || '#123922' }}
                  className="w-full md:w-2/4 min-h-[360px] md:h-[450px] lg:h-[510px] rounded-3xl p-6 sm:p-8 lg:p-12 flex flex-col items-center justify-center text-center text-white relative shadow-2xl overflow-hidden border border-emerald-400/30"
                >
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

                <motion.span
                  key={`badge-${currentSlide}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[11px] font-extrabold tracking-[0.3em] uppercase text-amber-300 mb-3 bg-white/10 px-4 py-1 rounded-full border border-amber-300/30 backdrop-blur-sm"
                >
                  ✨ {slide.badge}
                </motion.span>

                <motion.h1
                  key={`title-${currentSlide}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-wide font-normal text-[#fff9f3] uppercase mb-4 drop-shadow-md"
                >
                  {slide.title}
                </motion.h1>

                <motion.p
                  key={`subtitle-${currentSlide}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs sm:text-sm text-rose-100/90 font-light max-w-sm mb-8 leading-relaxed"
                >
                  {slide.subtitle}
                </motion.p>

                <motion.div
                  key={`btn-${currentSlide}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Link
                    to={slide.link}
                    className="inline-block px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs tracking-widest uppercase transition-all shadow-xl hover:scale-105 active:scale-95 hover:shadow-amber-400/30"
                  >
                    {slide.buttonText} &rarr;
                  </Link>
                </motion.div>

                {/* Bolinhas */}
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

              {/* Foto Modelo Direita */}
              <div className="hidden md:block w-1/4 h-[450px] lg:h-[510px] rounded-3xl overflow-hidden shadow-2xl relative group border border-white/15 shrink-0">
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

      {/* Provador Virtual - Looks em Vídeo */}
      <HomeVideoStoriesSection />

      {/* Navegue por Categoria Showcase com Ordem Personalizada */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-end justify-between border-b border-border pb-4 mb-6">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-extrabold tracking-widest uppercase text-emerald-800 dark:text-amber-400 block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>COLEÇÕES OFICIAIS AURA</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground flex items-center gap-2">
              <span>Navegue por Categoria</span>
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" />
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="text-xs font-bold uppercase tracking-wider text-[#164024] hover:text-[#0b2414] dark:text-amber-400 flex items-center gap-1.5 transition-colors group"
          >
            <span className="group-hover:underline">VER CATÁLOGO COMPLETO</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {categories
            .filter((cat) => {
              const nonEmptyCount = categories.filter(
                (c) => products.filter((p) => isProductMatchingCategory(p, c.name)).length > 0
              ).length;
              if (nonEmptyCount === 0) return true;
              return products.filter((p) => isProductMatchingCategory(p, cat.name)).length > 0;
            })
            .slice(0, 5)
            .map((cat, idx) => {
              const count = products.filter(
                (p) => isProductMatchingCategory(p, cat.name)
              ).length;
              const photo = getCategoryPhoto(cat.name, products);

            return (
              <Link
                key={cat.name}
                to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                className="group relative h-[310px] sm:h-[360px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 flex flex-col justify-between p-4 sm:p-5 border border-emerald-900/10 hover:border-emerald-600/60"
              >
                {/* Imagem Real de Produto de Acordo com a Categoria */}
                <img
                  src={photo}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700 ease-out filter brightness-[0.93]"
                />

                {/* Gradiente Elegante para Máxima Leitura */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:from-black/95 group-hover:via-black/40 transition-colors duration-500" />

                {/* Badge Superior: Quantidade de Peças */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
                    {count > 0 ? `${count} ${count === 1 ? 'modelo' : 'modelos'}` : 'Explorar'}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-white/20 hover:bg-white text-white hover:text-slate-900 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                {/* Informações da Categoria no Rodapé do Card */}
                <div className="relative z-10 space-y-1 text-left">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-amber-300 block">
                    {idx + 1}ª Coleção Aura
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-wide group-hover:text-rose-200 transition-colors drop-shadow-md">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-100 group-hover:text-white pt-0.5">
                    <span>Ver Coleção</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition-transform" />
                  </div>
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
