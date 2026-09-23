import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

function verifyMercadoPagoSignature(
  xSignatureHeader: string | undefined,
  xRequestIdHeader: string | undefined,
  dataId: string | undefined,
  secret: string
): boolean {
  if (!xSignatureHeader || !xRequestIdHeader || !dataId || !secret) {
    return false;
  }

  try {
    // 1. Extract ts and v1 from x-signature: "ts=1700000000,v1=abcdef..."
    const parts = xSignatureHeader.split(',');
    let ts = '';
    let v1 = '';

    for (const part of parts) {
      const [key, value] = part.trim().split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) return false;

    // 2. Build the manifest: "id:{data.id};request-id:{x-request-id};ts:{ts};" (lowercase data.id)
    const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestIdHeader};ts:${ts};`;

    // 3. Compute HMAC-SHA256
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(manifest);
    const computedHash = hmac.digest('hex');

    // 4. Constant time comparison
    return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(v1));
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, data, action } = req.body || {};
  const topic = type || req.query.topic || req.query.type || (action?.startsWith('payment.') ? 'payment' : undefined);
  const paymentId = data?.id || req.query['data.id'] || req.query.id;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET || process.env.MERCADO_PAGO_WEBHOOK_SECRET;

  const xSignature = (req.headers['x-signature'] || req.headers['X-Signature']) as string | undefined;
  const xRequestId = (req.headers['x-request-id'] || req.headers['X-Request-Id']) as string | undefined;

  // Validate HMAC Signature if secret is set and headers are present
  if (webhookSecret && !webhookSecret.includes('xxxx') && !webhookSecret.includes('sua_chave')) {
    const isValid = verifyMercadoPagoSignature(xSignature, xRequestId, String(paymentId), webhookSecret);
    if (!isValid) {
      console.warn('Invalid Mercado Pago webhook signature received. Request rejected.');
      return res.status(401).json({ error: 'Invalid HMAC signature' });
    }
  }

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
      } else {
        console.error('Failed to fetch payment details from Mercado Pago API:', await mpResponse.text());
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
        // 1. Update order status in Supabase orders table
        await supabaseAdmin
          .from('orders')
          .update({
            status: orderStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId);

        // 2. Record in payment_logs
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

        // 3. Add notification for admin if approved
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

    // Always respond 200 OK fast
    return res.status(200).json({ success: true, paymentId, status: paymentData?.status || 'received' });
  } catch (err: any) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Webhook processing failed', message: err.message });
  }
}
