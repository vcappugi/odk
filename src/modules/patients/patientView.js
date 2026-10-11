/**
 * Vista de Gestión de Pacientes (CRUD Completo)
 * ODONTOKRIS - Sistema Odontológico
 */

import { googleDriveService, GOOGLE_DRIVE_CONFIG } from '../../services/googleDriveService.js';

export function renderPatientManagementModals() {
  return `
    <!-- 1. Modal Principal: Listado y Gestión de Pacientes -->
    <dialog id="modal-manage-patients" class="dialog custom-modal modal-wide" aria-labelledby="manage-patients-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">👥</span>
            <div>
              <h3 id="manage-patients-title" style="margin: 0;">Gestión de Pacientes</h3>
              <small class="patients-count-badge" id="patients-count-label">Cargando pacientes...</small>
            </div>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Barra de Herramientas: Buscador en vivo + Botón Nuevo Paciente + Botón Carpeta Drive -->
        <div class="patients-toolbar cluster" data-justify="between" data-align="center" data-gap="sm">
          <div class="cluster" data-gap="xs" style="flex: 1; max-width: 400px;">
            <input 
              type="search" 
              id="patient-search-input" 
              class="input" 
              placeholder="🔍 Buscar por nombre, cédula o teléfono..." 
              autocomplete="off"
            />
          </div>

          <div class="cluster" data-gap="xs">
            <button type="button" id="btn-quick-open-drive" class="button" data-variant="ghost" data-size="sm" title="Abrir carpeta de fotos en Google Drive">
              <span>📁 Google Drive</span>
            </button>
            <button type="button" id="btn-refresh-patients" class="button" data-variant="ghost" data-size="sm" title="Recargar lista">
              🔄
            </button>
            <button type="button" id="btn-open-create-patient" class="button" data-paint="primary" data-size="sm">
              <span>+ Nuevo Paciente</span>
            </button>
          </div>
        </div>

        <!-- Contenedor con la Tabla de Pacientes Registrados -->
        <div class="patients-table-wrapper box" data-surface="sunken" data-border>
          <div class="table-scroll-container">
            <table class="table patients-table">
              <thead>
                <tr>
                  <th style="width: 32%;">Paciente / Foto</th>
                  <th style="width: 18%;">Cédula / CI</th>
                  <th style="width: 18%;">Teléfono</th>
                  <th style="width: 18%;">Consultorio</th>
                  <th style="width: 14%; text-align: center;">Acciones</th>
                </tr>
              </thead>
              <tbody id="patients-table-body">
                <!-- Se inyecta dinámicamente por patientController -->
                <tr>
                  <td colspan="5" class="table-loading-cell">
                    <span class="spinner" data-size="sm"></span>
                    <span>Cargando listado de pacientes desde Supabase...</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pie de página del modal -->
        <footer class="cluster modal-footer" data-justify="end" data-gap="xs">
          <button type="button" class="button btn-close-modal" data-variant="ghost">Cerrar</button>
        </footer>

      </div>
    </dialog>

    <!-- 2. Modal Secundario: Formulario Crear / Modificar Paciente (Diseño Ancho sin Scroll) -->
    <dialog id="modal-patient-form" class="dialog custom-modal modal-patient-wide" aria-labelledby="patient-form-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="sm">
        
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" id="patient-form-icon">👤</span>
            <div>
              <h3 id="patient-form-title" style="margin: 0; font-size: 1.15rem;">Nuevo Paciente</h3>
              <small style="opacity: 0.75; font-size: 0.78rem;">Ficha clínica e ingreso de datos</small>
            </div>
          </div>
          <button type="button" class="button btn-close-patient-form" data-variant="ghost" data-size="sm" aria-label="Cerrar formulario">✕</button>
        </header>

        <form id="form-patient" class="stack" data-gap="sm">
          <!-- Campos ocultos para ID y Foto (Google Drive) -->
          <input type="hidden" id="patient-field-id" value="" />
          <input type="hidden" id="patient-field-foto" value="" />

          <!-- Estructura de 2 Columnas: Foto a la Izquierda + Campos a la Derecha -->
          <div class="patient-form-two-col">
            
            <!-- COLUMNA IZQUIERDA: Tarjeta compacta de Fotografía -->
            <div class="patient-photo-aside box" data-surface="sunken" data-border>
              <div class="patient-avatar-preview-wrapper" id="patient-avatar-preview-box">
                <img 
                  id="patient-avatar-preview-img" 
                  src="" 
                  alt="Foto del paciente" 
                  class="patient-avatar-preview-img" 
                  referrerpolicy="no-referrer"
                  style="display: none;" 
                />
                <div id="patient-avatar-placeholder" class="patient-avatar-placeholder">
                  <span id="patient-avatar-placeholder-icon" style="font-size: 2.5rem;">👤</span>
                </div>
                <div id="patient-photo-spinner" class="patient-photo-spinner-overlay" style="display: none;">
                  <span class="spinner" data-size="md"></span>
                </div>
              </div>

              <div class="patient-photo-aside-info">
                <strong>Foto del Paciente</strong>
                <small>Se almacena en Google Drive</small>
              </div>

              <!-- Input de archivo nativo oculto y botón selector -->
              <input type="file" id="patient-photo-file-input" accept="image/*" style="display: none;" />
              
              <button type="button" id="btn-pick-photo-file" class="button btn-pick-photo" data-paint="primary" data-size="sm">
                <span>📷 Seleccionar Foto</span>
              </button>

              <button type="button" id="btn-upload-photo-drive" class="button" data-variant="outlined" data-size="sm" style="display: none; width: 100%; justify-content: center;">
                ☁️ Subir a Drive
              </button>

              <!-- Mensaje de estado de subida -->
              <div id="patient-photo-status-msg" class="photo-status-msg" style="display: none; font-size: 0.74rem; font-weight: 500; text-align: center; margin-top: 0.2rem;"></div>
            </div>

            <!-- COLUMNA DERECHA: Cuadrícula con los campos del Paciente (4 filas de 2 columnas) -->
            <div class="patient-fields-main">
              
              <!-- Fila 1: Nombre Completo y Cédula -->
              <div class="field">
                <label for="patient-field-name" class="label field-label-compact">Nombre Completo *</label>
                <input 
                  type="text" 
                  id="patient-field-name" 
                  class="input input-compact" 
                  placeholder="Ej. Pedro Pérez" 
                  required 
                  autocomplete="name" 
                />
              </div>

              <div class="field">
                <label for="patient-field-ci" class="label field-label-compact">Cédula / Identificación *</label>
                <input 
                  type="text" 
                  id="patient-field-ci" 
                  class="input input-compact" 
                  placeholder="Ej. V-12345678" 
                  required 
                />
              </div>

              <!-- Fila 2: Fecha de Nacimiento y Sexo -->
              <div class="field">
                <div class="cluster" data-justify="between" data-align="center">
                  <label for="patient-field-birthdate" class="label field-label-compact" style="margin: 0;">Fecha de Nacimiento</label>
                  <span id="patient-birthdate-age-badge" class="badge badge-compact" data-paint="neutral" style="display: none;">
                    -- años
                  </span>
                </div>
                <input 
                  type="date" 
                  id="patient-field-birthdate" 
                  class="input input-compact" 
                />
              </div>

              <div class="field">
                <label for="patient-field-sex" class="label field-label-compact">Sexo / Género</label>
                <select id="patient-field-sex" class="input input-compact">
                  <option value="">Seleccionar sexo...</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <!-- Fila 3: Teléfono y Correo -->
              <div class="field">
                <label for="patient-field-phone" class="label field-label-compact">Teléfono *</label>
                <input 
                  type="tel" 
                  id="patient-field-phone" 
                  class="input input-compact" 
                  placeholder="Ej. 04141234567" 
                  required 
                  autocomplete="tel" 
                />
              </div>

              <div class="field">
                <label for="patient-field-mail" class="label field-label-compact">Correo Electrónico</label>
                <input 
                  type="email" 
                  id="patient-field-mail" 
                  class="input input-compact" 
                  placeholder="paciente@correo.com" 
                  autocomplete="email" 
                />
              </div>

              <!-- Fila 4: Consultorio y Dirección -->
              <div class="field">
                <label for="patient-field-consultorio" class="label field-label-compact">Consultorio Asignado</label>
                <select id="patient-field-consultorio" class="input input-compact">
                  <option value="">Sin asignar / Consultorio General</option>
                </select>
              </div>

              <div class="field">
                <label for="patient-field-address" class="label field-label-compact">Dirección de Residencia</label>
                <input 
                  type="text" 
                  id="patient-field-address" 
                  class="input input-compact" 
                  placeholder="Ej. Urb. Los Sauces, Calle 4" 
                />
              </div>

            </div>

          </div>

          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(125, 125, 125, 0.15);">
            <div>
              <button type="button" id="btn-patient-open-historial" class="button" data-variant="outlined" data-size="sm" style="display: none; border-color: var(--primary, #0ea5e9); color: var(--primary, #0ea5e9); font-weight: 600;" title="Abrir y gestionar historial médico de este paciente">
                📋 Historial Médico
              </button>
            </div>
            <div class="cluster" data-gap="xs">
              <button type="button" class="button btn-close-patient-form" data-variant="ghost" data-size="sm">Cancelar</button>
              <button type="submit" id="btn-submit-patient-form" class="button" data-paint="primary" data-size="sm">Guardar Paciente</button>
            </div>
          </footer>
        </form>

      </div>
    </dialog>

    <!-- 3. Modal de Configuración del Webhook de Google Drive -->
    <dialog id="modal-drive-config" class="dialog custom-modal" aria-labelledby="drive-config-title" style="max-width: 580px;">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">☁️</span>
            <div>
              <h3 id="drive-config-title" style="margin: 0;">Configuración Google Drive</h3>
              <small style="opacity: 0.75;">Carpeta: <code>13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J</code></small>
            </div>
          </div>
          <button type="button" class="button btn-close-drive-config" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <div class="stack" data-gap="sm">
          <p style="margin: 0; font-size: 0.88rem; line-height: 1.45;">
            Para que la app suba las fotos automáticamente a Google Drive sin pedir inicio de sesión individual a cada usuario, se utiliza un Webhook de Google Apps Script.
          </p>

          <div class="field">
            <label for="input-drive-webhook-url" class="label">URL del Webhook (Google Apps Script):</label>
            <input 
              type="url" 
              id="input-drive-webhook-url" 
              class="input" 
              placeholder="https://script.google.com/macros/s/.../exec" 
              autocomplete="off" 
            />
            <small style="opacity: 0.75; font-size: 0.75rem; margin-top: 3px; display: block;">
              ⚠️ <strong>Importante:</strong> La URL debe terminar en <code>/exec</code> (NO ingreses el enlace de la carpeta de Drive).
            </small>
          </div>

          <!-- Mensaje de feedback de la prueba de conexión -->
          <div id="drive-config-test-feedback" style="display: none; padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.82rem; line-height: 1.4;"></div>

          <div class="box" data-surface="sunken" data-border style="padding: 0.75rem; border-radius: 0.5rem; font-size: 0.82rem;">
            <strong style="color: #0284c7;">¿Cómo evitar el error "Failed to fetch"? (Paso crítico)</strong>
            <p style="margin: 0.35rem 0; font-size: 0.8rem; line-height: 1.45;">
              Al implementar en Google Apps Script, el parámetro <strong>"Quién tiene acceso" (Who has access)</strong> <u>DEBE SER</u>:
              <br><strong style="background: rgba(16, 185, 129, 0.15); padding: 2px 6px; border-radius: 4px; color: #10b981;">✓ Cualquier usuario (Anyone)</strong>
              <br>Si seleccionas "Solo yo", Google bloquea la conexión desde el navegador y genera el error <em>Failed to fetch</em>.
            </p>
            <hr style="opacity: 0.15; margin: 0.4rem 0;" />
            <strong>Pasos rápidos (2 minutos):</strong>
            <ol style="margin: 0.25rem 0 0 1.2rem; padding: 0; line-height: 1.5; font-size: 0.8rem;">
              <li>Abre <a href="https://script.google.com/home" target="_blank" rel="noopener" style="color: #0284c7; text-decoration: underline;">Google Apps Script</a> y crea un proyecto.</li>
              <li>Pega el código haciendo clic en <strong>"📋 Copiar Código Apps Script"</strong>.</li>
              <li>Haz clic en <strong>Implementar &gt; Nueva implementación &gt; Aplicación Web</strong>.</li>
              <li>Configura: <em>Ejecutar como: Yo</em> y <em>Quién tiene acceso: <strong>Cualquier usuario</strong></em>.</li>
              <li>Copia la URL resultante (termina en <code>/exec</code>), pégala arriba y prueba la conexión.</li>
            </ol>
          </div>

          <div class="cluster" data-gap="xs" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
            <div class="cluster" data-gap="2xs">
              <button type="button" id="btn-copy-apps-script" class="button" data-variant="outlined" data-size="sm">
                📋 Copiar Código Apps Script
              </button>
              <button type="button" id="btn-open-apps-script-site" class="button" data-variant="ghost" data-size="sm">
                ↗️ Ir a Google Scripts
              </button>
            </div>
            <div class="cluster" data-gap="2xs">
              <button type="button" id="btn-test-drive-config" class="button" data-variant="outlined" data-size="sm" title="Probar conexión con el Webhook">
                🧪 Probar Conexión
              </button>
              <button type="button" id="btn-save-drive-config" class="button" data-paint="primary" data-size="sm">
                Guardar Webhook
              </button>
            </div>
          </div>
        </div>

        <footer class="cluster modal-footer" data-justify="end" data-gap="xs">
          <button type="button" class="button btn-close-drive-config" data-variant="ghost">Cerrar</button>
        </footer>

      </div>
    </dialog>

    <!-- 4. Modal de Confirmación de Eliminación -->
    <dialog id="modal-confirm-delete" class="dialog custom-modal" aria-labelledby="confirm-delete-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md" style="max-width: 440px;">
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444;">⚠️</span>
            <h3 id="confirm-delete-title" style="margin: 0;">Eliminar Paciente</h3>
          </div>
          <button type="button" class="button btn-close-confirm" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <div class="stack" data-gap="xs">
          <p id="confirm-delete-message" style="margin: 0; font-size: 0.95rem;">
            ¿Estás seguro de que deseas eliminar a este paciente?
          </p>
          <small style="opacity: 0.75; color: #ef4444;">Esta acción borrará el registro de la base de datos y no se puede deshacer.</small>
        </div>

        <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
          <button type="button" class="button btn-close-confirm" data-variant="ghost">Cancelar</button>
          <button type="button" id="btn-confirm-delete-action" class="button" data-paint="alert" style="background: #ef4444 !important; color: #ffffff !important;">Eliminar Definitivamente</button>
        </footer>
      </div>
    </dialog>
  `;
}

