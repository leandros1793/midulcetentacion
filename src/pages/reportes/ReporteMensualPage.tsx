import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, ShoppingBag, Receipt, Sparkles, Package } from 'lucide-react';
import {
  pedidosService, recetasService, ingredientesService,
  gastosService, configuracionService,
} from '../../services';
import { calcCostoLinea } from '../../types';
import type { Pedido, PedidoLinea, Receta, Ingrediente, RecetaIngrediente, GastoGeneral } from '../../types';
import { formatARS } from '../../utils/format';

// ── Helpers ───────────────────────────────────────────────────────────────────

function nombreMes(year: number, month: number): string {
  return new Date(year, month, 1)
    .toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function calcCostoReceta(
  recetaId: string,
  recetaMap: Record<string, Receta>,
  recetaLineasMap: Record<string, RecetaIngrediente[]>,
  ingMap: Record<string, Ingrediente>,
  config: { valor_hora_trabajo: number; costo_fijo_por_hora: number },
): number {
  const receta = recetaMap[recetaId];
  if (!receta) return 0;
  const lins = recetaLineasMap[recetaId] ?? [];
  const costoIng = lins.reduce((s, l) => {
    const ing = ingMap[l.ingrediente_id];
    return ing ? s + calcCostoLinea(l, ing) : s;
  }, 0);
  const h = receta.tiempo_prep_minutos / 60;
  return costoIng + h * config.valor_hora_trabajo + h * config.costo_fijo_por_hora + receta.costo_packaging_fijo;
}

// ── Componente KPI ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, icon, accent = 'rose' }: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent?: 'rose' | 'emerald' | 'amber' | 'stone';
}) {
  const colors = {
    rose:    'bg-rose-50 text-rose-500',
    emerald: 'bg-emerald-50 text-emerald-500',
    amber:   'bg-amber-50 text-amber-500',
    stone:   'bg-stone-50 text-stone-400',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-[0_2px_12px_rgb(0,0,0,0.04)] p-4">
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${colors[accent]}`}>
        {icon}
      </div>
      <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-lg font-black text-stone-800 tabular-nums leading-tight">{value}</p>
      {sub && <p className="text-[10px] text-stone-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ReporteMensualPage() {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [loading, setLoading] = useState(true);

  const [pedidosMes,   setPedidosMes]   = useState<Pedido[]>([]);
  const [todasLineas,  setTodasLineas]  = useState<PedidoLinea[]>([]);
  const [recetas,      setRecetas]      = useState<Receta[]>([]);
  const [recetaLineas, setRecetaLineas] = useState<RecetaIngrediente[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [gastosMes,    setGastosMes]    = useState<GastoGeneral[]>([]);
  const [config,       setConfig]       = useState({ valor_hora_trabajo: 500, costo_fijo_por_hora: 100 });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [peds, lineas, recs, recLins, ings, gastos, cfg] = await Promise.all([
          pedidosService.getDelMes(year, month),
          pedidosService.getAllLineas(),
          recetasService.getAll(),
          recetasService.getAllLineas(),
          ingredientesService.getAll(),
          gastosService.getDelMes(year, month),
          configuracionService.get(),
        ]);
        if (cancelled) return;
        setPedidosMes(peds);
        setTodasLineas(lineas);
        setRecetas(recs);
        setRecetaLineas(recLins);
        setIngredientes(ings);
        setGastosMes(gastos);
        setConfig({ valor_hora_trabajo: cfg.valor_hora_trabajo, costo_fijo_por_hora: cfg.costo_fijo_por_hora });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [year, month]);

  const recetaMap = useMemo(() => Object.fromEntries(recetas.map(r => [r.id, r])), [recetas]);
  const ingMap    = useMemo(() => Object.fromEntries(ingredientes.map(i => [i.id, i])), [ingredientes]);
  const recetaLineasMap = useMemo(() => {
    const m: Record<string, RecetaIngrediente[]> = {};
    for (const l of recetaLineas) {
      if (!m[l.receta_id]) m[l.receta_id] = [];
      m[l.receta_id].push(l);
    }
    return m;
  }, [recetaLineas]);

  // Líneas del mes (solo de pedidos entregados para contar ingresos reales)
  const pedidosEntregados = useMemo(() => pedidosMes.filter(p => p.estado === 'entregado'), [pedidosMes]);
  const pedidosPendientes = useMemo(() => pedidosMes.filter(p => p.estado === 'pendiente'), [pedidosMes]);

  const lineasEntregadas = useMemo(() => {
    const ids = new Set(pedidosEntregados.map(p => p.id));
    return todasLineas.filter(l => ids.has(l.pedido_id));
  }, [todasLineas, pedidosEntregados]);

  const lineasPendientes = useMemo(() => {
    const ids = new Set(pedidosPendientes.map(p => p.id));
    return todasLineas.filter(l => ids.has(l.pedido_id));
  }, [todasLineas, pedidosPendientes]);

  // KPIs principales
  const stats = useMemo(() => {
    const ingresos = lineasEntregadas.reduce((s, l) => s + l.precio_unitario_cobrado * l.cantidad, 0);

    const costoMatPrima = lineasEntregadas.reduce((s, l) => {
      const costoReceta = calcCostoReceta(l.receta_id, recetaMap, recetaLineasMap, ingMap, config);
      return s + costoReceta * l.cantidad;
    }, 0);

    const totalGastosGenerales = gastosMes.reduce((s, g) => s + g.monto, 0);
    const totalCostos   = costoMatPrima + totalGastosGenerales;
    const gananciaNeta  = ingresos - totalCostos;
    const margenReal    = ingresos > 0 ? (gananciaNeta / ingresos) * 100 : 0;

    const ingresosPendientes = lineasPendientes.reduce((s, l) => s + l.precio_unitario_cobrado * l.cantidad, 0);

    return { ingresos, costoMatPrima, totalGastosGenerales, totalCostos, gananciaNeta, margenReal, ingresosPendientes };
  }, [lineasEntregadas, lineasPendientes, gastosMes, recetaMap, recetaLineasMap, ingMap, config]);

  // Ranking de productos (por ingresos)
  const rankingProductos = useMemo(() => {
    const byReceta: Record<string, { receta: Receta; ingresos: number; unidades: number }> = {};
    for (const l of lineasEntregadas) {
      const receta = recetaMap[l.receta_id];
      if (!receta) continue;
      if (!byReceta[l.receta_id]) byReceta[l.receta_id] = { receta, ingresos: 0, unidades: 0 };
      byReceta[l.receta_id].ingresos += l.precio_unitario_cobrado * l.cantidad;
      byReceta[l.receta_id].unidades += l.cantidad;
    }
    return Object.values(byReceta).sort((a, b) => b.ingresos - a.ingresos);
  }, [lineasEntregadas, recetaMap]);

  const navMes = (dir: -1 | 1) => {
    const d = new Date(year, month + dir, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  return (
    <div className="p-4 space-y-4 pb-8">

      {/* Selector de mes */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-800">Reporte mensual</h2>
          <p className="text-xs text-stone-400 capitalize">{nombreMes(year, month)}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navMes(-1)}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navMes(1)}
            disabled={year === now.getFullYear() && month === now.getMonth()}
            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors disabled:opacity-30"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-rose-300" />
        </div>
      ) : pedidosEntregados.length === 0 && gastosMes.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Sparkles size={24} className="text-stone-200" />
          </div>
          <p className="text-sm font-semibold text-stone-400">Sin datos para este mes</p>
          <p className="text-xs text-stone-300 mt-1">Registrá pedidos y gastos para ver el reporte.</p>
        </div>
      ) : (
        <>
          {/* KPIs grid */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Ingresos reales"
              value={formatARS(stats.ingresos, 0)}
              sub={`${pedidosEntregados.length} pedidos entregados`}
              icon={<TrendingUp size={16} />}
              accent="rose"
            />
            <KpiCard
              label="Ganancia neta"
              value={formatARS(stats.gananciaNeta, 0)}
              sub={`Margen ${stats.margenReal.toFixed(0)}%`}
              icon={<Sparkles size={16} />}
              accent={stats.gananciaNeta >= 0 ? 'emerald' : 'stone'}
            />
            <KpiCard
              label="Costo producción"
              value={formatARS(stats.costoMatPrima, 0)}
              sub="Mat. prima + M.O."
              icon={<Package size={16} />}
              accent="amber"
            />
            <KpiCard
              label="Gastos generales"
              value={formatARS(stats.totalGastosGenerales, 0)}
              sub="Fijos + variables"
              icon={<Receipt size={16} />}
              accent="stone"
            />
          </div>

          {/* Barra de desglose */}
          {stats.ingresos > 0 && (
            <div className="card">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Desglose de costos</h3>
              <div className="space-y-2">
                {[
                  { label: 'Mat. prima + M.O.', value: stats.costoMatPrima, color: 'bg-amber-400' },
                  { label: 'Gastos generales',  value: stats.totalGastosGenerales, color: 'bg-stone-300' },
                  { label: 'Ganancia neta',     value: Math.max(stats.gananciaNeta, 0), color: 'bg-emerald-400' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-500">{item.label}</span>
                      <span className="font-semibold text-stone-700 tabular-nums">{formatARS(item.value, 0)}</span>
                    </div>
                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${Math.min((item.value / stats.ingresos) * 100, 100).toFixed(1)}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
          )}

          {/* Pedidos por cobrar */}
          {stats.ingresosPendientes > 0 && (
            <div className="card border-amber-100 bg-amber-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5 mb-0.5">
                    <ShoppingBag size={12} /> Pendiente de entrega
                  </p>
                  <p className="text-[10px] text-amber-600">{pedidosPendientes.length} pedido{pedidosPendientes.length !== 1 ? 's' : ''} · plata que viene</p>
                </div>
                <p className="text-lg font-black text-amber-700 tabular-nums">{formatARS(stats.ingresosPendientes, 0)}</p>
              </div>
            </div>
          )}

          {/* Ranking de productos */}
          {rankingProductos.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">
                🏆 Productos más vendidos
              </h3>
              <div className="space-y-3">
                {rankingProductos.map((item, idx) => (
                  <div key={item.receta.id} className="flex items-center gap-3">
                    <span className={`text-sm font-black w-5 text-center shrink-0 ${
                      idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-stone-400' : 'text-orange-300'
                    }`}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 truncate">{item.receta.nombre}</p>
                      <p className="text-[10px] text-stone-400">{item.unidades} {item.receta.modo_venta === 'por_unidad' ? 'unidades' : 'porciones'} vendidas</p>
                    </div>
                    <p className="text-sm font-bold text-stone-800 tabular-nums shrink-0">{formatARS(item.ingresos, 0)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista pedidos del mes */}
          {pedidosMes.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Pedidos del mes</h3>
              <div className="space-y-2">
                {pedidosMes.map(p => {
                  const lineasP = todasLineas.filter(l => l.pedido_id === p.id);
                  const total = lineasP.reduce((s, l) => s + l.precio_unitario_cobrado * l.cantidad, 0);
                  const fecha = new Date(p.fecha_entrega + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                  const estadoColor = p.estado === 'entregado' ? 'text-emerald-600 bg-emerald-50' : p.estado === 'cancelado' ? 'text-stone-400 bg-stone-100' : 'text-amber-600 bg-amber-50';
                  return (
                    <div key={p.id} className="flex items-center gap-2 py-1">
                      <p className="text-xs text-stone-400 w-12 shrink-0">{fecha}</p>
                      <p className="flex-1 text-xs font-medium text-stone-700 truncate">{p.cliente || 'Sin nombre'}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${estadoColor}`}>
                        {p.estado}
                      </span>
                      <p className="text-xs font-bold text-stone-700 tabular-nums shrink-0">{formatARS(total, 0)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-stone-100 mt-3 pt-3 flex justify-between">
                <span className="text-xs font-semibold text-stone-500">Total mes</span>
                <span className="text-xs font-black text-stone-800 tabular-nums">{formatARS(stats.ingresos, 0)}</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
