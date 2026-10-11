/**
 * Controlador de Autenticación (Auth Controller)
 * Conecta los eventos de usuario con authModel, validaciones y actualización visual del estado de sesión.
 */
import { authModel } from './authModel.js';
import { notificationService } from '../../services/notificationService.js';
import { adminController } from '../admin/adminController.js';
import { $, $$ } from '../../utils/dom.js';

export const authController = {
  init() {
    this.bindEvents();
    this.updateUserInterface();
  },

  bindEvents() {
    // Abrir modal de Login
    document.addEventListener('click', (e) => {
      if (
        e.target.closest('#btn-open-login-modal') ||
        e.target.closest('#btn-hero-login') ||
        e.target.closest('.btn-auth-trigger')
      ) {
        this.openModal('login');
      }
    });

    // Abrir modal en modo Registro
    document.addEventListener('click', (e) => {
      if (
        e.target.closest('#btn-open-register-modal') ||
        e.target.closest('#btn-hero-register')
      ) {
        this.openModal('register');
      }
    });

    // Cerrar modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-auth-dialog')) {
        this.closeModal();
      }
    });

    // Cambio de pestañas
    document.addEventListener('click', (e) => {
      if (e.target.closest('#tab-btn-login') || e.target.closest('#link-go-to-login')) {
        e.preventDefault();
        this.switchTab('login');
      }
      if (e.target.closest('#tab-btn-register') || e.target.closest('#link-go-to-register')) {
        e.preventDefault();
        this.switchTab('register');
      }
    });

    // Botones de mostrar/ocultar contraseña
    document.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.btn-toggle-password');
      if (toggleBtn) {
        const targetId = toggleBtn.getAttribute('data-target');
        const input = $(`#${targetId}`);
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            toggleBtn.textContent = '🙈';
          } else {
            input.type = 'password';
            toggleBtn.textContent = '👁️';
          }
        }
      }
    });

    // Submit de Login
    const loginForm = $('#login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    // Submit de Auto-Registro
    const registerForm = $('#register-form');
    if (registerForm) {
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleRegister();
      });
    }

    // Cerrar sesión con el botón 'Sesión Activa' y activar login
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-toggle-session') || e.target.closest('#btn-logout')) {
        this.handleLogoutAndOpenLogin();
      }
    });
  },

  openModal(mode = 'login') {
    const dialog = $('#auth-dialog');
    if (!dialog) return;

    this.switchTab(mode);

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  closeModal() {
    const dialog = $('#auth-dialog');
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  },

  switchTab(tab) {
    const loginBtn = $('#tab-btn-login');
    const registerBtn = $('#tab-btn-register');
    const loginForm = $('#login-form');
    const registerForm = $('#register-form');
    const title = $('#auth-modal-title');

    if (tab === 'login') {
      loginBtn?.setAttribute('data-paint', 'primary');
      loginBtn?.removeAttribute('data-variant');
      loginBtn?.classList.add('active');

      registerBtn?.setAttribute('data-variant', 'ghost');
      registerBtn?.removeAttribute('data-paint');
      registerBtn?.classList.remove('active');

      if (loginForm) loginForm.style.display = 'flex';
      if (registerForm) registerForm.style.display = 'none';
      if (title) title.textContent = 'Iniciar Sesión';
    } else {
      registerBtn?.setAttribute('data-paint', 'success');
      registerBtn?.removeAttribute('data-variant');
      registerBtn?.classList.add('active');

      loginBtn?.setAttribute('data-variant', 'ghost');
      loginBtn?.removeAttribute('data-paint');
      loginBtn?.classList.remove('active');

      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'flex';
      if (title) title.textContent = 'Auto-Registro de Usuario';
    }
  },

  async handleLogin() {
    const identifier = $('#login-identifier').value.trim();
    const password = $('#login-password').value;
    const submitBtn = $('#btn-submit-login');

    if (!identifier || !password) {
      notificationService.warning('Por favor completa todos los campos.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verificando...';

    try {
      const user = await authModel.login(identifier, password);
      notificationService.success(`¡Bienvenido de nuevo, ${user.nombre || user.mail}!`);
      this.closeModal();
      this.updateUserInterface();
    } catch (err) {
      notificationService.error(err.message || 'Error al iniciar sesión.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
  },

  async handleRegister() {
    const nombre = $('#reg-nombre').value.trim();
    const mail = $('#reg-mail').value.trim();
    const ci = $('#reg-ci').value.trim();
    const telefono = $('#reg-telefono').value.trim();
    const password = $('#reg-password').value;
    const confirm = $('#reg-password-confirm').value;
    const submitBtn = $('#btn-submit-register');

    if (!nombre || !mail || !password) {
      notificationService.warning('Nombre, correo y contraseña son obligatorios.');
      return;
    }

    if (password !== confirm) {
      notificationService.warning('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      notificationService.warning('La contraseña debe tener mínimo 6 caracteres.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Encriptando y registrando...';

    try {
      const user = await authModel.register({ nombre, mail, clave: password, ci, telefono });
      notificationService.success(`¡Cuenta creada con éxito! Bienvenido, ${user.nombre}. Tu clave ha sido encriptada con bcrypt.`);
      this.closeModal();
      this.updateUserInterface();
    } catch (err) {
      notificationService.error(err.message || 'Error al registrar usuario.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Registrar Cuenta';
    }
  },

  handleLogout() {
    authModel.logout();
    notificationService.info('Has cerrado la sesión.');
    this.updateUserInterface();
  },

  handleLogoutAndOpenLogin() {
    authModel.logout();
    notificationService.info('Sesión cerrada.');
    this.updateUserInterface();
    // En caso de sesión cerrada, activa el login para iniciar sesión
    this.openModal('login');
  },

  updateUserInterface() {
    const user = authModel.getCurrentUser();
    const mainUserDisplay = $('#main-user-display');

    if (!mainUserDisplay) return;

    if (user) {
      // Usuario autenticado (sin iniciales, diseño limpio y directo)
      mainUserDisplay.innerHTML = `
        <div class="user-session-view cluster" data-gap="xs" data-align="center">
          <div class="user-session-details cluster" data-gap="xs" data-align="center">
            <span class="user-session-name">👤 ${user.nombre}</span>
            <span class="badge" data-paint="primary">${user.rol || 'usuario'}</span>
            <!-- Botón interactivo que dice Sesión Activa y cierra sesión al hacer clic -->
            <button type="button" id="btn-toggle-session" class="button btn-session-toggle" data-paint="success" title="Haz clic para cerrar sesión">
              <span class="session-text-active">🟢 Sesión Activa</span>
              <span class="session-text-hover">🚪 Cerrar Sesión</span>
            </button>
          </div>
        </div>
      `;
    } else {
      // Sin autenticar: botones que activan el login o registro
      mainUserDisplay.innerHTML = `
        <div class="portal-buttons-grid">
          <button type="button" id="btn-hero-login" class="button btn-portal-primary" data-paint="primary">
            <span class="btn-icon">🔑</span>
            <span>Iniciar Sesión</span>
          </button>
          <button type="button" id="btn-hero-register" class="button btn-portal-secondary" data-variant="outlined">
            <span class="btn-icon">📝</span>
            <span>Auto-Registro</span>
          </button>
        </div>
      `;
    }

    // Actualizar visibilidad de botón Configuración (solo para rol admin en user_roles)
    if (adminController && typeof adminController.updateVisibility === 'function') {
      adminController.updateVisibility();
    }
  }
};
