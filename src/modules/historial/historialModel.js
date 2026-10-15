/**
 * Modelo de Datos para Historial Médico Odontológico
 * Tabla: public.historial_medico (Supabase) con soporte de fallback local
 * 
 * Campos:
 * - id: number/bigint
 * - created_at: timestamptz
 * - paciente_id: number (FK public.paciente)
 * - cita_id: number (FK public.cita, nullable)
 * - doctor_id: number (FK public.doctor, nullable)
 * - fecha: date (YYYY-MM-DD)
 * - motivo_consulta: string
 * - diagnostico: string
 * - tratamiento: string
 * - alergias: string
 * - antecedentes: string
 * - medicamentos: string
 * - observaciones: string
 */

import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';

const LOCAL_STORAGE_KEY = 'odk_historial_medico_cache';

export const historialModel = {
  listeners: [],
  tableAvailableOnSupabase: null, // null = unknown, true = exists, false = fallback local

  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.push(listener);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },

  notify(data) {
    this.listeners.forEach(l => {
      try {
        l(data);
      } catch (e) {
        console.error('[HistorialModel] Error en listener:', e);
      }
    });
  },

  /**
   * Obtiene los registros locales en caso de fallback
   */
  _getLocalRecords() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Guarda registros en el almacenamiento local
   */
  _saveLocalRecords(records) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('[HistorialModel] Error guardando en localStorage:', e);
    }
  },

  /**
   * Obtiene todos los antecedentes e historial médico de un paciente específico
   * @param {number|string} pacienteId
   */
  async getAllByPaciente(pacienteId) {
    if (!pacienteId) return [];

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    // Si Supabase está disponible y no se ha marcado como no existente la tabla
    if (supabase && conn.isLive && this.tableAvailableOnSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('historial_medico')
          .select(`
            id,
            created_at,
            paciente_id,
            cita_id,
            doctor_id,
            fecha,
            motivo_consulta,
            diagnostico,
            tratamiento,
            alergias,
            antecedentes,
            medicamentos,
            observaciones,
            doctor:doctor_id (
              id,
              nombre,
              telefono
            )
          `)
          .eq('paciente_id', pacienteId)
          .order('fecha', { ascending: false })
          .order('id', { ascending: false });

        if (!error && data) {
          this.tableAvailableOnSupabase = true;
          return data;
        }

        // Si el código de error es PGRST205 (tabla no existe en schema cache de Supabase)
        if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
          console.warn('[HistorialModel] La tabla "historial_medico" no existe aún en Supabase. Usando persistencia local y emitiendo aviso.');
          this.tableAvailableOnSupabase = false;
        } else if (error) {
          console.warn('[HistorialModel] Error consultando historial en Supabase:', error.message);
        }
      } catch (err) {
        console.warn('[HistorialModel] Excepción al consultar Supabase:', err);
      }
    }

    // Modo Fallback Local (filtrado por paciente_id)
    const local = this._getLocalRecords();
    const patientRecords = local.filter(r => String(r.paciente_id) === String(pacienteId));
    // Ordenar descendente por fecha
    return patientRecords.sort((a, b) => new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at));
  },

  /**
   * Obtiene la entrada de historia médica asociada a una cita específica
   * o la más relevante/reciente del paciente
   * @param {number|string} citaId
   * @param {number|string} pacienteId
   * @param {string} fecha
   */
  async getByCitaOrPatient(citaId, pacienteId = null, fecha = null) {
    if (!citaId && !pacienteId) return null;

    // 1. Si tenemos pacienteId, obtener registros del paciente
    if (pacienteId) {
      const records = await this.getAllByPaciente(pacienteId);
      if (records && records.length > 0) {
        // Primero buscar coincidencia exacta por cita_id
        if (citaId) {
          const matchCita = records.find(r => r.cita_id && Number(r.cita_id) === Number(citaId));
          if (matchCita) return matchCita;
        }
        // Segundo buscar coincidencia por fecha de la cita
        if (fecha) {
          const matchFecha = records.find(r => r.fecha === fecha);
          if (matchFecha) return matchFecha;
        }
        // Fallback al registro más reciente del paciente
        return records[0];
      }
    }

    // 2. Si no hay pacienteId o no arrojó resultados, pero tenemos citaId
    const supabase = getSupabase();
    if (supabase && citaId && this.tableAvailableOnSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('historial_medico')
          .select('*')
          .eq('cita_id', Number(citaId))
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[HistorialModel] Error buscando por cita_id:', err);
      }
    }

    // Fallback local buscando por cita_id
    if (citaId) {
      const local = this._getLocalRecords();
      return local.find(r => r.cita_id && Number(r.cita_id) === Number(citaId)) || null;
    }

    return null;
  },

  /**
   * Obtiene un registro puntual por su ID
   * @param {number|string} id
   */
  async getById(id) {
    if (!id) return null;

    const supabase = getSupabase();
    if (supabase && this.tableAvailableOnSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('historial_medico')
          .select(`
            id,
            created_at,
            paciente_id,
            cita_id,
            doctor_id,
            fecha,
            motivo_consulta,
            diagnostico,
            tratamiento,
            alergias,
            antecedentes,
            medicamentos,
            observaciones,
            doctor:doctor_id (
              id,
              nombre
            )
          `)
          .eq('id', id)
          .single();

        if (!error && data) return data;
      } catch (err) {
        console.warn('[HistorialModel] Error en getById Supabase:', err);
      }
    }

    const local = this._getLocalRecords();
    return local.find(r => String(r.id) === String(id)) || null;
  },

  /**
   * Crea una nueva entrada en el historial médico
   * @param {Object} recordData
   */
  async create(recordData) {
    const supabase = getSupabase();
    const payload = {
      paciente_id: Number(recordData.paciente_id),
      cita_id: recordData.cita_id ? Number(recordData.cita_id) : null,
      doctor_id: recordData.doctor_id ? Number(recordData.doctor_id) : null,
      fecha: recordData.fecha || new Date().toISOString().split('T')[0],
      motivo_consulta: (recordData.motivo_consulta || '').trim(),
      diagnostico: (recordData.diagnostico || '').trim(),
      tratamiento: (recordData.tratamiento || '').trim(),
      alergias: (recordData.alergias || '').trim(),
      antecedentes: (recordData.antecedentes || '').trim(),
      medicamentos: (recordData.medicamentos || '').trim(),
      observaciones: (recordData.observaciones || '').trim()
    };

    if (supabase && this.tableAvailableOnSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('historial_medico')
          .insert([payload])
          .select();

        if (!error && data && data.length > 0) {
          this.tableAvailableOnSupabase = true;
          this.notify({ type: 'create', record: data[0] });
          return data[0];
        }

        if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
          this.tableAvailableOnSupabase = false;
        }
      } catch (err) {
        console.warn('[HistorialModel] Error creando en Supabase:', err);
      }
    }

    // Fallback Local
    const local = this._getLocalRecords();
    const newRecord = {
      ...payload,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    local.unshift(newRecord);
    this._saveLocalRecords(local);
    this.notify({ type: 'create', record: newRecord });
    return newRecord;
  },

  /**
   * Actualiza una entrada existente
   * @param {number|string} id
   * @param {Object} updates
   */
  async update(id, updates) {
    const supabase = getSupabase();
    const payload = {
      ...(updates.paciente_id !== undefined && { paciente_id: Number(updates.paciente_id) }),
      ...(updates.cita_id !== undefined && { cita_id: updates.cita_id ? Number(updates.cita_id) : null }),
      ...(updates.doctor_id !== undefined && { doctor_id: updates.doctor_id ? Number(updates.doctor_id) : null }),
      ...(updates.fecha !== undefined && { fecha: updates.fecha }),
      ...(updates.motivo_consulta !== undefined && { motivo_consulta: (updates.motivo_consulta || '').trim() }),
      ...(updates.diagnostico !== undefined && { diagnostico: (updates.diagnostico || '').trim() }),
      ...(updates.tratamiento !== undefined && { tratamiento: (updates.tratamiento || '').trim() }),
      ...(updates.alergias !== undefined && { alergias: (updates.alergias || '').trim() }),
      ...(updates.antecedentes !== undefined && { antecedentes: (updates.antecedentes || '').trim() }),
      ...(updates.medicamentos !== undefined && { medicamentos: (updates.medicamentos || '').trim() }),
      ...(updates.observaciones !== undefined && { observaciones: (updates.observaciones || '').trim() })
    };

    if (supabase && this.tableAvailableOnSupabase !== false) {
      try {
        const { data, error } = await supabase
          .from('historial_medico')
          .update(payload)
          .eq('id', id)
          .select();

        if (!error && data && data.length > 0) {
          this.notify({ type: 'update', record: data[0] });
          return data[0];
        }

        if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
          this.tableAvailableOnSupabase = false;
        }
      } catch (err) {
        console.warn('[HistorialModel] Error actualizando en Supabase:', err);
      }
    }

    // Fallback Local
    const local = this._getLocalRecords();
    const index = local.findIndex(r => String(r.id) === String(id));
    if (index !== -1) {
      local[index] = { ...local[index], ...payload, updated_at: new Date().toISOString() };
      this._saveLocalRecords(local);
      this.notify({ type: 'update', record: local[index] });
      return local[index];
    }

    throw new Error('Registro de historial médico no encontrado');
  },

  /**
   * Elimina un registro de historial médico
   * @param {number|string} id
   */
  async delete(id) {
    const supabase = getSupabase();

    if (supabase && this.tableAvailableOnSupabase !== false) {
      try {
        const { error } = await supabase
          .from('historial_medico')
          .delete()
          .eq('id', id);

        if (!error) {
          this.notify({ type: 'delete', id });
          return true;
        }

        if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
          this.tableAvailableOnSupabase = false;
        }
      } catch (err) {
        console.warn('[HistorialModel] Error eliminando en Supabase:', err);
      }
    }

    // Fallback Local
    let local = this._getLocalRecords();
    local = local.filter(r => String(r.id) !== String(id));
    this._saveLocalRecords(local);
    this.notify({ type: 'delete', id });
    return true;
  }
};
