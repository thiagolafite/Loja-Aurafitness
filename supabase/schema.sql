-- ==============================================================================
-- SCHEMA COMPLETO DO SUPABASE - AURA FITNESS (PRODUÇÃO)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE USUÁRIOS ADMINISTRADORES (RBAC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Função helper para verificar se o usuário atual é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. TABELA DE CLIENTES / PERFIS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf TEXT,
    phone TEXT,
    total_orders INTEGER NOT NULL DEFAULT 0,
    total_spent NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    average_ticket NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    wishlist JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array de IDs de produtos
    saved_payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_access TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente ao registrar no Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, phone, cpf)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'Cliente Aura'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'cpf', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 4. TABELA DE ENDEREÇOS DE CLIENTES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    cep TEXT NOT NULL,
    street TEXT NOT NULL,
    number TEXT NOT NULL,
    complement TEXT,
    neighborhood TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- ==============================================================================
-- 5. TABELA DE PRODUTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    full_description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    promotional_price NUMERIC(10,2),
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT NOT NULL DEFAULT '7890000000000',
    weight NUMERIC(10,2) NOT NULL DEFAULT 200, -- em gramas
    brand TEXT NOT NULL DEFAULT 'Aura Fitness',
    images TEXT[] NOT NULL DEFAULT '{}',
    video_url TEXT,
    sizes TEXT[] NOT NULL DEFAULT '{}', -- ex: ['PP', 'P', 'M', 'G', 'GG']
    colors JSONB NOT NULL DEFAULT '[]'::jsonb, -- ex: [{"name": "Preto", "hex": "#111111"}]
    materials TEXT[] NOT NULL DEFAULT '{}',
    stock JSONB NOT NULL DEFAULT '{}'::jsonb, -- ex: {"P-Preto": 10, "M-Preto": 15}
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_new_arrival BOOLEAN NOT NULL DEFAULT TRUE,
    is_best_seller BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    seo JSONB NOT NULL DEFAULT '{"title": "", "description": "", "keywords": []}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);

