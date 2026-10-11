/**
 * Módulo de Configuración de Entorno
 * Carga y valida las variables definidas en Vercel, .env o inyectadas por Vite.
 */

// Helper para resolver variables desde import.meta.env (Vite), variables inyectadas o fallback
function resolveEnv(keys, injected, fallback = '') {
  // 1. Revisar import.meta.env (Vite / Vercel Environment Variables)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    for (const key of keys) {
      const val = import.meta.env[key];
      if (val && typeof val === 'string' && val.trim() !== '') {
        return val.trim();
      }
    }
  }

  // 2. Revisar valor inyectado en tiempo de compilación por Vite / Vercel
  if (typeof injected === 'string' && injected.trim() !== '') {
    return injected.trim();
  }

  // 3. Fallback seguro
  return fallback;
}

export const env = {
  // Parámetros de conexión a Supabase (compatibles con Vercel y Vite)
  supabaseUrl: resolveEnv(
    ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'],
    typeof __INJECTED_SUPABASE_URL__ !== 'undefined' ? __INJECTED_SUPABASE_URL__ : '',
    'https://jzaowaqnxafdltintoov.supabase.co'
  ),

  supabaseAnonKey: resolveEnv(
    ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    typeof __INJECTED_SUPABASE_ANON_KEY__ !== 'undefined' ? __INJECTED_SUPABASE_ANON_KEY__ : '',
    'sb_publishable_SSWyLHhz_9sgHbV5BHodNA_GptZBmVf'
  ),

  appName: resolveEnv(
    ['VITE_APP_NAME', 'APP_NAME'],
    typeof __INJECTED_APP_NAME__ !== 'undefined' ? __INJECTED_APP_NAME__ : '',
    'ODONTOKRIS'
  ),

  appEnv: resolveEnv(
    ['VITE_APP_ENV', 'VERCEL_ENV', 'NODE_ENV'],
    '',
    'development'
  ),

  appVersion: resolveEnv(
    ['VITE_APP_VERSION', 'APP_VERSION'],
    '',
    '1.0.0'
  ),

  supabaseTable: resolveEnv(
    ['VITE_SUPABASE_TABLE', 'SUPABASE_TABLE'],
    typeof __INJECTED_SUPABASE_TABLE__ !== 'undefined' ? __INJECTED_SUPABASE_TABLE__ : '',
    'records'
  ),

  // Webhook de Google Apps Script para Google Drive (soporta múltiples nomenclaturas en Vercel)
  googleScriptDriveUrl: resolveEnv(
    [
      'VITE_GOOGLE_SCRIPT_DRIVE_URL',
      'GOOGLE_SCRIPT_DRIVE_URL',
      'VITE_GOOGLE_WEBHOOK_URL',
      'GOOGLE_WEBHOOK_URL',
      'VITE_GOOGLE_DRIVE_WEBHOOK_URL',
      'GOOGLE_DRIVE_WEBHOOK_URL'
    ],
    typeof __INJECTED_GOOGLE_DRIVE_URL__ !== 'undefined' ? __INJECTED_GOOGLE_DRIVE_URL__ : '',
    ''
  ),

  /**
   * Verifica si las credenciales de Supabase están configuradas con valores reales
   * y no con los valores de ejemplo por defecto.
   */
  isSupabaseConfigured() {
    return (
      Boolean(this.supabaseUrl) &&
      Boolean(this.supabaseAnonKey) &&
      !this.supabaseUrl.includes('xyzcompany.supabase.co') &&
      !this.supabaseUrl.includes('your-project-id') &&
      !this.supabaseAnonKey.includes('example_anon_key')
    );
  }
};
