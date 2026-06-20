import { supabase } from '../lib/supabase';
import type { Ingrediente, IngredienteForm } from '../types';

export const ingredientesService = {
  getAll: async (): Promise<Ingrediente[]> => {
    const { data, error } = await supabase
      .from('ingredientes')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return (data ?? []) as Ingrediente[];
  },

  getById: async (id: string): Promise<Ingrediente | null> => {
    const { data, error } = await supabase
      .from('ingredientes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Ingrediente;
  },

  create: async (form: IngredienteForm): Promise<Ingrediente> => {
    const { data, error } = await supabase
      .from('ingredientes')
      .insert(form)
      .select()
      .single();
    if (error) throw error;
    return data as Ingrediente;
  },

  update: async (id: string, form: IngredienteForm): Promise<Ingrediente> => {
    const { data, error } = await supabase
      .from('ingredientes')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Ingrediente;
  },

  // El cascade DELETE de receta_ingredientes lo maneja el FK ON DELETE CASCADE del schema SQL
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('ingredientes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
