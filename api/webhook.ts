import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data, action } = req.body || {};
  const topic = type || req.query.topic || req.query.type;
  const paymentId = data?.id || req.query['data.id'] || req.query.id;

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!paymentId) {
    return res.status(200).json({ received: true, message: 'No payment ID found in webhook payload.' });
  }

  try {
    let paymentData: any = null;

    if (accessToken && !accessToken.includes('xxxx')) {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (mpResponse.ok) {
        paymentData = await mpResponse.json();
      }
    }

    if (paymentData && supabaseAdmin) {
      const orderId = paymentData.external_reference;
      const status = paymentData.status;

      let orderStatus: string = 'pendente';
      if (status === 'approved') {
        orderStatus = 'pago';
      } else if (status === 'rejected' || status === 'cancelled') {
        orderStatus = 'cancelado';
      } else if (status === 'in_process' || status === 'pending') {
        orderStatus = 'pendente';
      }

      if (orderId) {
        // Update order status in Supabase
        await supabaseAdmin
          .from('orders')
          .update({
            status: orderStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        // Record in payment logs
        await supabaseAdmin
          .from('payment_logs')
          .insert({
            order_id: orderId,
            order_number: `ORD-${paymentData.id}`,
            amount: Number(paymentData.transaction_amount),
            method: paymentData.payment_method_id || 'mercado_pago',
            status: status === 'approved' ? 'success' : status === 'rejected' ? 'failed' : 'pending',
            transaction_id: String(paymentData.id),
            payload: paymentData,
          });

        // Add notification for admin if approved
        if (status === 'approved') {
          await supabaseAdmin.from('notifications').insert({
            title: 'Pagamento Confirmado!',
            message: `Pagamento de R$ ${paymentData.transaction_amount} aprovado para o Pedido #${orderId}`,
            type: 'order',
            action_url: '/admin/pedidos',
          });
        }
      }
    }

    return res.status(200).json({ success: true, paymentId, status: paymentData?.status });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed', message: err.message });
  }
}
