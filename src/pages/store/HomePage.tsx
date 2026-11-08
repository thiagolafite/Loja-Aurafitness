import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
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

    const syncCats = () => setCategories(getStoredCategories());
    const syncBanners = () => setHeroBanners(getHeroBanners());
    const syncSections = () => setStoreSections(getStoreSections());

    window.addEventListener('aura_categories_updated', syncCats);
    window.addEventListener('aura_banners_updated', syncBanners);
    window.addEventListener('aura_sections_updated', syncSections);
    window.addEventListener('storage', syncCats);
    window.addEventListener('storage', syncBanners);
    window.addEventListener('storage', syncSections);

    return () => {
      window.removeEventListener('aura_categories_updated', syncCats);
      window.removeEventListener('aura_banners_updated', syncBanners);
      window.removeEventListener('aura_sections_updated', syncSections);
      window.removeEventListener('storage', syncCats);
      window.removeEventListener('storage', syncBanners);
      window.removeEventListener('storage', syncSections);
    };
  }, []);

  const activeBanners = heroBanners.filter((b) => b.active);
  const heroSlides = activeBanners.length > 0 ? activeBanners : getHeroBanners();

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
      {/* 3-Column Hero Carousel Banner (Matching Image 1) */}
      <section className="relative w-full bg-[#183521] overflow-hidden select-none py-4 px-2 sm:px-6">
        <div className="max-w-7xl mx-auto relative flex items-center justify-center gap-3 sm:gap-4 min-h-[480px] lg:h-[540px]">
          {/* Floating Left Arrow */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-2 lg:left-4 z-30 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors shadow-lg"
            aria-label="Slide Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Floating Right Arrow */}
          <button
            onClick={handleNextSlide}
            className="absolute right-2 lg:right-4 z-30 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors shadow-lg"
            aria-label="Próximo Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Left Card: Model Image */}
          <div className="hidden md:block w-1/4 h-[440px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl relative group">
            <img
              src={slide.leftImage}
              alt="Model Aura 1"
              className="w-full h-full object-cover object-top filter brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>

          {/* Center Card: Dark Forest Green Box with Arcs */}
          <div
            style={{ backgroundColor: slide.centerBgColor || '#163923' }}
            className="w-full md:w-2/4 h-[440px] lg:h-[500px] rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center text-center text-white relative shadow-2xl overflow-hidden border border-[#275336]"
          >
            {/* Decorative Arcs */}
            <svg
              className="absolute top-4 right-4 w-20 h-12 text-emerald-400/20"
              viewBox="0 0 100 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M 10 50 Q 50 10 90 50" />
              <path d="M 20 50 Q 50 20 80 50" />
            </svg>

            <svg
              className="absolute bottom-4 left-4 w-20 h-12 text-emerald-400/20 rotate-180"
              viewBox="0 0 100 60"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M 10 50 Q 50 10 90 50" />
              <path d="M 20 50 Q 50 20 80 50" />
            </svg>

            {/* Content */}
            <motion.span
              key={`badge-${currentSlide}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#a8c69d] mb-3"
            >
              {slide.badge}
            </motion.span>

            <motion.h1
              key={`title-${currentSlide}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-wider font-light text-[#ecefe9] uppercase mb-4"
            >
              {slide.title}
            </motion.h1>

            <motion.p
              key={`subtitle-${currentSlide}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs sm:text-sm text-[#b2c8a9] font-light max-w-sm mb-8"
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
                className="inline-block px-7 py-3 rounded-full border border-[#3e6f4e] bg-[#1a442a]/80 text-[#d8e6d2] hover:bg-[#346241] hover:text-white font-medium text-xs tracking-widest uppercase transition-all shadow-lg"
              >
                {slide.buttonText}
              </Link>
            </motion.div>

            {/* Slide Dots Indicator */}
            <div className="absolute bottom-6 flex items-center gap-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    idx === currentSlide ? 'w-5 bg-emerald-300' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Card: Model Image */}
          <div className="hidden md:block w-1/4 h-[440px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl relative group">
            <img
              src={slide.rightImage}
              alt="Model Aura 2"
              className="w-full h-full object-cover object-top filter brightness-90 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        </div>
      </section>

      {/* Trust Ticker Bar (Matching Image 2) */}
      <TrustBar />

      {/* Navegue por Categoria Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex items-end justify-between border-b border-border pb-4 mb-6">
          <div className="space-y-1 text-left">
            <span className="text-[11px] font-bold tracking-widest uppercase text-[#38672b] dark:text-amber-400 block">
              COLEÇÕES AURA
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-normal text-foreground flex items-center gap-2">
              <span>Navegue por Categoria</span>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </h2>
          </div>
          <Link
            to="/catalogo"
            className="text-xs font-semibold uppercase tracking-wider text-[#38672b] hover:text-[#23421b] dark:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>VER CATÁLOGO COMPLETO</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-5">
          {categories.slice(0, 5).map((cat) => {
            const count = products.filter(
              (p) => normalizeCategoryName(p.category) === cat.name
            ).length;
            const photo = getCategoryPhoto(cat.name, products);

            return (
              <Link
                key={cat.name}
                to={`/catalogo?categoria=${encodeURIComponent(cat.name)}`}
                className="group relative h-[300px] sm:h-[350px] rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col justify-between p-4 sm:p-5 border border-border/40 hover:border-emerald-600/70"
              >
                {/* Imagem Real de Produto de Acordo com a Categoria */}
                <img
                  src={photo}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700 ease-out filter brightness-[0.92]"
                />

                {/* Gradiente Elegante para Máxima Leitura */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:from-black/95 group-hover:via-black/45 transition-colors duration-500" />

                {/* Badge Superior: Quantidade de Peças */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="bg-black/50 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-sm">
                    {count > 0 ? `${count} ${count === 1 ? 'modelo' : 'modelos'}` : 'Explorar'}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </span>
                </div>

                {/* Informações da Categoria no Rodapé do Card */}
                <div className="relative z-10 space-y-1 text-left">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-300/90 block">
                    Coleções Aura
                  </span>
                  <h3 className="font-serif font-bold text-lg sm:text-xl text-white tracking-wide group-hover:text-emerald-200 transition-colors drop-shadow-md">
                    {cat.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white/90 group-hover:text-white pt-0.5">
                    <span>Ver Coleção</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform" />
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
            {products.slice(4, 8).concat(products.slice(0, 2)).slice(0, 4).map((product, idx) => (
              <ProductCard key={`${product.id}-${idx}`} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
