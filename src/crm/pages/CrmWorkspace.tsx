import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  AlertTriangle,
  ShoppingCart,
  Cake,
  Sparkles,
  MessageCircle,
  Search,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Award,
  TrendingUp,
  BellRing,
  Settings,
  Megaphone,
  Filter,
  Eye,
  Play,
  XCircle,
  Smartphone,
  ShieldCheck,
  Calendar,
  Zap,
} from 'lucide-react';
import {
  CrmAutomationRule,
  CrmCustomer360,
  CrmSegmentStatus,
  CrmSettingsConfig,
} from '../types';
import {
  buildCustomerWhatsAppUrl,
  cancelQueuedMessage,
  createAndQueueCampaign,
  dispatchQueuedMessage,
  ensureAutomationCouponInStore,
  evaluateAndQueueAutomatedMessages,
  getCrmAutomations,
  getCrmCampaigns,
  getCrmCustomers360,
  getCrmDashboardSummary,
  getCrmMessageQueue,
  getCrmSettings,
  getCrmTeamUsers,
  markCustomerContacted,
  removeCrmTeamUser,
  renderCrmTemplate,
  saveCrmAutomation,
  saveCrmSettings,
  saveCrmTeamUser,
  toggleCustomerManualAttention,
  syncCrmFromSupabase,
  getCrmCloudStatus,
} from '../services/crmService';
import { Customer360Drawer, SEGMENT_META } from '../components/Customer360Drawer';
import { NewCustomerModal } from '../components/NewCustomerModal';
import { formatCurrency, formatDate } from '../../lib/utils';

export type CrmModuleView =
  | 'overview'
  | 'attention'
  | 'customers'
  | 'abandoned'
  | 'birthdays'
  | 'automations'
  | 'campaigns'
  | 'settings';

interface CrmWorkspaceProps {
  initialView?: CrmModuleView;
  isStandalone?: boolean;
  currentUserRole?: 'admin' | 'gerente' | 'vendedor';
}

