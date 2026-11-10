import React from 'react';
import { Star, ShieldCheck, RefreshCw, Sparkles, Truck, Heart } from 'lucide-react';

export const TrustBar: React.FC = () => {
  const items = [
    { icon: Star, text: '★ 4.9 de avaliação das nossas clientes' },
    { icon: Sparkles, text: 'Modelagem Anatômica Efeito Lipo' },
    { icon: ShieldCheck, text: 'Zero Transparência Comprovada' },
    { icon: RefreshCw, text: 'Primeira Troca Grátis' },
    { icon: Truck, text: 'Frete Grátis acima de R$299' },
    { icon: Heart, text: '+1.200 mulheres apaixonadas' },
  ];

  // Quadruplicate to ensure smooth continuous loop
  const tickerItems = [...items, ...items, ...items, ...items];

  return (
    <div className="bg-gradient-to-r from-[#fcf7f4] via-[#f7eeea] to-[#fcf7f4] dark:from-[#112417] dark:via-[#162e1e] dark:to-[#112417] border-y border-rose-200/50 dark:border-white/10 py-3 overflow-hidden select-none relative shadow-sm">
      <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
        {tickerItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="inline-flex items-center gap-2 text-xs font-semibold text-[#184227] dark:text-rose-100 tracking-wider uppercase">
              <Icon className="w-3.5 h-3.5 text-amber-500 fill-amber-400/20 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
