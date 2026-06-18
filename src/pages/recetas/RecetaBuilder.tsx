import { useState, useMemo, useCallback } from 'react';
import {
  ChefHat, Plus, Trash2, Save, Clock, Users,
  Package, Zap, TrendingUp, DollarSign, Calculator,
  ArrowLeft, Info,
} from 'lucide-react';
import { ingredientesService, recetasService, configuracionService } from '../../services';
import {
  calcCostoPorUnidadReceta, calcCostoLinea,
  type Receta, type RecetaIngrediente, type Ingrediente,
} from '../../types';

interface Props {
  receta: Receta;
  onBack: () => void;
  onSave: (receta: Receta) => void;
}

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n);
}

export default function RecetaBuilder({ receta: initial, onBack, onSave }: Props) {
  const [receta, setReceta] = useState<Receta>(initial);
  const [lineas, setLineas] = useState<RecetaIngrediente[]>(() => recetasService.getLineas(initial.id));
  const [margen, setMargen] = useState(initial.margen_ganancia_porcentaje);
  const [addingIng, setAddingIng] = useState(false);
  const [newIngId, setNewIngId] = useState('');
  const [newCantidad, setNewCantidad] = useState('');

  const ingredientes = useMemo(() => ingredientesService.getAll(), []);
  const config = useMemo(() => configuracionService.get(), []);

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

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddLinea = () => {
    if (!newIngId || !newCantidad || Number(newCantidad) <= 0) return;
    const li = recetasService.addLinea(receta.id, {
      ingrediente_id: newIngId,
      cantidad_usada: Number(newCantidad),
    });
    setLineas(prev => [...prev, li]);
    setNewIngId(''); setNewCantidad(''); setAddingIng(false);
  };

  const handleDeleteLinea = (id: string) => {
    recetasService.deleteLinea(id);
    setLineas(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = () => {
    const updated = recetasService.update(receta.id, { ...receta, margen_ganancia_porcentaje: margen });
    onSave(updated);
  };

  const ingDisponibles = ingredientes.filter(i => !lineas.some(l => l.ingrediente_id === i.id));

  return (
    <div className="flex flex-col min-h-full">
      {/* Sub-header */}
      <div className="px-4 py-3 flex items-center gap-3 bg-white border-b border-warm-100 sticky top-0 z-20">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-600 transition-colors">
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
        <button onClick={handleSave} className="btn-primary text-xs py-1.5 px-3">
          <Save size={14} /> Guardar
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1">

        {/* Metadatos básicos */}
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <ChefHat size={13} /> Detalles
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Porciones</label>
              <div className="relative">
                <Users size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="1" className="input pl-8"
                  value={receta.rinde_porciones}
                  onChange={e => setReceta(r => ({ ...r, rinde_porciones: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Tiempo (min)</label>
              <div className="relative">
                <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="0" className="input pl-8"
                  value={receta.tiempo_prep_minutos}
                  onChange={e => setReceta(r => ({ ...r, tiempo_prep_minutos: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div>
              <label className="label">Empaque</label>
              <div className="relative">
                <Package size={14} className="absolute left-2.5 top-2.5 text-gray-300" />
                <input type="number" min="0" className="input pl-8"
                  value={receta.costo_packaging_fijo}
                  onChange={e => setReceta(r => ({ ...r, costo_packaging_fijo: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cálculo de costos */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
              <Calculator size={13} /> Cálculo de costos
            </h3>
            {!addingIng && (
              <button onClick={() => setAddingIng(true)} className="text-rose-500 hover:text-rose-600 flex items-center gap-1 text-xs font-medium">
                <Plus size={14} /> Ingrediente
              </button>
            )}
          </div>

          {/* Tabla de líneas */}
          <div className="space-y-2">
            {lineas.length === 0 && !addingIng && (
              <p className="text-xs text-gray-400 text-center py-4">
                Sin ingredientes. Agregá el primero.
              </p>
            )}
            {lineas.map(li => {
              const ing = ingMap[li.ingrediente_id];
              if (!ing) return null;
              const costoLinea = calcCostoLinea(li, ing);
              return (
                <div key={li.id} className="flex items-center gap-2 bg-warm-50 rounded-xl p-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-700 truncate">{ing.nombre}</p>
                    <p className="text-xs text-gray-400">
                      {li.cantidad_usada} {ing.unidad_medida_receta.toLowerCase()} · {formatARS(calcCostoPorUnidadReceta(ing))}/u
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 shrink-0">{formatARS(costoLinea)}</p>
                  <button onClick={() => handleDeleteLinea(li.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}

            {/* Fila de agregar */}
            {addingIng && (
              <div className="bg-rose-50 rounded-xl p-3 space-y-2 border border-rose-200">
                <select
                  className="input text-sm"
                  value={newIngId}
                  onChange={e => setNewIngId(e.target.value)}
                >
                  <option value="">— Seleccionar ingrediente —</option>
                  {ingDisponibles.map(i => (
                    <option key={i.id} value={i.id}>{i.nombre}</option>
                  ))}
                </select>
                {newIngId && (
                  <div className="flex gap-2 items-center">
                    <div className="flex-1">
                      <input
                        type="number" min="0" step="any" placeholder="Cantidad"
                        className="input text-sm"
                        value={newCantidad}
                        onChange={e => setNewCantidad(e.target.value)}
                      />
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">
                      {ingMap[newIngId]?.unidad_medida_receta ?? ''}
                    </span>
                  </div>
                )}
                {newIngId && newCantidad && (
                  <p className="text-xs text-rose-600 font-medium">
                    = {formatARS(Number(newCantidad) * calcCostoPorUnidadReceta(ingMap[newIngId]))}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={() => { setAddingIng(false); setNewIngId(''); setNewCantidad(''); }} className="btn-secondary flex-1 text-xs justify-center py-1.5">
                    Cancelar
                  </button>
                  <button onClick={handleAddLinea} className="btn-primary flex-1 text-xs justify-center py-1.5">
                    <Plus size={13} /> Agregar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sub-total ingredientes */}
          {lineas.length > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-warm-100">
              <span className="text-xs text-gray-400">Costo ingredientes</span>
              <span className="text-sm font-bold text-gray-700">{formatARS(costos.costoIng)}</span>
            </div>
          )}
        </div>

        {/* Desglose de costos */}
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Zap size={13} /> Costos operativos
          </h3>
          <div className="space-y-2">
            <CostoRow label="Mano de obra" hint={`${receta.tiempo_prep_minutos} min × ${formatARS(config.valor_hora_trabajo)}/h`} value={costos.costoMO} />
            <CostoRow label="Costos fijos" hint={`${receta.tiempo_prep_minutos} min × ${formatARS(config.costo_fijo_por_hora)}/h`} value={costos.costoFijo} />
            <CostoRow label="Empaque" hint="cajas, bases, decoración" value={costos.costoPackaging} />
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-warm-100">
              <span className="text-sm font-bold text-gray-700">Costo total</span>
              <span className="text-base font-bold text-gray-900">{formatARS(costos.costoTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Por porción</span>
              <span>{formatARS(costos.costoPorcion)}</span>
            </div>
          </div>
        </div>

        {/* Calculadora de precio */}
        <div className="card bg-gradient-to-br from-rose-50 to-blush-50 border-rose-200">
          <h3 className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <TrendingUp size={13} /> Precio de venta
          </h3>

          {/* Slider margen */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-gray-500 font-medium">Margen de Ganancia</label>
              <span className="text-base font-bold text-rose-600">{margen}%</span>
            </div>
            <input
              type="range" min="50" max="400" step="5"
              value={margen}
              onChange={e => setMargen(Number(e.target.value))}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-xs text-gray-300 mt-1">
              <span>50%</span><span>150%</span><span>250%</span><span>400%</span>
            </div>
          </div>

          {/* Resultados */}
          <div className="bg-white rounded-xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Precio total</span>
              <span className="text-xl font-black text-rose-600">{formatARS(costos.precioVenta)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Por porción</span>
              <span className="text-sm font-bold text-rose-500">{formatARS(costos.precioPorPorcion)}</span>
            </div>
            <div className="h-px bg-warm-100" />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <DollarSign size={11} /> Ganancia neta
              </span>
              <span className={`text-sm font-bold ${costos.gananciaTotal >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatARS(costos.gananciaTotal)}
              </span>
            </div>
          </div>

          {/* Info config */}
          <p className="text-xs text-rose-300 flex items-center gap-1 mt-2">
            <Info size={11} />
            Hora trabajo: {formatARS(config.valor_hora_trabajo)} · Costo fijo/h: {formatARS(config.costo_fijo_por_hora)}
          </p>
        </div>

      </div>
    </div>
  );
}

function CostoRow({ label, hint, value }: { label: string; hint: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <p className="text-xs font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <span className="text-sm font-semibold text-gray-700">{formatARS(value)}</span>
    </div>
  );
}
