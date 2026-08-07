import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, calculateDiscount } from '../../lib/utils';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isFav = isInWishlist(product.id);

  const discountPercent = product.promotionalPrice
    ? calculateDiscount(product.price, product.promotionalPrice)
    : 0;

  return (
    <div className="group relative flex flex-col bg-transparent overflow-hidden transition-all duration-300">
      {/* Image Container with Badges */}
      <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[#dbe0dc] dark:bg-muted/40">
        <Link to={`/produto/${product.id}`} className="block w-full h-full">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={`${product.name} - foto 2`}
              className="absolute inset-0 w-full h-full object-cover object-top opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
        </Link>

        {/* Top-Left Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {discountPercent > 0 ? (
            <span className="bg-[#38672b] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              -{discountPercent}%
            </span>
          ) : product.isBestSeller ? (
            <span className="bg-[#111111] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              BEST SELLER
            </span>
          ) : product.isNewArrival ? (
            <span className="bg-[#284e20] text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-sm">
              NOVO
            </span>
          ) : null}
        </div>

        {/* Top-Right Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-900/90 text-foreground flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-all"
          title={isFav ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
        >
          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-700 dark:text-slate-200'}`} />
        </button>

        {/* Quick Add Hover Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            addToCart(
              product,
              product.sizes[0] || 'M',
              product.colors[0] || { name: 'Verde Oliva', hex: '#2b5022' },
              1
            );
          }}
          className="absolute bottom-3 left-3 right-3 z-10 py-2 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#284e20] dark:text-amber-300 font-semibold text-xs flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-white"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Comprar Rápido</span>
        </button>
      </div>

      {/* Card Info */}
      <div className="pt-3 pb-1 space-y-1 text-left">
        <span className="text-[10px] font-bold tracking-wider uppercase text-[#38672b] dark:text-amber-400 block">
          {product.category}
        </span>

        <Link to={`/produto/${product.id}`} className="block group-hover:text-[#284e20] transition-colors">
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
