import { useState, useEffect, useRef } from 'react';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Loader2,
  ImagePlus, ChevronUp, ChevronDown, X, Check,
} from 'lucide-react';
import { menuItemsService } from '../../services/menuItems';
import { recetasService }   from '../../services';
import { formatARS }        from '../../utils/format';
import type { MenuItem, MenuItemForm, CategoriaMenu, Receta } from '../../types';

const CATEGORIAS: CategoriaMenu[] = [
  'Tortas','Alfajores','Postres','Mesas dulces','Combos','Temporada','Otros',
];

const CAT_COLOR: Record<CategoriaMenu, string> = {
  'Tortas':       'bg-rose-100 text-rose-600',
  'Alfajores':    'bg-amber-100 text-amber-600',
  'Postres':      'bg-violet-100 text-violet-600',
  'Mesas dulces': 'bg-pink-100 text-pink-600',
  'Combos':       'bg-teal-100 text-teal-600',
  'Temporada':    'bg-emerald-100 text-emerald-600',
  'Otros':        'bg-stone-100 text-stone-500',
};

const EMPTY_FORM: MenuItemForm = {
  nombre: '', descripcion: '', precio_display: 0,
  imagen_url: '', categoria: undefined, visible: true,
  orden: 0, receta_id: undefined,
};

// ── Image uploader ─────────────────────────────────────────────────────────────
function ImageUploader({
  value, onChange,
}: { value?: string; onChange: (url: string) => void }) {
  const ref            = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const url = await menuItemsService.uploadImagen(file);
      onChange(url);
    } catch {
      setErr('Error al subir la imagen. Intentá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {/* Preview + upload button en fila — compacto en mobile */}
      <div className="flex gap-3 items-start">
        {/* Thumbnail cuadrado */}
        <div
          className="relative w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border-2 border-dashed border-stone-200 flex items-center justify-center cursor-pointer hover:border-rose-300 transition-colors shrink-0"
          onClick={() => ref.current?.click()}
        >
          {value ? (
            <>
              <img src={value} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onChange(''); }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"
              >
                <X size={11} />
              </button>
            </>
          ) : busy ? (
            <Loader2 size={20} className="animate-spin text-stone-400" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-stone-400">
              <ImagePlus size={22} />
              <span className="text-[9px] font-medium text-center leading-tight">Tocar para subir</span>
            </div>
          )}
        </div>

        {/* URL manual */}
        <div className="flex-1 min-w-0">
          <label className="label">Foto del producto</label>
          <input
            className="input text-xs"
            placeholder="https://... o tocar el cuadrado"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
          <p className="text-[9px] text-stone-400 mt-1">JPG, PNG, WEBP · Subí o pegá una URL</p>
        </div>
      </div>

      <input
        ref={ref} type="file" accept="image/*" className="hidden"
        onChange={handleFile} disabled={busy}
      />

      {err && <p className="text-xs text-red-500">{err}</p>}
    </div>
  );
}

