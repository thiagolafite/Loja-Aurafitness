import React from 'react';
import { Sparkles, Heart } from 'lucide-react';

export const PromoBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-[#133820] via-[#1a4a2b] to-[#133820] text-rose-100 text-xs text-center py-2 px-4 font-medium tracking-wide border-b border-rose-300/20 shadow-inner flex items-center justify-center gap-2">
      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
      <span>
        Frete Grátis nas compras acima de <strong className="text-white">R$ 299</strong> • Modelagem anatômica perfeita para o seu corpo
      </span>
      <Heart className="w-3 h-3 text-rose-300 fill-rose-300/70" />
    </div>
  );
};
