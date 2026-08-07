import React, { useState } from 'react';
import { Search, Eye, Truck, Printer, CheckCircle, Clock, XCircle, ChevronRight, MessageCircle } from 'lucide-react';
import { getOrders, updateOrderStatus, getStoreSettings } from '../../lib/base44Client';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Order, OrderStatus } from '../../types';
import { generateWhatsAppOrderMessage } from '../../lib/whatsapp';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(() => getOrders());
  const [selectedStatus, setSelectedStatus] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [trackingInput, setTrackingInput] = useState<string>('');

  const settings = getStoreSettings();

  const filteredOrders = orders.filter((o) => {
    if (selectedStatus !== 'todos' && o.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = o.orderNumber.toLowerCase().includes(q);
      const matchCust = o.customer.name.toLowerCase().includes(q);
      const matchCpf = o.customer.cpf.includes(q);
      if (!matchNum && !matchCust && !matchCpf) return false;
    }
    return true;
  });

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
    setOrders(getOrders());
    if (viewingOrder && viewingOrder.id === orderId) {
      setViewingOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleSaveTracking = (orderId: string) => {
    updateOrderStatus(orderId, 'enviado', trackingInput);
    setOrders(getOrders());
    if (viewingOrder) {
      setViewingOrder((prev) => (prev ? { ...prev, status: 'enviado', trackingCode: trackingInput } : null));
    }
    alert('Código de rastreamento atualizado e status alterado para Enviado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Gestão de Vendas</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Pedidos de Clientes</h1>
          <p className="text-xs text-muted-foreground mt-1">Gerencie a alteração de status, inserção de rastreio e comprovantes.</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 text-xs font-semibold">
          {['todos', 'pendente', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-2 rounded-xl uppercase transition-colors whitespace-nowrap ${
                selectedStatus === st ? 'bg-primary text-white shadow-md' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, CPF..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3.5">Pedido</th>
                <th className="p-3.5">Data</th>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">Cidade/UF</th>
                <th className="p-3.5">Pagamento</th>
                <th className="p-3.5">Total</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-primary">#{order.orderNumber}</td>
                  <td className="p-3.5 text-muted-foreground">{formatDate(order.createdAt)}</td>
                  <td className="p-3.5 font-semibold text-foreground">
                    <div>{order.customer.name}</div>
                    <div className="text-[10px] text-muted-foreground font-normal">{order.customer.cpf}</div>
                  </td>
                  <td className="p-3.5 text-muted-foreground">{order.shippingAddress.city}/{order.shippingAddress.state}</td>
                  <td className="p-3.5 uppercase font-medium">{order.paymentMethod}</td>
                  <td className="p-3.5 font-serif font-bold text-foreground">{formatCurrency(order.totals.total)}</td>
                  <td className="p-3.5">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-background border border-border rounded-lg px-2 py-1 text-xs font-bold text-primary outline-none cursor-pointer"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="em_separacao">Em Separação</option>
                      <option value="enviado">Enviado</option>
                      <option value="entregue">Entregue</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => {
                        setViewingOrder(order);
                        setTrackingInput(order.trackingCode || '');
                      }}
                      className="p-1.5 hover:bg-muted text-foreground rounded-lg"
                      title="Ver Detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-2xl rounded-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-xs text-primary font-bold">Detalhes do Pedido</span>
                <h3 className="font-serif font-bold text-xl text-foreground">#{viewingOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setViewingOrder(null)} className="text-muted-foreground hover:text-foreground text-xs font-semibold">
                Fechar
              </button>
            </div>

            {/* Tracking Code Section */}
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl space-y-2 text-xs">
              <label className="font-semibold text-primary block">Código de Rastreamento Correios/Transportadora:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: BR987654321SP"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 font-mono text-xs outline-none"
                />
                <button
                  onClick={() => handleSaveTracking(viewingOrder.id)}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-xl"
                >
                  Salvar e Notificar Envio
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-foreground">Itens Comprados:</h4>
              {viewingOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center bg-muted/40 p-2.5 rounded-xl">
                  <span>{it.quantity}x {it.productName} ({it.size} / {it.colorName})</span>
                  <span className="font-bold">{formatCurrency(it.total)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-border flex justify-between items-center font-serif font-bold text-lg">
              <span>Total do Pedido:</span>
              <span className="text-primary">{formatCurrency(viewingOrder.totals.total)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
