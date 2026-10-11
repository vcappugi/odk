/**
 * Vista de Gestión de Historial Médico (CRUD Completo)
 * Modal Dialog: #modal-historial-medico
 * ODONTOKRIS - Sistema Odontológico
 */

export function renderHistorialModal() {
  return `
    <!-- Modal Principal del Historial Médico del Paciente -->
    <dialog id="modal-historial-medico" class="dialog custom-modal modal-wide" aria-labelledby="historial-modal-title" style="max-width: 960px; width: 95vw;">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="font-size: 1.4rem;">📋</span>
            <div>
              <div class="cluster" data-gap="xs" data-align="center">
                <h3 id="historial-modal-title" style="margin: 0; font-size: 1.2rem;">Historial Médico Odontológico</h3>
                <span id="historial-patient-name-badge" class="badge" data-paint="primary" style="font-size: 0.85rem; font-weight: 600;">
                  Paciente
                </span>
              </div>
              <small id="historial-patient-subtitle" style="opacity: 0.75; font-size: 0.8rem;">
                Registro clínico de consultas, diagnósticos, antecedentes y tratamientos
              </small>
            </div>
          </div>
          
          <div class="cluster" data-gap="xs">
            <button type="button" id="btn-historial-print-pdf" class="button" data-variant="outlined" data-size="sm" style="border-color: #6366f1; color: #6366f1; font-weight: 600;" title="Imprimir ficha clínica en PDF">
              <span>🖨️ Ficha PDF</span>
            </button>
            <button type="button" id="btn-historial-open-odontograma" class="button" data-variant="outlined" data-size="sm" style="border-color: #0ea5e9; color: #0ea5e9; font-weight: 600;" title="Abrir y editar el odontograma gráfico de este paciente">
              <span>🦷 Odontograma Gráfico</span>
            </button>
            <button type="button" id="btn-historial-new-entry" class="button" data-paint="primary" data-size="sm">
              <span>➕ Nueva Entrada</span>
            </button>
            <button type="button" class="button btn-close-historial-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
          </div>
        </header>

        <!-- Banner de Alertas Clínicas Rápidas (Alergias y Antecedentes Destacados) -->
        <div id="historial-alerts-banner" class="box" data-surface="sunken" data-border style="padding: 0.65rem 0.9rem; border-left: 4px solid #ef4444; border-radius: 6px; display: none;">
          <div class="cluster" data-justify="between" data-align="center">
            <div class="cluster" data-gap="sm" data-align="center">
              <span style="font-size: 1.2rem;">⚠️</span>
              <div>
                <strong style="color: #ef4444; font-size: 0.85rem; display: block;">ALERTA MÉDICA DEL PACIENTE:</strong>
                <span id="historial-critical-allergies" style="font-size: 0.82rem; font-weight: 500;"></span>
              </div>
            </div>
            <div id="historial-critical-background" style="font-size: 0.8rem; opacity: 0.85;"></div>
          </div>
        </div>

        <!-- SECCIÓN 1: Formulario Crear / Editar Entrada de Historial (Ocultable por defecto) -->
        <div id="historial-form-container" class="box" data-surface="sunken" data-border style="display: none; padding: 1rem; border-radius: 8px;">
          <form id="form-historial-entry" class="stack" data-gap="sm">
            <input type="hidden" id="historial-entry-id" value="" />
            <input type="hidden" id="historial-entry-paciente-id" value="" />
            <input type="hidden" id="historial-entry-cita-id" value="" />

            <div class="cluster" data-justify="between" data-align="center" style="border-bottom: 1px solid rgba(125,125,125,0.2); padding-bottom: 0.4rem;">
              <strong id="historial-form-mode-title" style="font-size: 0.95rem; color: var(--primary, #0ea5e9);">
                ➕ Nueva Consulta / Entrada de Historial
              </strong>
              <button type="button" id="btn-cancel-historial-entry" class="button" data-variant="ghost" data-size="sm">
                Descartar
              </button>
            </div>

            <!-- Fila 1: Fecha y Doctor Responsable -->
            <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="field">
                <label for="historial-field-fecha" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Fecha de Consulta *</label>
                <input type="date" id="historial-field-fecha" class="input input-compact" required />
              </div>

              <div class="field">
                <label for="historial-field-doctor" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Doctor / Especialista</label>
                <select id="historial-field-doctor" class="input input-compact">
                  <option value="">Seleccione el odontólogo tratante...</option>
                </select>
              </div>
            </div>

            <!-- Fila 2: Motivo de Consulta y Diagnóstico -->
            <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <div class="field">
                <label for="historial-field-motivo" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Motivo de Consulta *</label>
                <input type="text" id="historial-field-motivo" class="input input-compact" placeholder="Ej. Dolor agudo en molar inferior, control ortodoncia..." required />
              </div>

              <div class="field">
                <label for="historial-field-diagnostico" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Diagnóstico Odontológico *</label>
                <input type="text" id="historial-field-diagnostico" class="input input-compact" placeholder="Ej. Caries penetrante en OD 36, pulpitis reversible..." required />
              </div>
            </div>

            <!-- Fila 3: Tratamiento Realizado / Plan -->
            <div class="field">
              <label for="historial-field-tratamiento" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Tratamiento Realizado / Procedimiento *</label>
              <textarea id="historial-field-tratamiento" class="input input-compact" rows="2" placeholder="Ej. Apertura cameral, pulpectomía, obturación con resina compuesta, medicación intraconducto..." required></textarea>
            </div>

            <!-- Fila 4: Alergias, Antecedentes Médicos y Medicamentos (3 Columnas) -->
            <div class="grid-3-cols" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem;">
              <div class="field">
                <label for="historial-field-alergias" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem; color: #ef4444;">Alergias (Importante)</label>
                <input type="text" id="historial-field-alergias" class="input input-compact" placeholder="Ej. Penicilina, AINEs, Látex, Ninguna..." />
              </div>

              <div class="field">
                <label for="historial-field-antecedentes" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Antecedentes Médicos</label>
                <input type="text" id="historial-field-antecedentes" class="input input-compact" placeholder="Ej. Hipertensión, Diabetes, Asma..." />
              </div>

              <div class="field">
                <label for="historial-field-medicamentos" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Medicamentos Actuales</label>
                <input type="text" id="historial-field-medicamentos" class="input input-compact" placeholder="Ej. Losartán 50mg, Ibuprofeno..." />
              </div>
            </div>

            <!-- Fila 5: Observaciones / Evolución -->
            <div class="field">
              <label for="historial-field-observaciones" class="label" style="font-size: 0.8rem; margin-bottom: 0.2rem;">Observaciones y Recomendaciones</label>
              <input type="text" id="historial-field-observaciones" class="input input-compact" placeholder="Ej. Control en 7 días, prescripción de analgésico cada 8h..." />
            </div>

            <!-- Botones de Acción del Formulario -->
            <div class="cluster" data-justify="end" data-gap="xs" style="margin-top: 0.25rem;">
              <button type="button" id="btn-cancel-historial-form" class="button" data-variant="ghost" data-size="sm">Cancelar</button>
              <button type="submit" id="btn-submit-historial-entry" class="button" data-paint="primary" data-size="sm">
                💾 Guardar en Historial
              </button>
            </div>
          </form>
        </div>

        <!-- SECCIÓN 2: Listado Cronológico de Entradas del Historial -->
        <div class="stack" data-gap="xs">
          <div class="cluster" data-justify="between" data-align="center">
            <h4 style="margin: 0; font-size: 0.95rem; opacity: 0.9;">
              Cronología de Consultas y Procedimientos
            </h4>
            <span id="historial-entries-count" class="badge" data-paint="neutral" style="font-size: 0.75rem;">
              0 registros
            </span>
          </div>

          <div class="historial-timeline-wrapper box" data-surface="sunken" data-border style="max-height: 380px; overflow-y: auto; padding: 0.5rem; border-radius: 8px;">
            <div id="historial-timeline-list" class="stack" data-gap="sm">
              <!-- Se inyecta dinámicamente -->
              <div class="timeline-empty-state" style="text-align: center; padding: 2.5rem 1rem; opacity: 0.7;">
                <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📄</span>
                <strong>No hay registros en el historial médico</strong>
                <p style="margin: 0.25rem 0 0.75rem; font-size: 0.85rem;">
                  Haga clic en "+ Nueva Entrada" para registrar la primera consulta o tratamiento de este paciente.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Pie de página del Modal -->
        <footer class="cluster modal-footer" data-justify="between" data-align="center" style="border-top: 1px solid rgba(125,125,125,0.15); padding-top: 0.5rem;">
          <div id="historial-status-info" style="font-size: 0.76rem; opacity: 0.65;">
            Datos sincronizados con la base de datos clínica
          </div>
          <div class="cluster" data-gap="xs">
            <button type="button" class="button btn-close-historial-modal" data-variant="ghost">Cerrar</button>
          </div>
        </footer>

      </div>
    </dialog>
  `;
}

