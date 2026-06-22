import { supabase } from '../lib/supabase';
import type { Promocion, PromocionForm } from '../types';

export const promocionesService = {
  getAll: async (): Promise<Promocion[]> => {
    const { data, error } = await supabase
      .from('promociones')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Promocion[];
  },

  getActivas: async (): Promise<Promocion[]> => {
    const { data, error } = await supabase
      .from('promociones')
      .select('*')
      .eq('activa', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Promocion[];
  },

  create: async (form: PromocionForm): Promise<Promocion> => {
    const { data, error } = await supabase
      .from('promociones')
      .insert(form)
      .select()
      .single();
    if (error) throw error;
    return data as Promocion;
  },

  // Recibe el valor actual de `activa` para invertirlo sin un fetch previo
  toggleActiva: async (id: string, activa: boolean): Promise<Promocion> => {
    const { data, error } = await supabase
      .from('promociones')
      .update({ activa: !activa })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Promocion;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('promociones')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
