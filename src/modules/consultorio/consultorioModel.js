/**
 * Modelo de Datos para Consultorios (Supabase)
 * Tabla: public.consultorio
 */

import { getSupabase } from '../../services/supabaseClient.js';

export const consultorioModel = {
  /**
   * Obtiene todos los consultorios registrados
   */
  async getAll() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('consultorio')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('[ConsultorioModel] Aviso cargando consultorios:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[ConsultorioModel] Error consultando tabla consultorio:', err);
      return [];
    }
  },

  /**
   * Obtiene un consultorio por su ID
   */
  async getById(id) {
    if (!id) return null;
    const supabase = getSupabase();
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('consultorio')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }
};
