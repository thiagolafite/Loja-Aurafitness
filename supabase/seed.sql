-- ==============================================================================
-- DADOS INICIAIS (SEED) - AURA FITNESS (PRODUÇÃO)
-- ==============================================================================

-- 1. Inserir Configurações da Loja
INSERT INTO public.store_settings (
    id,
    company_name,
    cnpj,
    phone,
    whatsapp_number,
    pix_key,
    pix_key_type,
    email,
    address,
    social,
    logo_url,
    banner_url,
    shipping,
    seo
) VALUES (
    'default',
    'Aura Fitness Moda Esportiva',
    '48.912.345/0001-99',
    '(11) 99999-8888',
    '5511999998888',
    'aurafitnesswork@gmail.com',
    'E-mail',
    'aurafitnesswork@gmail.com',
    'São Paulo - SP',
    '{"instagram": "https://www.instagram.com/adoro.aura/", "facebook": "https://facebook.com/adoro.aura", "youtube": "https://youtube.com", "tiktok": "https://tiktok.com/@adoro.aura"}'::jsonb,
    '/images/logo-aura.png',
    '/images/banner-style.png',
    '{"freeShippingThreshold": 299.00, "defaultFlatRate": 19.90, "enableCorreios": true, "regions": [{"id": "reg-1", "regionName": "Sudeste (SP, RJ, MG, ES)", "states": ["SP", "RJ", "MG", "ES"], "price": 14.90, "deliveryDays": 2}, {"id": "reg-2", "regionName": "Sul & Demais Regiões", "states": ["PR", "SC", "RS", "DF", "GO", "MT", "MS", "BA", "PE", "CE"], "price": 19.90, "deliveryDays": 5}]}'::jsonb,
    '{"defaultTitle": "Aura Fitness | Boutique de Moda Fitness Feminina", "defaultDescription": "Uma boutique de moda fitness feminina com peças exclusivas, unindo performance, conforto e elegância."}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    logo_url = EXCLUDED.logo_url,
    banner_url = EXCLUDED.banner_url,
    updated_at = NOW();

-- 2. Inserir Produtos Iniciais
INSERT INTO public.products (
    id,
    name,
    slug,
    description,
    full_description,
    category,
    price,
    promotional_price,
    sku,
    barcode,
    weight,
    brand,
    images,
    sizes,
    colors,
    materials,
    stock,
    is_featured,
    is_new_arrival,
    is_best_seller,
    is_active,
    rating,
    review_count,
    seo
) VALUES 
(
    '00000000-0000-0000-0000-000000000001',
    'Conjunto Style Black',
    'conjunto-style-black',
    'Conjunto Top + Legging de alta sustentação na cor preta.',
    'O Conjunto Style Black é o favorito das nossas clientes. Confeccionado em malha premium com alta compressão, toque aveludado e zero transparência.',
    'CONJUNTOS',
    349.90,
    289.90,
    'AUR-STY-BLK',
    '7891234560101',
    420,
    'Aura Fitness',
    ARRAY[
        '/images/look-3103.png',
        '/images/look-3214.png'
    ],
    ARRAY['PP', 'P', 'M', 'G', 'GG'],
    '[{"name": "Preto", "hex": "#111111"}, {"name": "Verde Oliva", "hex": "#2b5022"}]'::jsonb,
    ARRAY['86% Poliamida', '14% Elastano'],
    '{"P-Preto": 15, "M-Preto": 20, "G-Preto": 12, "P-Verde Oliva": 10, "M-Verde Oliva": 14}'::jsonb,
    true,
    true,
    true,
    true,
    5.0,
    48,
    '{"title": "Conjunto Style Black | Aura Fitness", "description": "Conjunto top e legging preto com compressão firme.", "keywords": ["conjunto fitness", "moda fitness"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    'Macaquinho Bless Black',
    'macaquinho-bless-black',
    'Macaquinho esportivo anatômico com costas abertas.',
    'O Macaquinho Bless Black combina liberdade de movimentos com design moderno e decote funcional nas costas.',
    'MACAQUINHOS',
    299.00,
    249.90,
    'AUR-MAC-BLK',
    '7891234560102',
    320,
    'Aura Fitness',
    ARRAY[
        '/images/macaco-bless.png',
        '/images/look-3656.png'
    ],
    ARRAY['PP', 'P', 'M', 'G'],
    '[{"name": "Preto", "hex": "#111111"}]'::jsonb,
    ARRAY['88% Poliamida', '12% Elastano'],
    '{"P-Preto": 12, "M-Preto": 18, "G-Preto": 8}'::jsonb,
    true,
    true,
    true,
    true,
    4.9,
    35,
    '{"title": "Macaquinho Bless Black | Aura Fitness", "description": "Macaquinho esportivo preto para treino e pilates.", "keywords": ["macaquinho fitness", "macaquinho preto"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'Conjunto Cinza Power',
    'conjunto-cinza-power',
    'Conjunto modelador em tom cinza atemporal.',
    'Confeccionado com elasticidade quadridirecional, o Conjunto Cinza Power proporciona um ajuste impecável que realça suas curvas.',
    'CONJUNTOS',
    399.00,
    319.90,
    'AUR-CNJ-GRY',
    '7891234560103',
    450,
    'Aura Fitness',
    ARRAY[
        '/images/look-3214.png',
        '/images/look-3603.png'
    ],
    ARRAY['PP', 'P', 'M', 'G', 'GG'],
    '[{"name": "Cinza Power", "hex": "#778899"}]'::jsonb,
    ARRAY['85% Poliamida', '15% Elastano'],
    '{"P-Cinza Power": 8, "M-Cinza Power": 15, "G-Cinza Power": 10}'::jsonb,
    true,
    false,
    true,
    true,
    4.8,
    29,
    '{"title": "Conjunto Cinza Power | Aura Fitness", "description": "Conjunto cinza de alta sustentação.", "keywords": ["conjunto cinza", "look treino"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000004',
    'Shorts Navy Power',
    'shorts-navy-power',
    'Conjunto Shorts + Blusa ajustada em Azul Navy.',
    'Projetado para treinos de alta performance, o Shorts Navy Power entrega respirabilidade e caimento anatômico.',
    'SHORTS',
    229.00,
    189.90,
    'AUR-SHO-NVY',
    '7891234560104',
    280,
    'Aura Fitness',
    ARRAY[
        '/images/banner-style.png',
        '/images/look-3656.png'
    ],
    ARRAY['PP', 'P', 'M', 'G'],
    '[{"name": "Azul Navy", "hex": "#1B2A4A"}]'::jsonb,
    ARRAY['87% Poliamida', '13% Elastano'],
    '{"P-Azul Navy": 14, "M-Azul Navy": 22, "G-Azul Navy": 9}'::jsonb,
    true,
    true,
    true,
    true,
    4.9,
    41,
    '{"title": "Shorts Navy Power | Aura Fitness", "description": "Conjunto shorts e top azul marinho.", "keywords": ["shorts fitness", "conjunto azul"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000005',
    'Top Cross Back Olive',
    'top-cross-back-olive',
    'Top fitness verde oliva com alças cruzadas nas costas.',
    'O Top Cross Back oferece média/alta sustentação para seus treinos diários com visual sofisticado.',
    'TOPS',
    159.90,
    129.90,
    'AUR-TOP-OLV',
    '7891234560105',
    160,
    'Aura Fitness',
    ARRAY[
        '/images/look-3603.png',
        '/images/look-3103.png'
    ],
    ARRAY['PP', 'P', 'M', 'G'],
    '[{"name": "Verde Oliva", "hex": "#2b5022"}]'::jsonb,
    ARRAY['90% Poliamida', '10% Elastano'],
    '{"P-Verde Oliva": 18, "M-Verde Oliva": 25, "G-Verde Oliva": 12}'::jsonb,
    true,
    false,
    true,
    true,
    5.0,
    52,
    '{"title": "Top Cross Back Olive | Aura Fitness", "description": "Top verde oliva com sustentação reforçada.", "keywords": ["top fitness", "top verde oliva"]}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000006',
    'Legging High Waist Nude',
    'legging-high-waist-nude',
    'Legging cós alto modeladora em tom nude aveludado.',
    'Legging de compressão nobre com toque macio e zero transparência.',
    'LEGGINGS',
    229.00,
    189.90,
    'AUR-LEG-NUD',
    '7891234560106',
    290,
    'Aura Fitness',
    ARRAY[
        '/images/look-3656.png',
        '/images/look-3214.png'
    ],
    ARRAY['PP', 'P', 'M', 'G', 'GG'],
    '[{"name": "Nude", "hex": "#D2B48C"}]'::jsonb,
    ARRAY['86% Poliamida', '14% Elastano'],
    '{"P-Nude": 11, "M-Nude": 16, "G-Nude": 7}'::jsonb,
    true,
    true,
    true,
    true,
    4.8,
    37,
    '{"title": "Legging High Waist Nude | Aura Fitness", "description": "Legging nude de alta sustentação.", "keywords": ["legging nude", "legging fitness"]}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserir Cupom Inicial
INSERT INTO public.coupons (
    code,
    discount_type,
    value,
    min_spend,
    used_count,
    expires_at,
    is_active
) VALUES (
    'AURA10',
    'percentage',
    10.00,
    150.00,
    45,
    '2026-12-31T23:59:59Z',
    true
) ON CONFLICT (code) DO NOTHING;

-- 4. Inserir Post Inicial do Blog
INSERT INTO public.blog_posts (
    title,
    slug,
    summary,
    content,
    category,
    author,
    image_url,
    read_time_minutes,
    is_published,
    seo
) VALUES (
    'Como Escolher a Legging Ideal para Seu Treino',
    'como-escolher-a-legging-ideal',
    'Entenda como a gramatura da malha e a elasticidade interferem na sua performance esportiva.',
    '<h2>A Importância da Compressão Certa</h2><p>Na hora de escolher roupas de treino, a legging é a peça chave de qualquer composição. Uma boa legging precisa garantir zero transparência, firmeza abdominal sem comprimir em excesso e regulação térmica eficiente.</p><h3>Dicas Essenciais:</h3><ul><li>Opte por tecidos com poliamida e elastano de alta densidade;</li><li>Verifique a modelagem do cós (cós alto anatômico não enrola durante agachamentos);</li><li>Escolha o tamanho exato de acordo com a tabela de medidas.</li></ul>',
    'Moda Fitness',
    '{"name": "Equipe Aura Fitness", "avatar": "/images/logo-aura.png"}'::jsonb,
    '/images/look-3214.png',
    5,
    true,
    '{"title": "Guia de Leggings | Aura Fitness Blog", "description": "Dicas essenciais para escolher a melhor legging sem transparência."}'::jsonb
) ON CONFLICT (slug) DO NOTHING;

-- 5. Inserir Avaliação Inicial
INSERT INTO public.reviews (
    id,
    product_id,
    product_name,
    product_image,
    customer_name,
    customer_email,
    rating,
    title,
    comment,
    status,
    admin_reply
) VALUES (
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000001',
    'Conjunto Style Black',
    '/images/look-3103.png',
    'Camila Rodrigues',
    'camila.r@gmail.com',
    5,
    'Simplesmente perfeito!',
    'A qualidade do tecido é surreal. Fiz o teste do agachamento e zero transparência! O cós não enrola nem escorrega durante o treino de perna.',
    'approved',
    'Muito obrigado Camila! Ficamos felizes que amou nosso ajuste AuraFit! ✨'
) ON CONFLICT (id) DO NOTHING;

