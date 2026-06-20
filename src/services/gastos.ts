import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { GastoGeneral, GastoForm } from '../types';

const KEY = 'mdt_gastos';

export const gastosService = {
  getAll: (): GastoGeneral[] => storage.getAll<GastoGeneral>(KEY),

  create: (form: GastoForm): GastoGeneral =>
    storage.create<GastoGeneral>(KEY, { ...form, id: uuidv4(), created_at: new Date().toISOString() }),

  update: (id: string, form: GastoForm): GastoGeneral => {
    const existing = storage.getById<GastoGeneral>(KEY, id)!;
    return storage.update<GastoGeneral>(KEY, { ...existing, ...form, id });
  },

  delete: (id: string): void => storage.remove<GastoGeneral>(KEY, id),

  getDelMes: (year: number, month: number): GastoGeneral[] =>
    storage.getAll<GastoGeneral>(KEY).filter(g => {
      // Forzar mediodía local para evitar bugs de timezone (UTC-3 en Argentina)
      const d = new Date(g.fecha + 'T12:00:00');
      return d.getFullYear() === year && d.getMonth() === month;
    }),
};
