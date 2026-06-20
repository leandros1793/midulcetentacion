-- ═══════════════════════════════════════════════════════════════════════════════
-- Mi Dulce Tentación — Schema SQL para Supabase
-- Ejecutar completo en: Supabase Dashboard → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── Extensiones ───────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Tablas ────────────────────────────────────────────────────────────────────

create table if not exists ingredientes (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  proveedor             text,
  categoria             text not null,
  precio_compra         numeric(12,4) not null default 0,
  cantidad_empaque      numeric(12,4) not null default 1,
  unidad_medida_compra  text not null,
  unidad_medida_receta  text not null,
  factor_conversion     numeric(12,4) not null default 1,
  merma_porcentaje      numeric(5,2)  not null default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

create table if not exists recetas (
  id                          uuid primary key default gen_random_uuid(),
  nombre                      text not null,
  rinde_porciones             integer not null default 1,
  tiempo_prep_minutos         integer not null default 60,
  costo_packaging_fijo        numeric(12,2) not null default 0,
  margen_ganancia_porcentaje  numeric(6,2)  not null default 150,
  image_url                   text,
  visible_en_catalogo         boolean not null default true,
  notas                       text,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

create table if not exists receta_ingredientes (
  id              uuid primary key default gen_random_uuid(),
  receta_id       uuid not null references recetas(id) on delete cascade,
  ingrediente_id  uuid not null references ingredientes(id) on delete cascade,
  cantidad_usada  numeric(12,4) not null,
  unique (receta_id, ingrediente_id)
);

create table if not exists gastos (
  id          uuid primary key default gen_random_uuid(),
  descripcion text not null,
  categoria   text not null check (categoria in ('Fijo', 'Variable')),
  monto       numeric(12,2) not null,
  fecha       date not null default current_date,
  created_at  timestamptz default now()
);

-- Configuración global (fila única)
create table if not exists configuracion (
  id                  text primary key default 'singleton',
  valor_hora_trabajo  numeric(12,2) not null default 500,
  costo_fijo_por_hora numeric(12,2) not null default 100,
  whatsapp_numero     text,
  updated_at          timestamptz default now()
);

-- Combos (paquetes de varias recetas)
create table if not exists combos (
  id                  uuid primary key default gen_random_uuid(),
  nombre              text not null,
  descripcion         text,
  precio_venta        numeric(12,2) not null default 0,
  image_url           text,
  visible_en_catalogo boolean not null default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create table if not exists combo_productos (
  id        uuid primary key default gen_random_uuid(),
  combo_id  uuid not null references combos(id) on delete cascade,
  receta_id uuid not null references recetas(id) on delete cascade,
  cantidad  integer not null default 1
);


-- ── Row Level Security (RLS) ──────────────────────────────────────────────────

alter table ingredientes        enable row level security;
alter table recetas             enable row level security;
alter table receta_ingredientes enable row level security;
alter table gastos              enable row level security;
alter table configuracion       enable row level security;
alter table combos              enable row level security;
alter table combo_productos     enable row level security;


-- ── Políticas: Lectura pública (catálogo) ─────────────────────────────────────
-- La landing page lee recetas y combos visibles SIN autenticación.

create policy "Catálogo público — recetas"
  on recetas for select
  using (visible_en_catalogo = true);

create policy "Catálogo público — combos"
  on combos for select
  using (visible_en_catalogo = true);

-- receta_ingredientes y configuracion también son de lectura pública
-- (necesarios para calcular precios en la landing)
create policy "Lectura pública — receta_ingredientes"
  on receta_ingredientes for select using (true);

create policy "Lectura pública — ingredientes"
  on ingredientes for select using (true);

create policy "Lectura pública — configuracion"
  on configuracion for select using (true);

create policy "Lectura pública — combo_productos"
  on combo_productos for select using (true);


-- ── Políticas: Acceso completo para usuarios autenticados ─────────────────────

create policy "Auth — full access ingredientes"
  on ingredientes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access recetas"
  on recetas for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access receta_ingredientes"
  on receta_ingredientes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access gastos"
  on gastos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access configuracion"
  on configuracion for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access combos"
  on combos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Auth — full access combo_productos"
  on combo_productos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');


-- ── Fila singleton de configuración inicial ───────────────────────────────────
insert into configuracion (id, valor_hora_trabajo, costo_fijo_por_hora)
values ('singleton', 500, 100)
on conflict (id) do nothing;


-- ── Trigger updated_at automático ─────────────────────────────────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_ingredientes_updated_at
  before update on ingredientes
  for each row execute function set_updated_at();

create trigger trg_recetas_updated_at
  before update on recetas
  for each row execute function set_updated_at();

create trigger trg_combos_updated_at
  before update on combos
  for each row execute function set_updated_at();

create trigger trg_configuracion_updated_at
  before update on configuracion
  for each row execute function set_updated_at();


-- ════════════════════════════════════════════════════════════════════════════════
-- STORAGE: Bucket product-images
-- Ejecutar esto POR SEPARADO desde Supabase Dashboard → Storage → New bucket
-- O desde SQL Editor con la extensión storage:
-- ════════════════════════════════════════════════════════════════════════════════
/*
  1. Ir a Storage → "New bucket"
  2. Nombre: product-images
  3. ✅ Public bucket (para que las URLs sean accesibles sin auth)
  4. Políticas recomendadas (se pueden aplicar desde SQL Editor):

  -- Lectura pública del bucket
  create policy "Imágenes públicas"
    on storage.objects for select
    using (bucket_id = 'product-images');

  -- Solo usuarios autenticados pueden subir / reemplazar imágenes
  create policy "Upload autenticado"
    on storage.objects for insert
    with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

  create policy "Update autenticado"
    on storage.objects for update
    using (bucket_id = 'product-images' and auth.role() = 'authenticated');

  create policy "Delete autenticado"
    on storage.objects for delete
    using (bucket_id = 'product-images' and auth.role() = 'authenticated');
*/
