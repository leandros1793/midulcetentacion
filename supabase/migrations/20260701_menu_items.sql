-- =============================================================
-- Mi Dulce Tentacion — Modulo Menu Publico
-- Tabla: menu_items
-- Descripcion: Catalogo publico con precio libre e imagen.
--              Separado del sistema de costos (recetas/escandallo).
-- =============================================================

-- 1. Enum de categorias del menu
CREATE TYPE categoria_menu AS ENUM (
  'Tortas',
  'Alfajores',
  'Postres',
  'Mesas dulces',
  'Combos',
  'Temporada',
  'Otros'
);

-- 2. Tabla principal
CREATE TABLE IF NOT EXISTS menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        TEXT        NOT NULL,
  descripcion   TEXT,
  precio_display NUMERIC(10,2) NOT NULL DEFAULT 0,
  imagen_url    TEXT,
  categoria     categoria_menu,
  visible       BOOLEAN     NOT NULL DEFAULT true,
  orden         INTEGER     NOT NULL DEFAULT 0,
  receta_id     UUID        REFERENCES recetas(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Indice para ordenar en el catalogo
CREATE INDEX IF NOT EXISTS idx_menu_items_orden ON menu_items (orden ASC);

-- 4. Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_menu_items_updated_at
  BEFORE UPDATE ON menu_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Row Level Security
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Lectura publica: cualquiera puede ver los items visibles (landing page)
CREATE POLICY "menu_items_public_read"
  ON menu_items FOR SELECT
  USING (visible = true);

-- Escritura solo para usuarios autenticados (duenas del negocio)
CREATE POLICY "menu_items_auth_all"
  ON menu_items FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Datos de ejemplo opcionales (comentar si no se quieren)
-- INSERT INTO menu_items (nombre, descripcion, precio_display, categoria, visible, orden)
-- VALUES
--   ('Torta de Cumpleanos', 'Esponjosa torta de vainilla con crema y frutas', 8500, 'Tortas', true, 1),
--   ('Alfajor de Maizena', 'Clasico relleno de dulce de leche y coco', 650, 'Alfajores', true, 2),
--   ('Postre Semifreddo', 'Postre helado de chocolate artesanal', 4200, 'Postres', true, 3);
