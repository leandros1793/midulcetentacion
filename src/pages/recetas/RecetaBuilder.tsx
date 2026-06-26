import { useState, useRef, useEffect, useMemo, type ChangeEvent } from 'react';
import {
  ChefHat, Plus, Trash2, Save, Clock, Users,
  Package, TrendingUp, Calculator, ShoppingBasket,
  ArrowLeft, Info, ImagePlus, Loader2, Receipt, Search, ShoppingBag,
  Globe, Lock,
} from 'lucide-react';
import { ingredientesService, recetasService, configuracionService } from '../../services';
import { uploadProductImage } from '../../services/supabase/uploadImage';
import {
  calcCostoPorUnidadReceta, calcCostoLinea,
  type Receta, type RecetaIngrediente, type Ingrediente, type ModoVenta,
} from '../../types';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatARS } from '../../utils/format';

interface Props {
  receta: Receta;
  onBack: () => void;
  onSave: (receta: Receta) => void;
}

export default function RecetaBuilder({ receta: initial, onBack, onSave }: Props) {
  const [receta,   setReceta]   = useState<Receta>(initial);
  const [lineas,   setLineas]   = useState<RecetaIngrediente[]>([]);
  const [margen,   setMargen]   = useState(initial.margen_ganancia_porcentaje);
  const [newIngId,      setNewIngId]      = useState('');
  const [newCantidad,   setNewCantidad]   = useState('');
  const [editingLineaId,   setEditingLineaId]   = useState<string | null>(null);
  const [editingCantidad,  setEditingCantidad]  = useState('');
  const [loadingData,  setLoadingData]  = useState(true);
  const [addingLinea,  setAddingLinea]  = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [imgError,     setImgError]     = useState('');
  const [confirmBack,  setConfirmBack]  = useState(false);
  const [saveError,    setSaveError]    = useState('');
  const [lineaError,   setLineaError]   = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [config, setConfig] = useState({ valor_hora_trabajo: 500, costo_fijo_por_hora: 100 });

  // Cargar ingredientes, líneas y config en paralelo
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingData(true);
      try {
        const [ings, lins, cfg] = await Promise.all([
          ingredientesService.getAll(),
          recetasService.getLineas(initial.id),
          configuracionService.get(),
        ]);
        if (!cancelled) {
          setIngredientes(ings);
          setLineas(lins);
          setConfig({ valor_hora_trabajo: cfg.valor_hora_trabajo, costo_fijo_por_hora: cfg.costo_fijo_por_hora });
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [initial.id]);

  const ingMap = useMemo(() =>
    Object.fromEntries(ingredientes.map(i => [i.id, i])),
  [ingredientes]);

  // ── Costos calculados en tiempo real ────────────────────────────────────────
  const costos = useMemo(() => {
    const costoIng = lineas.reduce((s, li) => {
      const ing = ingMap[li.ingrediente_id];
      return ing ? s + calcCostoLinea(li, ing) : s;
    }, 0);

    const horasPrep = receta.tiempo_prep_minutos / 60;
    const costoMO = horasPrep * config.valor_hora_trabajo;
    const costoFijo = horasPrep * config.costo_fijo_por_hora;
    const costoPackaging = receta.costo_packaging_fijo;

    const costoTotal = costoIng + costoMO + costoFijo + costoPackaging;
    const precioVenta = costoTotal * (1 + margen / 100);
    const gananciaTotal = precioVenta - costoTotal;

    return {
      costoIng, costoMO, costoFijo, costoPackaging, costoTotal,
      precioVenta, gananciaTotal,
      costoPorcion: costoTotal / Math.max(receta.rinde_porciones, 1),
      precioPorPorcion: precioVenta / Math.max(receta.rinde_porciones, 1),
    };
  }, [lineas, receta, config, margen, ingMap]);

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setImgError('Solo se permiten imágenes.'); return; }
    if (file.size > 5 * 1024 * 1024) { setImgError('La imagen no puede superar 5 MB.'); return; }

    setUploadingImg(true);
    setImgError('');
    try {
      const url = await uploadProductImage(file, receta.id);
      setReceta(r => ({ ...r, image_url: url }));
    } catch {
      setImgError('Error al subir la imagen. Verificá la conexión y el bucket de Supabase.');
    } finally {
      setUploadingImg(false);
    }
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddLinea = async () => {
    if (!newIngId || !newCantidad || Number(newCantidad) <= 0) return;
    setAddingLinea(true);
    setLineaError('');
    try {
      const li = await recetasService.addLinea(receta.id, {
        ingrediente_id: newIngId,
        cantidad_usada: Number(newCantidad),
      });
      setLineas(prev => [...prev, li]);
      setNewIngId(''); setNewCantidad('');
    } catch {
      setLineaError('No se pudo agregar el ingrediente. Verificá la conexión.');
    } finally {
      setAddingLinea(false);
    }
  };

  const handleDeleteLinea = async (id: string) => {
    setDeletingId(id);
    setLineaError('');
    try {
      await recetasService.deleteLinea(id);
      setLineas(prev => prev.filter(l => l.id !== id));
    } catch {
      setLineaError('No se pudo eliminar el ingrediente. Intentá de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateLinea = async (li: RecetaIngrediente) => {
    const val = Number(editingCantidad);
    setEditingLineaId(null);
    setEditingCantidad('');
    if (val <= 0) return;
    setLineaError('');
    try {
      const updated = await recetasService.updateLinea(li.id, {
        ingrediente_id: li.ingrediente_id,
        cantidad_usada: val,
        receta_id: li.receta_id,
      });
      setLineas(prev => prev.map(l => l.id === li.id ? updated : l));
    } catch {
      setLineaError('No se pudo actualizar la cantidad. Intentá de nuevo.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await recetasService.update(receta.id, { ...receta, margen_ganancia_porcentaje: margen });
      onSave(updated);
    } catch {
      setSaveError('No se pudo guardar. Verificá tu conexión y volvé a intentar.');
    } finally {
      setSaving(false);
    }
  };

  const ingDisponibles = ingredientes.filter(i => !lineas.some(l => l.ingrediente_id === i.id));

  if (loadingData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={28} className="animate-spin text-rose-300" />
      <p className="text-sm text-stone-400">Cargando receta…</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">
      {/* Sub-header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-warm-100 sticky top-0 z-20">
        <button
          onClick={() => {
            const hayDirty =
              receta.nombre !== initial.nombre ||
              receta.tiempo_prep_minutos !== initial.tiempo_prep_minutos ||
              receta.rinde_porciones !== initial.rinde_porciones ||
              receta.costo_packaging_fijo !== initial.costo_packaging_fijo ||
              (receta.notas ?? '') !== (initial.notas ?? '') ||
              receta.modo_venta !== initial.modo_venta ||
              (receta.visible_en_catalogo ?? false) !== (initial.visible_en_catalogo ?? false) ||
              margen !== initial.margen_ganancia_porcentaje;
            if (hayDirty) { setConfirmBack(true); return; }
            onBack();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            className="w-full font-bold text-gray-800 text-base bg-transparent focus:outline-none placeholder-gray-300"
            placeholder="Nombre de la receta…"
            value={receta.nombre}
            onChange={e => setReceta(r => ({ ...r, nombre: e.target.value }))}
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      {saveError && (
        <p className="mx-4 mt-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
          {saveError}
        </p>
      )}

      <div className="p-4 space-y-4 flex-1">

        {/* Metadatos básicos */}
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ChefHat size={13} /> Detalles
          </h3>

          {/* Modo de venta */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {([
              { value: 'entero',     label: 'Producto entero', icon: <Package size={13} /> },
              { value: 'por_unidad', label: 'Por unidad',      icon: <ShoppingBag size={13} /> },
            ] as { value: ModoVenta; label: string; icon: React.ReactNode }[]).map(opt => (
              <button key={opt.value} type="button"
                onClick={() => setReceta(r => ({ ...r, modo_venta: opt.value }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                  receta.modo_venta === opt.value
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-stone-200 bg-stone-50 text-stone-400 hover:border-stone-300'
                }`}
              >
                <span>{opt.icon}</span> {opt.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">
                {receta.modo_venta === 'por_unidad' ? 'Unidades' : 'Porciones'}
              </label>
              <div className="relative">
                <Users size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="1" className="input pl-8"
                  value={receta.rinde_porciones || ''}
                  onChange={e => setReceta(r => ({ ...r, rinde_porciones: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Tiempo (min)</label>
              <div className="relative">
                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="0" className="input pl-8"
                  value={receta.tiempo_prep_minutos || ''}
                  onChange={e => setReceta(r => ({ ...r, tiempo_prep_minutos: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Empaque $</label>
              <div className="relative">
                <Package size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="0" className="input pl-8"
                  value={receta.costo_packaging_fijo || ''}
                  onChange={e => setReceta(r => ({ ...r, costo_packaging_fijo: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
          {/* Notas */}
          <div className="mt-3">
            <label className="label">Notas</label>
            <textarea
              className="input resize-none text-sm"
              rows={2}
              placeholder="Consejos de preparación, variantes, temperaturas…"
              value={receta.notas ?? ''}
              onChange={e => setReceta(r => ({ ...r, notas: e.target.value }))}
            />
          </div>
        </div>

        {/* Imagen del producto */}
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ImagePlus size={13} /> Foto del producto
          </h3>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-warm-50 border border-warm-200 flex items-center justify-center shrink-0">
              {receta.image_url ? (
                <img src={receta.image_url} alt={receta.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">🎂</span>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file" accept="image/*" className="hidden"
                onChange={handleImageChange}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImg}
                className="btn-secondary text-xs w-full justify-center mb-1"
              >
                {uploadingImg ? <><Loader2 size={13} className="animate-spin" /> Subiendo…</> : <><ImagePlus size={13} /> {receta.image_url ? 'Cambiar foto' : 'Subir foto'}</>}
              </button>
              <p className="text-xs text-gray-400">JPG, PNG o WebP · máx. 5 MB</p>
              {imgError && <p className="text-xs text-red-500 mt-1">{imgError}</p>}
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Visibilidad</label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: false, label: 'Solo interna', icon: <Lock size={13} /> },
                { value: true,  label: 'En catálogo',  icon: <Globe size={13} /> },
              ] as { value: boolean; label: string; icon: React.ReactNode }[]).map(opt => (
                <button key={String(opt.value)} type="button"
                  onClick={() => setReceta(r => ({ ...r, visible_en_catalogo: opt.value }))}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl border-2 text-xs font-semibold transition-all ${
                    (receta.visible_en_catalogo ?? false) === opt.value
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
        </div>

        {/* ── Ingredientes de la receta ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden">

          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-stone-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-50 rounded-xl flex items-center justify-center">
                <ShoppingBasket size={14} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-700">Ingredientes</h3>
                <p className="text-[10px] text-stone-400">
                  {lineas.length === 0 ? 'Ninguno agregado aún' : `${lineas.length} ingrediente${lineas.length !== 1 ? 's' : ''} · ${formatARS(costos.costoIng)}`}
                </p>
              </div>
            </div>
            {costos.costoIng > 0 && (
              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                {formatARS(costos.costoIng)}
              </span>
            )}
          </div>

          {/* Lista de ingredientes agregados */}
          <div className="px-4 pt-3 space-y-2">
            {lineas.length === 0 && (
              <div className="py-6 text-center">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Calculator size={20} className="text-stone-200" />
                </div>
                <p className="text-xs font-medium text-stone-400">Sin ingredientes todavía</p>
                <p className="text-[10px] text-stone-300 mt-0.5">Usá el selector de abajo para agregar</p>
              </div>
            )}

            {lineas.map(li => {
              const ing = ingMap[li.ingrediente_id];
              if (!ing) return null;
              const costoLinea = calcCostoLinea(li, ing);
              const pctDelTotal = costos.costoIng > 0
                ? Math.round((costoLinea / costos.costoIng) * 100)
                : 0;
              return (
                <div
                  key={li.id}
                  className="group flex items-center gap-3 bg-stone-50 hover:bg-rose-50/40 rounded-2xl p-3 transition-colors duration-150"
                >
                  {/* Icono ingrediente */}
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-stone-100">
                    <span className="text-sm">🥄</span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate leading-tight">
                      {ing.nombre}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {/* Cantidad — toque para editar inline */}
                      {editingLineaId === li.id ? (
                        <input
                          autoFocus
                          type="number"
                          min="0.01"
                          step="any"
                          className="w-24 text-xs text-center border border-rose-300 rounded-md px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-rose-300"
                          value={editingCantidad}
                          onChange={e => setEditingCantidad(e.target.value)}
                          onBlur={() => handleUpdateLinea(li)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  handleUpdateLinea(li);
                            if (e.key === 'Escape') { setEditingLineaId(null); setEditingCantidad(''); }
                          }}
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingLineaId(li.id); setEditingCantidad(String(li.cantidad_usada)); }}
                          title="Tocar para editar cantidad"
                          className="text-[10px] font-medium text-stone-500 bg-white px-1.5 py-0.5 rounded-md border border-stone-100 hover:border-rose-300 hover:text-rose-500 transition-colors"
                        >
                          {li.cantidad_usada} {ing.unidad_medida_receta.toLowerCase()}
                        </button>
                      )}
                      <span className="text-[10px] text-stone-300">·</span>
                      <span className="text-[10px] text-stone-400">
                        {formatARS(calcCostoPorUnidadReceta(ing))}/u
                      </span>
                    </div>
                  </div>

                  {/* Costo + % + papelera */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-800 tabular-nums">
                        {formatARS(costoLinea)}
                      </p>
                      <p className="text-[10px] text-stone-400">{pctDelTotal}% del total</p>
                    </div>
                    <button
                      onClick={() => handleDeleteLinea(li.id)}
                      disabled={deletingId === li.id}
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-stone-300 hover:bg-red-50 hover:text-red-400 transition-all duration-150 disabled:opacity-50"
                    >
                      {deletingId === li.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Formulario para agregar ingrediente (siempre visible) ── */}
          <div className="px-4 pb-4 pt-3">
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 space-y-2.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                <Plus size={10} /> Agregar ingrediente
              </p>

              {/* Selector */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                <select
                  className="input pl-8 text-sm bg-white"
                  value={newIngId}
                  onChange={e => { setNewIngId(e.target.value); setNewCantidad(''); }}
                >
                  <option value="">— Elegir ingrediente —</option>
                  {ingDisponibles.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Cantidad + unidad (solo cuando hay ingrediente elegido) */}
              {newIngId && (
                <div className="flex gap-2 items-stretch">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Cantidad…"
                      autoFocus
                      className="input text-sm bg-white"
                      value={newCantidad}
                      onChange={e => setNewCantidad(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddLinea()}
                    />
                  </div>
                  {/* Badge de unidad */}
                  <div className="flex items-center px-3 bg-white rounded-xl border border-stone-200 text-xs font-bold text-stone-500 shrink-0">
                    {ingMap[newIngId]?.unidad_medida_receta ?? ''}
                  </div>
                </div>
              )}

              {/* Preview del costo antes de agregar */}
              {newIngId && newCantidad && Number(newCantidad) > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <span className="text-[10px] text-stone-400">Costo de esta línea</span>
                  <span className="text-sm font-bold text-amber-700 tabular-nums">
                    {formatARS(Number(newCantidad) * calcCostoPorUnidadReceta(ingMap[newIngId]))}
                  </span>
                </div>
              )}

              {/* Botón agregar */}
              <button
                onClick={handleAddLinea}
                disabled={addingLinea || !newIngId || !newCantidad || Number(newCantidad) <= 0}
                className="w-full flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs py-2.5 rounded-xl transition-all duration-150"
              >
                {addingLinea ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {addingLinea ? 'Agregando…' : 'Agregar a la receta'}
              </button>

              {lineaError && (
                <p className="text-[10px] text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 text-center">
                  ⚠️ {lineaError}
                </p>
              )}
              {ingDisponibles.length === 0 && ingredientes.length > 0 && (
                <p className="text-[10px] text-center text-stone-400">
                  ✓ Todos los ingredientes ya están en la receta
                </p>
              )}
              {ingredientes.length === 0 && (
                <p className="text-[10px] text-center text-amber-600">
                  ⚠️ No hay ingredientes cargados. Cargalos primero desde "Ingredientes".
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Tarjeta de Desglose de Costos ──────────────────────────────── */}
        <CostBreakdownCard
          costoIng={costos.costoIng}
          costoMO={costos.costoMO}
          costoFijo={costos.costoFijo}
          costoPackaging={costos.costoPackaging}
          costoTotal={costos.costoTotal}
          precioVenta={costos.precioVenta}
          gananciaTotal={costos.gananciaTotal}
          precioPorPorcion={costos.precioPorPorcion}
          costoPorcion={costos.costoPorcion}
          margen={margen}
          onMargenChange={setMargen}
          tiempo={receta.tiempo_prep_minutos}
          porciones={receta.rinde_porciones}
          modoVenta={receta.modo_venta ?? 'entero'}
          valorHora={config.valor_hora_trabajo}
          costoFijoHora={config.costo_fijo_por_hora}
        />

        {/* Botón guardar al pie — evita scrollear hasta arriba */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary w-full justify-center"
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : <><Save size={15} /> Guardar receta</>}
        </button>

      </div>

      <ConfirmDialog
        open={confirmBack}
        title="¿Salir sin guardar?"
        message="Tenés cambios sin guardar. Si salís ahora se van a perder."
        confirmLabel="Salir igual"
        onConfirm={() => { setConfirmBack(false); onBack(); }}
        onCancel={() => setConfirmBack(false)}
      />
    </div>
  );
}

// ── CostBreakdownCard ─────────────────────────────────────────────────────────
function CostBreakdownCard({
  costoIng, costoMO, costoFijo, costoPackaging, costoTotal,
  precioVenta, gananciaTotal, precioPorPorcion, costoPorcion,
  margen, onMargenChange,
  tiempo, porciones, modoVenta, valorHora, costoFijoHora,
}: {
  costoIng: number; costoMO: number; costoFijo: number; costoPackaging: number;
  costoTotal: number; precioVenta: number; gananciaTotal: number;
  precioPorPorcion: number; costoPorcion: number;
  margen: number; onMargenChange: (v: number) => void;
  tiempo: number; porciones: number; modoVenta: ModoVenta; valorHora: number; costoFijoHora: number;
}) {
  return (
    <div className="bg-amber-50/50 rounded-2xl border border-amber-100 shadow-[0_4px_24px_rgb(0,0,0,0.05)] overflow-hidden">

      {/* ── Encabezado ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-5">
          <Receipt size={14} className="text-amber-500" />
          <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">
            Desglose de Costos
          </h3>
        </div>

        {/* ── Líneas de costos ── */}
        <div className="space-y-3.5">
          <TicketRow icon="🛒" label="Ingredientes" value={costoIng} />
          <TicketRow
            icon="⏱️"
            label="Mano de obra"
            hint={`${tiempo} min · ${formatARS(valorHora)}/h`}
            value={costoMO}
          />
          <TicketRow
            icon="💡"
            label="Costos fijos"
            hint={`${tiempo} min · ${formatARS(costoFijoHora)}/h`}
            value={costoFijo}
          />
          <TicketRow icon="📦" label="Empaque" value={costoPackaging} />
        </div>

        {/* ── Separador estilo ticket perforado ── */}
        <div className="relative my-5">
          <div className="border-t-2 border-dashed border-amber-200" />
          <div className="absolute -left-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-amber-100" />
          <div className="absolute -right-5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border border-amber-100" />
        </div>

        {/* ── Costo base total ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">💰</span>
            <div>
              <p className="text-sm font-bold text-stone-700">Costo base total</p>
              <p className="text-[10px] text-stone-400">
                {formatARS(costoPorcion)} por {modoVenta === 'por_unidad' ? 'unidad' : 'porción'}
              </p>
            </div>
          </div>
          <span className="text-xl font-black text-stone-800 tabular-nums">
            {formatARS(costoTotal)}
          </span>
        </div>
      </div>

      {/* ── Separador sólido ── */}
      <div className="h-px bg-amber-100" />

      {/* ── Margen de ganancia ── */}
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={13} className="text-rose-400" />
            <span className="text-xs font-semibold text-stone-600">Margen de ganancia</span>
          </div>
          <div className="flex items-center gap-2">
            {margen < 100 && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                ⚠️ Bajo
              </span>
            )}
            <span className={`text-lg font-black ${margen < 100 ? 'text-amber-500' : 'text-rose-500'}`}>
              {margen}%
            </span>
          </div>
        </div>

        <input
          type="range" min="50" max="400" step="5"
          value={margen}
          onChange={e => onMargenChange(Number(e.target.value))}
          className="w-full accent-rose-500"
        />
        <div className="flex justify-between text-[10px] text-stone-300 -mt-1">
          <span>50%</span><span>150%</span><span>250%</span><span>400%</span>
        </div>
        {margen < 100 && (
          <p className="text-[10px] text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5 border border-amber-100">
            Con menos del 100% de margen puede que no estés cubriendo todos tus costos reales.
          </p>
        )}

        {/* Ganancia en $ */}
        <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-3 py-2.5 border border-emerald-100">
          <div className="flex items-center gap-1.5">
            <span>📈</span>
            <div>
              <p className="text-xs font-semibold text-emerald-700">Ganancia neta</p>
              <p className="text-[10px] text-emerald-500">
                {margen}% de {formatARS(costoTotal)}
              </p>
            </div>
          </div>
          <span className="text-base font-black text-emerald-600 tabular-nums">
            {formatARS(gananciaTotal)}
          </span>
        </div>
      </div>

      {/* ── Precio final ── zona destacada ── */}
      <div className="bg-rose-50 border-t border-rose-100 px-5 py-5 text-center">
        {modoVenta === 'por_unidad' ? (
          /* Por unidad: el número grande es el precio POR UNIDAD */
          <>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">
              🏷️ Precio por unidad
            </p>
            <p className="text-3xl font-black text-stone-800 tracking-tight tabular-nums">
              {formatARS(precioPorPorcion)}
            </p>
            <p className="text-xs text-stone-400 mt-1.5">
              × {porciones} {porciones === 1 ? 'unidad' : 'unidades'} = <span className="font-semibold text-stone-500">{formatARS(precioVenta)}</span> el lote
            </p>
          </>
        ) : (
          /* Producto entero: el número grande es el precio TOTAL */
          <>
            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">
              🏷️ Precio de venta sugerido
            </p>
            <p className="text-3xl font-black text-stone-800 tracking-tight tabular-nums">
              {formatARS(precioVenta)}
            </p>
            <p className="text-xs text-stone-400 mt-1.5 flex items-center justify-center gap-2">
              <span>{formatARS(precioPorPorcion)} por porción</span>
              <span className="text-stone-300">·</span>
              <span>{porciones} porciones</span>
            </p>
          </>
        )}

        <p className="text-[10px] text-rose-300 flex items-center justify-center gap-1 mt-3">
          <Info size={9} />
          Hora trabajo: {formatARS(valorHora)} · Costo fijo/h: {formatARS(costoFijoHora)}
        </p>
      </div>
    </div>
  );
}

// ── TicketRow ─────────────────────────────────────────────────────────────────
function TicketRow({ icon, label, hint, value }: {
  icon: string; label: string; hint?: string; value: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-start gap-2">
        <span className="text-sm leading-none mt-0.5 w-5 text-center shrink-0">{icon}</span>
        <div>
          <p className="text-xs font-medium text-stone-600 leading-tight">{label}</p>
          {hint && <p className="text-[10px] text-stone-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <span className="text-sm font-semibold text-stone-700 tabular-nums shrink-0">
        {formatARS(value)}
      </span>
    </div>
  );
}
