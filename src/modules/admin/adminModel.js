/**
 * Modelo Administrativo (Admin Model)
 * Gestiona la verificación de permisos en la tabla 'user_roles' y 'roles',
 * la creación y listado de consultorios, doctores y la gestión de usuarios.
 */

import bcrypt from 'bcryptjs';
import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';
import { authModel } from '../auth/authModel.js';

export const adminModel = {
  /**
   * Verifica si un usuario específico tiene el rol 'admin' en la tabla 'user_roles'
   * @param {number|string} userId - ID del usuario en la tabla 'usuario'
   * @returns {Promise<boolean>}
   */
  async checkUserIsAdmin(userId) {
    if (!userId) return false;

    const supabase = getSupabase();
    const conn = getConnectionStatus();

    if (!conn.isLive || !supabase) {
      // Modo local / demo: verificar si el usuario en sesión tiene rol 'admin'
      const current = authModel.getCurrentUser();
      return Boolean(current && (current.rol === 'admin' || current.isAdmin === true));
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('id, role_id, activo, roles ( id, nombre, tipo, activo )')
        .eq('user_id', userId)
        .eq('activo', true);

      if (error) {
        console.warn('[AdminModel] Error al consultar user_roles:', error.message);
        // Respaldo en campo rol de usuario
        const current = authModel.getCurrentUser();
        return current?.rol === 'admin' || current?.isAdmin === true;
      }

      const hasAdmin = (data || []).some(ur => {
        const roleName = ur.roles?.nombre?.toLowerCase() || ur.roles?.tipo?.toLowerCase();
        return roleName === 'admin' || ur.role_id === 1;
      });

      return hasAdmin;
    } catch (err) {
      console.warn('[AdminModel] Excepción al comprobar rol de admin:', err);
      return false;
    }
  },

  /**
   * Verifica si el usuario autenticado actualmente tiene rol 'admin'
   * @returns {Promise<boolean>}
   */
  async isCurrentUserAdmin() {
    const user = authModel.getCurrentUser();
    if (!user || !user.id) return false;
    return await this.checkUserIsAdmin(user.id);
  },

  /**
   * Obtiene la lista de consultorios registrados
   */
  async getConsultorios() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('consultorio')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AdminModel] Error listando consultorios:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[AdminModel] Error en getConsultorios:', err);
      return [];
    }
  },

  /**
   * Crea un nuevo consultorio en la tabla 'consultorio'
   */
  async createConsultorio({ nombre, direccion, telefono }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    const cleanNombre = nombre.trim();
    const cleanDireccion = (direccion || '').trim();
    const cleanTelefono = (telefono || '').trim();

    if (!cleanNombre) {
      throw new Error('El nombre del consultorio es obligatorio.');
    }

    const payload = {
      nombre: cleanNombre,
      direccion: cleanDireccion || null,
      telefono: cleanTelefono || null
    };

    const { data, error } = await supabase
      .from('consultorio')
      .insert([payload])
      .select();

    if (error) {
      throw new Error(`Error en Supabase: ${error.message}`);
    }

    return data?.[0] || null;
  },

  /**
   * Elimina un consultorio por su ID
   */
  async deleteConsultorio(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    const { error } = await supabase
      .from('consultorio')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar consultorio: ${error.message}`);
    }
    return true;
  },

  /**
   * Obtiene la lista de doctores registrados
   */
  async getDoctores() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('doctor')
        .select('*, consultorio ( id, nombre )')
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AdminModel] Error listando doctores:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[AdminModel] Error en getDoctores:', err);
      return [];
    }
  },

  /**
   * Registra un nuevo doctor en la tabla 'doctor'
   */
  async createDoctor({ nombre, telefono, mail, consultorio_id }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    const cleanNombre = nombre.trim();
    const cleanTelefono = (telefono || '').trim();
    const cleanMail = (mail || '').trim().toLowerCase();

    if (!cleanNombre) {
      throw new Error('El nombre del doctor es obligatorio.');
    }

    const payload = {
      nombre: cleanNombre,
      telefono: cleanTelefono || null,
      mail: cleanMail || null,
      consultorio_id: consultorio_id ? Number(consultorio_id) : null
    };

    const { data, error } = await supabase
      .from('doctor')
      .insert([payload])
      .select();

    if (error) {
      throw new Error(`Error al registrar doctor: ${error.message}`);
    }

    return data?.[0] || null;
  },

  /**
   * Elimina un doctor por su ID
   */
  async deleteDoctor(id) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    const { error } = await supabase
      .from('doctor')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar doctor: ${error.message}`);
    }
    return true;
  },

  /**
   * Obtiene todos los usuarios y sus roles asignados en 'user_roles'
   */
  async getUsersWithRoles() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      // 1. Obtener usuarios
      const { data: users, error: uError } = await supabase
        .from('usuario')
        .select('id, nombre, mail, ci, telefono, activo, rol, created_at')
        .order('id', { ascending: true });

      if (uError) {
        console.warn('[AdminModel] Error obteniendo usuarios:', uError);
        return [];
      }

      // 2. Obtener user_roles con roles
      const { data: userRoles, error: rError } = await supabase
        .from('user_roles')
        .select('id, user_id, role_id, activo, roles ( id, nombre, tipo, activo )');

      if (rError) {
        console.warn('[AdminModel] Error obteniendo user_roles:', rError);
      }

      // Combinar información
      return (users || []).map(u => {
        const assigned = (userRoles || []).filter(ur => ur.user_id === u.id && ur.activo === true);
        const isAdmin = assigned.some(ur => {
          const rName = ur.roles?.nombre?.toLowerCase() || ur.roles?.tipo?.toLowerCase();
          return rName === 'admin' || ur.role_id === 1;
        }) || u.rol === 'admin';

        const activeUR = assigned[0];
        const roleName = activeUR?.roles?.nombre || u.rol || (isAdmin ? 'admin' : 'user');
        const roleId = activeUR?.role_id || (isAdmin ? 1 : null);

        return {
          ...u,
          isAdmin,
          role_id: roleId,
          role_name: roleName,
          assignedRoles: assigned
        };
      });
    } catch (err) {
      console.warn('[AdminModel] Error en getUsersWithRoles:', err);
      return [];
    }
  },

  /**
   * Asigna un rol específico a un usuario en la tabla 'user_roles' y sincroniza 'usuario.rol'
   * @param {number} userId
   * @param {number} roleId
   */
  async assignUserRole(userId, roleId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    const numRoleId = Number(roleId);
    if (!numRoleId) return false;

    // 1. Obtener nombre del rol
    const { data: roleData } = await supabase
      .from('roles')
      .select('id, nombre')
      .eq('id', numRoleId)
      .maybeSingle();

    const roleName = roleData?.nombre || 'usuario';

    // 2. Gestionar asignación en user_roles
    const { data: existingRoles, error: searchError } = await supabase
      .from('user_roles')
      .select('id, role_id, activo')
      .eq('user_id', userId);

    if (searchError) {
      console.warn('[AdminModel] Error buscando en user_roles:', searchError);
    }

    if (existingRoles && existingRoles.length > 0) {
      let matchedExisting = false;
      for (const ur of existingRoles) {
        if (ur.role_id === numRoleId) {
          matchedExisting = true;
          await supabase
            .from('user_roles')
            .update({ activo: true })
            .eq('id', ur.id);
        } else {
          // Desactivar otros roles anteriores
          await supabase
            .from('user_roles')
            .update({ activo: false })
            .eq('id', ur.id);
        }
      }

      if (!matchedExisting) {
        await supabase
          .from('user_roles')
          .insert([{
            user_id: userId,
            role_id: numRoleId,
            activo: true
          }]);
      }
    } else {
      await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: numRoleId,
          activo: true
        }]);
    }

    // 3. Sincronizar columna 'rol' en tabla 'usuario'
    try {
      await supabase
        .from('usuario')
        .update({ rol: roleName })
        .eq('id', userId);
    } catch (err) {
      console.warn('[AdminModel] Error sincronizando rol en usuario:', err);
    }

    return true;
  },

  /**
   * Asigna o remueve el rol 'admin' de un usuario en la tabla 'user_roles'
   * @param {number} userId
   * @param {boolean} makeAdmin
   */
  async setAdminRole(userId, makeAdmin) {
    if (makeAdmin) {
      return this.assignUserRole(userId, 1);
    }

    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    // Desactivar rol admin (role_id: 1)
    try {
      await supabase
        .from('user_roles')
        .update({ activo: false })
        .eq('user_id', userId)
        .eq('role_id', 1);
    } catch (err) {
      console.warn('[AdminModel] Error desactivando admin en user_roles:', err);
    }

    // Buscar rol alternativo (ej. id 2 'user' o primer rol no admin)
    try {
      const { data: defaultRoles } = await supabase
        .from('roles')
        .select('id, nombre')
        .neq('id', 1)
        .eq('activo', true)
        .order('id', { ascending: true })
        .limit(1);

      const fallbackId = defaultRoles?.[0]?.id || 2;
      return this.assignUserRole(userId, fallbackId);
    } catch (err) {
      return this.assignUserRole(userId, 2);
    }
  },

  /**
   * Obtiene un usuario específico por su ID con su rol asignado en user_roles
   * @param {number} userId
   */
  async getUserById(userId) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('usuario')
      .select('id, nombre, mail, ci, telefono, activo, rol, created_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`[AdminModel] Error obteniendo usuario ${userId}:`, error);
      throw error;
    }

    // Consultar rol asignado en user_roles
    try {
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('id, role_id, activo, roles ( id, nombre, tipo, activo )')
        .eq('user_id', userId)
        .eq('activo', true);

      const activeUR = userRoles?.[0];
      return {
        ...data,
        role_id: activeUR?.role_id || null,
        role_name: activeUR?.roles?.nombre || data.rol || null
      };
    } catch (rErr) {
      return {
        ...data,
        role_id: null,
        role_name: data.rol
      };
    }
  },

  /**
   * Registra un nuevo usuario en la tabla 'usuario' y asigna su rol en 'user_roles'
   * @param {Object} userData
   */
  async createUser({ nombre, mail, clave, ci, telefono, rol = 'user', role_id = null, activo = true }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (!nombre || !mail || !clave) {
      throw new Error('Nombre, correo electrónico y contraseña son campos obligatorios.');
    }

    const cleanMail = mail.toLowerCase().trim();
    const cleanCi = ci?.trim() || null;

    // 1. Verificar si ya existe usuario con ese correo o cédula
    let checkQuery = supabase.from('usuario').select('id, mail, ci');
    if (cleanCi) {
      checkQuery = checkQuery.or(`mail.eq.${cleanMail},ci.eq.${cleanCi}`);
    } else {
      checkQuery = checkQuery.eq('mail', cleanMail);
    }

    const { data: existing, error: checkError } = await checkQuery;
    if (checkError) {
      console.warn('[AdminModel] Aviso comprobando duplicados:', checkError);
    }

    if (existing && existing.length > 0) {
      const match = existing[0];
      if (match.mail.toLowerCase() === cleanMail) {
        throw new Error(`Ya existe una cuenta registrada con el correo "${cleanMail}".`);
      }
      if (cleanCi && match.ci === cleanCi) {
        throw new Error(`Ya existe una cuenta registrada con la cédula "${cleanCi}".`);
      }
    }

    // 2. Hashear la contraseña con bcrypt
    const salt = bcrypt.genSaltSync(10);
    const hashedClave = bcrypt.hashSync(clave.trim(), salt);

    // 3. Resolver rol e ID de rol
    let resolvedRoleId = role_id ? Number(role_id) : null;
    let resolvedRoleName = rol || 'user';

    if (!resolvedRoleId) {
      try {
        const { data: matchedRoles } = await supabase
          .from('roles')
          .select('id, nombre')
          .or(`nombre.ilike.${resolvedRoleName},tipo.ilike.${resolvedRoleName}`)
          .limit(1);

        if (matchedRoles && matchedRoles.length > 0) {
          resolvedRoleId = matchedRoles[0].id;
          resolvedRoleName = matchedRoles[0].nombre;
        }
      } catch (err) {
        console.warn('[AdminModel] Error resolviendo rol:', err);
      }
    }

    // 4. Insertar usuario en la tabla 'usuario'
    const { data, error } = await supabase
      .from('usuario')
      .insert([{
        nombre: nombre.trim(),
        mail: cleanMail,
        clave: hashedClave,
        ci: cleanCi,
        telefono: telefono?.trim() || null,
        rol: resolvedRoleName,
        activo: Boolean(activo)
      }])
      .select();

    if (error) {
      console.error('[AdminModel] Error creando usuario:', error);
      throw new Error(`Error creando usuario: ${error.message}`);
    }

    const newUser = data?.[0];

    // 5. Asignar rol en la tabla 'user_roles'
    if (newUser?.id && resolvedRoleId) {
      try {
        await this.assignUserRole(newUser.id, resolvedRoleId);
      } catch (rErr) {
        console.warn('[AdminModel] Error asignando rol a nuevo usuario en user_roles:', rErr);
      }
    }

    return newUser;
  },

  /**
   * Modifica un usuario existente y sincroniza su rol en 'user_roles'
   * @param {number} userId
   * @param {Object} userData
   */
  async updateUser(userId, { nombre, mail, clave, ci, telefono, rol = 'user', role_id = null, activo = true }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (!nombre || !mail) {
      throw new Error('Nombre y correo electrónico son obligatorios.');
    }

    const cleanMail = mail.toLowerCase().trim();
    const cleanCi = ci?.trim() || null;

    // 1. Resolver rol e ID de rol
    let resolvedRoleId = role_id ? Number(role_id) : null;
    let resolvedRoleName = rol || 'user';

    if (!resolvedRoleId) {
      try {
        const { data: matchedRoles } = await supabase
          .from('roles')
          .select('id, nombre')
          .or(`nombre.ilike.${resolvedRoleName},tipo.ilike.${resolvedRoleName}`)
          .limit(1);

        if (matchedRoles && matchedRoles.length > 0) {
          resolvedRoleId = matchedRoles[0].id;
          resolvedRoleName = matchedRoles[0].nombre;
        }
      } catch (err) {
        console.warn('[AdminModel] Error resolviendo rol:', err);
      }
    }

    // 2. Preparar campos para actualizar en 'usuario'
    const payload = {
      nombre: nombre.trim(),
      mail: cleanMail,
      ci: cleanCi,
      telefono: telefono?.trim() || null,
      rol: resolvedRoleName,
      activo: Boolean(activo)
    };

    // Si se especificó una nueva contraseña, encriptarla
    if (clave && clave.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      payload.clave = bcrypt.hashSync(clave.trim(), salt);
    }

    const { data, error } = await supabase
      .from('usuario')
      .update(payload)
      .eq('id', userId)
      .select();

    if (error) {
      console.error(`[AdminModel] Error actualizando usuario ${userId}:`, error);
      throw new Error(`Error actualizando usuario: ${error.message}`);
    }

    // 3. Sincronizar en la tabla 'user_roles'
    if (resolvedRoleId) {
      try {
        await this.assignUserRole(userId, resolvedRoleId);
      } catch (rErr) {
        console.warn('[AdminModel] Error sincronizando rol en user_roles:', rErr);
      }
    }

    return data?.[0];
  },

  /**
   * Elimina un usuario por su ID
   * @param {number} userId
   */
  async deleteUser(userId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    // Prevenir auto-eliminación de la cuenta en sesión activa
    const currentUser = authModel.getCurrentUser();
    if (currentUser && Number(currentUser.id) === Number(userId)) {
      throw new Error('No puedes eliminar tu propia cuenta mientras estés en sesión activa.');
    }

    // 1. Eliminar asignaciones en user_roles
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
    } catch (rErr) {
      console.warn('[AdminModel] Aviso eliminando en user_roles:', rErr);
    }

    // 2. Eliminar de la tabla 'usuario'
    const { error } = await supabase
      .from('usuario')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error(`[AdminModel] Error eliminando usuario ${userId}:`, error);
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }

    return true;
  },

  /**
   * Obtiene la lista de todos los objetos registrados (Vistas y CRUDs) en la tabla 'objetos'
   */
  async getObjetos() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      const { data, error } = await supabase
        .from('objetos')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        console.warn('[AdminModel] Error obteniendo objetos:', error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.warn('[AdminModel] Error en getObjetos:', err);
      return [];
    }
  },

  /**
   * Obtiene la lista de roles registrados con conteo de permisos activos
   */
  async getRoles() {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      // 1. Obtener roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('*')
        .order('id', { ascending: true });

      if (rolesError) {
        console.warn('[AdminModel] Error cargando roles:', rolesError);
        return [];
      }

      // 2. Obtener conteo de permisos asignados en roles_permision
      const { data: perms, error: permsError } = await supabase
        .from('roles_permision')
        .select('id, rol_id, activo, leer, escribir');

      if (permsError) {
        console.warn('[AdminModel] Error cargando roles_permision:', permsError);
      }

      return (roles || []).map(r => {
        const rolePerms = (perms || []).filter(p => p.rol_id === r.id && p.activo === true);
        return {
          ...r,
          totalPermisos: rolePerms.length,
          permsLeer: rolePerms.filter(p => p.leer === true).length,
          permsEscribir: rolePerms.filter(p => p.escribir === true).length
        };
      });
    } catch (err) {
      console.warn('[AdminModel] Error en getRoles:', err);
      return [];
    }
  },

  /**
   * Obtiene un rol por su ID
   * @param {number} roleId
   */
  async getRoleById(roleId) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) {
      console.error(`[AdminModel] Error obteniendo rol ${roleId}:`, error);
      throw error;
    }

    return data;
  },

  /**
   * Crea un nuevo rol en la tabla 'roles'
   * @param {Object} roleData
   */
  async createRole({ nombre, tipo, activo = true }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (!nombre || !tipo) {
      throw new Error('El nombre del rol y el tipo/descripción son obligatorios.');
    }

    const cleanNombre = nombre.toLowerCase().trim();
    const cleanTipo = tipo.trim();

    // Validar nombre duplicado
    const { data: existing } = await supabase
      .from('roles')
      .select('id')
      .eq('nombre', cleanNombre);

    if (existing && existing.length > 0) {
      throw new Error(`Ya existe un rol con el nombre "${cleanNombre}".`);
    }

    const { data, error } = await supabase
      .from('roles')
      .insert([{
        nombre: cleanNombre,
        tipo: cleanTipo,
        activo: Boolean(activo)
      }])
      .select();

    if (error) {
      console.error('[AdminModel] Error creando rol:', error);
      throw new Error(`Error creando rol: ${error.message}`);
    }

    return data?.[0];
  },

  /**
   * Actualiza un rol existente
   * @param {number} roleId
   * @param {Object} roleData
   */
  async updateRole(roleId, { nombre, tipo, activo = true }) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (!nombre || !tipo) {
      throw new Error('El nombre del rol y el tipo/descripción son obligatorios.');
    }

    const cleanNombre = nombre.toLowerCase().trim();
    const cleanTipo = tipo.trim();

    const { data, error } = await supabase
      .from('roles')
      .update({
        nombre: cleanNombre,
        tipo: cleanTipo,
        activo: Boolean(activo)
      })
      .eq('id', roleId)
      .select();

    if (error) {
      console.error(`[AdminModel] Error actualizando rol ${roleId}:`, error);
      throw new Error(`Error actualizando rol: ${error.message}`);
    }

    return data?.[0];
  },

  /**
   * Elimina un rol por su ID
   * @param {number} roleId
   */
  async deleteRole(roleId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (Number(roleId) === 1) {
      throw new Error('El rol "admin" principal del sistema está protegido y no se puede eliminar.');
    }

    // 1. Eliminar permisos asociados en roles_permision
    try {
      await supabase
        .from('roles_permision')
        .delete()
        .eq('rol_id', roleId);
    } catch (pErr) {
      console.warn('[AdminModel] Aviso eliminando roles_permision:', pErr);
    }

    // 2. Eliminar referencias en user_roles
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('role_id', roleId);
    } catch (uErr) {
      console.warn('[AdminModel] Aviso eliminando user_roles:', uErr);
    }

    // 3. Eliminar de la tabla roles
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error(`[AdminModel] Error eliminando rol ${roleId}:`, error);
      throw new Error(`Error al eliminar rol: ${error.message}`);
    }

    return true;
  },

  /**
   * Obtiene la matriz completa de permisos de un rol (cruce entre tabla 'objetos' y 'roles_permision')
   * @param {number} roleId
   */
  async getPermissionsByRoleId(roleId) {
    const supabase = getSupabase();
    if (!supabase) return [];

    try {
      // 1. Obtener todos los objetos del sistema
      const objetos = await this.getObjetos();

      // 2. Obtener los permisos configurados para este rol en roles_permision
      const { data: perms, error } = await supabase
        .from('roles_permision')
        .select('*')
        .eq('rol_id', roleId);

      if (error) {
        console.warn(`[AdminModel] Error consultando roles_permision para rol ${roleId}:`, error);
      }

      const permsMap = new Map();
      (perms || []).forEach(p => {
        permsMap.set(p.objeto_id, p);
      });

      // Cruzar objetos con sus permisos
      return objetos.map(obj => {
        const assigned = permsMap.get(obj.id);
        return {
          objeto_id: obj.id,
          nombre: obj.nombre,
          id_vista: obj.id_vista,
          plantilla: obj.plantilla,
          descripcion: obj.descripcion,
          perm_id: assigned ? assigned.id : null,
          leer: assigned ? Boolean(assigned.leer) : false,
          escribir: assigned ? Boolean(assigned.escribir) : false,
          activo: assigned ? Boolean(assigned.activo) : false
        };
      });
    } catch (err) {
      console.warn('[AdminModel] Error en getPermissionsByRoleId:', err);
      return [];
    }
  },

  /**
   * Guarda o actualiza la lista de permisos de un rol en la tabla 'roles_permision'
   * @param {number} roleId
   * @param {Array} permissionsList - Lista de { objeto_id, leer, escribir, activo }
   */
  async saveRolePermissions(roleId, permissionsList) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    if (!roleId) throw new Error('ID de rol inválido.');

    // 1. Limpiar registros previos de este rol en roles_permision
    const { error: delError } = await supabase
      .from('roles_permision')
      .delete()
      .eq('rol_id', roleId);

    if (delError) {
      console.error('[AdminModel] Error limpiando permisos previos:', delError);
      throw new Error(`Error actualizando permisos: ${delError.message}`);
    }

    // 2. Mapear permisos con sus valores booleanos explícitos
    const recordsToInsert = permissionsList.map(p => ({
      rol_id: Number(roleId),
      objeto_id: Number(p.objeto_id),
      leer: Boolean(p.leer),
      escribir: Boolean(p.escribir),
      activo: Boolean(p.activo)
    }));

    if (recordsToInsert.length === 0) {
      return true;
    }

    // 3. Insertar registros en roles_permision
    const { error: insertError } = await supabase
      .from('roles_permision')
      .insert(recordsToInsert);

    if (insertError) {
      console.error('[AdminModel] Error insertando nuevos permisos en roles_permision:', insertError);
      throw new Error(`Error guardando permisos en roles_permision: ${insertError.message}`);
    }

    return true;
  }
};
