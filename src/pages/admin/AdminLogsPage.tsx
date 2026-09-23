import React from 'react';
import { History, Package, CreditCard } from 'lucide-react';
import { getInventoryMovements, getPaymentLogs } from '../../lib/dataClient';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AdminLogsPage: React.FC = () => {
  const inventoryLogs = getInventoryMovements();
  const paymentLogs = getPaymentLogs();

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Auditoria & Rastreabilidade</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Logs do Sistema</h1>
        <p className="text-xs text-muted-foreground mt-1">Histórico automático de movimentações de estoque e pagamentos processados.</p>
      </div>

      {/* Inventory Logs */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
          <Package className="w-5 h-5 text-primary" /> Movimentações de Estoque
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3">Data</th>
                <th className="p-3">Produto</th>
                <th className="p-3">Variação</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Quantidade</th>
                <th className="p-3">Motivo</th>
                <th className="p-3">Usuário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inventoryLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{formatDate(log.date)}</td>
                  <td className="p-3 font-semibold text-foreground">{log.productName}</td>
                  <td className="p-3 font-mono">{log.variant}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${log.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {log.type === 'in' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="p-3 font-bold">{log.quantity} un.</td>
                  <td className="p-3 text-muted-foreground">{log.reason}</td>
                  <td className="p-3 font-medium">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Logs */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-lg text-foreground flex items-center gap-2 border-b border-border pb-3">
          <CreditCard className="w-5 h-5 text-primary" /> Logs de Transações & Pagamentos
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3">Data/Hora</th>
                <th className="p-3">Pedido</th>
                <th className="p-3">Método</th>
                <th className="p-3">Valor</th>
                <th className="p-3">Transação ID</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paymentLogs.map((pay) => (
                <tr key={pay.id} className="hover:bg-muted/30">
                  <td className="p-3 text-muted-foreground">{formatDate(pay.timestamp)}</td>
                  <td className="p-3 font-mono font-bold text-primary">#{pay.orderNumber}</td>
                  <td className="p-3 uppercase font-medium">{pay.method}</td>
                  <td className="p-3 font-serif font-bold text-foreground">{formatCurrency(pay.amount)}</td>
                  <td className="p-3 font-mono text-muted-foreground">{pay.transactionId}</td>
                  <td className="p-3">
                    <span className="bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {pay.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
