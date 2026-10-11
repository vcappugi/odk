/**
 * Modelo de Datos: Records
 * Gestiona operaciones CRUD en Supabase con soporte para modo offline/demo.
 */
import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';
import { storageService } from '../../services/storageService.js';
import { env } from '../../config/env.js';

export const recordsModel = {
  /**
   * Obtiene todos los registros
   */
  async getAll() {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      try {
        const { data, error } = await supabase
          .from(env.supabaseTable)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { data: data || [], error: null, source: 'supabase' };
      } catch (err) {
        console.warn('[RecordsModel] Error consultando Supabase, usando respaldo local:', err);
        return { data: storageService.getRecords(), error: err.message, source: 'local' };
      }
    }

    // Modo local / demo
    return { data: storageService.getRecords(), error: null, source: 'local' };
  },

  /**
   * Crea un nuevo registro
   */
  async create(recordData) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase) {
      try {
        const payload = {
          title: recordData.title,
          description: recordData.description,
          category: recordData.category || 'General',
          status: recordData.status || 'Pendiente',
          priority: recordData.priority || 'Media',
          created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from(env.supabaseTable)
          .insert([payload])
          .select();

        if (error) throw error;
        return { data: data[0], error: null, source: 'supabase' };
      } catch (err) {
        console.error('[RecordsModel] Error creando en Supabase:', err);
        // Respaldo local
        const localRecord = storageService.addRecord(recordData);
        return { data: localRecord, error: err.message, source: 'local' };
      }
    }

    const localRecord = storageService.addRecord(recordData);
    return { data: localRecord, error: null, source: 'local' };
  },

  /**
   * Actualiza un registro existente
   */
  async update(id, updatedFields) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase && !id.startsWith('demo-') && !id.startsWith('local-')) {
      try {
        const { data, error } = await supabase
          .from(env.supabaseTable)
          .update(updatedFields)
          .eq('id', id)
          .select();

        if (error) throw error;
        return { data: data[0], error: null, source: 'supabase' };
      } catch (err) {
        console.error('[RecordsModel] Error actualizando en Supabase:', err);
        const localRecord = storageService.updateRecord(id, updatedFields);
        return { data: localRecord, error: err.message, source: 'local' };
      }
    }

    const localRecord = storageService.updateRecord(id, updatedFields);
    return { data: localRecord, error: null, source: 'local' };
  },

  /**
   * Elimina un registro
   */
  async delete(id) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (conn.isLive && supabase && !id.startsWith('demo-') && !id.startsWith('local-')) {
      try {
        const { error } = await supabase
          .from(env.supabaseTable)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return { success: true, error: null };
      } catch (err) {
        console.error('[RecordsModel] Error eliminando en Supabase:', err);
        storageService.deleteRecord(id);
        return { success: true, error: err.message };
      }
    }

    storageService.deleteRecord(id);
    return { success: true, error: null };
  }
};
