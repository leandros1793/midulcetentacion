import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { Promocion, PromocionForm } from '../types';

const KEY = 'mdt_promociones';

export const promocionesService = {
  getAll: (): Promocion[] =>
    storage.getAll<Promocion>(KEY).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),

  getActivas: (): Promocion[] =>
    storage.getAll<Promocion>(KEY).filter(p => p.activa),

  create: (data: PromocionForm): Promocion => {
    const item: Promocion = {
      ...data,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };
    return storage.create<Promocion>(KEY, item);
  },

  toggleActiva: (id: string): Promocion | undefined => {
    const item = storage.getById<Promocion>(KEY, id);
    if (!item) return undefined;
    const updated = { ...item, activa: !item.activa };
    return storage.update<Promocion>(KEY, updated);
  },

  update: (id: string, data: Partial<PromocionForm>): Promocion | undefined => {
    const item = storage.getById<Promocion>(KEY, id);
    if (!item) return undefined;
    return storage.update<Promocion>(KEY, { ...item, ...data });
  },

  remove: (id: string): void => storage.remove<Promocion>(KEY, id),
};
