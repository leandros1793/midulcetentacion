import { useState, useEffect, useCallback } from 'react';
import { Plus, BookOpen, Clock, Users, Pencil, Trash2, Loader2, Globe, Lock, ShoppingBag, Package } from 'lucide-react';
import type { ModoVenta } from '../../types';
import { recetasService } from '../../services';
import type { Receta, RecetaForm } from '../../types';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RecetaBuilder from './RecetaBuilder';

const DEFAULT_FORM: RecetaForm = {
  nombre: '', rinde_porciones: 1, tiempo_prep_minutos: 60,
  modo_venta: 'entero',
  costo_packaging_fijo: 0, margen_ganancia_porcentaje: 150, notas: '',
  visible_en_catalogo: false,
};

export default function RecetasPage() {
  const [recetas,  setRecetas]  = useState<Receta[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Receta | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<RecetaForm>(DEFAULT_FORM);
  const [delId,    setDelId]    = useState<string | null>(null);
  const [delError, setDelError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setRecetas(await recetasService.getAll()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const nueva = await recetasService.create(form);
      await refresh();
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setSelected(nueva);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await recetasService.delete(id);
      await refresh();
      setDelId(null);
      setDelError('');
    } catch {
      setDelError('No se puede eliminar: esta receta está en uno o más pedidos activos.');
    }
  };

  if (selected) {
    return (
      <RecetaBuilder
        receta={selected}
        onBack={() => { setSelected(null); refresh(); }}
        onSave={updated => { setSelected(updated); refresh(); }}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Mis Recetas</h2>
          <p className="text-xs text-gray-400">{recetas.length} productos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> Nueva
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-rose-300" />
        </div>
      ) : recetas.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin recetas todavía"
          description="Creá tu primera receta y calculá su costo al instante."
          action={{ label: '+ Nueva receta', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {recetas.map(r => (
            <div key={r.id} className="card flex items-center gap-2">
              {/* Info — toca para editar */}
              <button
                onClick={() => setSelected(r)}
                className="flex-1 flex items-center gap-3 text-left min-w-0"
              >
                <div className="bg-violet-50 rounded-xl p-2.5 shrink-0">
                  <BookOpen size={18} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{r.nombre}</p>
                    {r.visible_en_catalogo
                      ? <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full"><Globe size={8} /> Pública</span>
                      : <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded-full"><Lock size={8} /> Privada</span>
                    }
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1"><Users size={10} />{r.rinde_porciones} {r.modo_venta === 'por_unidad' ? 'unidades' : 'porciones'}</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{r.tiempo_prep_minutos} min</span>
                    <span className="font-semibold text-emerald-600">+{r.margen_ganancia_porcentaje}%</span>
                  </div>
                </div>
              </button>
              {/* Acciones */}
              <button
                onClick={() => setSelected(r)}
                className="shrink-0 p-2 text-stone-300 hover:text-violet-500 hover:bg-violet-50 rounded-xl transition-colors"
                title="Editar receta"
              >
                <Pencil size={15} />
              </button>
              <button
                onClick={() => setDelId(r.id)}
                className="shrink-0 p-2 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-colors"
                title="Eliminar receta"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal nueva receta */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nueva receta">
        <div className="space-y-3">
          <div>
            <label className="label">Nombre *</label>
            <input className="input" placeholder="ej. Cheesecake de Frutos Rojos"
              value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>
          {/* Modo de venta */}
          <div>
            <label className="label">¿Cómo se vende?</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 'entero',     label: 'Producto entero', sub: 'Una torta, un flan…', icon: <Package size={15} /> },
                { value: 'por_unidad', label: 'Por unidad',      sub: 'Lemon pies, alfajores…', icon: <ShoppingBag size={15} /> },
              ] as { value: ModoVenta; label: string; sub: string; icon: React.ReactNode }[]).map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setForm(f => ({ ...f, modo_venta: opt.value }))}
                  className={`flex flex-col items-start gap-1 p-3 rounded-2xl border-2 text-left transition-all ${
                    form.modo_venta === opt.value
                      ? 'border-rose-300 bg-rose-50/60'
                      : 'border-stone-200 bg-stone-50/40 hover:border-stone-300'
                  }`}
                >
                  <span className={form.modo_venta === opt.value ? 'text-rose-500' : 'text-stone-400'}>
                    {opt.icon}
                  </span>
                  <span className={`text-xs font-bold leading-tight ${form.modo_venta === opt.value ? 'text-rose-600' : 'text-stone-600'}`}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-stone-400 leading-tight">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">
                {form.modo_venta === 'por_unidad' ? 'Rinde (unidades)' : 'Rinde (porciones)'}
              </label>
              <input type="number" min="1" className="input"
                value={form.rinde_porciones || ''} onChange={e => setForm(f => ({ ...f, rinde_porciones: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Tiempo (min)</label>
              <input type="number" min="0" className="input"
                value={form.tiempo_prep_minutos || ''} onChange={e => setForm(f => ({ ...f, tiempo_prep_minutos: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Empaque ($)</label>
              <input type="number" min="0" className="input"
                value={form.costo_packaging_fijo || ''} onChange={e => setForm(f => ({ ...f, costo_packaging_fijo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Margen (%)</label>
              <input type="number" min="0" className="input"
                value={form.margen_ganancia_porcentaje || ''} onChange={e => setForm(f => ({ ...f, margen_ganancia_porcentaje: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2}
              value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>

          {/* Visibilidad en catálogo */}
          <div>
            <label className="label">Visibilidad</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: false, label: 'Solo interna', icon: <Lock size={13} /> },
                { value: true,  label: 'En catálogo',  icon: <Globe size={13} /> },
              ] as { value: boolean; label: string; icon: React.ReactNode }[]).map(opt => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setForm(f => ({ ...f, visible_en_catalogo: opt.value }))}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                    form.visible_en_catalogo === opt.value
                      ? opt.value
                        ? 'border-rose-300 bg-rose-50/60 text-rose-600'
                        : 'border-stone-300 bg-stone-100/60 text-stone-600'
                      : 'border-stone-200 bg-stone-50/40 text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleCreate} disabled={creating || !form.nombre.trim()} className="btn-primary w-full justify-center mt-1">
            {creating ? <><Loader2 size={14} className="animate-spin" /> Creando…</> : 'Crear y calcular costos →'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Eliminar receta"
        message={delError || "¿Eliminar esta receta y todas sus líneas? Esta acción no se puede deshacer."}
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => { setDelId(null); setDelError(''); }}
      />
    </div>
  );
}
