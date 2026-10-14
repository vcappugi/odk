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
        this.openModal();
      }
    });

    // Cerrar modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-auth-dialog')) {
        this.closeModal();
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

    // Actualizar dinámicamente los consultorios permitidos según el usuario ingresado
    let debounceTimer = null;
    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'login-identifier') {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          this.loadConsultoriosSelect(e.target.value);
        }, 220);
      }
    });

    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'login-identifier') {
        clearTimeout(debounceTimer);
        this.loadConsultoriosSelect(e.target.value);
      }
    });

    // Reaccionar a cambios globales de autenticación
    window.addEventListener('auth:change', () => {
      this.updateUserInterface();
    });
  },

  async openModal() {
    const dialog = $('#auth-dialog');
    if (!dialog) return;

    const currentId = $('#login-identifier')?.value || '';
    await this.loadConsultoriosSelect(currentId);

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Carga los consultorios a los que el usuario tiene acceso según el campo Consultorio_ID.
   * En caso de que Consultorio_ID esté vacío, muestra todos los consultorios disponibles.
   * Si tiene un consultorio asignado específico, muestra únicamente ese consultorio y lo auto-selecciona.
   * @param {string} identifier (opcional, usuario o correo)
   */
  async loadConsultoriosSelect(identifier = '') {
    const select = $('#login-consultorio');
    const hintEl = $('#login-consultorio-hint');
    if (!select) return;

    const cleanId = (identifier || $('#login-identifier')?.value || '').trim();

    try {
      const { consultorios, hasFullAccess, userFound } =
        await authModel.getConsultoriosForIdentifier(cleanId);

      const active = authModel.getActiveConsultorio();

      if (!consultorios || consultorios.length === 0) {
        select.innerHTML = `
          <option value="">⚠️ No hay consultorios autorizados</option>
        `;
        select.disabled = true;
        if (hintEl) {
          hintEl.textContent = '⚠️ No se encontraron sedes registradas para este usuario.';
          hintEl.style.color = '#ef4444';
        }
        return;
      }

      select.disabled = false;

      if (userFound && !hasFullAccess) {
        // Usuario con consultorio restringido específicamente
        select.innerHTML = consultorios.map(c => `
          <option value="${c.id}" selected>
            🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}
          </option>
        `).join('');

        if (hintEl) {
          const sedeNombre = consultorios[0]?.nombre || 'Sede asignada';
          hintEl.innerHTML = `🔒 <strong>Sede asignada:</strong> Tu usuario tiene acceso exclusivo a <em>${sedeNombre}</em>.`;
          hintEl.style.color = 'var(--yeti-color-primary, #0284c7)';
        }
      } else if (userFound && hasFullAccess) {
        // Usuario con Consultorio_ID vacío (acceso a todos los consultorios)
        select.innerHTML = consultorios.map(c => `
          <option value="${c.id}" ${active && active.id === c.id ? 'selected' : ''}>
            🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}
          </option>
        `).join('');

        if (hintEl) {
          hintEl.innerHTML = `🌐 <strong>Acceso global:</strong> Tu cuenta tiene acceso a todas las sedes. Selecciona la sede para esta sesión.`;
          hintEl.style.color = '#10b981';
        }
      } else {
        // Aún no se ha verificado el usuario (campo vacío o mientras escribe)
        select.innerHTML = consultorios.map(c => `
          <option value="${c.id}" ${active && active.id === c.id ? 'selected' : ''}>
            🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}
          </option>
        `).join('');

        if (hintEl) {
          hintEl.innerHTML = `📌 Ingresa tu usuario o correo arriba para cargar tus sedes autorizadas.`;
          hintEl.style.color = '';
        }
      }
    } catch (err) {
      console.warn('[AuthController] Error cargando consultorios en login:', err);
      select.innerHTML = `<option value="1">🏢 Consultorio Principal</option>`;
    }
  },

  /**
   * Abre modal para cambiar de sede con la sesión activa,
   * respetando si el usuario tiene asignada una sede específica o acceso a todas.
   */
  async openSwitchConsultorioModal() {
    const dialog = $('#dialog-switch-consultorio');
    const select = $('#switch-consultorio-select');
    if (!dialog || !select) return;

    try {
      const user = authModel.getCurrentUser();
      const rawUserConsultorio = user?.user_consultorio_id ?? user?.Consultorio_ID ?? null;
      const isConsultorioEmpty = rawUserConsultorio === null || rawUserConsultorio === undefined || String(rawUserConsultorio).trim() === '' || Number(rawUserConsultorio) === 0;

      const allConsultorios = await consultorioModel.getAll();
      const current = authModel.getActiveConsultorio();

      let consultorios = allConsultorios;
      if (!isConsultorioEmpty) {
        const allowedIds = String(rawUserConsultorio).split(',').map(s => s.trim());
        consultorios = allConsultorios.filter(c => allowedIds.includes(String(c.id)));
      }

      if (!isConsultorioEmpty && consultorios.length <= 1) {
        const sedeName = consultorios[0]?.nombre || 'tu consultorio asignado';
        notificationService.info(`Tu cuenta está asignada exclusivamente a: ${sedeName}.`);
        return;
      }

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

  switchTab() {
    // La opción de auto-registro fue removida del modal
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
      const activeSede = user.consultorio || selectedConsultorio;
      consultorioModel.setActiveConsultorio(activeSede);

      notificationService.success(`¡Bienvenido de nuevo, ${user.nombre || user.mail}! (Sede: ${activeSede.nombre})`);
      this.closeModal();
      this.updateUserInterface();
    } catch (err) {
      notificationService.error(err.message || 'Error al iniciar sesión.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
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
    this.openModal();
  },

  updateUserInterface() {
    const user = authModel.getCurrentUser();
    const isAuth = Boolean(user);
    const mainUserDisplay = $('#main-user-display');

    // Actualizar estado de autenticación en el layout para control CSS y accesibilidad
    const layoutEl = $('.odontokris-layout');
    if (layoutEl) {
      layoutEl.setAttribute('data-auth-status', isAuth ? 'authenticated' : 'unauthenticated');
    }

    // Alternar visibilidad entre la pantalla para usuarios no autenticados y la vista de trabajo
    const guestView = $('#guest-welcome-view');
    const authView = $('#authenticated-app-view');

    if (guestView) {
      guestView.style.display = isAuth ? 'none' : 'flex';
    }
    if (authView) {
      authView.style.display = isAuth ? '' : 'none';
    }

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
      // Sin autenticar: botón de acceso
      mainUserDisplay.innerHTML = `
        <div class="portal-buttons-grid">
          <button type="button" id="btn-hero-login" class="button btn-portal-primary" data-paint="primary">
            <span class="btn-icon">🔑</span>
            <span>Iniciar Sesión</span>
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
