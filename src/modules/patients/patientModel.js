/**
 * Modelo de Datos para Pacientes / Clientes (Supabase)
 * Tabla: public.paciente
 */

import { getSupabase } from '../../services/supabaseClient.js';

export const patientModel = {
  /**
   * Obtiene todos los pacientes registrados
   */
  async getAll() {
    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('paciente')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('[PatientModel] Error cargando pacientes:', error);
      throw error;
    }

    return data || [];
  },

  /**
   * Obtiene un paciente por su ID
   */
  async getById(id) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('paciente')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[PatientModel] Error cargando paciente ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Crea un nuevo paciente
   */
  async create(patientData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { data, error } = await supabase
      .from('paciente')
      .insert([patientData])
      .select();

    if (error) {
      console.error('[PatientModel] Error creando paciente:', error);
      throw error;
    }

    return data?.[0];
  },

  /**
   * Modifica un paciente existente
   */
  async update(id, patientData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { data, error } = await supabase
      .from('paciente')
      .update(patientData)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`[PatientModel] Error actualizando paciente ${id}:`, error);
      throw error;
    }

    return data?.[0];
  },

  /**
   * Elimina un paciente por su ID
   */
  async delete(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { error } = await supabase
      .from('paciente')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[PatientModel] Error eliminando paciente ${id}:`, error);
      throw error;
    }

    return true;
  }
};
