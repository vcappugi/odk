/**
 * Modelo de Tasa de Cambio (tasa_cambio)
 * Administra las operaciones CRUD para el registro histórico de tasas de cambio USD oficial.
 */

import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';

const TASA_STORAGE_KEY = 'odk_tasa_cambio_cache';

export const tasaCambioModel = {
  /**
   * Obtiene la lista completa de tasas registradas, ordenadas de más reciente a más antigua
   * @returns {Promise<Array>}
   */
  async getAll() {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasa_cambio')
          .select('*')
          .order('fecha', { ascending: false })
          .order('id', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Actualizar caché local
          try {
            localStorage.setItem(TASA_STORAGE_KEY, JSON.stringify(data));
          } catch {
            // Silencioso si storage no está disponible
          }
          return data;
        }

        console.warn('[tasaCambioModel] Error al consultar tasa_cambio en Supabase:', error?.message);
      } catch (err) {
        console.warn('[tasaCambioModel] Excepción al consultar tasas:', err);
      }
    }

    // Fallback a caché local o array vacío
    try {
      const cached = localStorage.getItem(TASA_STORAGE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  },

  /**
   * Obtiene la tasa de cambio más reciente
   * @returns {Promise<Object|null>}
   */
  async getLatest() {
    const all = await this.getAll();
    return all && all.length > 0 ? all[0] : null;
  },

  /**
   * Obtiene un registro por su ID
   * @param {number|string} id 
   * @returns {Promise<Object|null>}
   */
  async getById(id) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      try {
        const { data, error } = await supabase
          .from('tasa_cambio')
          .select('*')
          .eq('id', Number(id))
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[tasaCambioModel] Error al consultar por ID:', err);
      }
    }

    const all = await this.getAll();
    return all.find(item => Number(item.id) === Number(id)) || null;
  },

  /**
   * Registra una nueva tasa de cambio
   * @param {{ fecha: string, valorUSD: number|string }} data 
   * @returns {Promise<Object>}
   */
  async create({ fecha, valorUSD }) {
    if (!fecha || valorUSD === undefined || valorUSD === null || valorUSD === '') {
      throw new Error('La fecha y el valor del dólar en USD son obligatorios.');
    }

    const numericVal = parseFloat(String(valorUSD).replace(',', '.'));
    if (isNaN(numericVal) || numericVal <= 0) {
      throw new Error('El valor de la tasa debe ser un número positivo.');
    }

    const payload = {
      fecha: String(fecha).trim(),
      valorUSD: numericVal,
      created_at: new Date().toISOString()
    };

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      const { data, error } = await supabase
        .from('tasa_cambio')
        .insert([payload])
        .select()
        .single();

      if (error) {
        throw new Error(`Error en Supabase al registrar tasa: ${error.message}`);
      }
      return data;
    }

    // Modo local / fallback
    const localItem = {
      id: Date.now(),
      ...payload
    };
    const cached = await this.getAll();
    cached.unshift(localItem);
    try {
      localStorage.setItem(TASA_STORAGE_KEY, JSON.stringify(cached));
    } catch {}
    return localItem;
  },

  /**
   * Actualiza un registro existente de tasa de cambio
   * @param {number|string} id 
   * @param {{ fecha: string, valorUSD: number|string }} data 
   * @returns {Promise<Object>}
   */
  async update(id, { fecha, valorUSD }) {
    if (!id) throw new Error('ID de la tasa es requerido para actualizar.');
    if (!fecha || valorUSD === undefined || valorUSD === null || valorUSD === '') {
      throw new Error('La fecha y el valor del dólar en USD son obligatorios.');
    }

    const numericVal = parseFloat(String(valorUSD).replace(',', '.'));
    if (isNaN(numericVal) || numericVal <= 0) {
      throw new Error('El valor de la tasa debe ser un número positivo.');
    }

    const payload = {
      fecha: String(fecha).trim(),
      valorUSD: numericVal
    };

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      const { data, error } = await supabase
        .from('tasa_cambio')
        .update(payload)
        .eq('id', Number(id))
        .select()
        .single();

      if (error) {
        throw new Error(`Error en Supabase al actualizar tasa: ${error.message}`);
      }
      return data;
    }

    // Modo local / fallback
    const cached = await this.getAll();
    const index = cached.findIndex(item => Number(item.id) === Number(id));
    if (index !== -1) {
      cached[index] = { ...cached[index], ...payload };
      try {
        localStorage.setItem(TASA_STORAGE_KEY, JSON.stringify(cached));
      } catch {}
      return cached[index];
    }
    throw new Error('Registro no encontrado para actualizar.');
  },

  /**
   * Elimina un registro de tasa de cambio
   * @param {number|string} id 
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    if (!id) throw new Error('ID requerido para eliminar tasa de cambio.');

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      const { error } = await supabase
        .from('tasa_cambio')
        .delete()
        .eq('id', Number(id));

      if (error) {
        throw new Error(`Error en Supabase al eliminar tasa: ${error.message}`);
      }
      return true;
    }

    // Modo local / fallback
    const cached = await this.getAll();
    const filtered = cached.filter(item => Number(item.id) !== Number(id));
    try {
      localStorage.setItem(TASA_STORAGE_KEY, JSON.stringify(filtered));
    } catch {}
    return true;
  }
};
