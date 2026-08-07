import React from 'react';
import {
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getOrders, getProducts, getCustomers } from '../../lib/base44Client';
import { formatCurrency } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const orders = getOrders();
  const products = getProducts();
  const customers = getCustomers();

  // Metrics Calculations
  const todayOrders = orders.filter(
    (o) => new Date(o.createdAt).toDateString() === new Date().toDateString()
  ).length || orders.length;

  const totalRevenue = orders.reduce((sum, o) => sum + o.totals.total, 0);
  const averageTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const totalUnitsSold = orders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, i) => iSum + i.quantity, 0),
    0
  );

  const outOfStockProducts = products.filter((p) => {
    const totalStock = Object.values(p.stock).reduce((a, b) => a + b, 0);
    return totalStock === 0;
  });

  // Revenue trend data for Recharts
  const revenueChartData = [
    { name: 'Seg', receita: 1450 },
    { name: 'Ter', receita: 2100 },
    { name: 'Qua', receita: 1890 },
    { name: 'Qui', receita: 3200 },
    { name: 'Sex', receita: 4100 },
    { name: 'Sáb', receita: 3800 },
    { name: 'Dom', receita: 2900 },
  ];

  // Status breakdown data
  const statusPieData = [
    { name: 'Pago', value: orders.filter((o) => o.status === 'pago').length || 1, color: '#10B981' },
    { name: 'Enviado', value: orders.filter((o) => o.status === 'enviado').length || 1, color: '#3B82F6' },
    { name: 'Pendente', value: orders.filter((o) => o.status === 'pendente').length || 1, color: '#F59E0B' },
    { name: 'Entregue', value: orders.filter((o) => o.status === 'entregue').length || 1, color: '#8B5CF6' },
  ];

  return (
    <div className="space-y-8">
      {/* Header Title */}
      <div>
        <span className="text-xs text-primary font-bold uppercase tracking-wider">Visão Geral do Negócio</span>
        <h1 className="font-serif font-bold text-3xl text-foreground mt-1">Dashboard Executivo</h1>
        <p className="text-xs text-muted-foreground mt-1">Métricas de vendas e desempenho operacional da Aura Fitness em tempo real.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Card 1: Pedidos do Dia */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Pedidos do Dia</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-foreground">{todayOrders}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +12% que ontem
          </span>
        </div>

        {/* Card 2: Receita Total */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Receita Total</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-xl text-primary">{formatCurrency(totalRevenue)}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> Meta atingida
          </span>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Ticket Médio</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-xl text-foreground">{formatCurrency(averageTicket)}</div>
          <span className="text-[11px] text-muted-foreground">Média por pedido</span>
        </div>

        {/* Card 4: Produtos Vendidos */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Peças Vendidas</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-foreground">{totalUnitsSold}</div>
          <span className="text-[11px] text-muted-foreground">Unidades enviadas</span>
        </div>

        {/* Card 5: Produtos Sem Estoque */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Sem Estoque</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-rose-600">{outOfStockProducts.length}</div>
          <span className="text-[11px] text-rose-500 font-medium">Requer reposição</span>
        </div>

        {/* Card 6: Clientes Cadastrados */}
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold">Clientes</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif font-bold text-2xl text-foreground">{customers.length}</div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" /> +5 este mês
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Area Chart: Revenue Trend */}
        <div className="lg:col-span-8 bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-foreground">Faturamento Semanal</h3>
              <p className="text-xs text-muted-foreground">Evolução do faturamento diário na plataforma.</p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">R$ BRL</span>
          </div>

          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(86, 28%, 38%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(86, 28%, 38%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Receita']}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '0.75rem', borderColor: 'hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="receita" stroke="hsl(86, 28%, 38%)" strokeWidth={3} fillOpacity={1} fill="url(#colorReceita)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart: Status Breakdown */}
        <div className="lg:col-span-4 bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-foreground">Pedidos por Status</h3>
            <p className="text-xs text-muted-foreground">Distribuição atual dos pedidos efetuados.</p>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {statusPieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}: <strong className="text-foreground">{item.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Recent Orders Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-serif font-bold text-lg text-foreground">Últimos Pedidos Efetuados</h3>
          <button
            onClick={() => navigate('/admin/pedidos')}
            className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
          >
            Ver Todos os Pedidos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 text-foreground font-semibold">
              <tr>
                <th className="p-3">Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Itens</th>
                <th className="p-3">Forma Pagamento</th>
                <th className="p-3">Valor Total</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.slice(0, 5).map((order) => (
                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">#{order.orderNumber}</td>
                  <td className="p-3 font-semibold text-foreground">{order.customer.name}</td>
                  <td className="p-3 text-muted-foreground">{order.items.length} peça(s)</td>
                  <td className="p-3 uppercase font-medium">{order.paymentMethod}</td>
                  <td className="p-3 font-serif font-bold text-foreground">{formatCurrency(order.totals.total)}</td>
                  <td className="p-3">
                    <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase text-[10px]">
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => navigate('/admin/pedidos')}
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
    </div>
  );
};
