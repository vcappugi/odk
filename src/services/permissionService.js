/**
 * Servicio Central de Permisos (Permission Service)
 * Gestiona la carga, verificación y aplicación visual de permisos según la tabla 'roles_permision' y 'objetos'.
 * Sincroniza permisos en el login del usuario y mantiene coherencia en tiempo real.
 */

import { getSupabase } from './supabaseClient.js';
import { authModel } from '../modules/auth/authModel.js';
import { $$, $ } from '../utils/dom.js';

const PERMISSIONS_STORAGE_KEY = 'odk_user_permissions';

class PermissionService {
  constructor() {
    this.permissions = {}; // Diccionario indexado por id_vista: { objeto_id, id_vista, nombre, leer, escribir, activo }
    this.isLoaded = false;
  }

  /**
   * Inicializa el servicio cargando permisos almacenados o consultando Supabase
   */
  async init() {
    const stored = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (stored) {
      try {
        this.permissions = JSON.parse(stored);
        this.isLoaded = true;
      } catch {
        this.permissions = {};
      }
    }

    const currentUser = authModel.getCurrentUser();
    if (currentUser && currentUser.id) {
      await this.loadPermissionsForUser(currentUser.id, currentUser.role_id);
    }
  }

  /**
   * Carga los permisos asignados al rol del usuario desde la tabla 'roles_permision' de Supabase
   * @param {number|string} userId 
   * @param {number|string|null} roleId 
   */
  async loadPermissionsForUser(userId, roleId = null) {
    const supabase = getSupabase();
    let targetRoleId = roleId ? Number(roleId) : null;

    // 1. Si no se especificó roleId, buscarlo en 'user_roles'
    if (!targetRoleId && supabase && userId) {
      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role_id, activo, roles ( id, nombre )')
          .eq('user_id', userId)
          .eq('activo', true)
          .limit(1);

        if (userRoles && userRoles.length > 0) {
          targetRoleId = userRoles[0].role_id;
        }
      } catch (err) {
        console.warn('[PermissionService] Error consultando user_roles:', err);
      }
    }

    // Si aún no se tiene roleId, verificar rol en usuario
    const currentUser = authModel.getCurrentUser();
    const isAdmin = Boolean(currentUser?.isAdmin || currentUser?.rol === 'admin' || targetRoleId === 1);
    if (!targetRoleId) {
      targetRoleId = isAdmin ? 1 : 2;
    }

    // 2. Obtener lista de todos los objetos registrados en la tabla 'objetos'
    let objetos = [];
    if (supabase) {
      try {
        const { data: objsData, error: objsErr } = await supabase
          .from('objetos')
          .select('*')
          .order('id', { ascending: true });

        if (!objsErr && objsData) {
          objetos = objsData;
        }
      } catch (err) {
        console.warn('[PermissionService] Error consultando tabla objetos:', err);
      }
    }

    // 3. Obtener permisos del rol desde 'roles_permision'
    let permsData = [];
    if (supabase && targetRoleId) {
      try {
        const { data: pData, error: pErr } = await supabase
          .from('roles_permision')
          .select('*')
          .eq('rol_id', targetRoleId);

        if (!pErr && pData) {
          permsData = pData;
        }
      } catch (err) {
        console.warn('[PermissionService] Error consultando tabla roles_permision:', err);
      }
    }

    // 4. Mapear permisos por id_vista
    const mapped = {};
    if (objetos.length > 0) {
      objetos.forEach(obj => {
        const record = permsData.find(p => p.objeto_id === obj.id);
        if (record) {
          mapped[obj.id_vista] = {
            objeto_id: obj.id,
            id_vista: obj.id_vista,
            nombre: obj.nombre,
            leer: Boolean(record.leer),
            escribir: Boolean(record.escribir),
            activo: Boolean(record.activo)
          };
        } else {
          // Si no hay registro explícito:
          // Admin (rol 1) tiene acceso total por defecto
          const defaultVal = Boolean(isAdmin);
          mapped[obj.id_vista] = {
            objeto_id: obj.id,
            id_vista: obj.id_vista,
            nombre: obj.nombre,
            leer: defaultVal,
            escribir: defaultVal,
            activo: defaultVal
          };
        }
      });
    }

    this.permissions = mapped;
    this.isLoaded = true;

