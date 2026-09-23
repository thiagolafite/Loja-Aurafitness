import React, { useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, MessageCircle, Copy, Check, Package, MapPin, Truck, ArrowRight } from 'lucide-react';
import { getOrderById, getStoreSettings } from '../../lib/dataClient';
import { formatCurrency, formatDate } from '../../lib/utils';
import { generateWhatsAppOrderMessage } from '../../lib/whatsapp';
import { OrderItem } from '../../types';

export const OrderConfirmationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const settings = getStoreSettings();

  const passedOrder = location.state?.order;
  const order = passedOrder || getOrderById(id || '');

  const [copiedPix, setCopiedPix] = useState(false);

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

  const whatsappUrl = generateWhatsAppOrderMessage(order, settings.whatsappNumber);

  const handleCopyPix = () => {
    if (order.paymentDetails?.pixCopyPaste) {
      navigator.clipboard.writeText(order.paymentDetails.pixCopyPaste);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="bg-card border border-border p-8 rounded-3xl text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs text-primary font-bold uppercase tracking-wider">Pedido Confirmado!</span>
          <h1 className="font-serif font-bold text-3xl text-foreground mt-1">
            Obrigado pela sua compra, {order.customer.name}!
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Seu pedido <strong className="text-foreground font-mono">#{order.orderNumber}</strong> foi gerado com sucesso.
          </p>
        </div>

        {/* WhatsApp Notification Action Button */}
        <div className="pt-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-sm py-3.5 px-8 rounded-xl shadow-lg transition-transform transform hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 fill-white stroke-none" />
            Enviar Pedido Automático para WhatsApp do Vendedor
          </a>
        </div>
      </div>

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
                value={order.paymentDetails?.pixCopyPaste || '00020126580014BR.GOV.BCB.PIX...'}
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

      {/* Credit / Debit Card Approved Box */}
      {(order.paymentMethod === 'credit_card' || order.paymentMethod === 'debit_card') && (
        <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 p-6 rounded-3xl text-center space-y-3 shadow-md">
          <span className="bg-sky-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
            PAGAMENTO APROVADO COM SUCESSO!
          </span>
          <h3 className="font-serif font-bold text-lg text-sky-950 dark:text-sky-200">
            Transação autorizada instantaneamente pela operadora
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
            <p className="text-foreground font-semibold uppercase mt-1">Status: <span className="text-primary">{order.status}</span></p>
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
