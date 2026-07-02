-- =============================================================
-- Mi Dulce Tentacion — Storage policies para bucket "menu-items"
-- EJECUTAR EN: Supabase Dashboard > SQL Editor
--
-- ANTES de correr este script, verificar en Storage > Buckets que:
--   1. El bucket "menu-items" existe
--   2. El toggle "Public bucket" esta ACTIVADO
-- =============================================================

-- Política 1: Cualquier usuario (anonimo o autenticado) puede VER las imagenes
CREATE POLICY "menu_items_storage_public_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'menu-items');

-- Política 2: Solo usuarios autenticados pueden SUBIR imagenes
CREATE POLICY "menu_items_storage_auth_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'menu-items');

-- Política 3: Solo usuarios autenticados pueden ACTUALIZAR imagenes
CREATE POLICY "menu_items_storage_auth_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'menu-items');

-- Política 4: Solo usuarios autenticados pueden ELIMINAR imagenes
CREATE POLICY "menu_items_storage_auth_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'menu-items');