    // Persistir en almacenamiento local
    try {
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(mapped));
    } catch {
      // Ignorar si storage está deshabilitado
    }

    // 5. Aplicar inmediatamente en la interfaz de usuario
    this.applyUIPermissions();

    // Notificar a toda la aplicación
    window.dispatchEvent(new CustomEvent('permissions:updated', { detail: mapped }));

    return mapped;
  }

  /**
   * Obtiene la clave efectiva para normalizar alias de vistas (ej. admin-section-roles -> admin-section-user-roles)
   * @param {string} idVista 
   * @returns {string}
   */
  getEffectiveKey(idVista) {
    if (!idVista) return '';
    if (idVista === 'admin-section-roles') return 'admin-section-user-roles';
    return idVista;
  }

  /**
   * Verifica si el usuario tiene permiso de LECTURA/VISUALIZACIÓN sobre un objeto
   * @param {string} idVista 
   * @returns {boolean}
   */
  canRead(idVista) {
    if (!idVista) return false;
    const key = this.getEffectiveKey(idVista);
    const perm = this.permissions[key] || this.permissions[idVista] || (key === 'admin-section-user-roles' ? this.permissions['admin-section-roles'] : null);
    if (!perm) {
      // Si aún no se cargaron permisos, verificar si es admin
      const current = authModel.getCurrentUser();
      return Boolean(current?.isAdmin);
    }
    return Boolean(perm.activo && perm.leer);
  }

  /**
   * Verifica si el usuario tiene permiso de ESCRITURA/CREACIÓN/MODIFICACIÓN sobre un objeto
   * @param {string} idVista 
   * @returns {boolean}
   */
  canWrite(idVista) {
    if (!idVista) return false;
    const key = this.getEffectiveKey(idVista);
    const perm = this.permissions[key] || this.permissions[idVista] || (key === 'admin-section-user-roles' ? this.permissions['admin-section-roles'] : null);
    if (!perm) {
      const current = authModel.getCurrentUser();
      return Boolean(current?.isAdmin);
    }
    return Boolean(perm.activo && perm.escribir);
  }

  /**
   * Verifica si un objeto está habilitado para el rol
   * @param {string} idVista 
   * @returns {boolean}
   */
  isActive(idVista) {
    if (!idVista) return false;
    const key = this.getEffectiveKey(idVista);
    const perm = this.permissions[key] || this.permissions[idVista] || (key === 'admin-section-user-roles' ? this.permissions['admin-section-roles'] : null);
    if (!perm) {
      const current = authModel.getCurrentUser();
      return Boolean(current?.isAdmin);
    }
    return Boolean(perm.activo);
  }

  /**
   * Retorna todos los permisos indexados
   */
  getPermissions() {
    return this.permissions;
  }

  /**
   * Limpia los permisos en cierre de sesión
   */
  clear() {
    this.permissions = {};
    this.isLoaded = false;
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY);
    this.applyUIPermissions();
  }

  /**
   * Aplica dinámicamente los permisos a los elementos del DOM
   */
  applyUIPermissions() {
    const user = authModel.getCurrentUser();

    // 1. Barra de Gestión Rápida ('quick-actions-bar')
    const quickBar = $('.quick-actions-bar');
    if (quickBar) {
      const canViewBar = this.canRead('quick-actions-bar');
      quickBar.style.display = canViewBar ? '' : 'none';
    }

    // 2. Botón Gestionar Paciente ('modal-patient-form')
    const btnPatient = $('#btn-quick-patient') || $('#btn-quick-client');
    if (btnPatient) {
      btnPatient.style.display = this.canRead('modal-patient-form') ? 'inline-flex' : 'none';
    }

    // 3. Botón Ver Historial ('modal-quick-history')
    const btnHistory = $('#btn-quick-history');
    if (btnHistory) {
      btnHistory.style.display = this.canRead('modal-quick-history') ? 'inline-flex' : 'none';
    }

    // 4. Botón Reportes ('modal-quick-reports')
    const btnReports = $('#btn-quick-reports');
    if (btnReports) {
      btnReports.style.display = this.canRead('modal-quick-reports') ? 'inline-flex' : 'none';
    }

    // 4b. Botón Panel Financiero ('finance-main-section' / 'panel-financiero')
    const btnFinance = $('#btn-quick-finance');
    if (btnFinance) {
      const hasSpecific = this.permissions['finance-main-section'] || this.permissions['panel-financiero'];
      const canFinance = hasSpecific ? (this.canRead('finance-main-section') || this.canRead('panel-financiero')) : true;
      btnFinance.style.display = canFinance ? 'inline-flex' : 'none';
    }

    // 5. Botón de Configuración Administrativa ('modal-admin-config')
    const btnConfig = $('#btn-quick-config') || $('#btn-open-admin-config');
    if (btnConfig) {
      const canAdmin = this.canRead('modal-admin-config');
      btnConfig.style.display = canAdmin ? 'inline-flex' : 'none';
    }

    // 6. Selector de Sede Activa ('dialog-switch-consultorio')
    const btnSwitchSede = $('#btn-open-switch-consultorio');
    if (btnSwitchSede) {
      btnSwitchSede.style.display = this.canRead('dialog-switch-consultorio') ? 'inline-flex' : 'none';
    }

    // 7. Vistas del Calendario ('cal-month', 'cal-week', 'cal-day')
    const btnMonth = $('.btn-cal-view[data-view="month"]');
    if (btnMonth) {
      btnMonth.style.display = this.canRead('cal-month') ? 'inline-flex' : 'none';
    }

    const btnWeek = $('.btn-cal-view[data-view="week"]');
    if (btnWeek) {
      btnWeek.style.display = this.canRead('cal-week') ? 'inline-flex' : 'none';
    }

    const btnDay = $('.btn-cal-view[data-view="day"]');
    if (btnDay) {
      btnDay.style.display = this.canRead('cal-day') ? 'inline-flex' : 'none';
    }

    // 8. Secciones internas del Panel de Configuración Administrativa
    this.applyAdminSectionsPermissions();
  }

  /**
   * Aplica permisos a las pestañas y secciones internas del Panel de Configuración
   */
  applyAdminSectionsPermissions() {
    // a. Consultorio ('admin-section-consultorio')
    const canConsultorio = this.canRead('admin-section-consultorio');
    const canWriteConsultorio = this.canWrite('admin-section-consultorio');
    const navConsultorio = $('#admin-nav-consultorio');
    const cardConsultorio = $('#btn-admin-open-consultorio');
    if (navConsultorio) navConsultorio.style.display = canConsultorio ? 'inline-flex' : 'none';
    if (cardConsultorio) cardConsultorio.style.display = canConsultorio ? 'block' : 'none';
    const btnSubmitConsultorio = $('#btn-submit-consultorio-admin');
    if (btnSubmitConsultorio) {
      btnSubmitConsultorio.style.display = canWriteConsultorio ? 'inline-flex' : 'none';
    }

    // b. Doctores ('admin-section-doctor')
    const canDoctor = this.canRead('admin-section-doctor');
    const canWriteDoctor = this.canWrite('admin-section-doctor');
    const navDoctor = $('#admin-nav-doctor');
    const cardDoctor = $('#btn-admin-open-doctor');
    if (navDoctor) navDoctor.style.display = canDoctor ? 'inline-flex' : 'none';
    if (cardDoctor) cardDoctor.style.display = canDoctor ? 'block' : 'none';
    const btnSubmitDoctor = $('#btn-submit-doctor-admin');
    if (btnSubmitDoctor) {
      btnSubmitDoctor.style.display = canWriteDoctor ? 'inline-flex' : 'none';
    }

    // c. Usuarios ('admin-section-users')
    const canUsers = this.canRead('admin-section-users');
    const canWriteUsers = this.canWrite('admin-section-users');
    const navUsers = $('#admin-nav-users');
    const cardUsers = $('#btn-admin-open-users');
    if (navUsers) navUsers.style.display = canUsers ? 'inline-flex' : 'none';
    if (cardUsers) cardUsers.style.display = canUsers ? 'block' : 'none';
    const btnSubmitUser = $('#btn-submit-user-admin');
    if (btnSubmitUser) {
      btnSubmitUser.style.display = canWriteUsers ? 'inline-flex' : 'none';
    }

    // d. Roles y Permisos ('admin-section-user-roles' / 'admin-section-roles')
    const canRoles = this.canRead('admin-section-user-roles');
    const canWriteRoles = this.canWrite('admin-section-user-roles');
    const navRoles = $('#admin-nav-roles');
    const cardRoles = $('#btn-admin-open-roles');
    if (navRoles) navRoles.style.display = canRoles ? 'inline-flex' : 'none';
    if (cardRoles) cardRoles.style.display = canRoles ? 'block' : 'none';

    // Controles de creación / edición de roles
    const btnNewRole = $('#btn-admin-scroll-new-role');
    if (btnNewRole) btnNewRole.style.display = canWriteRoles ? 'inline-flex' : 'none';
    const formRole = $('#form-admin-role');
    if (formRole) formRole.style.display = canWriteRoles ? 'block' : 'none';
    const btnSubmitRole = $('#btn-submit-role-admin');
    if (btnSubmitRole) {
      btnSubmitRole.style.display = canWriteRoles ? 'inline-flex' : 'none';
    }

    // Controles de asignación de permisos
    const saveRolePermsBtn = $('#btn-save-role-perms');
    if (saveRolePermsBtn) saveRolePermsBtn.style.display = canWriteRoles ? 'inline-flex' : 'none';
    const permsQuickActions = $('#perms-quick-actions');
    if (permsQuickActions) permsQuickActions.style.display = canWriteRoles ? 'inline-flex' : 'none';
    const permsSaveContainer = $('#perms-save-container');
    if (permsSaveContainer) permsSaveContainer.style.display = canWriteRoles ? 'flex' : 'none';
    // e. Tasas de Cambio ('admin-section-tasa')
    const canTasa = this.canRead('admin-section-tasa');
    const canWriteTasa = this.canWrite('admin-section-tasa');
    const navTasa = $('#admin-nav-tasa');
    const cardTasa = $('#btn-admin-open-tasa');
    if (navTasa) navTasa.style.display = canTasa ? 'inline-flex' : 'none';
    if (cardTasa) cardTasa.style.display = canTasa ? 'block' : 'none';
    const btnNewTasa = $('#btn-admin-new-tasa');
    if (btnNewTasa) btnNewTasa.style.display = canWriteTasa ? 'inline-flex' : 'none';
    const btnQuickScrape = $('#btn-quick-scrape-new');
    if (btnQuickScrape) btnQuickScrape.style.display = canWriteTasa ? 'inline-flex' : 'none';
    const btnSubmitTasa = $('#btn-submit-tasa');
    if (btnSubmitTasa) btnSubmitTasa.style.display = canWriteTasa ? 'inline-flex' : 'none';
  }
}

export const permissionService = new PermissionService();
