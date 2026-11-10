import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Truck,
  Heart,
  Flame,
  Zap,
  Award,
  Tag,
  ThumbsUp,
} from 'lucide-react';
import { getTrustBarItems, initialTrustBarItems } from '../../lib/dataClient';
import { TrustBarItem } from '../../types';

export const TRUST_BAR_ICONS: Record<string, React.ElementType> = {
  Star,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Truck,
  Heart,
  Flame,
  Zap,
  Award,
  Tag,
  ThumbsUp,
};

export const TrustBar: React.FC = () => {
  const [items, setItems] = useState<TrustBarItem[]>(() => getTrustBarItems());

  useEffect(() => {
    const handleUpdate = () => setItems(getTrustBarItems());
    window.addEventListener('aura_trustbar_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('aura_trustbar_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const activeItems = items.filter((it) => it.active);
  const displayItems = activeItems.length > 0 ? activeItems : initialTrustBarItems;

  // Duplicar o suficiente para loop contínuo infinito perfeito
  const tickerItems = [...displayItems, ...displayItems, ...displayItems, ...displayItems];

  return (
    <div className="bg-gradient-to-r from-[#fcf7f4] via-[#f7eeea] to-[#fcf7f4] dark:from-[#112417] dark:via-[#162e1e] dark:to-[#112417] border-y border-rose-200/50 dark:border-white/10 py-3 overflow-hidden select-none relative shadow-sm">
      <div className="flex items-center gap-10 whitespace-nowrap animate-marquee">
        {tickerItems.map((item, index) => {
          const Icon = TRUST_BAR_ICONS[item.iconName] || Sparkles;
          return (
            <div key={`${item.id}-${index}`} className="inline-flex items-center gap-2 text-xs font-semibold text-[#184227] dark:text-rose-100 tracking-wider uppercase">
              <Icon className="w-3.5 h-3.5 text-amber-500 fill-amber-400/20 flex-shrink-0" />
              <span>{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
