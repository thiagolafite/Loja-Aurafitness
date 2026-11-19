import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://sgvpicgvgknfscovslad.supabase.co';

const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabaseAdmin =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;

async function sendViaWhatsAppProvider(
  phone: string,
  text: string,
  settings: {
    whatsappProvider: string;
    whatsappApiUrl?: string;
    whatsappApiToken?: string;
    whatsappInstanceId?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const digits = (phone || '').replace(/\D/g, '');
  const fullPhone = digits.startsWith('55') ? digits : `55${digits}`;

  if (!settings.whatsappApiUrl) {
    return { ok: false, error: 'URL da API de WhatsApp não configurada.' };
  }

  try {
    // Suporta Z-API, Evolution API ou Webhook genérico
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (settings.whatsappApiToken) {
      headers['Client-Token'] = settings.whatsappApiToken;
      headers['apikey'] = settings.whatsappApiToken;
      headers['Authorization'] = `Bearer ${settings.whatsappApiToken}`;
    }

    const payload =
      settings.whatsappProvider === 'evolution'
        ? { number: fullPhone, text }
        : { phone: fullPhone, message: text };

    const res = await fetch(settings.whatsappApiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (res.ok) return { ok: true };
    const errText = await res.text();
    return { ok: false, error: errText };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro de conexão com WhatsApp API' };
  }
}

async function sendViaResendEmail(
  toEmail: string,
  subject: string,
  textBody: string,
  resendApiKey: string,
  senderEmail = 'Aura Fitness <onboarding@resend.dev>'
): Promise<{ ok: boolean; error?: string }> {
  if (!resendApiKey || !toEmail) {
    return { ok: false, error: 'Resend API Key ou e-mail do destinatário ausente.' };
  }

  try {
    const htmlBody = `
      <div style="font-family: Georgia, serif; max-width: 580px; margin: 0 auto; padding: 32px; background: #142318; color: #ffffff; border-radius: 16px;">
        <h2 style="color: #d4af37; margin-top: 0;">AURA FITNESS</h2>
        <p style="font-family: sans-serif; font-size: 15px; line-height: 1.6; color: #f3f4f6; white-space: pre-line;">${textBody}</p>
        <hr style="border: 0; border-top: 1px solid #2d4d38; margin: 24px 0;" />
        <p style="font-family: sans-serif; font-size: 11px; color: #9ca3af;">Aura Fitness Moda Esportiva • Relacionamento VIP</p>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [toEmail],
        subject: subject || 'Mensagem Especial Aura Fitness ✨',
        html: htmlBody,
      }),
    });

    if (res.ok) return { ok: true };
    const errText = await res.text();
    return { ok: false, error: errText };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Erro ao enviar e-mail via Resend' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action, message, settings } = req.body || {};

    // 1. Disparo individual solicitado pelo painel CRM
    if (req.method === 'POST' && action === 'send_single' && message) {
      const cfg = settings || {};
      if (message.channel === 'email') {
        const apiKey = cfg.resendApiKey || process.env.RESEND_API_KEY || '';
        const emailResult = await sendViaResendEmail(
          message.customerEmail,
          message.subject || 'Aura Fitness ✨',
          message.body,
          apiKey,
          cfg.senderEmail
        );
        if (!emailResult.ok) {
          return res.status(400).json({ success: false, error: emailResult.error });
        }
        return res.status(200).json({ success: true, channel: 'email' });
      }

      if (message.channel === 'whatsapp') {
        const waResult = await sendViaWhatsAppProvider(message.customerPhone, message.body, {
          whatsappProvider: cfg.whatsappProvider || 'zapi',
          whatsappApiUrl: cfg.whatsappApiUrl || process.env.WHATSAPP_API_URL,
          whatsappApiToken: cfg.whatsappApiToken || process.env.WHATSAPP_API_TOKEN,
          whatsappInstanceId: cfg.whatsappInstanceId,
        });
        if (!waResult.ok) {
          return res.status(400).json({ success: false, error: waResult.error });
        }
        return res.status(200).json({ success: true, channel: 'whatsapp' });
      }
    }

    // 2. Execução via Cron/Schedule (processa carrinhos abandonados e fila no Supabase)
    if (supabaseAdmin) {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
      await supabaseAdmin
        .from('crm_carts')
        .update({ status: 'abandoned', updated_at: new Date().toISOString() })
        .eq('status', 'active')
        .lt('updated_at', twoHoursAgo);
    }

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Motor de regras CRM Aura Fitness executado com sucesso.',
    });
  } catch (err: any) {
    console.error('CRM Run API error:', err);
    return res.status(500).json({ error: err?.message || 'Erro interno no motor CRM' });
  }
}
