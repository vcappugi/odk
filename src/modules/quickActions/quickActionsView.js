/**
 * Vista de la Barra de Acciones Rápidas y sus Modales
 * ODONTOKRIS - Sistema Odontológico
 */

import { renderPatientManagementModals } from '../patients/patientView.js';

export function renderQuickActionsBar() {
  return `
    <!-- Barra de Botones de Acceso Rápido (Arriba del Calendario) -->
    <section class="quick-actions-bar box" data-surface="raised" data-border aria-label="Acciones del Sistema">
      <div class="quick-actions-inner cluster" data-justify="between" data-align="center">
        
        <div class="quick-actions-header cluster" data-gap="xs" data-align="center">
          <span class="quick-actions-title-badge">⚡ Gestión Rápida</span>
        </div>

        <div class="quick-actions-grid cluster" data-gap="xs" data-align="center">
          <!-- 1. Gestionar Paciente (Crear, Modificar, Eliminar) -->
          <button type="button" id="btn-quick-patient" class="button btn-quick-action" data-paint="primary" data-size="sm" title="Gestionar pacientes registrados (crear, modificar, eliminar)">
            <span class="quick-btn-icon">👥</span>
            <span class="quick-btn-text">Gestionar Paciente</span>
          </button>

          <!-- 2. Registrar Doctor -->
          <button type="button" id="btn-quick-doctor" class="button btn-quick-action" data-variant="outlined" data-size="sm" title="Registrar nuevo doctor odontólogo">
            <span class="quick-btn-icon">🩺</span>
            <span class="quick-btn-text">Registrar Doctor</span>
          </button>

          <!-- 3. Ver Historial -->
          <button type="button" id="btn-quick-history" class="button btn-quick-action" data-variant="ghost" data-size="sm" title="Ver historial clínico de pacientes">
            <span class="quick-btn-icon">📋</span>
            <span class="quick-btn-text">Ver Historial</span>
          </button>

          <!-- 4. Reportes -->
          <button type="button" id="btn-quick-reports" class="button btn-quick-action" data-variant="ghost" data-size="sm" title="Ver reportes y métricas odontológicas">
            <span class="quick-btn-icon">📊</span>
            <span class="quick-btn-text">Reportes</span>
          </button>

          <!-- 5. Configuración (Solo Visible para Rol 'admin' en user_roles) -->
          <button type="button" id="btn-quick-config" class="button btn-quick-action btn-config-action" data-size="sm" title="Panel de Configuración Administrativa (Solo Administradores)" style="display: none;">
            <span class="quick-btn-icon">⚙️</span>
            <span class="quick-btn-text">Configuración</span>
            <span class="admin-shield-badge">Admin</span>
          </button>
        </div>

      </div>
    </section>

    <!-- Modales para cada Acción Rápida -->
    ${renderPatientManagementModals()}
    ${renderDoctorModal()}
    ${renderHistoryModal()}
    ${renderReportsModal()}
  `;
}



/**
 * Modal: Registrar Doctor
 */
function renderDoctorModal() {
  return `
    <dialog id="modal-quick-doctor" class="dialog custom-modal" aria-labelledby="modal-doctor-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">🩺</span>
            <h3 id="modal-doctor-title" style="margin: 0;">Registrar Doctor / Especialista</h3>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <form id="form-quick-doctor" class="stack" data-gap="sm">
          <div class="field">
            <label for="doctor-name" class="label">Nombre del Especialista</label>
            <input type="text" id="doctor-name" class="input" placeholder="Ej. Dra. Kris Rodríguez" required autofocus />
          </div>

          <div class="grid grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="field">
              <label for="doctor-phone" class="label">Teléfono de Contacto</label>
              <input type="tel" id="doctor-phone" class="input" placeholder="Ej. 04249876543" required />
            </div>

            <div class="field">
              <label for="doctor-mail" class="label">Correo Profesional</label>
              <input type="email" id="doctor-mail" class="input" placeholder="doctora@odontokris.com" required />
            </div>
          </div>

          <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
            <button type="button" class="button btn-close-modal" data-variant="ghost">Cancelar</button>
            <button type="submit" id="btn-submit-doctor" class="button" data-paint="primary">Guardar Doctor</button>
          </footer>
        </form>
      </div>
    </dialog>
  `;
}

/**
 * Modal: Ver Historial Clínico
 */
