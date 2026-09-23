-- ==============================================================================
-- BUCKETS DE STORAGE DO SUPABASE - AURA FITNESS
-- ==============================================================================

-- 1. Criar os buckets públicos para a loja
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('product-images', 'product-images', true),
    ('blog-images', 'blog-images', true),
    ('banners', 'banners', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Políticas de Row Level Security (RLS) para Storage

-- Leitura pública de todas as imagens em buckets públicos
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
CREATE POLICY "Public Read Product Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Read Blog Images" ON storage.objects;
CREATE POLICY "Public Read Blog Images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
CREATE POLICY "Public Read Banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Upload e gerenciamento de imagens permitido para administradores autenticados
DROP POLICY IF EXISTS "Admin Manage Product Images" ON storage.objects;
CREATE POLICY "Admin Manage Product Images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'product-images' AND public.is_admin())
WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Blog Images" ON storage.objects;
CREATE POLICY "Admin Manage Blog Images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'blog-images' AND public.is_admin())
WITH CHECK (bucket_id = 'blog-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Manage Banners" ON storage.objects;
CREATE POLICY "Admin Manage Banners"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'banners' AND public.is_admin())
WITH CHECK (bucket_id = 'banners' AND public.is_admin());

-- Clientes autenticados podem enviar seus próprios avatares
DROP POLICY IF EXISTS "Users Manage Own Avatars" ON storage.objects;
CREATE POLICY "Users Manage Own Avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()))
WITH CHECK (bucket_id = 'avatars' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));
