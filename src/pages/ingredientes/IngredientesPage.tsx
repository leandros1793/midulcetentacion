import { useState, useEffect, useCallback } from 'react';
import { Plus, ShoppingBasket, Trash2, Edit2, Search, ChefHat, ShoppingCart, Sparkles, Loader2 } from 'lucide-react';
import { ingredientesService } from '../../services';
import {
  calcCostoPorUnidadReceta,
  type Ingrediente, type IngredienteForm,
  type CategoriaIngrediente, type UnidadCompra, type UnidadReceta,
} from '../../types';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIAS: CategoriaIngrediente[] = [
  'Lácteos','Harinas','Azúcares','Huevos','Grasas',
  'Frutas','Chocolates','Decoración','Esencias','Leudantes','Otros',
];

const UNIDADES_COMPRA: UnidadCompra[] = ['Kg', 'Litro', 'Unidad'];

const UNIT_MAP: Record<UnidadCompra, { receta: UnidadReceta; factor: number; hint: string }> = {
  Kg:     { receta: 'Gramos',     factor: 1000, hint: '1 Kg = 1.000 gramos' },
  Litro:  { receta: 'Mililitros', factor: 1000, hint: '1 Litro = 1.000 mililitros' },
  Unidad: { receta: 'Unidad',     factor: 1,    hint: 'Se cuenta por unidad' },
};

const CATEGORIA_COLORS: Record<CategoriaIngrediente, string> = {
  'Lácteos':    'bg-blue-50 text-blue-600',
  'Harinas':    'bg-amber-50 text-amber-600',
  'Azúcares':   'bg-pink-50 text-pink-600',
  'Huevos':     'bg-yellow-50 text-yellow-600',
  'Grasas':     'bg-orange-50 text-orange-600',
  'Frutas':     'bg-emerald-50 text-emerald-600',
  'Chocolates': 'bg-amber-100 text-amber-800',
  'Decoración': 'bg-purple-50 text-purple-600',
  'Esencias':   'bg-teal-50 text-teal-600',
  'Leudantes':  'bg-lime-50 text-lime-600',
  'Otros':      'bg-gray-50 text-gray-600',
};

const DEFAULT_FORM: IngredienteForm = {
  nombre: '', proveedor: '', categoria: 'Harinas',
  precio_compra: 0, cantidad_empaque: 1,
  unidad_medida_compra: 'Kg', unidad_medida_receta: 'Gramos',
  factor_conversion: 1000, merma_porcentaje: 0,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 4 }).format(n);
}

