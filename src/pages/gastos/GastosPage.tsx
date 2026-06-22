import { useState, useEffect, useCallback } from 'react';
import { Plus, Receipt, Trash2, Calendar, Edit2, Loader2 } from 'lucide-react';
import { gastosService } from '../../services';
import type { GastoGeneral, GastoForm, CategoriaGasto } from '../../types';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatARS as _fmt } from '../../utils/format';

const CATEGORIAS: { value: string; label: string }[] = [
  { value: 'Fijo',     label: 'Fijo (alquiler, servicios básicos)' },
  { value: 'Variable', label: 'Variable (publicidad, insumos, etc.)' },
];

const DEFAULT_FORM: GastoForm = {
  descripcion: '', categoria: 'Fijo', monto: 0,
  fecha: new Date().toISOString().split('T')[0],
};

function formatARS(n: number) { return _fmt(n, 0); }

export default function GastosPage() {
  const [gastos,   setGastos]   = useState<GastoGeneral[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<GastoGeneral | null>(null);
  const [form,     setForm]     = useState<GastoForm>(DEFAULT_FORM);
  const [delId,    setDelId]    = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setGastos(await gastosService.getAll()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const openNew = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  };

  const openEdit = (g: GastoGeneral) => {
    setEditing(g);
    setForm({ descripcion: g.descripcion, categoria: g.categoria, monto: g.monto, fecha: g.fecha });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.descripcion.trim() || form.monto <= 0) return;
    setSaving(true);
    try {
      if (editing) await gastosService.update(editing.id, form);
      else         await gastosService.create(form);
      await refresh();
      setShowForm(false);
      setEditing(null);
      setForm(DEFAULT_FORM);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => { await gastosService.delete(id); await refresh(); setDelId(null); };

  // Agrupar por mes
  const byMonth = gastos.reduce<Record<string, GastoGeneral[]>>((acc, g) => {
    const key = g.fecha.slice(0, 7);
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  const months = Object.keys(byMonth).sort().reverse();

  const totalMesActual = (() => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return (byMonth[key] ?? []).reduce((s, g) => s + g.monto, 0);
  })();

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Gastos Generales</h2>
          <p className="text-xs text-gray-400">{gastos.length} registros</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm">
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* KPI del mes */}
      {gastos.length > 0 && (
        <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
          <p className="text-xs text-amber-600 font-medium mb-1">Total del mes actual</p>
          <p className="text-2xl font-black text-amber-700">{formatARS(totalMesActual)}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-rose-300" />
        </div>
      ) : gastos.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin gastos registrados"
          description="Registrá tus gastos fijos y variables para tener el panorama completo."
          action={{ label: '+ Registrar gasto', onClick: openNew }} />
      ) : (
        <div className="space-y-4">
          {months.map(month => {
            const items = byMonth[month];
            const total = items.reduce((s, g) => s + g.monto, 0);
            const [y, m] = month.split('-');
            const label = new Date(Number(y), Number(m) - 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
            return (
              <div key={month}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{label}</h3>
                  <span className="text-xs font-bold text-gray-600">{formatARS(total)}</span>
                </div>
                <div className="space-y-2">
                  {items.sort((a, b) => b.fecha.localeCompare(a.fecha)).map(g => (
                    <div key={g.id} className="card flex items-center gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${g.categoria === 'Fijo' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                        <Receipt size={16} className={g.categoria === 'Fijo' ? 'text-blue-500' : 'text-orange-500'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{g.descripcion}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Calendar size={10} />
                          <span>{new Date(g.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</span>
                          <span className={`badge ${g.categoria === 'Fijo' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                            {g.categoria}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-gray-800 shrink-0">{formatARS(g.monto)}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEdit(g)}
                          className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDelId(g.id)}
                          className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); setForm(DEFAULT_FORM); }}
        title={editing ? 'Editar gasto' : 'Registrar gasto'}
      >
        <div className="space-y-3">
          <div>
            <label className="label">Descripción *</label>
            <input
              className="input"
              placeholder="ej. Luz EPEC, Publicidad Instagram"
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto ($) *</label>
              <input
                type="number" min="0" step="any" className="input"
                value={form.monto || ''}
                onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input
                type="date" className="input"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="label">Categoría</label>
            <select
              className="input" value={form.categoria}
              onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaGasto }))}
            >
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.descripcion.trim() || form.monto <= 0}
            className="btn-primary w-full justify-center mt-1"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando…</> : (editing ? 'Guardar cambios' : 'Registrar gasto')}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Eliminar gasto"
        message="¿Eliminar este registro de gasto?"
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
