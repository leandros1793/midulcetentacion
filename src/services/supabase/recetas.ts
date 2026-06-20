import { supabase } from '../../lib/supabase';
import type { Receta, RecetaForm, RecetaIngrediente, RecetaIngredienteForm } from '../../types';

const T_RECETAS = 'recetas';
const T_RI      = 'receta_ingredientes';

export const recetasService = {
  getAll: async (): Promise<Receta[]> => {
    const { data, error } = await supabase.from(T_RECETAS).select('*').order('nombre');
    if (error) throw error;
    return data ?? [];
  },

  // Lectura pública del catálogo (visible_en_catalogo = true) — sin auth
  getCatalogo: async (): Promise<Receta[]> => {
    const { data, error } = await supabase
      .from(T_RECETAS).select('*')
      .eq('visible_en_catalogo', true).order('nombre');
    if (error) throw error;
    return data ?? [];
  },

  getById: async (id: string): Promise<Receta | undefined> => {
    const { data, error } = await supabase.from(T_RECETAS).select('*').eq('id', id).single();
    if (error) return undefined;
    return data;
  },

  create: async (form: RecetaForm): Promise<Receta> => {
    const { data, error } = await supabase.from(T_RECETAS).insert(form).select().single();
    if (error) throw error;
    return data;
  },

  update: async (id: string, form: Partial<RecetaForm>): Promise<Receta> => {
    const { data, error } = await supabase
      .from(T_RECETAS).update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    // ON DELETE CASCADE en la DB elimina las líneas automáticamente
    const { error } = await supabase.from(T_RECETAS).delete().eq('id', id);
    if (error) throw error;
  },

  // ── Líneas de cálculo de costos ─────────────────────────────────────────────

  getLineas: async (receta_id: string): Promise<RecetaIngrediente[]> => {
    const { data, error } = await supabase.from(T_RI).select('*').eq('receta_id', receta_id);
    if (error) throw error;
    return data ?? [];
  },

  addLinea: async (receta_id: string, form: RecetaIngredienteForm): Promise<RecetaIngrediente> => {
    const { data, error } = await supabase
      .from(T_RI).insert({ ...form, receta_id }).select().single();
    if (error) throw error;
    return data;
  },

  updateLinea: async (id: string, form: RecetaIngredienteForm & { receta_id: string }): Promise<RecetaIngrediente> => {
    const { data, error } = await supabase.from(T_RI).update(form).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  deleteLinea: async (id: string): Promise<void> => {
    const { error } = await supabase.from(T_RI).delete().eq('id', id);
    if (error) throw error;
  },
};
