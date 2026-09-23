import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, orderNumber, amount, customer } = req.body || {};

  if (!amount || !customer?.email) {
    return res.status(400).json({ error: 'Dados incompletos para geração de pagamento PIX.' });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const appUrl = process.env.VITE_APP_URL || 'https://aurafitness.vercel.app';

  if (!accessToken || accessToken.includes('xxxx')) {
    // Fallback sandbox payload for local development / test without Mercado Pago credentials
    const cleanCpf = customer.cpf ? customer.cpf.replace(/\D/g, '') : '00000000000';
    const fakeCopyPaste = `00020126580014BR.GOV.BCB.PIX0136aurafitnesswork@gmail.com520400005303986540${Number(amount).toFixed(2)}5802BR5912AuraFitness6009SaoPaulo62070503***6304E2B1`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(fakeCopyPaste)}`;

    return res.status(200).json({
      success: true,
      mode: 'sandbox_fallback',
      paymentId: `MP-PIX-${Date.now()}`,
      status: 'pending',
      qrCodeUrl,
      copyPaste: fakeCopyPaste,
      expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    });
  }

  try {
    const firstName = customer.name?.split(' ')[0] || 'Cliente';
    const lastName = customer.name?.split(' ').slice(1).join(' ') || 'Aura';
    const cleanCpf = customer.cpf ? customer.cpf.replace(/\D/g, '') : '00000000000';

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'X-Idempotency-Key': `pix-${orderNumber || orderId}-${Date.now()}`,
      },
      body: JSON.stringify({
        transaction_amount: Number(amount),
        description: `Pedido ${orderNumber || orderId} - Aura Fitness`,
        payment_method_id: 'pix',
        notification_url: `${appUrl}/api/webhook`,
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
      }),
    });

    const data = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('Mercado Pago Error:', data);
      return res.status(mpResponse.status).json({ error: data.message || 'Erro ao processar PIX no Mercado Pago.', details: data });
    }

    const pointOfInteraction = data.point_of_interaction?.transaction_data;
    const qrCodeBase64 = pointOfInteraction?.qr_code_base64;
    const qrCode = pointOfInteraction?.qr_code;
    const ticketUrl = pointOfInteraction?.ticket_url;

    return res.status(200).json({
      success: true,
      paymentId: data.id,
      status: data.status,
      qrCodeBase64: qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null,
      copyPaste: qrCode,
      ticketUrl,
      expirationDate: data.date_of_expiration,
    });
  } catch (err: any) {
    console.error('Server error creating PIX payment:', err);
    return res.status(500).json({ error: 'Erro interno ao gerar PIX', message: err.message });
  }
}
