import { supabase } from '../../lib/supabase';
import type { Ingrediente, IngredienteForm } from '../../types';

const TABLE = 'ingredientes';

export const ingredientesService = {
  getAll: async (): Promise<Ingrediente[]> => {
    const { data, error } = await supabase.from(TABLE).select('*').order('nombre');
    if (error) throw error;
    return data ?? [];
  },

  getById: async (id: string): Promise<Ingrediente | undefined> => {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  },

  create: async (form: IngredienteForm): Promise<Ingrediente> => {
    const { data, error } = await supabase.from(TABLE).insert(form).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, form: IngredienteForm): Promise<Ingrediente> => {
    const { data, error } = await supabase
      .from(TABLE).update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
  },
};
