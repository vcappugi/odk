/**
 * Modelo de Datos para Pacientes / Clientes (Supabase)
 * Tabla: public.paciente
 */

import { getSupabase } from '../../services/supabaseClient.js';

export const patientModel = {
  /**
   * Obtiene los pacientes registrados (filtrados opcionalmente por consultorio)
   * @param {number|null} consultorioId
   */
  async getAll(consultorioId = null) {
    const supabase = getSupabase();
    if (!supabase) return [];

    let query = supabase.from('paciente').select('*');

    if (consultorioId) {
      // Filtra por el consultorio_id asignado o pacientes generales pendientes de asignación
      query = query.or(`consultorio_id.eq.${consultorioId},consultorio_id.is.null`);
    }

    const { data, error } = await query.order('id', { ascending: false });

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

    const created = data?.[0];
    if (created) {
      window.dispatchEvent(new CustomEvent('patient:saved', { detail: created }));
    }

    return created;
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

    const updated = data?.[0];
    if (updated) {
      window.dispatchEvent(new CustomEvent('patient:saved', { detail: updated }));
    }

    return updated;
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
