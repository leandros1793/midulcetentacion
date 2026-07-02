import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, BookOpen, Receipt, Sparkles, Loader2,
  Plus, ShoppingBag, BarChart2,
} from 'lucide-react';
import { ingredientesService, recetasService, gastosService, pedidosService, configuracionService } from '../../services';
import { calcCostoLinea } from '../../types';
import type { Ingrediente, Receta, RecetaIngrediente, GastoGeneral, Pedido } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { formatARS as _fmt } from '../../utils/format';
function formatARS(n: number) { return _fmt(n, 0); }

interface DashboardStats {
  numPedidosPendientes: number;
  numRecetas: number;
  numGastos: number;
  totalGastosGenerales: number;
  masRentable: { receta: Receta; costoTotal: number; precioVenta: number; ganancia: number } | null;
}

function calcStats(
  ingredientes: Ingrediente[],
  recetas: Receta[],
  allLineas: RecetaIngrediente[],
  gastosDelMes: GastoGeneral[],
  pedidos: Pedido[],
  config: { valor_hora_trabajo: number; costo_fijo_por_hora: number },
): DashboardStats {
  const totalGastosGenerales = gastosDelMes.reduce((s, g) => s + g.monto, 0);
  const numPedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
  const ingMap = Object.fromEntries(ingredientes.map(i => [i.id, i]));

  const rentabilidades = recetas.map(receta => {
    const lineas = allLineas.filter(l => l.receta_id === receta.id);
    const costoIng = lineas.reduce((s, li) => {
      const ing = ingMap[li.ingrediente_id];
      return ing ? s + calcCostoLinea(li, ing) : s;
    }, 0);
    const horasPrep = receta.tiempo_prep_minutos / 60;
    const costoTotal = costoIng
      + horasPrep * config.valor_hora_trabajo
      + horasPrep * config.costo_fijo_por_hora
      + receta.costo_packaging_fijo;
    const precioVenta = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
    const unidades = Math.max(receta.rinde_porciones, 1);
    const ganancia = receta.modo_venta === 'por_unidad'
      ? (precioVenta - costoTotal) / unidades
      : precioVenta - costoTotal;
    return { receta, costoTotal, precioVenta, ganancia };
  });

  const masRentable = [...rentabilidades].sort((a, b) => b.ganancia - a.ganancia)[0] ?? null;
  return {
    numPedidosPendientes, numRecetas: recetas.length,
    numGastos: gastosDelMes.length, totalGastosGenerales, masRentable,
  };
}

// KPI Card premium con fondo degradado

function KpiCard({
  icon, label, value, sub, gradient, shadow, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  gradient: string;
  shadow: string;
  onClick?: () => void;
}) {
  const El = onClick ? 'button' : 'div';
  return (
    <El
      className={`relative overflow-hidden rounded-[22px] p-4 ${gradient} ${shadow} text-left w-full ${onClick ? 'active:scale-[0.96] transition-transform' : ''}`}
      onClick={onClick}
    >
      <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-white/12 pointer-events-none" />
      <div className="absolute -bottom-5 right-2 w-14 h-14 rounded-full bg-white/8 pointer-events-none" />
      <div className="relative">
        <div className="w-9 h-9 rounded-xl bg-white/22 backdrop-blur-sm flex items-center justify-center mb-3 text-white">
          {icon}
        </div>
        <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.16em] mb-0.5">{label}</p>
        <p className="text-[22px] font-black text-white leading-tight tabular-nums">{value}</p>
        <p className="text-[10px] text-white/55 mt-0.5 font-medium">{sub}</p>
      </div>
    </El>
  );
}

// Acceso rapido: tile con degradado

