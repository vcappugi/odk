/**
 * Controlador de Autenticación (Auth Controller)
 * Conecta los eventos de usuario con authModel, validaciones y actualización visual del estado de sesión.
 */
import { authModel } from './authModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { notificationService } from '../../services/notificationService.js';
import { adminController } from '../admin/adminController.js';
import { permissionService } from '../../services/permissionService.js';
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

    // Abrir diálogo de cambio rápido de sede
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-open-switch-consultorio')) {
        await this.openSwitchConsultorioModal();
      }
    });

    // Formulario de cambio de sede
    const switchForm = $('#form-switch-consultorio');
    if (switchForm) {
      switchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSwitchConsultorio();
      });
    }
  },

  async openModal(mode = 'login') {
    const dialog = $('#auth-dialog');
    if (!dialog) return;

    this.switchTab(mode);

    if (mode === 'login') {
      await this.loadConsultoriosSelect();
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Carga las sedes registradas en el selector del formulario de login
   */
  async loadConsultoriosSelect() {
    const select = $('#login-consultorio');
    if (!select) return;

    try {
      const consultorios = await consultorioModel.getAll();
      const active = authModel.getActiveConsultorio();

      if (!consultorios || consultorios.length === 0) {
        select.innerHTML = `
          <option value="1">🏢 Consultorio Principal (Por defecto)</option>
        `;
        return;
      }

      select.innerHTML = consultorios.map(c => `
        <option value="${c.id}" ${active && active.id === c.id ? 'selected' : ''}>
          🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}
        </option>
      `).join('');
    } catch (err) {
      console.warn('[AuthController] Error cargando consultorios en login:', err);
      select.innerHTML = `<option value="1">🏢 Consultorio Principal</option>`;
    }
  },

  /**
   * Abre modal para cambiar de sede con la sesión activa
   */
  async openSwitchConsultorioModal() {
    const dialog = $('#dialog-switch-consultorio');
    const select = $('#switch-consultorio-select');
    if (!dialog || !select) return;

    try {
      const consultorios = await consultorioModel.getAll();
      const current = authModel.getActiveConsultorio();

      if (!consultorios || consultorios.length === 0) {
        select.innerHTML = `<option value="1">🏢 Consultorio Principal</option>`;
      } else {
        select.innerHTML = consultorios.map(c => `
          <option value="${c.id}" ${current && current.id === c.id ? 'selected' : ''}>
            🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}
          </option>
        `).join('');
      }

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (err) {
      notificationService.error('Error al cargar consultorios.');
    }
  },

  /**
   * Procesa el cambio de sede activa
   */
  async handleSwitchConsultorio() {
    const select = $('#switch-consultorio-select');
    const dialog = $('#dialog-switch-consultorio');
    const consultorioId = select?.value;

    if (!consultorioId) return;

    try {
      const consultorios = await consultorioModel.getAll();
      const selected = consultorios.find(c => String(c.id) === String(consultorioId)) || {
        id: Number(consultorioId),
        nombre: 'Consultorio Sede'
      };

      authModel.setActiveConsultorio(selected);
      consultorioModel.setActiveConsultorio(selected);

      notificationService.success(`Sede activa cambiada a: ${selected.nombre}`);

      if (dialog) {
        if (typeof dialog.close === 'function') dialog.close();
        else dialog.removeAttribute('open');
      }

      this.updateUserInterface();
    } catch (err) {
      notificationService.error('No se pudo cambiar la sede.');
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
    const consultorioSelect = $('#login-consultorio');
    const consultorioId = consultorioSelect?.value;
    const submitBtn = $('#btn-submit-login');

    if (!identifier || !password) {
      notificationService.warning('Por favor completa todos los campos.');
      return;
    }

    if (!consultorioId) {
      notificationService.warning('Por favor selecciona el consultorio / sede de trabajo.');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Verificando...';

    try {
      // Obtener el objeto de consultorio seleccionado
      let selectedConsultorio = null;
      try {
        const consultorios = await consultorioModel.getAll();
        selectedConsultorio = consultorios.find(c => String(c.id) === String(consultorioId)) || {
          id: Number(consultorioId),
          nombre: consultorioSelect.options[consultorioSelect.selectedIndex]?.text?.replace('🏢 ', '') || 'Sede Principal'
        };
      } catch {
        selectedConsultorio = { id: Number(consultorioId) || 1, nombre: 'Sede Principal' };
      }

      const user = await authModel.login(identifier, password, selectedConsultorio);
      consultorioModel.setActiveConsultorio(selectedConsultorio);

      notificationService.success(`¡Bienvenido de nuevo, ${user.nombre || user.mail}! (Sede: ${selectedConsultorio.nombre})`);
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
      const activeConsultorio = consultorioModel.getActiveConsultorio() || user.consultorio;
      const sedeNombre = activeConsultorio?.nombre || user.consultorio_nombre || 'Sede Principal';

      // Usuario autenticado con sede activa visible y conmutable
      mainUserDisplay.innerHTML = `
        <div class="user-session-view cluster" data-gap="xs" data-align="center">
          <div class="user-session-details cluster" data-gap="xs" data-align="center">
            <!-- Badge y selector de consultorio activo -->
            <div class="user-consultorio-pill cluster" data-gap="2xs" data-align="center" title="Sede de atención activa: ${sedeNombre}">
              <span class="badge badge-sede" data-paint="primary" style="font-size: 0.76rem; font-weight: 600;">
                🏢 ${sedeNombre}
              </span>
              <button type="button" id="btn-open-switch-consultorio" class="button btn-switch-sede" data-variant="ghost" data-size="xs" title="Cambiar consultorio activo" style="padding: 2px 6px; font-size: 0.74rem;">
                🔄
              </button>
            </div>

            <span class="user-session-name">👤 ${user.nombre}</span>
            <span class="badge" data-paint="neutral">${user.rol || 'usuario'}</span>
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

    // Actualizar visibilidad y controles según permisología del rol (roles_permision)
    if (permissionService && typeof permissionService.applyUIPermissions === 'function') {
      permissionService.applyUIPermissions();
    }

    // Actualizar visibilidad de botón Configuración (solo para rol admin en user_roles)
    if (adminController && typeof adminController.updateVisibility === 'function') {
      adminController.updateVisibility();
    }
  }
};
