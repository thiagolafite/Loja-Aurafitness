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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!supabaseAdmin) {
    return res.status(500).json({ error: 'Supabase client not configured on server' });
  }

  try {
    if (req.method === 'GET') {
      const [{ data: products }, { data: settings }] = await Promise.all([
        supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
        supabaseAdmin.from('store_settings').select('*').eq('id', 'default').maybeSingle(),
      ]);
      return res.status(200).json({
        success: true,
        products: products || [],
        settings: settings || null,
      });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, payload } = req.body || {};

    // 1. Criar URL assinada para upload direto de vídeo/imagem no bucket público 'product-images'
    if (action === 'create_upload_url') {
      const filePath = payload?.path || `videos/vid_${Date.now()}.mp4`;
      const bucket = payload?.bucket || 'product-images';

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUploadUrl(filePath);

      if (error || !data) {
        return res.status(400).json({ error: error?.message || 'Erro ao criar URL de upload' });
      }

      const { data: pubData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);

      return res.status(200).json({
        success: true,
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path || filePath,
        publicUrl: pubData.publicUrl,
      });
    }

    // 2. Upload direto via base64 para arquivos compactos
    if (action === 'upload_base64') {
      const bucket = payload?.bucket || 'product-images';
      const filePath = payload?.path || `videos/vid_${Date.now()}.mp4`;
      const base64Data: string = payload?.base64 || '';
      const contentType: string = payload?.contentType || 'video/mp4';

      const cleanBase64 = base64Data.includes(',')
        ? base64Data.slice(base64Data.indexOf(',') + 1)
        : base64Data;
      const buffer = Buffer.from(cleanBase64, 'base64');

      const { error } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
        contentType,
        upsert: true,
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const { data: pubData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
      return res.status(200).json({
        success: true,
        publicUrl: pubData.publicUrl,
      });
    }

    // 3. Upsert de produtos (individual ou em lote)
    if (action === 'upsert_products') {
      const items: any[] = Array.isArray(payload?.products) ? payload.products : [];
      const saved: any[] = [];

      for (const item of items) {
        const row: any = {
          name: item.name || 'Novo Produto',
          slug: item.slug || `produto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          description: item.description || '',
          full_description: item.full_description ?? item.fullDescription ?? '',
          category: item.category || 'Conjuntos',
          price: Number(item.price) || 0,
          promotional_price:
            item.promotional_price !== undefined
              ? item.promotional_price
              : item.promotionalPrice || null,
          sku: item.sku || `SKU-${Date.now()}`,
          barcode: item.barcode || '7890000000000',
          weight: Number(item.weight) || 200,
          brand: item.brand || 'Aura Fitness',
          images: Array.isArray(item.images) ? item.images : ['/images/look-3103.png'],
          video_url: item.video_url !== undefined ? item.video_url : item.videoUrl || null,
          sizes: Array.isArray(item.sizes) ? item.sizes : ['P', 'M', 'G'],
          colors: Array.isArray(item.colors)
            ? item.colors
            : [{ name: 'Preto', hex: '#111111' }],
          materials: Array.isArray(item.materials) ? item.materials : ['Poliamida'],
          stock: item.stock || { 'P-Preto': 10 },
          is_featured: Boolean(item.is_featured ?? item.isFeatured ?? true),
          is_new_arrival: Boolean(item.is_new_arrival ?? item.isNewArrival ?? true),
          is_best_seller: Boolean(item.is_best_seller ?? item.isBestSeller ?? false),
          is_active: Boolean(item.is_active ?? item.isActive ?? true),
          seo: {
            ...(item.seo || { title: item.name || '', description: '', keywords: [] }),
            additionalCategories: Array.isArray(item.additionalCategories)
              ? item.additionalCategories
              : Array.isArray(item.seo?.additionalCategories)
                ? item.seo.additionalCategories
                : [],
          },
          updated_at: new Date().toISOString(),
        };

        if (item.id && typeof item.id === 'string' && !item.id.startsWith('prod-')) {
          row.id = item.id;
        }

        const { data, error } = await supabaseAdmin
          .from('products')
          .upsert(row)
          .select()
          .maybeSingle();

        if (!error && data) {
          saved.push({ localId: item.id, dbProduct: data });
        } else if (error) {
          // Se houve colisão de slug ou sku, ajusta sufixo e tenta novamente
          row.slug = `${row.slug}-${Date.now().toString().slice(-4)}`;
          row.sku = `${row.sku}-${Date.now().toString().slice(-3)}`;
          const retry = await supabaseAdmin.from('products').upsert(row).select().maybeSingle();
          if (!retry.error && retry.data) {
            saved.push({ localId: item.id, dbProduct: retry.data });
          }
        }
      }

      return res.status(200).json({ success: true, saved });
    }

    // 4. Excluir produtos por IDs (ou por nomes duplicados)
    if (action === 'delete_products' || action === 'bulk_delete_products') {
      const ids: string[] = Array.isArray(payload?.ids) ? payload.ids : [];
      const validUuids = ids.filter((id) => id && typeof id === 'string' && !id.startsWith('prod-'));
      if (validUuids.length > 0) {
        await supabaseAdmin.from('products').delete().in('id', validUuids);
      }
      return res.status(200).json({ success: true, deletedCount: validUuids.length });
    }

    // 5. Excluir todos os produtos
    if (action === 'delete_all_products') {
      await supabaseAdmin
        .from('products')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      return res.status(200).json({ success: true });
    }

    // 6. Sincronizar configurações extras da loja (Mini-Vídeo, Categorias, Fotos de Categoria, Seções, Banners)
    if (action === 'update_store_extra') {
      const { data: current } = await supabaseAdmin
        .from('store_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      const currentSeo = (current?.seo && typeof current.seo === 'object' ? current.seo : {}) as Record<
        string,
        any
      >;

      const updatedSeo = {
        ...currentSeo,
        ...(payload?.seoPatch || {}),
        updatedAt: new Date().toISOString(),
      };

      const { data, error } = await supabaseAdmin
        .from('store_settings')
        .upsert({
          id: 'default',
          company_name: current?.company_name || 'Aura Fitness Moda Esportiva',
          cnpj: current?.cnpj || '48.912.345/0001-99',
          phone: current?.phone || '(11) 99999-8888',
          whatsapp_number: current?.whatsapp_number || '5511999998888',
          pix_key: current?.pix_key || 'brendaraissasousasilva@jim.com',
          pix_key_type: current?.pix_key_type || 'E-mail',
          email: current?.email || 'brendaraissasousasilva@jim.com',
          address: current?.address || 'São Paulo - SP',
          social: current?.social || {},
          logo_url: current?.logo_url || '',
          banner_url: current?.banner_url || '',
          shipping: current?.shipping || {},
          seo: updatedSeo,
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();

      if (error) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(200).json({ success: true, settings: data });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err: any) {
    console.error('Error in /api/sync-store:', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}
