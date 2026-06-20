import { useState } from 'react';
import { Plus, ShoppingBasket, Trash2, Edit2, Search } from 'lucide-react';
import { ingredientesService } from '../../services';
import {
  calcCostoPorUnidadReceta,
  type Ingrediente, type IngredienteForm,
  type CategoriaIngrediente, type UnidadCompra, type UnidadReceta,
} from '../../types';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const CATEGORIAS: CategoriaIngrediente[] = [
  'Lácteos','Harinas','Azúcares','Huevos','Grasas',
  'Frutas','Chocolates','Decoración','Esencias','Leudantes','Otros'
];
const UNIDADES_COMPRA: UnidadCompra[] = ['Kg','Litro','Unidad'];
const UNIDADES_RECETA: UnidadReceta[] = ['Gramos','Mililitros','Unidad'];
const CATEGORIA_COLORS: Record<CategoriaIngrediente, string> = {
  'Lácteos':'bg-blue-50 text-blue-600','Harinas':'bg-amber-50 text-amber-600',
  'Azúcares':'bg-pink-50 text-pink-600','Huevos':'bg-yellow-50 text-yellow-600',
  'Grasas':'bg-orange-50 text-orange-600','Frutas':'bg-emerald-50 text-emerald-600',
  'Chocolates':'bg-amber-100 text-amber-800','Decoración':'bg-purple-50 text-purple-600',
  'Esencias':'bg-teal-50 text-teal-600','Leudantes':'bg-lime-50 text-lime-600',
  'Otros':'bg-gray-50 text-gray-600',
};

const DEFAULT_FORM: IngredienteForm = {
  nombre:'',proveedor:'',categoria:'Harinas',
  precio_compra:0,cantidad_empaque:1,
  unidad_medida_compra:'Kg',unidad_medida_receta:'Gramos',
  factor_conversion:1000,merma_porcentaje:0,
};

function formatARS(n: number) {
  return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:4}).format(n);
}

/** Convierte "Gramos"→"gramo", "Mililitros"→"mililitro", "Unidad"→"unidad" */
function singularUnit(u: string): string {
  const map: Record<string, string> = {
    Gramos: 'gramo', Mililitros: 'mililitro', Unidad: 'unidad',
  };
  return map[u] ?? u.toLowerCase();
}