// ── Formulario modal ───────────────────────────────────────────────────────────
function MenuItemForm({
  initial, recetas, onSave, onCancel,
}: {
  initial: MenuItemForm;
  recetas: Receta[];
  onSave: (form: MenuItemForm) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MenuItemForm>(initial);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  function set<K extends keyof MenuItemForm>(key: K, val: MenuItemForm[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio.'); return; }
    if (form.precio_display <= 0) { setErr('El precio debe ser mayor a 0.'); return; }
    setBusy(true); setErr('');
    try { await onSave(form); }
    catch { setErr('Error al guardar. Intentá de nuevo.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md max-h-[92dvh] overflow-y-auto pb-safe">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-5 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h2 className="font-black text-stone-800 text-base">
            {initial.nombre ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600 p-1">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Imagen */}
          <ImageUploader
            value={form.imagen_url}
            onChange={url => set('imagen_url', url)}
          />

          {/* Nombre */}
          <div>
            <label className="label">Nombre <span className="text-rose-400">*</span></label>
            <input
              className="input"
              placeholder="Ej: Torta de chocolate, Combo alfajores x6..."
              value={form.nombre}
              onChange={e => set('nombre', e.target.value)}
              required
            />
          </div>

          {/* Descripcion */}
          <div>
            <label className="label">Descripción (opcional)</label>
            <textarea
              className="input resize-none"
              rows={2}
              placeholder="Ingredientes destacados, tamaños, opciones de sabor..."
              value={form.descripcion ?? ''}
              onChange={e => set('descripcion', e.target.value)}
            />
          </div>

          {/* Precio */}
          <div>
            <label className="label">Precio de venta <span className="text-rose-400">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold text-sm">$</span>
              <input
                className="input pl-7"
                type="number"
                min={0}
                step={50}
                placeholder="0"
                value={form.precio_display || ''}
                onChange={e => set('precio_display', Number(e.target.value))}
                required
              />
            </div>
            <p className="text-[10px] text-stone-400 mt-1">
              Este precio es el que se muestra en la página pública. Es independiente del cálculo de costos.
            </p>
          </div>

          {/* Categoria */}
          <div>
            <label className="label">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map(cat => (
                <button
                  key={cat} type="button"
                  onClick={() => set('categoria', form.categoria === cat ? undefined : cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all duration-150 ${
                    form.categoria === cat
                      ? 'bg-rose-500 text-white border-rose-500'
                      : 'bg-stone-50 text-stone-500 border-stone-200 hover:border-rose-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Link receta (opcional) */}
          {recetas.length > 0 && (
            <div>
              <label className="label">Asociar a receta (opcional)</label>
              <select
                className="input"
                value={form.receta_id ?? ''}
                onChange={e => set('receta_id', e.target.value || undefined)}
              >
                <option value="">Sin asociar</option>
                {recetas.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
              <p className="text-[10px] text-stone-400 mt-1">
                Solo sirve para referencia interna. No afecta el precio mostrado.
              </p>
            </div>
          )}

          {/* Visible */}
          <div className="flex items-center justify-between bg-stone-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-stone-700">Visible en la página</p>
              <p className="text-[10px] text-stone-400 mt-0.5">Los clientes pueden verlo en el catálogo</p>
            </div>
            <button
              type="button"
              onClick={() => set('visible', !form.visible)}
              className={`w-12 h-6 rounded-full transition-all duration-200 relative ${
                form.visible ? 'bg-rose-500' : 'bg-stone-300'
              }`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${
                form.visible ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          {err && <p className="text-xs text-red-500 font-medium">{err}</p>}

          {/* Acciones */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={busy} className="btn-primary flex-1 justify-center">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Card de ítem ───────────────────────────────────────────────────────────────
function MenuItemCard({
  item, onEdit, onDelete, onToggleVisible, onMoveUp, onMoveDown,
}: {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleVisible: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className={`card flex gap-3 transition-opacity duration-200 ${!item.visible ? 'opacity-60' : ''}`}>
      {/* Imagen */}
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-rose-50 to-amber-50 flex items-center justify-center shrink-0">
        {item.imagen_url ? (
          <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl">🎂</span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <p className="font-bold text-stone-800 text-sm leading-tight flex-1 truncate">{item.nombre}</p>
          {!item.visible && (
            <span className="text-[9px] font-bold bg-stone-100 text-stone-400 px-2 py-0.5 rounded-full shrink-0">
              oculto
            </span>
          )}
        </div>

        {item.categoria && (
          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 ${CAT_COLOR[item.categoria]}`}>
            {item.categoria}
          </span>
        )}

        {item.descripcion && (
          <p className="text-[10px] text-stone-400 line-clamp-1 mb-1">{item.descripcion}</p>
        )}

        <p className="text-base font-black text-rose-500">{formatARS(item.precio_display)}</p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={onToggleVisible} title={item.visible ? 'Ocultar' : 'Mostrar'}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
            item.visible
              ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100'
              : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
          }`}>
          {item.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button onClick={onEdit}
          className="w-8 h-8 rounded-xl bg-stone-100 text-stone-500 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={onMoveUp}
          className="w-8 h-8 rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ChevronUp size={14} />
        </button>
        <button onClick={onMoveDown}
          className="w-8 h-8 rounded-xl bg-stone-50 text-stone-400 hover:bg-stone-100 flex items-center justify-center transition-colors">
          <ChevronDown size={14} />
        </button>
        <button onClick={onDelete}
          className="w-8 h-8 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function MenuPage() {
  const [items,   setItems]   = useState<MenuItem[]>([]);
  const [recetas, setRecetas] = useState<Receta[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState<'new' | MenuItem | null>(null);
  const [confirm, setConfirm] = useState<MenuItem | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [its, recs] = await Promise.all([
        menuItemsService.getAll(),
        recetasService.getAll(),
      ]);
      setItems(its);
      setRecetas(recs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form: MenuItemForm) {
    if (modal === 'new') {
      const next = await menuItemsService.create({ ...form, orden: items.length });
      setItems(prev => [...prev, next]);
    } else if (modal) {
      const next = await menuItemsService.update((modal as MenuItem).id, form);
      setItems(prev => prev.map(i => i.id === next.id ? next : i));
    }
    setModal(null);
  }

  async function handleDelete(item: MenuItem) {
    await menuItemsService.remove(item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setConfirm(null);
  }

  async function handleToggleVisible(item: MenuItem) {
    const next = await menuItemsService.toggleVisible(item.id, item.visible);
    setItems(prev => prev.map(i => i.id === next.id ? next : i));
  }

  async function handleMove(item: MenuItem, dir: 'up' | 'down') {
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    // persist orden
    await Promise.all([
      menuItemsService.update(next[idx].id,    { orden: idx }),
      menuItemsService.update(next[swapIdx].id, { orden: swapIdx }),
    ]);
    setItems(next.map((it, i) => ({ ...it, orden: i })));
  }

  const visibles  = items.filter(i => i.visible).length;
  const ocultos   = items.filter(i => !i.visible).length;

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-black text-stone-800 leading-tight">Menú público</h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {visibles} visible{visibles !== 1 ? 's' : ''} · {ocultos} oculto{ocultos !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="btn-primary text-sm"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {/* Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-[11px] text-amber-700 leading-relaxed">
          <span className="font-bold">Tip:</span> Los productos que actives acá aparecen en la página pública con la foto y el precio que pongas vos, sin depender del sistema de costos.
        </p>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={26} className="animate-spin text-rose-300" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎂</span>
          </div>
          <p className="font-bold text-stone-600 mb-1">El menú está vacío</p>
          <p className="text-xs text-stone-400 mb-5">Agregá el primer producto para que aparezca en la página</p>
          <button onClick={() => setModal('new')} className="btn-primary mx-auto">
            <Plus size={15} /> Agregar producto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <MenuItemCard
              key={item.id}
              item={item}
              onEdit={() => setModal(item)}
              onDelete={() => setConfirm(item)}
              onToggleVisible={() => handleToggleVisible(item)}
              onMoveUp={() => handleMove(item, 'up')}
              onMoveDown={() => handleMove(item, 'down')}
            />
          ))}
        </div>
      )}

      {/* Modal formulario */}
      {modal !== null && (
        <MenuItemForm
          initial={modal === 'new' ? EMPTY_FORM : {
            nombre:        (modal as MenuItem).nombre,
            descripcion:   (modal as MenuItem).descripcion,
            precio_display:(modal as MenuItem).precio_display,
            imagen_url:    (modal as MenuItem).imagen_url,
            categoria:     (modal as MenuItem).categoria,
            visible:       (modal as MenuItem).visible,
            orden:         (modal as MenuItem).orden,
            receta_id:     (modal as MenuItem).receta_id,
          }}
          recetas={recetas}
          onSave={handleSave}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Confirm delete */}
      {confirm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <p className="font-bold text-stone-800 mb-1">¿Eliminar producto?</p>
            <p className="text-sm text-stone-400 mb-5">
              "{confirm.nombre}" se va a eliminar del menú público. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(null)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={() => handleDelete(confirm)} className="btn-danger flex-1 justify-center">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
