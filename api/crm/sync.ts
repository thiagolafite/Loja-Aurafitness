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

function isMissingTableError(err: any): boolean {
  const msg = String(err?.message || err?.code || '');
  return (
    msg.includes('PGRST205') ||
    msg.includes('42P01') ||
    msg.toLowerCase().includes('could not find the table') ||
    msg.toLowerCase().includes('does not exist')
  );
}

async function safeSelect(table: string, queryBuilder: (q: any) => any) {
  if (!supabaseAdmin) return { data: null, missing: true, error: 'No supabaseAdmin' };
  const { data, error } = await queryBuilder(supabaseAdmin.from(table));
  if (error) {
    return { data: null, missing: isMissingTableError(error), error: error.message };
  }
  return { data: data || [], missing: false, error: null };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase não configurado no servidor.' });
  }

  try {
    // =========================================================================
    // GET: Carrega todos os dados do CRM e da Loja sincronizados do Supabase
    // =========================================================================
    if (req.method === 'GET') {
      const [
        profilesRes,
        ordersRes,
        cartsRes,
        notesRes,
        eventsRes,
        automationsRes,
        queueRes,
        campaignsRes,
        settingsRes,
        usersRes,
      ] = await Promise.all([
        safeSelect('profiles', (q) => q.select('*, addresses(*)').order('created_at', { ascending: false })),
        safeSelect('orders', (q) => q.select('*, order_items(*)').order('created_at', { ascending: false })),
        safeSelect('crm_carts', (q) => q.select('*').order('updated_at', { ascending: false })),
        safeSelect('crm_customer_notes', (q) => q.select('*').order('created_at', { ascending: false }).limit(300)),
        safeSelect('crm_customer_events', (q) => q.select('*').order('created_at', { ascending: false }).limit(400)),
        safeSelect('crm_automations', (q) => q.select('*')),
        safeSelect('crm_message_queue', (q) => q.select('*').order('created_at', { ascending: false }).limit(300)),
        safeSelect('crm_campaigns', (q) => q.select('*').order('created_at', { ascending: false })),
        safeSelect('crm_settings', (q) => q.select('*').eq('id', 'default').maybeSingle()),
        safeSelect('crm_users', (q) => q.select('*').order('created_at', { ascending: true })),
      ]);

      const tablesReady =
        !cartsRes.missing &&
        !notesRes.missing &&
        !automationsRes.missing &&
        !queueRes.missing &&
        !settingsRes.missing;

      return res.status(200).json({
        success: true,
        tablesReady,
        syncedAt: new Date().toISOString(),
        data: {
          profiles: profilesRes.data || [],
          orders: ordersRes.data || [],
          carts: cartsRes.data || [],
          notes: notesRes.data || [],
          events: eventsRes.data || [],
          automations: automationsRes.data || [],
          queue: queueRes.data || [],
          campaigns: campaignsRes.data || [],
          settings: settingsRes.data || null,
          users: usersRes.data || [],
        },
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, payload } = req.body || {};

    // =========================================================================
    // 1. Cadastrar ou atualizar cliente (profiles + auth.users se novo)
    // =========================================================================
    if (action === 'upsert_customer' && payload) {
      const email = String(payload.email || '').trim().toLowerCase();
      if (!email) return res.status(400).json({ error: 'E-mail obrigatório.' });

      let { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle();

      let profileId = existingProfile?.id;

      // Se o cliente foi criado manualmente no CRM e ainda não existe no Auth, cria no Auth (dispara handle_new_user)
      if (!profileId) {
        const { data: createdAuth, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {
            name: payload.name || 'Cliente Aura',
            phone: payload.phone || '',
            cpf: payload.cpf || '',
            birth_date: payload.birthDate || '',
            optin_whatsapp: payload.optinWhatsapp ?? true,
            origin: payload.origin || 'site',
          },
        });

        if (!authErr && createdAuth?.user) {
          profileId = createdAuth.user.id;
        } else {
          // Caso já exista no auth.users sem profile, busca novamente
          const { data: retryProf } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .ilike('email', email)
            .maybeSingle();
          profileId = retryProf?.id;
        }
      }

      if (profileId) {
        const updatePayload: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };
        if (payload.name !== undefined) updatePayload.name = payload.name;
        if (payload.phone !== undefined) updatePayload.phone = payload.phone;
        if (payload.cpf !== undefined) updatePayload.cpf = payload.cpf;
        if (payload.birthDate !== undefined) updatePayload.birth_date = payload.birthDate || null;
        if (payload.needsManualAttention !== undefined) {
          updatePayload.needs_manual_attention = Boolean(payload.needsManualAttention);
        }
        if (payload.attentionReason !== undefined) updatePayload.attention_reason = payload.attentionReason;
        if (payload.tags !== undefined) updatePayload.tags = payload.tags;
        if (payload.origin !== undefined) updatePayload.origin = payload.origin;
        if (payload.optinWhatsapp !== undefined) updatePayload.optin_whatsapp = Boolean(payload.optinWhatsapp);
        if (payload.optinEmail !== undefined) updatePayload.optin_email = Boolean(payload.optinEmail);
        if (payload.preferredSizes !== undefined) updatePayload.preferred_sizes = payload.preferredSizes;
        if (payload.preferredColors !== undefined) updatePayload.preferred_colors = payload.preferredColors;
        if (payload.lastContactedAt !== undefined) updatePayload.last_contacted_at = payload.lastContactedAt;

        await supabaseAdmin.from('profiles').update(updatePayload).eq('id', profileId);
      }

      return res.status(200).json({ success: true, profileId });
    }

    // =========================================================================
    // 2. Carrinho ativo / abandonado / convertido
    // =========================================================================
    if (action === 'upsert_cart' && payload) {
      await supabaseAdmin.from('crm_carts').upsert(
        {
          session_id: payload.sessionId,
          user_id: payload.userId && !String(payload.userId).startsWith('admin') ? payload.userId : null,
          customer_name: payload.customerName || null,
          customer_email: payload.customerEmail || null,
          customer_phone: payload.customerPhone || null,
          items: payload.items || [],
          subtotal: Number(payload.subtotal) || 0,
          total: Number(payload.total) || 0,
          coupon_code: payload.couponCode || null,
          checkout_step: Number(payload.checkoutStep) || 0,
          status: payload.status || 'active',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'mark_cart_converted' && payload) {
      const cleanEmail = String(payload.customerEmail || '').trim().toLowerCase();
      if (payload.sessionId) {
        await supabaseAdmin
          .from('crm_carts')
          .update({ status: 'converted', updated_at: new Date().toISOString() })
          .eq('session_id', payload.sessionId);
      }
      if (cleanEmail) {
        await supabaseAdmin
          .from('crm_carts')
          .update({ status: 'converted', updated_at: new Date().toISOString() })
          .ilike('customer_email', cleanEmail)
          .in('status', ['active', 'abandoned']);
      }
      return res.status(200).json({ success: true });
    }

    // =========================================================================
    // 3. Anotações e Eventos da Timeline
    // =========================================================================
    if (action === 'add_note' && payload) {
      await supabaseAdmin.from('crm_customer_notes').insert({
        customer_id: String(payload.customerId || ''),
        customer_email: payload.customerEmail || null,
        author_name: payload.authorName || 'Equipe Aura',
        type: payload.type || 'note',
        content: payload.content,
        follow_up_date: payload.followUpDate || null,
        is_resolved: Boolean(payload.isResolved),
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'add_event' && payload) {
      await supabaseAdmin.from('crm_customer_events').insert({
        customer_id: payload.customerId ? String(payload.customerId) : null,
        customer_email: payload.customerEmail || null,
        event_type: payload.eventType || 'note_added',
        title: payload.title,
        description: payload.description || null,
        metadata: payload.metadata || {},
      });
      return res.status(200).json({ success: true });
    }

    // =========================================================================
    // 4. Automações, Fila de Mensagens e Campanhas
    // =========================================================================
    if (action === 'upsert_automation' && payload) {
      await supabaseAdmin.from('crm_automations').upsert({
        id: payload.id,
        name: payload.name,
        description: payload.description,
        trigger_type: payload.triggerType,
        delay_minutes: Number(payload.delayMinutes) || 0,
        channel: payload.channel || 'whatsapp',
        subject: payload.subject || null,
        template: payload.template,
        auto_coupon_prefix: payload.autoCouponPrefix || null,
        auto_coupon_discount: payload.autoCouponDiscount ?? null,
        is_active: Boolean(payload.isActive),
        updated_at: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'upsert_messages' && Array.isArray(payload?.messages)) {
      const rows = payload.messages.map((m: any) => ({
        automation_id: m.automationId || null,
        campaign_id: m.campaignId || null,
        customer_id: m.customerId ? String(m.customerId) : null,
        customer_name: m.customerName,
        customer_email: m.customerEmail || null,
        customer_phone: m.customerPhone || null,
        channel: m.channel || 'whatsapp',
        subject: m.subject || null,
        body: m.body,
        coupon_code: m.couponCode || null,
        scheduled_for: m.scheduledFor || new Date().toISOString(),
        sent_at: m.sentAt || null,
        status: m.status || 'ready_manual',
        error_message: m.errorMessage || null,
      }));
      if (rows.length > 0) {
        await supabaseAdmin.from('crm_message_queue').insert(rows);
      }
      return res.status(200).json({ success: true });
    }

    if (action === 'update_message_status' && payload?.id) {
      await supabaseAdmin
        .from('crm_message_queue')
        .update({
          status: payload.status,
          sent_at: payload.sentAt || null,
          error_message: payload.errorMessage || null,
        })
        .eq('id', payload.id);
      return res.status(200).json({ success: true });
    }

    if (action === 'create_campaign' && payload) {
      await supabaseAdmin.from('crm_campaigns').insert({
        name: payload.name,
        segment: payload.segment,
        channel: payload.channel,
        subject: payload.subject || null,
        message_template: payload.messageTemplate,
        coupon_code: payload.couponCode || null,
        sent_at: payload.sentAt || new Date().toISOString(),
        status: payload.status || 'sent',
        recipients_count: Number(payload.recipientsCount) || 0,
      });
      return res.status(200).json({ success: true });
    }

    // =========================================================================
    // 5. Configurações e Equipe CRM
    // =========================================================================
    if (action === 'save_settings' && payload) {
      await supabaseAdmin.from('crm_settings').upsert({
        id: 'default',
        vip_min_orders: Number(payload.vipMinOrders) || 3,
        vip_min_spent: Number(payload.vipMinSpent) || 800,
        at_risk_days: Number(payload.atRiskDays) || 60,
        inactive_days: Number(payload.inactiveDays) || 120,
        abandoned_cart_minutes: Number(payload.abandonedCartMinutes) || 120,
        pending_payment_minutes: Number(payload.pendingPaymentMinutes) || 60,
        birthday_lookahead_days: Number(payload.birthdayLookaheadDays) || 7,
        birthday_discount_percent: Number(payload.birthdayDiscountPercent) || 15,
        quiet_hours_start: payload.quietHoursStart || '20:00',
        quiet_hours_end: payload.quietHoursEnd || '09:00',
        anti_spam_cooldown_hours: Number(payload.antiSpamCooldownHours) || 72,
        whatsapp_provider: payload.whatsappProvider || 'manual_1click',
        whatsapp_api_url: payload.whatsappApiUrl || null,
        whatsapp_api_token: payload.whatsappApiToken || null,
        whatsapp_instance_id: payload.whatsappInstanceId || null,
        email_provider: payload.emailProvider || 'resend',
        resend_api_key: payload.resendApiKey || null,
        sender_email: payload.senderEmail || 'Aura Fitness <relacionamento@aurafitness.com.br>',
        updated_at: new Date().toISOString(),
      });
      return res.status(200).json({ success: true });
    }

    if (action === 'upsert_team_user' && payload) {
      await supabaseAdmin.from('crm_users').upsert(
        {
          name: payload.name,
          email: String(payload.email || '').trim().toLowerCase(),
          role: payload.role || 'vendedor',
          phone: payload.phone || null,
          is_active: payload.isActive ?? true,
        },
        { onConflict: 'email' }
      );
      return res.status(200).json({ success: true });
    }

    if (action === 'delete_team_user' && payload?.email) {
      await supabaseAdmin.from('crm_users').delete().ilike('email', payload.email);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Ação desconhecida.' });
  } catch (err: any) {
    console.error('CRM Sync API error:', err);
    return res.status(500).json({ error: err?.message || 'Erro interno no sync CRM' });
  }
}
