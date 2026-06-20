-- ════════════════════════════════════════════════════════════════════════════════
-- Mi Dulce Tentación — Bucket de Storage para imágenes de productos
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════════════════════

-- 1. Crear el bucket (público para que las URLs sean accesibles sin auth)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Política: lectura pública (para que las fotos se vean en la landing sin login)
CREATE POLICY "Imágenes públicas — lectura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- 3. Política: solo usuarios autenticados pueden subir imágenes
CREATE POLICY "Upload autenticado"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 4. Política: solo usuarios autenticados pueden reemplazar imágenes (upsert)
CREATE POLICY "Update autenticado"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- 5. Política: solo usuarios autenticados pueden borrar imágenes
CREATE POLICY "Delete autenticado"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');
