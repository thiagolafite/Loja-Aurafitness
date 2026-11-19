import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Cake,
  ShoppingBag,
  MapPin,
  Tag,
  AlertTriangle,
  MessageCircle,
  Send,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
  User,
  Calendar,
  Award,
  Heart,
  FileText,
  Save,
} from 'lucide-react';
import { CrmCustomer360 } from '../types';
import {
  addCrmNote,
  buildCustomerWhatsAppUrl,
  ensureAutomationCouponInStore,
  markCustomerContacted,
  renderCrmTemplate,
  toggleCustomerManualAttention,
  upsertCrmCustomer,
} from '../services/crmService';
import { formatCurrency, formatDate, formatCPF, formatPhone } from '../../lib/utils';

interface Customer360DrawerProps {
  customer: CrmCustomer360 | null;
  onClose: () => void;
  onUpdated: () => void;
}

export const SEGMENT_META: Record<
  CrmCustomer360['crmStatus'],
  { label: string; badgeClass: string; emoji: string }
> = {
  pagamento_pendente: {
    label: 'Pagamento Pendente',
    badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/30',
    emoji: '⏳',
  },
  carrinho_abandonado: {
    label: 'Carrinho Abandonado',
    badgeClass: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
    emoji: '🛒',
  },
  aniversariante: {
    label: 'Aniversariante',
    badgeClass: 'bg-pink-500/15 text-pink-600 dark:text-pink-300 border-pink-500/30',
    emoji: '🎂',
  },
  em_risco: {
    label: 'Em Risco (60+ dias)',
    badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/30',
    emoji: '⚠️',
  },
  inativo: {
    label: 'Inativa (120+ dias)',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
    emoji: '💤',
  },
  vip: {
    label: 'Cliente VIP',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
    emoji: '💎',
  },
  ativo: {
    label: 'Ativa',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    emoji: '✅',
  },
  novo: {
    label: 'Nova (Sem Compra)',
    badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30',
    emoji: '🆕',
  },
};

