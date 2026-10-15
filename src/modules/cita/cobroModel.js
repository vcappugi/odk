/**
 * Modelo de Datos para Cobro de Citas (Supabase)
 * Tabla: public.cobro_cita
 */

import { getSupabase } from '../../services/supabaseClient.js';

export const cobroModel = {
  /**
   * Obtiene todos los cobros asociados a una cita específica
   * @param {number|string} citaId
   */
  async getAllByCitaId(citaId) {
    const supabase = getSupabase();
    if (!supabase || !citaId) return [];

    try {
      const { data, error } = await supabase
        .from('cobro_cita')
        .select('*')
        .eq('cita_id', Number(citaId))
        .order('id', { ascending: true });

      if (error) {
        console.warn('[CobroModel] Error obteniendo cobros para cita:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.warn('[CobroModel] Excepción en getAllByCitaId:', err);
      return [];
    }
  },

  /**
   * Obtiene el cobro asociado a una cita específica
   * @param {number|string} citaId
   */
  async getByCitaId(citaId) {
    const supabase = getSupabase();
    if (!supabase || !citaId) return null;

    try {
      const { data, error } = await supabase
        .from('cobro_cita')
        .select('*')
        .eq('cita_id', Number(citaId))
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('[CobroModel] Error obteniendo cobro para cita:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.warn('[CobroModel] Excepción en getByCitaId:', err);
      return null;
    }
  },

  /**
   * Registra un nuevo cobro para una cita
   * @param {Object} cobroData { cita_id, monto_cobrado, tasa_cambio, fecha_pago, referencia, confirmado }
   */
  async create(cobroData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const payload = {
      cita_id: Number(cobroData.cita_id),
      monto_cobrado: Number(cobroData.monto_cobrado),
      tasa_cambio: Number(cobroData.tasa_cambio),
      fecha_pago: cobroData.fecha_pago,
      metodo_pago: cobroData.metodo_pago ? String(cobroData.metodo_pago).trim() : 'Efectivo Divisas',
      referencia: cobroData.referencia ? String(cobroData.referencia).trim() : null,
      confirmado: cobroData.confirmado !== undefined ? Boolean(cobroData.confirmado) : true
    };

    const { data, error } = await supabase
      .from('cobro_cita')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[CobroModel] Error creando cobro:', error);
      throw error;
    }

    this.notifyChange(payload.cita_id);
    return data;
  },

  /**
   * Actualiza un cobro existente
   * @param {number|string} id
   * @param {Object} cobroData
   */
  async update(id, cobroData) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const payload = {};
    if (cobroData.monto_cobrado !== undefined) payload.monto_cobrado = Number(cobroData.monto_cobrado);
    if (cobroData.tasa_cambio !== undefined) payload.tasa_cambio = Number(cobroData.tasa_cambio);
    if (cobroData.fecha_pago !== undefined) payload.fecha_pago = cobroData.fecha_pago;
    if (cobroData.metodo_pago !== undefined) payload.metodo_pago = cobroData.metodo_pago ? String(cobroData.metodo_pago).trim() : 'Efectivo Divisas';
    if (cobroData.referencia !== undefined) payload.referencia = cobroData.referencia ? String(cobroData.referencia).trim() : null;
    if (cobroData.confirmado !== undefined) payload.confirmado = Boolean(cobroData.confirmado);

    const { data, error } = await supabase
      .from('cobro_cita')
      .update(payload)
      .eq('id', Number(id))
      .select()
      .single();

    if (error) {
      console.error('[CobroModel] Error actualizando cobro:', error);
      throw error;
    }

    this.notifyChange(cobroData.cita_id || data?.cita_id);
    return data;
  },

  /**
   * Elimina un cobro existente
   * @param {number|string} id
   * @param {number|string|null} citaId
   */
  async delete(id, citaId = null) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible');

    const { error } = await supabase
      .from('cobro_cita')
      .delete()
      .eq('id', Number(id));

    if (error) {
      console.error('[CobroModel] Error eliminando cobro:', error);
      throw error;
    }

    if (citaId) {
      this.notifyChange(citaId);
    }
    return true;
  },

  /**
   * Emite evento de cobro actualizado
   * @param {number|string} citaId
   */
  notifyChange(citaId) {
    window.dispatchEvent(new CustomEvent('cobro:changed', { detail: { citaId } }));
  }
};
