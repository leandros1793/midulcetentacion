-- ── Pedidos y Pedido Líneas ───────────────────────────────────────────────────
-- Correr en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pedidos (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente        text,
  fecha_entrega  date        NOT NULL,
  estado         text        NOT NULL DEFAULT 'pendiente'
                             CHECK (estado IN ('pendiente', 'entregado', 'cancelado')),
  notas          text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pedido_lineas (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id               uuid        NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  receta_id               uuid        NOT NULL REFERENCES recetas(id),
  cantidad                integer     NOT NULL DEFAULT 1 CHECK (cantidad > 0),
  precio_unitario_cobrado numeric(10,2) NOT NULL DEFAULT 0,
  created_at              timestamptz NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pedidos_estado        ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha         ON pedidos(fecha_entrega DESC);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_pedido  ON pedido_lineas(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_lineas_receta  ON pedido_lineas(receta_id);

-- RLS
ALTER TABLE pedidos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_lineas ENABLE ROW LEVEL SECURITY;

-- Lectura pública desactivada — solo usuarios autenticados
CREATE POLICY "Auth: read pedidos"
  ON pedidos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth: insert pedidos"
  ON pedidos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth: update pedidos"
  ON pedidos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth: delete pedidos"
  ON pedidos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Auth: read pedido_lineas"
  ON pedido_lineas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth: insert pedido_lineas"
  ON pedido_lineas FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth: update pedido_lineas"
  ON pedido_lineas FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth: delete pedido_lineas"
  ON pedido_lineas FOR DELETE TO authenticated USING (true);
