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

          <!-- Paciente -->
          <div class="field">
            <label for="cita-paciente" class="label">Paciente *</label>
            <select id="cita-paciente" class="input select" required>
              <option value="" disabled selected>Seleccione un paciente registrado...</option>
            </select>
          </div>

          <!-- Doctor Asignado (Opcional) -->
          <div class="field">
            <label for="cita-doctor" class="label">Doctor / Odontólogo Asignado</label>
            <select id="cita-doctor" class="input select">
              <option value="">(Sin doctor asignado / Por definir)</option>
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

          <!-- Pie del Modal: Botón de Eliminar (Izquierda) y Guardar / Cancelar (Derecha) -->
          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(125, 125, 125, 0.15);">
            <div>
              <button type="button" id="btn-delete-cita" class="button" data-variant="outlined" style="display: none; border-color: #ef4444; color: #ef4444;" title="Eliminar definitivamente esta cita">
                🗑️ Eliminar Cita
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
