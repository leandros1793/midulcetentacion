import { useState, useEffect, useCallback } from 'react';
import { Plus, ShoppingBag, Clock, CheckCircle2, XCircle, Loader2, Calendar, ChevronRight, User, AlertCircle } from 'lucide-react';
import { pedidosService, recetasService } from '../../services';
import type { Pedido, PedidoForm, PedidoLinea, EstadoPedido, Receta } from '../../types';
import { formatARS } from '../../utils/format';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import PedidoBuilder from './PedidoBuilder';

// ── Constantes ────────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<EstadoPedido, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  pendiente:  { label: 'Pendiente',  icon: <Clock size={10} />,         bg: 'bg-amber-50',   text: 'text-amber-600' },
  entregado:  { label: 'Entregado',  icon: <CheckCircle2 size={10} />,  bg: 'bg-emerald-50', text: 'text-emerald-600' },
  cancelado:  { label: 'Cancelado',  icon: <XCircle size={10} />,       bg: 'bg-stone-100',  text: 'text-stone-400' },
};

const DEFAULT_FORM: PedidoForm = {
  cliente: '',
  fecha_entrega: new Date().toISOString().split('T')[0],
  estado: 'pendiente',
  notas: '',
};

type Filtro = 'todos' | EstadoPedido;

// ── Componente principal ──────────────────────────────────────────────────────

