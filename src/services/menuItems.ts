import { supabase } from '../lib/supabase';
import type { MenuItem, MenuItemForm } from '../types';

/**
 * Comprime una imagen en el browser usando Canvas API.
 * - Redimensiona a max 1200px manteniendo proporciones (no agranda).
 * - Exporta en WebP quality 0.82. Fallback JPEG si el browser no soporta WebP.
 * - Sin dependencias externas (equivalente browser de sharp).
 */
function compressImage(file: File, maxPx = 1200, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calcular nuevas dimensiones — nunca agranda
      const ratio  = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const width  = Math.round(img.width  * ratio);
      const height = Math.round(img.height * ratio);

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);

      // Intenta WebP primero (Chrome/Firefox/Safari 14+), fallback a JPEG
      canvas.toBlob(
        blob => {
          if (blob) { resolve(blob); return; }
          // Fallback: browser no soporta WebP export
          canvas.toBlob(
            b => b ? resolve(b) : reject(new Error('compressImage: canvas.toBlob falló')),
            'image/jpeg',
            quality,
          );
        },
        'image/webp',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('compressImage: no se pudo cargar la imagen'));
    };

    img.src = url;
  });
}

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

  /**
   * Comprime la imagen client-side (Canvas WebP) y la sube al bucket "menu-items".
   * - Reduce fotos de 4MB+ a ~150-400KB sin pérdida visual perceptible.
   * - cacheControl 1 año: Cloudflare CDN sirve sin re-validar (cada upload
   *   genera un nombre único por timestamp, así que no hay problema de stale cache).
   */
  uploadImagen: async (file: File): Promise<string> => {
    // Comprimir antes de subir
    const compressed = await compressImage(file);
    const ext  = compressed.type === 'image/webp' ? 'webp' : 'jpg';
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from('menu-items')
      .upload(name, compressed, {
        upsert:       true,
        contentType:  compressed.type,
        cacheControl: '31536000', // 1 ano — CDN cachea sin re-validar
      });
    if (error) throw error;

    const { data } = supabase.storage.from('menu-items').getPublicUrl(name);
    return data.publicUrl;
  },
};
