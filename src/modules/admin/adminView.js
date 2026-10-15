/**
 * Vista del Módulo de Configuración Administrativa
 * Modal exclusivo para usuarios con rol 'admin' verificado en 'user_roles'.
 */

import { renderTasaSection, renderTasaModal } from '../tasaCambio/tasaCambioView.js';

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
            <span>👥 Usuarios</span>
          </button>
          <button type="button" id="admin-nav-roles" class="button btn-admin-tab" data-variant="ghost" data-size="sm">
            <span>🛡️🔑 Roles y Permisos</span>
          </button>
          <button type="button" id="admin-nav-tasa" class="button btn-admin-tab" data-variant="ghost" data-size="sm">
            <span>💵 Tasa de Cambio</span>
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

              <!-- Botón 3: Cuentas de Usuario -->
              <button type="button" id="btn-admin-open-users" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(245, 158, 11, 0.12); color: #f59e0b;">
                  <span class="feature-card-icon">👥</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Cuentas de Usuario</h4>
                  <p class="feature-card-desc">
                    Crear, editar, activar y eliminar usuarios en la tabla usuario con contraseña encriptada.
                  </p>
                </div>
                <div class="feature-card-arrow">➜</div>
              </button>

              <!-- Botón 4: Roles y Permisos de Objetos -->
              <button type="button" id="btn-admin-open-roles" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(139, 92, 246, 0.12); color: #8b5cf6;">
                  <span class="feature-card-icon">🛡️🔑</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Roles y Permisos</h4>
                  <p class="feature-card-desc">
                    Administrar la tabla roles y asignar permisos de lectura/escritura en roles_permision sobre los objetos del sistema.
                  </p>
                </div>
                <div class="feature-card-arrow">➜</div>
              </button>

              <!-- Botón 5: Tasas de Cambio (BCV USD) -->
              <button type="button" id="btn-admin-open-tasa" class="admin-feature-card box" data-surface="sunken" data-border>
                <div class="feature-card-icon-wrap" style="background: rgba(16, 185, 129, 0.12); color: #10b981;">
                  <span class="feature-card-icon">💵</span>
                </div>
                <div class="feature-card-text">
                  <h4 class="feature-card-title">Tasas de Cambio (BCV)</h4>
                  <p class="feature-card-desc">
                    Control de tasas de cambio históricas y scraping automático en tiempo real desde el portal oficial del BCV.
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
                <h4 style="margin: 0; font-size: 1rem;">🩺 Gestión de Doctores y Especialistas</h4>
                <small style="opacity: 0.75;">Odontólogos asociados a los consultorios del sistema</small>
              </div>
              <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                ◀ Volver al Menú
              </button>
            </div>

            <!-- Formulario CRUD de Doctor (Crear / Modificar) -->
            <form id="form-admin-doctor" class="box stack" data-surface="sunken" data-border data-gap="sm">
              <input type="hidden" id="admin-doctor-id" value="" />
              
              <div class="cluster" data-justify="between" data-align="center" style="border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.08)); padding-bottom: 0.4rem;">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span id="admin-doctor-form-badge" class="badge" data-paint="primary" style="font-size: 0.75rem;">➕ Nuevo Especialista</span>
                  <span id="admin-doctor-form-indicator" style="font-size: 0.8rem; opacity: 0.85;">Completar datos del doctor</span>
                </div>
                <button type="button" id="btn-cancel-doctor-form" class="button" data-variant="ghost" data-size="xs" style="display: none; color: #ef4444;">
                  ✖ Cancelar Edición
                </button>
              </div>

              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-doctor-name" class="label">Nombre del Especialista *</label>
                  <input type="text" id="admin-doctor-name" class="input" placeholder="Ej. Dra. Kris Rodríguez" required />
                </div>

                <div class="field">
                  <label for="admin-doctor-consultorio" class="label">Consultorio / Sede Asignada *</label>
                  <select id="admin-doctor-consultorio" class="input select" required disabled style="cursor: not-allowed; opacity: 0.95; background: rgba(255,255,255,0.06);">
                    <option value="" disabled selected>Cargando consultorio de la sesión...</option>
                  </select>
                  <small id="admin-doctor-consultorio-hint" style="font-size: 0.75rem; color: #3b82f6; display: block; margin-top: 3px;">
                    🔒 Sede fijada al consultorio de la sesión activa
                  </small>
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

            <!-- Lista de Doctores Registrados (Filtrados por consultorio logueado) -->
            <div class="stack" data-gap="xs">
              <div class="cluster" data-justify="between" data-align="center">
                <h5 style="margin: 0; font-size: 0.85rem; font-weight: 600;">Especialistas de la Sede</h5>
                <span id="admin-doctor-filter-badge" class="badge" data-paint="info" style="font-size: 0.75rem;">
                  🏢 Sede Activa
                </span>
              </div>
              <div id="admin-doctores-container" class="admin-items-list-container">
                <p style="font-size: 0.82rem; opacity: 0.7;">Cargando doctores...</p>
              </div>
            </div>
          </section>

          <!-- 4. VISTA: GESTIÓN DE USUARIOS Y PERMISOS (CRUD COMPLETO TABLA USUARIO) -->
          <section id="admin-section-users" class="admin-section stack" data-gap="md" style="display: none;">
            <div class="cluster" data-justify="between" data-align="center">
              <div>
                <h4 style="margin: 0; font-size: 1rem;">👥🔑 Gestión de Cuentas de Usuario</h4>
                <small style="opacity: 0.75;">Crear, modificar, dar de baja y asignar roles a los usuarios del sistema</small>
              </div>
              <div class="cluster" data-gap="xs">
                <button type="button" id="btn-admin-scroll-new-user" class="button" data-paint="primary" data-size="sm">
                  ➕ Nuevo Usuario
                </button>
                <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                  ◀ Volver al Menú
                </button>
              </div>
            </div>

            <!-- Formulario de Usuario (Crear / Modificar) -->
            <form id="form-admin-user" class="box stack" data-surface="sunken" data-border data-gap="sm">
              <div class="cluster" data-justify="between" data-align="center" style="border-bottom: 1px solid rgba(125,125,125,0.15); padding-bottom: 0.35rem;">
                <h5 id="admin-user-form-title" style="margin: 0; font-size: 0.88rem; font-weight: 700;">
                  ➕ Registrar Nuevo Usuario
                </h5>
                <span id="admin-user-form-badge" class="badge" data-paint="primary" style="font-size: 0.7rem;">
                  Modo Crear
                </span>
              </div>

              <input type="hidden" id="admin-user-id" value="" />

              <!-- Nombre y Cédula -->
              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-user-name" class="label">Nombre Completo *</label>
                  <input type="text" id="admin-user-name" class="input" placeholder="Ej. Dra. Kris Rodríguez" required />
                </div>

                <div class="field">
                  <label for="admin-user-ci" class="label">Cédula de Identidad (CI) *</label>
                  <input type="text" id="admin-user-ci" class="input" placeholder="Ej. 10838729" required />
                </div>
              </div>

              <!-- Correo y Teléfono -->
              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-user-email" class="label">Correo Electrónico (Login) *</label>
                  <input type="email" id="admin-user-email" class="input" placeholder="usuario@odontokris.com" required />
                </div>

                <div class="field">
                  <label for="admin-user-phone" class="label">Teléfono de Contacto</label>
                  <input type="tel" id="admin-user-phone" class="input" placeholder="Ej. +58 414-8674528" />
                </div>
              </div>

              <!-- Contraseña y Rol -->
              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-user-password" class="label">
                    Contraseña <span id="admin-user-pass-required">*</span>
                  </label>
                  <input type="password" id="admin-user-password" class="input" placeholder="Mínimo 6 caracteres" />
                  <small id="admin-user-pass-help" style="opacity: 0.7; font-size: 0.7rem; display: block; margin-top: 0.2rem;">
                    Requerida para nuevos usuarios.
                  </small>
                </div>

                <div class="field">
                  <label for="admin-user-rol" class="label">Rol en el Sistema *</label>
                  <select id="admin-user-rol" class="input select" required>
                    <option value="">Cargando roles de la base de datos...</option>
                  </select>
                  <small style="opacity: 0.7; font-size: 0.7rem; display: block; margin-top: 0.2rem;">
                    Roles registrados en la tabla <code>roles</code> de Supabase.
                  </small>
                </div>
              </div>

              <!-- Consultorio / Sede Asignada -->
              <div class="field">
                <label for="admin-user-consultorio" class="label">🏢 Consultorio / Sede Asignada</label>
                <select id="admin-user-consultorio" class="input select">
                  <option value="">🌐 Todos los consultorios (Acceso Global)</option>
                </select>
                <small style="opacity: 0.7; font-size: 0.7rem; display: block; margin-top: 0.2rem;">
                  Si se deja vacío, el usuario tiene acceso a todos los consultorios. Si se selecciona uno, solo verá esa sede al iniciar sesión.
                </small>
              </div>

              <!-- Estado Activo y Botones de Acción -->
              <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.35rem;">
                <label class="cluster" data-gap="xs" style="cursor: pointer; user-select: none;">
                  <input type="checkbox" id="admin-user-active" checked />
                  <span style="font-size: 0.82rem; font-weight: 600;">Usuario Activo (Permite iniciar sesión)</span>
                </label>

                <div class="cluster" data-gap="xs">
                  <button type="button" id="btn-cancel-user-form" class="button" data-variant="ghost" data-size="sm" style="display: none;">
                    ✕ Cancelar Edición
                  </button>
                  <button type="submit" id="btn-submit-user-admin" class="button" data-paint="primary" data-size="sm">
                    💾 Guardar Usuario
                  </button>
                </div>
              </div>
            </form>

            <!-- Barra de Filtro y Contador de Usuarios -->
            <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.5rem;">
              <div class="cluster" data-gap="xs" data-align="center">
                <input type="search" id="admin-user-search-input" class="input" placeholder="🔍 Buscar por nombre, correo o CI..." style="max-width: 280px;" />
              </div>
              <span id="admin-users-count-badge" class="badge" data-paint="neutral" style="font-size: 0.75rem;">
                Cargando...
              </span>
            </div>

            <!-- Tabla de Usuarios con Roles -->
            <div class="admin-users-table-wrapper box" data-surface="sunken" data-border style="padding: 0; overflow-x: auto;">
              <table class="table admin-users-table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 1px solid rgba(125,125,125,0.2);">
                    <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Usuario</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Contacto</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Rol Asignado</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Sede Autorizada</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Estado</th>
                    <th style="padding: 0.65rem 0.85rem; text-align: right; font-size: 0.8rem;">Acciones</th>
                  </tr>
                </thead>
                <tbody id="admin-users-table-body">
                  <tr>
                    <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
                      Cargando lista de usuarios y roles...
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="box admin-hint-box" data-border style="padding: 0.65rem 0.85rem; font-size: 0.78rem; opacity: 0.85;">
              ℹ️ <strong>Roles Centralizados:</strong> Las opciones de rol se cargan directamente de la tabla <code>roles</code>. Al asignar un rol a un usuario, el sistema sincroniza su registro en <code>user_roles</code> para asociar sus permisos.
            </div>
          </section>

          <!-- 5. VISTA: CRUD DE ROLES Y GESTIÓN DE PERMISOS (ROLES & ROLES_PERMISION) -->
          <section id="admin-section-roles" class="admin-section stack" data-gap="md" style="display: none;">
            <div class="cluster" data-justify="between" data-align="center">
              <div>
                <h4 style="margin: 0; font-size: 1rem;">🛡️🔑 Gestión de Roles y Permisos</h4>
                <small style="opacity: 0.75;">Administración de roles (tabla roles) y permisos de lectura/escritura (tabla roles_permision)</small>
              </div>
              <div class="cluster" data-gap="xs">
                <button type="button" id="btn-admin-scroll-new-role" class="button" data-paint="primary" data-size="sm">
                  ➕ Nuevo Rol
                </button>
                <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
                  ◀ Volver al Menú
                </button>
              </div>
            </div>

            <!-- Formulario de Rol (Crear / Modificar) -->
            <form id="form-admin-role" class="box stack" data-surface="sunken" data-border data-gap="sm">
              <div class="cluster" data-justify="between" data-align="center" style="border-bottom: 1px solid rgba(125,125,125,0.15); padding-bottom: 0.35rem;">
                <h5 id="admin-role-form-title" style="margin: 0; font-size: 0.88rem; font-weight: 700;">
                  ➕ Registrar Nuevo Rol
                </h5>
                <span id="admin-role-form-badge" class="badge" data-paint="primary" style="font-size: 0.7rem;">
                  Modo Crear
                </span>
              </div>

              <input type="hidden" id="admin-role-id" value="" />

              <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div class="field">
                  <label for="admin-role-name" class="label">Nombre del Rol *</label>
                  <input type="text" id="admin-role-name" class="input" placeholder="Ej. odontologo, recepcionista, asistente" required />
                  <small style="opacity: 0.7; font-size: 0.7rem;">Identificador único del rol (minúsculas)</small>
                </div>

                <div class="field">
                  <label for="admin-role-type" class="label">Tipo / Descripción *</label>
                  <input type="text" id="admin-role-type" class="input" placeholder="Ej. Personal de recepción y atención clínica" required />
                </div>
              </div>

              <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.35rem;">
                <label class="cluster" data-gap="xs" style="cursor: pointer; user-select: none;">
                  <input type="checkbox" id="admin-role-active" checked />
                  <span style="font-size: 0.82rem; font-weight: 600;">Rol Activo en el Sistema</span>
                </label>

                <div class="cluster" data-gap="xs">
                  <button type="button" id="btn-cancel-role-form" class="button" data-variant="ghost" data-size="sm" style="display: none;">
                    ✕ Cancelar Edición
                  </button>
                  <button type="submit" id="btn-submit-role-admin" class="button" data-paint="primary" data-size="sm">
                    💾 Guardar Rol
                  </button>
                </div>
              </div>
            </form>

            <!-- Lista de Roles Registrados -->
            <div class="stack" data-gap="xs">
              <div class="cluster" data-justify="between" data-align="center">
                <h5 style="margin: 0; font-size: 0.88rem; font-weight: 700;">Roles Registrados en la Base de Datos</h5>
                <span id="admin-roles-count-badge" class="badge" data-paint="neutral" style="font-size: 0.75rem;">Cargando roles...</span>
              </div>

              <div class="admin-users-table-wrapper box" data-surface="sunken" data-border style="padding: 0; overflow-x: auto;">
                <table class="table admin-roles-table" style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid rgba(125,125,125,0.2);">
                      <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem; width: 60px;">ID</th>
                      <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Rol</th>
                      <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.8rem;">Descripción / Tipo</th>
                      <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Estado</th>
                      <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.8rem;">Permisos Activos</th>
                      <th style="padding: 0.65rem 0.85rem; text-align: right; font-size: 0.8rem;">Acciones</th>
                    </tr>
                  </thead>
                  <tbody id="admin-roles-table-body">
                    <tr>
                      <td colspan="6" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
                        Cargando roles...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- PANEL DE GESTIÓN DE PERMISOS PARA UN ROL SELECCIONADO (roles_permision) -->
            <div id="admin-role-perms-panel" class="box stack" data-surface="raised" data-border data-gap="sm" style="display: none; border-left: 4px solid #8b5cf6;">
              <div class="cluster" data-justify="between" data-align="center" style="border-bottom: 1px solid rgba(125,125,125,0.2); padding-bottom: 0.5rem;">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span style="font-size: 1.2rem;">🔑</span>
                  <div>
                    <h5 style="margin: 0; font-size: 0.95rem; font-weight: 700;">
                      Permisos del Rol: <span id="perms-active-role-name" class="badge" data-paint="primary" style="font-size: 0.82rem;">...</span>
                    </h5>
                    <small style="opacity: 0.75; font-size: 0.75rem;">Configure el acceso de Lectura (leer) y Escritura (escribir) sobre cada objeto del sistema</small>
                  </div>
                </div>
                <button type="button" id="btn-close-perms-panel" class="button" data-variant="ghost" data-size="sm" title="Cerrar matriz de permisos">
                  ✕ Cerrar
                </button>
              </div>

              <!-- Contenedor para alerta de Solo Lectura -->
              <div id="perms-readonly-notice" style="display: none;"></div>

              <!-- Barra de Acciones Rápidas y Filtro de Objetos -->
              <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
                <div id="perms-quick-actions" class="cluster" data-gap="2xs" data-align="center">
                  <button type="button" id="btn-perms-grant-all" class="button" data-variant="outlined" data-size="sm" title="Marcar lectura y escritura para todos los objetos">
                    ⚡ Conceder Todo
                  </button>
                  <button type="button" id="btn-perms-read-only" class="button" data-variant="ghost" data-size="sm" title="Marcar solo lectura para todos los objetos">
                    👁️ Solo Lectura
                  </button>
                  <button type="button" id="btn-perms-revoke-all" class="button" data-variant="ghost" data-size="sm" title="Desmarcar todos los permisos">
                    🚫 Revocar Todo
                  </button>
                </div>
                <input type="search" id="perms-search-objects" class="input" placeholder="🔍 Filtrar objetos..." style="max-width: 220px;" />
              </div>

              <!-- Tabla de Objetos y Permisos (roles_permision) -->
              <div class="admin-users-table-wrapper box" data-surface="sunken" data-border style="padding: 0; max-height: 380px; overflow-y: auto;">
                <table class="table admin-perms-matrix-table" style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="border-bottom: 1px solid rgba(125,125,125,0.2); position: sticky; top: 0; background: var(--color-surface, #fff); z-index: 2;">
                      <th style="padding: 0.6rem 0.85rem; text-align: left; font-size: 0.78rem;">Objeto del Sistema (Vistas y CRUDs)</th>
                      <th style="padding: 0.6rem 0.85rem; text-align: center; font-size: 0.78rem; width: 90px;">👁️ Leer</th>
                      <th style="padding: 0.6rem 0.85rem; text-align: center; font-size: 0.78rem; width: 90px;">✏️ Escribir</th>
                      <th style="padding: 0.6rem 0.85rem; text-align: center; font-size: 0.78rem; width: 90px;">🟢 Activo</th>
                    </tr>
                  </thead>
                  <tbody id="admin-perms-table-body">
                    <tr>
                      <td colspan="4" style="padding: 1.5rem; text-align: center; opacity: 0.7;">
                        Cargando objetos y permisos...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div id="perms-save-container" class="cluster" data-justify="between" data-align="center" style="margin-top: 0.4rem; padding-top: 0.5rem; border-top: 1px solid rgba(125,125,125,0.15);">
                <small style="opacity: 0.75; font-size: 0.75rem;">
                  💾 Al guardar, los cambios se sincronizan en la tabla <code>roles_permision</code> en Supabase.
                </small>
                <button type="button" id="btn-save-role-perms" class="button" data-paint="primary" data-size="sm">
                  💾 Guardar Permisos en roles_permision
                </button>
              </div>
            </div>

          </section>

          <!-- 5. VISTA: GESTIÓN DE TASAS DE CAMBIO (CRUD TABLA tasa_cambio) -->
          ${renderTasaSection()}

        </div>

        <!-- Footer del Modal -->
        <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
          <button type="button" class="button btn-close-modal" data-variant="ghost">Cerrar</button>
        </footer>

      </div>
    </dialog>

    <!-- Modal de Registro/Edición de Tasa de Cambio con Scraping BCV -->
    ${renderTasaModal()}
  `;
}
