import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, Tag, Truck } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { formatCurrency } from '../../lib/utils';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    subtotal,
    discountAmount,
    estimatedShipping,
    totalAmount,
    appliedCoupon,
    removeCoupon,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="font-serif font-bold text-2xl text-foreground">Seu Carrinho está Vazio</h2>
        <p className="text-sm text-muted-foreground">Adicione peças da coleção Aura Fitness para continuar.</p>
        <Link to="/catalogo" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
          Explorar Catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <h1 className="font-serif font-bold text-3xl text-foreground">Carrinho de Compras</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          {items.map((item, idx) => {
            const price = item.product.promotionalPrice || item.product.price;
            return (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-center justify-between p-4 bg-card border border-border rounded-2xl gap-4"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-xl shrink-0"
                  />
                  <div>
                    <h3 className="font-serif font-semibold text-sm text-foreground">{item.product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tamanho: <strong className="text-foreground">{item.selectedSize}</strong> | Cor: <strong className="text-foreground">{item.selectedColor.name}</strong>
                    </p>
                    <span className="font-serif font-bold text-sm text-primary mt-2 block sm:hidden">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                  <div className="flex items-center border border-border rounded-lg bg-background">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, item.quantity - 1)}
                      className="p-2 text-foreground hover:bg-muted"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-bold text-foreground">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor.name, item.quantity + 1)}
                      className="p-2 text-foreground hover:bg-muted"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="font-serif font-bold text-base text-primary hidden sm:block">
                    {formatCurrency(price * item.quantity)}
                  </span>

                  <button
                    onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor.name)}
                    className="text-muted-foreground hover:text-destructive p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-4 bg-card border border-border p-6 rounded-2xl h-fit space-y-4 shadow-sm">
          <h2 className="font-serif font-bold text-lg text-foreground pb-3 border-b border-border">Resumo do Pedido</h2>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Desconto Cupom</span>
                <span>-{formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>Frete</span>
              <span>{estimatedShipping === 0 ? 'Grátis' : formatCurrency(estimatedShipping)}</span>
            </div>
            <div className="flex justify-between font-serif font-bold text-base text-foreground pt-3 border-t border-border">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full bg-primary hover:bg-primary-hover text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            Ir para Checkout
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
