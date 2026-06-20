import { supabase } from '../lib/supabase';
import type { GastoGeneral, GastoForm } from '../types';

export const gastosService = {
  getAll: async (): Promise<GastoGeneral[]> => {
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });
    if (error) throw error;
    return (data ?? []) as GastoGeneral[];
  },

  create: async (form: GastoForm): Promise<GastoGeneral> => {
    const { data, error } = await supabase
      .from('gastos')
      .insert(form)
      .select()
      .single();
    if (error) throw error;
    return data as GastoGeneral;
  },

  update: async (id: string, form: GastoForm): Promise<GastoGeneral> => {
    const { data, error } = await supabase
      .from('gastos')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as GastoGeneral;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('gastos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  /** month es 0-indexed (igual que Date.getMonth()) */
  getDelMes: async (year: number, month: number): Promise<GastoGeneral[]> => {
    const m        = month + 1;
    const firstDay = `${year}-${String(m).padStart(2, '0')}-01`;
    const lastDay  = new Date(year, m, 0).toISOString().split('T')[0]; // último día del mes
    const { data, error } = await supabase
      .from('gastos')
      .select('*')
      .gte('fecha', firstDay)
      .lte('fecha', lastDay);
    if (error) throw error;
    return (data ?? []) as GastoGeneral[];
  },
};