/**
 * Renderiza una tarjeta de entrada individual en la línea de tiempo del historial
 */
export function renderHistorialCard(entry) {
  const fechaStr = entry.fecha ? new Date(entry.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }) : 'Fecha no especificada';

  const doctorName = entry.doctor?.nombre || (entry.doctor_id ? `Doctor #${entry.doctor_id}` : 'Odontólogo General');
  const hasAlergias = entry.alergias && entry.alergias.trim() !== '' && entry.alergias.toLowerCase() !== 'ninguna';
  const hasAntecedentes = entry.antecedentes && entry.antecedentes.trim() !== '';
  const hasMedicamentos = entry.medicamentos && entry.medicamentos.trim() !== '';

  return `
    <article class="historial-card box" data-surface="raised" data-border style="padding: 0.85rem; border-radius: 6px; transition: transform 0.15s ease;" data-id="${entry.id}">
      <div class="stack" data-gap="xs">
        
        <!-- Fila Superior: Fecha, Doctor y Botones de Acción -->
        <div class="cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="badge" data-paint="primary" style="font-size: 0.78rem; font-weight: 600;">
              📅 ${fechaStr}
            </span>
            <span style="font-size: 0.82rem; font-weight: 500; opacity: 0.9;">
              👨‍⚕️ ${doctorName}
            </span>
          </div>

          <div class="cluster" data-gap="2xs">
            <button type="button" class="button btn-edit-historial-entry" data-id="${entry.id}" data-variant="ghost" data-size="sm" title="Modificar esta entrada">
              ✏️
            </button>
            <button type="button" class="button btn-delete-historial-entry" data-id="${entry.id}" data-variant="ghost" data-size="sm" title="Eliminar del historial" style="color: #ef4444;">
              🗑️
            </button>
          </div>
        </div>

        <!-- Motivo y Diagnóstico -->
        <div style="margin-top: 0.2rem;">
          <div style="font-size: 0.88rem; font-weight: 600;">
            <span style="opacity: 0.7; font-weight: normal;">Motivo:</span> ${escapeHtml(entry.motivo_consulta || 'Consulta general')}
          </div>
          <div style="font-size: 0.86rem; color: var(--primary, #0ea5e9); font-weight: 500; margin-top: 0.15rem;">
            <span style="opacity: 0.75; font-weight: normal; color: inherit;">Diagnóstico:</span> ${escapeHtml(entry.diagnostico || 'Evaluación clínica')}
          </div>
        </div>

        <!-- Tratamiento Realizado -->
        <div class="box" data-surface="sunken" style="padding: 0.5rem 0.75rem; border-radius: 4px; font-size: 0.84rem; margin-top: 0.25rem;">
          <strong>Tratamiento / Procedimiento:</strong>
          <p style="margin: 0.15rem 0 0; white-space: pre-wrap; opacity: 0.9;">${escapeHtml(entry.tratamiento || 'Sin detalles registrados')}</p>
        </div>

        <!-- Badges de Alergias, Antecedentes y Medicamentos -->
        ${(hasAlergias || hasAntecedentes || hasMedicamentos) ? `
          <div class="cluster" data-gap="xs" style="flex-wrap: wrap; margin-top: 0.35rem; font-size: 0.75rem;">
            ${hasAlergias ? `
              <span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);">
                ⚠️ Alergia: ${escapeHtml(entry.alergias)}
              </span>
            ` : ''}
            ${hasAntecedentes ? `
              <span class="badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);">
                🩺 Antecedente: ${escapeHtml(entry.antecedentes)}
              </span>
            ` : ''}
            ${hasMedicamentos ? `
              <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3);">
                💊 Medicación: ${escapeHtml(entry.medicamentos)}
              </span>
            ` : ''}
          </div>
        ` : ''}

        <!-- Observaciones -->
        ${entry.observaciones ? `
          <div style="font-size: 0.78rem; opacity: 0.75; font-style: italic; margin-top: 0.2rem;">
            Observación: ${escapeHtml(entry.observaciones)}
          </div>
        ` : ''}

      </div>
    </article>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
