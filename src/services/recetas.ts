import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { Receta, RecetaForm, RecetaIngrediente, RecetaIngredienteForm } from '../types';

const KEY_RECETAS = 'mdt_recetas';
const KEY_RI = 'mdt_receta_ingredientes';

export const recetasService = {
  getAll: (): Receta[] => storage.getAll<Receta>(KEY_RECETAS),

  getById: (id: string): Receta | undefined => storage.getById<Receta>(KEY_RECETAS, id),

  create: (form: RecetaForm): Receta => {
    const now = new Date().toISOString();
    return storage.create<Receta>(KEY_RECETAS, { ...form, id: uuidv4(), created_at: now, updated_at: now });
  },

  update: (id: string, form: RecetaForm): Receta => {
    const existing = storage.getById<Receta>(KEY_RECETAS, id)!;
    return storage.update<Receta>(KEY_RECETAS, { ...existing, ...form, id, updated_at: new Date().toISOString() });
  },

  delete: (id: string): void => {
    storage.remove<Receta>(KEY_RECETAS, id);
    // Cascade delete líneas
    const all = storage.getAll<RecetaIngrediente>(KEY_RI);
    storage.getAll<RecetaIngrediente>(KEY_RI); // reset read
    all.filter(ri => ri.receta_id !== id).forEach(() => {});
    localStorage.setItem(KEY_RI, JSON.stringify(all.filter(ri => ri.receta_id !== id)));
  },

  // Líneas del escandallo
  getLineas: (receta_id: string): RecetaIngrediente[] =>
    storage.getByField<RecetaIngrediente>(KEY_RI, 'receta_id', receta_id),

  addLinea: (receta_id: string, form: RecetaIngredienteForm): RecetaIngrediente =>
    storage.create<RecetaIngrediente>(KEY_RI, { ...form, id: uuidv4(), receta_id }),

  updateLinea: (id: string, form: RecetaIngredienteForm & { receta_id: string }): RecetaIngrediente =>
    storage.update<RecetaIngrediente>(KEY_RI, { ...form, id }),

  deleteLinea: (id: string): void => storage.remove<RecetaIngrediente>(KEY_RI, id),
};
