import { useState } from 'react';
import { Plus, BookOpen, Clock, Users, ChevronRight, Trash2 } from 'lucide-react';
import { recetasService } from '../../services';
import type { Receta, RecetaForm } from '../../types';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RecetaBuilder from './RecetaBuilder';

const DEFAULT_FORM: RecetaForm = {
  nombre: '', rinde_porciones: 12, tiempo_prep_minutos: 60,
  costo_packaging_fijo: 0, margen_ganancia_porcentaje: 150, notas: '',
};

export default function RecetasPage() {
  const [recetas, setRecetas] = useState<Receta[]>(() => recetasService.getAll());
  const [selected, setSelected] = useState<Receta | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RecetaForm>(DEFAULT_FORM);
  const [delId, setDelId] = useState<string | null>(null);

  const refresh = () => setRecetas(recetasService.getAll());

  const handleCreate = () => {
    const nueva = recetasService.create(form);
    refresh();
    setShowForm(false);
    setForm(DEFAULT_FORM);
    setSelected(nueva);
  };

  const handleDelete = (id: string) => {
    recetasService.delete(id);
    refresh();
    setDelId(null);
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

      {recetas.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Sin recetas todavía"
          description="Creá tu primera receta y calculá su costo al instante."
          action={{ label: '+ Nueva receta', onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="space-y-2">
          {recetas.map(r => (
            <div key={r.id} className="card flex items-center gap-3">
              <button
                onClick={() => setSelected(r)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <div className="bg-violet-50 rounded-xl p-2.5">
                  <BookOpen size={18} className="text-violet-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{r.nombre}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                    <span className="flex items-center gap-1"><Users size={10} />{r.rinde_porciones} porciones</span>
                    <span className="flex items-center gap-1"><Clock size={10} />{r.tiempo_prep_minutos} min</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </button>
              <button onClick={() => setDelId(r.id)} className="text-gray-200 hover:text-red-400 transition-colors">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Porciones</label>
              <input type="number" min="1" className="input"
                value={form.rinde_porciones} onChange={e => setForm(f => ({ ...f, rinde_porciones: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Tiempo (min)</label>
              <input type="number" min="0" className="input"
                value={form.tiempo_prep_minutos} onChange={e => setForm(f => ({ ...f, tiempo_prep_minutos: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Empaque ($)</label>
              <input type="number" min="0" className="input"
                value={form.costo_packaging_fijo} onChange={e => setForm(f => ({ ...f, costo_packaging_fijo: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Margen de Ganancia (%)</label>
              <input type="number" min="0" className="input"
                value={form.margen_ganancia_porcentaje} onChange={e => setForm(f => ({ ...f, margen_ganancia_porcentaje: Number(e.target.value) }))} />
            </div>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input resize-none" rows={2}
              value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
          </div>
          <button onClick={handleCreate} disabled={!form.nombre.trim()} className="btn-primary w-full justify-center mt-2">
            Crear y calcular costos →
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Eliminar receta"
        message="¿Eliminar esta receta y todas sus líneas? Esta acción no se puede deshacer."
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
