/**
 * Módulo de Configuración de Entorno
 * Carga y valida las variables definidas en .env mediante Vite (import.meta.env)
 */

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  appName: import.meta.env.VITE_APP_NAME || 'ODK Modular App',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  supabaseTable: import.meta.env.VITE_SUPABASE_TABLE || 'records',
  googleScriptDriveUrl: import.meta.env.VITE_GOOGLE_SCRIPT_DRIVE_URL || '',

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
