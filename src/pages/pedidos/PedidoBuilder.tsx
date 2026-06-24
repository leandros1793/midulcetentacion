import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, ShoppingBag,
  Calendar, CheckCircle2, Clock, XCircle, TrendingUp,
  Package, User, Search,
} from 'lucide-react';
import { pedidosService, recetasService, ingredientesService, configuracionService } from '../../services';
import { calcCostoLinea, calcCostoPorUnidadReceta } from '../../types';
import type { Pedido, PedidoForm, PedidoLinea, PedidoLineaForm, EstadoPedido, Receta, Ingrediente, RecetaIngrediente } from '../../types';
import { formatARS } from '../../utils/format';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADOS: { value: EstadoPedido; label: string; icon: React.ReactNode; active: string; inactive: string }[] = [
  { value: 'pendiente', label: 'Pendiente', icon: <Clock size={12} />,        active: 'border-amber-300 bg-amber-50 text-amber-700',   inactive: 'border-stone-200 bg-stone-50 text-stone-400' },
  { value: 'entregado', label: 'Entregado', icon: <CheckCircle2 size={12} />, active: 'border-emerald-300 bg-emerald-50 text-emerald-700', inactive: 'border-stone-200 bg-stone-50 text-stone-400' },
  { value: 'cancelado', label: 'Cancelado', icon: <XCircle size={12} />,      active: 'border-stone-300 bg-stone-100 text-stone-600',  inactive: 'border-stone-200 bg-stone-50 text-stone-400' },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  pedido: Pedido;
  recetas: Receta[];
  onBack: () => void;
  onSave: (p: Pedido) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function PedidoBuilder({ pedido: initial, recetas, onBack, onSave }: Props) {
  const [pedido,       setPedido]       = useState<Pedido>(initial);
  const [lineas,       setLineas]       = useState<PedidoLinea[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [recetaLineas, setRecetaLineas] = useState<RecetaIngrediente[]>([]);
  const [config,       setConfig]       = useState({ valor_hora_trabajo: 500, costo_fijo_por_hora: 100 });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [confirmBack,  setConfirmBack]  = useState(false);
  const [deletingId,   setDeletingId]   = useState<string | null>(null);
  const [lineaError,   setLineaError]   = useState('');

  // Formulario de nueva línea
  const [newRecetaId,  setNewRecetaId]  = useState('');
  const [newCantidad,  setNewCantidad]  = useState('1');
  const [newPrecio,    setNewPrecio]    = useState('');
  const [addingLinea,  setAddingLinea]  = useState(false);

  // Carga inicial
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lins, ings, recLins, cfg] = await Promise.all([
        pedidosService.getLineas(initial.id),
        ingredientesService.getAll(),
        recetasService.getAllLineas(),
        configuracionService.get(),
      ]);
      setLineas(lins);
      setIngredientes(ings);
      setRecetaLineas(recLins);
      setConfig({ valor_hora_trabajo: cfg.valor_hora_trabajo, costo_fijo_por_hora: cfg.costo_fijo_por_hora });
    } finally {
      setLoading(false);
    }
  }, [initial.id]);

  useEffect(() => { load(); }, [load]);

  // Mapas para acceso O(1)
  const recetaMap = useMemo(() => Object.fromEntries(recetas.map(r => [r.id, r])), [recetas]);
  const ingMap    = useMemo(() => Object.fromEntries(ingredientes.map(i => [i.id, i])), [ingredientes]);

  // Costo de producción de una receta (mismo cálculo que RecetaBuilder)
  const calcCostoReceta = useCallback((recetaId: string): number => {
    const receta = recetaMap[recetaId];
    if (!receta) return 0;
    const lins = recetaLineas.filter(l => l.receta_id === recetaId);
    const costoIng = lins.reduce((s, l) => {
      const ing = ingMap[l.ingrediente_id];
      return ing ? s + calcCostoLinea(l, ing) : s;
    }, 0);
    const h = receta.tiempo_prep_minutos / 60;
    return costoIng + h * config.valor_hora_trabajo + h * config.costo_fijo_por_hora + receta.costo_packaging_fijo;
  }, [recetaMap, recetaLineas, ingMap, config]);

  // Precio sugerido de una receta
  const precioSugerido = useCallback((recetaId: string): number => {
    const receta = recetaMap[recetaId];
    if (!receta) return 0;
    const costoUnitario = calcCostoReceta(recetaId) / Math.max(receta.rinde_porciones, 1);
    const precioUnitario = costoUnitario * (1 + receta.margen_ganancia_porcentaje / 100);
    return receta.modo_venta === 'por_unidad' ? precioUnitario : calcCostoReceta(recetaId) * (1 + receta.margen_ganancia_porcentaje / 100);
  }, [recetaMap, calcCostoReceta]);

  // Totales del pedido
  const totales = useMemo(() => {
    const totalCobrado = lineas.reduce((s, l) => s + l.precio_unitario_cobrado * l.cantidad, 0);
    const totalCosto   = lineas.reduce((s, l) => {
      const costoBase = calcCostoReceta(l.receta_id);
      return s + costoBase * l.cantidad;
    }, 0);
    const ganancia = totalCobrado - totalCosto;
    const margenReal = totalCosto > 0 ? (ganancia / totalCosto) * 100 : 0;
    return { totalCobrado, totalCosto, ganancia, margenReal };
  }, [lineas, calcCostoReceta]);

  // Al seleccionar receta, precarga el precio sugerido
  const handleSelectReceta = (recetaId: string) => {
    setNewRecetaId(recetaId);
    if (recetaId) {
      setNewPrecio(String(Math.round(precioSugerido(recetaId))));
    } else {
      setNewPrecio('');
    }
  };

  const handleAddLinea = async () => {
    if (!newRecetaId || Number(newCantidad) <= 0) return;
    setAddingLinea(true);
    setLineaError('');
    try {
      const form: PedidoLineaForm = {
        receta_id: newRecetaId,
        cantidad: Number(newCantidad),
        precio_unitario_cobrado: Number(newPrecio) || 0,
      };
      const li = await pedidosService.addLinea(pedido.id, form);
      setLineas(prev => [...prev, li]);
      setNewRecetaId(''); setNewCantidad('1'); setNewPrecio('');
    } catch {
      setLineaError('No se pudo agregar. Verificá la conexión.');
    } finally {
      setAddingLinea(false);
    }
  };

  const handleDeleteLinea = async (id: string) => {
    setDeletingId(id);
    setLineaError('');
    try {
      await pedidosService.deleteLinea(id);
      setLineas(prev => prev.filter(l => l.id !== id));
    } catch {
      setLineaError('No se pudo eliminar. Intentá de nuevo.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await pedidosService.update(pedido.id, {
        cliente:       pedido.cliente,
        fecha_entrega: pedido.fecha_entrega,
        estado:        pedido.estado,
        notas:         pedido.notas,
      });
      onSave(updated);
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    pedido.cliente       !== initial.cliente       ||
    pedido.fecha_entrega !== initial.fecha_entrega ||
    pedido.estado        !== initial.estado        ||
    (pedido.notas ?? '') !== (initial.notas ?? '');

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2 size={28} className="animate-spin text-rose-300" />
      <p className="text-sm text-stone-400">Cargando pedido…</p>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full">

      {/* Sub-header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-stone-100 sticky top-0 z-20">
        <button
          onClick={() => isDirty ? setConfirmBack(true) : onBack()}
          className="text-stone-400 hover:text-stone-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <input
            className="w-full font-bold text-stone-800 text-base bg-transparent focus:outline-none placeholder-stone-300"
            placeholder="Nombre del cliente…"
            value={pedido.cliente ?? ''}
            onChange={e => setPedido(p => ({ ...p, cliente: e.target.value }))}
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-3">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">

        {/* Detalles del pedido */}
        <div className="card space-y-3">
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide flex items-center gap-1.5">
            <User size={12} /> Detalles
          </h3>

          {/* Estado */}
          <div>
            <label className="label">Estado</label>
            <div className="grid grid-cols-3 gap-2">
              {ESTADOS.map(e => (
                <button key={e.value} type="button"
                  onClick={() => setPedido(p => ({ ...p, estado: e.value }))}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-2xl border-2 text-xs font-semibold transition-all ${
                    pedido.estado === e.value ? e.active : e.inactive
                  }`}
                >
                  {e.icon} {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label className="label flex items-center gap-1"><Calendar size={11} /> Fecha de entrega</label>
            <input
              type="date" className="input"
              value={pedido.fecha_entrega}
              onChange={e => setPedido(p => ({ ...p, fecha_entrega: e.target.value }))}
            />
          </div>

          {/* Notas */}
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input resize-none text-sm" rows={2}
              placeholder="Sabor, decoración, dirección, aclaraciones…"
              value={pedido.notas ?? ''}
              onChange={e => setPedido(p => ({ ...p, notas: e.target.value }))}
            />
          </div>
        </div>

        {/* Productos del pedido */}
        <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_4px_20px_rgb(0,0,0,0.05)] overflow-hidden">
          <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-stone-50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-rose-50 rounded-xl flex items-center justify-center">
                <Package size={14} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-700">Productos</h3>
                <p className="text-[10px] text-stone-400">
                  {lineas.length === 0 ? 'Ninguno agregado' : `${lineas.length} receta${lineas.length !== 1 ? 's' : ''}`}
                </p>
              </div>
            </div>
            {totales.totalCobrado > 0 && (
              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-full">
                {formatARS(totales.totalCobrado, 0)}
              </span>
            )}
          </div>

          {/* Lista de líneas */}
          <div className="px-4 pt-3 space-y-2">
            {lineas.length === 0 && (
              <div className="py-6 text-center">
                <div className="w-12 h-12 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag size={20} className="text-stone-200" />
                </div>
                <p className="text-xs font-medium text-stone-400">Sin productos todavía</p>
                <p className="text-[10px] text-stone-300 mt-0.5">Usá el selector de abajo</p>
              </div>
            )}

            {lineas.map(li => {
              const receta    = recetaMap[li.receta_id];
              const costoBase = calcCostoReceta(li.receta_id);
              const totalLinea = li.precio_unitario_cobrado * li.cantidad;
              const gananciaLinea = totalLinea - costoBase * li.cantidad;

              return (
                <div key={li.id} className="flex items-start gap-3 bg-stone-50 rounded-2xl p-3">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-stone-100">
                    <span className="text-sm">🎂</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate leading-tight">
                      {receta?.nombre ?? 'Receta eliminada'}
                    </p>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      {li.cantidad}× · {formatARS(li.precio_unitario_cobrado, 0)} c/u
                    </p>
                    <p className={`text-[10px] mt-0.5 font-medium ${gananciaLinea >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      Ganancia: {formatARS(gananciaLinea, 0)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right flex items-start gap-1">
                    <div>
                      <p className="text-sm font-bold text-stone-800 tabular-nums">{formatARS(totalLinea, 0)}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteLinea(li.id)}
                      disabled={deletingId === li.id}
                      className="mt-0.5 w-6 h-6 flex items-center justify-center text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
                    >
                      {deletingId === li.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Formulario nueva línea */}
          <div className="px-4 pb-4 pt-3">
            <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-3 space-y-2.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest flex items-center gap-1.5">
                <Plus size={10} /> Agregar producto
              </p>

              {/* Selector de receta */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                <select
                  className="input pl-8 text-sm bg-white"
                  value={newRecetaId}
                  onChange={e => handleSelectReceta(e.target.value)}
                >
                  <option value="">— Elegir receta —</option>
                  {recetas.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              {newRecetaId && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="label text-[10px]">Cantidad</label>
                    <input
                      type="number" min="1" step="1" className="input text-sm bg-white"
                      value={newCantidad}
                      onChange={e => setNewCantidad(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-[10px]">Precio cobrado ($)</label>
                    <input
                      type="number" min="0" step="any" className="input text-sm bg-white"
                      value={newPrecio}
                      onChange={e => setNewPrecio(e.target.value)}
                      placeholder={formatARS(precioSugerido(newRecetaId), 0)}
                    />
                  </div>
                </div>
              )}

              {/* Preview costo vs precio */}
              {newRecetaId && newPrecio && Number(newPrecio) > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-amber-100 text-[10px]">
                  <span className="text-stone-400">Costo estimado</span>
                  <span className="font-semibold text-stone-600">{formatARS(calcCostoReceta(newRecetaId) * Number(newCantidad), 0)}</span>
                  <span className="text-stone-300">·</span>
                  <span className="text-stone-400">Ganancia</span>
                  <span className={`font-bold ${Number(newPrecio) * Number(newCantidad) - calcCostoReceta(newRecetaId) * Number(newCantidad) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatARS(Number(newPrecio) * Number(newCantidad) - calcCostoReceta(newRecetaId) * Number(newCantidad), 0)}
                  </span>
                </div>
              )}

              {lineaError && (
                <p className="text-[10px] text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 text-center">⚠️ {lineaError}</p>
              )}

              <button
                onClick={handleAddLinea}
                disabled={addingLinea || !newRecetaId || Number(newCantidad) <= 0}
                className="w-full flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs py-2.5 rounded-xl transition-all"
              >
                {addingLinea ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {addingLinea ? 'Agregando…' : 'Agregar al pedido'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen financiero del pedido */}
        {lineas.length > 0 && (
          <div className="bg-amber-50/50 rounded-2xl border border-amber-100 overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={14} className="text-amber-500" />
                <h3 className="text-xs font-bold text-amber-700 uppercase tracking-widest">Resumen del pedido</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Costo de producción</span>
                  <span className="font-semibold text-stone-700 tabular-nums">{formatARS(totales.totalCosto, 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-500">Total cobrado</span>
                  <span className="font-semibold text-stone-700 tabular-nums">{formatARS(totales.totalCobrado, 0)}</span>
                </div>
                <div className="border-t border-amber-100 pt-2.5 flex justify-between">
                  <span className="text-sm font-bold text-stone-700">Ganancia neta</span>
                  <span className={`text-sm font-black tabular-nums ${totales.ganancia >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {formatARS(totales.ganancia, 0)}
                  </span>
                </div>
                {totales.totalCosto > 0 && (
                  <p className="text-[10px] text-stone-400 text-right">
                    Margen real: <span className={`font-bold ${totales.margenReal >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {totales.margenReal.toFixed(0)}%
                    </span>
                    {totales.margenReal < 100 && ' ⚠️ bajo'}
                  </p>
                )}
              </div>
            </div>

            {/* Precio destacado */}
            <div className="bg-rose-50 border-t border-rose-100 px-5 py-4 text-center">
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">💰 Total del pedido</p>
              <p className="text-3xl font-black text-stone-800 tracking-tight tabular-nums">
                {formatARS(totales.totalCobrado, 0)}
              </p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmBack}
        title="¿Salir sin guardar?"
        message="Tenés cambios sin guardar en los detalles del pedido."
        confirmLabel="Salir igual"
        onConfirm={() => { setConfirmBack(false); onBack(); }}
        onCancel={() => setConfirmBack(false)}
      />
    </div>
  );
}
