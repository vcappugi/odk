/**
 * Modelo de Datos para Citas Odontológicas (Supabase)
 * Tabla: public.cita
 */

import { getSupabase } from '../../services/supabaseClient.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';

export const citaModel = {
  /**
   * Obtiene la lista de citas filtradas por consultorio (opcional)
   * Incluye la relación con paciente y doctor
   * @param {number|null} consultorioId
   */
  async getAll(consultorioId = null) {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      let query = supabase
        .from('cita')
        .select(`
          id,
          created_at,
          fecha,
          hora_desde,
          hora_hasta,
          observacion,
          consultorio_id,
          paciente_id,
          doctor_id,
          paciente:paciente_id (
            id,
            nombre,
            ci,
            telefono,
            mail
          ),
          doctor:doctor_id (
            id,
            nombre,
            telefono
          )
        `);

      const activeSede = consultorioId || consultorioModel.getActiveConsultorio()?.id;
      if (activeSede) {
        // Citas de este consultorio o citas globales sin consultorio asignado
        query = query.or(`consultorio_id.eq.${activeSede},consultorio_id.is.null`);
      }

      query = query
        .order('fecha', { ascending: true })
        .order('hora_desde', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[CitaModel] Error obteniendo citas:', error);
        throw error;
      }

      return data || [];
    } catch (err) {
      console.warn('[CitaModel] Error en getAll:', err);
      return [];
    }
  },

  /**
   * Obtiene una cita por su ID
   * @param {number} id
   */
  async getById(id) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('cita')
      .select(`
        id,
        created_at,
        fecha,
        hora_desde,
        hora_hasta,
        observacion,
        consultorio_id,
        paciente_id,
        doctor_id,
        paciente:paciente_id (
          id,
          nombre,
          ci,
          telefono,
          mail
        ),
        doctor:doctor_id (
          id,
          nombre
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`[CitaModel] Error obteniendo cita ${id}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Crea una nueva cita en Supabase
   * @param {Object} citaData
   */
  async create(citaData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    // Asignar consultorio activo por defecto si no viene especificado
    if (!citaData.consultorio_id) {
      const activeSede = consultorioModel.getActiveConsultorio();
      if (activeSede?.id) {
        citaData.consultorio_id = activeSede.id;
      }
    }

    const { data, error } = await supabase
      .from('cita')
      .insert([citaData])
      .select();

    if (error) {
      console.error('[CitaModel] Error creando cita:', error);
      throw error;
    }

    this.notifyChange();
    return data?.[0];
  },

  /**
   * Actualiza una cita existente
   * @param {number} id
   * @param {Object} citaData
   */
  async update(id, citaData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { data, error } = await supabase
      .from('cita')
      .update(citaData)
      .eq('id', id)
      .select();

    if (error) {
      console.error(`[CitaModel] Error actualizando cita ${id}:`, error);
      throw error;
    }

    this.notifyChange();
    return data?.[0];
  },

  /**
   * Elimina una cita por su ID
   * @param {number} id
   */
  async delete(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { error } = await supabase
      .from('cita')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`[CitaModel] Error eliminando cita ${id}:`, error);
      throw error;
    }

    this.notifyChange();
    return true;
  },

  /**
   * Suscribe a cambios reactivos de citas
   */
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener('cita:changed', handler);
    return () => window.removeEventListener('cita:changed', handler);
  },

  /**
   * Notifica cambio en las citas
   */
  notifyChange() {
    window.dispatchEvent(new CustomEvent('cita:changed'));
  }
};
