/**
 * Vista de Autenticación (Auth View)
 * Renderiza la ventana modal de Login y Auto-Registro con estilos Foundation Yeti CSS.
 */

export function renderAuthModal() {
  return `
    <dialog id="auth-dialog" class="dialog box auth-dialog" data-surface="raised" data-border>
      <div class="stack" data-gap="md">
        <!-- Encabezado de la ventana -->
        <div class="cluster auth-modal-header" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="auth-icon-badge">🦷</span>
            <h3 id="auth-modal-title">ODONTOKRIS — Acceso</h3>
          </div>
          <button type="button" class="button btn-close-auth-dialog" data-variant="ghost" aria-label="Cerrar modal">&times;</button>
        </div>

        <!-- Pestañas de cambio (Login / Auto-Registro) -->
        <div class="cluster auth-tabs" data-gap="xs" role="tablist">
          <button type="button" id="tab-btn-login" class="button auth-tab-btn active" data-paint="primary" role="tab" aria-selected="true">
            🔑 Iniciar Sesión
          </button>
          <button type="button" id="tab-btn-register" class="button auth-tab-btn" data-variant="ghost" role="tab" aria-selected="false">
            📝 Auto-Registro
          </button>
        </div>

        <!-- FORMULARIO 1: INICIAR SESIÓN -->
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
            <p class="auth-switch-text">
              ¿No tienes cuenta? <a href="#" id="link-go-to-register">Regístrate aquí</a>
            </p>
          </div>
        </form>

        <!-- FORMULARIO 2: AUTO-REGISTRO -->
        <form id="register-form" class="stack auth-form" data-gap="sm" style="display: none;">
          <div class="field stack" data-gap="2xs">
            <label for="reg-nombre"><strong>Nombre Completo:</strong></label>
            <input type="text" id="reg-nombre" name="nombre" required placeholder="Ej. Juan Pérez" class="form-input" autocomplete="name">
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="reg-mail"><strong>Correo Electrónico (Usuario):</strong></label>
            <input type="email" id="reg-mail" name="mail" required placeholder="usuario@correo.com" class="form-input" autocomplete="email">
          </div>

          <div class="grid" data-min="xs" data-columns="2" data-gap="sm">
            <div class="field stack" data-gap="2xs">
              <label for="reg-ci">Cédula / CI (opcional):</label>
              <input type="text" id="reg-ci" name="ci" placeholder="V-12345678" class="form-input">
            </div>

            <div class="field stack" data-gap="2xs">
              <label for="reg-telefono">Teléfono (opcional):</label>
              <input type="tel" id="reg-telefono" name="telefono" placeholder="+58 412 1234567" class="form-input">
            </div>
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="reg-password"><strong>Contraseña:</strong></label>
            <div class="password-input-wrapper">
              <input type="password" id="reg-password" name="password" required minlength="6" placeholder="Mínimo 6 caracteres" class="form-input" autocomplete="new-password">
              <button type="button" class="btn-toggle-password" data-target="reg-password" aria-label="Mostrar contraseña">👁️</button>
            </div>
            <small class="field-hint">🛡️ Se encriptará con <strong>bcrypt</strong> antes de guardarse en Supabase.</small>
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="reg-password-confirm"><strong>Confirmar Contraseña:</strong></label>
            <div class="password-input-wrapper">
              <input type="password" id="reg-password-confirm" name="password_confirm" required minlength="6" placeholder="Repite tu contraseña" class="form-input" autocomplete="new-password">
              <button type="button" class="btn-toggle-password" data-target="reg-password-confirm" aria-label="Mostrar contraseña">👁️</button>
            </div>
          </div>

          <div class="stack" data-gap="xs" style="margin-top: 0.5rem;">
            <button type="submit" id="btn-submit-register" class="button" data-paint="success" style="width: 100%;">
              Registrar Cuenta
            </button>
            <p class="auth-switch-text">
              ¿Ya tienes cuenta? <a href="#" id="link-go-to-login">Inicia sesión</a>
            </p>
          </div>
        </form>
      </div>
    </dialog>
  `;
}
