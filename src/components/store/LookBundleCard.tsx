import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { LookSet } from '../../types';
import { formatCurrency } from '../../lib/utils';
import { getProducts } from '../../lib/dataClient';
import { useCart } from '../../contexts/CartContext';

interface LookBundleCardProps {
  lookSet: LookSet;
}

export const LookBundleCard: React.FC<LookBundleCardProps> = ({ lookSet }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const allProducts = getProducts();

  const bundleProducts = allProducts.filter((p) => lookSet.productIds.includes(p.id));

  const handleBuyBundle = () => {
    bundleProducts.forEach((prod) => {
      addToCart(prod, prod.sizes[0] || 'M', prod.colors[0] || { name: 'Verde Oliva', hex: '#5F6F3A' }, 1);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-card border border-primary/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 grid grid-cols-1 md:grid-cols-12 gap-0 relative group"
    >
      <div className="md:col-span-5 relative overflow-hidden aspect-[4/3] md:aspect-auto bg-muted">
        <img
          src={lookSet.imageUrl}
          alt={lookSet.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
          {lookSet.setDiscountPercentage}% OFF NO CONJUNTO
        </div>
      </div>

      <div className="md:col-span-7 p-6 flex flex-col justify-between">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">
            Look Completo Aura
          </span>
          <h3 className="font-serif font-bold text-xl text-foreground mt-1 mb-2">
            {lookSet.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {lookSet.description}
          </p>

          {/* Included Products List */}
          <div className="space-y-2 mb-6">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Peças Inclusas no Look:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bundleProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => navigate(`/produto/${product.id}`)}
                  className="flex items-center gap-3 p-2 rounded-xl bg-secondary/50 dark:bg-secondary-dark/50 border border-border/50 hover:border-primary/40 transition-colors cursor-pointer"
                >
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-10 h-10 object-cover rounded-lg shrink-0"
                  />
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-foreground truncate">{product.name}</h5>
                    <span className="text-[11px] text-muted-foreground">
                      {formatCurrency(product.promotionalPrice || product.price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action & Pricing */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-muted-foreground line-through block">
              De {formatCurrency(lookSet.totalPrice)}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-serif text-primary">
                {formatCurrency(lookSet.discountedPrice)}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                Economize {formatCurrency(lookSet.totalPrice - lookSet.discountedPrice)}
              </span>
            </div>
          </div>

          <button
            onClick={handleBuyBundle}
            className="bg-primary hover:bg-primary-hover text-white font-semibold text-sm py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group/btn"
          >
            <ShoppingBag className="w-4 h-4" />
            Adicionar Look ao Carrinho
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
