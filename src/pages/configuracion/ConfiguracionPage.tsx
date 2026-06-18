import { useState } from 'react';
import { Settings, Save, Info } from 'lucide-react';
import { configuracionService } from '../../services';
import type { Configuracion } from '../../types';

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<Configuracion>(() => configuracionService.get());
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    configuracionService.update({
      valor_hora_trabajo: config.valor_hora_trabajo,
      costo_fijo_por_hora: config.costo_fijo_por_hora,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h2 className="font-bold text-gray-800">Configuración</h2>
        <p className="text-xs text-gray-400">Valores globales del negocio</p>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={15} className="text-rose-400" />
          <h3 className="text-sm font-semibold text-gray-700">Costos de producción</h3>
        </div>

        <div>
          <label className="label">Valor hora de trabajo ($)</label>
          <input type="number" min="0" step="any" className="input"
            value={config.valor_hora_trabajo}
            onChange={e => setConfig(c => ({ ...c, valor_hora_trabajo: Number(e.target.value) }))} />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Info size={10} /> Cuánto vale 1 hora de tu trabajo personal.
          </p>
        </div>

        <div>
          <label className="label">Costo fijo por hora ($)</label>
          <input type="number" min="0" step="any" className="input"
            value={config.costo_fijo_por_hora}
            onChange={e => setConfig(c => ({ ...c, costo_fijo_por_hora: Number(e.target.value) }))} />
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Info size={10} /> Alquiler + servicios ÷ horas trabajadas al mes.
          </p>
        </div>

        <div className="bg-warm-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
          <p className="font-semibold text-gray-600">¿Cómo calcular el costo fijo por hora?</p>
          <p>Sumá todos tus gastos fijos del mes (alquiler, luz, gas) y dividilo por las horas que trabajás ese mes.</p>
          <p>Ej: $60.000 de gastos ÷ 160 horas = {formatARS(375)}/hora</p>
        </div>

        <button onClick={handleSave} className={`btn-primary w-full justify-center ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}>
          <Save size={16} /> {saved ? '¡Guardado!' : 'Guardar configuración'}
        </button>
      </div>

      <div className="text-center text-xs text-gray-300 pt-4">
        Mi Dulce Tentación · Sistema de costos v1.0
      </div>
    </div>
  );
}
