import { supabase } from '../lib/supabase';
import type { Configuracion } from '../types';

// Valores por defecto — se fusionan con lo que devuelve Supabase
// para que los campos nuevos siempre tengan un valor inicial.
const DEFAULTS: Omit<Configuracion, 'updated_at'> = {
  id:                   'singleton',
  valor_hora_trabajo:   500,
  costo_fijo_por_hora:  100,
  nombre_contacto_1:    'Belu',
  whatsapp_numero:      '',
  nombre_contacto_2:    'Flor',
  whatsapp_numero_2:    '',
  instagram_usuario:    '',
  instagram_url:        '',
  instagram_destacados: [],
};

export const configuracionService = {
  get: async (): Promise<Configuracion> => {
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
      .eq('id', 'singleton')
      .single();
    if (error) throw error;
    // Fusionamos defaults para que campos nuevos/nulos siempre tengan valor
    return {
      ...DEFAULTS,
      ...data,
      instagram_destacados: data?.instagram_destacados ?? [],
    } as Configuracion;
  },

  update: async (patch: Partial<Omit<Configuracion, 'id'>>): Promise<Configuracion> => {
    const { data, error } = await supabase
      .from('configuracion')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', 'singleton')
      .select()
      .single();
    if (error) throw error;
    return { ...DEFAULTS, ...data, instagram_destacados: data?.instagram_destacados ?? [] } as Configuracion;
  },
};
