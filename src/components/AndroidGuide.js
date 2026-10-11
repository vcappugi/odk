/**
 * Componente Guía de Desarrollo Android
 * Proporciona instrucciones y comandos rápidos para el flujo de trabajo con Capacitor y Android Studio.
 */

export function renderAndroidGuide() {
  return `
    <section id="mobile-guide" class="center" data-max="xl" aria-labelledby="android-heading">
      <div class="box guide-card" data-surface="raised" data-border>
        <div class="stack" data-gap="md">
          <div class="cluster" data-gap="sm" data-align="center">
            <span class="android-icon">🤖</span>
            <div>
              <h2 id="android-heading">Flujo de Desarrollo Android Nativo</h2>
              <p class="lede">Tu aplicación web responsive se sincroniza directamente con el proyecto nativo de Android mediante <strong>Capacitor</strong>.</p>
            </div>
          </div>

          <div class="grid" data-min="sm" data-columns="3" data-gap="md">
            <div class="card box step-card" data-surface="sunken" data-border>
              <div class="stack" data-gap="xs">
                <span class="badge" data-paint="primary">Paso 1</span>
                <h4>Compilar y Sincronizar</h4>
                <p>Genera la compilación web optimizada y la sincroniza con el proyecto Android:</p>
                <code class="command-box">npm run cap:sync</code>
              </div>
            </div>

            <div class="card box step-card" data-surface="sunken" data-border>
              <div class="stack" data-gap="xs">
                <span class="badge" data-paint="secondary">Paso 2</span>
                <h4>Abrir en Android Studio</h4>
                <p>Abre el entorno nativo para depurar, probar en emulador o firmar el APK/AAB:</p>
                <code class="command-box">npm run cap:open</code>
              </div>
            </div>

            <div class="card box step-card" data-surface="sunken" data-border>
              <div class="stack" data-gap="xs">
                <span class="badge" data-paint="success">Paso 3</span>
                <h4>Ejecutar en Dispositivo</h4>
                <p>Lanza la app directamente en un celular Android conectado por USB o emulador:</p>
                <code class="command-box">npm run cap:run</code>
              </div>
            </div>
          </div>

          <div class="alert" data-paint="neutral">
            <p>💡 <strong>Tip Android:</strong> Las llamadas a Supabase funcionan tanto en emulador como en dispositivos físicos ya que se comunican mediante HTTPS cifrado. Asegúrate de tener conexión a Internet activa en el dispositivo.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
