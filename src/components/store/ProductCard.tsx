import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, ZoomIn, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, calculateDiscount } from '../../lib/utils';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useLightbox } from '../../contexts/LightboxContext';
import { getProductMediaSlides, isVideoMedia } from '../../lib/productClassifier';
import { ProductMediaView } from './ProductMediaView';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { openLightbox } = useLightbox();
  const isFav = isInWishlist(product.id);

  const images = getProductMediaSlides(product);
  const coverPoster = images.find((m) => !isVideoMedia(m));
  const videoSlideIndex = images.findIndex((m) => isVideoMedia(m));
  const hasVideo = videoSlideIndex !== -1;

  const safeIndex = currentImgIndex < images.length ? currentImgIndex : 0;
  const activeSlide = images[safeIndex];
  const isCurrentSlideVideo = isVideoMedia(activeSlide);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (images.length > 1 && currentImgIndex === 0) {
      setCurrentImgIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCurrentImgIndex(0);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImgIndex((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0]?.clientX ?? null;
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
    didSwipeRef.current = false;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || images.length <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? (touchStartYRef.current || 0);
    const deltaX = endX - touchStartXRef.current;
    const deltaY = endY - (touchStartYRef.current || 0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    // Se o gesto foi horizontal (swipe de carrossel no smartphone)
    if (Math.abs(deltaX) > 30 && Math.abs(deltaX) > Math.abs(deltaY)) {
      didSwipeRef.current = true;
      if (deltaX < 0) {
        setCurrentImgIndex((prev) => (prev + 1) % images.length);
      } else {
        setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const discountPercent = product.promotionalPrice
    ? calculateDiscount(product.price, product.promotionalPrice)
    : 0;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative flex flex-col bg-transparent overflow-hidden transition-all duration-300"
    >
      {/* Image / Video Container with Badges & Carrossel */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#dbe0dc] dark:bg-muted/40"
      >
        <Link
          to={`/produto/${product.id}`}
          onClick={(e) => {
            if (didSwipeRef.current) {
              e.preventDefault();
              didSwipeRef.current = false;
            }
          }}
          className="block w-full h-full relative"
        >
          <ProductMediaView
            src={activeSlide}
            alt={product.name}
            poster={coverPoster}
            autoPlay={isCurrentSlideVideo ? true : isHovered}
            muted={true}
            loop={true}
            className="w-full h-full object-cover object-top sm:group-hover:scale-105 transition-transform duration-500"
          />
        </Link>

        {/* Interactive Video Indicator Badge (Tap on mobile to play video immediately) */}
        {hasVideo && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (isCurrentSlideVideo && images.length > 1) {
                setCurrentImgIndex(0);
              } else if (videoSlideIndex !== -1) {
                setCurrentImgIndex(videoSlideIndex);
              }
            }}
            className="absolute top-3 right-12 z-20 bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1 transition-all active:scale-95"
            title={isCurrentSlideVideo ? 'Voltar para a foto' : 'Assistir vídeo do produto'}
          >
            <Play className="w-2.5 h-2.5 fill-white" />
            <span>{isCurrentSlideVideo ? 'REPRODUZINDO' : 'VER VÍDEO'}</span>
          </button>
        )}

        {/* Carousel Navigation Arrows (Visible on Smartphone & on Desktop Hover) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
              title="Mídia anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
              title="Próxima mídia"
            >
              <ChevronRight className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            </button>

            {/* Pagination Dots (Always visible on Smartphone so customer sees multiple poses/videos) */}
            <div className="absolute bottom-12 left-0 right-0 z-20 flex justify-center items-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              {images.map((slideItem, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImgIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === safeIndex
                      ? 'w-4 bg-white shadow-md'
                      : isVideoMedia(slideItem)
                      ? 'w-2 bg-amber-400/90 hover:bg-amber-300'
                      : 'w-1.5 bg-white/65 hover:bg-white'
                  }`}
                  title={isVideoMedia(slideItem) ? `Vídeo (${idx + 1})` : `Foto ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Zoom Expand Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(images, safeIndex, product.name);
          }}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-85 sm:opacity-0 sm:group-hover:opacity-100"
          title="Ver foto em tela cheia (Expandir)"
        >
          <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Top-Left Badge (offset if zoom button present) */}
        <div className="absolute top-12 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent > 0 ? (
            <span className="bg-gradient-to-r from-rose-600 to-pink-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md tracking-wider">
              -{discountPercent}% OFF
            </span>
          ) : product.isBestSeller ? (
            <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-extrabold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md">
              ★ BEST SELLER
            </span>
          ) : product.isNewArrival ? (
            <span className="bg-gradient-to-r from-[#174828] to-[#256338] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-md border border-white/20">
              NOVIDADE
            </span>
          ) : null}
        </div>

        {/* Top-Right Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
          title={isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
        >
          <Heart
            className={`w-4 h-4 ${
              isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700 dark:text-slate-200'
            }`}
          />
        </button>

        {/* Quick Add Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            addToCart(
              product,
              product.sizes[0] || 'M',
              product.colors[0] || { name: 'Verde Oliva', hex: '#2b5022' },
              1
            );
          }}
          className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3 sm:left-3 sm:right-3 z-20 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-[#164225] hover:text-white hover:bg-gradient-to-r hover:from-[#174828] hover:to-[#225734] font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-2 sm:group-hover:translate-y-0 transition-all duration-300 shadow-xl border border-rose-200/40 hover:border-transparent active:scale-95"
          title="Adicionar look à sacola"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Comprar Agora</span>
        </button>
      </div>

      {/* Card Info */}
      <div className="pt-3 pb-1 space-y-1 text-left">
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#38672b] dark:text-amber-400 block">
          {product.category}
        </span>

        <Link
          to={`/produto/${product.id}`}
          className="block group-hover:text-[#284e20] transition-colors"
        >
          <h3 className="font-serif text-sm font-normal text-foreground line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Price Display */}
        <div className="flex items-center gap-2">
          <span className="font-sans text-sm font-bold text-foreground">
            {formatCurrency(product.promotionalPrice || product.price)}
          </span>
          {product.promotionalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </span>
          )}
        </div>

        {/* Color Swatch Dots */}
        {product.colors && product.colors.length > 0 && (
          <div className="flex items-center gap-1 pt-1">
            {product.colors.map((col, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block"
                style={{ backgroundColor: col.hex }}
                title={col.name}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
