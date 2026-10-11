/**
 * Modelo de Datos para Odontograma Clínico
 * Tabla: public.detalle_odontograma (Supabase) con fallback local
 * 
 * Esquema de detalle_odontograma:
 * - id: bigint
 * - created_at: timestamptz
 * - historial_id: bigint (FK a historial_medico.id)
 * - numero_pieza: integer (FDI: 11-48 adultos, 51-85 niños)
 * - caras_afectadas: text (ej. 'O', 'M,D', 'V,O,P')
 * - estado_inicial: text (Caries, Obturado, Ausente, Corona, Endodoncia, Implante, Fractura, Sellante, Sano)
 * - tratamiento: text (Resina, Amalgama, Exodoncia, Conductometría, etc.)
 * - observacion: text
 */

import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';
import { historialModel } from '../historial/historialModel.js';

const LOCAL_STORAGE_ODONTOGRAMA_KEY = 'odk_detalle_odontograma_cache';

export const odontogramaModel = {
  listeners: [],

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
        console.error('[OdontogramaModel] Error en listener:', e);
      }
    });
  },

  _getLocalRecords() {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_ODONTOGRAMA_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  _saveLocalRecords(records) {
    try {
      localStorage.setItem(LOCAL_STORAGE_ODONTOGRAMA_KEY, JSON.stringify(records));
    } catch (e) {
      console.warn('[OdontogramaModel] Error guardando cache local:', e);
    }
  },

  /**
   * Obtiene todos los detalles del odontograma activo de un paciente
   * Retorna un mapa indexado por numero_pieza
   * @param {number|string} pacienteId
   * @returns {Promise<Object>} Map { [numero_pieza]: toothRecord }
   */
  async getOdontogramaByPaciente(pacienteId) {
    if (!pacienteId) return {};

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    // 1. Intentar consultar en Supabase con enlace a historial_medico
    if (supabase && conn.isLive) {
      try {
        // Obtenemos todos los registros del historial médico de este paciente
        const { data: historiales, error: histError } = await supabase
          .from('historial_medico')
          .select('id')
          .eq('paciente_id', pacienteId);

        if (!histError && historiales && historiales.length > 0) {
          const historialIds = historiales.map(h => h.id);

          const { data: detalles, error: detError } = await supabase
            .from('detalle_odontograma')
            .select('*')
            .in('historial_id', historialIds)
            .order('id', { ascending: true });

          if (!detError && detalles) {
            // Un solo registro activo por diente (el último registrado para cada numero_pieza)
            const toothMap = {};
            detalles.forEach(d => {
              if (d.numero_pieza) {
                toothMap[d.numero_pieza] = d;
              }
            });
            return toothMap;
          }
        }
      } catch (err) {
        console.warn('[OdontogramaModel] Excepción consultando Supabase:', err);
      }
    }

    // 2. Fallback Local en localStorage
    const local = this._getLocalRecords();
    const patientRecords = local.filter(r => String(r.paciente_id) === String(pacienteId));
    const toothMap = {};
    patientRecords.forEach(d => {
      if (d.numero_pieza) {
        toothMap[d.numero_pieza] = d;
      }
    });
    return toothMap;
  },

  /**
   * Guarda o actualiza el estado de una pieza dental en el odontograma del paciente,
   * y genera AUTOMÁTICAMENTE una entrada en historial_medico según la regla de negocio.
   * 
   * @param {number|string} pacienteId
   * @param {Object} toothData { numero_pieza, caras_afectadas, estado_inicial, tratamiento, observacion }
   * @param {Object} options { doctorId, citaId }
   * @returns {Promise<Object>} { tooth: Object, historialEntry: Object }
   */
  async saveTooth(pacienteId, toothData, options = {}) {
    if (!pacienteId || !toothData.numero_pieza) {
      throw new Error('Paciente y número de pieza dental requeridos');
    }

    const piezaNum = Number(toothData.numero_pieza);
    const caras = (toothData.caras_afectadas || '').trim();
    const estado = (toothData.estado_inicial || 'Sano').trim();
    const tratamiento = (toothData.tratamiento || '').trim();
    const observacion = (toothData.observacion || '').trim();

    // 1. REGLA OBLIGATORIA: Registrar como entrada en historial_medico
    const carasDesc = caras ? ` (Caras: ${caras})` : '';
    const diagDesc = estado === 'Sano' 
      ? `Pieza #${piezaNum}: Evaluada clínicamente y registrada como Sana`
      : `Pieza #${piezaNum}${carasDesc}: Diagnóstico: ${estado}`;
    
    const tratDesc = tratamiento 
      ? `Procedimiento: ${tratamiento}`
      : (estado === 'Sano' ? 'Saneamiento y control profiláctico' : 'Tratamiento indicado según odontograma');

    let historialEntry = null;
    try {
      historialEntry = await historialModel.create({
        paciente_id: pacienteId,
        doctor_id: options.doctorId || null,
        cita_id: options.citaId || null,
        fecha: new Date().toISOString().split('T')[0],
        motivo_consulta: `Actualización de Odontograma - Pieza #${piezaNum}`,
        diagnostico: diagDesc,
        tratamiento: tratDesc,
        observaciones: observacion ? `Nota Odontograma: ${observacion}` : 'Registro generado automáticamente desde el Odontograma Gráfico'
      });
    } catch (e) {
      console.warn('[OdontogramaModel] Error registrando en historial_medico, continuando con fallback:', e);
      historialEntry = { id: Date.now(), paciente_id: pacienteId };
    }

    const historialId = historialEntry?.id || 1;

    // 2. Persistir en detalle_odontograma (Supabase)
    const supabase = getSupabase();
    let savedTooth = null;

    if (supabase) {
      try {
        // Verificar si ya existe un registro para esta pieza dental en este paciente
        const currentMap = await this.getOdontogramaByPaciente(pacienteId);
        const existingRecord = currentMap[piezaNum];

        const payload = {
          historial_id: historialId,
          numero_pieza: piezaNum,
          caras_afectadas: caras,
          estado_inicial: estado,
          tratamiento: tratamiento,
          observacion: observacion
        };

        if (existingRecord && existingRecord.id) {
          // Actualizar registro existente
          const { data, error } = await supabase
            .from('detalle_odontograma')
            .update(payload)
            .eq('id', existingRecord.id)
            .select();

          if (!error && data && data.length > 0) {
            savedTooth = data[0];
          }
        } else {
          // Insertar nuevo registro
          const { data, error } = await supabase
            .from('detalle_odontograma')
            .insert([payload])
            .select();

          if (!error && data && data.length > 0) {
            savedTooth = data[0];
          }
        }
      } catch (err) {
        console.warn('[OdontogramaModel] Error guardando detalle_odontograma en Supabase:', err);
      }
    }

    // 3. Fallback Local en localStorage
    const local = this._getLocalRecords();
    const existingIndex = local.findIndex(
      r => String(r.paciente_id) === String(pacienteId) && Number(r.numero_pieza) === piezaNum
    );

    const localPayload = {
      id: savedTooth?.id || Date.now(),
      paciente_id: Number(pacienteId),
      historial_id: historialId,
      numero_pieza: piezaNum,
      caras_afectadas: caras,
      estado_inicial: estado,
      tratamiento: tratamiento,
      observacion: observacion,
      updated_at: new Date().toISOString()
    };

    if (existingIndex !== -1) {
      local[existingIndex] = { ...local[existingIndex], ...localPayload };
    } else {
      local.push(localPayload);
    }
    this._saveLocalRecords(local);

    if (!savedTooth) {
      savedTooth = localPayload;
    }

    // Notificar cambio
    this.notify({
      type: 'tooth_saved',
      pacienteId,
      tooth: savedTooth,
      historialEntry
    });

    return { tooth: savedTooth, historialEntry };
  },

  /**
   * Limpia o restablece una pieza dental como Sana en el odontograma
   * @param {number|string} pacienteId
   * @param {number} numeroPieza
   * @param {Object} options
   */
  async clearTooth(pacienteId, numeroPieza, options = {}) {
    return await this.saveTooth(pacienteId, {
      numero_pieza: numeroPieza,
      caras_afectadas: '',
      estado_inicial: 'Sano',
      tratamiento: 'Pieza evaluada como sana / restaurada satisfactoriamente',
      observacion: 'Restablecida a estado normal en odontograma'
    }, options);
  }
};