export const Customer360Drawer: React.FC<Customer360DrawerProps> = ({
  customer,
  onClose,
  onUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'notes' | 'edit'>('overview');
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState<'note' | 'whatsapp' | 'call' | 'follow_up'>('note');
  const [followUpDate, setFollowUpDate] = useState('');
  const [newTag, setNewTag] = useState('');

  // Edit profile state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCpf, setEditCpf] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editOrigin, setEditOrigin] = useState<CrmCustomer360['origin']>('site');
  const [editOptinWhatsapp, setEditOptinWhatsapp] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (customer) {
      setEditName(customer.name || '');
      setEditEmail(customer.email || '');
      setEditPhone(customer.phone || '');
      setEditCpf(customer.cpf || '');
      setEditBirthDate(customer.birthDate || '');
      setEditOrigin(customer.origin || 'site');
      setEditOptinWhatsapp(customer.optinWhatsapp ?? true);
    }
  }, [customer]);

  if (!customer) return null;

  const meta = SEGMENT_META[customer.crmStatus];

  const handleQuickWhatsApp = (presetType: 'smart' | 'birthday' | 'cart' | 'pix' | 'winback') => {
    let tpl = '';
    let couponCode: string | undefined;

    if (presetType === 'birthday') {
      couponCode = ensureAutomationCouponInStore('NIVER15', 15, customer.name);
      tpl =
        'Parabéns, {{primeiro_nome}}! 🎂🥂 Desejamos muita saúde e treinos incríveis! Preparamos seu cupom presente de 15% OFF na Aura Fitness: *{{cupom}}*. Vem escolher seu look: {{link_loja}}';
    } else if (presetType === 'cart') {
      couponCode = ensureAutomationCouponInStore('VOLTA7', 7, customer.name);
      tpl =
        'Oi {{primeiro_nome}}! Vi que você deixou *{{produto_principal}}* no carrinho da Aura Fitness. Posso te ajudar com tamanho ou frete? Liberei o cupom *{{cupom}}* (7% OFF) pra você finalizar agora: {{link_carrinho}}';
    } else if (presetType === 'pix') {
      tpl =
        'Oi {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* (R$ {{valor_pedido}}) já está separado aqui na Aura Fitness aguardando pagamento. Quer que eu te envie o código PIX Copia e Cola por aqui?';
    } else if (presetType === 'winback') {
      couponCode = ensureAutomationCouponInStore('SAUDADE12', 12, customer.name);
      tpl =
        'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última compra na Aura Fitness e chegaram peças lindas no seu tamanho *{{tamanho_preferido}}*! Use o cupom *{{cupom}}* (12% OFF): {{link_loja}}';
    } else {
      tpl =
        'Oi {{primeiro_nome}}, tudo bem? Aqui é da Aura Fitness! 🖤 Passando para saber se precisa de ajuda para escolher seu próximo look no tamanho {{tamanho_preferido}}.';
    }

    const msg = renderCrmTemplate(tpl, customer, { couponCode });
    const url = buildCustomerWhatsAppUrl(customer.phone, msg);
    window.open(url, '_blank', 'noopener,noreferrer');
    markCustomerContacted(customer.id, 'whatsapp', msg);
    onUpdated();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    addCrmNote({
      customerId: customer.id,
      customerEmail: customer.email,
      authorName: 'Equipe CRM',
      type: noteType,
      content: noteText.trim(),
      followUpDate: followUpDate || undefined,
    });
    setNoteText('');
    setFollowUpDate('');
    onUpdated();
  };

  const handleAddTag = () => {
    const clean = newTag.trim();
    if (!clean) return;
    const nextTags = Array.from(new Set([...(customer.tags || []), clean]));
    upsertCrmCustomer({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      tags: nextTags,
    });
    setNewTag('');
    onUpdated();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const nextTags = (customer.tags || []).filter((t) => t !== tagToRemove);
    upsertCrmCustomer({
      id: customer.id,
      email: customer.email,
      name: customer.name,
      tags: nextTags,
    });
    onUpdated();
  };

  const handleSaveProfileEdit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertCrmCustomer({
      id: customer.id,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: formatPhone(editPhone),
      cpf: formatCPF(editCpf),
      birthDate: editBirthDate || undefined,
      origin: editOrigin,
      optinWhatsapp: editOptinWhatsapp,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-card border-l border-border w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-6 border-b border-border bg-muted/30 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-white font-serif font-bold text-xl flex items-center justify-center shrink-0 shadow-md">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-serif font-bold text-xl text-foreground">{customer.name}</h2>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeClass}`}>
                  {meta.emoji} {meta.label}
                </span>
                {customer.needsManualAttention && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Atenção Prioritária
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-primary" /> {customer.email}
                </span>
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-primary" /> {customer.phone}
                  </span>
                )}
                {customer.birthDate && (
                  <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400 font-semibold">
                    <Cake className="w-3.5 h-3.5" />
                    Niver: {customer.birthDate.split('-').reverse().slice(0, 2).join('/')}
                    {customer.daysUntilBirthday !== null && customer.daysUntilBirthday !== undefined && (
                      <span>
                        ({customer.daysUntilBirthday === 0 ? 'HOJE! 🎉' : `em ${customer.daysUntilBirthday}d`})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar (1-Click WhatsApp & Attention Toggle) */}
        <div className="px-6 py-3 bg-background border-b border-border flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                handleQuickWhatsApp(
                  customer.pendingOrdersCount > 0
                    ? 'pix'
                    : customer.hasAbandonedCart
                      ? 'cart'
                      : customer.isBirthdayWeek
                        ? 'birthday'
                        : customer.crmStatus === 'em_risco' || customer.crmStatus === 'inativo'
                          ? 'winback'
                          : 'smart'
                )
              }
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Inteligente (1-Clique)</span>
            </button>

            {customer.birthDate && (
              <button
                onClick={() => handleQuickWhatsApp('birthday')}
                className="px-3 py-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-600 dark:text-pink-300 border border-pink-500/30 font-semibold text-xs flex items-center gap-1 transition-colors"
              >
                <Cake className="w-3.5 h-3.5" />
                <span>Enviar Presente Aniversário</span>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              toggleCustomerManualAttention(customer.id, !customer.needsManualAttention);
              onUpdated();
            }}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              customer.needsManualAttention
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
                : 'bg-muted/60 border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{customer.needsManualAttention ? 'Remover Alerta' : 'Marcar Atenção'}</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-border flex gap-4 text-xs font-bold bg-card">
          {[
            { id: 'overview', label: 'Visão 360° & Termômetro' },
            { id: 'orders', label: `Compras & Carrinho (${customer.orders.length})` },
            { id: 'notes', label: `Anotações & Timeline (${customer.notes.length})` },
            { id: 'edit', label: 'Editar Cadastro / Aniversário' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3.5 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 text-xs">
          {activeTab === 'overview' && (
            <>
              {/* Termômetro de Atenção */}
              <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Diagnóstico do Termômetro de Atenção
                  </span>
                  <span className="font-serif font-bold text-sm text-foreground">
                    Score: {customer.attentionScore}/100
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      customer.attentionScore >= 85
                        ? 'bg-rose-500'
                        : customer.attentionScore >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                    }`}
                    style={{ width: `${customer.attentionScore}%` }}
                  />
                </div>
                <p className="text-foreground font-semibold">{customer.attentionReason}</p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">Ação Recomendada:</strong> {customer.recommendedAction}
                </p>
              </div>

              {/* KPIs de Compras Sincronizados */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Total Gasto (LTV)</span>
                  <span className="font-serif font-bold text-lg text-primary mt-0.5 block">
                    {formatCurrency(customer.totalSpent)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Pedidos Pagos</span>
                  <span className="font-serif font-bold text-lg text-foreground mt-0.5 block">
                    {customer.paidOrdersCount} pedido(s)
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Ticket Médio</span>
                  <span className="font-serif font-bold text-lg text-foreground mt-0.5 block">
                    {formatCurrency(customer.averageTicket)}
                  </span>
                </div>
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
                  <span className="text-[11px] text-muted-foreground block">Última Compra</span>
                  <span className="font-serif font-bold text-sm text-foreground mt-0.5 block">
                    {customer.daysSinceLastPurchase !== null
                      ? `Há ${customer.daysSinceLastPurchase} dia(s)`
                      : 'Nunca comprou'}
                  </span>
                  {customer.lastOrderDate && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(customer.lastOrderDate)}
                    </span>
                  )}
                </div>
              </div>

              {/* Carrinho Abandonado / Ativo */}
              {customer.activeCart && customer.activeCart.items.length > 0 && (
                <div className="p-4 rounded-2xl border border-orange-500/40 bg-orange-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-600 dark:text-orange-300 flex items-center gap-1.5">
                      <ShoppingBag className="w-4 h-4" /> Carrinho Não Concluído (
                      {formatCurrency(customer.activeCart.total)})
                    </span>
                    <button
                      onClick={() => handleQuickWhatsApp('cart')}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Recuperar no WhatsApp
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customer.activeCart.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-card p-2.5 rounded-xl border border-border"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-bold text-foreground">{item.productName}</div>
                            <div className="text-[11px] text-muted-foreground">
                              Tam: {item.size} • Cor: {item.colorName} • Qtd: {item.quantity}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-primary">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferências de Tamanho, Cor e Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-primary" /> Preferências de Compra
                  </h4>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold">
                      Tamanhos: {customer.preferredSizes.join(', ') || 'M'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold">
                      Cores: {customer.preferredColors.join(', ') || 'Preto'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-muted font-semibold uppercase">
                      Origem: {customer.origin}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-border bg-card space-y-2">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-primary" /> Tags da Cliente
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {customer.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-semibold flex items-center gap-1"
                      >
                        {t}
                        <button
                          onClick={() => handleRemoveTag(t)}
                          className="hover:text-destructive ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="Nova tag (ex: Influencer, Ama Legging)"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 bg-background border border-border rounded-xl px-2.5 py-1.5 text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Endereço Principal */}
              {customer.addresses.length > 0 && (
                <div className="p-4 rounded-2xl border border-border bg-card space-y-1">
                  <h4 className="font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> Endereço de Entrega
                  </h4>
                  <p className="text-muted-foreground">
                    {customer.addresses[0].street}, {customer.addresses[0].number}{' '}
                    {customer.addresses[0].complement ? `(${customer.addresses[0].complement})` : ''} —{' '}
                    {customer.addresses[0].neighborhood}, {customer.addresses[0].city}/
                    {customer.addresses[0].state} • CEP {customer.addresses[0].cep}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-base text-foreground">
                Histórico Sincronizado de Pedidos ({customer.orders.length})
              </h3>
              {customer.orders.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-border text-center text-muted-foreground">
                  Nenhum pedido registrado ainda para este e-mail/CPF.
                </div>
              ) : (
                customer.orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                      <div>
                        <span className="font-bold text-sm text-foreground">
                          Pedido #{ord.orderNumber}
                        </span>
                        <span className="text-muted-foreground ml-2">
                          {formatDate(ord.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                            ord.status === 'pago' || ord.status === 'entregue'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : ord.status === 'pendente'
                                ? 'bg-amber-500/15 text-amber-600'
                                : 'bg-rose-500/15 text-rose-600'
                          }`}
                        >
                          {ord.status}
                        </span>
                        <span className="font-serif font-bold text-sm text-primary">
                          {formatCurrency(ord.totals.total)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {ord.items.map((it, i) => (
                        <div key={i} className="flex justify-between text-muted-foreground">
                          <span>
                            {it.quantity}x {it.productName} ({it.size} / {it.colorName})
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatCurrency(it.total)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {ord.status === 'pendente' && (
                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => handleQuickWhatsApp('pix')}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> Cobrar Pagamento Pendente no WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddNote}
                className="p-4 rounded-2xl border border-border bg-muted/20 space-y-3"
              >
                <h4 className="font-bold text-foreground">Registrar Atendimento ou Anotação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={noteType}
                    onChange={(e) => setNoteType(e.target.value as any)}
                    className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="note">📝 Anotação Interna</option>
                    <option value="whatsapp">💬 Atendimento WhatsApp</option>
                    <option value="call">📞 Ligação</option>
                    <option value="follow_up">⏰ Agendar Retorno (Follow-up)</option>
                  </select>
                  {noteType === 'follow_up' && (
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  )}
                </div>
                <textarea
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Ex: Cliente pediu para avisar quando chegar legging marrom tamanho M..."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Salvar Registro
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="font-bold text-foreground">Histórico de Anotações e Contatos</h4>
                {customer.notes.length === 0 ? (
                  <p className="text-muted-foreground">Nenhuma anotação registrada ainda.</p>
                ) : (
                  customer.notes.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-2xl border border-border bg-card space-y-1"
                    >
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span className="font-bold text-primary uppercase">{n.type}</span>
                        <span>{formatDate(n.createdAt)}</span>
                      </div>
                      <p className="text-foreground whitespace-pre-line">{n.content}</p>
                      {n.followUpDate && (
                        <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          Retornar em: {n.followUpDate}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <form onSubmit={handleSaveProfileEdit} className="space-y-4">
              {savedNotice && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Dados e aniversário da cliente atualizados!
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">E-mail *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhone(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">CPF</label>
                  <input
                    type="text"
                    value={editCpf}
                    onChange={(e) => setEditCpf(formatCPF(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-pink-600 dark:text-pink-400">
                    🎂 Data de Aniversário
                  </label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full bg-background border border-pink-500/40 rounded-xl px-3.5 py-2.5"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Canal de Origem</label>
                  <select
                    value={editOrigin}
                    onChange={(e) => setEditOrigin(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5"
                  >
                    <option value="site">Site / Loja Virtual</option>
                    <option value="instagram">Instagram (@adoro.aura)</option>
                    <option value="whatsapp">WhatsApp Direto</option>
                    <option value="indicacao">Indicação de Amiga</option>
                    <option value="google">Google</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={editOptinWhatsapp}
                  onChange={(e) => setEditOptinWhatsapp(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span>Autoriza receber mensagens automáticas e cupons no WhatsApp (Opt-in LGPD)</span>
              </label>

              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" /> Salvar Ficha da Cliente
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