function renderHistoryModal() {
  return `
    <dialog id="modal-quick-history" class="dialog custom-modal modal-wide" aria-labelledby="modal-history-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">📋</span>
            <h3 id="modal-history-title" style="margin: 0;">Historial Clínico Odontológico</h3>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <div class="history-content stack" data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <input type="search" id="history-search-input" class="input" placeholder="Buscar paciente por nombre o cédula..." style="max-width: 320px;" />
            <span class="badge" data-paint="primary">Registros Recientes</span>
          </div>

          <div class="history-table-container">
            <table class="table history-table" style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; padding: 0.5rem;">Paciente</th>
                  <th style="text-align: left; padding: 0.5rem;">Fecha</th>
                  <th style="text-align: left; padding: 0.5rem;">Tratamiento Realizado</th>
                  <th style="text-align: left; padding: 0.5rem;">Doctor</th>
                  <th style="text-align: center; padding: 0.5rem;">Estado</th>
                </tr>
              </thead>
              <tbody id="history-table-body">
                <tr>
                  <td style="padding: 0.5rem;"><strong>Carlos Mendoza</strong><br><small style="opacity: 0.7;">V-18456123</small></td>
                  <td style="padding: 0.5rem;">09/10/2026</td>
                  <td style="padding: 0.5rem;">Limpieza Profiláctica & Fluorización</td>
                  <td style="padding: 0.5rem;">Dra. Kris</td>
                  <td style="text-align: center; padding: 0.5rem;"><span class="badge" data-paint="success">Completado</span></td>
                </tr>
                <tr>
                  <td style="padding: 0.5rem;"><strong>Mariana Silva</strong><br><small style="opacity: 0.7;">V-23789012</small></td>
                  <td style="padding: 0.5rem;">05/10/2026</td>
                  <td style="padding: 0.5rem;">Control mensual Ortodoncia (Arco Sup/Inf)</td>
                  <td style="padding: 0.5rem;">Dra. Kris</td>
                  <td style="text-align: center; padding: 0.5rem;"><span class="badge" data-paint="primary">En proceso</span></td>
                </tr>
                <tr>
                  <td style="padding: 0.5rem;"><strong>Roberto Díaz</strong><br><small style="opacity: 0.7;">V-15963214</small></td>
                  <td style="padding: 0.5rem;">02/10/2026</td>
                  <td style="padding: 0.5rem;">Endodoncia Conductometría Pieza 16</td>
                  <td style="padding: 0.5rem;">Dra. Kris</td>
                  <td style="text-align: center; padding: 0.5rem;"><span class="badge" data-paint="success">Completado</span></td>
                </tr>
                <tr>
                  <td style="padding: 0.5rem;"><strong>Lucía Torres</strong><br><small style="opacity: 0.7;">V-26456789</small></td>
                  <td style="padding: 0.5rem;">28/09/2026</td>
                  <td style="padding: 0.5rem;">Exodoncia Simple Molar Inferior</td>
                  <td style="padding: 0.5rem;">Dra. Kris</td>
                  <td style="text-align: center; padding: 0.5rem;"><span class="badge" data-paint="success">Alta Médica</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
          <button type="button" class="button btn-close-modal" data-variant="ghost">Cerrar</button>
        </footer>
      </div>
    </dialog>
  `;
}

/**
 * Modal: Reportes Odontológicos
 */
function renderReportsModal() {
  return `
    <dialog id="modal-quick-reports" class="dialog custom-modal modal-wide" aria-labelledby="modal-reports-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">📊</span>
            <h3 id="modal-reports-title" style="margin: 0;">Reportes y Métricas Clínicas</h3>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <div class="reports-content stack" data-gap="md">
          <!-- Tarjetas KPI -->
          <div class="reports-kpi-grid">
            <div class="kpi-card box" data-surface="sunken" data-border>
              <span class="kpi-label">Citas del Mes</span>
              <strong class="kpi-value">48</strong>
              <small class="kpi-trend" style="color: #10b981;">↑ +14% vs mes anterior</small>
            </div>
            <div class="kpi-card box" data-surface="sunken" data-border>
              <span class="kpi-label">Pacientes Atendidos</span>
              <strong class="kpi-value">39</strong>
              <small class="kpi-trend" style="color: #10b981;">↑ 94% Asistencia</small>
            </div>
            <div class="kpi-card box" data-surface="sunken" data-border>
              <span class="kpi-label">Tratamientos Activos</span>
              <strong class="kpi-value">27</strong>
              <small class="kpi-trend" style="color: #0284c7;">Ortodoncia y Endodoncia</small>
            </div>
            <div class="kpi-card box" data-surface="sunken" data-border>
              <span class="kpi-label">Nuevos Clientes</span>
              <strong class="kpi-value">12</strong>
              <small class="kpi-trend" style="color: #10b981;">Este mes</small>
            </div>
          </div>

          <!-- Distribución de Procedimientos Odontológicos -->
          <div class="box procedures-summary-box" data-border>
            <h4 style="margin: 0 0 0.5rem 0;">Distribución de Procedimientos Frecuentes</h4>
            <div class="stack" data-gap="xs">
              <div>
                <div class="cluster" data-justify="between" style="font-size: 0.8rem; margin-bottom: 2px;">
                  <span>Limpiezas Profilácticas y Blanqueamientos</span>
                  <strong>38%</strong>
                </div>
                <div style="background: rgba(125,125,125,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #0284c7; width: 38%; height: 100%;"></div>
                </div>
              </div>

              <div>
                <div class="cluster" data-justify="between" style="font-size: 0.8rem; margin-bottom: 2px;">
                  <span>Ortodoncia y Controles de Brackets</span>
                  <strong>30%</strong>
                </div>
                <div style="background: rgba(125,125,125,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #8b5cf6; width: 30%; height: 100%;"></div>
                </div>
              </div>

              <div>
                <div class="cluster" data-justify="between" style="font-size: 0.8rem; margin-bottom: 2px;">
                  <span>Endodoncias y Restauraciones con Resina</span>
                  <strong>22%</strong>
                </div>
                <div style="background: rgba(125,125,125,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #10b981; width: 22%; height: 100%;"></div>
                </div>
              </div>

              <div>
                <div class="cluster" data-justify="between" style="font-size: 0.8rem; margin-bottom: 2px;">
                  <span>Cirugías y Exodoncias Molares</span>
                  <strong>10%</strong>
                </div>
                <div style="background: rgba(125,125,125,0.2); height: 8px; border-radius: 4px; overflow: hidden;">
                  <div style="background: #f59e0b; width: 10%; height: 100%;"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.5rem;">
          <button type="button" class="button btn-close-modal" data-variant="ghost">Cerrar</button>
        </footer>
      </div>
    </dialog>
  `;
}
