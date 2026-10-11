/**
 * Vista del Modal de Gestión de Citas (Cita View)
 * Provee la interfaz para Agendar, Modificar y Eliminar citas del calendario
 */

export function renderCitaModal() {
  return `
    <dialog id="modal-cita" class="dialog custom-modal" aria-labelledby="modal-cita-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md" style="max-width: 540px; width: 95vw;">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge">📅</span>
            <div>
              <h3 id="modal-cita-title" style="margin: 0; font-size: 1.15rem;">Agendar Cita Odontológica</h3>
              <p id="modal-cita-subtitle" style="margin: 0; font-size: 0.8rem; opacity: 0.75;">Configure los detalles de la consulta</p>
            </div>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Formulario de la Cita -->
        <form id="form-cita" class="stack" data-gap="sm">
          <input type="hidden" id="cita-id" value="" />

          <!-- Paciente (con icono para agregar paciente rápidamente) -->
          <div class="field">
            <div class="cluster" data-justify="between" data-align="center" style="margin-bottom: 0.25rem;">
              <label for="cita-paciente" class="label" style="margin-bottom: 0;">Paciente *</label>
              <button type="button" 
                      id="btn-cita-add-patient" 
                      class="button btn-add-patient-inline" 
                      data-size="sm" 
                      data-variant="ghost" 
                      title="Registrar nuevo paciente">
                <span>👤➕</span>
                <span>Nuevo Paciente</span>
              </button>
            </div>
            <div class="cluster" data-gap="xs" style="align-items: center; width: 100%;">
              <select id="cita-paciente" class="input select" style="flex: 1;" required>
                <option value="" disabled selected>Seleccione un paciente registrado...</option>
              </select>
              <button type="button" 
                      id="btn-cita-add-patient-icon" 
                      class="button btn-icon-add-patient" 
                      data-paint="primary" 
                      data-size="sm" 
                      title="Registrar nuevo paciente" 
                      aria-label="Registrar nuevo paciente">
                ➕
              </button>
            </div>
            <!-- Acceso directo al Historial Médico y Odontograma del paciente seleccionado -->
            <div id="cita-patient-historial-wrap" style="display: none; margin-top: 0.35rem;">
              <div class="cluster" data-gap="xs">
                <button type="button" 
                        id="btn-cita-open-historial" 
                        class="button" 
                        data-variant="ghost" 
                        data-size="sm" 
                        style="color: var(--primary, #0ea5e9); font-weight: 600; padding: 0.25rem 0.5rem; border: 1px dashed rgba(14, 165, 233, 0.4); border-radius: 4px; font-size: 0.78rem; flex: 1; justify-content: center;" 
                        title="Abrir y editar historial médico del paciente seleccionado">
                  <span>📋 Historial</span>
                </button>
                <button type="button" 
                        id="btn-cita-open-odontograma" 
                        class="button" 
                        data-variant="ghost" 
                        data-size="sm" 
                        style="color: #0ea5e9; font-weight: 600; padding: 0.25rem 0.5rem; border: 1px dashed rgba(14, 165, 233, 0.4); border-radius: 4px; font-size: 0.78rem; flex: 1; justify-content: center;" 
                        title="Abrir odontograma clínico del paciente seleccionado">
                  <span>🦷 Odontograma</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Doctor Asignado (Obligatorio) -->
          <div class="field">
            <label for="cita-doctor" class="label">Doctor / Especialista *</label>
            <select id="cita-doctor" class="input select" required>
              <option value="" disabled selected>Seleccione un doctor registrado...</option>
            </select>
          </div>

          <!-- Fecha de la Cita -->
          <div class="field">
            <label for="cita-fecha" class="label">Fecha de la Cita *</label>
            <input type="date" id="cita-fecha" class="input" required />
          </div>

          <!-- Rango de Hora (hora_desde y hora_hasta) -->
          <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="field">
              <label for="cita-hora-desde" class="label">Hora Inicio (Desde) *</label>
              <input type="time" id="cita-hora-desde" class="input" required value="09:00" />
            </div>

            <div class="field">
              <label for="cita-hora-hasta" class="label">Hora Fin (Hasta) *</label>
              <input type="time" id="cita-hora-hasta" class="input" required value="10:00" />
            </div>
          </div>

          <!-- Observaciones / Tratamiento -->
          <div class="field">
            <label for="cita-observacion" class="label">Motivo o Observación</label>
            <textarea id="cita-observacion" class="input" rows="2" placeholder="Ej. Limpieza dental profunda, revisión general, valoración ortodoncia..."></textarea>
          </div>

          <!-- Pie del Modal: Botón de Eliminar / Historial (Izquierda) y Guardar / Cancelar (Derecha) -->
          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(125, 125, 125, 0.15);">
            <div class="cluster" data-gap="xs">
              <button type="button" id="btn-delete-cita" class="button" data-variant="outlined" style="display: none; border-color: #ef4444; color: #ef4444;" title="Eliminar definitivamente esta cita">
                🗑️ Eliminar Cita
              </button>
              <button type="button" id="btn-cita-footer-historial" class="button" data-variant="outlined" data-size="sm" style="display: none; border-color: var(--primary, #0ea5e9); color: var(--primary, #0ea5e9); font-weight: 600;" title="Abrir historial médico del paciente seleccionado">
                📋 Historial
              </button>
              <button type="button" id="btn-cita-footer-odontograma" class="button" data-variant="outlined" data-size="sm" style="display: none; border-color: #0ea5e9; color: #0ea5e9; font-weight: 600;" title="Abrir odontograma clínico del paciente seleccionado">
                🦷 Odontograma
              </button>
            </div>
            <div class="cluster" data-gap="xs">
              <button type="button" class="button btn-close-modal" data-variant="ghost">Cancelar</button>
              <button type="submit" id="btn-submit-cita" class="button" data-paint="primary">
                💾 Guardar Cita
              </button>
            </div>
          </footer>
        </form>

      </div>
    </dialog>
  `;
}
