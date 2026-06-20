import { supabase } from '../lib/supabase';
import type { Receta, RecetaForm, RecetaIngrediente, RecetaIngredienteForm } from '../types';

export const recetasService = {
  getAll: async (): Promise<Receta[]> => {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .order('nombre');
    if (error) throw error;
    return (data ?? []) as Receta[];
  },

  getById: async (id: string): Promise<Receta | null> => {
    const { data, error } = await supabase
      .from('recetas')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Receta;
  },

  create: async (form: RecetaForm): Promise<Receta> => {
    const { data, error } = await supabase
      .from('recetas')
      .insert(form)
      .select()
      .single();
    if (error) throw error;
    return data as Receta;
  },

  update: async (id: string, form: Partial<RecetaForm>): Promise<Receta> => {
    const { data, error } = await supabase
      .from('recetas')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Receta;
  },

  // El cascade DELETE de receta_ingredientes lo maneja el FK ON DELETE CASCADE del schema SQL
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('recetas')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // ── Líneas del escandallo ────────────────────────────────────────────────────

  getLineas: async (receta_id: string): Promise<RecetaIngrediente[]> => {
    const { data, error } = await supabase
      .from('receta_ingredientes')
      .select('*')
      .eq('receta_id', receta_id);
    if (error) throw error;
    return (data ?? []) as RecetaIngrediente[];
  },

  /** Trae TODAS las líneas de todas las recetas (para el Dashboard sin N+1) */
  getAllLineas: async (): Promise<RecetaIngrediente[]> => {
    const { data, error } = await supabase
      .from('receta_ingredientes')
      .select('*');
    if (error) throw error;
    return (data ?? []) as RecetaIngrediente[];
  },

  addLinea: async (receta_id: string, form: RecetaIngredienteForm): Promise<RecetaIngrediente> => {
    const { data, error } = await supabase
      .from('receta_ingredientes')
      .insert({ ...form, receta_id })
      .select()
      .single();
    if (error) throw error;
    return data as RecetaIngrediente;
  },

  updateLinea: async (id: string, form: RecetaIngredienteForm & { receta_id: string }): Promise<RecetaIngrediente> => {
    const { data, error } = await supabase
      .from('receta_ingredientes')
      .update({ cantidad_usada: form.cantidad_usada })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as RecetaIngrediente;
  },

  deleteLinea: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('receta_ingredientes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
