import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, ExternalLink, RotateCcw, XCircle, ChevronDown, ChevronUp, CheckCircle, Clock } from 'lucide-react';
import { getOrders, updateOrderStatus, getProducts } from '../../lib/base44Client';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useCart } from '../../contexts/CartContext';
import { Order, OrderStatus } from '../../types';

export const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pago':
        return <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Pago</span>;
      case 'enviado':
        return <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Truck className="w-3 h-3" /> Enviado</span>;
      case 'entregue':
        return <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Entregue</span>;
      case 'cancelado':
        return <span className="bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelado</span>;
      default:
        return <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Clock className="w-3 h-3" /> Pendente</span>;
    }
  };

  const handleCancelOrder = (orderId: string) => {
    updateOrderStatus(orderId, 'cancelado');
    setOrders(getOrders());
  };

  const handleReorder = (order: Order) => {
    const allProducts = getProducts();
    order.items.forEach((item) => {
      const prod = allProducts.find((p) => p.id === item.productId);
      if (prod) {
        addToCart(prod, item.size, { name: item.colorName, hex: '#5F6F3A' }, item.quantity);
      }
    });
    navigate('/carrinho');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Histórico de Compras</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Meus Pedidos</h1>
        <p className="text-xs text-muted-foreground mt-1">Acompanhe a entrega dos seus pedidos e veja o histórico completo.</p>
      </div>

      {orders.length === 0 ? (
        <div className="py-16 text-center bg-card border border-border rounded-2xl p-8 space-y-4">
          <Package className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="font-serif font-bold text-lg text-foreground">Nenhum pedido realizado ainda</h3>
          <p className="text-xs text-muted-foreground">Quando você efetuar um pedido, ele aparecerá aqui com rastreamento.</p>
          <Link to="/catalogo" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
            Ir às Compras
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isExpanded = expandedOrderId === order.id;

            return (
              <div
                key={order.id}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm transition-all"
              >
                {/* Order Top Bar */}
                <div className="p-5 flex flex-wrap items-center justify-between gap-4 bg-muted/30 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">
                        Pedido #{order.orderNumber}
                      </h3>
                      <span className="text-[11px] text-muted-foreground">Realizado em {formatDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    <span className="font-serif font-bold text-base text-primary">
                      {formatCurrency(order.totals.total)}
                    </span>
                    <button
                      onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Always visible brief */}
                <div className="p-5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img
                      src={order.items[0]?.productImage}
                      alt=""
                      className="w-12 h-14 object-cover rounded-lg border border-border"
                    />
                    <div>
                      <span className="font-semibold text-foreground">{order.items[0]?.productName}</span>
                      {order.items.length > 1 && (
                        <span className="text-muted-foreground block text-[11px]">
                          + mais {order.items.length - 1} item(ns)
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {order.trackingCode && (
                      <a
                        href={`https://rastreamento.correios.com.br/app/index.php?codigo=${order.trackingCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Rastrear ({order.trackingCode})
                      </a>
                    )}

                    <button
                      onClick={() => handleReorder(order)}
                      className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs px-3 py-1.5 rounded-lg border border-border flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-primary" /> Repetir Compra
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-5 border-t border-border bg-background/50 space-y-4 text-xs">
                    <h4 className="font-semibold text-foreground">Itens do Pedido:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-card p-2.5 rounded-xl border border-border">
                          <div className="flex items-center gap-2">
                            <img src={item.productImage} alt="" className="w-8 h-10 object-cover rounded" />
                            <div>
                              <span className="font-medium text-foreground">{item.productName}</span>
                              <span className="text-[11px] text-muted-foreground block">
                                Tam: {item.size} | Cor: {item.colorName} | Qtd: {item.quantity}
                              </span>
                            </div>
                          </div>
                          <span className="font-bold text-foreground">{formatCurrency(item.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between items-center text-muted-foreground">
                      <span>Endereço de Entrega: {order.shippingAddress.street}, Nº {order.shippingAddress.number} - {order.shippingAddress.city}/{order.shippingAddress.state}</span>
                      {order.status === 'pendente' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="text-destructive font-semibold hover:underline flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancelar Pedido
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