/**
 * Genera el HTML de una fila de paciente en la tabla
 */
export function renderPatientTableRow(p) {
  const safeName = p.nombre || 'Sin nombre';
  const safeCi = p.ci || '—';
  const safePhone = p.telefono || '—';
  const safeMail = p.mail || '';
  const safeAddress = p.direccion || '';
  const safeSex = p.sexo || '';
  const safeBirthdate = p.fecha_nacimiento || '';
  const consultorioLabel = p.consultorio_id ? `Consultorio #${p.consultorio_id}` : 'General';

  // Formatear URL de foto a través de googleDriveService
  const formattedPhotoUrl = p.foto ? googleDriveService.formatDriveImageUrl(p.foto) : '';

  // Calcular edad si hay fecha de nacimiento
  let ageBadge = '';
  if (safeBirthdate) {
    try {
      const birthYear = new Date(safeBirthdate).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (!isNaN(age) && age > 0 && age < 130) {
        ageBadge = `<span class="badge" data-paint="neutral" style="font-size: 0.68rem; padding: 0.1rem 0.35rem; margin-left: 0.35rem;">${age} años</span>`;
      }
    } catch {
      // Ignorar error de parsing
    }
  }

  return `
    <tr class="patient-table-row" data-id="${p.id}">
      <td class="patient-name-cell">
        <div class="cluster" data-gap="xs" data-align="center">
          
          <!-- Avatar o Fotografía recuperada de Google Drive -->
          <div class="patient-table-avatar-box">
            ${formattedPhotoUrl ? `
              <img 
                src="${formattedPhotoUrl}" 
                alt="${safeName}" 
                class="patient-table-avatar-img"
                loading="lazy"
                referrerpolicy="no-referrer"
                onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='inline-flex';"
              />
              <span class="patient-avatar-mini" style="display: none;">👤</span>
            ` : `
              <span class="patient-avatar-mini">👤</span>
            `}
          </div>

          <div>
            <div class="cluster" data-gap="2xs" data-align="center">
              <strong class="patient-row-name">${safeName}</strong>
              ${ageBadge}
              ${safeSex ? `<span class="badge badge-sex-tag" data-paint="neutral" title="Sexo: ${safeSex}">${safeSex.charAt(0).toUpperCase()}</span>` : ''}
            </div>
            ${safeAddress ? `<small class="patient-row-addr">📍 ${safeAddress}</small>` : ''}
          </div>

        </div>
      </td>

      <td class="patient-ci-cell">
        <span class="badge" data-paint="neutral">${safeCi}</span>
      </td>

      <td class="patient-phone-cell">
        <div class="stack" data-gap="2xs">
          <span class="patient-phone-text">📞 ${safePhone}</span>
          ${safeMail ? `<small style="opacity: 0.7; font-size: 0.74rem;">✉️ ${safeMail}</small>` : ''}
        </div>
      </td>

      <td class="patient-consultorio-cell">
        <span class="badge" data-paint="primary" style="font-size: 0.75rem;">
          🏥 ${consultorioLabel}
        </span>
      </td>

      <td class="patient-actions-cell" style="text-align: center;">
        <div class="cluster" data-gap="2xs" data-justify="center">
          <button 
            type="button" 
            class="button btn-patient-row-historial" 
            data-id="${p.id}" 
            data-name="${safeName}" 
            data-variant="ghost" 
            data-size="sm" 
            title="Ver historial médico de ${safeName}"
            aria-label="Ver historial médico de ${safeName}"
            style="color: var(--primary, #0ea5e9);">
            📋
          </button>
          <button 
            type="button" 
            class="button btn-edit-patient" 
            data-id="${p.id}" 
            data-variant="ghost" 
            data-size="sm" 
            title="Modificar paciente"
            aria-label="Modificar ${safeName}">
            ✏️
          </button>
          <button 
            type="button" 
            class="button btn-delete-patient" 
            data-id="${p.id}" 
            data-name="${safeName}" 
            data-variant="ghost" 
            data-size="sm" 
            title="Eliminar paciente"
            aria-label="Eliminar ${safeName}">
            🗑️
          </button>
        </div>
      </td>
    </tr>
  `;
}

/**
 * Genera el estado vacío cuando no hay pacientes
 */
export function renderEmptyPatientsState(isSearch = false) {
  return `
    <tr>
      <td colspan="5" class="table-empty-cell">
        <div class="stack" data-gap="xs" data-align="center" style="padding: 2.5rem 1rem; text-align: center;">
          <span style="font-size: 2.2rem;">🔍</span>
          <strong style="font-size: 1.05rem;">
            ${isSearch ? 'No se encontraron pacientes con esa búsqueda' : 'No hay pacientes registrados aún'}
          </strong>
          <p style="margin: 0; opacity: 0.7; font-size: 0.85rem;">
            ${isSearch ? 'Intenta con otro término o limpia el buscador.' : 'Comienza registrando tu primer paciente con el botón "Nuevo Paciente".'}
          </p>
        </div>
      </td>
    </tr>
  `;
}
