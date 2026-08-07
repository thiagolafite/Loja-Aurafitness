import { Order } from '../types';
import { formatCurrency } from './utils';

export function generateWhatsAppOrderMessage(order: Order, sellerPhone: string): string {
  const cleanPhone = sellerPhone.replace(/\D/g, '');

  const itemsList = order.items
    .map(
      (item) =>
        `• ${item.quantity}x *${item.productName}* (${item.size} / ${item.colorName}) - ${formatCurrency(item.price * item.quantity)}`
    )
    .join('\n');

  const paymentText =
    order.paymentMethod === 'pix'
      ? '⚡ PIX (À Vista)'
      : order.paymentMethod === 'credit_card'
      ? '💳 Cartão de Crédito'
      : '📄 Boleto Bancário';

  const address = order.shippingAddress;
  const addressText = `${address.street}, Nº ${address.number}${address.complement ? ` (${address.complement})` : ''} - ${address.neighborhood}, ${address.city}/${address.state} - CEP: ${address.cep}`;

  const message = `🛍️ *NOVO PEDIDO REALIZADO - AURA FITNESS*

*Pedido:* #${order.orderNumber}
*Data:* ${new Date(order.createdAt).toLocaleDateString('pt-BR')}

👤 *Dados do Cliente:*
• *Nome:* ${order.customer.name}
• *CPF:* ${order.customer.cpf}
• *Telefone:* ${order.customer.phone}
• *E-mail:* ${order.customer.email}

📦 *Itens do Pedido:*
${itemsList}

💰 *Resumo Financeiro:*
• Subtotal: ${formatCurrency(order.totals.subtotal)}
• Desconto: -${formatCurrency(order.totals.discount)}
• Frete: ${formatCurrency(order.totals.shipping)}
• *Total Final:* *${formatCurrency(order.totals.total)}*

💳 *Forma de Pagamento:* ${paymentText}

📍 *Endereço de Entrega:*
${addressText}
• *Modalidade:* ${order.shippingMethod.name} (${order.shippingMethod.deliveryDays} dias úteis)

---
*Aura Fitness - High Performance & Luxury Activewear*`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function generateWhatsAppDirectContact(phone: string, text = 'Olá Aura Fitness! Gostaria de tirar uma dúvida.'): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
