/**
 * Modelo de Datos para Consultorios (Supabase)
 * Tabla: public.consultorio
 * Gestiona consultas de sedes y persistencia del consultorio activo.
 */

import { getSupabase } from '../../services/supabaseClient.js';

const ACTIVE_CONSULTORIO_KEY = 'odk_active_consultorio';

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
  },

  /**
   * Obtiene el consultorio activo seleccionado en el sistema
   */
  getActiveConsultorio() {
    try {
      const raw = localStorage.getItem(ACTIVE_CONSULTORIO_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  /**
   * Establece el consultorio activo y notifica el cambio a todos los módulos
   * @param {Object} consultorio
   */
  setActiveConsultorio(consultorio) {
    if (!consultorio) {
      localStorage.removeItem(ACTIVE_CONSULTORIO_KEY);
    } else {
      localStorage.setItem(ACTIVE_CONSULTORIO_KEY, JSON.stringify(consultorio));
    }

    // Emitir evento para que los componentes y módulos refresquen sus filtros
    window.dispatchEvent(new CustomEvent('consultorio:changed', {
      detail: consultorio
    }));

    return consultorio;
  },

  /**
   * Suscribe una función para escuchar cambios en el consultorio activo
   */
  subscribe(callback) {
    const handler = (e) => callback(e.detail);
    window.addEventListener('consultorio:changed', handler);
    return () => window.removeEventListener('consultorio:changed', handler);
  }
};
