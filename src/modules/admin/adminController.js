/**
 * Controlador de Configuración Administrativa
 * Controla la visibilidad del botón 'Configuración' (solo para rol 'admin' en user_roles),
 * la apertura del modal y las operaciones CRUD de consultorio, doctor y roles.
 */

import { adminModel } from './adminModel.js';
import { authModel } from '../auth/authModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { tasaCambioController } from '../tasaCambio/tasaCambioController.js';
import { $ } from '../../utils/dom.js';

export const adminController = {
  init() {
    this.bindEvents();
    this.updateVisibility();
    tasaCambioController.init();
    this.loadConsultoriosDoctorSelect();
  },

  /**
   * Actualiza la visibilidad del botón 'Configuración' en la barra de botones.
   * Depende de la permisología del rol asignado en la tabla 'roles_permision' (objeto 'modal-admin-config').
   */
  async updateVisibility() {
    const configBtn = $('#btn-quick-config');
    if (!configBtn) return;

    try {
      const user = authModel.getCurrentUser();
      if (!user) {
        configBtn.style.display = 'none';
        this.closeModal();
        return;
      }

      // Consultar permiso sobre 'modal-admin-config'
      const hasPerm = permissionService.canRead('modal-admin-config');
      const isAdmin = (await adminModel.isCurrentUserAdmin()) || hasPerm;

      if (hasPerm || isAdmin) {
        configBtn.style.display = 'inline-flex';
        permissionService.applyAdminSectionsPermissions();
      } else {
        configBtn.style.display = 'none';
        this.closeModal();
      }
    } catch (err) {
      console.warn('[AdminController] Error al evaluar rol de admin:', err);
      configBtn.style.display = 'none';
    }
  },

  bindEvents() {
    // 1. Clic en el botón 'Configuración' de la barra de botones (apertura síncrona inmediata)
    document.addEventListener('click', (e) => {
      const configBtn = e.target.closest('#btn-quick-config');
      if (configBtn) {
        e.preventDefault();
        const user = authModel.getCurrentUser();
        if (!user) {
          notificationService.error('Acceso Restringido: Debes iniciar sesión con una cuenta autorizada.');
          return;
        }
        this.openModal();
      }
    });

    // 2. Cerrar modal con botón de cierre
    document.addEventListener('click', (e) => {
      if (e.target.closest('#modal-admin-config .btn-close-modal')) {
        this.closeModal();
      }
    });

    // 2. Navegación por pestañas y botones del menú principal
    document.addEventListener('click', (e) => {
      // Pestañas superiores
      if (e.target.closest('#admin-nav-hub')) {
        this.switchSection('hub');
      } else if (e.target.closest('#admin-nav-consultorio') || e.target.closest('#btn-admin-open-consultorio')) {
        this.switchSection('consultorio');
      } else if (e.target.closest('#admin-nav-doctor') || e.target.closest('#btn-admin-open-doctor')) {
        this.switchSection('doctor');
      } else if (e.target.closest('#admin-nav-users') || e.target.closest('#btn-admin-open-users')) {
        this.switchSection('users');
      } else if (e.target.closest('#admin-nav-roles') || e.target.closest('#btn-admin-open-roles')) {
        this.switchSection('roles');
      } else if (e.target.closest('#admin-nav-tasa') || e.target.closest('#btn-admin-open-tasa')) {
        this.switchSection('tasa');
      } else if (e.target.closest('.btn-admin-back-hub')) {
        this.switchSection('hub');
      }
    });

    // 3. Envío de formulario Crear Consultorio
    const consultorioForm = $('#form-admin-consultorio');
    if (consultorioForm) {
      consultorioForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveConsultorio();
      });
    }

    // 4. Envío de formulario Registrar Doctor
    const doctorForm = $('#form-admin-doctor');
    if (doctorForm) {
      doctorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveDoctor();
      });
    }

    // 4b. Envío de formulario Usuario (Crear / Modificar)
    const userForm = $('#form-admin-user');
    if (userForm) {
      userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveUser();
      });
    }

    // 4c. Envío de formulario Rol (Crear / Modificar)
    const roleForm = $('#form-admin-role');
    if (roleForm) {
      roleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveRole();
      });
    }

    // 4d. Búsqueda en tiempo real de usuarios
    const userSearchInput = $('#admin-user-search-input');
    if (userSearchInput) {
      userSearchInput.addEventListener('input', (e) => {
        this.loadUsersTable(e.target.value);
      });
    }

    // 4e. Filtro en tiempo real de objetos en matriz de permisos
    const permsSearchInput = $('#perms-search-objects');
    if (permsSearchInput) {
      permsSearchInput.addEventListener('input', (e) => {
        this.filterPermissionsObjects(e.target.value);
      });
    }

    // 5. Clics en acciones de las listas (eliminar consultorio, eliminar doctor, cambiar rol, editar usuario, eliminar usuario)
    document.addEventListener('click', async (e) => {
      // Eliminar consultorio
      const delConsBtn = e.target.closest('.btn-admin-del-consultorio');
      if (delConsBtn) {
        const id = delConsBtn.getAttribute('data-id');
        const name = delConsBtn.getAttribute('data-name');
        if (confirm(`¿Estás seguro de eliminar el consultorio "${name}"?`)) {
          await this.handleDeleteConsultorio(id);
        }
        return;
      }

      // Editar doctor
      const editDocBtn = e.target.closest('.btn-admin-edit-doctor');
      if (editDocBtn) {
        const id = editDocBtn.getAttribute('data-id');
        await this.handleEditDoctor(id);
        return;
      }

      // Cancelar edición de doctor
      const cancelDocBtn = e.target.closest('#btn-cancel-doctor-form');
      if (cancelDocBtn) {
        this.resetDoctorForm();
        return;
      }

      // Eliminar doctor
      const delDocBtn = e.target.closest('.btn-admin-del-doctor');
      if (delDocBtn) {
        const id = delDocBtn.getAttribute('data-id');
        const name = delDocBtn.getAttribute('data-name');
        if (confirm(`¿Estás seguro de eliminar al especialista "${name}"?`)) {
          await this.handleDeleteDoctor(id);
        }
        return;
      }

      // Editar usuario
      const editUserBtn = e.target.closest('.btn-edit-user-admin');
      if (editUserBtn) {
        const userId = Number(editUserBtn.getAttribute('data-user-id'));
        await this.handleEditUser(userId);
        return;
      }

      // Eliminar usuario
      const delUserBtn = e.target.closest('.btn-del-user-admin');
      if (delUserBtn) {
        const userId = Number(delUserBtn.getAttribute('data-user-id'));
        const userName = delUserBtn.getAttribute('data-user-name');
        if (confirm(`¿Estás seguro de eliminar al usuario "${userName}"? Esta acción borrará permanentemente su cuenta y accesos.`)) {
          await this.handleDeleteUser(userId);
        }
        return;
      }

      // Cancelar edición de usuario
      if (e.target.closest('#btn-cancel-user-form')) {
        this.resetUserForm();
        return;
      }

      // Ir a nuevo usuario
      if (e.target.closest('#btn-admin-scroll-new-user')) {
        this.resetUserForm();
        $('#admin-user-name')?.focus();
        return;
      }

      // --- ACCIONES DE ROLES Y PERMISOS ---
      // Editar rol
      const editRoleBtn = e.target.closest('.btn-edit-role-admin');
      if (editRoleBtn) {
        const roleId = Number(editRoleBtn.getAttribute('data-role-id'));
        await this.handleEditRole(roleId);
        return;
      }

      // Eliminar rol
      const delRoleBtn = e.target.closest('.btn-del-role-admin');
      if (delRoleBtn) {
        const roleId = Number(delRoleBtn.getAttribute('data-role-id'));
        const roleName = delRoleBtn.getAttribute('data-role-name');
        if (confirm(`¿Estás seguro de eliminar el rol "${roleName}"? Se revocarán todos sus permisos en roles_permision.`)) {
          await this.handleDeleteRole(roleId, roleName);
        }
        return;
      }

      // Abrir matriz de permisos para un rol
      const permsBtn = e.target.closest('.btn-role-perms');
      if (permsBtn) {
        const roleId = Number(permsBtn.getAttribute('data-role-id'));
        await this.openRolePermissions(roleId);
        return;
      }

      // Cancelar edición de rol
      if (e.target.closest('#btn-cancel-role-form')) {
        this.resetRoleForm();
        return;
      }

      // Ir a nuevo rol
      if (e.target.closest('#btn-admin-scroll-new-role')) {
        this.resetRoleForm();
        $('#admin-role-name')?.focus();
        return;
      }

      // Cerrar matriz de permisos
      if (e.target.closest('#btn-close-perms-panel')) {
        const panel = $('#admin-role-perms-panel');
        if (panel) panel.style.display = 'none';
        this.activePermissionsRoleId = null;
        return;
      }

      // Acciones rápidas de permisos
      if (e.target.closest('#btn-perms-grant-all')) {
        this.setAllPermissionsState({ leer: true, escribir: true, activo: true });
        return;
      }
      if (e.target.closest('#btn-perms-read-only')) {
        this.setAllPermissionsState({ leer: true, escribir: false, activo: true });
        return;
      }
      if (e.target.closest('#btn-perms-revoke-all')) {
        this.setAllPermissionsState({ leer: false, escribir: false, activo: false });
        return;
      }

      // Guardar permisos en roles_permision
      if (e.target.closest('#btn-save-role-perms')) {
        await this.handleSaveRolePermissions();
        return;
      }

      // Cambiar rol de usuario en user_roles
      const toggleRoleBtn = e.target.closest('.btn-toggle-admin-role');
      if (toggleRoleBtn) {
        const userId = Number(toggleRoleBtn.getAttribute('data-user-id'));
        const currentIsAdmin = toggleRoleBtn.getAttribute('data-is-admin') === 'true';
        const userName = toggleRoleBtn.getAttribute('data-user-name');

        const actionText = currentIsAdmin ? 'remover el rol "admin"' : 'asignar el rol "admin" en user_roles';
        if (confirm(`¿Confirmas ${actionText} para ${userName}?`)) {
          await this.handleToggleAdminRole(userId, !currentIsAdmin);
        }
        return;
      }
    });

    // 6. Sincronización reactiva si cambia el consultorio activo o la sesión
    window.addEventListener('consultorio:changed', async () => {
      await this.loadConsultoriosDoctorSelect();
      const docSection = $('#admin-section-doctor');
      if (docSection && docSection.classList.contains('active')) {
        await this.loadDoctoresList();
      }
    });

    window.addEventListener('auth:change', async () => {
      await this.loadConsultoriosDoctorSelect();
    });
  },

  openModal() {
    const dialog = $('#modal-admin-config');
    if (!dialog) return;

    this.switchSection('hub');
    this.loadConsultoriosDoctorSelect();
    permissionService.applyAdminSectionsPermissions();

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  closeModal() {
    const dialog = $('#modal-admin-config');
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  },

  /**
   * Cambia la sección activa dentro del modal de administración
   */
  async switchSection(section) {
    const sections = {
      hub: $('#admin-section-hub'),
      consultorio: $('#admin-section-consultorio'),
      doctor: $('#admin-section-doctor'),
      users: $('#admin-section-users'),
      roles: $('#admin-section-roles'),
      tasa: $('#admin-section-tasa')
    };

    const navButtons = {
      hub: $('#admin-nav-hub'),
      consultorio: $('#admin-nav-consultorio'),
      doctor: $('#admin-nav-doctor'),
      users: $('#admin-nav-users'),
      roles: $('#admin-nav-roles'),
      tasa: $('#admin-nav-tasa')
    };

    // Actualizar visibilidad de secciones
    Object.entries(sections).forEach(([key, el]) => {
      if (el) {
        el.style.display = key === section ? 'flex' : 'none';
        if (key === section) el.classList.add('active');
        else el.classList.remove('active');
      }
    });

    // Actualizar estilos de pestañas de navegación
    Object.entries(navButtons).forEach(([key, btn]) => {
      if (btn) {
        if (key === section) {
          btn.setAttribute('data-paint', 'primary');
          btn.removeAttribute('data-variant');
          btn.classList.add('active');
        } else {
          btn.setAttribute('data-variant', 'ghost');
          btn.removeAttribute('data-paint');
          btn.classList.remove('active');
        }
      }
    });

    // Validar permisos del rol antes de acceder a secciones protegidas
    if (section === 'consultorio' && !permissionService.canRead('admin-section-consultorio')) {
      notificationService.warning('Tu rol no tiene permiso para consultar Sedes / Consultorios.');
      return this.switchSection('hub');
    }
    if (section === 'doctor' && !permissionService.canRead('admin-section-doctor')) {
      notificationService.warning('Tu rol no tiene permiso para consultar Doctores.');
      return this.switchSection('hub');
    }
    if (section === 'users' && !permissionService.canRead('admin-section-users')) {
      notificationService.warning('Tu rol no tiene permiso para consultar Usuarios.');
      return this.switchSection('hub');
    }
    if (section === 'roles' && !permissionService.canRead('admin-section-user-roles')) {
      notificationService.warning('Tu rol no tiene permiso para consultar Roles y Permisos.');
      return this.switchSection('hub');
    }
    if (section === 'tasa' && !permissionService.canRead('admin-section-tasa')) {
      notificationService.warning('Tu rol no tiene permiso para consultar Tasas de Cambio.');
      return this.switchSection('hub');
    }

    // Cargar datos correspondientes al cambiar de sección
    if (section === 'consultorio') {
      await this.loadConsultoriosList();
    } else if (section === 'doctor') {
      await this.loadDoctoresSection();
    } else if (section === 'users') {
      await Promise.all([
        this.loadRolesForUserSelect(),
        this.loadConsultoriosForUserSelect(),
        this.loadUsersTable()
      ]);
    } else if (section === 'roles') {
      await this.loadRolesSection();
    } else if (section === 'tasa') {
      await tasaCambioController.loadTable();
    }
  },

  /**
   * Carga y renderiza la lista de consultorios
   */
  async loadConsultoriosList() {
    const container = $('#admin-consultorios-container');
    if (!container) return;

    container.innerHTML = '<p style="font-size: 0.82rem; opacity: 0.7;">Cargando consultorios...</p>';

    try {
      const consultorios = await adminModel.getConsultorios();
      if (!consultorios || consultorios.length === 0) {
        container.innerHTML = `
          <div class="box" data-surface="raised" data-border style="padding: 1rem; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; opacity: 0.8;">No hay consultorios registrados aún. Crea uno nuevo arriba.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="admin-items-grid">
          ${consultorios.map(c => `
            <div class="admin-item-card box" data-surface="raised" data-border>
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span style="font-size: 1.25rem;">🏢</span>
                  <div>
                    <strong style="font-size: 0.9rem; display: block;">${c.nombre}</strong>
                    <small style="opacity: 0.75; font-size: 0.78rem;">
                      📍 ${c.direccion || 'Sin dirección'} | 📞 ${c.telefono || 'Sin teléfono'}
                    </small>
                  </div>
                </div>
                <button type="button" class="button btn-admin-del-consultorio" data-variant="ghost" data-size="sm" data-id="${c.id}" data-name="${c.nombre}" title="Eliminar consultorio" style="color: #ef4444;">
                  🗑️
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: #ef4444; font-size: 0.82rem;">Error al cargar consultorios: ${err.message}</p>`;
    }
  },

  /**
   * Guarda un nuevo consultorio
   */
  async handleSaveConsultorio() {
    const submitBtn = $('#btn-submit-consultorio');
    const nameInput = $('#admin-consultorio-name');
    const phoneInput = $('#admin-consultorio-phone');
    const addressInput = $('#admin-consultorio-address');

    const nombre = nameInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const direccion = addressInput?.value.trim();

    if (!nombre) {
      notificationService.error('Ingresa el nombre del consultorio.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      await adminModel.createConsultorio({ nombre, telefono, direccion });
      notificationService.success(`Consultorio "${nombre}" creado con éxito.`);
      $('#form-admin-consultorio')?.reset();
      await this.loadConsultoriosList();
    } catch (err) {
      notificationService.error(err.message || 'Error al guardar consultorio.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Consultorio';
      }
    }
  },

  /**
   * Elimina un consultorio
   */
  async handleDeleteConsultorio(id) {
    try {
      await adminModel.deleteConsultorio(id);
      notificationService.success('Consultorio eliminado correctamente.');
      await this.loadConsultoriosList();
    } catch (err) {
      notificationService.error(err.message || 'Error al eliminar consultorio.');
    }
  },

  /**
   * Carga formulario de doctores (rellena select de consultorios) y lista de doctores
   */
  async loadDoctoresSection() {
    await this.loadConsultoriosDoctorSelect();
    await this.loadDoctoresList();
  },

  /**
   * Carga exclusivamente el consultorio con el que se logueó el usuario en el selector de doctores
   * y lo mantiene bloqueado para no permitir ningún otro consultorio.
   */
  async loadConsultoriosDoctorSelect() {
    const select = $('#admin-doctor-consultorio');
    if (!select) return;

    try {
      const activeConsultorio = consultorioModel.getActiveConsultorio() 
        || authModel.getActiveConsultorio() 
        || authModel.getCurrentUser()?.consultorio;
      
      const activeId = activeConsultorio?.id ? String(activeConsultorio.id) : '';

      if (activeConsultorio && activeId) {
        select.innerHTML = `<option value="${activeId}" selected>🏢 ${activeConsultorio.nombre} (Sede de la sesión activa)</option>`;
        select.value = activeId;
        select.disabled = true;
      } else {
        select.innerHTML = `<option value="" disabled selected>No hay sede activa en la sesión</option>`;
        select.disabled = true;
      }

      const hint = $('#admin-doctor-consultorio-hint');
      if (hint && activeConsultorio) {
        hint.textContent = `🔒 Sede fijada al consultorio de la sesión: ${activeConsultorio.nombre}`;
      }
    } catch (err) {
      console.warn('[AdminController] Error cargando consultorio para doctor:', err);
    }
  },

  /**
   * Carga y renderiza la lista de doctores filtrada por el consultorio logueado
   */
  async loadDoctoresList() {
    const container = $('#admin-doctores-container');
    const filterBadge = $('#admin-doctor-filter-badge');
    if (!container) return;

    const activeConsultorio = consultorioModel.getActiveConsultorio() || authModel.getActiveConsultorio();
    if (filterBadge) {
      filterBadge.textContent = activeConsultorio?.nombre 
        ? `🏢 Filtrado por: ${activeConsultorio.nombre}` 
        : '🏢 Sede Activa';
    }

    container.innerHTML = '<p style="font-size: 0.82rem; opacity: 0.7;">Cargando doctores de la sede...</p>';

    try {
      // Filtrar para que solo se puedan ver los doctores del consultorio al que se logueó
      const targetConsultorioId = activeConsultorio?.id ? Number(activeConsultorio.id) : null;
      const doctores = await adminModel.getDoctores(targetConsultorioId);

      if (!doctores || doctores.length === 0) {
        container.innerHTML = `
          <div class="box" data-surface="raised" data-border style="padding: 1.25rem; text-align: center;">
            <p style="margin: 0; font-size: 0.9rem; font-weight: 500;">
              No hay doctores registrados en <strong>${activeConsultorio?.nombre || 'este consultorio'}</strong> aún.
            </p>
            <p style="margin: 0.35rem 0 0; opacity: 0.7; font-size: 0.8rem;">
              Usa el formulario superior para registrar y asignar especialistas a esta sede.
            </p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="admin-items-grid">
          ${doctores.map(d => `
            <div class="admin-item-card box" data-surface="raised" data-border id="admin-doc-card-${d.id}">
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span style="font-size: 1.25rem;">🩺</span>
                  <div>
                    <strong style="font-size: 0.9rem; display: block;">${d.nombre}</strong>
                    <div class="cluster" data-gap="2xs" style="margin-top: 2px;">
                      <span class="badge" data-paint="primary" style="font-size: 0.72rem; padding: 1px 6px;">
                        🏢 ${d.consultorio?.nombre || (d.consultorio_id ? `Consultorio #${d.consultorio_id}` : 'Sin Consultorio')}
                      </span>
                    </div>
                    <small style="opacity: 0.75; font-size: 0.78rem; display: block; margin-top: 3px;">
                      📞 ${d.telefono || 'Sin teléfono'} | ✉️ ${d.mail || 'Sin correo'}
                    </small>
                  </div>
                </div>
                <div class="cluster" data-gap="2xs">
                  <button type="button" class="button btn-admin-edit-doctor" data-variant="ghost" data-size="sm" data-id="${d.id}" title="Editar especialista">
                    ✏️
                  </button>
                  <button type="button" class="button btn-admin-del-doctor" data-variant="ghost" data-size="sm" data-id="${d.id}" data-name="${d.nombre}" title="Eliminar doctor" style="color: #ef4444;">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<p style="color: #ef4444; font-size: 0.82rem;">Error al cargar doctores: ${err.message}</p>`;
    }
  },

  /**
   * Carga un doctor en el formulario para modificarlo (Modo Edición)
   */
  async handleEditDoctor(id) {
    try {
      const doc = await adminModel.getDoctorById(id);
      if (!doc) {
        notificationService.error('No se encontró el especialista seleccionado.');
        return;
      }

      const idInput = $('#admin-doctor-id');
      const nameInput = $('#admin-doctor-name');
      const phoneInput = $('#admin-doctor-phone');
      const mailInput = $('#admin-doctor-mail');
      const submitBtn = $('#btn-submit-doctor-admin');
      const cancelBtn = $('#btn-cancel-doctor-form');
      const formBadge = $('#admin-doctor-form-badge');
      const formIndicator = $('#admin-doctor-form-indicator');

      if (idInput) idInput.value = doc.id;
      if (nameInput) nameInput.value = doc.nombre || '';
      if (phoneInput) phoneInput.value = doc.telefono || '';
      if (mailInput) mailInput.value = doc.mail || '';

      // Asegurar que el consultorio sea estrictamente el logueado
      await this.loadConsultoriosDoctorSelect();

      if (formBadge) {
        formBadge.textContent = '✏️ Modo Edición';
        formBadge.setAttribute('data-paint', 'warning');
      }
      if (formIndicator) {
        formIndicator.textContent = `Modificando a: ${doc.nombre}`;
      }
      if (cancelBtn) cancelBtn.style.display = 'inline-flex';
      if (submitBtn) submitBtn.textContent = '💾 Actualizar Doctor';

      nameInput?.focus();
      $('#form-admin-doctor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (err) {
      notificationService.error('Error al cargar datos del doctor: ' + err.message);
    }
  },

  /**
   * Restablece el formulario de doctor al modo de creación manteniendo el consultorio activo
   */
  resetDoctorForm() {
    const idInput = $('#admin-doctor-id');
    const nameInput = $('#admin-doctor-name');
    const phoneInput = $('#admin-doctor-phone');
    const mailInput = $('#admin-doctor-mail');
    const cancelBtn = $('#btn-cancel-doctor-form');
    const formBadge = $('#admin-doctor-form-badge');
    const formIndicator = $('#admin-doctor-form-indicator');
    const submitBtn = $('#btn-submit-doctor-admin');

    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (mailInput) mailInput.value = '';

    if (cancelBtn) cancelBtn.style.display = 'none';
    if (formBadge) {
      formBadge.textContent = '➕ Nuevo Especialista';
      formBadge.setAttribute('data-paint', 'primary');
    }
    if (formIndicator) {
      formIndicator.textContent = 'Completar datos del doctor';
    }
    if (submitBtn) submitBtn.textContent = '💾 Guardar Doctor';

    // Restablecer el select estrictamente al consultorio con el que se logueó el usuario
    this.loadConsultoriosDoctorSelect();
  },

  /**
   * Guarda o actualiza un doctor en el CRUD
   */
  async handleSaveDoctor() {
    const submitBtn = $('#btn-submit-doctor-admin');
    const idInput = $('#admin-doctor-id');
    const nameInput = $('#admin-doctor-name');
    const phoneInput = $('#admin-doctor-phone');
    const mailInput = $('#admin-doctor-mail');

    const id = idInput?.value ? Number(idInput.value) : null;
    const nombre = nameInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const mail = mailInput?.value.trim();

    if (!nombre) {
      notificationService.error('Ingresa el nombre del doctor.');
      return;
    }

    // No permitir otro consultorio que no sea el logueado
    const activeConsultorio = consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio() 
      || authModel.getCurrentUser()?.consultorio;

    if (!activeConsultorio?.id) {
      notificationService.error('Debes tener un consultorio activo en la sesión para guardar un doctor.');
      return;
    }

    const consultorio_id = Number(activeConsultorio.id);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = id ? 'Actualizando...' : 'Guardando...';
    }

    try {
      if (id) {
        await adminModel.updateDoctor(id, { nombre, telefono, mail, consultorio_id });
        notificationService.success(`Doctor "${nombre}" actualizado con éxito.`);
      } else {
        await adminModel.createDoctor({ nombre, telefono, mail, consultorio_id });
        notificationService.success(`Doctor "${nombre}" registrado con éxito.`);
      }

      this.resetDoctorForm();
      await this.loadDoctoresList();

      // Notificar a otros módulos (calendario, citas, etc.) para refrescar la lista de doctores
      window.dispatchEvent(new CustomEvent('doctors:changed'));
    } catch (err) {
      notificationService.error(err.message || 'Error al guardar doctor.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = id ? '💾 Actualizar Doctor' : '💾 Guardar Doctor';
      }
    }
  },

  /**
   * Elimina un doctor
   */
  async handleDeleteDoctor(id) {
    try {
      await adminModel.deleteDoctor(id);
      notificationService.success('Doctor eliminado correctamente.');
      if ($('#admin-doctor-id')?.value === String(id)) {
        this.resetDoctorForm();
      }
      await this.loadDoctoresList();
      window.dispatchEvent(new CustomEvent('doctors:changed'));
    } catch (err) {
      notificationService.error(err.message || 'Error al eliminar doctor.');
    }
  },

  /**
   * Carga dinámicamente las opciones de roles desde la tabla 'roles' de Supabase
   * en el selector del formulario de usuarios (#admin-user-rol)
   * @param {number|string|null} selectedValue
   */
  async loadRolesForUserSelect(selectedValue = null) {
    const select = $('#admin-user-rol');
    if (!select) return;

    try {
      const roles = await adminModel.getRoles();

      if (!roles || roles.length === 0) {
        select.innerHTML = '<option value="">(No hay roles registrados en la tabla roles)</option>';
        return;
      }

      // Ordenar: roles activos primero
      const sortedRoles = [...roles].sort((a, b) => {
        if (a.activo === b.activo) return a.id - b.id;
        return a.activo ? -1 : 1;
      });

      select.innerHTML = sortedRoles.map(r => {
        const icon = (r.nombre?.toLowerCase() === 'admin' || r.id === 1) ? '🛡️' : '👤';
        const desc = r.tipo ? ` (${r.tipo})` : '';
        const inactive = !r.activo ? ' - Inactivo' : '';
        return `
          <option value="${r.id}" data-role-name="${r.nombre}" ${!r.activo ? 'disabled' : ''}>
            ${icon} ${r.nombre}${desc}${inactive}
          </option>
        `;
      }).join('');

      // Determinar qué opción preseleccionar
      if (selectedValue !== null && selectedValue !== undefined && selectedValue !== '') {
        const strVal = String(selectedValue).toLowerCase().trim();
        let matched = sortedRoles.find(r => String(r.id) === strVal);
        if (!matched) {
          matched = sortedRoles.find(r => 
            r.nombre?.toLowerCase() === strVal ||
            (strVal === 'usuario' && r.nombre?.toLowerCase() === 'user') ||
            (strVal === 'user' && r.nombre?.toLowerCase() === 'usuario')
          );
        }
        if (matched) {
          select.value = String(matched.id);
        }
      } else {
        // Por defecto, preseleccionar rol 'user' o primer rol no admin activo
        const defaultRole = sortedRoles.find(r => r.activo && r.id !== 1 && (r.nombre === 'user' || r.nombre === 'usuario')) ||
                            sortedRoles.find(r => r.activo && r.id !== 1) ||
                            sortedRoles[0];
        if (defaultRole) {
          select.value = String(defaultRole.id);
        }
      }
    } catch (err) {
      console.warn('[AdminController] Error al cargar roles en selector de usuario:', err);
      select.innerHTML = `
        <option value="1" data-role-name="admin">🛡️ admin (Administrador)</option>
        <option value="2" data-role-name="user">👤 user (Usuario Estándar)</option>
      `;
    }
  },

  /**
   * Carga las sedes registradas en el selector de consultorios del formulario de usuarios (#admin-user-consultorio)
   * @param {number|string|null} selectedValue
   */
  async loadConsultoriosForUserSelect(selectedValue = null) {
    const select = $('#admin-user-consultorio');
    if (!select) return;

    try {
      const consultorios = await adminModel.getConsultorios();
      let html = `<option value="">🌐 Todos los consultorios (Acceso Global)</option>`;
      (consultorios || []).forEach(c => {
        const isSel = selectedValue && String(selectedValue) === String(c.id) ? 'selected' : '';
        html += `<option value="${c.id}" ${isSel}>🏢 ${c.nombre} ${c.direccion ? `(${c.direccion})` : ''}</option>`;
      });
      select.innerHTML = html;
    } catch {
      select.innerHTML = `<option value="">🌐 Todos los consultorios (Acceso Global)</option>`;
    }
  },

  /**
   * Carga la tabla de usuarios con sus roles en user_roles y consultorio asignado
   */
  async loadUsersTable(searchTerm = '') {
    const tbody = $('#admin-users-table-body');
    const countBadge = $('#admin-users-count-badge');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
          Consultando usuarios y tabla user_roles en tiempo real...
        </td>
      </tr>
    `;

    try {
      const [usersData, consultorios] = await Promise.all([
        adminModel.getUsersWithRoles(),
        adminModel.getConsultorios()
      ]);
      let users = usersData || [];
      const consultorioMap = new Map((consultorios || []).map(c => [String(c.id), c.nombre]));

      if (searchTerm && searchTerm.trim().length > 0) {
        const term = searchTerm.toLowerCase().trim();
        users = users.filter(u => 
          (u.nombre && u.nombre.toLowerCase().includes(term)) ||
          (u.mail && u.mail.toLowerCase().includes(term)) ||
          (u.ci && u.ci.toLowerCase().includes(term)) ||
          (u.telefono && u.telefono.toLowerCase().includes(term))
        );
      }

      if (countBadge) {
        countBadge.textContent = `${users.length} usuario(s) encontrado(s)`;
      }

      if (!users || users.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
              No se encontraron usuarios registrados.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = users.map(u => {
        const isAdmin = u.isAdmin;
        return `
          <tr style="border-bottom: 1px solid rgba(125,125,125,0.15);">
            <td style="padding: 0.65rem 0.85rem;">
              <strong>${u.nombre}</strong><br>
              <small style="opacity: 0.75;">CI: ${u.ci || 'N/A'}</small>
            </td>
            <td style="padding: 0.65rem 0.85rem;">
              <span>${u.mail}</span><br>
              <small style="opacity: 0.75;">${u.telefono || 'Sin teléfono'}</small>
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              ${isAdmin ? `
                <span class="badge" data-paint="warning" style="font-weight: 700;">
                  🛡️ ${u.role_name || 'admin'}
                </span>
              ` : `
                <span class="badge" data-variant="ghost" style="opacity: 0.9; font-weight: 600;">
                  👤 ${u.role_name || 'usuario'}
                </span>
              `}
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              ${u.consultorio_id ? `
                <span class="badge" data-paint="primary" style="font-size: 0.74rem; font-weight: 600;" title="Acceso exclusivo a esta sede">
                  🏢 ${consultorioMap.get(String(u.consultorio_id)) || `Sede #${u.consultorio_id}`}
                </span>
              ` : `
                <span class="badge" data-paint="success" style="font-size: 0.74rem; font-weight: 600;" title="Acceso a todas las sedes del sistema">
                  🌐 Todas (Global)
                </span>
              `}
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              <span class="badge" data-paint="${u.activo ? 'success' : 'danger'}">
                ${u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: right;">
              <div class="cluster" data-gap="2xs" data-justify="end" style="align-items: center;">
                <button 
                  type="button" 
                  class="button btn-edit-user-admin" 
                  data-user-id="${u.id}" 
                  data-size="sm" 
                  data-variant="ghost" 
                  title="Modificar datos del usuario"
                >
                  ✏️
                </button>
                ${(permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles') || authModel.getCurrentUser()?.isAdmin) ? `
                <button 
                  type="button" 
                  class="button btn-toggle-admin-role" 
                  data-size="sm"
                  data-variant="${isAdmin ? 'outlined' : 'primary'}"
                  data-paint="${isAdmin ? 'danger' : 'warning'}"
                  data-user-id="${u.id}"
                  data-user-name="${u.nombre}"
                  data-is-admin="${isAdmin}"
                  title="${isAdmin ? 'Remover permisos de admin' : 'Hacer administrador en user_roles'}"
                >
                  ${isAdmin ? 'Quitar Admin' : 'Hacer Admin'}
                </button>
                ` : ''}
                <button 
                  type="button" 
                  class="button btn-del-user-admin" 
                  data-user-id="${u.id}" 
                  data-user-name="${u.nombre}" 
                  data-size="sm" 
                  data-variant="ghost" 
                  style="color: #ef4444;" 
                  title="Eliminar usuario definitivamente"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 1.5rem; text-align: center; color: #ef4444;">
            Error consultando usuarios: ${err.message}
          </td>
        </tr>
      `;
    }
  },

  /**
   * Guarda un nuevo usuario o actualiza uno existente (CRUD)
   */
  async handleSaveUser() {
    const id = $('#admin-user-id')?.value;
    const nameInput = $('#admin-user-name');
    const ciInput = $('#admin-user-ci');
    const emailInput = $('#admin-user-email');
    const phoneInput = $('#admin-user-phone');
    const passwordInput = $('#admin-user-password');
    const rolSelect = $('#admin-user-rol');
    const activeCheck = $('#admin-user-active');
    const submitBtn = $('#btn-submit-user-admin');

    const nombre = nameInput?.value?.trim();
    const ci = ciInput?.value?.trim();
    const mail = emailInput?.value?.trim();
    const telefono = phoneInput?.value?.trim();
    const clave = passwordInput?.value?.trim();
    const roleId = Number(rolSelect?.value) || null;
    const selectedOption = rolSelect?.selectedOptions?.[0];
    const roleName = selectedOption?.getAttribute('data-role-name') || rolSelect?.value || 'user';
    const activo = activeCheck ? activeCheck.checked : true;

    if (!nombre || !ci || !mail) {
      notificationService.error('Nombre, cédula y correo electrónico son obligatorios.');
      return;
    }

    if (!id && (!clave || clave.length < 6)) {
      notificationService.error('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (id && clave && clave.length > 0 && clave.length < 6) {
      notificationService.error('Si vas a cambiar la contraseña, debe tener al menos 6 caracteres.');
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    const consultorioVal = $('#admin-user-consultorio')?.value;
    const consultorio_id = consultorioVal ? Number(consultorioVal) : null;

    try {
      if (id) {
        // Actualizar
        await adminModel.updateUser(Number(id), {
          nombre,
          ci,
          mail,
          telefono,
          clave,
          rol: roleName,
          role_id: roleId,
          consultorio_id,
          activo
        });
        notificationService.success(`Usuario "${nombre}" actualizado correctamente.`);
      } else {
        // Crear
        await adminModel.createUser({
          nombre,
          ci,
          mail,
          telefono,
          clave,
          rol: roleName,
          role_id: roleId,
          consultorio_id,
          activo
        });
        notificationService.success(`Usuario "${nombre}" registrado con éxito.`);
      }

      this.resetUserForm();
      await this.loadUsersTable();
      await this.updateVisibility();
    } catch (err) {
      notificationService.error(err.message || 'Error al guardar usuario.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  },

  /**
   * Carga los datos de un usuario en el formulario para editar
   */
  async handleEditUser(userId) {
    try {
      const user = await adminModel.getUserById(userId);
      if (!user) {
        notificationService.error('No se encontró el usuario seleccionado.');
        return;
      }

      $('#admin-user-id').value = String(user.id);
      $('#admin-user-name').value = user.nombre || '';
      $('#admin-user-ci').value = user.ci || '';
      $('#admin-user-email').value = user.mail || '';
      $('#admin-user-phone').value = user.telefono || '';
      $('#admin-user-password').value = '';
      $('#admin-user-password').removeAttribute('required');
      $('#admin-user-pass-required').style.display = 'none';
      $('#admin-user-pass-help').textContent = 'Dejar vacío para conservar la contraseña actual.';

      // Cargar roles y seleccionar el rol del usuario
      await this.loadRolesForUserSelect(user.role_id || user.rol);

      // Cargar consultorios y seleccionar el consultorio asignado
      await this.loadConsultoriosForUserSelect(user.consultorio_id);

      const activeCheck = $('#admin-user-active');
      if (activeCheck) activeCheck.checked = Boolean(user.activo !== false);

      $('#admin-user-form-title').textContent = `✏️ Modificar Usuario: ${user.nombre}`;
      $('#admin-user-form-badge').textContent = 'Modo Editar';
      $('#admin-user-form-badge').setAttribute('data-paint', 'warning');
      $('#btn-cancel-user-form').style.display = 'inline-flex';
      $('#btn-submit-user-admin').textContent = '💾 Actualizar Usuario';

      // Desplazar al formulario
      $('#form-admin-user')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      notificationService.error(`Error cargando usuario: ${err.message}`);
    }
  },

  /**
   * Restablece el formulario de usuario al modo CREAR
   */
  resetUserForm() {
    const form = $('#form-admin-user');
    if (form) form.reset();

    $('#admin-user-id').value = '';
    $('#admin-user-password').value = '';
    $('#admin-user-password').setAttribute('required', '');
    $('#admin-user-pass-required').style.display = 'inline';
    $('#admin-user-pass-help').textContent = 'Requerida para nuevos usuarios (mín. 6 caracteres).';

    $('#admin-user-form-title').textContent = '➕ Registrar Nuevo Usuario';
    $('#admin-user-form-badge').textContent = 'Modo Crear';
    $('#admin-user-form-badge').setAttribute('data-paint', 'primary');
    $('#btn-cancel-user-form').style.display = 'none';
    $('#btn-submit-user-admin').textContent = '💾 Guardar Usuario';

    this.loadConsultoriosForUserSelect();

    const activeCheck = $('#admin-user-active');
    if (activeCheck) activeCheck.checked = true;

    // Restablecer selector de roles
    this.loadRolesForUserSelect();
  },

  /**
   * Elimina un usuario por su ID
   */
  async handleDeleteUser(userId) {
    try {
      await adminModel.deleteUser(userId);
      notificationService.success('Usuario eliminado permanentemente.');
      await this.loadUsersTable();
      await this.updateVisibility();
    } catch (err) {
      notificationService.error(err.message || 'Error al eliminar usuario.');
    }
  },

  /**
   * Asigna o remueve rol de admin en user_roles
   */
  async handleToggleAdminRole(userId, makeAdmin) {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    const currentUser = authModel.getCurrentUser();
    const isSystemAdmin = currentUser?.isAdmin || Number(currentUser?.role_id) === 1;
    if (!canWriteRoles && !isSystemAdmin) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para asignar o modificar roles de administrador.');
      return;
    }

    try {
      await adminModel.setAdminRole(userId, makeAdmin);
      notificationService.success(makeAdmin ? 'Rol de administrador asignado en user_roles.' : 'Rol de administrador removido.');
      await this.loadUsersTable();
      await this.loadRolesForUserSelect();
      await this.updateVisibility();
    } catch (err) {
      notificationService.error(err.message || 'Error al actualizar rol en user_roles.');
    }
  },

  // =====================================================================
  // GESTIÓN DE ROLES (TABLA ROLES) Y PERMISOS (TABLA ROLES_PERMISION)
  // =====================================================================

  activePermissionsRoleId: null,

  /**
   * Carga la lista de roles en la tabla
   */
  async loadRolesSection() {
    const tbody = $('#admin-roles-table-body');
    const countBadge = $('#admin-roles-count-badge');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
          Cargando roles desde la tabla 'roles'...
        </td>
      </tr>
    `;

    try {
      const roles = await adminModel.getRoles();
      const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');

      // Controlar visibilidad del formulario de roles según permisos de escritura
      const btnNewRole = $('#btn-admin-scroll-new-role');
      if (btnNewRole) btnNewRole.style.display = canWriteRoles ? 'inline-flex' : 'none';
      const formRole = $('#form-admin-role');
      if (formRole) formRole.style.display = canWriteRoles ? 'block' : 'none';

      if (countBadge) {
        countBadge.textContent = `${roles.length} rol(es) registrado(s)${!canWriteRoles ? ' [Solo Lectura]' : ''}`;
      }

      if (!roles || roles.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
              No hay roles registrados en la base de datos.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = roles.map(r => {
        const isSystemAdmin = Number(r.id) === 1 || r.nombre === 'admin';
        return `
          <tr style="border-bottom: 1px solid rgba(125,125,125,0.15);">
            <td style="padding: 0.65rem 0.85rem; font-family: var(--app-code-font); font-weight: 700;">
              #${r.id}
            </td>
            <td style="padding: 0.65rem 0.85rem;">
              <strong style="font-size: 0.88rem;">${r.nombre}</strong>
              ${isSystemAdmin ? '<span class="badge" data-paint="warning" style="margin-left: 0.35rem; font-size: 0.68rem;">🛡️ Sistema</span>' : ''}
            </td>
            <td style="padding: 0.65rem 0.85rem; font-size: 0.82rem; opacity: 0.85;">
              ${r.tipo || 'Sin descripción'}
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              <span class="badge" data-paint="${r.activo ? 'success' : 'danger'}">
                ${r.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              <span class="badge" data-paint="${r.totalPermisos > 0 ? 'primary' : 'neutral'}" title="${r.permsLeer} lectura, ${r.permsEscribir} escritura">
                🔑 ${r.totalPermisos} obj (${r.permsLeer}👁️, ${r.permsEscribir}✏️)
              </span>
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: right;">
              <div class="cluster" data-gap="2xs" data-justify="end" style="align-items: center;">
                <button 
                  type="button" 
                  class="button btn-role-perms" 
                  data-role-id="${r.id}" 
                  data-role-name="${r.nombre}" 
                  data-size="sm" 
                  data-paint="${canWriteRoles ? 'primary' : 'neutral'}" 
                  data-variant="${canWriteRoles ? '' : 'ghost'}"
                  title="${canWriteRoles ? 'Gestionar permisos en roles_permision' : 'Ver permisos asignados (Solo lectura)'}"
                >
                  ${canWriteRoles ? '🔑 Permisos' : '👁️ Ver Permisos'}
                </button>
                ${canWriteRoles ? `
                <button 
                  type="button" 
                  class="button btn-edit-role-admin" 
                  data-role-id="${r.id}" 
                  data-size="sm" 
                  data-variant="ghost" 
                  title="Modificar rol"
                >
                  ✏️
                </button>
                ` : ''}
                ${canWriteRoles && !isSystemAdmin ? `
                  <button 
                    type="button" 
                    class="button btn-del-role-admin" 
                    data-role-id="${r.id}" 
                    data-role-name="${r.nombre}" 
                    data-size="sm" 
                    data-variant="ghost" 
                    style="color: #ef4444;" 
                    title="Eliminar rol"
                  >
                    🗑️
                  </button>
                ` : ''}
              </div>
            </td>
          </tr>
        `;
      }).join('');
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding: 1.5rem; text-align: center; color: #ef4444;">
            Error cargando roles: ${err.message}
          </td>
        </tr>
      `;
    }
  },

  /**
   * Guarda o actualiza un rol
   */
  async handleSaveRole() {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    if (!canWriteRoles) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para crear o modificar roles.');
      return;
    }

    const id = $('#admin-role-id')?.value;
    const nameInput = $('#admin-role-name');
    const typeInput = $('#admin-role-type');
    const activeCheck = $('#admin-role-active');
    const submitBtn = $('#btn-submit-role-admin');

    const nombre = nameInput?.value?.trim();
    const tipo = typeInput?.value?.trim();
    const activo = activeCheck ? activeCheck.checked : true;

    if (!nombre || !tipo) {
      notificationService.error('Nombre del rol y descripción son obligatorios.');
      return;
    }

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      if (id) {
        await adminModel.updateRole(Number(id), { nombre, tipo, activo });
        notificationService.success(`Rol "${nombre}" actualizado correctamente.`);
      } else {
        await adminModel.createRole({ nombre, tipo, activo });
        notificationService.success(`Rol "${nombre}" registrado con éxito en tabla roles.`);
      }

      this.resetRoleForm();
      await this.loadRolesSection();
      this.loadRolesForUserSelect();
    } catch (err) {
      notificationService.error(err.message || 'Error al guardar rol.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  },

  /**
   * Carga los datos de un rol en el formulario para editar
   */
  async handleEditRole(roleId) {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    if (!canWriteRoles) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para editar roles.');
      return;
    }

    try {
      const role = await adminModel.getRoleById(roleId);
      if (!role) {
        notificationService.error('No se encontró el rol seleccionado.');
        return;
      }

      $('#admin-role-id').value = String(role.id);
      $('#admin-role-name').value = role.nombre || '';
      $('#admin-role-type').value = role.tipo || '';

      const activeCheck = $('#admin-role-active');
      if (activeCheck) activeCheck.checked = Boolean(role.activo !== false);

      $('#admin-role-form-title').textContent = `✏️ Modificar Rol: ${role.nombre}`;
      $('#admin-role-form-badge').textContent = 'Modo Editar';
      $('#admin-role-form-badge').setAttribute('data-paint', 'warning');
      $('#btn-cancel-role-form').style.display = 'inline-flex';
      $('#btn-submit-role-admin').textContent = '💾 Actualizar Rol';

      $('#form-admin-role')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      notificationService.error(`Error cargando rol: ${err.message}`);
    }
  },

  /**
   * Restablece el formulario de rol
   */
  resetRoleForm() {
    const form = $('#form-admin-role');
    if (form) form.reset();

    $('#admin-role-id').value = '';
    $('#admin-role-form-title').textContent = '➕ Registrar Nuevo Rol';
    $('#admin-role-form-badge').textContent = 'Modo Crear';
    $('#admin-role-form-badge').setAttribute('data-paint', 'primary');
    $('#btn-cancel-role-form').style.display = 'none';
    $('#btn-submit-role-admin').textContent = '💾 Guardar Rol';

    const activeCheck = $('#admin-role-active');
    if (activeCheck) activeCheck.checked = true;
  },

  /**
   * Elimina un rol
   */
  async handleDeleteRole(roleId, roleName) {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    if (!canWriteRoles) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para eliminar roles.');
      return;
    }

    try {
      await adminModel.deleteRole(roleId);
      notificationService.success(`Rol "${roleName}" eliminado correctamente.`);
      await this.loadRolesSection();
      this.loadRolesForUserSelect();

      // Si el panel de permisos activo pertenecía a este rol, cerrarlo
      if (this.activePermissionsRoleId === Number(roleId)) {
        const panel = $('#admin-role-perms-panel');
        if (panel) panel.style.display = 'none';
        this.activePermissionsRoleId = null;
      }
    } catch (err) {
      notificationService.error(err.message || 'Error al eliminar rol.');
    }
  },

  /**
   * Abre la matriz de permisos para un rol seleccionado
   */
  async openRolePermissions(roleId) {
    this.activePermissionsRoleId = Number(roleId);
    const panel = $('#admin-role-perms-panel');
    const titleBadge = $('#perms-active-role-name');
    const tbody = $('#admin-perms-table-body');

    if (!panel || !tbody) return;

    panel.style.display = 'flex';
    if (titleBadge) titleBadge.textContent = `Cargando...`;

    tbody.innerHTML = `
      <tr>
        <td colspan="4" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
          Consultando permisos en tabla 'roles_permision'...
        </td>
      </tr>
    `;

    panel.scrollIntoView({ behavior: 'smooth' });

    try {
      const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
      const role = await adminModel.getRoleById(roleId);
      if (titleBadge && role) {
        titleBadge.textContent = `${role.nombre.toUpperCase()} (#${role.id})${!canWriteRoles ? ' — [SOLO LECTURA]' : ''}`;
      }

      // Notificación visual de solo lectura si no tiene permiso de escritura
      const notice = $('#perms-readonly-notice');
      if (notice) {
        if (!canWriteRoles) {
          const current = authModel.getCurrentUser();
          const rName = current?.role_name || current?.rol || 'actual';
          notice.innerHTML = `
            <div class="box cluster" data-paint="warning" style="padding: 0.65rem 0.85rem; font-size: 0.82rem; border-radius: 6px; background: rgba(245, 158, 11, 0.12); color: #d97706; margin-bottom: 0.65rem; align-items: center; gap: 0.5rem; border: 1px solid rgba(245, 158, 11, 0.25);">
              <span style="font-size: 1.2rem;">🔒</span>
              <div>
                <strong>Modo Solo Lectura:</strong> Tu rol actual (<em>${rName}</em>) no tiene permisos de escritura para modificar o asignar permisos a roles. Los controles están bloqueados.
              </div>
            </div>
          `;
          notice.style.display = 'block';
        } else {
          notice.innerHTML = '';
          notice.style.display = 'none';
        }
      }

      // Ajustar visibilidad de botones rápidos y guardado
      const quickActions = $('#perms-quick-actions');
      if (quickActions) quickActions.style.display = canWriteRoles ? 'inline-flex' : 'none';
      const saveContainer = $('#perms-save-container');
      if (saveContainer) saveContainer.style.display = canWriteRoles ? 'flex' : 'none';

      const permissions = await adminModel.getPermissionsByRoleId(roleId);

      if (!permissions || permissions.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
              No se encontraron objetos registrados en el sistema.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = permissions.map(p => `
        <tr class="perm-row" data-obj-id="${p.objeto_id}" data-obj-name="${p.nombre.toLowerCase()}" style="border-bottom: 1px solid rgba(125,125,125,0.12);">
          <td style="padding: 0.5rem 0.85rem;">
            <div class="stack" data-gap="2xs">
              <strong style="font-size: 0.82rem;">${p.nombre}</strong>
              <small style="opacity: 0.75; font-size: 0.72rem;">
                <code>${p.id_vista || 'vista'}</code> | ${p.descripcion || ''}
              </small>
            </div>
          </td>
          <td style="padding: 0.5rem 0.85rem; text-align: center;">
            <input 
              type="checkbox" 
              class="perm-chk-leer" 
              data-obj-id="${p.objeto_id}" 
              ${p.leer ? 'checked' : ''} 
              ${!canWriteRoles ? 'disabled' : ''}
              style="width: 17px; height: 17px; cursor: ${canWriteRoles ? 'pointer' : 'not-allowed'};"
              title="${canWriteRoles ? 'Permiso de lectura/visualización' : 'Solo lectura (deshabilitado)'}"
            />
          </td>
          <td style="padding: 0.5rem 0.85rem; text-align: center;">
            <input 
              type="checkbox" 
              class="perm-chk-escribir" 
              data-obj-id="${p.objeto_id}" 
              ${p.escribir ? 'checked' : ''} 
              ${!canWriteRoles ? 'disabled' : ''}
              style="width: 17px; height: 17px; cursor: ${canWriteRoles ? 'pointer' : 'not-allowed'};"
              title="${canWriteRoles ? 'Permiso de escritura/creación/edición' : 'Solo lectura (deshabilitado)'}"
            />
          </td>
          <td style="padding: 0.5rem 0.85rem; text-align: center;">
            <input 
              type="checkbox" 
              class="perm-chk-activo" 
              data-obj-id="${p.objeto_id}" 
              ${p.activo ? 'checked' : ''} 
              ${!canWriteRoles ? 'disabled' : ''}
              style="width: 17px; height: 17px; cursor: ${canWriteRoles ? 'pointer' : 'not-allowed'};"
              title="${canWriteRoles ? 'Habilitado para este rol' : 'Solo lectura (deshabilitado)'}"
            />
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="padding: 1.5rem; text-align: center; color: #ef4444;">
            Error cargando permisos: ${err.message}
          </td>
        </tr>
      `;
    }
  },

  /**
   * Guarda los permisos configurados en la tabla 'roles_permision'
   */
  async handleSaveRolePermissions() {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    if (!canWriteRoles) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para modificar la asignación de permisos por roles.');
      return;
    }

    if (!this.activePermissionsRoleId) {
      notificationService.error('No hay un rol activo seleccionado.');
      return;
    }

    const saveBtn = $('#btn-save-role-perms');
    const originalText = saveBtn ? saveBtn.textContent : '';
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando en roles_permision...';
    }

    try {
      const rows = document.querySelectorAll('#admin-perms-table-body .perm-row');
      const permissionsList = [];

      rows.forEach(row => {
        const objId = Number(row.getAttribute('data-obj-id'));
        const leerChk = row.querySelector('.perm-chk-leer');
        const escribirChk = row.querySelector('.perm-chk-escribir');
        const activoChk = row.querySelector('.perm-chk-activo');

        const leer = Boolean(leerChk && leerChk.checked);
        const escribir = Boolean(escribirChk && escribirChk.checked);
        let activo = Boolean(activoChk && activoChk.checked);

        // Si tiene leer o escribir, auto-activar
        if (leer || escribir) {
          activo = true;
        }

        permissionsList.push({
          objeto_id: objId,
          leer,
          escribir,
          activo
        });
      });

      await adminModel.saveRolePermissions(this.activePermissionsRoleId, permissionsList);
      notificationService.success('✅ Permisos del rol guardados exitosamente en la tabla "roles_permision".');

      // Actualizar listado de roles para reflejar el nuevo conteo de permisos
      await this.loadRolesSection();

      // Si el rol modificado es el del usuario en sesión, recargar y aplicar permisos inmediatamente
      const currentUser = authModel.getCurrentUser();
      if (currentUser && Number(currentUser.role_id) === Number(this.activePermissionsRoleId)) {
        await permissionService.loadPermissionsForUser(currentUser.id, currentUser.role_id);
      }
    } catch (err) {
      notificationService.error(`Error guardando permisos: ${err.message}`);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
      }
    }
  },

  /**
   * Establece el estado de todos los checkboxes en la matriz de permisos
   */
  setAllPermissionsState({ leer, escribir, activo }) {
    const canWriteRoles = permissionService.canWrite('admin-section-user-roles') || permissionService.canWrite('admin-section-roles');
    if (!canWriteRoles) {
      notificationService.error('Operación denegada: Tu rol no tiene permisos para modificar la asignación de permisos por roles.');
      return;
    }

    const leerChks = document.querySelectorAll('#admin-perms-table-body .perm-chk-leer');
    const escribirChks = document.querySelectorAll('#admin-perms-table-body .perm-chk-escribir');
    const activoChks = document.querySelectorAll('#admin-perms-table-body .perm-chk-activo');

    leerChks.forEach(chk => { chk.checked = Boolean(leer); });
    escribirChks.forEach(chk => { chk.checked = Boolean(escribir); });
    activoChks.forEach(chk => { chk.checked = Boolean(activo); });
  },

  /**
   * Filtra los objetos mostrados en la matriz de permisos
   */
  filterPermissionsObjects(term) {
    const cleanTerm = (term || '').toLowerCase().trim();
    const rows = document.querySelectorAll('#admin-perms-table-body .perm-row');

    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      if (!cleanTerm || text.includes(cleanTerm)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
};
