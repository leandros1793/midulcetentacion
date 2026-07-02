import { supabase } from '../lib/supabase';
import type { MenuItem, MenuItemForm } from '../types';

export const menuItemsService = {

  getAll: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MenuItem[];
  },

  getVisibles: async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('visible', true)
      .order('orden', { ascending: true })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as MenuItem[];
  },

  create: async (form: MenuItemForm): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .insert({ ...form, updated_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as MenuItem;
  },

  update: async (id: string, form: Partial<MenuItemForm>): Promise<MenuItem> => {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as MenuItem;
  },

  remove: async (id: string): Promise<void> => {
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
  },

  toggleVisible: async (id: string, currentVisible: boolean): Promise<MenuItem> => {
    return menuItemsService.update(id, { visible: !currentVisible });
  },

  /** Sube una imagen al bucket "menu-items" y devuelve la URL pública */
  uploadImagen: async (file: File): Promise<string> => {
    const ext  = file.name.split('.').pop() ?? 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage
      .from('menu-items')
      .upload(name, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('menu-items').getPublicUrl(name);
    return data.publicUrl;
  },
};
