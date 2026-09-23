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

  const {
    orderId,
    orderNumber,
    amount,
    paymentMethod,
    token,
    installments,
    issuerId,
    paymentMethodId,
    customer,
  } = req.body || {};

  if (!amount || !customer?.email) {
    return res.status(400).json({ error: 'Dados incompletos para processamento de pagamento.' });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const appUrl = process.env.VITE_APP_URL || 'https://aurafitness.vercel.app';
  const cleanCpf = customer.cpf ? customer.cpf.replace(/\D/g, '') : '00000000000';
  const firstName = customer.name?.split(' ')[0] || 'Cliente';
  const lastName = customer.name?.split(' ').slice(1).join(' ') || 'Aura';

  // Fallback simulation if access token is not configured
  if (!accessToken || accessToken.includes('xxxx') || accessToken.includes('seu-token')) {
    const fakeCopyPaste = `00020126580014BR.GOV.BCB.PIX0136aurafitnesswork@gmail.com520400005303986540${Number(amount).toFixed(2)}5802BR5912AuraFitness6009SaoPaulo62070503***6304E2B1`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fakeCopyPaste)}`;

    const mockPaymentId = `MP-${Date.now()}`;

    // Record in payment_logs
    if (supabaseAdmin && orderId) {
      await supabaseAdmin.from('payment_logs').insert({
        order_id: orderId,
        order_number: orderNumber || `ORD-${Date.now()}`,
        amount: Number(amount),
        method: paymentMethod || 'pix',
        status: paymentMethod === 'pix' ? 'pending' : 'success',
        transaction_id: mockPaymentId,
        payload: { simulated: true, amount, customer },
      });
    }

    return res.status(200).json({
      success: true,
      mode: 'sandbox_fallback',
      paymentId: mockPaymentId,
      status: paymentMethod === 'pix' ? 'pending' : 'approved',
      qrCodeUrl,
      copyPaste: fakeCopyPaste,
      expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  }

  try {
    let paymentPayload: any = {
      transaction_amount: Number(amount),
      description: `Pedido #${orderNumber || orderId} - Aura Fitness`,
      notification_url: `${appUrl}/api/payments/webhook`,
      external_reference: orderId,
      payer: {
        email: customer.email,
        first_name: firstName,
        last_name: lastName,
        identification: {
          type: 'CPF',
          number: cleanCpf,
        },
      },
    };

    if (paymentMethod === 'pix') {
      paymentPayload.payment_method_id = 'pix';
    } else if (paymentMethod === 'credit_card') {
      paymentPayload.token = token;
      paymentPayload.installments = Number(installments) || 1;
      paymentPayload.payment_method_id = paymentMethodId || 'master';
      if (issuerId) {
        paymentPayload.issuer_id = issuerId;
      }
    } else if (paymentMethod === 'boleto') {
      paymentPayload.payment_method_id = 'bolbradesco';
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `pay-${orderId}-${Date.now()}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago API Error:', data);
      return res.status(mpResponse.status).json({
        error: data.message || 'Erro ao processar pagamento no Mercado Pago.',
        details: data,
      });
    }

    // Record pending attempt in Supabase payment_logs
    if (supabaseAdmin && orderId) {
      await supabaseAdmin.from('payment_logs').insert({
        order_id: orderId,
        order_number: orderNumber || String(data.id),
        amount: Number(data.transaction_amount || amount),
        method: data.payment_method_id || paymentMethod,
        status: data.status === 'approved' ? 'success' : data.status === 'rejected' ? 'failed' : 'pending',
        transaction_id: String(data.id),
        payload: data,
      });
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;
    const qrCodeBase64 = pointOfInteraction?.qr_code_base64;
    const qrCode = pointOfInteraction?.qr_code;
    const ticketUrl = pointOfInteraction?.ticket_url;

    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      statusDetail: data.status_detail,
      qrCodeBase64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      copyPaste: qrCode,
      ticketUrl: ticketUrl || data.transaction_details?.external_resource_url,
      expirationDate: data.date_of_expiration,
      cardBrand: data.payment_method_id,
      cardLastFour: data.card?.last_four_digits,
    });
  } catch (err: any) {
    console.error('Server error creating payment:', err);
    return res.status(500).json({ error: 'Erro interno ao processar pagamento', message: err.message });
  }
}
