import { v4 as uuidv4 } from 'uuid';
import * as storage from './storage';
import type { Configuracion } from '../types';

const KEY = 'mdt_configuracion';
const DEFAULT_CONFIG: Configuracion = {
  id: 'singleton',
  valor_hora_trabajo: 500,
  costo_fijo_por_hora: 100,
  nombre_contacto_1: 'Belu',
  whatsapp_numero: '5493512476048',
  nombre_contacto_2: 'Flor',
  whatsapp_numero_2: '5493512217870',
  instagram_usuario: '@midulce_tentacion7',
  instagram_url: 'https://www.instagram.com/midulce_tentacion7/',
  instagram_destacados: [],
  updated_at: new Date().toISOString(),
};

export const configuracionService = {
  get: (): Configuracion => {
    const all = storage.getAll<Configuracion>(KEY);
    if (all.length === 0) {
      storage.create<Configuracion>(KEY, DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    // Fusiona con defaults para que campos nuevos siempre tengan valor
    return { ...DEFAULT_CONFIG, ...all[0] };
  },
  update: (data: Partial<Omit<Configuracion, 'id'>>): Configuracion => {
    const current = configuracionService.get();
    const updated = { ...current, ...data, id: 'singleton', updated_at: new Date().toISOString() };
    return storage.update<Configuracion>(KEY, updated);
  },
};
