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
      className="group relative flex flex-col h-full bg-transparent overflow-hidden transition-all duration-300"
    >
      {/* Image / Video Container (100% Clean on Mobile - Lê Rose style) */}
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

        {/* Interactive Video Indicator Badge (Desktop hover only) */}
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
            className="hidden sm:flex absolute top-3 right-12 z-20 bg-black/75 hover:bg-black/90 backdrop-blur-sm text-white text-[9px] font-bold px-2.5 py-1 rounded-full shadow items-center gap-1 transition-all active:scale-95 opacity-0 group-hover:opacity-100"
            title={isCurrentSlideVideo ? 'Voltar para a foto' : 'Assistir vídeo do produto'}
          >
            <Play className="w-2.5 h-2.5 fill-white" />
            <span>{isCurrentSlideVideo ? 'REPRODUZINDO' : 'VER VÍDEO'}</span>
          </button>
        )}

        {/* Carousel Navigation Arrows (Desktop hover only - mobile uses natural swipe) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
              title="Mídia anterior"
            >
              <ChevronLeft className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
              title="Próxima mídia"
            >
              <ChevronRight className="w-4 h-4 text-slate-800 dark:text-slate-100" />
            </button>

            {/* Pagination Dots (Desktop hover only) */}
            <div className="hidden sm:flex absolute bottom-3 left-0 right-0 z-20 justify-center items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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

        {/* Zoom Expand Button (Desktop hover only) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openLightbox(images, safeIndex, product.name);
          }}
          className="hidden sm:flex absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          title="Ver foto em tela cheia (Expandir)"
        >
          <ZoomIn className="w-4 h-4 text-slate-700 dark:text-slate-200" />
        </button>

        {/* Top-Right Favorite Button (Desktop hover only - on mobile it lives cleanly below in card info) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleWishlist(product.id);
          }}
          className="hidden sm:flex absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all opacity-0 group-hover:opacity-100"
          title={isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
        >
          <Heart
            className={`w-4 h-4 ${
              isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700 dark:text-slate-200'
            }`}
          />
        </button>
      </div>

      {/* Card Info (Clean Lê Rose Style Layout) */}
      <div className="pt-2.5 pb-1 flex-1 flex flex-col justify-between text-left">
        <div>
          {/* Category & Mobile Wishlist Heart */}
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#164225] dark:text-emerald-400">
              {product.category}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className="sm:hidden p-1 -mr-1 text-muted-foreground hover:text-rose-500 transition-colors"
              title={isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFav ? 'fill-rose-500 text-rose-500' : 'text-neutral-400'
                }`}
              />
            </button>
          </div>

          {/* Product Name */}
          <Link
            to={`/produto/${product.id}`}
            className="block group-hover:text-[#164225] dark:group-hover:text-emerald-300 transition-colors"
          >
            <h3 className="font-serif text-[13px] sm:text-sm font-normal text-foreground line-clamp-1 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Price Line with Inline Discount (Lê Rose style: Price + % OFF) */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <span className="font-sans text-sm sm:text-base font-bold text-foreground">
              {formatCurrency(product.promotionalPrice || product.price)}
            </span>
            {discountPercent > 0 && (
              <span className="text-[10px] sm:text-[11px] font-extrabold text-[#d9534f] bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {/* Strikethrough Original Price */}
          {product.promotionalPrice && (
            <div className="text-[11px] sm:text-xs text-muted-foreground line-through">
              {formatCurrency(product.price)}
            </div>
          )}

          {/* Color Swatch Dots */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 pt-1.5">
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

        {/* Dedicated "Comprar" Button (Lê Rose style - clean, solid & below the photo) */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(
              product,
              product.sizes[0] || 'M',
              product.colors[0] || { name: 'Padrão', hex: '#2b5022' },
              1
            );
          }}
          className="w-full mt-2.5 py-2 sm:py-2.5 rounded-xl bg-[#164225] hover:bg-[#205833] text-white font-semibold text-xs tracking-wider transition-all shadow-xs active:scale-98 flex items-center justify-center gap-1.5"
          title="Comprar produto"
        >
          <span>Comprar</span>
        </button>
      </div>
    </div>
  );
};
