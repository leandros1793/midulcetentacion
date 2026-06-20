import { useState, useEffect } from 'react';
import { Settings, Save, Info, MessageCircle, ExternalLink, Instagram, Link2, Loader2 } from 'lucide-react';
import { configuracionService } from '../../services';
import type { Configuracion } from '../../types';

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);
}

export default function ConfiguracionPage() {
  const [config,   setConfig]   = useState<Configuracion | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    configuracionService.get()
      .then(setConfig)
      .finally(() => setLoading(false));
  }, []);

  const setDestacado = (idx: number, val: string) => {
    const arr = [...(config?.instagram_destacados ?? ['', '', ''])];
    arr[idx] = val;
    setConfig(c => c ? { ...c, instagram_destacados: arr } : c);
  };
  const destacados = [
    config?.instagram_destacados?.[0] ?? '',
    config?.instagram_destacados?.[1] ?? '',
    config?.instagram_destacados?.[2] ?? '',
  ];

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const updated = await configuracionService.update({
        valor_hora_trabajo:   config.valor_hora_trabajo,
        costo_fijo_por_hora:  config.costo_fijo_por_hora,
        nombre_contacto_1:    config.nombre_contacto_1,
        whatsapp_numero:      config.whatsapp_numero,
        nombre_contacto_2:    config.nombre_contacto_2,
        whatsapp_numero_2:    config.whatsapp_numero_2,
        instagram_usuario:    config.instagram_usuario,
        instagram_url:        config.instagram_url,
        instagram_destacados: config.instagram_destacados,
      });
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) return (
    <div className="flex justify-center py-16">
      <Loader2 size={24} className="animate-spin text-rose-300" />
    </div>
  );

  return (
    <div className="p-4 space-y-4 pb-8">
      <div>
        <h2 className="font-extrabold text-stone-800 tracking-tight">Configuración</h2>
        <p className="text-xs text-stone-400">Valores globales del negocio</p>
      </div>

      {/* ── Costos ────────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Settings size={15} className="text-rose-400" />
          <h3 className="text-sm font-semibold text-stone-700">Costos de producción</h3>
        </div>

        <div>
          <label className="label">Valor hora de trabajo ($)</label>
          <input type="number" min="0" step="any" className="input"
            value={config.valor_hora_trabajo}
            onChange={e => setConfig(c => ({ ...c, valor_hora_trabajo: Number(e.target.value) }))} />
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Info size={10} /> Cuánto vale 1 hora de tu trabajo personal.
          </p>
        </div>

        <div>
          <label className="label">Costo fijo por hora ($)</label>
          <input type="number" min="0" step="any" className="input"
            value={config.costo_fijo_por_hora}
            onChange={e => setConfig(c => ({ ...c, costo_fijo_por_hora: Number(e.target.value) }))} />
          <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
            <Info size={10} /> Alquiler + servicios ÷ horas trabajadas al mes.
          </p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 text-xs text-stone-500 space-y-1">
          <p className="font-semibold text-stone-600">¿Cómo calcular el costo fijo por hora?</p>
          <p>Sumá todos tus gastos fijos del mes (alquiler, luz, gas) y dividilo por las horas que trabajás ese mes.</p>
          <p>Ej: $60.000 ÷ 160 hs = {formatARS(375)}/hora</p>
        </div>
      </div>

      {/* ── Contactos ─────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} className="text-green-500" />
          <h3 className="text-sm font-semibold text-stone-700">Contactos del negocio</h3>
        </div>
        <p className="text-xs text-stone-400 flex items-center gap-1">
          <Info size={10} /> Código de país + número, sin + ni espacios.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Nombre (1)</label>
            <input type="text" className="input" placeholder="ej. Belu"
              value={config.nombre_contacto_1 ?? ''}
              onChange={e => setConfig(c => ({ ...c, nombre_contacto_1: e.target.value }))} />
          </div>
          <div>
            <label className="label">WhatsApp (1)</label>
            <input type="text" className="input" placeholder="5493512476048"
              value={config.whatsapp_numero ?? ''}
              onChange={e => setConfig(c => ({ ...c, whatsapp_numero: e.target.value }))} />
          </div>
        </div>
        {config.whatsapp_numero && (
          <a href={`https://wa.me/${config.whatsapp_numero}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700">
            <ExternalLink size={11} /> Probar WA de {config.nombre_contacto_1 || 'Contacto 1'}
          </a>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Nombre (2)</label>
            <input type="text" className="input" placeholder="ej. Flor"
              value={config.nombre_contacto_2 ?? ''}
              onChange={e => setConfig(c => ({ ...c, nombre_contacto_2: e.target.value }))} />
          </div>
          <div>
            <label className="label">WhatsApp (2)</label>
            <input type="text" className="input" placeholder="5493512217870"
              value={config.whatsapp_numero_2 ?? ''}
              onChange={e => setConfig(c => ({ ...c, whatsapp_numero_2: e.target.value }))} />
          </div>
        </div>
        {config.whatsapp_numero_2 && (
          <a href={`https://wa.me/${config.whatsapp_numero_2}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs text-green-600 hover:text-green-700">
            <ExternalLink size={11} /> Probar WA de {config.nombre_contacto_2 || 'Contacto 2'}
          </a>
        )}
      </div>

      {/* ── Instagram ─────────────────────────────────────────────────────────── */}
      <div className="card space-y-4">
        {/* Header con degradado IG */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}>
            <Instagram size={13} className="text-white" />
          </div>
          <h3 className="text-sm font-semibold text-stone-700">Integración con Instagram</h3>
        </div>

        <div>
          <label className="label">Usuario de Instagram</label>
          <input type="text" className="input" placeholder="@midulce_tentacion7"
            value={config.instagram_usuario ?? ''}
            onChange={e => setConfig(c => ({ ...c, instagram_usuario: e.target.value }))} />
        </div>

        <div>
          <label className="label">URL del perfil</label>
          <input type="url" className="input" placeholder="https://www.instagram.com/midulce_tentacion7/"
            value={config.instagram_url ?? ''}
            onChange={e => setConfig(c => ({ ...c, instagram_url: e.target.value }))} />
          {config.instagram_url && (
            <a href={config.instagram_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs mt-1.5 text-rose-500 hover:text-rose-600">
              <ExternalLink size={10} /> Ver perfil en Instagram
            </a>
          )}
        </div>

        <div className="h-px bg-stone-100" />

        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Link2 size={12} className="text-stone-400" />
            <p className="text-xs font-semibold text-stone-600">Posts o Reels destacados (hasta 3)</p>
          </div>
          <p className="text-xs text-stone-400 mb-3 flex items-start gap-1">
            <Info size={10} className="mt-0.5 shrink-0" />
            Pegá la URL de cada publicación. Ej: https://www.instagram.com/p/ABC123/
          </p>
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-300">
                  {i + 1}
                </span>
                <input
                  type="url"
                  className="input pl-7"
                  placeholder={`https://www.instagram.com/p/...`}
                  value={destacados[i]}
                  onChange={e => setDestacado(i, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Guardar ───────────────────────────────────────────────────────────── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`btn-primary w-full justify-center ${saved ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
      >
        {saving
          ? <><Loader2 size={16} className="animate-spin" /> Guardando…</>
          : <><Save size={16} /> {saved ? '¡Guardado! ✓' : 'Guardar configuración'}</>
        }
      </button>

      <div className="text-center text-xs text-stone-300 pt-2">
        Mi Dulce Tentación · Sistema de costos v1.0
      </div>
    </div>
  );
}