function QuickTile({
  icon, label, gradient, shadow, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  gradient: string;
  shadow: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-3.5 ${gradient} ${shadow} flex flex-col items-start gap-2 active:scale-[0.95] transition-transform`}
    >
      <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full bg-white/12 pointer-events-none" />
      <div className="w-8 h-8 rounded-xl bg-white/22 flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <span className="text-[11px] font-bold text-white leading-tight relative">{label}</span>
    </button>
  );
}

// Dashboard

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const now = new Date();
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const nombreUsuario = user?.user_metadata?.full_name
    ?? user?.user_metadata?.name
    ?? (user?.email ? user.email.split('@')[0] : null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [ingredientes, recetas, allLineas, gastosDelMes, pedidos, config] = await Promise.all([
          ingredientesService.getAll(),
          recetasService.getAll(),
          recetasService.getAllLineas(),
          gastosService.getDelMes(now.getFullYear(), now.getMonth()),
          pedidosService.getAll(),
          configuracionService.get(),
        ]);
        if (!cancelled) setStats(calcStats(ingredientes, recetas, allLineas, gastosDelMes, pedidos, config));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mes = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 space-y-5">

      {/* Greeting */}
      <div className="pt-1">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles size={12} className="text-rose-400" />
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-400">
            Resumen de {mes}
          </span>
        </div>
        <h2 className="text-[22px] font-black text-stone-800 leading-tight">
          {nombreUsuario ? `Hola, ${nombreUsuario}! ` : 'Hola! '}
        </h2>
        <p className="text-sm text-stone-500 mt-0.5">
          {!stats || loading
            ? 'Calculando tu negocio...'
            : stats.numPedidosPendientes > 0
              ? `Tenes ${stats.numPedidosPendientes} pedido${stats.numPedidosPendientes !== 1 ? 's' : ''} pendiente${stats.numPedidosPendientes !== 1 ? 's' : ''}`
              : 'Todo al dia. Sin pedidos pendientes'}
        </p>
      </div>

      {/* KPI Cards */}
      {loading || !stats ? (
        <div className="flex justify-center py-12">
          <Loader2 size={26} className="animate-spin text-rose-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              icon={<Receipt size={18} />}
              label="Gastos del mes"
              value={formatARS(stats.totalGastosGenerales)}
              sub={`${stats.numGastos} registro${stats.numGastos !== 1 ? 's' : ''}`}
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              shadow="shadow-[0_8px_24px_rgba(251,146,60,0.42)]"
              onClick={() => navigate('/dashboard/gastos')}
            />
            <KpiCard
              icon={<ShoppingBag size={18} />}
              label="Pedidos pendientes"
              value={String(stats.numPedidosPendientes)}
              sub={stats.numPedidosPendientes === 0 ? 'Al dia' : 'por entregar'}
              gradient={
                stats.numPedidosPendientes > 0
                  ? 'bg-gradient-to-br from-rose-400 to-rose-600'
                  : 'bg-gradient-to-br from-emerald-400 to-teal-500'
              }
              shadow={
                stats.numPedidosPendientes > 0
                  ? 'shadow-[0_8px_24px_rgba(244,63,94,0.40)]'
                  : 'shadow-[0_8px_24px_rgba(52,211,153,0.40)]'
              }
              onClick={() => navigate('/dashboard/pedidos')}
            />
            <KpiCard
              icon={<BookOpen size={18} />}
              label="Recetas"
              value={String(stats.numRecetas)}
              sub="en el portfolio"
              gradient="bg-gradient-to-br from-violet-400 to-violet-600"
              shadow="shadow-[0_8px_24px_rgba(139,92,246,0.38)]"
              onClick={() => navigate('/dashboard/recetas')}
            />
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Mas rentable"
              value={stats.masRentable ? formatARS(stats.masRentable.ganancia) : '--'}
              sub={stats.masRentable?.receta.nombre ?? 'Sin recetas aun'}
              gradient="bg-gradient-to-br from-emerald-400 to-teal-500"
              shadow="shadow-[0_8px_24px_rgba(52,211,153,0.40)]"
            />
          </div>

          {/* Producto destacado */}
          {stats.masRentable && (
            <div className="card overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-rose-400 to-amber-400 rounded-t-[20px]" />
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 mb-3">
                Producto destacado
              </p>
              <div className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-4 border border-rose-100/60">
                <p className="text-[10px] font-bold text-rose-400 mb-1 tracking-wide">
                  Mayor rentabilidad del portfolio
                </p>
                <p className="font-black text-stone-800 text-base leading-tight mb-3">
                  {stats.masRentable.receta.nombre}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/70 rounded-xl p-2.5">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase tracking-wide mb-0.5">Costo</p>
                    <p className="text-xs font-bold text-stone-700 tabular-nums">{formatARS(stats.masRentable.costoTotal)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-2.5">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase tracking-wide mb-0.5">Venta</p>
                    <p className="text-xs font-bold text-rose-600 tabular-nums">{formatARS(stats.masRentable.precioVenta)}</p>
                  </div>
                  <div className="bg-white/70 rounded-xl p-2.5">
                    <p className="text-[9px] text-stone-400 font-semibold uppercase tracking-wide mb-0.5">
                      {stats.masRentable.receta.modo_venta === 'por_unidad' ? 'Por ud.' : 'Ganancia'}
                    </p>
                    <p className="text-xs font-bold text-emerald-600 tabular-nums">{formatARS(stats.masRentable.ganancia)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acceso rapido */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-stone-400 mb-3">
              Acceso rapido
            </p>
            <div className="grid grid-cols-2 gap-3">
              <QuickTile
                icon={<Plus size={18} />}
                label="Nueva receta"
                gradient="bg-gradient-to-br from-violet-400 to-violet-600"
                shadow="shadow-[0_6px_18px_rgba(139,92,246,0.35)]"
                onClick={() => navigate('/dashboard/recetas')}
              />
              <QuickTile
                icon={<ShoppingBag size={18} />}
                label="Ingredientes"
                gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
                shadow="shadow-[0_6px_18px_rgba(52,211,153,0.35)]"
                onClick={() => navigate('/dashboard/ingredientes')}
              />
              <QuickTile
                icon={<Receipt size={18} />}
                label="Gasto"
                gradient="bg-gradient-to-br from-amber-400 to-orange-500"
                shadow="shadow-[0_6px_18px_rgba(251,146,60,0.38)]"
                onClick={() => navigate('/dashboard/gastos')}
              />
              <QuickTile
                icon={<BarChart2 size={18} />}
                label="Reporte"
                gradient="bg-gradient-to-br from-sky-400 to-blue-600"
                shadow="shadow-[0_6px_18px_rgba(56,189,248,0.35)]"
                onClick={() => navigate('/dashboard/reporte')}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
