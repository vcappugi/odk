/**
 * Modelo Administrativo (Admin Model)
 * Gestiona la verificación de permisos en la tabla 'user_roles' y 'roles',
 * la creación y listado de consultorios, doctores y la gestión de usuarios.
 */

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

        return {
          ...u,
          isAdmin,
          assignedRoles: assigned
        };
      });
    } catch (err) {
      console.warn('[AdminModel] Error en getUsersWithRoles:', err);
      return [];
    }
  },

  /**
   * Asigna o remueve el rol 'admin' de un usuario en la tabla 'user_roles'
   * @param {number} userId
   * @param {boolean} makeAdmin
   */
  async setAdminRole(userId, makeAdmin) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Cliente Supabase no disponible.');

    // 1. Buscar si ya existe registro en user_roles para role_id = 1
    const { data: existingRoles, error: searchError } = await supabase
      .from('user_roles')
      .select('id, activo')
      .eq('user_id', userId)
      .eq('role_id', 1);

    if (searchError) {
      console.warn('[AdminModel] Error buscando en user_roles:', searchError);
    }

    if (existingRoles && existingRoles.length > 0) {
      // Actualizar el estado activo
      const recordId = existingRoles[0].id;
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ activo: Boolean(makeAdmin) })
        .eq('id', recordId);

      if (updateError) {
        throw new Error(`Error actualizando user_roles: ${updateError.message}`);
      }
    } else if (makeAdmin) {
      // Insertar nuevo registro en user_roles
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: 1, // Rol admin
          activo: true
        }]);

      if (insertError) {
        throw new Error(`Error asignando rol en user_roles: ${insertError.message}`);
      }
    }

    // 2. Sincronizar columna 'rol' en la tabla 'usuario' para coherencia
    try {
      await supabase
        .from('usuario')
        .update({ rol: makeAdmin ? 'admin' : 'usuario' })
        .eq('id', userId);
    } catch (err) {
      console.warn('[AdminModel] Aviso actualizando rol en usuario:', err);
    }

    return true;
  }
};
