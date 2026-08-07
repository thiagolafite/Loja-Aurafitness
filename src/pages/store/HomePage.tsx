import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProductCard } from '../../components/store/ProductCard';
import { TrustBar } from '../../components/store/TrustBar';
import { getProducts } from '../../lib/base44Client';
import { Product } from '../../types';

export const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setProducts(getProducts());
  }, []);

  const heroSlides = [
    {
      badge: 'NOVA COLEÇÃO',
      title: 'FORÇA & ESTILO',
      subtitle: 'Conjuntos que abraçam seu movimento',
      buttonText: 'VER CONJUNTOS',
      link: '/catalogo?categoria=CONJUNTOS',
      leftImage: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/0fa666d77_CpiadeDSC_3214.png',
      rightImage: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/f28126454_MacacoBless.png',
    },
    {
      badge: 'AURA NAVY',
      title: 'PERFORMANCE & ELEGÂNCIA',
      subtitle: 'Sofisticação e zero transparência para cada treino',
      buttonText: 'VER LEGGINGS',
      link: '/catalogo?categoria=LEGGINGS',
      leftImage: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/5144dcde1_CpiadeDSC_3656.png',
      rightImage: 'https://media.base44.com/images/public/69f3626de7a99e14099d1411/64c91e414_Conjuntostyle.png',
    },
  ];

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const slide = heroSlides[currentSlide];

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
          <div className="w-full md:w-2/4 h-[440px] lg:h-[500px] bg-[#163923] rounded-2xl p-8 lg:p-12 flex flex-col items-center justify-center text-center text-white relative shadow-2xl overflow-hidden border border-[#275336]">
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
