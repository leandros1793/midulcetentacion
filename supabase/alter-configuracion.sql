-- ════════════════════════════════════════════════════════════════════════════════
-- Mi Dulce Tentación — Agregar columnas faltantes a "configuracion"
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ════════════════════════════════════════════════════════════════════════════════

ALTER TABLE configuracion
  ADD COLUMN IF NOT EXISTS nombre_contacto_1    text,
  ADD COLUMN IF NOT EXISTS nombre_contacto_2    text,
  ADD COLUMN IF NOT EXISTS whatsapp_numero_2    text,
  ADD COLUMN IF NOT EXISTS instagram_usuario    text,
  ADD COLUMN IF NOT EXISTS instagram_url        text,
  ADD COLUMN IF NOT EXISTS instagram_destacados text[];  -- array de URLs de posts/reels

-- Poblar el singleton con los valores reales del negocio
-- (solo actualiza si los campos están vacíos para no pisar datos existentes)
UPDATE configuracion SET
  nombre_contacto_1    = COALESCE(nombre_contacto_1,    'Belu'),
  whatsapp_numero      = COALESCE(whatsapp_numero,      '5493512476048'),
  nombre_contacto_2    = COALESCE(nombre_contacto_2,    'Flor'),
  whatsapp_numero_2    = COALESCE(whatsapp_numero_2,    '5493512217870'),
  instagram_usuario    = COALESCE(instagram_usuario,    '@midulce_tentacion7'),
  instagram_url        = COALESCE(instagram_url,        'https://www.instagram.com/midulce_tentacion7/'),
  instagram_destacados = COALESCE(instagram_destacados, ARRAY[]::text[])
WHERE id = 'singleton';
