// ─── Enums ────────────────────────────────────────────────────────────────────

export type UnidadCompra = 'Kg' | 'Litro' | 'Unidad';
export type UnidadReceta = 'Gramos' | 'Mililitros' | 'Unidad';
export type CategoriaIngrediente =
  | 'Lácteos' | 'Harinas' | 'Azúcares' | 'Huevos'
  | 'Grasas' | 'Frutas' | 'Chocolates' | 'Decoración'
  | 'Esencias' | 'Leudantes' | 'Otros';
export type CategoriaGasto = 'Fijo' | 'Variable';

// ─── Modelos Base ─────────────────────────────────────────────────────────────

export interface Ingrediente {
  id: string;
  nombre: string;
  proveedor?: string;
  categoria: CategoriaIngrediente;
  precio_compra: number;           // Precio total del paquete
  cantidad_empaque: number;        // Cuántas unidades-de-compra trae el paquete
  unidad_medida_compra: UnidadCompra;
  unidad_medida_receta: UnidadReceta;
  factor_conversion: number;       // ej. 1000 para Kg→Gramos
  merma_porcentaje: number;        // 0-100
  created_at: string;
  updated_at: string;
}

/** Getter calculado — no se persiste, se deriva en runtime */
export function calcCostoPorUnidadReceta(ing: Ingrediente): number {
  const baseUnidades = ing.cantidad_empaque * ing.factor_conversion;
  const costoBase = ing.precio_compra / baseUnidades;
  const factorMerma = 1 + ing.merma_porcentaje / 100;
  return costoBase * factorMerma;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface RecetaIngrediente {
  id: string;
  receta_id: string;
  ingrediente_id: string;
  cantidad_usada: number;          // siempre en unidad_medida_receta
}

/** Getter calculado */
export function calcCostoLinea(ri: RecetaIngrediente, ing: Ingrediente): number {
  return ri.cantidad_usada * calcCostoPorUnidadReceta(ing);
}

// ─────────────────────────────────────────────────────────────────────────────

export type ModoVenta = 'entero' | 'por_unidad';

export interface Receta {
  id: string;
  nombre: string;
  rinde_porciones: number;
  modo_venta: ModoVenta;               // 'entero' = se vende todo junto | 'por_unidad' = cada unidad por separado
  tiempo_prep_minutos: number;
  costo_packaging_fijo: number;
  margen_ganancia_porcentaje: number;  // ej. 150 = markup del 150%
  image_url?: string;                  // URL de imagen en Supabase Storage
  visible_en_catalogo?: boolean;       // true = aparece en la landing pública
  notas?: string;
  created_at: string;
  updated_at: string;
}

/** Costos totales de una receta calculados en runtime */
export interface CostosReceta {
  costo_ingredientes: number;
  costo_mano_obra: number;
  costo_energetico: number;
  costo_packaging: number;
  costo_total: number;
  precio_venta_sugerido: number;
  ganancia_neta: number;
  costo_por_porcion: number;
  precio_por_porcion: number;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface Promocion {
  id: string;
  titulo: string;
  descripcion?: string;
  precio_promocional: number;
  imagen_url: string;
  activa: boolean;
  created_at: string;
}

export type PromocionForm = Omit<Promocion, 'id' | 'created_at'>;

// ─────────────────────────────────────────────────────────────────────────────

export interface GastoGeneral {
  id: string;
  descripcion: string;
  categoria: CategoriaGasto;
  monto: number;
  fecha: string;                   // ISO date string
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface Configuracion {
  id: string;
  valor_hora_trabajo: number;      // ARS por hora
  costo_fijo_por_hora: number;     // ARS por hora (alquiler + servicios)
  whatsapp_numero?: string;
  nombre_contacto_1?: string;
  whatsapp_numero_2?: string;
  nombre_contacto_2?: string;
  // ── Instagram ──────────────────────────────────────────────────────────────
  instagram_usuario?: string;      // ej. "@midulce_tentacion7"
  instagram_url?: string;          // ej. "https://www.instagram.com/midulce_tentacion7/"
  instagram_destacados?: string[]; // hasta 3 URLs de posts/reels
  updated_at: string;
}

// ─── Tipos utilitarios para formularios ──────────────────────────────────────

export type IngredienteForm = Omit<Ingrediente, 'id' | 'created_at' | 'updated_at'>;
export type RecetaForm = Omit<Receta, 'id' | 'created_at' | 'updated_at'>;
export type GastoForm = Omit<GastoGeneral, 'id' | 'created_at'>;
export type RecetaIngredienteForm = Omit<RecetaIngrediente, 'id' | 'receta_id'>;

// ─── Pedidos ──────────────────────────────────────────────────────────────────

export type EstadoPedido = 'pendiente' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  cliente?: string;
  fecha_entrega: string;        // ISO date (YYYY-MM-DD)
  estado: EstadoPedido;
  notas?: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoLinea {
  id: string;
  pedido_id: string;
  receta_id: string;
  cantidad: number;
  precio_unitario_cobrado: number;
  created_at: string;
}

export type PedidoForm      = Omit<Pedido,      'id' | 'created_at' | 'updated_at'>;
export type PedidoLineaForm = Omit<PedidoLinea, 'id' | 'pedido_id' | 'created_at'>;

// ─── Menú / Catálogo público ──────────────────────────────────────────────────

export type CategoriaMenu =
  | 'Tortas' | 'Alfajores' | 'Postres' | 'Mesas dulces'
  | 'Combos' | 'Temporada' | 'Otros';

export interface MenuItem {
  id: string;
  nombre: string;
  descripcion?: string;
  precio_display: number;     // Precio que ve el cliente (libre, no calculado)
  imagen_url?: string;        // URL pública Supabase Storage o externa
  categoria?: CategoriaMenu;
  visible: boolean;           // true = aparece en la landing
  orden: number;              // orden manual en el catálogo
  receta_id?: string;         // opcional: referencia a receta para ver margen
  created_at: string;
  updated_at: string;
}

export type MenuItemForm = Omit<MenuItem, 'id' | 'created_at' | 'updated_at'>;
