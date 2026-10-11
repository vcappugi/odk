/**
 * Servicio Cliente de Supabase
 * Maneja la inicialización del SDK de Supabase y el estado de la conexión.
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { APP_CONSTANTS } from '../config/constants.js';

let supabase = null;
let connectionStatus = {
  status: APP_CONSTANTS.STATUS.CONNECTING,
  message: 'Inicializando conexión...',
  isLive: false
};

// Inicialización del cliente Supabase si hay credenciales válidas
if (env.supabaseUrl && env.supabaseAnonKey) {
  try {
    supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (error) {
    console.error('[SupabaseClient] Error inicializando cliente:', error);
  }
}

/**
 * Comprueba el estado de la conexión a Supabase
 * @returns {Promise<{status: string, message: string, isLive: boolean}>}
 */
export async function checkConnection() {
  if (!env.isSupabaseConfigured()) {
    connectionStatus = {
      status: APP_CONSTANTS.STATUS.DEMO,
      message: 'Modo Demostración activo. Configura tus claves reales en el archivo .env para sincronizar con la nube.',
      isLive: false
    };
    return connectionStatus;
  }

  if (!supabase) {
    connectionStatus = {
      status: APP_CONSTANTS.STATUS.ERROR,
      message: 'No se pudo instanciar el cliente de Supabase. Revisa los parámetros en .env.',
      isLive: false
    };
    return connectionStatus;
  }

  try {
    // Intento de consulta leve a la tabla configurada o a rpc para verificar conectividad
    const { error } = await supabase
      .from(env.supabaseTable)
      .select('count', { count: 'exact', head: true });

    if (error) {
      // Si el error es 404/PGRST204/PGRST205 (tabla no existe aun), la conexion funciona pero falta crear la tabla
      if (
        error.code === '42P01' ||
        error.code === 'PGRST204' ||
        error.code === 'PGRST205' ||
        error.message?.includes('does not exist') ||
        error.message?.includes('schema cache')
      ) {
        connectionStatus = {
          status: APP_CONSTANTS.STATUS.CONNECTED,
          message: `¡Conexión con Supabase verificada con éxito! Para guardar datos en la nube, crea la tabla '${env.supabaseTable}' ejecutando el script SQL que se muestra abajo.`,
          isLive: true
        };
      } else {
        connectionStatus = {
          status: APP_CONSTANTS.STATUS.ERROR,
          message: `Error de Supabase: ${error.message} (${error.code || 'Desconocido'})`,
          isLive: false
        };
      }
    } else {
      connectionStatus = {
        status: APP_CONSTANTS.STATUS.CONNECTED,
        message: 'Conectado a Supabase en tiempo real.',
        isLive: true
      };
    }
  } catch (err) {
    connectionStatus = {
      status: APP_CONSTANTS.STATUS.ERROR,
      message: `Error de red al conectar con Supabase: ${err.message}`,
      isLive: false
    };
  }

  return connectionStatus;
}

export function getSupabase() {
  return supabase;
}

export { supabase };

export function getConnectionStatus() {
  return connectionStatus;
}
