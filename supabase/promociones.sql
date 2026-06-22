-- Tabla: promociones
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS promociones (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo             text        NOT NULL,
  descripcion        text,
  precio_promocional numeric(10,2) NOT NULL DEFAULT 0,
  imagen_url         text        NOT NULL DEFAULT '',
  activa             boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública"
  ON promociones FOR SELECT
  USING (true);

CREATE POLICY "Escritura autenticada"
  ON promociones FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Update autenticada"
  ON promociones FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Delete autenticada"
  ON promociones FOR DELETE
  USING (auth.role() = 'authenticated');