-- ==============================================================================
-- 6. TABELA DE PEDIDOS (ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer JSONB NOT NULL, -- { name, email, cpf, phone }
    shipping_address JSONB NOT NULL,
    shipping_method JSONB NOT NULL,
    payment_method TEXT NOT NULL, -- 'pix', 'credit_card', 'debit_card', 'boleto'
    payment_details JSONB, -- { pixQrCode, pixCopyPaste, cardBrand, cardLastFour, transactionId }
    totals JSONB NOT NULL, -- { subtotal, discount, shipping, total }
    status TEXT NOT NULL DEFAULT 'pendente', -- 'pendente', 'pago', 'em_separacao', 'enviado', 'entregue', 'cancelado'
    tracking_code TEXT,
    coupon_code TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- ==============================================================================
-- 7. TABELA DE ITENS DO PEDIDO (ORDER_ITEMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    product_image TEXT,
    sku TEXT,
    size TEXT NOT NULL,
    color_name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- ==============================================================================
-- 8. TABELA DE AVALIAÇÕES (REVIEWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    product_image TEXT,
    customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    admin_reply TEXT,
    is_spam BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Trigger para recalcular rating e review_count do produto automaticamente
CREATE OR REPLACE FUNCTION public.recalculate_product_rating()
RETURNS TRIGGER AS $$
DECLARE
    target_product_id UUID;
    avg_rating NUMERIC(3,1);
    cnt INTEGER;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_product_id := OLD.product_id;
    ELSE
        target_product_id := NEW.product_id;
    END IF;

    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 5.0), COUNT(*)
    INTO avg_rating, cnt
    FROM public.reviews
    WHERE product_id = target_product_id AND status = 'approved';

    UPDATE public.products
    SET rating = avg_rating, review_count = cnt, updated_at = NOW()
    WHERE id = target_product_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_review_change ON public.reviews;
CREATE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW EXECUTE FUNCTION public.recalculate_product_rating();

-- ==============================================================================
-- 9. TABELA DE BLOG POSTS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL DEFAULT 'Moda Fitness',
    author JSONB NOT NULL DEFAULT '{"name": "Equipe Aura Fitness", "avatar": ""}'::jsonb,
    image_url TEXT NOT NULL DEFAULT '',
    read_time_minutes INTEGER NOT NULL DEFAULT 4,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    seo JSONB NOT NULL DEFAULT '{"title": "", "description": ""}'::jsonb,
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published);

-- ==============================================================================
-- 10. TABELA DE CUPONS (COUPONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed', 'free_shipping'
    value NUMERIC(10,2) NOT NULL,
    min_spend NUMERIC(10,2) DEFAULT 0.00,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    is_first_purchase_only BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- ==============================================================================
-- 11. TABELA DE PROMOÇÕES (PROMOTIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    badge_text TEXT NOT NULL DEFAULT 'OFERTA',
    banner_url TEXT NOT NULL DEFAULT '',
    discount_percentage NUMERIC(5,2) NOT NULL,
    product_ids TEXT[] NOT NULL DEFAULT '{}',
    category TEXT,
    start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 12. TABELA DE CONJUNTOS / LOOKS (LOOK_SETS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.look_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    product_ids TEXT[] NOT NULL DEFAULT '{}',
    set_discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 15.00,
    total_price NUMERIC(10,2) NOT NULL,
    discounted_price NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 13. TABELA DE CONFIGURAÇÕES DA LOJA (STORE_SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL DEFAULT 'Aura Fitness Moda Esportiva',
    cnpj TEXT NOT NULL DEFAULT '48.912.345/0001-99',
    phone TEXT NOT NULL DEFAULT '(11) 99999-8888',
    whatsapp_number TEXT NOT NULL DEFAULT '5511999998888',
    pix_key TEXT NOT NULL DEFAULT 'aurafitnesswork@gmail.com',
    pix_key_type TEXT NOT NULL DEFAULT 'E-mail',
    email TEXT NOT NULL DEFAULT 'aurafitnesswork@gmail.com',
    address TEXT NOT NULL DEFAULT 'São Paulo - SP',
    social JSONB NOT NULL DEFAULT '{"instagram": "https://www.instagram.com/adoro.aura/", "facebook": "https://facebook.com/adoro.aura", "youtube": "https://youtube.com", "tiktok": "https://tiktok.com/@adoro.aura"}'::jsonb,
    logo_url TEXT NOT NULL DEFAULT '',
    banner_url TEXT NOT NULL DEFAULT '',
    shipping JSONB NOT NULL DEFAULT '{"freeShippingThreshold": 299.00, "defaultFlatRate": 19.90, "enableCorreios": true, "regions": []}'::jsonb,
    seo JSONB NOT NULL DEFAULT '{"defaultTitle": "Aura Fitness", "defaultDescription": ""}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- 14. TABELA DE AUDITORIA DE ESTOQUE (INVENTORY_MOVEMENTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    sku TEXT,
    type TEXT NOT NULL, -- 'in', 'out', 'adjustment'
    quantity INTEGER NOT NULL,
    variant TEXT NOT NULL,
    reason TEXT NOT NULL,
    user_name TEXT NOT NULL DEFAULT 'Sistema',
    date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory_movements(product_id);

-- ==============================================================================
-- 15. TABELA DE LOGS DE PAGAMENTO (PAYMENT_LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    method TEXT NOT NULL,
    status TEXT NOT NULL, -- 'success', 'failed', 'pending'
    transaction_id TEXT,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);

-- ==============================================================================
-- 16. TABELA DE NOTIFICAÇÕES DO ADMIN (NOTIFICATIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system', -- 'order', 'stock', 'review', 'system'
    read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ==============================================================================
-- 17. FUNÇÃO RPC ATÔMICA PARA CRIAÇÃO DE PEDIDO & BAIXA DE ESTOQUE
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
    p_order JSONB,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_item JSONB;
    v_product_id UUID;
    v_quantity INT;
    v_variant_key TEXT;
    v_current_stock JSONB;
    v_current_qty INT;
    v_new_stock JSONB;
    v_product_name TEXT;
    v_sku TEXT;
BEGIN
    -- 1. Gerar número de pedido único
    v_order_number := 'AURA-' || floor(10000 + random() * 90000)::text;

    -- 2. Inserir Pedido
    INSERT INTO public.orders (
        order_number,
        user_id,
        customer,
        shipping_address,
        shipping_method,
        payment_method,
        payment_details,
        totals,
        status,
        coupon_code,
        notes
    ) VALUES (
        v_order_number,
        CASE WHEN (p_order->>'user_id') IS NOT NULL AND (p_order->>'user_id') != '' THEN (p_order->>'user_id')::uuid ELSE NULL END,
        p_order->'customer',
        p_order->'shipping_address',
        p_order->'shipping_method',
        p_order->>'payment_method',
        p_order->'payment_details',
        p_order->'totals',
        COALESCE(p_order->>'status', 'pendente'),
        p_order->>'coupon_code',
        p_order->>'notes'
    )
    RETURNING id INTO v_order_id;

    -- 3. Processar cada item do pedido e baixar estoque de forma atômica
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_quantity := (v_item->>'quantity')::int;
        v_variant_key := (v_item->>'size') || '-' || (v_item->>'color_name');

        -- Inserir item do pedido
        INSERT INTO public.order_items (
            order_id,
            product_id,
            product_name,
            product_image,
            sku,
            size,
            color_name,
            price,
            quantity,
            total
        ) VALUES (
            v_order_id,
            v_product_id,
            v_item->>'product_name',
            v_item->>'product_image',
            v_item->>'sku',
            v_item->>'size',
            v_item->>'color_name',
            (v_item->>'price')::numeric,
            v_quantity,
            (v_item->>'total')::numeric
        );

        -- Buscar estoque atual do produto bloqueando a linha (FOR UPDATE)
        SELECT stock, name, sku INTO v_current_stock, v_product_name, v_sku
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF FOUND AND v_current_stock ? v_variant_key THEN
            v_current_qty := COALESCE((v_current_stock->>v_variant_key)::int, 0);
            v_new_stock := jsonb_set(
                v_current_stock,
                ARRAY[v_variant_key],
                to_jsonb(GREATEST(0, v_current_qty - v_quantity))
            );

            UPDATE public.products
            SET stock = v_new_stock, updated_at = NOW()
            WHERE id = v_product_id;

            -- Registrar movimentação de estoque
            INSERT INTO public.inventory_movements (
                product_id,
                product_name,
                sku,
                type,
                quantity,
                variant,
                reason,
                user_name
            ) VALUES (
                v_product_id,
                v_product_name,
                v_sku,
                'out',
                v_quantity,
                v_variant_key,
                'Venda do Pedido #' || v_order_number,
                COALESCE(p_order->'customer'->>'name', 'Cliente Checkout')
            );
        END IF;
    END LOOP;

    -- 4. Incrementar contagem do cupom se utilizado
    IF (p_order->>'coupon_code') IS NOT NULL AND (p_order->>'coupon_code') != '' THEN
        UPDATE public.coupons
        SET used_count = used_count + 1
        WHERE UPPER(code) = UPPER(p_order->>'coupon_code');
    END IF;

    -- 5. Atualizar estatísticas do cliente se logado
    IF (p_order->>'user_id') IS NOT NULL AND (p_order->>'user_id') != '' THEN
        UPDATE public.profiles
        SET 
            total_orders = total_orders + 1,
            total_spent = total_spent + (p_order->'totals'->>'total')::numeric,
            average_ticket = (total_spent + (p_order->'totals'->>'total')::numeric) / (total_orders + 1),
            updated_at = NOW()
        WHERE id = (p_order->>'user_id')::uuid;
    END IF;

    -- 6. Criar notificação para o painel Admin
    INSERT INTO public.notifications (
        title,
        message,
        type,
        action_url
    ) VALUES (
        'Novo pedido criado!',
        'Pedido #' || v_order_number || ' no valor de R$ ' || (p_order->'totals'->>'total') || ' por ' || (p_order->'customer'->>'name'),
        'order',
        '/admin/pedidos'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.look_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ADMIN_USERS: Apenas admins podem ler/modificar
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
    FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage admin_users" ON public.admin_users;
CREATE POLICY "Admins can manage admin_users" ON public.admin_users
    FOR ALL TO authenticated USING (public.is_admin());

-- PROFILES: Usuário gerencia o próprio perfil; Admin gerencia tudo
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Admin can insert/delete profiles" ON public.profiles;
CREATE POLICY "Admin can insert/delete profiles" ON public.profiles
    FOR ALL TO authenticated USING (public.is_admin());

-- ADDRESSES: Usuário gerencia seus endereços; Admin gerencia tudo
DROP POLICY IF EXISTS "Users can manage own addresses" ON public.addresses;
CREATE POLICY "Users can manage own addresses" ON public.addresses
    FOR ALL TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- PRODUCTS: Público lê produtos ativos; Admin gerencia todos
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
CREATE POLICY "Public can view active products" ON public.products
    FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products
    FOR ALL TO authenticated USING (public.is_admin());

-- ORDERS & ORDER_ITEMS:
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Allow public order insertion via RPC" ON public.orders;
CREATE POLICY "Allow public order insertion via RPC" ON public.orders
    FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
    FOR UPDATE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND (orders.user_id = auth.uid() OR public.is_admin())
        )
    );

DROP POLICY IF EXISTS "Allow order items insertion" ON public.order_items;
CREATE POLICY "Allow order items insertion" ON public.order_items
    FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- REVIEWS: Público lê avaliações aprovadas; Usuário autenticado cria; Admin modera
DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews" ON public.reviews
    FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can submit review" ON public.reviews;
CREATE POLICY "Anyone can submit review" ON public.reviews
    FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews
    FOR ALL TO authenticated USING (public.is_admin());

-- BLOG_POSTS: Público lê publicados; Admin gerencia
DROP POLICY IF EXISTS "Public can view published blog posts" ON public.blog_posts;
CREATE POLICY "Public can view published blog posts" ON public.blog_posts
    FOR SELECT TO anon, authenticated USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage blog posts" ON public.blog_posts;
CREATE POLICY "Admins can manage blog posts" ON public.blog_posts
    FOR ALL TO authenticated USING (public.is_admin());

-- COUPONS: Público pode ler cupons ativos para validação; Admin gerencia
DROP POLICY IF EXISTS "Public can read active coupons" ON public.coupons;
CREATE POLICY "Public can read active coupons" ON public.coupons
    FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons
    FOR ALL TO authenticated USING (public.is_admin());

-- PROMOTIONS & LOOK_SETS: Leitura pública de ativos; Admin gerencia
DROP POLICY IF EXISTS "Public can read active promotions" ON public.promotions;
CREATE POLICY "Public can read active promotions" ON public.promotions
    FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage promotions" ON public.promotions;
CREATE POLICY "Admins can manage promotions" ON public.promotions
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Public can read active look sets" ON public.look_sets;
CREATE POLICY "Public can read active look sets" ON public.look_sets
    FOR SELECT TO anon, authenticated USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage look sets" ON public.look_sets;
CREATE POLICY "Admins can manage look sets" ON public.look_sets
    FOR ALL TO authenticated USING (public.is_admin());

-- STORE_SETTINGS: Leitura pública; Escrita apenas Admin
DROP POLICY IF EXISTS "Public can view store settings" ON public.store_settings;
CREATE POLICY "Public can view store settings" ON public.store_settings
    FOR SELECT TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage store settings" ON public.store_settings;
CREATE POLICY "Admins can manage store settings" ON public.store_settings
    FOR ALL TO authenticated USING (public.is_admin());

-- INVENTORY_MOVEMENTS, PAYMENT_LOGS, NOTIFICATIONS: Apenas Admin
DROP POLICY IF EXISTS "Admins can view inventory movements" ON public.inventory_movements;
CREATE POLICY "Admins can view inventory movements" ON public.inventory_movements
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view payment logs" ON public.payment_logs;
CREATE POLICY "Admins can view payment logs" ON public.payment_logs
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view and update notifications" ON public.notifications;
CREATE POLICY "Admins can view and update notifications" ON public.notifications
    FOR ALL TO authenticated USING (public.is_admin());
