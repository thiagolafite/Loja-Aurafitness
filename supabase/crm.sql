-- ==============================================================================
-- AURA FITNESS CRM - MIGRAÇÃO COMPLETA (SUPABASE / POSTGRESQL)
-- Sincronização Total com Compras, Ficha 360°, Termômetro de Atenção e Automações
-- ==============================================================================

-- 1. EVOLUIR TABELA DE CLIENTES (PROFILES) COM DADOS DO CRM
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS birth_date DATE,
    ADD COLUMN IF NOT EXISTS last_purchase_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS first_purchase_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS crm_status TEXT NOT NULL DEFAULT 'novo', -- 'novo', 'carrinho_abandonado', 'pagamento_pendente', 'ativo', 'vip', 'em_risco', 'inativo', 'aniversariante'
    ADD COLUMN IF NOT EXISTS attention_score INTEGER NOT NULL DEFAULT 50,
    ADD COLUMN IF NOT EXISTS attention_reason TEXT,
    ADD COLUMN IF NOT EXISTS needs_manual_attention BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS preferred_sizes TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS preferred_colors TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS origin TEXT DEFAULT 'site', -- 'site', 'instagram', 'whatsapp', 'indicacao', 'google'
    ADD COLUMN IF NOT EXISTS optin_whatsapp BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS optin_email BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS city TEXT,
    ADD COLUMN IF NOT EXISTS state TEXT,
    ADD COLUMN IF NOT EXISTS assigned_to TEXT,
    ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_birth_date ON public.profiles(birth_date);
