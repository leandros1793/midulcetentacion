import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBasket, BookOpen, Receipt,
  Plus, ChevronRight, Sparkles,
} from 'lucide-react';
import { ingredientesService, recetasService, gastosService, configuracionService } from '../../services';
import { calcCostoPorUnidadReceta, calcCostoLinea } from '../../types';

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const now = new Date();

  const stats = useMemo(() => {
    const ingredientes = ingredientesService.getAll();
    const recetas = recetasService.getAll();
    const config = configuracionService.get();
    const gastosDelMes = gastosService.getDelMes(now.getFullYear(), now.getMonth());

    const totalGastosGenerales = gastosDelMes.reduce((s, g) => s + g.monto, 0);

    // Calcular rentabilidad de cada receta
    const rentabilidades = recetas.map(receta => {
      const lineas = recetasService.getLineas(receta.id);
      const costoIng = lineas.reduce((s, li) => {
        const ing = ingredientes.find(i => i.id === li.ingrediente_id);
        return ing ? s + calcCostoLinea(li, ing) : s;
      }, 0);
      const horasPrep = receta.tiempo_prep_minutos / 60;
      const costoMO = horasPrep * config.valor_hora_trabajo;
      const costoFijo = horasPrep * config.costo_fijo_por_hora;
      const costoTotal = costoIng + costoMO + costoFijo + receta.costo_packaging_fijo;
      const precioVenta = costoTotal * (1 + receta.margen_ganancia_porcentaje / 100);
      const ganancia = precioVenta - costoTotal;
      return { receta, costoTotal, precioVenta, ganancia };
    });

    const masRentable = rentabilidades.sort((a, b) => b.ganancia - a.ganancia)[0];

    return {
      numIngredientes: ingredientes.length,
      numRecetas: recetas.length,
      numGastos: gastosDelMes.length,
      totalGastosGenerales,
      masRentable,
    };
  }, []);

  const mes = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div className="pt-1">
        <div className="flex items-center gap-2 text-rose-400 mb-1">
          <Sparkles size={14} />
          <span className="text-xs font-medium uppercase tracking-widest">Resumen de {mes}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">¡Hola, pastelera! 👋</h2>
        <p className="text-sm text-gray-500">Todo está bajo control.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={<Receipt size={18} className="text-amber-500" />}
          label="Gastos del mes"
          value={formatARS(stats.totalGastosGenerales)}
          sub={`${stats.numGastos} registros`}
          bg="bg-amber-50"
        />
        <KpiCard
          icon={<ShoppingBasket size={18} className="text-emerald-500" />}
          label="Ingredientes"
          value={String(stats.numIngredientes)}
          sub="en stock"
          bg="bg-emerald-50"
        />
        <KpiCard
          icon={<BookOpen size={18} className="text-violet-500" />}
          label="Recetas"
          value={String(stats.numRecetas)}
          sub="activas"
          bg="bg-violet-50"
        />
        <KpiCard
          icon={<TrendingUp size={18} className="text-rose-500" />}
          label="Más rentable"
          value={stats.masRentable ? formatARS(stats.masRentable.ganancia) : '—'}
          sub={stats.masRentable?.receta.nombre ?? 'Sin recetas'}
          bg="bg-rose-50"
        />
      </div>

      {/* Acciones rápidas */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Acceso rápido</h3>
        <div className="space-y-2">
          {[
            { label: 'Nueva receta / cálculo de costos', icon: <BookOpen size={16} />, path: '/dashboard/recetas', color: 'text-violet-500', bg: 'bg-violet-50' },
            { label: 'Agregar ingrediente',        icon: <ShoppingBasket size={16} />, path: '/dashboard/ingredientes', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Registrar gasto',            icon: <Receipt size={16} />, path: '/dashboard/gastos', color: 'text-amber-500', bg: 'bg-amber-50' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-warm-50 transition-colors group"
            >
              <div className={`${item.bg} ${item.color} p-2 rounded-xl`}>{item.icon}</div>
              <span className="flex-1 text-sm font-medium text-gray-700 text-left">{item.label}</span>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Top recetas */}
      {stats.masRentable && (
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Producto destacado</h3>
          <div className="bg-gradient-to-br from-rose-50 to-blush-50 rounded-xl p-4 border border-rose-100">
            <p className="text-xs text-rose-400 font-medium mb-1">⭐ Más rentable del portfolio</p>
            <p className="font-bold text-gray-800 text-base">{stats.masRentable.receta.nombre}</p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-400">Costo total</p>
                <p className="text-sm font-semibold text-gray-700">{formatARS(stats.masRentable.costoTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Precio venta</p>
                <p className="text-sm font-semibold text-rose-600">{formatARS(stats.masRentable.precioVenta)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Ganancia</p>
                <p className="text-sm font-semibold text-emerald-600">{formatARS(stats.masRentable.ganancia)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({ icon, label, value, sub, bg }: {
  icon: React.ReactNode; label: string; value: string; sub: string; bg: string;
}) {
  return (
    <div className="card">
      <div className={`${bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-lg font-bold text-gray-800 leading-tight">{value}</p>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}
