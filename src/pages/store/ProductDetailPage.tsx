import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  ShoppingBag,
  Star,
  Ruler,
  Share2,
  CheckCircle,
  Truck,
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getProductById, getProducts } from '../../lib/dataClient';
import { formatCurrency, calculateDiscount } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { SizeGuideModal } from '../../components/store/SizeGuideModal';
import { ReviewSection } from '../../components/store/ReviewSection';
import { ProductCard } from '../../components/store/ProductCard';
import { ProductMediaView } from '../../components/store/ProductMediaView';
import { useLightbox } from '../../contexts/LightboxContext';
import { getProductMediaSlides, isVideoMedia } from '../../lib/productClassifier';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = getProductById(id || '');

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { openLightbox } = useLightbox();

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-foreground">Produto não encontrado</h2>
        <p className="text-sm text-muted-foreground">O produto que você está procurando não existe ou foi descontinuado.</p>
        <Link to="/catalogo" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
          Voltar ao Catálogo
        </Link>
      </div>
    );
  }

  const mediaSlides = getProductMediaSlides(product);
  const coverPoster = mediaSlides.find((m) => !isVideoMedia(m));

  const [activeImage, setActiveImage] = useState(mediaSlides[0] || '');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || { name: 'Verde Oliva', hex: '#5F6F3A' });
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'M');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const didSwipeRef = useRef<boolean>(false);

  const activeSlideIndex = Math.max(0, mediaSlides.indexOf(activeImage));

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mediaSlides.length <= 1) return;
    const prevIdx = (activeSlideIndex - 1 + mediaSlides.length) % mediaSlides.length;
    setActiveImage(mediaSlides[prevIdx]);
  };

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (mediaSlides.length <= 1) return;
    const nextIdx = (activeSlideIndex + 1) % mediaSlides.length;
    setActiveImage(mediaSlides[nextIdx]);
  };

  React.useEffect(() => {
    setActiveImage(mediaSlides[0] || '');
  }, [product.id]);

  const isLiked = isInWishlist(product.id);
  const discountPercent = calculateDiscount(product.price, product.promotionalPrice);
  const allProducts = getProducts();
  const relatedProducts = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  // Variant stock calculation
  const variantKey = `${selectedSize}-${selectedColor.name}`;
  const availableStock = product.stock[variantKey] ?? 10;

  const handleAddToCart = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
  };

  const handleBuyNow = () => {
    addToCart(product, selectedSize, selectedColor, quantity);
    navigate('/checkout');
  };

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground flex items-center gap-2">
        <Link to="/" className="hover:text-primary">Início</Link>
        <span>/</span>
        <Link to="/catalogo" className="hover:text-primary">Catálogo</Link>
        <span>/</span>
        <Link to={`/catalogo?categoria=${product.category}`} className="hover:text-primary">{product.category}</Link>
        <span>/</span>
        <span className="text-foreground font-semibold truncate">{product.name}</span>
      </nav>

      {/* Product Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Image & Video Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0]?.clientX ?? null;
              didSwipeRef.current = false;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null || mediaSlides.length <= 1) return;
              const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
              const deltaX = endX - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(deltaX) > 35) {
                didSwipeRef.current = true;
                if (deltaX < 0) handleNextSlide();
                else handlePrevSlide();
              }
            }}
            onClick={() => {
              if (didSwipeRef.current) {
                didSwipeRef.current = false;
                return;
              }
              if (!isVideoMedia(activeImage)) {
                openLightbox(
                  mediaSlides,
                  Math.max(0, mediaSlides.indexOf(activeImage)),
                  product.name
                );
              }
            }}
            className={`relative aspect-[4/5] rounded-3xl overflow-hidden bg-muted border border-border group shadow-lg ${
              isVideoMedia(activeImage) ? '' : 'cursor-zoom-in'
            }`}
            title={isVideoMedia(activeImage) ? 'Reproduzindo vídeo do produto' : 'Clique para expandir a imagem'}
          >
            <ProductMediaView
              src={activeImage}
              alt={product.name}
              poster={coverPoster}
              autoPlay={true}
              muted={true}
              loop={true}
              controls={isVideoMedia(activeImage)}
              className="w-full h-full object-cover transition-transform duration-500 sm:group-hover:scale-105"
            />
            {discountPercent > 0 && (
              <span className="absolute top-4 left-4 z-10 bg-destructive text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                -{discountPercent}% OFF
              </span>
            )}
            {mediaSlides.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                  title="Mídia anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all"
                  title="Próxima mídia"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          {mediaSlides.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {mediaSlides.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={`relative w-20 h-24 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImage === img ? 'border-primary scale-105 shadow-md' : 'border-border opacity-70 hover:opacity-100'
                  }`}
                >
                  <ProductMediaView
                    src={img}
                    alt=""
                    poster={coverPoster}
                    autoPlay={false}
                    muted={true}
                    showVideoBadge={isVideoMedia(img)}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Buying Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <span className="text-xs text-primary font-bold uppercase tracking-wider">{product.category}</span>
            <h1 className="font-serif font-bold text-3xl text-foreground mt-1 leading-tight">{product.name}</h1>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <div className="flex items-center text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= Math.round(product.rating) ? 'fill-amber-500 stroke-none' : 'stroke-muted-foreground fill-none'
                    }`}
                  />
                ))}
                <span className="font-bold text-foreground ml-1.5">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">• {product.reviewCount} avaliações</span>
              <span className="text-muted-foreground">• SKU: {product.sku}</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-secondary/50 dark:bg-secondary-dark/50 rounded-2xl border border-border flex items-baseline gap-3">
            {product.promotionalPrice ? (
              <>
                <span className="font-serif font-bold text-3xl text-primary">
                  {formatCurrency(product.promotionalPrice)}
                </span>
                <span className="text-sm text-muted-foreground line-through">
                  {formatCurrency(product.price)}
                </span>
              </>
            ) : (
              <span className="font-serif font-bold text-3xl text-foreground">
                {formatCurrency(product.price)}
              </span>
            )}
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold ml-auto">
              ou 6x de {formatCurrency((product.promotionalPrice || product.price) / 6)} s/ juros
            </span>
          </div>

          {/* Color Selection */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="font-semibold text-foreground uppercase tracking-wider">Cor:</span>
              <span className="font-medium text-primary">{selectedColor.name}</span>
            </div>
            <div className="flex items-center gap-3">
              {product.colors.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
                    selectedColor.name === color.name ? 'border-primary ring-2 ring-primary ring-offset-2 scale-110' : 'border-border hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div>
            <div className="flex justify-between items-center text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground uppercase tracking-wider">Tamanho:</span>
                <span className="font-bold text-primary text-xs">
                  {selectedSize}
                  {selectedSize === 'M' && ' (Veste 34 a 38)'}
                  {selectedSize === 'G' && ' (Veste 40 ao 44)'}
                </span>
              </div>
              <button
                onClick={() => setIsSizeGuideOpen(true)}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Ruler className="w-3.5 h-3.5" /> Guia de Medidas
              </button>
            </div>

            {/* Caixa Rápida de Informativo de Tamanhos */}
            <div className="mb-2.5 grid grid-cols-2 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setSelectedSize('M')}
                className={`py-1.5 px-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                  selectedSize === 'M'
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                    : 'bg-muted/40 border-border text-foreground hover:border-primary/40'
                }`}
              >
                <span className="font-black text-xs">M</span>
                <span className="text-[11px] font-semibold text-muted-foreground">Veste 34 a 38</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSize('G')}
                className={`py-1.5 px-2.5 rounded-xl border transition-all text-left flex items-center justify-between ${
                  selectedSize === 'G'
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs'
                    : 'bg-muted/40 border-border text-foreground hover:border-primary/40'
                }`}
              >
                <span className="font-black text-xs">G</span>
                <span className="text-[11px] font-semibold text-muted-foreground">Veste 40 ao 44</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center ${
                    selectedSize === sz
                      ? 'bg-primary text-white border-primary shadow-md scale-105'
                      : 'bg-background border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  <span>{sz}</span>
                  {sz === 'M' && <span className="text-[9px] font-normal opacity-85">34-38</span>}
                  {sz === 'G' && <span className="text-[9px] font-normal opacity-85">40-44</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Indicator */}
          <div className="text-xs flex items-center gap-2">
            {availableStock > 5 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Em estoque para pronta entrega ({availableStock} disponíveis)
              </span>
            ) : availableStock > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 animate-pulse">
                Últimas {availableStock} peças disponíveis para o tamanho {selectedSize}!
              </span>
            ) : (
              <span className="text-destructive font-semibold">Tamanho {selectedSize} esgotado no momento.</span>
            )}
          </div>

          {/* Buying Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleBuyNow}
              disabled={availableStock === 0}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              Comprar Agora
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={availableStock === 0}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-sm py-3.5 rounded-2xl border border-border transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4 text-primary" />
                Adicionar ao Carrinho
              </button>

              <button
                onClick={() => toggleWishlist(product.id)}
                className={`p-3.5 rounded-2xl border transition-colors flex items-center justify-center ${
                  isLiked
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-card border-border text-foreground hover:bg-muted'
                }`}
                title="Favoritar peça"
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-white' : ''}`} />
              </button>
            </div>
          </div>

          {/* Social Share & Security */}
          <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Truck className="w-4 h-4 text-primary" /> Envio rápido</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-primary" /> Troca fácil</span>
            </div>

            <button
              onClick={handleShareLink}
              className="hover:text-primary flex items-center gap-1 font-medium"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink ? 'Link copiado!' : 'Compartilhar'}
            </button>
          </div>

          {/* Product Description Tabs / Specs */}
          <div className="pt-6 border-t border-border space-y-4 text-xs">
            <h3 className="font-serif font-bold text-base text-foreground">Descrição & Características</h3>
            <p className="text-muted-foreground leading-relaxed">{product.fullDescription}</p>

            <div className="bg-muted/40 p-4 rounded-2xl space-y-2">
              <span className="font-semibold text-foreground block">Materiais & Composição:</span>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                {product.materials.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <ReviewSection productId={product.id} productName={product.name} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-border">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif font-bold text-2xl text-foreground">Você Também Pode Gostar</h2>
            <Link to="/catalogo" className="text-xs font-semibold text-primary hover:underline">
              Ver mais peças
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      <SizeGuideModal isOpen={isSizeGuideOpen} onClose={() => setIsSizeGuideOpen(false)} />
    </div>
  );
};
