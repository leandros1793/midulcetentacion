import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { Configuracion } from '../types';

const KEY = 'mdt_configuracion';
const DEFAULT_CONFIG: Configuracion = {
  id: 'singleton',
  valor_hora_trabajo: 500,
  costo_fijo_por_hora: 100,
  updated_at: new Date().toISOString(),
};

export const configuracionService = {
  get: (): Configuracion => {
    const all = storage.getAll<Configuracion>(KEY);
    if (all.length === 0) {
      storage.create<Configuracion>(KEY, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    return all[0];
  },
  update: (data: Partial<Omit<Configuracion, 'id'>>): Configuracion => {
    const current = configuracionService.get();
    const updated = { ...current, ...data, id: 'singleton', updated_at: new Date().toISOString() };
    return storage.update<Configuracion>(KEY, updated);
  },
};
