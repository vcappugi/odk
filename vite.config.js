import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno de archivos .env y de las variables del sistema (Vercel / CI / process.env)
  const env = loadEnv(mode, process.cwd(), '');

  // Supabase URL: revisa variables de Vercel (process.env) con o sin prefijo VITE_, y .env
  const supabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    env.SUPABASE_URL ||
    'https://jzaowaqnxafdltintoov.supabase.co';

  // Supabase Anon Key: revisa variables de Vercel (process.env) con o sin prefijo VITE_, y .env
  const supabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    'sb_publishable_SSWyLHhz_9sgHbV5BHodNA_GptZBmVf';

  // Google Script / Webhook URL para Google Drive:
  const googleScriptDriveUrl =
    process.env.VITE_GOOGLE_SCRIPT_DRIVE_URL ||
    process.env.GOOGLE_SCRIPT_DRIVE_URL ||
    process.env.VITE_GOOGLE_WEBHOOK_URL ||
    process.env.GOOGLE_WEBHOOK_URL ||
    process.env.VITE_GOOGLE_DRIVE_WEBHOOK_URL ||
    process.env.GOOGLE_DRIVE_WEBHOOK_URL ||
    env.VITE_GOOGLE_SCRIPT_DRIVE_URL ||
    env.GOOGLE_SCRIPT_DRIVE_URL ||
    env.VITE_GOOGLE_WEBHOOK_URL ||
    env.GOOGLE_WEBHOOK_URL ||
    env.VITE_GOOGLE_DRIVE_WEBHOOK_URL ||
    env.GOOGLE_DRIVE_WEBHOOK_URL ||
    '';

  const appName =
    process.env.VITE_APP_NAME ||
    process.env.APP_NAME ||
    env.VITE_APP_NAME ||
    env.APP_NAME ||
    'ODONTOKRIS';

  const appTable =
    process.env.VITE_SUPABASE_TABLE ||
    process.env.SUPABASE_TABLE ||
    env.VITE_SUPABASE_TABLE ||
    env.SUPABASE_TABLE ||
    'records';

  const isVercel = Boolean(process.env.VERCEL);

  return {
    // Si corre en Vercel usa '/' para enrutamiento limpio; si corre en XAMPP o Android usa './'
    base: isVercel ? '/' : './',
    // Permitir prefijos de Vercel, Supabase y Google además del estándar VITE_
    envPrefix: ['VITE_', 'SUPABASE_', 'GOOGLE_', 'VERCEL_'],
    define: {
      '__INJECTED_SUPABASE_URL__': JSON.stringify(supabaseUrl),
      '__INJECTED_SUPABASE_ANON_KEY__': JSON.stringify(supabaseAnonKey),
      '__INJECTED_GOOGLE_DRIVE_URL__': JSON.stringify(googleScriptDriveUrl),
      '__INJECTED_APP_NAME__': JSON.stringify(appName),
      '__INJECTED_SUPABASE_TABLE__': JSON.stringify(appTable)
    },
    server: {
      port: 3000,
      open: false,
      host: true
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      target: 'es2022'
    }
  };
});
