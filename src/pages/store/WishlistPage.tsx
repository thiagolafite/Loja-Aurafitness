import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Share2, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../../contexts/WishlistContext';
import { getProducts } from '../../lib/dataClient';
import { ProductCard } from '../../components/store/ProductCard';

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const allProducts = getProducts();
  const [copied, setCopied] = useState(false);

  const favoritedProducts = allProducts.filter((p) => wishlist.includes(p.id));

  const handleShareWishlist = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Sua Coleção Pessoal</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Lista de Desejos</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {favoritedProducts.length} {favoritedProducts.length === 1 ? 'peça salva' : 'peças salvas'} na sua lista.
          </p>
        </div>

        {favoritedProducts.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleShareWishlist}
              className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs px-4 py-2.5 rounded-xl border border-border flex items-center gap-2 transition-colors"
            >
              <Share2 className="w-4 h-4 text-primary" />
              {copied ? 'Link Copiado!' : 'Compartilhar Lista'}
            </button>

            <button
              onClick={clearWishlist}
              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar Lista
            </button>
          </div>
        )}
      </div>

      {favoritedProducts.length === 0 ? (
        <div className="py-20 text-center bg-card border border-border rounded-2xl p-8 space-y-4">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-serif font-bold text-xl text-foreground">Sua lista de desejos está vazia</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Navegue pelo nosso catálogo e clique no coração das peças que você mais amar para salvá-las aqui.
          </p>
          <Link to="/catalogo" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
            Explorar Coleções Aura
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favoritedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
