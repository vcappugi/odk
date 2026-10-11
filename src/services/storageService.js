/**
 * Servicio de Almacenamiento Local
 * Ofrece persistencia local (LocalStorage) como respaldo offline y para modo demo.
 */
import { APP_CONSTANTS } from '../config/constants.js';

const SEED_DATA = [
  {
    id: 'demo-1',
    title: 'Auditoría Móvil ODK',
    description: 'Registro de inspección de terreno recopilado en dispositivo Android.',
    category: 'Campo',
    status: 'Completado',
    priority: 'Alta',
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'demo-2',
    title: 'Sincronización Supabase Cloud',
    description: 'Esquema de datos relacional y políticas RLS configuradas con éxito.',
    category: 'Infraestructura',
    status: 'En Progreso',
    priority: 'Media',
    created_at: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'demo-3',
    title: 'Diseño Responsivo Yeti CSS',
    description: 'Componentes adaptados a pantallas móviles y desktop con tokens Foundation Yeti.',
    category: 'Diseño UI',
    status: 'Completado',
    priority: 'Baja',
    created_at: new Date().toISOString()
  }
];

export const storageService = {
  getRecords() {
    try {
      const data = localStorage.getItem(APP_CONSTANTS.STORAGE_KEYS.LOCAL_RECORDS);
      if (!data) {
        this.saveRecords(SEED_DATA);
        return SEED_DATA;
      }
      return JSON.parse(data);
    } catch {
      return SEED_DATA;
    }
  },

  saveRecords(records) {
    try {
      localStorage.setItem(APP_CONSTANTS.STORAGE_KEYS.LOCAL_RECORDS, JSON.stringify(records));
    } catch (e) {
      console.warn('[StorageService] Error guardando registros locales:', e);
    }
  },

  addRecord(record) {
    const list = this.getRecords();
    const newRecord = {
      id: `local-${Date.now()}`,
      created_at: new Date().toISOString(),
      ...record
    };
    list.unshift(newRecord);
    this.saveRecords(list);
    return newRecord;
  },

  updateRecord(id, updatedFields) {
    const list = this.getRecords();
    const index = list.findIndex(r => r.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedFields };
      this.saveRecords(list);
      return list[index];
    }
    return null;
  },

  deleteRecord(id) {
    let list = this.getRecords();
    list = list.filter(r => r.id !== id);
    this.saveRecords(list);
    return true;
  }
};
