import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, Tag, Truck, ArrowRight, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../lib/utils';
import { useViaCep } from '../../hooks/useViaCep';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    appliedCoupon,
    couponMessage,
    applyCouponCode,
    removeCoupon,
    estimatedShipping,
    setEstimatedShipping,
    subtotal,
    discountAmount,
    totalAmount,
    totalItemCount,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [cepInput, setCepInput] = useState('');
  const { loading: loadingCep, error: cepError, fetchAddressByCep } = useViaCep();
  const [shippingCalculated, setShippingCalculated] = useState(false);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponInput.trim()) {
      applyCouponCode(couponInput.trim());
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cepInput.trim()) return;
    const address = await fetchAddressByCep(cepInput);
    if (address) {
      // Calculate rate based on region or default
      const fee = subtotal >= 299 ? 0 : 19.90;
      setEstimatedShipping(fee);
      setShippingCalculated(true);
    }
  };

  const handleGoToCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-card text-card-foreground border-l border-border shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-secondary/40 dark:bg-secondary-dark/40">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-lg text-foreground">Seu Carrinho</h2>
                    <span className="text-xs text-muted-foreground">
                      {totalItemCount} {totalItemCount === 1 ? 'item' : 'itens'} selecionados
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {items.length === 0 ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">Carrinho Vazio</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Você ainda não adicionou nenhuma peça da Aura Fitness.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        closeCart();
                        navigate('/catalogo');
                      }}
                      className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-md transition-colors inline-block"
                    >
                      Explorar Coleção
                    </button>
                  </div>
                ) : (
                  items.map((item, index) => {
                    const itemPrice = item.product.promotionalPrice || item.product.price;
                    return (
                      <div
                        key={`${item.product.id}-${item.selectedSize}-${item.selectedColor.name}-${index}`}
                        className="flex gap-3 p-3 rounded-2xl border border-border/80 bg-background/60 hover:bg-background transition-colors relative group"
                      >
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-20 h-24 object-cover rounded-xl shrink-0 border border-border"
                        />

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-xs text-foreground line-clamp-1">
                                {item.product.name}
                              </h4>
                              <button
                                onClick={() =>
                                  removeFromCart(item.product.id, item.selectedSize, item.selectedColor.name)
                                }
                                className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                title="Remover item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1">
                              <span>Tam: <strong className="text-foreground">{item.selectedSize}</strong></span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border"
                                  style={{ backgroundColor: item.selectedColor.hex }}
                                />
                                <span className="text-foreground">{item.selectedColor.name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="font-serif font-bold text-sm text-primary">
                              {formatCurrency(itemPrice * item.quantity)}
                            </span>

                            <div className="flex items-center border border-border rounded-lg bg-card">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.selectedColor.name,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 hover:bg-muted text-foreground transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-semibold text-foreground">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.product.id,
                                    item.selectedSize,
                                    item.selectedColor.name,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 hover:bg-muted text-foreground transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer (Coupons, Shipping, Totals) */}
              {items.length > 0 && (
                <div className="p-5 border-t border-border bg-card space-y-4 shadow-inner">
                  {/* Coupon Input */}
                  <div>
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                          <Tag className="w-4 h-4" />
                          <span>Cupom {appliedCoupon.code} aplicado</span>
                        </div>
                        <button
                          onClick={removeCoupon}
                          className="text-emerald-700 dark:text-emerald-400 hover:underline text-[11px]"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Cupom (ex: AURA10)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs uppercase outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <button
                          type="submit"
                          className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs px-3 py-2 rounded-xl border border-border transition-colors"
                        >
                          Aplicar
                        </button>
                      </form>
                    )}
                    {couponMessage && !appliedCoupon && (
                      <span className="text-[11px] text-destructive mt-1 block">{couponMessage}</span>
                    )}
                  </div>

                  {/* Shipping Calculator */}
                  <div>
                    <form onSubmit={handleCalculateShipping} className="flex gap-2">
                      <div className="relative flex-1">
                        <Truck className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Calcular CEP (ex: 01310-100)"
                          value={cepInput}
                          onChange={(e) => setCepInput(e.target.value)}
                          className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loadingCep}
                        className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs px-3 py-2 rounded-xl border border-border transition-colors disabled:opacity-50"
                      >
                        {loadingCep ? 'Buscando...' : 'Calcular'}
                      </button>
                    </form>
                    {cepError && <span className="text-[11px] text-destructive mt-1 block">{cepError}</span>}
                    {shippingCalculated && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Frete estimado:{' '}
                        {estimatedShipping === 0 ? 'GRÁTIS' : formatCurrency(estimatedShipping)}
                      </span>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Desconto</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frete Estimado</span>
                      <span>{estimatedShipping === 0 ? 'Grátis' : formatCurrency(estimatedShipping)}</span>
                    </div>
                    <div className="flex justify-between font-serif font-bold text-base text-foreground pt-2 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <button
                    onClick={handleGoToCheckout}
                    className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group"
                  >
                    Finalizar Compra
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