export default function IngredientesPage() {
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(() => ingredientesService.getAll());
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ingrediente | null>(null);
  const [form, setForm] = useState<IngredienteForm>(DEFAULT_FORM);
  const [delId, setDelId] = useState<string | null>(null);

  const refresh = () => setIngredientes(ingredientesService.getAll());
  const openNew = () => { setEditing(null); setForm(DEFAULT_FORM); setShowForm(true); };
  const openEdit = (ing: Ingrediente) => {
    setEditing(ing);
    setForm({ nombre:ing.nombre,proveedor:ing.proveedor,categoria:ing.categoria,
      precio_compra:ing.precio_compra,cantidad_empaque:ing.cantidad_empaque,
      unidad_medida_compra:ing.unidad_medida_compra,unidad_medida_receta:ing.unidad_medida_receta,
      factor_conversion:ing.factor_conversion,merma_porcentaje:ing.merma_porcentaje });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.nombre.trim()) return;
    if (editing) ingredientesService.update(editing.id, form);
    else ingredientesService.create(form);
    refresh(); setShowForm(false);
  };

  const handleDelete = (id: string) => { ingredientesService.delete(id); refresh(); setDelId(null); };

  const filtered = ingredientes.filter(i =>
    i.nombre.toLowerCase().includes(query.toLowerCase()) ||
    i.categoria.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-gray-800">Ingredientes</h2>
          <p className="text-xs text-gray-400">{ingredientes.length} productos</p>
        </div>
        <button onClick={openNew} className="btn-primary text-sm"><Plus size={16} /> Nuevo</button>
      </div>

      {/* Search */}
      {ingredientes.length > 0 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-gray-300" />
          <input className="input pl-8" placeholder="Buscar ingrediente…"
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      )}

      {filtered.length === 0 && ingredientes.length === 0 ? (
        <EmptyState icon={ShoppingBasket} title="Sin ingredientes"
          description="Agregá tu primera materia prima para empezar a costear."
          action={{ label: '+ Agregar ingrediente', onClick: openNew }} />
      ) : (
        <div className="space-y-2">
          {filtered.map(ing => (
            <div key={ing.id} className="card flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{ing.nombre}</p>
                  <span className={`badge ${CATEGORIA_COLORS[ing.categoria]}`}>{ing.categoria}</span>
                </div>
                <p className="text-xs text-gray-400">
                  ${ing.precio_compra} / {ing.cantidad_empaque} {ing.unidad_medida_compra}
                  {ing.proveedor && ` · ${ing.proveedor}`}
                </p>
                <p className="text-xs font-semibold text-rose-600 mt-0.5">
                  {formatARS(calcCostoPorUnidadReceta(ing))} / {singularUnit(ing.unidad_medida_receta)}
                  {ing.merma_porcentaje > 0 && <span className="text-gray-400 font-normal"> (merma {ing.merma_porcentaje}%)</span>}
                </p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => openEdit(ing)} className="p-1.5 text-gray-300 hover:text-blue-400 transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => setDelId(ing.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? 'Editar ingrediente' : 'Nuevo ingrediente'}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="label">Nombre *</label>
              <input className="input" placeholder="ej. Harina 0000"
                value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="input" value={form.categoria}
                onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaIngrediente }))}>
                {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Proveedor</label>
              <input className="input" placeholder="opcional"
                value={form.proveedor ?? ''} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} />
            </div>
          </div>

          <div className="bg-warm-50 rounded-xl p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500">¿Cómo comprás este producto?</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="label">Precio de compra ($)</label>
                <input type="number" min="0" step="any" className="input"
                  value={form.precio_compra} onChange={e => setForm(f => ({ ...f, precio_compra: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Unidad</label>
                <select className="input" value={form.unidad_medida_compra}
                  onChange={e => setForm(f => ({ ...f, unidad_medida_compra: e.target.value as UnidadCompra }))}>
                  {UNIDADES_COMPRA.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="label">Cantidad empaque</label>
                <input type="number" min="0" step="any" className="input"
                  value={form.cantidad_empaque} onChange={e => setForm(f => ({ ...f, cantidad_empaque: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Factor conversión</label>
                <input type="number" min="1" step="any" className="input"
                  value={form.factor_conversion} onChange={e => setForm(f => ({ ...f, factor_conversion: Number(e.target.value) }))}
                  title="Ej: 1000 si comprás en Kg y usás en Gramos" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Unidad en receta</label>
              <select className="input" value={form.unidad_medida_receta}
                onChange={e => setForm(f => ({ ...f, unidad_medida_receta: e.target.value as UnidadReceta }))}>
                {UNIDADES_RECETA.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Merma (%)</label>
              <input type="number" min="0" max="100" step="0.5" className="input"
                value={form.merma_porcentaje} onChange={e => setForm(f => ({ ...f, merma_porcentaje: Number(e.target.value) }))} />
            </div>
          </div>

          {/* Preview costo */}
          {form.precio_compra > 0 && form.cantidad_empaque > 0 && form.factor_conversion > 0 && (
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-100">
              <p className="text-xs text-rose-500 font-medium">Costo calculado:</p>
              <p className="text-base font-bold text-rose-700">
                {formatARS(
                  (form.precio_compra / (form.cantidad_empaque * form.factor_conversion))
                  * (1 + form.merma_porcentaje / 100)
                )} / {singularUnit(form.unidad_medida_receta)}
              </p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!form.nombre.trim()} className="btn-primary w-full justify-center mt-1">
            {editing ? 'Guardar cambios' : 'Crear ingrediente'}
          </button>
        </div>
      </Modal>

      <ConfirmDialog open={!!delId} title="Eliminar ingrediente"
        message="¿Eliminar este ingrediente? Se quitará de todas las recetas que lo usen."
        onConfirm={() => delId && handleDelete(delId)}
        onCancel={() => setDelId(null)} />
    </div>
  );
}