export const CrmWorkspace: React.FC<CrmWorkspaceProps> = ({
  initialView = 'overview',
  isStandalone = false,
  currentUserRole = 'admin',
}) => {
  const [activeView, setActiveView] = useState<CrmModuleView>(initialView);
  const [refreshTick, setRefreshTick] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<'all' | CrmSegmentStatus>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CrmCustomer360 | null>(null);
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [engineFeedback, setEngineFeedback] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState(() => getCrmCloudStatus());
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Automations Editor State
  const [editingRule, setEditingRule] = useState<CrmAutomationRule | null>(null);

  // Campaign Builder State
  const [campName, setCampName] = useState('');
  const [campSegment, setCampSegment] = useState<'all' | CrmSegmentStatus>('em_risco');
  const [campChannel, setCampChannel] = useState<'whatsapp' | 'email' | 'both'>('whatsapp');
  const [campCoupon, setCampCoupon] = useState('AURA15');
  const [campTemplate, setCampTemplate] = useState(
    'Oi {{primeiro_nome}}! Preparamos uma condição especial na Aura Fitness para você renovar seus looks de treino no tamanho {{tamanho_preferido}}: use o cupom *{{cupom}}* hoje em {{link_loja}} ✨'
  );
  const [campCreatedNotice, setCampCreatedNotice] = useState<string | null>(null);

  // Settings State
  const [settingsState, setSettingsState] = useState<CrmSettingsConfig>(() => getCrmSettings());
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'admin' | 'gerente' | 'vendedor'>('vendedor');

  const triggerRefresh = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    const handler = () => {
      setCloudStatus(getCrmCloudStatus());
      triggerRefresh();
    };
    window.addEventListener('aura_crm_updated', handler);

    // Sincroniza dados do Supabase ao abrir o CRM
    setIsCloudSyncing(true);
    syncCrmFromSupabase()
      .then((st) => setCloudStatus(st))
      .finally(() => setIsCloudSyncing(false));

    return () => window.removeEventListener('aura_crm_updated', handler);
  }, []);

  const customers = useMemo(() => getCrmCustomers360(), [refreshTick]);
  const summary = useMemo(() => getCrmDashboardSummary(), [refreshTick]);
  const automations = useMemo(() => getCrmAutomations(), [refreshTick]);
  const messageQueue = useMemo(() => getCrmMessageQueue(), [refreshTick]);
  const campaigns = useMemo(() => getCrmCampaigns(), [refreshTick]);
  const teamUsers = useMemo(() => getCrmTeamUsers(), [refreshTick]);

  // Keep selectedCustomer synced when data updates
  useEffect(() => {
    if (selectedCustomer) {
      const updated = customers.find((c) => c.id === selectedCustomer.id || c.email === selectedCustomer.email);
      if (updated) setSelectedCustomer(updated);
    }
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesSegment =
        segmentFilter === 'all' ||
        c.crmStatus === segmentFilter ||
        c.secondaryBadges.includes(segmentFilter);

      if (!matchesSegment) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.cpf || '').includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [customers, segmentFilter, searchQuery]);

  const attentionList = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.attentionScore >= 70 ||
          c.needsManualAttention ||
          c.pendingOrdersCount > 0 ||
          c.hasAbandonedCart ||
          c.isBirthdayWeek
      ),
    [customers]
  );

  const abandonedList = useMemo(
    () => customers.filter((c) => c.hasAbandonedCart || c.pendingOrdersCount > 0),
    [customers]
  );

  const birthdayList = useMemo(
    () =>
      customers
        .filter((c) => Boolean(c.birthDate))
        .sort((a, b) => (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999)),
    [customers]
  );

  const handleRunAutomationEngine = () => {
    const res = evaluateAndQueueAutomatedMessages();
    triggerRefresh();
    setEngineFeedback(
      res.queuedNow > 0
        ? `Motor executado: ${res.queuedNow} nova(s) mensagem(ns) programada(s) na fila (${res.totalPending} aguardando envio).`
        : `Motor sincronizado: todas as clientes elegíveis já estão em dia (${res.totalPending} na fila).`
    );
    setTimeout(() => setEngineFeedback(null), 5000);
  };

  const handleOneClickAction = (cust: CrmCustomer360) => {
    let couponCode: string | undefined;
    let tpl =
      'Oi {{primeiro_nome}}, tudo bem? Aqui é da Aura Fitness! 🖤 Como posso te ajudar hoje?';

    if (cust.pendingOrdersCount > 0) {
      tpl =
        'Oi {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* (R$ {{valor_pedido}}) está separado aqui na Aura Fitness aguardando a confirmação do pagamento. Quer que eu te mande o código PIX Copia e Cola por aqui?';
    } else if (cust.hasAbandonedCart) {
      couponCode = ensureAutomationCouponInStore('VOLTA7', 7, cust.name);
      tpl =
        'Oi {{primeiro_nome}}! Vi que você deixou *{{produto_principal}}* no carrinho da Aura Fitness. Posso te ajudar com tamanho ou frete? Liberei o cupom *{{cupom}}* (7% OFF) pra você finalizar agora: {{link_carrinho}}';
    } else if (cust.isBirthdayWeek) {
      couponCode = ensureAutomationCouponInStore('NIVER15', 15, cust.name);
      tpl =
        'Parabéns, {{primeiro_nome}}! 🎂🥂 Desejamos muita saúde e treinos incríveis! Preparamos seu cupom presente de 15% OFF na Aura Fitness: *{{cupom}}*. Vem escolher seu look: {{link_loja}}';
    } else if (cust.crmStatus === 'em_risco' || cust.crmStatus === 'inativo') {
      couponCode = ensureAutomationCouponInStore('SAUDADE12', 12, cust.name);
      tpl =
        'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última compra na Aura Fitness e chegaram peças lindas no seu tamanho *{{tamanho_preferido}}*! Use o cupom *{{cupom}}* (12% OFF): {{link_loja}}';
    } else if (cust.crmStatus === 'novo') {
      couponCode = ensureAutomationCouponInStore('BEMVINDA10', 10, cust.name);
      tpl =
        'Oi {{primeiro_nome}}! Bem-vinda à Aura Fitness! 🖤 Preparei seu cupom de 10% OFF para a 1ª compra: *{{cupom}}*. Veja a coleção: {{link_loja}}';
    }

    const body = renderCrmTemplate(tpl, cust, { couponCode });
    const url = buildCustomerWhatsAppUrl(cust.phone, body);
    window.open(url, '_blank', 'noopener,noreferrer');
    markCustomerContacted(cust.id, 'whatsapp', body);
    triggerRefresh();
  };

  const standaloneUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/crm` : '/crm';

  const navTabs: { id: CrmModuleView; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: Sparkles },
    {
      id: 'attention',
      label: 'Precisam de Atenção',
      icon: AlertTriangle,
      badge: attentionList.length,
    },
    { id: 'customers', label: 'Clientes 360°', icon: Users, badge: customers.length },
    {
      id: 'abandoned',
      label: 'Carrinhos & PIX Pendente',
      icon: ShoppingCart,
      badge: abandonedList.length,
    },
    {
      id: 'birthdays',
      label: 'Aniversariantes',
      icon: Cake,
      badge: summary.birthdaysThisMonthCount,
    },
    {
      id: 'automations',
      label: 'Automações & Fila',
      icon: Zap,
      badge: summary.queuedMessagesCount,
    },
    { id: 'campaigns', label: 'Campanhas', icon: Megaphone },
    { id: 'settings', label: 'Regras & Link Externo', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top CRM Banner Header */}
      <div className="bg-gradient-to-r from-[#142318] via-[#1c3022] to-[#142318] text-white p-6 rounded-3xl border border-[#2d4d38] shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-widest">
              Aura CRM 360° • Sincronizado com Compras
            </span>
            <button
              type="button"
              onClick={() => {
                setIsCloudSyncing(true);
                syncCrmFromSupabase()
                  .then((st) => setCloudStatus(st))
                  .finally(() => setIsCloudSyncing(false));
              }}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                cloudStatus.tablesReady
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-white/10 text-white/80 border-white/20'
              }`}
              title={
                cloudStatus.tablesReady
                  ? 'Conectado ao Supabase em tempo real (clique para atualizar)'
                  : 'Execute supabase/crm.sql no SQL Editor do Supabase para ativar todas as tabelas em nuvem'
              }
            >
              <RefreshCw className={`w-3 h-3 ${isCloudSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isCloudSyncing
                  ? 'Sincronizando...'
                  : cloudStatus.tablesReady
                    ? 'Supabase Conectado'
                    : 'Banco Local (rodar crm.sql)'}
              </span>
            </button>
            {!isStandalone && (
              <a
                href="/crm"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold flex items-center gap-1 transition-colors"
                title="Abrir CRM em link externo dedicado (pronto para celular e app)"
              >
                <ExternalLink className="w-3 h-3 text-amber-300" />
                <span>Abrir Link Externo (/crm)</span>
              </a>
            )}
          </div>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
            Central de Relacionamento, Retenção & Automações
          </h1>
          <p className="text-xs text-white/75 max-w-2xl">
            Monitoramento em tempo real de última compra, carrinhos não concluídos, aniversariantes com cupom automático e termômetro de atenção.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunAutomationEngine}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rodar Motor de Automações</span>
          </button>

          <button
            onClick={() => setIsNewCustomerOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {engineFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{engineFeedback}</span>
          </div>
          <button
            onClick={() => setActiveView('automations')}
            className="underline font-bold ml-4"
          >
            Ver Fila de Disparo →
          </button>
        </div>
      )}

      {/* Sub-Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {navTabs.map((t) => {
          const Icon = t.icon;
          const active = activeView === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveView(t.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all border ${
                active
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-card text-foreground/80 border-border hover:border-primary/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-primary'}`} />
              <span>{t.label}</span>
              {t.badge !== undefined && t.badge > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    active ? 'bg-white text-primary' : 'bg-primary/15 text-primary'
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          VIEW 1: OVERVIEW (DASHBOARD EXECUTIVO DO CRM)
         ===================================================================== */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveView('attention')}
              className="p-5 rounded-2xl bg-card border border-rose-500/30 shadow-sm cursor-pointer hover:border-rose-500 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
                  Precisam de Atenção Hoje
                </span>
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="font-serif font-bold text-3xl text-foreground">
                {attentionList.length} clientes
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary.atRiskCount} em risco (60+ dias) • {summary.inactiveCount} inativas
              </p>
            </div>

            <div
              onClick={() => setActiveView('abandoned')}
              className="p-5 rounded-2xl bg-card border border-orange-500/30 shadow-sm cursor-pointer hover:border-orange-500 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase">
                  Compras Não Concluídas
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>
              <div className="font-serif font-bold text-3xl text-foreground">
                {formatCurrency(summary.abandonedCartsTotalValue + summary.pendingOrdersTotalValue)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary.abandonedCartsCount} carrinho(s) • {summary.pendingOrdersCount} PIX pendente(s)
              </p>
            </div>

            <div
              onClick={() => setActiveView('birthdays')}
              className="p-5 rounded-2xl bg-card border border-pink-500/30 shadow-sm cursor-pointer hover:border-pink-500 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase">
                  Aniversariantes
                </span>
                <div className="w-9 h-9 rounded-xl bg-pink-500/15 text-pink-600 flex items-center justify-center">
                  <Cake className="w-5 h-5" />
                </div>
              </div>
              <div className="font-serif font-bold text-3xl text-foreground">
                {summary.birthdaysThisWeekCount} na semana
              </div>
              <p className="text-[11px] text-muted-foreground">
                {summary.birthdaysThisMonthCount} no mês • Cupom 15% OFF automático
              </p>
            </div>

            <div
              onClick={() => setActiveView('automations')}
              className="p-5 rounded-2xl bg-card border border-emerald-500/30 shadow-sm cursor-pointer hover:border-emerald-500 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  Receita Recuperada CRM
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="font-serif font-bold text-3xl text-emerald-600 dark:text-emerald-400">
                {currentUserRole === 'vendedor'
                  ? `${summary.sentMessagesCount} envios`
                  : formatCurrency(summary.recoveredRevenueTotal)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {automations.filter((a) => a.isActive).length} automações ativas •{' '}
                {summary.queuedMessagesCount} na fila
              </p>
            </div>
          </div>

          {/* Segment Breakdown Cards */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground">
                  Termômetro da Carteira de Clientes (Sincronizado com Pedidos)
                </h2>
                <p className="text-xs text-muted-foreground">
                  Clique em qualquer segmento para filtrar e acionar as clientes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {(Object.keys(SEGMENT_META) as CrmSegmentStatus[]).map((seg) => {
                const m = SEGMENT_META[seg];
                const stat = summary.segmentBreakdown[seg];
                return (
                  <button
                    key={seg}
                    onClick={() => {
                      setSegmentFilter(seg);
                      setActiveView('customers');
                    }}
                    className="p-3.5 rounded-2xl border border-border bg-muted/20 hover:border-primary text-left transition-all space-y-1.5"
                  >
                    <div className="text-lg">{m.emoji}</div>
                    <div className="font-serif font-bold text-xl text-foreground">{stat.count}</div>
                    <div className="text-[11px] font-bold text-foreground leading-tight">
                      {m.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Top 5 Prioridades de Contato Hoje */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-rose-500" /> Fila Prioritária: Quem Contatar Hoje
                </h2>
                <p className="text-xs text-muted-foreground">
                  Ordenada pelo Score de Atenção (pagamentos pendentes, carrinhos abandonados, aniversariantes e clientes sumidas).
                </p>
              </div>
              <button
                onClick={() => setActiveView('attention')}
                className="text-xs text-primary font-bold hover:underline"
              >
                Ver todas ({attentionList.length}) →
              </button>
            </div>

            <div className="divide-y divide-border">
              {attentionList.slice(0, 6).map((c) => {
                const m = SEGMENT_META[c.crmStatus];
                return (
                  <div
                    key={c.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="font-serif font-bold text-sm text-foreground hover:text-primary"
                        >
                          {c.name}
                        </button>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${m.badgeClass}`}
                        >
                          {m.emoji} {m.label}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600">
                          Score {c.attentionScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-foreground font-medium">{c.attentionReason}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Última compra:{' '}
                        {c.daysSinceLastPurchase !== null
                          ? `há ${c.daysSinceLastPurchase} dia(s) (${formatDate(c.lastOrderDate!)})`
                          : 'Ainda não comprou'}{' '}
                        • Total gasto: <strong className="text-primary">{formatCurrency(c.totalSpent)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOneClickAction(c)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Acionar no WhatsApp</span>
                      </button>
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ficha 360°</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 2: PRECISA DE ATENÇÃO (TERMÔMETRO COMPLETO)
         ===================================================================== */}
      {activeView === 'attention' && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" /> Clientes que Precisam de Atenção ({attentionList.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Clientes com compra não concluída, aniversário próximo, mais de 60 dias sem comprar ou sinalizadas manualmente.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {attentionList.map((c) => {
              const m = SEGMENT_META[c.crmStatus];
              return (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl border border-border bg-muted/20 hover:border-primary/40 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${
                          c.attentionScore >= 85
                            ? 'bg-rose-600 text-white'
                            : 'bg-amber-500/20 text-amber-600 dark:text-amber-300'
                        }`}
                      >
                        Termômetro: {c.attentionScore}%
                      </span>
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="font-serif font-bold text-base text-foreground hover:text-primary"
                      >
                        {c.name}
                      </button>
                      <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${m.badgeClass}`}>
                        {m.emoji} {m.label}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-foreground">{c.attentionReason}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Sugestão:</strong> {c.recommendedAction} •{' '}
                      <strong>Última compra:</strong>{' '}
                      {c.daysSinceLastPurchase !== null
                        ? `há ${c.daysSinceLastPurchase} dias`
                        : 'Nenhuma compra paga'}{' '}
                      • <strong>Tamanho:</strong> {c.preferredSizes.join(', ')}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOneClickAction(c)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Mensagem Pronta</span>
                    </button>
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3.5 py-2.5 rounded-xl bg-card border border-border hover:border-primary text-foreground font-semibold text-xs"
                    >
                      Abrir Ficha 360°
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 3: BASE COMPLETA DE CLIENTES 360°
         ===================================================================== */}
      {activeView === 'customers' && (
        <div className="space-y-4">
          {/* Search & Segment Filter Bar */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar por nome, e-mail, WhatsApp, CPF ou tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-card border border-border rounded-2xl pl-10 pr-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSegmentFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                  segmentFilter === 'all'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                Todas ({customers.length})
              </button>
              {(Object.keys(SEGMENT_META) as CrmSegmentStatus[]).map((seg) => (
                <button
                  key={seg}
                  onClick={() => setSegmentFilter(seg)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                    segmentFilter === seg
                      ? 'bg-primary text-white border-primary'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {SEGMENT_META[seg].emoji} {SEGMENT_META[seg].label}
                </button>
              ))}
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 text-foreground font-bold border-b border-border">
                  <tr>
                    <th className="p-3.5">Cliente</th>
                    <th className="p-3.5">Status CRM & Termômetro</th>
                    <th className="p-3.5">Aniversário</th>
                    <th className="p-3.5">Última Compra</th>
                    <th className="p-3.5">Pedidos / Total</th>
                    <th className="p-3.5">Tam.</th>
                    <th className="p-3.5 text-right">Ações Rápidas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCustomers.map((c) => {
                    const m = SEGMENT_META[c.crmStatus];
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => setSelectedCustomer(c)}
                      >
                        <td className="p-3.5">
                          <div className="font-serif font-bold text-sm text-foreground flex items-center gap-1.5">
                            <span>{c.name}</span>
                            {c.needsManualAttention && (
                              <span title="Atenção manual marcada">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {c.email} {c.phone ? `• ${c.phone}` : ''}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${m.badgeClass}`}
                          >
                            {m.emoji} {m.label}
                          </span>
                          <div className="text-[10px] text-muted-foreground mt-1 truncate max-w-[230px]">
                            Score {c.attentionScore}/100 • {c.attentionReason}
                          </div>
                        </td>

                        <td className="p-3.5">
                          {c.birthDate ? (
                            <div className="space-y-0.5">
                              <span className="font-bold text-foreground flex items-center gap-1">
                                <Cake className="w-3.5 h-3.5 text-pink-500" />
                                {c.birthDate.split('-').reverse().slice(0, 2).join('/')}
                              </span>
                              {c.daysUntilBirthday !== null && c.daysUntilBirthday !== undefined && (
                                <span
                                  className={`text-[10px] font-bold ${
                                    c.isBirthdayWeek ? 'text-pink-600 dark:text-pink-400' : 'text-muted-foreground'
                                  }`}
                                >
                                  {c.daysUntilBirthday === 0
                                    ? '🎉 É HOJE!'
                                    : `Faltam ${c.daysUntilBirthday}d`}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic">Não informado</span>
                          )}
                        </td>

                        <td className="p-3.5">
                          {c.daysSinceLastPurchase !== null ? (
                            <div>
                              <span
                                className={`font-bold ${
                                  c.daysSinceLastPurchase >= 60
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-foreground'
                                }`}
                              >
                                Há {c.daysSinceLastPurchase} dia(s)
                              </span>
                              {c.lastOrderDate && (
                                <div className="text-[10px] text-muted-foreground">
                                  {formatDate(c.lastOrderDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                              Nunca comprou
                            </span>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="font-serif font-bold text-primary">
                            {formatCurrency(c.totalSpent)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {c.paidOrdersCount} pago(s) • Ticket {formatCurrency(c.averageTicket)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-md bg-muted font-bold">
                            {c.preferredSizes[0] || 'M'}
                          </span>
                        </td>

                        <td
                          className="p-3.5 text-right space-x-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleOneClickAction(c)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] inline-flex items-center gap-1"
                            title="Enviar mensagem contextualizada no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                          </button>
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-[11px]"
                          >
                            Ficha 360°
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 4: CARRINHOS ABANDONADOS & PIX / PAGAMENTOS PENDENTES
         ===================================================================== */}
      {activeView === 'abandoned' && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" /> Recuperação de Compras Não Concluídas ({abandonedList.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              Sincronizado com o carrinho da loja e com pedidos pendentes (PIX / Boleto / Cartão não concluído).
            </p>
          </div>

          {abandonedList.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-xs">
              Nenhum carrinho abandonado ou pagamento pendente no momento.
            </div>
          ) : (
            <div className="space-y-4">
              {abandonedList.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-orange-500/30 bg-orange-500/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-serif font-bold text-base text-foreground">
                        {c.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({c.email} • {c.phone})
                      </span>
                      {c.pendingOrdersCount > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[11px]">
                          ⏳ Pedido Pendente ({formatCurrency(c.pendingAmount)})
                        </span>
                      )}
                      {c.hasAbandonedCart && (
                        <span className="px-2.5 py-0.5 rounded-full bg-orange-600 text-white font-bold text-[11px]">
                          🛒 Carrinho Abandonado ({formatCurrency(c.abandonedCartValue)})
                        </span>
                      )}
                    </div>

                    {c.activeCart && (
                      <div className="flex flex-wrap gap-2">
                        {c.activeCart.items.map((it, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-xl bg-card border border-border text-xs font-semibold"
                          >
                            {it.quantity}x {it.productName} ({it.size} - {it.colorName}) •{' '}
                            {formatCurrency(it.price * it.quantity)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOneClickAction(c)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Recuperar Compra no WhatsApp (+ Cupom)</span>
                    </button>
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3.5 py-2.5 rounded-xl bg-card border border-border text-xs font-semibold"
                    >
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 5: ANIVERSARIANTES & CUPOM PRESENTE AUTOMÁTICO
         ===================================================================== */}
      {activeView === 'birthdays' && (
        <div className="bg-card border border-border rounded-3xl p-6 space-y-5">
          <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-serif font-bold text-xl text-foreground flex items-center gap-2">
                <Cake className="w-5 h-5 text-pink-500" /> Calendário de Aniversariantes ({birthdayList.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Ao clicar em "Enviar Presente 15% OFF", o CRM cria automaticamente o cupom nominal na loja e abre o WhatsApp da cliente.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {birthdayList.map((c) => {
              const dayMonth = c.birthDate
                ? c.birthDate.split('-').reverse().slice(0, 2).join('/')
                : '--/--';
              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                    c.isBirthdayToday
                      ? 'border-pink-500 bg-pink-500/10'
                      : c.isBirthdayWeek
                        ? 'border-pink-500/40 bg-pink-500/5'
                        : 'border-border bg-muted/20'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-foreground">
                        {c.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-600 dark:text-pink-300 font-bold text-xs">
                        🎂 {dayMonth}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.daysUntilBirthday === 0
                        ? '🎉 Faz aniversário HOJE!'
                        : `Faltam ${c.daysUntilBirthday} dia(s)`}{' '}
                      • Tam. {c.preferredSizes[0] || 'M'} • Gasto: {formatCurrency(c.totalSpent)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleOneClickAction(c)}
                    className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
                  >
                    <Cake className="w-3.5 h-3.5" />
                    <span>Enviar Presente 15% OFF</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 6: AUTOMAÇÕES & FILA DE MENSAGENS PROGRAMADAS
         ===================================================================== */}
      {activeView === 'automations' && (
        <div className="space-y-6">
          {/* Queue Section */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" /> Fila de Mensagens Programadas ({messageQueue.length})
                </h2>
                <p className="text-xs text-muted-foreground">
                  Mensagens geradas pelas regras de automação (com variáveis substituídas e cupom ativo). Se a cliente comprar antes do envio, a mensagem é cancelada sozinha.
                </p>
              </div>
              <button
                onClick={handleRunAutomationEngine}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Verificar Novos Gatilhos Agora
              </button>
            </div>

            {messageQueue.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                Nenhuma mensagem na fila. Clique em "Verificar Novos Gatilhos Agora" para gerar os disparos das clientes elegíveis.
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {messageQueue.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{m.customerName}</span>
                        <span className="text-xs text-muted-foreground">({m.customerPhone || m.customerEmail})</span>
                        <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-bold text-[10px]">
                          {m.automationName || 'Automação'}
                        </span>
                        {m.couponCode && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-600 font-mono font-bold text-[10px]">
                            Cupom: {m.couponCode}
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            m.status === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : m.status === 'cancelled'
                                ? 'bg-rose-500/15 text-rose-600'
                                : 'bg-amber-500/15 text-amber-600'
                          }`}
                        >
                          {m.status === 'ready_manual' ? 'Pronta p/ Disparo' : m.status}
                        </span>
                      </div>
                      <p className="text-xs text-foreground bg-card p-2.5 rounded-xl border border-border">
                        {m.body}
                      </p>
                    </div>

                    {(m.status === 'pending' || m.status === 'ready_manual') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            await dispatchQueuedMessage(m.id, true);
                            triggerRefresh();
                          }}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" /> Disparar Agora
                        </button>
                        <button
                          onClick={() => {
                            cancelQueuedMessage(m.id);
                            triggerRefresh();
                          }}
                          className="p-2 rounded-xl bg-muted hover:text-destructive text-muted-foreground"
                          title="Cancelar envio"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Automation Rules Grid */}
          <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
            <div>
              <h2 className="font-serif font-bold text-lg text-foreground">
                Regras de Mensagens Automáticas ({automations.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Ative/desative ou personalize o texto e o cupom de cada gatilho. Variáveis disponíveis:{' '}
                <code className="text-primary font-mono">
                  {'{{primeiro_nome}} {{produto_principal}} {{cupom}} {{dias_sem_comprar}} {{tamanho_preferido}} {{numero_pedido}} {{link_carrinho}}'}
                </code>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {automations.map((rule) => (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    rule.isActive
                      ? 'border-border bg-muted/20'
                      : 'border-border/50 bg-muted/5 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-base text-foreground">
                        {rule.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">{rule.description}</p>
                    </div>
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => {
                          saveCrmAutomation({ ...rule, isActive: e.target.checked });
                          triggerRefresh();
                        }}
                        className="accent-primary w-4 h-4"
                      />
                    </label>
                  </div>

                  <div className="p-3 rounded-xl bg-card border border-border text-xs text-foreground/90 whitespace-pre-line">
                    {rule.template}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase">
                        {rule.channel}
                      </span>
                      {rule.autoCouponPrefix && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 font-bold">
                          Cupom: {rule.autoCouponPrefix} ({rule.autoCouponDiscount}% OFF)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="text-primary font-bold hover:underline"
                    >
                      Editar Mensagem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal to Edit Automation Template */}
          {editingRule && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-3xl max-w-lg w-full p-6 space-y-4 text-xs">
                <h3 className="font-serif font-bold text-lg text-foreground">
                  Editar Automação: {editingRule.name}
                </h3>
                <div>
                  <label className="block font-semibold mb-1">Canal de Envio</label>
                  <select
                    value={editingRule.channel}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, channel: e.target.value as any })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="both">WhatsApp + E-mail</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Prefixo do Cupom</label>
                    <input
                      type="text"
                      value={editingRule.autoCouponPrefix || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, autoCouponPrefix: e.target.value })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">% Desconto</label>
                    <input
                      type="number"
                      value={editingRule.autoCouponDiscount || 0}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          autoCouponDiscount: Number(e.target.value),
                        })
                      }
                      className="w-full bg-background border border-border rounded-xl px-3.5 py-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Template da Mensagem</label>
                  <textarea
                    rows={5}
                    value={editingRule.template}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, template: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl p-3"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2 rounded-xl bg-muted font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      saveCrmAutomation(editingRule);
                      setEditingRule(null);
                      triggerRefresh();
                    }}
                    className="px-5 py-2 rounded-xl bg-primary text-white font-bold"
                  >
                    Salvar Automação
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          VIEW 7: CAMPANHAS POR SEGMENTO
         ===================================================================== */}
      {activeView === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 space-y-4 text-xs">
            <h2 className="font-serif font-bold text-lg text-foreground flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" /> Criar Campanha Segmentada
            </h2>

            {campCreatedNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">
                {campCreatedNotice}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Nome da Campanha *</label>
                <input
                  type="text"
                  placeholder="Ex: Esquenta Coleção Verão VIP"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Público / Segmento</label>
                  <select
                    value={campSegment}
                    onChange={(e) => setCampSegment(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5"
                  >
                    <option value="all">Toda a Base ({customers.length})</option>
                    {(Object.keys(SEGMENT_META) as CrmSegmentStatus[]).map((seg) => (
                      <option key={seg} value={seg}>
                        {SEGMENT_META[seg].emoji} {SEGMENT_META[seg].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Canal</label>
                  <select
                    value={campChannel}
                    onChange={(e) => setCampChannel(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5"
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">E-mail</option>
                    <option value="both">WhatsApp + E-mail</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Cupom da Campanha</label>
                  <input
                    type="text"
                    value={campCoupon}
                    onChange={(e) => setCampCoupon(e.target.value.toUpperCase())}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Mensagem Personalizada</label>
                <textarea
                  rows={4}
                  value={campTemplate}
                  onChange={(e) => setCampTemplate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3"
                />
              </div>

              <button
                onClick={() => {
                  if (!campName.trim()) return;
                  if (campCoupon) {
                    ensureAutomationCouponInStore(campCoupon, 15);
                  }
                  const created = createAndQueueCampaign({
                    name: campName.trim(),
                    segment: campSegment,
                    channel: campChannel,
                    messageTemplate: campTemplate,
                    couponCode: campCoupon || undefined,
                  });
                  setCampName('');
                  setCampCreatedNotice(
                    `Campanha "${created.name}" gerada com ${created.recipientsCount} mensagens na fila de disparo!`
                  );
                  triggerRefresh();
                }}
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4" /> Gerar Disparos da Campanha
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 bg-card border border-border rounded-3xl p-6 space-y-4 text-xs">
            <h3 className="font-serif font-bold text-lg text-foreground">
              Campanhas Disparadas ({campaigns.length})
            </h3>
            {campaigns.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma campanha criada ainda.</p>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-border bg-muted/20 space-y-1">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{c.name}</span>
                      <span className="text-primary">{c.recipientsCount} clientes</span>
                    </div>
                    <p className="text-muted-foreground line-clamp-2">{c.messageTemplate}</p>
                    <div className="text-[10px] text-muted-foreground pt-1">
                      Segmento: {c.segment} • Cupom: {c.couponCode || 'N/A'} • {formatDate(c.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW 8: CONFIGURAÇÕES, LINK EXTERNO & FUTURO APP
         ===================================================================== */}
      {activeView === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Standalone Link & Mobile App Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-primary/40 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-foreground">
                    Acesso Externo & App Mobile
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Acesse o CRM direto sem passar pela loja virtual.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Link Externo Direto do CRM:
                </span>
                <div className="flex items-center justify-between gap-2 bg-background p-2.5 rounded-xl border border-border font-mono text-xs">
                  <span className="truncate">{standaloneUrl}</span>
                  <a
                    href="/crm"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-lg bg-primary text-white font-sans font-bold text-[11px] shrink-0"
                  >
                    Abrir
                  </a>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Também responde automaticamente caso você aponte um subdomínio{' '}
                  <code className="text-primary font-bold">crm.seudominio.com.br</code> na Vercel. No celular, basta clicar em "Adicionar à Tela de Início" para usar como App.
                </p>
              </div>

              {/* Equipe do CRM */}
              <div className="pt-3 border-t border-border space-y-3">
                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Equipe com Acesso ao Link Externo (/crm)
                </h4>

                <div className="space-y-2">
                  {teamUsers.map((u) => (
                    <div
                      key={u.id}
                      className="p-2.5 rounded-xl bg-muted/30 border border-border flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-foreground">{u.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {u.email} • Papel: <strong className="uppercase text-primary">{u.role}</strong>
                        </div>
                      </div>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => {
                            removeCrmTeamUser(u.id);
                            triggerRefresh();
                          }}
                          className="text-destructive hover:underline text-[11px]"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nome da vendedora"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="bg-background border border-border rounded-xl px-2.5 py-2"
                  />
                  <input
                    type="email"
                    placeholder="email@aura.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="bg-background border border-border rounded-xl px-2.5 py-2"
                  />
                  <button
                    onClick={() => {
                      if (!newMemberName.trim() || !newMemberEmail.trim()) return;
                      saveCrmTeamUser({
                        name: newMemberName.trim(),
                        email: newMemberEmail.trim(),
                        role: newMemberRole,
                        isActive: true,
                      });
                      setNewMemberName('');
                      setNewMemberEmail('');
                      triggerRefresh();
                    }}
                    className="bg-primary text-white font-bold rounded-xl px-3 py-2"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CRM Thresholds & API Providers */}
          <div className="lg:col-span-7 bg-card border border-border rounded-3xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-foreground">
              Critérios do Termômetro de Atenção & Provedores de Disparo
            </h3>

            {settingsSaved && (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                Configurações do CRM salvas e recalculadas!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1">Dias p/ "Em Risco" (Alerta)</label>
                <input
                  type="number"
                  value={settingsState.atRiskDays}
                  onChange={(e) =>
                    setSettingsState({ ...settingsState, atRiskDays: Number(e.target.value) })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Dias p/ "Inativa"</label>
                <input
                  type="number"
                  value={settingsState.inactiveDays}
                  onChange={(e) =>
                    setSettingsState({ ...settingsState, inactiveDays: Number(e.target.value) })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Gasto Mínimo VIP (R$)</label>
                <input
                  type="number"
                  value={settingsState.vipMinSpent}
                  onChange={(e) =>
                    setSettingsState({ ...settingsState, vipMinSpent: Number(e.target.value) })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Pedidos Mínimos VIP</label>
                <input
                  type="number"
                  value={settingsState.vipMinOrders}
                  onChange={(e) =>
                    setSettingsState({ ...settingsState, vipMinOrders: Number(e.target.value) })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Minutos p/ Carrinho Abandonado</label>
                <input
                  type="number"
                  value={settingsState.abandonedCartMinutes}
                  onChange={(e) =>
                    setSettingsState({
                      ...settingsState,
                      abandonedCartMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">% Desconto Cupom Aniversário</label>
                <input
                  type="number"
                  value={settingsState.birthdayDiscountPercent}
                  onChange={(e) =>
                    setSettingsState({
                      ...settingsState,
                      birthdayDiscountPercent: Number(e.target.value),
                    })
                  }
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border space-y-3">
              <h4 className="font-bold text-foreground">
                Modo de Envio de WhatsApp & E-mail Automático
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Provedor WhatsApp</label>
                  <select
                    value={settingsState.whatsappProvider}
                    onChange={(e) =>
                      setSettingsState({
                        ...settingsState,
                        whatsappProvider: e.target.value as any,
                      })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  >
                    <option value="manual_1click">WhatsApp 1-Clique (Grátis / Sem API)</option>
                    <option value="zapi">Z-API (Disparo 100% Automático em Background)</option>
                    <option value="evolution">Evolution API (Disparo Automático)</option>
                    <option value="meta_cloud">Meta WhatsApp Cloud API Oficial</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1">URL da Instância WhatsApp (opcional)</label>
                  <input
                    type="text"
                    placeholder="https://api.z-api.io/instances/.../token/.../send-text"
                    value={settingsState.whatsappApiUrl || ''}
                    onChange={(e) =>
                      setSettingsState({ ...settingsState, whatsappApiUrl: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Token WhatsApp API (opcional)</label>
                  <input
                    type="password"
                    placeholder="Client-Token / ApiKey"
                    value={settingsState.whatsappApiToken || ''}
                    onChange={(e) =>
                      setSettingsState({ ...settingsState, whatsappApiToken: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Resend API Key (E-mail Automático)</label>
                  <input
                    type="password"
                    placeholder="re_xxxxxxxxx"
                    value={settingsState.resendApiKey || ''}
                    onChange={(e) =>
                      setSettingsState({ ...settingsState, resendApiKey: e.target.value })
                    }
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                saveCrmSettings(settingsState);
                setSettingsSaved(true);
                setTimeout(() => setSettingsSaved(false), 3000);
                triggerRefresh();
              }}
              className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold shadow-md"
            >
              Salvar Regras e Integrações
            </button>
          </div>
        </div>
      )}

      {/* Drawer Ficha 360° & Modal Novo Cliente */}
      <Customer360Drawer
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onUpdated={triggerRefresh}
      />

      <NewCustomerModal
        isOpen={isNewCustomerOpen}
        onClose={() => setIsNewCustomerOpen(false)}
        onSaved={triggerRefresh}
      />
    </div>
  );
};
