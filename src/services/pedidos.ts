import { supabase } from '../lib/supabase';
import type { Pedido, PedidoForm, PedidoLinea, PedidoLineaForm } from '../types';

export const pedidosService = {

  getAll: async (): Promise<Pedido[]> => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('fecha_entrega', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Pedido[];
  },

  /** Pedidos de un mes específico (año + mes en base 0) */
  getDelMes: async (year: number, month: number): Promise<Pedido[]> => {
    const desde = new Date(year, month, 1).toISOString().slice(0, 10);
    const hasta = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .gte('fecha_entrega', desde)
      .lte('fecha_entrega', hasta)
      .order('fecha_entrega', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Pedido[];
  },

  create: async (form: PedidoForm): Promise<Pedido> => {
    const { data, error } = await supabase
      .from('pedidos')
      .insert(form)
      .select()
      .single();
    if (error) throw error;
    return data as Pedido;
  },

  update: async (id: string, form: Partial<PedidoForm>): Promise<Pedido> => {
    const { data, error } = await supabase
      .from('pedidos')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pedido;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    if (error) throw error;
  },

  // ── Líneas ────────────────────────────────────────────────────────────────

  getLineas: async (pedido_id: string): Promise<PedidoLinea[]> => {
    const { data, error } = await supabase
      .from('pedido_lineas')
      .select('*')
      .eq('pedido_id', pedido_id)
      .order('created_at');
    if (error) throw error;
    return (data ?? []) as PedidoLinea[];
  },

  /** Todas las líneas de todos los pedidos — para el reporte sin N+1 */
  getAllLineas: async (): Promise<PedidoLinea[]> => {
    const { data, error } = await supabase.from('pedido_lineas').select('*');
    if (error) throw error;
    return (data ?? []) as PedidoLinea[];
  },

  addLinea: async (pedido_id: string, form: PedidoLineaForm): Promise<PedidoLinea> => {
    const { data, error } = await supabase
      .from('pedido_lineas')
      .insert({ ...form, pedido_id })
      .select()
      .single();
    if (error) throw error;
    return data as PedidoLinea;
  },

  updateLinea: async (id: string, form: PedidoLineaForm): Promise<PedidoLinea> => {
    const { data, error } = await supabase
      .from('pedido_lineas')
      .update(form)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as PedidoLinea;
  },

  deleteLinea: async (id: string): Promise<void> => {
    const { error } = await supabase.from('pedido_lineas').delete().eq('id', id);
    if (error) throw error;
  },
};
