/**
 * Modelo de Autenticación (Auth Model)
 * Gestiona el inicio de sesión y auto-registro interactuando con la tabla 'usuario' de Supabase.
 * La contraseña se encripta mediante bcrypt (hash + salt) antes de persistir en base de datos.
 */
import bcrypt from 'bcryptjs';
import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';
import { APP_CONSTANTS } from '../../config/constants.js';
import { permissionService } from '../../services/permissionService.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';

const AUTH_STORAGE_KEY = 'odk_auth_user_session';

export const authModel = {
  /**
   * Obtiene el usuario autenticado actualmente en la sesión local
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Guarda la sesión del usuario (sin almacenar la clave)
   * Incluye el rol asignado, permisos y consultorio activo
   */
  saveSession(user, isAdmin = null, consultorio = null) {
    if (!user) return;
    const activeConsultorio = consultorio || user.consultorio || this.getActiveConsultorio() || null;
    const resolvedIsAdmin = isAdmin !== null ? Boolean(isAdmin) : Boolean(user.rol === 'admin' || user.isAdmin === true || user.role_id === 1);
    
    // Identificar restricción de Consultorio_ID en la tabla de usuarios
    const rawConsultorioId = user.user_consultorio_id ?? user.consultorio_id ?? user.Consultorio_ID ?? null;
    const isConsultorioEmpty = rawConsultorioId === null || rawConsultorioId === undefined || String(rawConsultorioId).trim() === '' || Number(rawConsultorioId) === 0;

    const sessionData = {
      id: user.id,
      nombre: user.nombre,
      mail: user.mail,
      telefono: user.telefono || '',
      ci: user.ci || '',
      rol: user.rol || 'usuario',
      role_id: user.role_id || (resolvedIsAdmin ? 1 : 2),
      role_name: user.role_name || user.rol || (resolvedIsAdmin ? 'admin' : 'usuario'),
      isAdmin: resolvedIsAdmin,
      consultorio_id: activeConsultorio?.id || (!isConsultorioEmpty ? Number(rawConsultorioId) : null),
      Consultorio_ID: !isConsultorioEmpty ? Number(rawConsultorioId) : null,
      user_consultorio_id: !isConsultorioEmpty ? Number(rawConsultorioId) : null,
      has_full_consultorios_access: isConsultorioEmpty,
      consultorio_nombre: activeConsultorio?.nombre || user.consultorio_nombre || 'Sede Principal',
      consultorio: activeConsultorio,
      activo: user.activo ?? true,
      logged_at: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    if (activeConsultorio) {
      localStorage.setItem('odk_active_consultorio', JSON.stringify(activeConsultorio));
    }
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: sessionData } }));
    return sessionData;
  },

  /**
   * Obtiene el consultorio activo actualmente
   */
  getActiveConsultorio() {
    try {
      const user = this.getCurrentUser();
      if (user && user.consultorio) return user.consultorio;
      const stored = localStorage.getItem('odk_active_consultorio');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /**
   * Cambia el consultorio activo del usuario
   */
  setActiveConsultorio(consultorio) {
    if (!consultorio) return;
    localStorage.setItem('odk_active_consultorio', JSON.stringify(consultorio));
    const user = this.getCurrentUser();
    if (user) {
      user.consultorio = consultorio;
      user.consultorio_id = consultorio.id;
      user.consultorio_nombre = consultorio.nombre;
      this.saveSession(user, user.isAdmin, consultorio);
    }
    window.dispatchEvent(new CustomEvent('consultorio:changed', { detail: consultorio }));
  },

  /**
   * Obtiene los consultorios a los que el usuario tiene acceso según el campo Consultorio_ID
   * de la tabla 'usuario'.
   * Si el campo Consultorio_ID está vacío (null, undefined, '', 0), tiene acceso a TODOS los consultorios.
   * Si tiene un ID específico, solo retorna el consultorio correspondiente.
   * @param {string} identificador (correo o nombre de usuario)
   * @returns {Promise<{ consultorios: Array, hasFullAccess: boolean, userFound: boolean, assignedId: any, user: Object|null }>}
   */
  async getConsultoriosForIdentifier(identificador) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();
    let allConsultorios = [];
    try {
      allConsultorios = await consultorioModel.getAll();
    } catch {
      allConsultorios = [];
    }

    const cleanId = (identificador || '').trim().toLowerCase();
    if (!cleanId) {
      return {
        consultorios: allConsultorios,
        hasFullAccess: true,
        userFound: false,
        assignedId: null,
        user: null
      };
    }

    if (supabase) {
      try {
        const { data: users, error } = await supabase
          .from('usuario')
          .select('id, nombre, mail, consultorio_id')
          .or(`mail.ilike.${cleanId},nombre.ilike.${cleanId}`)
          .limit(1);

        if (!error && users && users.length > 0) {
          const u = users[0];
          // Validar campo Consultorio_ID (o consultorio_id)
          const rawId = u.consultorio_id ?? u.Consultorio_ID ?? null;
          const isEmpty = rawId === null || rawId === undefined || String(rawId).trim() === '' || Number(rawId) === 0;

          // Si el campo Consultorio_ID de la tabla de usuarios está vacío -> acceso a todos los consultorios
          if (isEmpty) {
            return {
              consultorios: allConsultorios,
              hasFullAccess: true,
              userFound: true,
              assignedId: null,
              user: u
            };
          }

          // Si tiene asignado un consultorio específico -> solo mostrar los permitidos
          const allowedIds = String(rawId).split(',').map(s => s.trim());
          let filtered = allConsultorios.filter(c => allowedIds.includes(String(c.id)));

          // Si no estaba en la lista inicial, buscarlo por id
          if (filtered.length === 0 && allowedIds.length > 0) {
            const single = await consultorioModel.getById(allowedIds[0]);
            if (single) filtered = [single];
          }

          return {
            consultorios: filtered,
            hasFullAccess: false,
            assignedId: rawId,
            userFound: true,
            user: u
          };
        }
      } catch (err) {
        console.warn('[AuthModel] Error consultando consultorios por usuario:', err);
      }
    }

    return {
      consultorios: allConsultorios,
      hasFullAccess: true,
      userFound: false,
      assignedId: null,
      user: null
    };
  },

  /**
   * Cierra la sesión activa
   */
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    try {
      permissionService.clear();
    } catch {
      // Ignorar si no está inicializado
    }
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: null } }));
  },

  /**
   * Auto-registro de un nuevo usuario en la tabla 'usuario' de Supabase
   * Encripta la clave con bcrypt (10 rondas de salt).
   */
  async register({ nombre, mail, clave, telefono = '', ci = '' }) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    const cleanMail = mail.trim().toLowerCase();
    const cleanNombre = nombre.trim();

    if (!cleanMail || !clave || !cleanNombre) {
      throw new Error('Nombre, correo y contraseña son obligatorios.');
    }

    if (clave.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }

    // 1. Encriptación de la clave con bcrypt
    const salt = bcrypt.genSaltSync(10);
    const claveEncriptada = bcrypt.hashSync(clave, salt);

    // 2. Si hay conexión a Supabase, validar duplicados e insertar en la nube
    if (conn.isLive && supabase) {
      // Verificar si el correo ya existe
      const { data: existingUsers, error: checkError } = await supabase
        .from('usuario')
        .select('id, mail')
        .eq('mail', cleanMail);

      if (checkError) {
        console.warn('[AuthModel] Error al verificar duplicados:', checkError);
      } else if (existingUsers && existingUsers.length > 0) {
        throw new Error('Ya existe una cuenta registrada con este correo electrónico.');
      }

      // Preparar payload para la tabla 'usuario'
      const payload = {
        nombre: cleanNombre,
        mail: cleanMail,
        clave: claveEncriptada, // Clave fuertemente encriptada con bcrypt ($2a$10$...)
        telefono: telefono.trim() || null,
        ci: ci.trim() || null,
        activo: true,
        rol: 'usuario'
      };

      const { data, error } = await supabase
        .from('usuario')
        .insert([payload])
        .select('id, nombre, mail, telefono, ci, rol, activo, created_at');

      if (error) {
        throw new Error(`Error en Supabase: ${error.message}`);
      }

      const newUser = data[0];
      return this.saveSession(newUser);
    }

    // Respaldo para modo local / demo si no hay conexión
    const demoUser = {
      id: `local-usr-${Date.now()}`,
      nombre: cleanNombre,
      mail: cleanMail,
      telefono: telefono.trim() || '',
      ci: ci.trim() || '',
      activo: true,
      rol: 'usuario',
      created_at: new Date().toISOString()
    };
    return this.saveSession(demoUser);
  },

  /**
   * Inicio de sesión: valida credenciales contra la tabla 'usuario'
   * Compara la clave ingresada contra el hash bcrypt guardado en Supabase
   * y asocia el consultorio seleccionado.
   */
  async login(identificador, clave, selectedConsultorio = null) {
    const supabase = getSupabase();
    const conn = getConnectionStatus();

    const cleanId = identificador.trim().toLowerCase();

    if (!cleanId || !clave) {
      throw new Error('Ingresa tu usuario/correo y contraseña.');
    }

    if (conn.isLive && supabase) {
      // Buscar usuario por correo electrónico (mail) o nombre
      const { data: users, error } = await supabase
        .from('usuario')
        .select('*')
        .or(`mail.ilike.${cleanId},nombre.ilike.${cleanId}`)
        .limit(1);

      if (error) {
        throw new Error(`Error al consultar usuario: ${error.message}`);
      }

      if (!users || users.length === 0) {
        throw new Error('Usuario o correo no encontrado.');
      }

      const user = users[0];

      if (user.activo === false) {
        throw new Error('Tu cuenta está inactiva. Contacta al administrador.');
      }

      // Validar clave encriptada con bcrypt
      let isPasswordValid = false;

      if (user.clave && (user.clave.startsWith('$2a$') || user.clave.startsWith('$2b$') || user.clave.startsWith('$2y$'))) {
        isPasswordValid = bcrypt.compareSync(clave, user.clave);
      } else {
        // En caso de claves previas en texto plano, comparar y auto-encriptar
        if (user.clave === clave) {
          isPasswordValid = true;
          // Actualizar automáticamente a hash encriptado
          const salt = bcrypt.genSaltSync(10);
          const newHash = bcrypt.hashSync(clave, salt);
          await supabase.from('usuario').update({ clave: newHash }).eq('id', user.id);
        }
      }

      if (!isPasswordValid) {
        throw new Error('Contraseña incorrecta.');
      }

      // Verificar rol y obtener role_id desde la tabla user_roles
      let isAdmin = false;
      let roleId = null;
      let roleName = user.rol || 'usuario';

      try {
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('id, role_id, activo, roles ( id, nombre, tipo, activo )')
          .eq('user_id', user.id)
          .eq('activo', true);

        const activeUR = (userRoles || [])[0];
        if (activeUR) {
          roleId = activeUR.role_id;
          roleName = activeUR.roles?.nombre || user.rol;
        }

        isAdmin = (userRoles || []).some(ur => {
          const rName = ur.roles?.nombre?.toLowerCase() || ur.roles?.tipo?.toLowerCase();
          return rName === 'admin' || ur.role_id === 1;
        }) || user.rol === 'admin';
      } catch (err) {
        isAdmin = user.rol === 'admin';
      }

      if (!roleId) {
        roleId = isAdmin ? 1 : 2;
      }

      user.role_id = roleId;
      user.role_name = roleName;

      // Cargar y aplicar permisología completa desde 'roles_permision'
      try {
        await permissionService.loadPermissionsForUser(user.id, roleId);
      } catch (permErr) {
        console.warn('[AuthModel] Aviso al cargar permisos del rol:', permErr);
      }

      // Resolver y validar consultorio según Consultorio_ID del usuario
      const rawUserConsultorio = user.consultorio_id ?? user.Consultorio_ID ?? null;
      const isConsultorioEmpty = rawUserConsultorio === null || rawUserConsultorio === undefined || String(rawUserConsultorio).trim() === '' || Number(rawUserConsultorio) === 0;

      let finalConsultorio = selectedConsultorio;

      if (!isConsultorioEmpty) {
        // El usuario está asignado a un consultorio específico
        const allowedIds = String(rawUserConsultorio).split(',').map(s => s.trim());
        const allConsultorios = await consultorioModel.getAll();
        const allowedConsultorios = allConsultorios.filter(c => allowedIds.includes(String(c.id)));

        if (allowedConsultorios.length > 0) {
          // Si el consultorio seleccionado no pertenece a sus autorizados, forzar el asignado
          if (!finalConsultorio || !allowedIds.includes(String(finalConsultorio.id))) {
            finalConsultorio = allowedConsultorios[0];
          }
        }
      } else {
        // En caso de que el campo Consultorio_ID esté vacío, tiene acceso a todos los consultorios
        if (!finalConsultorio) {
          const allConsultorios = await consultorioModel.getAll();
          finalConsultorio = allConsultorios[0] || { id: 1, nombre: 'Sede Principal' };
        }
      }

      user.user_consultorio_id = !isConsultorioEmpty ? Number(rawUserConsultorio) : null;
      return this.saveSession(user, isAdmin, finalConsultorio);
    }

    // Modo local / demo
    const current = this.getCurrentUser();
    if (current && (current.mail.toLowerCase() === cleanId || current.nombre.toLowerCase() === cleanId)) {
      if (selectedConsultorio) this.setActiveConsultorio(selectedConsultorio);
      return current;
    }

    // Usuario demo por defecto
    const demoUser = {
      id: 'demo-user-1',
      nombre: 'Usuario Demo',
      mail: cleanId.includes('@') ? cleanId : `${cleanId}@ejemplo.com`,
      rol: 'usuario',
      activo: true
    };
    return this.saveSession(demoUser, false, selectedConsultorio);
  }
};
