import React from 'react';
import { Star, ShieldCheck, RefreshCw, Sparkles, Truck, Heart } from 'lucide-react';

export const TrustBar: React.FC = () => {
  const items = [
    { icon: Star, text: '4.9 de avaliação das nossas clientes' },
    { icon: ShieldCheck, text: 'Compra 100% segura' },
    { icon: RefreshCw, text: 'Troca grátis em 30 dias' },
    { icon: Sparkles, text: 'Qualidade premium nacional' },
    { icon: Truck, text: 'Frete grátis acima de R$299' },
    { icon: Heart, text: '+500 clientes satisfeitas' },
  ];

  // Quadruplicate to ensure smooth continuous loop
  const tickerItems = [...items, ...items, ...items, ...items];

  return (
    <div className="bg-[#eff1ec] dark:bg-card border-y border-border py-3 overflow-hidden select-none relative">
      <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
        {tickerItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="inline-flex items-center gap-2 text-xs font-medium text-foreground/85 tracking-wide">
              <Icon className="w-4 h-4 text-[#38672b] dark:text-emerald-400 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
