import { useState, useRef, type ChangeEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight, ImageOff, Sparkles, Upload, X, Loader2 } from 'lucide-react';
import { promocionesService } from '../../services';
import { uploadProductImage } from '../../services/supabase/uploadImage';
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
  const [promos, setPromos]       = useState<Promocion[]>(() => promocionesService.getAll());
  const [form, setForm]           = useState<PromocionForm>(EMPTY_FORM);
  const [showForm, setShowForm]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');   // URL local para preview inmediato
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = () => setPromos(promocionesService.getAll());

  // ── Seleccionar y subir imagen ────────────────────────────────────────────
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadErr('Solo se aceptan imágenes (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setUploadErr('La imagen no puede superar los 8 MB.');
      return;
    }

    // Preview local instantáneo
    setPreviewUrl(URL.createObjectURL(file));
    setUploadErr('');
    setUploading(true);

    try {
      const tempId = uuidv4();          // ID temporal para el nombre del archivo
      const publicUrl = await uploadProductImage(file, `promo-${tempId}`);
      setForm(f => ({ ...f, imagen_url: publicUrl }));
    } catch (err) {
      setUploadErr('Error al subir la imagen. Revisá tu conexión o el bucket de Supabase.');
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setPreviewUrl('');
    setForm(f => ({ ...f, imagen_url: '' }));
    setUploadErr('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo.trim() || !form.imagen_url.trim()) return;
    promocionesService.create(form);
    setForm(EMPTY_FORM);
    setPreviewUrl('');
    setUploadErr('');
    setShowForm(false);
    refresh();
  };

  const handleToggle = (id: string) => { promocionesService.toggleActiva(id); refresh(); };
  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta promoción?')) return;
    promocionesService.remove(id);
    refresh();
  };

  const openForm = () => { setShowForm(true); setForm(EMPTY_FORM); setPreviewUrl(''); setUploadErr(''); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-5 pb-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-stone-800 tracking-tight">Promociones</h2>
          <p className="text-xs text-stone-400 mt-0.5">Flyers y ofertas especiales de la tienda</p>
        </div>
        {!showForm && (
          <button
            onClick={openForm}
            className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm shadow-rose-200"
          >
            <Plus size={14} /> Nueva promo
          </button>
        )}
      </div>

      {/* Formulario */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-3xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.06)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-rose-400" />
            <h3 className="text-sm font-bold text-stone-700">Nueva promoción</h3>
          </div>

          {/* Título */}
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

          {/* Descripción */}
          <div>
            <label className="label">Descripción (opcional)</label>
            <input
              className="input"
              placeholder='ej. "Docena personalizada para eventos"'
              value={form.descripcion ?? ''}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          {/* Precio */}
          <div>
            <label className="label">Precio promocional ($)</label>
            <input
              type="number" min="0" step="any" className="input"
              placeholder="ej. 5000"
              value={form.precio_promocional || ''}
              onChange={e => setForm(f => ({ ...f, precio_promocional: Number(e.target.value) }))}
            />
          </div>

          {/* Upload de imagen */}
          <div>
            <label className="label">Flyer / Imagen *</label>

            {/* Zona de drop / preview */}
            {previewUrl || form.imagen_url ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-100 aspect-[4/3] bg-stone-50">
                <img
                  src={previewUrl || form.imagen_url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                {/* Overlay mientras sube */}
                {uploading && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                    <Loader2 size={28} className="text-white animate-spin" />
                    <p className="text-white text-xs font-semibold">Subiendo imagen…</p>
                  </div>
                )}
                {/* Botón quitar */}
                {!uploading && (
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
                {/* Badge "subido" */}
                {!uploading && form.imagen_url && (
                  <span className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    ✓ Subida
                  </span>
                )}
              </div>
            ) : (
              /* Zona de selección */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-stone-200 hover:border-rose-300 bg-stone-50 hover:bg-rose-50/30 flex flex-col items-center justify-center gap-3 transition-all duration-200 group"
              >
                <div className="w-12 h-12 bg-rose-100 group-hover:bg-rose-200 rounded-2xl flex items-center justify-center transition-colors">
                  <Upload size={22} className="text-rose-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-stone-600 group-hover:text-rose-600 transition-colors">
                    Subir flyer
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">JPG, PNG o WEBP · máx. 8 MB</p>
                </div>
              </button>
            )}

            {/* Input oculto */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {uploadErr && (
              <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                <ImageOff size={11} /> {uploadErr}
              </p>
            )}
          </div>

          {/* Toggle + botones */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, activa: !f.activa }))}
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className={`transition-colors ${form.activa ? 'text-rose-500' : 'text-stone-300'}`}>
                {form.activa ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </span>
              <span className="text-xs font-semibold text-stone-600">
                {form.activa ? 'Se publicará activa' : 'Guardar inactiva'}
              </span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); clearImage(); }}
                className="text-xs text-stone-400 hover:text-stone-600 px-4 py-2 rounded-full border border-stone-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!form.titulo.trim() || !form.imagen_url || uploading}
                className="btn-primary text-xs px-5 py-2 rounded-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {uploading ? <><Loader2 size={12} className="animate-spin" /> Subiendo…</> : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Lista */}
      {promos.length === 0 && !showForm ? (
        <div className="text-center py-16 bg-white/70 rounded-3xl border border-stone-100">
          <span className="text-5xl mb-3 block">🎁</span>
          <p className="text-stone-400 font-medium text-sm">Todavía no hay promociones</p>
          <p className="text-xs text-stone-300 mt-1">Creá tu primera promo con el botón de arriba</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(promo => (
            <PromoCard key={promo.id} promo={promo} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PromoCard (admin) ─────────────────────────────────────────────────────────
function PromoCard({ promo, onToggle, onDelete }: {
  promo: Promocion;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={`bg-white rounded-3xl border shadow-[0_2px_12px_rgb(0,0,0,0.05)] overflow-hidden transition-all duration-300 ${
      promo.activa ? 'border-rose-100' : 'border-stone-100 opacity-60'
    }`}>
      <div className="flex">
        <div className="w-24 h-24 shrink-0 bg-gradient-to-br from-rose-50 to-amber-50 overflow-hidden">
          {promo.imagen_url
            ? <img src={promo.imagen_url} alt={promo.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><ImageOff size={20} className="text-stone-300" /></div>
          }
        </div>
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
            {promo.descripcion && <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">{promo.descripcion}</p>}
            <div className="flex items-center gap-1 mt-1">
              <Tag size={9} className="text-rose-400" />
              <span className="text-sm font-extrabold text-rose-500">{formatARS(promo.precio_promocional)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <button
              onClick={() => onToggle(promo.id)}
              className={`flex items-center gap-1 text-xs font-semibold transition-colors ${
                promo.activa ? 'text-rose-500 hover:text-rose-700' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {promo.activa ? <><ToggleRight size={18} /> Desactivar</> : <><ToggleLeft size={18} /> Activar</>}
            </button>
            <button onClick={() => onDelete(promo.id)} className="text-stone-300 hover:text-red-400 transition-colors p-1">
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
