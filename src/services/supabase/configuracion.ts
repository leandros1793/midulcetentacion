import { supabase } from '../../lib/supabase';
import type { Configuracion } from '../../types';

const TABLE = 'configuracion';
const SINGLETON_ID = 'singleton';

const DEFAULT: Omit<Configuracion, 'updated_at'> = {
  id: SINGLETON_ID,
  valor_hora_trabajo: 500,
  costo_fijo_por_hora: 100,
  whatsapp_numero: '',
};

export const configuracionService = {
  get: async (): Promise<Configuracion> => {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', SINGLETON_ID).single();
    if (error || !data) {
      // Crear el registro singleton si no existe
      const { data: created } = await supabase
        .from(TABLE).insert({ ...DEFAULT, updated_at: new Date().toISOString() }).select().single();
      return created ?? { ...DEFAULT, updated_at: new Date().toISOString() };
    }
    return data;
  },

  update: async (values: Partial<Omit<Configuracion, 'id'>>): Promise<Configuracion> => {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert({ id: SINGLETON_ID, ...values, updated_at: new Date().toISOString() })
      .select().single();
    if (error) throw error;
    return data;
  },
};
