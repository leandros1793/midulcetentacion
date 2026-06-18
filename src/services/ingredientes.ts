import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { Ingrediente, IngredienteForm } from '../types';

const KEY = 'mdt_ingredientes';

export const ingredientesService = {
  getAll: (): Ingrediente[] => storage.getAll<Ingrediente>(KEY),

  getById: (id: string): Ingrediente | undefined => storage.getById<Ingrediente>(KEY, id),

  create: (form: IngredienteForm): Ingrediente => {
    const now = new Date().toISOString();
    return storage.create<Ingrediente>(KEY, { ...form, id: uuidv4(), created_at: now, updated_at: now });
  },

  update: (id: string, form: IngredienteForm): Ingrediente => {
    const existing = storage.getById<Ingrediente>(KEY, id)!;
    return storage.update<Ingrediente>(KEY, { ...existing, ...form, id, updated_at: new Date().toISOString() });
  },

  delete: (id: string): void => storage.remove<Ingrediente>(KEY, id),
};
