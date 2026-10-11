import { defineConfig } from 'vite';

export default defineConfig({
  // Base relativa para permitir ejecucion tanto en XAMPP (ej. http://localhost/odk/)
  // como en el contenedor WebView de Android (Capacitor)
  base: './',
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
});
