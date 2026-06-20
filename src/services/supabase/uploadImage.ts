import { supabase } from '../../lib/supabase';

const BUCKET = 'product-images';

/**
 * Sube un archivo al bucket "product-images" de Supabase Storage
 * y devuelve la URL pública resultante.
 *
 * @param file   - Archivo a subir (del input type="file")
 * @param itemId - ID del producto/receta (se usa como nombre de archivo)
 */
export async function uploadProductImage(file: File, itemId: string): Promise<string> {
  const ext      = file.name.split('.').pop() ?? 'jpg';
  const filePath = `${itemId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
