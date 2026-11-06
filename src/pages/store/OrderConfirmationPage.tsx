import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  Package,
  MapPin,
  Truck,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getOrderById, getStoreSettings } from '../../lib/dataClient';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import { formatCurrency, formatDate } from '../../lib/utils';
import { generateWhatsAppOrderMessage } from '../../lib/whatsapp';
import { Order, OrderItem } from '../../types';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const settings = getStoreSettings();

  const passedOrder = location.state?.order;
  const initialOrder = passedOrder || getOrderById(id || '');
  const [order, setOrder] = useState<Order | undefined>(initialOrder);

  const [copiedPix, setCopiedPix] = useState(false);
  const [copiedPicpay, setCopiedPicpay] = useState(false);

  // Real-time polling to check if payment was approved (via Webhook or Admin)
  useEffect(() => {
    if (!order || order.status === 'pago') return;

    const interval = setInterval(async () => {
      // 1. Check in Supabase
      if (isSupabaseConfigured() && order.id) {
        try {
          const { data } = await supabase
            .from('orders')
            .select('status')
            .eq('id', order.id)
            .maybeSingle();

          if (data && data.status === 'pago') {
            setOrder((prev) => (prev ? { ...prev, status: 'pago' } : prev));
            try {
              confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
            } catch (e) {}
            return;
          }
        } catch (err) {
          // ignore
        }
      }

      // 2. Check local dataClient
      const updatedLocal = getOrderById(order.id || order.orderNumber);
      if (updatedLocal && updatedLocal.status === 'pago') {
        setOrder(updatedLocal);
        try {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [order?.id, order?.status, order?.orderNumber]);

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif font-bold text-2xl text-foreground">Pedido não encontrado</h2>
        <Link to="/meus-pedidos" className="bg-primary text-white text-xs font-semibold px-6 py-3 rounded-xl inline-block">
          Ver Meus Pedidos
        </Link>
      </div>
    );
  }

  const isPaid = order.status === 'pago';
  const whatsappUrl = generateWhatsAppOrderMessage(order, settings.whatsappNumber);

  const handleCopyPix = () => {
    if (order.paymentDetails?.pixCopyPaste) {
      navigator.clipboard.writeText(order.paymentDetails.pixCopyPaste);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const handleCopyPicpay = () => {
    navigator.clipboard.writeText('https://picpay.me/adoroaurafit');
    setCopiedPicpay(true);
    setTimeout(() => setCopiedPicpay(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner - Condicional: Só exibe "Pedido Confirmado" e WhatsApp após confirmação do pagamento */}
      {isPaid ? (
        <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              ✓ Pagamento Confirmado!
            </span>
            <h1 className="font-serif font-bold text-3xl text-foreground mt-3">
              Obrigado pela sua compra, {order.customer.name}!
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Seu pedido <strong className="text-foreground font-mono">#{order.orderNumber}</strong> foi confirmado com sucesso e já está sendo preparado para envio.
            </p>
          </div>

          {/* Botão de WhatsApp - Só aparece APÓS a confirmação do pagamento */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg transition-transform transform hover:scale-105"
            >
              <svg
                className="w-5 h-5 fill-white shrink-0"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              Enviar Pedido Automático para WhatsApp do Vendedor
            </a>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              Aguardando Pagamento
            </span>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-foreground mt-3">
              Pedido #{order.orderNumber} Registrado!
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              Olá, <strong>{order.customer.name}</strong>! Conclua o pagamento abaixo para confirmarmos o seu pedido e iniciarmos a separação.
            </p>
          </div>
        </div>
      )}

      {/* Blocos de Pagamento */}
      {isPaid ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl text-center space-y-2 shadow-sm">
          <span className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            STATUS: PAGO & APROVADO
          </span>
          <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-200 pt-1">
            Seu pagamento foi recebido com sucesso!
          </h3>
          <p className="text-xs text-emerald-800 dark:text-emerald-300">
            Acompanhe a postagem e entrega do seu pedido a qualquer momento na área "Meus Pedidos".
          </p>
        </div>
      ) : (
        <>
          {/* PIX QR Code Box */}
          {order.paymentMethod === 'pix' && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-6 rounded-3xl text-center space-y-4 shadow-md">
              <span className="bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                PAGAMENTO VIA PIX (5% DE DESCONTO APLICADO)
              </span>
              <h3 className="font-serif font-bold text-xl text-emerald-900 dark:text-emerald-200">
                Escaneie o QR Code abaixo para concluir o pagamento
              </h3>

              <div className="w-48 h-48 bg-white p-2.5 rounded-2xl mx-auto border border-emerald-300 shadow-lg">
                <img
                  src={order.paymentDetails?.pixQrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=PIX_AURA_FITNESS'}
                  alt="PIX QR Code"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 block font-medium">
                  Ou utilize o código Copia e Cola no seu aplicativo do banco:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={order.paymentDetails?.pixCopyPaste || ''}
                    className="w-full bg-white dark:bg-card border border-emerald-300 rounded-xl px-3.5 py-2 text-xs font-mono text-foreground truncate"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedPix ? 'Copiado!' : 'Copiar PIX'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PicPay Payment Box */}
          {order.paymentMethod === 'picpay' && (
            <div className="bg-[#11C76F]/10 border-2 border-[#11C76F]/40 p-6 sm:p-8 rounded-3xl text-center space-y-6 shadow-xl">
              <div className="inline-flex items-center gap-2 bg-[#11C76F] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                PAGAMENTO VIA PICPAY (5% DE DESCONTO APLICADO)
              </div>

              <div>
                <h3 className="font-serif font-bold text-2xl text-foreground">
                  Pague com seu PicPay para @adoroaurafit
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Favorecida: <strong className="text-foreground">Brenda Raissa Sousa Silva</strong> • Total: <strong className="text-foreground font-mono">{formatCurrency(order.totals.total)}</strong>
                </p>
              </div>

              {/* Mobile Direct Button */}
              <div className="max-w-sm mx-auto">
                <a
                  href={order.paymentDetails?.picpayPaymentUrl || 'https://picpay.me/adoroaurafit'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 bg-[#11C76F] hover:bg-[#0ea35b] text-white font-bold text-sm py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                >
                  <div className="w-5 h-5 rounded-md bg-white text-[#11C76F] font-black text-xs flex items-center justify-center shrink-0">
                    P
                  </div>
                  Abrir e Pagar no App PicPay
                </a>
                <span className="text-[11px] text-muted-foreground block mt-1.5">
                  (Se estiver no celular, o app PicPay abre direto na tela de pagamento)
                </span>
              </div>

              {/* QR Code Container for Desktop */}
              <div className="pt-2">
                <span className="text-xs font-semibold text-foreground block mb-2">
                  Ou aponte a câmera do celular para o QR Code oficial:
                </span>
                <div className="w-48 h-48 bg-white p-2.5 rounded-2xl mx-auto border-2 border-[#11C76F]/30 shadow-md">
                  <img
                    src={order.paymentDetails?.picpayQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fpicpay.me%2Fadoroaurafit`}
                    alt="PicPay QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* Copy Link Input */}
              <div className="max-w-md mx-auto space-y-2">
                <span className="text-xs text-muted-foreground block font-medium">
                  Link direto do perfil PicPay:
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://picpay.me/adoroaurafit"
                    className="w-full bg-white dark:bg-card border border-[#11C76F]/40 rounded-xl px-3.5 py-2 text-xs font-mono text-foreground truncate"
                  />
                  <button
                    onClick={handleCopyPicpay}
                    className="bg-[#11C76F] hover:bg-[#0ea35b] text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    {copiedPicpay ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedPicpay ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>

              {/* Next steps instruction */}
              <div className="max-w-md mx-auto p-4 bg-background border border-border rounded-2xl text-left text-xs space-y-2 shadow-sm">
                <h4 className="font-bold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#11C76F]" /> Próximos Passos:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                  <li>Pague <strong>{formatCurrency(order.totals.total)}</strong> para <strong>@adoroaurafit</strong> no PicPay.</li>
                  <li>Assim que o pagamento for aprovado pelo lojista no painel, seu pedido será confirmado automaticamente aqui na tela!</li>
                </ol>
              </div>
            </div>
          )}

          {/* Credit / Debit Card Approved Box */}
          {(order.paymentMethod === 'credit_card' || order.paymentMethod === 'debit_card') && (
            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-6 rounded-3xl text-center space-y-3 shadow-md">
              <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                PAGAMENTO EM PROCESSAMENTO
              </span>
              <h3 className="font-serif font-bold text-lg text-sky-950 dark:text-sky-200">
                Aguardando autorização da operadora
              </h3>
              <p className="text-xs text-sky-800 dark:text-sky-300">
                Forma de Pagamento: <strong>{order.paymentDetails?.cardBrand || 'Cartão'}</strong> • Final: <strong>•••• {order.paymentDetails?.cardLastFour || '4242'}</strong>
              </p>
            </div>
          )}

          {/* Boleto Box */}
          {order.paymentMethod === 'boleto' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6 rounded-3xl text-center space-y-3 shadow-md">
              <span className="bg-amber-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                BOLETO BANCÁRIO GERADO (VENCIMENTO EM 3 DIAS)
              </span>
              <h3 className="font-serif font-bold text-lg text-amber-950 dark:text-amber-200">
                Código de Barras do Boleto:
              </h3>
              <div className="max-w-md mx-auto flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={order.paymentDetails?.boletoBarcode || '34191.79001 01043.510047 91020.150008 8 98210000027470'}
                  className="w-full bg-white dark:bg-card border border-amber-300 rounded-xl px-3.5 py-2 text-xs font-mono text-foreground truncate"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.paymentDetails?.boletoBarcode || '');
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 3000);
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 flex items-center gap-1.5 shadow-sm"
                >
                  {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedPix ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Order Summary Details Card */}
      <div className="bg-card border border-border p-6 rounded-3xl space-y-6 shadow-sm">
        <h3 className="font-serif font-bold text-lg text-foreground border-b border-border pb-3 flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" /> Detalhes do Pedido #{order.orderNumber}
        </h3>

        {/* Items Grid */}
        <div className="space-y-3">
          {order.items.map((item: OrderItem, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 text-xs">
              <div className="flex items-center gap-3">
                <img src={item.productImage} alt={item.productName} className="w-12 h-14 object-cover rounded-lg" />
                <div>
                  <h4 className="font-semibold text-foreground">{item.productName}</h4>
                  <span className="text-[11px] text-muted-foreground">
                    Tamanho: {item.size} | Cor: {item.colorName} | Qtd: {item.quantity}
                  </span>
                </div>
              </div>
              <span className="font-serif font-bold text-primary">{formatCurrency(item.total)}</span>
            </div>
          ))}
        </div>

        {/* Shipping & Address */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" /> Endereço de Entrega:
            </span>
            <p className="text-muted-foreground">
              {order.shippingAddress.street}, Nº {order.shippingAddress.number}
              {order.shippingAddress.complement ? ` (${order.shippingAddress.complement})` : ''}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.neighborhood} - {order.shippingAddress.city}/{order.shippingAddress.state} - CEP: {order.shippingAddress.cep}
            </p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-foreground flex items-center gap-1">
              <Truck className="w-4 h-4 text-primary" /> Forma de Envio & Status:
            </span>
            <p className="text-muted-foreground">{order.shippingMethod.name} ({order.shippingMethod.deliveryDays} dias úteis)</p>
            <p className="text-foreground font-semibold uppercase mt-1">
              Status do Pagamento:{' '}
              <span className={isPaid ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                {isPaid ? 'Pago' : 'Pendente'}
              </span>
            </p>
          </div>
        </div>

        {/* Financial Totals */}
        <div className="pt-4 border-t border-border flex justify-between items-center font-serif font-bold text-lg text-foreground">
          <span>Total do Pedido</span>
          <span className="text-primary">{formatCurrency(order.totals.total)}</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
        <Link
          to="/meus-pedidos"
          className="bg-primary hover:bg-primary-hover text-white font-bold text-xs py-3.5 px-6 rounded-xl shadow-md transition-colors flex items-center gap-2"
        >
          Acompanhar em Meus Pedidos
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/catalogo"
          className="bg-secondary hover:bg-secondary/80 text-foreground font-semibold text-xs py-3.5 px-6 rounded-xl border border-border transition-colors"
        >
          Continuar Comprando
        </Link>
      </div>
    </div>
  );
};
