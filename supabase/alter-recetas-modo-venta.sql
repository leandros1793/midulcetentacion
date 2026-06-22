-- Agregar modo_venta a la tabla recetas
-- Correr en Supabase SQL Editor

ALTER TABLE recetas
  ADD COLUMN IF NOT EXISTS modo_venta text NOT NULL DEFAULT 'entero'
  CHECK (modo_venta IN ('entero', 'por_unidad'));