function singularUnit(u: string): string {
  const map: Record<string, string> = {
    Gramos: 'gramo', Mililitros: 'mililitro', Unidad: 'unidad',
  };
  return map[u] ?? u.toLowerCase();
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [query,    setQuery]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<Ingrediente | null>(null);
  const [form,     setForm]     = useState<IngredienteForm>(DEFAULT_FORM);
  const [delId,    setDelId]    = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setIngredientes(await ingredientesService.getAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openNew = () => { setEditing(null); setForm(DEFAULT_FORM); setShowForm(true); };

  const openEdit = (ing: Ingrediente) => {
    setEditing(ing);
    const { factor, receta } = UNIT_MAP[ing.unidad_medida_compra];
    setForm({
      nombre:               ing.nombre,
      proveedor:            ing.proveedor,
      categoria:            ing.categoria,
      precio_compra:        ing.precio_compra,
      cantidad_empaque:     ing.cantidad_empaque,
      unidad_medida_compra: ing.unidad_medida_compra,
      unidad_medida_receta: receta,
      factor_conversion:    factor,
      merma_porcentaje:     ing.merma_porcentaje,
    });
    setShowForm(true);
  };

  const handleUnidadCompraChange = (u: UnidadCompra) => {
    const { receta, factor } = UNIT_MAP[u];
    setForm(f => ({ ...f, unidad_medida_compra: u, unidad_medida_receta: receta, factor_conversion: factor }));
  };

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (editing) await ingredientesService.update(editing.id, form);
      else         await ingredientesService.create(form);
      await refresh();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await ingredientesService.delete(id);
    await refresh();
    setDelId(null);
  };

  const filtered = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(query.toLowerCase()) ||
    i.categoria.toLowerCase().includes(query.toLowerCase())
  );

  const unitInfo    = UNIT_MAP[form.unidad_medida_compra];
  const costoPreview =
    form.precio_compra > 0 && form.cantidad_empaque > 0
      ? (form.precio_compra / (form.cantidad_empaque * form.factor_conversion))
        * (1 + form.merma_porcentaje / 100)
      : null;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Ingredientes</h2>
          <p className="text-xs text-gray-400">{ingredientes.length} productos</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Búsqueda */}
      {ingredientes.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-300" />
          <input className="input pl-8" placeholder="Buscar ingrediente…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-rose-300" />
        </div>
      ) : filtered.length === 0 && ingredientes.length === 0 ? (
        <EmptyState icon={ShoppingBasket} title="Sin ingredientes"
          description="Agregá tu primera materia prima para empezar a costear."
          action={{ label: '+ Agregar ingrediente', onClick: openNew }} />
      ) : (
        <div className="space-y-2">
          {filtered.map(ing => (
            <div key={ing.id} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{ing.nombre}</p>
                  <span className={`badge ${CATEGORIA_COLORS[ing.categoria]}`}>{ing.categoria}</span>
                </div>
                <p className="text-xs text-gray-400">
                  ${ing.precio_compra} / {ing.cantidad_empaque} {ing.unidad_medida_compra}
                  {ing.proveedor && ` · ${ing.proveedor}`}
                </p>
                <p className="text-xs font-semibold text-rose-600 mt-0.5">
                  {formatARS(calcCostoPorUnidadReceta(ing))} / {singularUnit(ing.unidad_medida_receta)}
                  {ing.merma_porcentaje > 0 && (
                    <span className="text-gray-400 font-normal"> (merma {ing.merma_porcentaje}%)</span>
                  )}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(ing)}
                  className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => setDelId(ing.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal con UI Conversacional ──────────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Editar ingrediente' : 'Nuevo ingrediente'}
      >
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nombre del ingrediente *</label>
              <input
                className="input"
                placeholder="ej. Harina 0000, Dulce de Leche Repostero…"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaIngrediente }))}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input className="input" placeholder="opcional"
                value={form.proveedor ?? ''}
                onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} />
            </div>
          </div>

          <div className="h-px bg-stone-100" />

          {/* Sección 1: ¿Cuánto pagaste? */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingCart size={13} className="text-amber-600" />
              </div>
              <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">
                ¿Cuánto pagaste y qué compraste?
              </p>
            </div>
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-stone-500">Pagué</span>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-bold pointer-events-none">$</span>
                  <input
                    type="number" min="0" step="any" placeholder="1500"
                    className="input pl-6 w-28 text-sm"
                    value={form.precio_compra || ''}
                    onChange={e => setForm(f => ({ ...f, precio_compra: Number(e.target.value) }))}
                  />
                </div>
                <span className="text-sm font-semibold text-stone-500">por</span>
                <input
                  type="number" min="0.01" step="any" placeholder="1"
                  className="input w-20 text-sm text-center"
                  value={form.cantidad_empaque || ''}
                  onChange={e => setForm(f => ({ ...f, cantidad_empaque: Number(e.target.value) }))}
                />
                <select
                  className="input w-28 text-sm font-semibold text-stone-700"
                  value={form.unidad_medida_compra}
                  onChange={e => handleUnidadCompraChange(e.target.value as UnidadCompra)}
                >
                  {UNIDADES_COMPRA.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              {form.precio_compra > 0 && form.cantidad_empaque > 0 && (
                <p className="text-[11px] text-amber-700 bg-white/70 rounded-xl px-3 py-1.5 border border-amber-100">
                  💡 Compraste <strong>{form.cantidad_empaque} {form.unidad_medida_compra}</strong>{' '}
                  de <strong>{form.nombre || 'este ingrediente'}</strong>{' '}
                  por <strong>${form.precio_compra.toLocaleString('es-AR')}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Sección 2: ¿Cómo lo medís? */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center shrink-0">
                <ChefHat size={13} className="text-rose-500" />
              </div>
              <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">
                ¿Cómo lo medís en la cocina?
              </p>
            </div>
            <div className="bg-stone-50 border border-stone-100 rounded-2xl p-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-stone-500 font-medium">Lo vas a medir en</span>
                <span className="inline-flex items-center gap-1.5 bg-white border-2 border-rose-200 text-rose-600 font-extrabold text-sm px-3 py-1.5 rounded-xl shadow-sm">
                  {form.unidad_medida_receta}
                </span>
                <span className="text-sm text-stone-400 font-medium">en tus recetas</span>
              </div>
              <p className="text-[11px] text-stone-400 mt-2.5 flex items-center gap-1.5">
                <span className="text-stone-300">↳</span>
                {unitInfo.hint} · el sistema convierte automáticamente
              </p>
            </div>
          </div>

          {/* Sección 3: Desperdicio */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-xs">♻️</span>
              </div>
              <p className="text-xs font-bold text-stone-600 uppercase tracking-widest">
                Desperdicio o Merma <span className="text-stone-400 normal-case font-normal">(opcional)</span>
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <input
                  type="number" min="0" max="100" step="0.5"
                  className="input w-24 text-center text-lg font-bold"
                  value={form.merma_porcentaje || ''}
                  placeholder="0"
                  onChange={e => setForm(f => ({ ...f, merma_porcentaje: Number(e.target.value) }))}
                />
                <span className="text-xl font-bold text-stone-400">%</span>
                {form.merma_porcentaje > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                    Se ajusta al costo
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-400 leading-relaxed">
                Ej: si comprás frutillas y les quitás el cabito, perdés aprox. un 5% del peso.
                Si usás el 100%, dejalo en <strong>0</strong>.
              </p>
            </div>
          </div>

          {/* Preview del costo */}
          {costoPreview !== null && (
            <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-4 border border-rose-100">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={13} className="text-rose-400" />
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
                  Costo calculado automáticamente
                </p>
              </div>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black text-rose-700 tabular-nums">
                  {formatARS(costoPreview)}
                </p>
                <p className="text-sm font-semibold text-rose-400">
                  / {singularUnit(form.unidad_medida_receta)}
                </p>
              </div>
              <p className="text-[11px] text-stone-400 mt-1.5">
                Cada {singularUnit(form.unidad_medida_receta)} de{' '}
                <strong>{form.nombre || 'este ingrediente'}</strong> te cuesta este monto.
                {form.merma_porcentaje > 0 && ` (incluye ${form.merma_porcentaje}% de merma)`}
              </p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving || !form.nombre.trim() || !form.precio_compra || !form.cantidad_empaque}
            className="btn-primary w-full justify-center"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : (editing ? 'Guardar cambios' : 'Crear ingrediente')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Eliminar ingrediente"
        message="¿Eliminar este ingrediente? Se quitará de todas las recetas que lo usen."
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
