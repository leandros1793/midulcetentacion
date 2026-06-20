import { supabase } from '../../lib/supabase';
import type { GastoGeneral, GastoForm } from '../../types';

const TABLE = 'gastos';

export const gastosService = {
  getAll: async (): Promise<GastoGeneral[]> => {
    const { data, error } = await supabase.from(TABLE).select('*').order('fecha', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  create: async (form: GastoForm): Promise<GastoGeneral> => {
    const { data, error } = await supabase.from(TABLE).insert(form).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, form: GastoForm): Promise<GastoGeneral> => {
    const { data, error } = await supabase.from(TABLE).update(form).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  getDelMes: async (year: number, month: number): Promise<GastoGeneral[]> => {
    const desde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const hasta = `${year}-${String(month + 2).padStart(2, '0')}-01`;
    const { data, error } = await supabase
      .from(TABLE).select('*')
      .gte('fecha', desde).lt('fecha', hasta);
    if (error) throw error;
    return data ?? [];
  },
};
