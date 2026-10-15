/**
 * Modelo de Datos para Citas Odontológicas (Supabase)
 * Tabla: public.cita
 */

import { getSupabase } from '../../services/supabaseClient.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';

/**
 * Determina de forma robusta si una cita se encuentra en estatus Atendida
 * @param {any} estatus
 * @returns {boolean}
 */
export function isCitaAtendida(estatus) {
  if (estatus === true || estatus === 1 || estatus === '1' || estatus === 't' || estatus === 'true') return true;
  if (typeof estatus === 'string') {
    const s = estatus.trim().toUpperCase();
    return s === 'ATENDIDO' || s === 'ATENDIDA';
  }
  return false;
}

/**
 * Normaliza el valor de estatus a uno de los tres permitidos:
 * "PENDIENTE", "ATENDIDO", "NO ASISTIO"
 * @param {any} estatus
 * @returns {'PENDIENTE'|'ATENDIDO'|'NO ASISTIO'}
 */
export function normalizeCitaEstatus(estatus) {
  if (isCitaAtendida(estatus)) return 'ATENDIDO';
  if (typeof estatus === 'string') {
    const s = estatus.trim().toUpperCase();
    if (s === 'NO ASISTIO' || s === 'NO ASISTIÓ' || s === 'NO_ASISTIO' || s === 'CANCELADA') {
      return 'NO ASISTIO';
    }
  }
  return 'PENDIENTE';
}

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
          estatus,
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
        estatus,
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

    // Verificar si la cita ya está atendida en la base de datos
    const existing = await this.getById(id);
    if (existing && isCitaAtendida(existing.estatus)) {
      throw new Error('La cita ya está en estatus Atendida y no puede ser alterada.');
    }

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

    // Verificar si la cita ya está atendida en la base de datos
    const existing = await this.getById(id);
    if (existing && isCitaAtendida(existing.estatus)) {
      throw new Error('La cita ya está en estatus Atendida y no puede ser eliminada.');
    }

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
