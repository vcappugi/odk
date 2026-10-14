/**
 * Vista de Autenticación (Auth View)
 * Renderiza la ventana modal de Login con estilos Foundation Yeti CSS.
 */

export function renderAuthModal() {
  return `
    <dialog id="auth-dialog" class="dialog box auth-dialog" data-surface="raised" data-border>
      <div class="stack" data-gap="md">
        <!-- Encabezado de la ventana -->
        <div class="cluster auth-modal-header" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="auth-icon-badge">🦷</span>
            <h3 id="auth-modal-title">ODONTOKRIS — Iniciar Sesión</h3>
          </div>
          <button type="button" class="button btn-close-auth-dialog" data-variant="ghost" aria-label="Cerrar modal">&times;</button>
        </div>

        <!-- FORMULARIO: INICIAR SESIÓN -->
        <form id="login-form" class="stack auth-form" data-gap="sm">
          <div class="field stack" data-gap="2xs">
            <label for="login-identifier"><strong>Usuario o Correo:</strong></label>
            <input type="text" id="login-identifier" name="identifier" required placeholder="correo@ejemplo.com o nombre" class="form-input" autocomplete="username">
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="login-password"><strong>Contraseña:</strong></label>
            <div class="password-input-wrapper">
              <input type="password" id="login-password" name="password" required placeholder="••••••••" class="form-input" autocomplete="current-password">
              <button type="button" class="btn-toggle-password" data-target="login-password" aria-label="Mostrar contraseña">👁️</button>
            </div>
          </div>

          <!-- Selección obligatoria de Consultorio / Sede para filtrar todos los datos -->
          <div class="field stack" data-gap="2xs">
            <label for="login-consultorio"><strong>🏢 Consultorio / Sede de Trabajo:</strong></label>
            <select id="login-consultorio" name="consultorio_id" class="form-input form-select" required>
              <option value="">Cargando sedes disponibles...</option>
            </select>
            <small id="login-consultorio-hint" class="field-hint" style="font-size: 0.74rem; opacity: 0.85; transition: all 0.2s ease;">
              📌 Ingresa tu usuario o correo arriba para cargar tus sedes autorizadas.
            </small>
          </div>

          <div class="cluster" data-justify="between" data-align="center" style="font-size: 0.85rem;">
            <label class="cluster" data-gap="2xs" data-align="center" style="cursor: pointer;">
              <input type="checkbox" id="remember-me" checked>
              <span>Recordar sesión</span>
            </label>
            <span class="security-badge" title="La clave se valida contra hash encriptado">🔒 Encriptada</span>
          </div>

          <div class="stack" data-gap="xs" style="margin-top: 0.5rem;">
            <button type="submit" id="btn-submit-login" class="button" data-paint="primary" style="width: 100%;">
              Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </dialog>

    <!-- Modal Rápido: Cambiar de Consultorio / Sede Activa -->
    <dialog id="dialog-switch-consultorio" class="dialog custom-modal" aria-labelledby="switch-consultorio-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">🏢</span>
            <div>
              <h3 id="switch-consultorio-title" style="margin: 0; font-size: 1.1rem;">Cambiar Sede / Consultorio</h3>
              <small style="opacity: 0.75; font-size: 0.76rem;">Filtra la información de pacientes y citas</small>
            </div>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <form id="form-switch-consultorio" class="stack" data-gap="sm">
          <div class="field stack" data-gap="2xs">
            <label for="switch-consultorio-select"><strong>Selecciona la sede de trabajo:</strong></label>
            <select id="switch-consultorio-select" class="input form-select" required></select>
          </div>

          <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
            <button type="button" class="button btn-close-modal" data-variant="ghost">Cancelar</button>
            <button type="submit" id="btn-submit-switch-consultorio" class="button" data-paint="primary">Aplicar Cambio</button>
          </footer>
        </form>
      </div>
    </dialog>
  `;
}
