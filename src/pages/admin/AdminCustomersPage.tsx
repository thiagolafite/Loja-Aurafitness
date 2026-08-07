import React, { useState } from 'react';
import { Search, User, MapPin, ShoppingBag } from 'lucide-react';
import { getCustomers } from '../../lib/base44Client';
import { formatCurrency, formatDate } from '../../lib/utils';

export const AdminCustomersPage: React.FC = () => {
  const customers = getCustomers();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cpf.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Base de Dados</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Clientes Cadastrados</h1>
        <p className="text-xs text-muted-foreground mt-1">Visualize histórico de compras, endereços e ticket médio de cada cliente.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Buscar cliente por nome, e-mail ou CPF..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs focus:ring-2 focus:ring-primary outline-none"
        />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold border-b border-border">
              <tr>
                <th className="p-3.5">Cliente</th>
                <th className="p-3.5">CPF</th>
                <th className="p-3.5">Telefone</th>
                <th className="p-3.5">Endereço Principal</th>
                <th className="p-3.5">Total Pedidos</th>
                <th className="p-3.5">Total Gasto</th>
                <th className="p-3.5">Ticket Médio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5">
                    <div className="font-serif font-bold text-sm text-foreground">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.email}</div>
                  </td>
                  <td className="p-3.5 font-mono text-muted-foreground">{c.cpf}</td>
                  <td className="p-3.5">{c.phone}</td>
                  <td className="p-3.5 text-muted-foreground">
                    {c.addresses[0] ? `${c.addresses[0].city}/${c.addresses[0].state}` : 'Sem endereço'}
                  </td>
                  <td className="p-3.5 font-bold text-foreground">{c.totalOrders} pedidos</td>
                  <td className="p-3.5 font-serif font-bold text-primary">{formatCurrency(c.totalSpent)}</td>
                  <td className="p-3.5 font-semibold text-foreground">{formatCurrency(c.averageTicket)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