CREATE INDEX IF NOT EXISTS idx_profiles_crm_status ON public.profiles(crm_status);
CREATE INDEX IF NOT EXISTS idx_profiles_attention_score ON public.profiles(attention_score DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_purchase_at ON public.profiles(last_purchase_at DESC);

-- Atualizar trigger handle_new_user para gravar birth_date e opt-ins no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        name,
        email,
        phone,
        cpf,
        birth_date,
        optin_whatsapp,
        optin_email,
        origin
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Cliente Aura'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
        CASE
            WHEN (NEW.raw_user_meta_data->>'birth_date') IS NOT NULL
                 AND (NEW.raw_user_meta_data->>'birth_date') != ''
            THEN (NEW.raw_user_meta_data->>'birth_date')::date
            ELSE NULL
        END,
        COALESCE((NEW.raw_user_meta_data->>'optin_whatsapp')::boolean, TRUE),
        COALESCE((NEW.raw_user_meta_data->>'optin_email')::boolean, TRUE),
        COALESCE(NEW.raw_user_meta_data->>'origin', 'site')
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, public.profiles.name),
        phone = CASE WHEN EXCLUDED.phone != '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
        cpf = CASE WHEN EXCLUDED.cpf != '' THEN EXCLUDED.cpf ELSE public.profiles.cpf END,
        birth_date = COALESCE(EXCLUDED.birth_date, public.profiles.birth_date),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 2. TABELA DE USUÁRIOS / EQUIPE DO CRM (ACESSO EXTERNO + ADMIN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'vendedor', -- 'admin', 'gerente', 'vendedor'
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.is_crm_member()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.is_admin() OR EXISTS (
        SELECT 1 FROM public.crm_users
        WHERE (user_id = auth.uid() OR LOWER(email) = LOWER(auth.jwt()->>'email'))
          AND is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. TABELA DE CARRINHOS ATIVOS E ABANDONADOS (CARTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_carts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    coupon_code TEXT,
    checkout_step INTEGER NOT NULL DEFAULT 0, -- 0=carrinho, 1=identificacao, 2=frete, 3=pagamento
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'abandoned', 'recovered', 'converted'
    recovery_contacted_at TIMESTAMPTZ,
    converted_order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_carts_status ON public.crm_carts(status);
CREATE INDEX IF NOT EXISTS idx_crm_carts_email ON public.crm_carts(customer_email);
CREATE INDEX IF NOT EXISTS idx_crm_carts_updated_at ON public.crm_carts(updated_at DESC);

-- ==============================================================================
-- 4. TABELA DE ANOTAÇÕES E TIMELINE DE EVENTOS DO CLIENTE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_customer_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL, -- UUID ou email/id do cliente
    customer_email TEXT,
    author_name TEXT NOT NULL DEFAULT 'Equipe Aura',
    type TEXT NOT NULL DEFAULT 'note', -- 'note', 'whatsapp', 'call', 'Alert', 'follow_up'
    content TEXT NOT NULL,
    follow_up_date DATE,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_customer ON public.crm_customer_notes(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_email ON public.crm_customer_notes(customer_email);

CREATE TABLE IF NOT EXISTS public.crm_customer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT,
    customer_email TEXT,
    event_type TEXT NOT NULL, -- 'registered', 'cart_updated', 'cart_abandoned', 'order_created', 'order_paid', 'order_cancelled', 'message_sent', 'birthday_coupon', 'note_added'
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_events_customer ON public.crm_customer_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_crm_events_email ON public.crm_customer_events(customer_email);
CREATE INDEX IF NOT EXISTS idx_crm_events_created_at ON public.crm_customer_events(created_at DESC);

-- ==============================================================================
-- 5. TABELA DE AUTOMAÇÕES (REGRAS DE MENSAGENS PROGRAMADAS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_automations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'welcome', 'cart_abandoned_2h', 'cart_abandoned_24h', 'pix_pending_1h', 'order_paid', 'order_shipped', 'post_sale_review', 'repurchase_45d', 'birthday', 'winback_60d', 'winback_120d'
    delay_minutes INTEGER NOT NULL DEFAULT 0,
    channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email', 'both'
    subject TEXT,
    template TEXT NOT NULL,
    auto_coupon_prefix TEXT,
    auto_coupon_discount INTEGER, -- % de desconto
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    total_triggered INTEGER NOT NULL DEFAULT 0,
    total_converted INTEGER NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 6. FILA DE MENSAGENS PROGRAMADAS E HISTÓRICO DE DISPAROS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id TEXT REFERENCES public.crm_automations(id) ON DELETE SET NULL,
    campaign_id UUID,
    customer_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    channel TEXT NOT NULL DEFAULT 'whatsapp', -- 'whatsapp', 'email'
    subject TEXT,
    body TEXT NOT NULL,
    coupon_code TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'ready_manual', 'sent', 'delivered', 'failed', 'cancelled', 'converted'
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_queue_status ON public.crm_message_queue(status);
CREATE INDEX IF NOT EXISTS idx_crm_queue_scheduled ON public.crm_message_queue(scheduled_for);

-- ==============================================================================
-- 7. CAMPANHAS E CONFIGURAÇÕES DO CRM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    segment TEXT NOT NULL, -- 'all', 'vip', 'em_risco', 'inativo', 'aniversariante', 'carrinho_abandonado', 'pagamento_pendente'
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    subject TEXT,
    message_template TEXT NOT NULL,
    coupon_code TEXT,
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sent'
    recipients_count INTEGER NOT NULL DEFAULT 0,
    converted_count INTEGER NOT NULL DEFAULT 0,
    revenue_generated NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crm_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    vip_min_orders INTEGER NOT NULL DEFAULT 3,
    vip_min_spent NUMERIC(10,2) NOT NULL DEFAULT 800.00,
    at_risk_days INTEGER NOT NULL DEFAULT 60,
    inactive_days INTEGER NOT NULL DEFAULT 120,
    abandoned_cart_Minutes INTEGER NOT NULL DEFAULT 120,
    pending_payment_minutes INTEGER NOT NULL DEFAULT 60,
    birthday_lookahead_days INTEGER NOT NULL DEFAULT 7,
    birthday_discount_percent INTEGER NOT NULL DEFAULT 15,
    quiet_hours_start TEXT NOT NULL DEFAULT '20:00',
    quiet_hours_end TEXT NOT NULL DEFAULT '09:00',
    anti_spam_cooldown_hours INTEGER NOT NULL DEFAULT 72,
    whatsapp_provider TEXT NOT NULL DEFAULT 'manual_1click', -- 'manual_1click', 'zapi', 'evolution', 'meta_cloud'
    whatsapp_api_url TEXT,
    whatsapp_api_token TEXT,
    whatsapp_instance_id TEXT,
    email_provider TEXT NOT NULL DEFAULT 'resend', -- 'resend', 'webhook'
    resend_api_key TEXT,
    sender_email TEXT DEFAULT 'Aura Fitness <relacionamento@aurafitness.com.br>',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 8. TRIGGER DE SINCRONIZAÇÃO TOTAL: PEDIDOS (ORDERS) -> CRM (PROFILES + EVENTOS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.sync_order_to_crm()
RETURNS TRIGGER AS $$
DECLARE
    v_email TEXT;
    v_name TEXT;
    v_phone TEXT;
    v_cpf TEXT;
    v_city TEXT;
    v_state TEXT;
    v_total NUMERIC(10,2);
    v_paid_orders INT;
    v_paid_spent NUMERIC(10,2);
    v_last_paid TIMESTAMPTZ;
    v_first_paid TIMESTAMPTZ;
    v_pending_count INT;
    v_new_status TEXT;
    v_score INT;
    v_reason TEXT;
BEGIN
    v_email := LOWER(TRIM(COALESCE(NEW.customer->>'email', '')));
    v_name := COALESCE(NEW.customer->>'name', 'Cliente Aura');
    v_phone := COALESCE(NEW.customer->>'phone', '');
    v_cpf := COALESCE(NEW.customer->>'cpf', '');
    v_city := COALESCE(NEW.shipping_address->>'city', '');
    v_state := COALESCE(NEW.shipping_address->>'state', '');
    v_total := COALESCE((NEW.totals->>'total')::numeric, 0);

    IF v_email = '' THEN
        RETURN NEW;
    END IF;

    -- Recalcular todas as compras válidas (pagas/em_separacao/enviado/entregue) desse e-mail ou user_id
    SELECT
        COUNT(*),
        COALESCE(SUM((totals->>'total')::numeric), 0),
        MAX(created_at),
        MIN(created_at)
    INTO v_paid_orders, v_paid_spent, v_last_paid, v_first_paid
    FROM public.orders
    WHERE (LOWER(TRIM(customer->>'email')) = v_email OR (NEW.user_id IS NOT NULL AND user_id = NEW.user_id))
      AND status IN ('pago', 'em_separacao', 'enviado', 'entregue');

    -- Verificar se há pedido pendente recente
    SELECT COUNT(*)
    INTO v_pending_count
    FROM public.orders
    WHERE (LOWER(TRIM(customer->>'email')) = v_email OR (NEW.user_id IS NOT NULL AND user_id = NEW.user_id))
      AND status = 'pendente';

    -- Determinar status de CRM e score de atenção
    IF v_pending_count > 0 AND NEW.status = 'pendente' THEN
        v_new_status := 'pagamento_pendente';
        v_score := 92;
        v_reason := 'Pedido #' || NEW.order_number || ' aguardando pagamento (' || UPPER(NEW.payment_method) || ')';
    ELSIF v_paid_orders >= 3 OR v_paid_spent >= 800 THEN
        v_new_status := 'vip';
        v_score := 35;
        v_reason := 'Cliente VIP (' || v_paid_orders || ' compras • R$ ' || v_paid_spent || ')';
    ELSIF v_paid_orders > 0 THEN
        v_new_status := 'ativo';
        v_score := 25;
        v_reason := 'Última compra em ' || to_char(v_last_paid, 'DD/MM/YYYY');
    ELSE
        v_new_status := 'novo';
        v_score := 60;
        v_reason := 'Cadastrado sem compras concluídas';
    END IF;

    -- Atualizar perfil existente (se houver)
    UPDATE public.profiles
    SET
        phone = CASE WHEN v_phone != '' THEN v_phone ELSE phone END,
        cpf = CASE WHEN v_cpf != '' THEN v_cpf ELSE cpf END,
        city = CASE WHEN v_city != '' THEN v_city ELSE city END,
        state = CASE WHEN v_state != '' THEN v_state ELSE state END,
        total_orders = v_paid_orders,
        total_spent = v_paid_spent,
        average_ticket = CASE WHEN v_paid_orders > 0 THEN v_paid_spent / v_paid_orders ELSE 0 END,
        last_purchase_at = COALESCE(v_last_paid, last_purchase_at),
        first_purchase_at = COALESCE(v_first_paid, first_purchase_at),
        crm_status = v_new_status,
        attention_score = v_score,
        attention_reason = v_reason,
        updated_at = NOW()
    WHERE LOWER(email) = v_email OR (NEW.user_id IS NOT NULL AND id = NEW.user_id);

    -- Marcar carrinhos desse e-mail como convertidos quando pago
    IF NEW.status IN ('pago', 'em_separacao', 'enviado', 'entregue') THEN
        UPDATE public.crm_carts
        SET status = 'converted', converted_order_id = NEW.id, updated_at = NOW()
        WHERE LOWER(customer_email) = v_email AND status IN ('active', 'abandoned');

        -- Cancelar mensagens de cobrança/abandono pendentes se o cliente já pagou
        UPDATE public.crm_message_queue
        SET status = 'cancelled', error_message = 'Cancelado automaticamente: cliente concluiu a compra #' || NEW.order_number
        WHERE LOWER(customer_email) = v_email
          AND status = 'pending'
          AND automation_id IN ('cart_abandoned_2h', 'cart_abandoned_24h', 'pix_pending_1h');
    END IF;

    -- Registrar evento na Timeline 360° do cliente
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.crm_customer_events (customer_id, customer_email, event_type, title, description, metadata)
        VALUES (
            COALESCE(NEW.user_id::text, v_email),
            v_email,
            CASE WHEN NEW.status = 'pago' THEN 'order_paid' ELSE 'order_created' END,
            'Pedido #' || NEW.order_number || ' (' || UPPER(NEW.status) || ')',
            'Valor: R$ ' || v_total || ' via ' || UPPER(NEW.payment_method),
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'total', v_total, 'status', NEW.status)
        );
    ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO public.crm_customer_events (customer_id, customer_email, event_type, title, description, metadata)
        VALUES (
            COALESCE(NEW.user_id::text, v_email),
            v_email,
            'order_' || NEW.status,
            'Status do Pedido #' || NEW.order_number || ' → ' || UPPER(NEW.status),
            CASE WHEN NEW.tracking_code IS NOT NULL THEN 'Rastreio: ' || NEW.tracking_code ELSE 'Atualizado automaticamente pelo sistema' END,
            jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number, 'old_status', OLD.status, 'new_status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_sync_crm ON public.orders;
CREATE TRIGGER on_order_sync_crm
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.sync_order_to_crm();

-- ==============================================================================
-- 9. SEEDS DE AUTOMAÇÕES PADRÃO DA AURA FITNESS
-- ==============================================================================
INSERT INTO public.crm_automations (id, name, description, trigger_type, delay_minutes, channel, subject, template, auto_coupon_prefix, auto_coupon_discount, is_active)
VALUES
    (
        'welcome',
        'Boas-vindas + Cupom 1ª Compra',
        'Dispara assim que a cliente cria cadastro na loja e ainda não comprou.',
        'welcome',
        5,
        'whatsapp',
        'Bem-vinda à Aura Fitness ✨',
        'Oi {{primeiro_nome}}, tudo bem? Que alegria ter você na Aura Fitness! 🖤 Preparei um cupom especial de 10% OFF para seu primeiro look de treino: *{{cupom}}*. Vem escolher o seu: {{link_loja}}',
        'BEMVINDA10',
        10,
        TRUE
    ),
    (
        'cart_abandoned_2h',
        'Recuperação de Carrinho #1 (2 horas)',
        'Lembra a cliente que deixou peças no carrinho sem finalizar o pedido.',
        'cart_abandoned_2h',
        120,
        'whatsapp',
        'Seu look Aura ficou te esperando 🛒',
        'Oi {{primeiro_nome}}! Vi que você separou *{{produto_principal}}* no carrinho, mas não conseguiu finalizar. Posso te ajudar com tamanho ou frete? Seu carrinho está salvo aqui: {{link_carrinho}}',
        NULL,
        NULL,
        TRUE
    ),
    (
        'cart_abandoned_24h',
        'Recuperação de Carrinho #2 + Cupom (24h)',
        'Segunda tentativa após 24h com cupom exclusivo para destravar a compra.',
        'cart_abandoned_24h',
        1440,
        'both',
        'Liberamos um mimo para finalizar seu carrinho 🎁',
        'Oi {{primeiro_nome}}! As peças do seu carrinho (*{{produto_principal}}*) estão com últimas unidades no estoque. Liberei o cupom *{{cupom}}* com 7% OFF válido hoje para você garantir: {{link_carrinho}}',
        'VOLTA7',
        7,
        TRUE
    ),
    (
        'pix_pending_1h',
        'PIX / Pagamento Não Concluído (1 hora)',
        'Acionado quando o pedido fica pendente (PIX ou boleto gerado e não pago).',
        'pix_pending_1h',
        60,
        'whatsapp',
        'Seu pedido #{{numero_pedido}} está reservado!',
        'Oi {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* (R$ {{valor_pedido}}) já está separado aqui na Aura Fitness, aguardando apenas a confirmação do pagamento. Precisa que eu reenvie o código PIX ou quer trocar a forma de pagamento?',
        NULL,
        NULL,
        TRUE
    ),
    (
        'order_shipped',
        'Aviso de Pedido Enviado + Rastreio',
        'Enviado automaticamente quando o pedido muda para o status Enviado.',
        'order_shipped',
        0,
        'whatsapp',
        'Seu pedido Aura Fitness saiu para entrega! 📦',
        'Uhul, {{primeiro_nome}}! Seu pedido *#{{numero_pedido}}* acabou de ser despachado! 🚚✨ Código de rastreio: *{{codigo_rastreio}}*. Mal podemos esperar para ver você treinando de Aura!',
        NULL,
        NULL,
        TRUE
    ),
    (
        'post_sale_review',
        'Pós-venda & Avaliação (7 dias após entrega)',
        'Pede feedback da peça e incentiva avaliação na loja.',
        'post_sale_review',
        10080,
        'whatsapp',
        'Como foi seu treino com a Aura? ⭐',
        'Oi {{primeiro_nome}}! Já faz alguns dias que seu pedido *#{{numero_pedido}}* chegou. O que achou da modelagem e do tecido? Sua opinião vale ouro pra gente!',
        NULL,
        NULL,
        TRUE
    ),
    (
        'birthday',
        'Feliz Aniversário + Presente VIP',
        'Dispara na semana do aniversário da cliente com cupom nominal de 15% OFF.',
        'birthday',
        0,
        'both',
        'Feliz Aniversário, {{primeiro_nome}}! 🎂 Seu presente da Aura chegou',
        'Parabéns, {{primeiro_nome}}! 🎂🥂 Desejamos muita saúde, energia e treinos incríveis nesse novo ciclo! Como presente da Aura Fitness, preparamos um cupom exclusivo de 15% OFF para você comemorar de look novo: *{{cupom}}* (válido por 15 dias). Aproveite: {{link_loja}}',
        'NIVER15',
        15,
        TRUE
    ),
    (
        'repurchase_45d',
        'Ciclo de Recompra (45 dias)',
        'Convida clientes ativas a conhecerem lançamentos no tamanho preferido.',
        'repurchase_45d',
        64800,
        'whatsapp',
        'Chegaram novidades no seu tamanho {{tamanho_preferido}} 🔥',
        'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última compra e acabaram de chegar peças novas no tamanho *{{tamanho_preferido}}* que são a sua cara! Quer que eu te mande as fotos em primeira mão?',
        NULL,
        NULL,
        TRUE
    ),
    (
        'winback_60d',
        'Alerta Cliente em Risco (60 dias sem comprar)',
        'Mensagem calorosa para clientes que passaram de 60 dias sem pedido.',
        'winback_60d',
        86400,
        'whatsapp',
        'Estamos com saudades de você na Aura 🖤',
        'Oi {{primeiro_nome}}, sumida! Tudo bem por aí? Faz {{dias_sem_comprar}} dias que você não passa pela Aura Fitness. Separei o cupom *{{cupom}}* com 12% OFF para você conhecer a coleção nova: {{link_loja}}',
        'SAUDADE12',
        12,
        TRUE
    ),
    (
        'winback_120d',
        'Reativação de Inativos (120 dias sem comprar)',
        'Campanha forte de resgate para clientes há mais de 4 meses sem compra.',
        'winback_120d',
        172800,
        'both',
        'Um convite especial para você voltar para a Aura Fitness ✨',
        'Oi {{primeiro_nome}}! Faz {{dias_sem_comprar}} dias da sua última visita e queremos muito te ver de volta. Liberamos um desconto especial de 15% OFF + prioridade no envio com o cupom *{{cupom}}*. Vem ver o que mudou: {{link_loja}}',
        'VOLTAAURA15',
        15,
        TRUE
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.crm_settings (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 10. POLÍTICAS RLS DO CRM
-- ==============================================================================
ALTER TABLE public.crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customer_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_customer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "CRM members access crm_users" ON public.crm_users;
CREATE POLICY "CRM members access crm_users" ON public.crm_users
    FOR ALL TO authenticated USING (public.is_crm_member());

DROP POLICY IF EXISTS "Public upsert own cart" ON public.crm_carts;
CREATE POLICY "Public upsert own cart" ON public.crm_carts
    FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "CRM members access notes" ON public.crm_customer_notes;
CREATE POLICY "CRM members access notes" ON public.crm_customer_notes
    FOR ALL TO authenticated USING (public.is_crm_member());

DROP POLICY IF EXISTS "CRM members access events" ON public.crm_customer_events;
CREATE POLICY "CRM members access events" ON public.crm_customer_events
    FOR ALL TO anon, authenticated USING (TRUE) WITH CHECK (TRUE);

DROP POLICY IF EXISTS "CRM members access automations" ON public.crm_automations;
CREATE POLICY "CRM members access automations" ON public.crm_automations
    FOR ALL TO authenticated USING (public.is_crm_member());

DROP POLICY IF EXISTS "CRM members access message_queue" ON public.crm_message_queue;
CREATE POLICY "CRM members access message_queue" ON public.crm_message_queue
    FOR ALL TO authenticated USING (public.is_crm_member());

DROP POLICY IF EXISTS "CRM members access campaigns" ON public.crm_campaigns;
CREATE POLICY "CRM members access campaigns" ON public.crm_campaigns
    FOR ALL TO authenticated USING (public.is_crm_member());

DROP POLICY IF EXISTS "CRM members access settings" ON public.crm_settings;
CREATE POLICY "CRM members access settings" ON public.crm_settings
    FOR ALL TO authenticated USING (public.is_crm_member());
