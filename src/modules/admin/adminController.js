/**
 * Controlador de Configuración Administrativa
 * Controla la visibilidad del botón 'Configuración' (solo para rol 'admin' en user_roles),
 * la apertura del modal y las operaciones CRUD de consultorio, doctor y roles.
 */

import { adminModel } from './adminModel.js';
import { authModel } from '../auth/authModel.js';
import { notificationService } from '../../services/notificationService.js';
import { $ } from '../../utils/dom.js';

export const adminController = {
  init() {
    this.bindEvents();
    this.updateVisibility();
  },

  /**
   * Actualiza la visibilidad del botón 'Configuración' en la barra de botones.
   * Solo visible si el usuario tiene rol 'admin' verificado en la tabla 'user_roles'.
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

      // Consultar verificación estricta en tabla 'user_roles'
      const isAdmin = await adminModel.isCurrentUserAdmin();

      if (isAdmin) {
        configBtn.style.display = 'inline-flex';
        // Sincronizar estado en sesión local para acceso instantáneo
        if (!user.isAdmin) {
          authModel.saveSession(user, true);
        }
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

    // 5. Clics en acciones de las listas (eliminar consultorio, eliminar doctor, cambiar rol)
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
  },

  openModal() {
    const dialog = $('#modal-admin-config');
    if (!dialog) return;

    this.switchSection('hub');

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
      users: $('#admin-section-users')
    };

    const navButtons = {
      hub: $('#admin-nav-hub'),
      consultorio: $('#admin-nav-consultorio'),
      doctor: $('#admin-nav-doctor'),
      users: $('#admin-nav-users')
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

    // Cargar datos correspondientes al cambiar de sección
    if (section === 'consultorio') {
      await this.loadConsultoriosList();
    } else if (section === 'doctor') {
      await this.loadDoctoresSection();
    } else if (section === 'users') {
      await this.loadUsersTable();
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
    const select = $('#admin-doctor-consultorio');
    if (select) {
      const consultorios = await adminModel.getConsultorios();
      select.innerHTML = `
        <option value="">-- Sin Consultorio Asignado --</option>
        ${consultorios.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
      `;
    }

    await this.loadDoctoresList();
  },

  /**
   * Carga y renderiza la lista de doctores
   */
  async loadDoctoresList() {
    const container = $('#admin-doctores-container');
    if (!container) return;

    container.innerHTML = '<p style="font-size: 0.82rem; opacity: 0.7;">Cargando doctores...</p>';

    try {
      const doctores = await adminModel.getDoctores();
      if (!doctores || doctores.length === 0) {
        container.innerHTML = `
          <div class="box" data-surface="raised" data-border style="padding: 1rem; text-align: center;">
            <p style="margin: 0; font-size: 0.85rem; opacity: 0.8;">No hay doctores registrados aún. Agrega uno nuevo arriba.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="admin-items-grid">
          ${doctores.map(d => `
            <div class="admin-item-card box" data-surface="raised" data-border>
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span style="font-size: 1.25rem;">🩺</span>
                  <div>
                    <strong style="font-size: 0.9rem; display: block;">${d.nombre}</strong>
                    <small style="opacity: 0.75; font-size: 0.78rem;">
                      📞 ${d.telefono || 'Sin tel'} | ✉️ ${d.mail || 'Sin correo'}
                      ${d.consultorio ? ` | 🏢 Sede: ${d.consultorio.nombre}` : ''}
                    </small>
                  </div>
                </div>
                <button type="button" class="button btn-admin-del-doctor" data-variant="ghost" data-size="sm" data-id="${d.id}" data-name="${d.nombre}" title="Eliminar doctor" style="color: #ef4444;">
                  🗑️
                </button>
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
   * Guarda un nuevo doctor
   */
  async handleSaveDoctor() {
    const submitBtn = $('#btn-submit-doctor-admin');
    const nameInput = $('#admin-doctor-name');
    const phoneInput = $('#admin-doctor-phone');
    const mailInput = $('#admin-doctor-mail');
    const consultorioSelect = $('#admin-doctor-consultorio');

    const nombre = nameInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const mail = mailInput?.value.trim();
    const consultorio_id = consultorioSelect?.value || null;

    if (!nombre) {
      notificationService.error('Ingresa el nombre del doctor.');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      await adminModel.createDoctor({ nombre, telefono, mail, consultorio_id });
      notificationService.success(`Doctor "${nombre}" registrado con éxito.`);
      $('#form-admin-doctor')?.reset();
      await this.loadDoctoresList();
    } catch (err) {
      notificationService.error(err.message || 'Error al guardar doctor.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar Doctor';
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
      await this.loadDoctoresList();
    } catch (err) {
      notificationService.error(err.message || 'Error al eliminar doctor.');
    }
  },

  /**
   * Carga la tabla de usuarios con sus roles en user_roles
   */
  async loadUsersTable() {
    const tbody = $('#admin-users-table-body');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
          Consultando usuarios y tabla user_roles en tiempo real...
        </td>
      </tr>
    `;

    try {
      const users = await adminModel.getUsersWithRoles();
      if (!users || users.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
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
                  🛡️ admin
                </span>
              ` : `
                <span class="badge" data-variant="ghost" style="opacity: 0.8;">
                  👤 usuario
                </span>
              `}
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: center;">
              <span class="badge" data-paint="${u.activo ? 'success' : 'danger'}">
                ${u.activo ? 'Activo' : 'Inactivo'}
              </span>
            </td>
            <td style="padding: 0.65rem 0.85rem; text-align: right;">
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
   * Asigna o remueve rol de admin en user_roles
   */
  async handleToggleAdminRole(userId, makeAdmin) {
    try {
      await adminModel.setAdminRole(userId, makeAdmin);
      notificationService.success(makeAdmin ? 'Rol de administrador asignado en user_roles.' : 'Rol de administrador removido.');
      await this.loadUsersTable();
      await this.updateVisibility();
    } catch (err) {
      notificationService.error(err.message || 'Error al actualizar rol en user_roles.');
    }
  }
};