export default function PedidosPage() {
  const [pedidos,   setPedidos]   = useState<Pedido[]>([]);
  const [lineasMap, setLineasMap] = useState<Record<string, PedidoLinea[]>>({});
  const [recetas,   setRecetas]   = useState<Receta[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [creating,  setCreating]  = useState(false);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState<PedidoForm>(DEFAULT_FORM);
  const [filtro,    setFiltro]    = useState<Filtro>('todos');
  const [selected,  setSelected]  = useState<Pedido | null>(null);
  const [delId,       setDelId]       = useState<string | null>(null);
  const [entregandoId, setEntregandoId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [peds, recetasList, todasLineas] = await Promise.all([
        pedidosService.getAll(),
        recetasService.getAll(),
        pedidosService.getAllLineas(),
      ]);
      setPedidos(peds);
      setRecetas(recetasList);
      // Agrupar líneas por pedido_id para acceso O(1)
      const map: Record<string, PedidoLinea[]> = {};
      for (const l of todasLineas) {
        if (!map[l.pedido_id]) map[l.pedido_id] = [];
        map[l.pedido_id].push(l);
      }
      setLineasMap(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = async () => {
    if (!form.fecha_entrega) return;
    setCreating(true);
    try {
      const nuevo = await pedidosService.create(form);
      await refresh();
      setShowForm(false);
      setForm(DEFAULT_FORM);
      setSelected(nuevo);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await pedidosService.delete(id);
    setDelId(null);
    await refresh();
  };

  const handleEntregado = async (p: Pedido) => {
    setEntregandoId(p.id);
    try {
      await pedidosService.update(p.id, {
        cliente:       p.cliente,
        fecha_entrega: p.fecha_entrega,
        estado:        'entregado',
        notas:         p.notas,
      });
      await refresh();
    } finally {
      setEntregandoId(null);
    }
  };

  // Urgencia de un pedido pendiente
  const getUrgencia = (p: Pedido): 'vencido' | 'hoy' | 'manana' | null => {
    if (p.estado !== 'pendiente') return null;
    const hoy    = new Date().toISOString().split('T')[0];
    const manana = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];
    if (p.fecha_entrega < hoy)    return 'vencido';
    if (p.fecha_entrega === hoy)  return 'hoy';
    if (p.fecha_entrega === manana) return 'manana';
    return null;
  };

  const recetaMap = Object.fromEntries(recetas.map(r => [r.id, r]));

  // Total cobrado de un pedido
  const totalPedido = (pedidoId: string) =>
    (lineasMap[pedidoId] ?? []).reduce(
      (s, l) => s + l.precio_unitario_cobrado * l.cantidad, 0
    );

  const pedidosFiltrados = filtro === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtro);

  if (selected) {
    return (
      <PedidoBuilder
        pedido={selected}
        recetas={recetas}
        onBack={() => { setSelected(null); refresh(); }}
        onSave={updated => { setSelected(updated); refresh(); }}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-stone-800">Pedidos</h2>
          <p className="text-xs text-stone-400">{pedidos.filter(p => p.estado === 'pendiente').length} pendientes</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary text-sm">
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Filtro de estado */}
      <div className="flex gap-2">
        {(['todos', 'pendiente', 'entregado', 'cancelado'] as Filtro[]).map(f => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
              filtro === f
                ? 'bg-rose-500 text-white shadow-sm shadow-rose-200'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {f === 'todos' ? 'Todos' : ESTADO_CONFIG[f].label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-rose-300" />
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title={filtro === 'todos' ? 'Sin pedidos todavía' : `Sin pedidos ${ESTADO_CONFIG[filtro as EstadoPedido]?.label.toLowerCase()}`}
          description="Registrá el primer encargo para empezar a trackear tus ventas."
          action={filtro === 'todos' ? { label: '+ Nuevo pedido', onClick: () => setShowForm(true) } : undefined}
        />
      ) : (
        <div className="space-y-2">
          {pedidosFiltrados.map(p => {
            const lineas   = lineasMap[p.id] ?? [];
            const total    = totalPedido(p.id);
            const cfg      = ESTADO_CONFIG[p.estado];
            const urgencia = getUrgencia(p);
            const fechaStr = new Date(p.fecha_entrega + 'T12:00:00')
              .toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });

            // Borde de urgencia en la card
            const cardBorder = urgencia === 'vencido' ? 'border-red-200 shadow-red-50'
              : urgencia === 'hoy' ? 'border-amber-200 shadow-amber-50'
              : '';

            return (
              <div key={p.id} className={`card flex items-center gap-3 ${cardBorder}`}>

                {/* Info */}
                <button
                  onClick={() => setSelected(p)}
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                    {urgencia === 'vencido'
                      ? <AlertCircle size={16} className="text-red-500" />
                      : <ShoppingBag size={16} className={cfg.text} />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <p className="font-semibold text-stone-800 text-sm truncate">
                        {p.cliente || 'Sin nombre'}
                      </p>
                      <span className={`shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      {urgencia === 'vencido' && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                          ⚠ Vencido
                        </span>
                      )}
                      {urgencia === 'hoy' && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          🔔 Hoy
                        </span>
                      )}
                      {urgencia === 'manana' && (
                        <span className="shrink-0 inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-500">
                          Mañana
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-400 mt-0.5">
                      <span className="flex items-center gap-1"><Calendar size={9} /> {fechaStr}</span>
                      {lineas.length > 0 && (
                        <>
                          <span>·</span>
                          <span>{lineas.length} {lineas.length === 1 ? 'producto' : 'productos'}</span>
                        </>
                      )}
                    </div>
                    {lineas.length > 0 && (
                      <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                        {lineas.map(l => {
                          const r = recetaMap[l.receta_id];
                          return r ? `${l.cantidad}× ${r.nombre}` : '';
                        }).filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </button>

                {/* Total + acciones */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {total > 0 && (
                    <p className="text-sm font-bold text-stone-800 tabular-nums">{formatARS(total, 0)}</p>
                  )}
                  <div className="flex items-center gap-1">
                    {p.estado === 'pendiente' && (
                      <button
                        onClick={() => handleEntregado(p)}
                        disabled={entregandoId === p.id}
                        title="Marcar como entregado"
                        className="w-7 h-7 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        {entregandoId === p.id
                          ? <Loader2 size={13} className="animate-spin" />
                          : <CheckCircle2 size={14} />
                        }
                      </button>
                    )}
                    <button onClick={() => setSelected(p)} className="w-7 h-7 flex items-center justify-center">
                      <ChevronRight size={14} className="text-stone-300" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal nuevo pedido */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nuevo pedido">
        <div className="space-y-3">
          <div>
            <label className="label flex items-center gap-1"><User size={11} /> Cliente (opcional)</label>
            <input
              className="input" placeholder="ej. Mariana García"
              value={form.cliente ?? ''}
              onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))}
            />
          </div>
          <div>
            <label className="label flex items-center gap-1"><Calendar size={11} /> Fecha de entrega *</label>
            <input
              type="date" className="input"
              value={form.fecha_entrega}
              onChange={e => setForm(f => ({ ...f, fecha_entrega: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea
              className="input resize-none" rows={2}
              placeholder="Sabor, decoración, dirección de entrega…"
              value={form.notas ?? ''}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !form.fecha_entrega}
            className="btn-primary w-full justify-center mt-1"
          >
            {creating
              ? <><Loader2 size={14} className="animate-spin" /> Creando…</>
              : 'Crear y agregar productos →'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        title="Eliminar pedido"
        message="¿Eliminar este pedido y todos sus productos? Esta acción no se puede deshacer."
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => setDelId(null)}
      />
    </div>
  );
}
