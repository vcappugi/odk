/**
 * Modelo de Autenticación (Auth Model)
 * Gestiona el inicio de sesión y auto-registro interactuando con la tabla 'usuario' de Supabase.
 * La contraseña se encripta mediante bcrypt (hash + salt) antes de persistir en base de datos.
 */
import bcrypt from 'bcryptjs';
import { getSupabase, getConnectionStatus } from '../../services/supabaseClient.js';
import { APP_CONSTANTS } from '../../config/constants.js';

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
   */
  saveSession(user) {
    if (!user) return;
    const sessionData = {
      id: user.id,
      nombre: user.nombre,
      mail: user.mail,
      telefono: user.telefono || '',
      ci: user.ci || '',
      rol: user.rol || 'usuario',
      activo: user.activo ?? true,
      logged_at: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
    return sessionData;
  },

  /**
   * Cierra la sesión activa
   */
  logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
   * Compara la clave ingresada contra el hash bcrypt guardado en Supabase.
   */
  async login(identificador, clave) {
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

      return this.saveSession(user);
    }

    // Modo local / demo
    const current = this.getCurrentUser();
    if (current && (current.mail.toLowerCase() === cleanId || current.nombre.toLowerCase() === cleanId)) {
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
    return this.saveSession(demoUser);
  }
};
