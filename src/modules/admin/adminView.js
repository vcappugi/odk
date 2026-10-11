/**
 * Vista del Módulo de Configuración Administrativa
 * Modal exclusivo para usuarios con rol 'admin' verificado en 'user_roles'.
 */

export function renderAdminConfigModal() {
  return `
    <!-- Modal Principal de Configuración Administrativa -->
    <dialog id="modal-admin-config" class="dialog custom-modal modal-admin-dialog modal-wide" aria-labelledby="modal-admin-config-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge admin-badge-glow">⚙️</span>
            <div>
              <div class="cluster" data-gap="xs" data-align="center">
                <h3 id="modal-admin-config-title" style="margin: 0;">Configuración Administrativa</h3>
                <span class="badge" data-paint="warning" style="font-size: 0.72rem; font-weight: 700;">🛡️ Rol: Admin</span>
              </div>
              <small class="admin-header-subtitle" style="opacity: 0.75; font-size: 0.78rem;">
                Control de sedes, doctores, cuentas de usuario y permisos del sistema
              </small>
            </div>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Barra de Navegación Rápida del Modal -->
        <nav class="admin-modal-nav cluster" data-gap="xs" data-align="center">
          <button type="button" id="admin-nav-hub" class="button btn-admin-tab active" data-paint="primary" data-size="sm">
            <span>🏠 Menú Principal</span>
          </button>
          <button type="button" id="admin-nav-consultorio" class="button btn-admin-tab" data-variant="ghost" data-size="sm">
            <span>🏢 Crear Consultorio</span>
          </button>
          <button type="button" id="admin-nav-doctor" class="button btn-admin-tab" data-variant="ghost" data-size="sm">
            <span>🩺 Registrar Dr</span>
          </button>
          <button type="button" id="admin-nav-users" class="button btn-admin-tab" data-variant="ghost" data-size="sm">
            <span>👥 Usuarios y Permisos</span>
          </button>
        </nav>

        <!-- CONTENEDOR DE SECCIONES INTERACTIVAS -->
        <div class="admin-modal-content-wrapper">

          <!-- 1. VISTA: MENÚ PRINCIPAL CON BOTONES E ICONOS DESTACADOS -->
          <section id="admin-section-hub" class="admin-section active stack" data-gap="md">
            <p class="admin-hub-lead" style="margin: 0; font-size: 0.88rem; opacity: 0.85;">
              Selecciona una opción administrativa para gestionar las funciones del sistema odontológico:
            </p>

            <div class="admin-cards-grid">
              
              <!-- Botón 1: Crear Consultorio -->
              <button type="button" id="btn-admin-open-consultorio" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(2, 132, 199, 0.12); color: #0284c7;">
                  <span class="feature-card-icon">🏢</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Crear Consultorio</h4>
                  <p class="feature-card-desc">
                    Registrar nuevas sedes o consultorios odontológicos, direcciones y números de contacto.
                  </p>
                </div>
                <div class="feature-card-arrow">➜</div>
              </button>

              <!-- Botón 2: Registrar Dr -->
              <button type="button" id="btn-admin-open-doctor" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
                  <span class="feature-card-icon">🩺</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Registrar Dr</h4>
                  <p class="feature-card-desc">
                    Dar de alta odontólogos y especialistas con sus datos de contacto y sede asignada.
                  </p>
                </div>
                <div class="feature-card-arrow">➜</div>
              </button>

              <!-- Botón 3: Gestión de Usuarios y Permisos -->
              <button type="button" id="btn-admin-open-users" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">
                  <span class="feature-card-icon">👥🔑</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Gestión de Usuarios y Permisos</h4>
                  <p class="feature-card-desc">
                    Administrar cuentas registradas, consultar y asignar el rol 'admin' en la tabla user_roles.
                  </p>
                </div>
                <div class="feature-card-arrow">➜</div>
              </button>

            </div>
          </section>

          <!-- 2. VISTA: CREAR Y GESTIONAR CONSULTORIOS -->
          <section id="admin-section-consultorio" class="admin-section stack" data-gap="md" style="display: none;">
            <div class="cluster" data-justify="between" data-align="center">
              <div>
                <h4 style="margin: 0; font-size: 1rem;">🏢 Registro de Consultorios</h4>
                <small style="opacity: 0.75;">Sedes clínicas para atención de pacientes</small>
              </div>
              <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                ◀ Volver al Menú
              </button>
            </div>

            <form id="form-admin-consultorio" class="box stack" data-surface="sunken" data-border data-gap="sm">
              <div class="field">
                <label for="admin-consultorio-name" class="label">Nombre del Consultorio / Sede *</label>
                <input type="text" id="admin-consultorio-name" class="input" placeholder="Ej. Consultorio Principal Centro" required />
              </div>

              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-consultorio-phone" class="label">Teléfono de Contacto</label>
                  <input type="tel" id="admin-consultorio-phone" class="input" placeholder="Ej. +58 414-9876543" />
                </div>
                <div class="field">
                  <label for="admin-consultorio-address" class="label">Dirección / Ubicación</label>
                  <input type="text" id="admin-consultorio-address" class="input" placeholder="Ej. Av. Bolívar, Torre Médica Piso 2" />
                </div>
              </div>

              <div class="cluster" data-justify="end" data-gap="xs" style="margin-top: 0.35rem;">
                <button type="submit" id="btn-submit-consultorio" class="button" data-paint="primary" data-size="sm">
                  💾 Guardar Consultorio
                </button>
              </div>
            </form>

            <!-- Lista de Consultorios Registrados -->
            <div class="stack" data-gap="xs">
              <h5 style="margin: 0; font-size: 0.85rem; font-weight: 600;">Sedes Registradas</h5>
              <div id="admin-consultorios-container" class="admin-items-list-container">
                <p style="font-size: 0.82rem; opacity: 0.7;">Cargando consultorios...</p>
              </div>
            </div>
          </section>

          <!-- 3. VISTA: REGISTRAR Y GESTIONAR DOCTORES -->
          <section id="admin-section-doctor" class="admin-section stack" data-gap="md" style="display: none;">
            <div class="cluster" data-justify="between" data-align="center">
              <div>
                <h4 style="margin: 0; font-size: 1rem;">🩺 Registro de Doctores y Especialistas</h4>
                <small style="opacity: 0.75;">Odontólogos asociados al sistema</small>
              </div>
              <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                ◀ Volver al Menú
              </button>
            </div>

            <form id="form-admin-doctor" class="box stack" data-surface="sunken" data-border data-gap="sm">
              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-doctor-name" class="label">Nombre del Especialista *</label>
                  <input type="text" id="admin-doctor-name" class="input" placeholder="Ej. Dra. Kris Rodríguez" required />
                </div>

                <div class="field">
                  <label for="admin-doctor-consultorio" class="label">Consultorio Asignado</label>
                  <select id="admin-doctor-consultorio" class="input select">
                    <option value="">-- Seleccionar Consultorio (Opcional) --</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-doctor-phone" class="label">Teléfono de Contacto</label>
                  <input type="tel" id="admin-doctor-phone" class="input" placeholder="Ej. +58 424-1234567" />
                </div>

                <div class="field">
                  <label for="admin-doctor-mail" class="label">Correo Profesional</label>
                  <input type="email" id="admin-doctor-mail" class="input" placeholder="doctora@odontokris.com" />
                </div>
              </div>

              <div class="cluster" data-justify="end" data-gap="xs" style="margin-top: 0.35rem;">
                <button type="submit" id="btn-submit-doctor-admin" class="button" data-paint="primary" data-size="sm">
                  💾 Guardar Doctor
                </button>
              </div>
            </form>

            <!-- Lista de Doctores Registrados -->
            <div class="stack" data-gap="xs">
              <h5 style="margin: 0; font-size: 0.85rem; font-weight: 600;">Especialistas Registrados</h5>
              <div id="admin-doctores-container" class="admin-items-list-container">
                <p style="font-size: 0.82rem; opacity: 0.7;">Cargando doctores...</p>
              </div>
            </div>
          </section>

          <!-- 4. VISTA: GESTIÓN DE USUARIOS Y PERMISOS (USER_ROLES) -->
          <section id="admin-section-users" class="admin-section stack" data-gap="md" style="display: none;">
            <div class="cluster" data-justify="between" data-align="center">
              <div>
                <h4 style="margin: 0; font-size: 1rem;">👥🔑 Gestión de Usuarios y Permisos</h4>
                <small style="opacity: 0.75;">Control de accesos y asignación de rol 'admin' en la tabla user_roles</small>
              </div>
              <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                ◀ Volver al Menú
              </button>
            </div>

            <!-- Tabla de Usuarios con Roles -->
            <div class="admin-users-table-wrapper box" data-surface="sunken" data-border style="padding: 0; overflow-x: auto;">
              <table class="table admin-users-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(125,125,125,0.2);">
                    <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Usuario</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Contacto</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Rol en user_roles</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Estado</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: right; font-size: 0.8rem;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="admin-users-table-body">
                  <tr>
                    <td colspan="5" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
                      Cargando lista de usuarios y roles...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="box admin-hint-box" data-border style="padding: 0.65rem 0.85rem; font-size: 0.78rem; opacity: 0.85;">
              ℹ️ <strong>Nota de Seguridad:</strong> El botón "Configuración" solo se despliega para los usuarios que posean el registro correspondiente con <code>role_id = 1</code> (admin) y <code>activo = true</code> en la tabla <code>user_roles</code> de Supabase.
            </div>
          </section>

        </div>

        <!-- Footer del Modal -->
        <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
          <button type="button" class="button btn-close-modal" data-variant="ghost">Cerrar</button>
        </footer>

      </div>
    </dialog>
  `;
}
