import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, orderNumber, token, transaction_amount, installments, payment_method_id, payer } = req.body || {};

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const appUrl = process.env.VITE_APP_URL || 'https://aurafitness.vercel.app';

  if (!accessToken || accessToken.includes('xxxx')) {
    // Sandbox / mock approved response when credentials are not yet added
    return res.status(200).json({
      success: true,
      mode: 'sandbox_fallback',
      paymentId: `MP-CARD-${Date.now()}`,
      status: 'approved',
      status_detail: 'accredited',
    });
  }

  try {
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `card-${orderNumber || orderId}-${Date.now()}`,
      },
      body: JSON.stringify({
        token,
        transaction_amount: Number(transaction_amount),
        installments: Number(installments) || 1,
        payment_method_id,
        description: `Pedido ${orderNumber || orderId} - Aura Fitness`,
        notification_url: `${appUrl}/api/webhook`,
        external_reference: orderId,
        payer: {
          email: payer?.email,
          identification: payer?.identification,
        },
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago Card Payment Error:', data);
      return res.status(mpResponse.status).json({ error: data.message || 'Erro ao processar cartão no Mercado Pago.', details: data });
    }

    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      status_detail: data.status_detail,
      cardBrand: data.payment_method_id,
      cardLastFour: data.card?.last_four_digits,
    });
  } catch (err: any) {
    console.error('Server error processing card payment:', err);
    return res.status(500).json({ error: 'Erro interno ao processar pagamento por cartão', message: err.message });
  }
}
