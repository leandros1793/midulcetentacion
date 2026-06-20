import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight, ImageOff, Sparkles } from 'lucide-react';
import { promocionesService } from '../../services';
import type { Promocion, PromocionForm } from '../../types';

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n);
}

const EMPTY_FORM: PromocionForm = {
  titulo: '',
  descripcion: '',
  precio_promocional: 0,
  imagen_url: '',
  activa: true,
};

export default function PromocionesPage() {
  const [promos, setPromos]     = useState<Promocion[]>(() => promocionesService.getAll());
  const [form, setForm]         = useState<PromocionForm>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [imgError, setImgError] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const refresh = () => setPromos(promocionesService.getAll());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.imagen_url.trim()) return;
    promocionesService.create(form);
    setForm(EMPTY_FORM);
    setImgError(false);
    setShowForm(false);
    refresh();
  };

  const handleToggle = (id: string) => {
    promocionesService.toggleActiva(id);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    promocionesService.remove(id);
    refresh();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-stone-800 tracking-tight">Promociones</h2>
          <p className="text-xs text-stone-400 mt-0.5">Flyers y ofertas especiales de la tienda</p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setImgError(false); }}
          className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm shadow-rose-200"
        >
          <Plus size={14} /> Nueva promo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-rose-400" />
            <h3 className="text-sm font-bold text-stone-700">Nueva promoción</h3>
          </div>

          <div>
            <label className="label">Título *</label>
            <input
              className="input"
              placeholder='ej. "Mini Donitas Temáticas"'
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              className="input"
              placeholder='ej. "Docena personalizada para eventos"'
              value={form.descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          <div>
            <label className="label">Precio promocional ($)</label>
            <input
              type="number" min="0" step="any" className="input"
              placeholder="ej. 5000"
              value={form.precio_promocional || ''}
              onChange={e => setForm(f => ({ ...f, precio_promocional: Number(e.target.value) }))}
            />
          </div>

          <div>
            <label className="label">URL del flyer / imagen *</label>
            <input
              className="input"
              placeholder="https://... (pegá la URL de la imagen)"
              value={form.imagen_url}
              onChange={e => { setForm(f => ({ ...f, imagen_url: e.target.value })); setImgError(false); }}
              required
            />
            {/* Preview de la imagen */}
            {form.imagen_url && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50 aspect-[4/3] flex items-center justify-center">
                {imgError ? (
                  <div className="flex flex-col items-center gap-2 text-stone-300">
                    <ImageOff size={28} />
                    <p className="text-xs">URL no válida</p>
                  </div>
                ) : (
                  <img
                    src={form.imagen_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-stone-600">Activar inmediatamente</span>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
                className={`transition-colors ${form.activa ? 'text-rose-500' : 'text-stone-300'}`}
              >
                {form.activa ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-stone-400 hover:text-stone-600 px-4 py-2 rounded-full border border-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!form.titulo.trim() || !form.imagen_url.trim()}
                className="btn-primary text-xs px-5 py-2 rounded-full disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista de promociones */}
      {promos.length === 0 ? (
        <div className="text-center py-16 bg-white/70 rounded-3xl border border-stone-100">
          <span className="text-5xl mb-3 block">🎁</span>
          <p className="text-stone-400 font-medium text-sm">Todavía no hay promociones</p>
          <p className="text-xs text-stone-300 mt-1">Creá tu primera promo con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(promo => (
            <PromoCard
              key={promo.id}
              promo={promo}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PromoCard (admin) ─────────────────────────────────────────────────────────
function PromoCard({
  promo, onToggle, onDelete,
}: {
  promo: Promocion;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`bg-white rounded-3xl border shadow-[0_2px_12px_rgb(0,0,0,0.05)] overflow-hidden transition-all duration-300 ${
      promo.activa ? 'border-rose-100' : 'border-stone-100 opacity-60'
    }`}>
      <div className="flex gap-0">
        {/* Thumbnail */}
        <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-rose-50 to-amber-50 overflow-hidden">
          {promo.imagen_url ? (
            <img src={promo.imagen_url} alt={promo.titulo} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={20} className="text-stone-300" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-stone-800 text-sm leading-tight truncate">{promo.titulo}</h3>
              <span className={`shrink-0 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                promo.activa ? 'bg-rose-100 text-rose-500' : 'bg-stone-100 text-stone-400'
              }`}>
                {promo.activa ? 'ACTIVA' : 'INACTIVA'}
              </span>
            </div>
            {promo.descripcion && (
              <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{promo.descripcion}</p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Tag size={9} className="text-rose-400" />
              <span className="text-sm font-extrabold text-rose-500">
                {formatARS(promo.precio_promocional)}
              </span>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => onToggle(promo.id)}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                promo.activa ? 'text-rose-500 hover:text-rose-700' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {promo.activa
                ? <><ToggleRight size={18} /> Desactivar</>
                : <><ToggleLeft size={18} /> Activar</>
              }
            </button>
            <button
              onClick={() => onDelete(promo.id)}
              className="text-stone-300 hover:text-red-400 transition-colors p-1"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
