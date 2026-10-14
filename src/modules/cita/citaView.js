/**
 * Vista del Modal de Gestión de Citas y Modal de Cobro (Cita & Cobro View)
 * Provee la interfaz para Agendar, Modificar y Eliminar citas del calendario,
 * además de la interfaz para registrar el cobro de citas realizadas.
 * Diseñado en dos columnas compactas para ajustarse sin requerir scroll vertical.
 */

export function renderCitaModal() {
  return `
    <!-- Modal de Gestión de Citas Odontológicas -->
    <dialog id="modal-cita" class="dialog custom-modal modal-cita-dialog" aria-labelledby="modal-cita-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="xs">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="width: 28px; height: 28px; font-size: 1rem;">📅</span>
            <div>
              <h3 id="modal-cita-title" style="margin: 0; font-size: 1.05rem;">Agendar Cita Odontológica</h3>
              <p id="modal-cita-subtitle" style="margin: 0; font-size: 0.74rem; opacity: 0.75;">Configure los detalles de la consulta</p>
            </div>
          </div>
          <button type="button" class="button btn-close-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Formulario de la Cita -->
        <form id="form-cita" class="stack" data-gap="xs">
          <input type="hidden" id="cita-id" value="" />

          <!-- Banner Informativo cuando la cita está Realizada / Atendida -->
          <div id="cita-realizada-banner" class="box" style="display: none; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.35); border-radius: 6px; padding: 0.35rem 0.55rem;">
            <div class="cluster" data-gap="xs" data-align="center">
              <span id="cita-banner-icon" style="font-size: 1.1rem;">🔒</span>
              <div style="flex: 1;">
                <strong id="cita-banner-title" style="color: #10b981; font-size: 0.78rem; display: block;">Cita Atendida (Finalizada)</strong>
                <small id="cita-banner-text" style="opacity: 0.85; font-size: 0.70rem; display: block;">Esta consulta ya fue atendida: <strong>no puede ser alterada ni eliminada</strong>. Utilice el botón <strong>Cobro</strong> para registrar o verificar la liquidación.</small>
              </div>
            </div>
          </div>

          <!-- Distribución en 2 Columnas Compacta Sin Scroll -->
          <div class="cita-form-grid">
            <!-- Columna Izquierda: Paciente, Doctor, Estatus -->
            <div class="stack cita-col" data-gap="xs">
              <!-- Paciente (con opción para registrar paciente inline) -->
              <div class="field">
                <div class="cluster" data-justify="between" data-align="center" style="margin-bottom: 0.15rem;">
                  <label for="cita-paciente" class="label" style="margin-bottom: 0; font-size: 0.78rem;">Paciente *</label>
                  <button type="button" 
                          id="btn-cita-add-patient" 
                          class="button btn-add-patient-inline" 
                          data-size="sm" 
                          data-variant="ghost" 
                          title="Registrar nuevo paciente"
                          style="padding: 0 4px; font-size: 0.7rem; height: 19px;">
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
                          aria-label="Registrar nuevo paciente"
                          style="height: 30px; padding: 0 6px;">
                    ➕
                  </button>
                </div>
                <!-- Accesos directos a Historial Clínico y Odontograma -->
                <div id="cita-patient-historial-wrap" style="display: none; margin-top: 0.15rem;">
                  <div class="cluster" data-gap="xs">
                    <button type="button" 
                            id="btn-cita-open-historial" 
                            class="button" 
                            data-variant="ghost" 
                            data-size="sm" 
                            style="color: var(--primary, #0ea5e9); font-weight: 600; padding: 0.1rem 0.35rem; border: 1px dashed rgba(14, 165, 233, 0.4); border-radius: 4px; font-size: 0.69rem; flex: 1; justify-content: center; height: 21px;" 
                            title="Abrir historial médico del paciente seleccionado">
                      <span>📋 Historial</span>
                    </button>
                    <button type="button" 
                            id="btn-cita-open-odontograma" 
                            class="button" 
                            data-variant="ghost" 
                            data-size="sm" 
                            style="color: #0ea5e9; font-weight: 600; padding: 0.1rem 0.35rem; border: 1px dashed rgba(14, 165, 233, 0.4); border-radius: 4px; font-size: 0.69rem; flex: 1; justify-content: center; height: 21px;" 
                            title="Abrir odontograma clínico del paciente seleccionado">
                      <span>🦷 Odontograma</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Doctor Asignado (Obligatorio) -->
              <div class="field">
                <label for="cita-doctor" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Doctor / Especialista *</label>
                <select id="cita-doctor" class="input select" required>
                  <option value="" disabled selected>Seleccione un doctor registrado...</option>
                </select>
              </div>

              <!-- Estatus de la Cita -->
              <div class="field">
                <label for="cita-estatus" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Estatus de la Cita *</label>
                <select id="cita-estatus" class="input select" required>
                  <option value="false" selected>🟡 Pendiente (Por atender)</option>
                  <option value="true">🟢 Atendida (Realizada)</option>
                </select>
                <small id="cita-estatus-hint" style="font-size: 0.67rem; opacity: 0.75; display: block; margin-top: 1px; line-height: 1.1;">
                  Al guardar como Atendida se bloqueará la cita y se habilitará el cobro.
                </small>
              </div>
            </div>

            <!-- Columna Derecha: Fecha, Horarios, Motivo/Observación -->
            <div class="stack cita-col" data-gap="xs">
              <!-- Fecha de la Cita -->
              <div class="field">
                <label for="cita-fecha" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Fecha de la Cita *</label>
                <input type="date" id="cita-fecha" class="input" required />
              </div>

              <!-- Rango de Horario (Desde / Hasta) -->
              <div class="grid-2-cols" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
                <div class="field">
                  <label for="cita-hora-desde" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Hora Inicio *</label>
                  <input type="time" id="cita-hora-desde" class="input" required value="09:00" />
                </div>

                <div class="field">
                  <label for="cita-hora-hasta" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Hora Fin *</label>
                  <input type="time" id="cita-hora-hasta" class="input" required value="10:00" />
                </div>
              </div>

              <!-- Motivo u Observación -->
              <div class="field" style="flex: 1; display: flex; flex-direction: column;">
                <label for="cita-observacion" class="label" style="margin-bottom: 0.15rem; font-size: 0.78rem;">Motivo u Observación</label>
                <textarea id="cita-observacion" class="input" rows="2" style="resize: none; height: 38px; min-height: 38px; max-height: 42px; font-size: 0.8rem; padding: 0.25rem 0.45rem; line-height: 1.25;" placeholder="Ej. Limpieza dental profunda, revisión general, valoración..."></textarea>
              </div>
            </div>
          </div>

          <!-- Pie del Modal: Acciones -->
          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid rgba(125, 125, 125, 0.15);">
            <div class="cluster" data-gap="xs">
              <button type="button" id="btn-delete-cita" class="button" data-variant="outlined" style="display: none; border-color: #ef4444; color: #ef4444; font-size: 0.78rem; padding: 0.25rem 0.6rem; height: 30px;" title="Eliminar definitivamente esta cita">
                🗑️ Eliminar Cita
              </button>
              <button type="button" id="btn-cita-footer-historial" class="button" data-variant="outlined" data-size="sm" style="display: none; border-color: var(--primary, #0ea5e9); color: var(--primary, #0ea5e9); font-weight: 600; font-size: 0.76rem; padding: 0.2rem 0.5rem; height: 28px;" title="Abrir historial médico del paciente seleccionado">
                📋 Historial
              </button>
              <button type="button" id="btn-cita-footer-odontograma" class="button" data-variant="outlined" data-size="sm" style="display: none; border-color: #0ea5e9; color: #0ea5e9; font-weight: 600; font-size: 0.76rem; padding: 0.2rem 0.5rem; height: 28px;" title="Abrir odontograma clínico del paciente seleccionado">
                🦷 Odontograma
              </button>
            </div>
            <div class="cluster" data-gap="xs">
              <!-- Botón de Cobro (Se activa cuando la cita está Realizada / Atendida) -->
              <button type="button" id="btn-cita-cobro" class="button btn-cobro" data-paint="success" style="display: none; font-weight: 700; align-items: center; gap: 0.35rem; font-size: 0.78rem; padding: 0.25rem 0.7rem; height: 30px;" title="Registrar o consultar el cobro de esta consulta">
                <span>💳</span>
                <span id="btn-cita-cobro-text">Cobrar Cita</span>
              </button>
              
              <button type="button" class="button btn-close-modal" data-variant="ghost" style="font-size: 0.78rem; padding: 0.25rem 0.7rem; height: 30px;">Cerrar</button>
              
              <button type="submit" id="btn-submit-cita" class="button" data-paint="primary" style="font-size: 0.78rem; padding: 0.25rem 0.8rem; font-weight: 600; height: 30px;">
                💾 Guardar Cita
              </button>
            </div>
          </footer>
        </form>

      </div>
    </dialog>

    <!-- Modal de Registro de Cobro de Cita -->
    ${renderCobroModal()}
  `;
}

/**
 * Modal de Cobro de Cita (Liquidación en Dólares y Bolívares con Soporte para Múltiples Pagos)
 * Permite registrar n cobros para una misma cita, listar pagos existentes y consultar acumulados
 */
export function renderCobroModal() {
  return `
    <dialog id="modal-cobro-cita" class="dialog custom-modal modal-cobro-dialog" aria-labelledby="modal-cobro-title">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="xs">
        
        <!-- Cabecera del Modal de Cobro -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="width: 28px; height: 28px; background: rgba(16, 185, 129, 0.18); color: #10b981; font-size: 1rem;">💳</span>
            <div>
              <h3 id="modal-cobro-title" style="margin: 0; font-size: 1.05rem;">Liquidación y Cobros de Cita</h3>
              <p id="modal-cobro-subtitle" style="margin: 0; font-size: 0.74rem; opacity: 0.75;">Gestión de pagos asociados, divisas ($ USD) y Bolívares (Bs.)</p>
            </div>
          </div>
          <button type="button" class="button btn-close-cobro-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Resumen Superior: Cita y Total Acumulado -->
        <div class="cobro-top-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; align-items: stretch;">
          <!-- Tarjeta Resumen de la Cita Seleccionada -->
          <div id="cobro-cita-summary" class="box" data-surface="sunken" data-border style="padding: 0.35rem 0.55rem; border-radius: 6px; font-size: 0.75rem;">
            <div class="stack" data-gap="3xs" style="gap: 2px;">
              <div class="cluster" data-justify="between" data-align="center">
                <span style="opacity: 0.75; font-size: 0.72rem;">Paciente:</span>
                <strong id="cobro-summary-paciente" style="color: var(--primary, #0ea5e9); font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;">--</strong>
              </div>
              <div class="cluster" data-justify="between" data-align="center">
                <span style="opacity: 0.75; font-size: 0.72rem;">Especialista:</span>
                <span id="cobro-summary-doctor" style="font-weight: 500; font-size: 0.75rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 175px;">--</span>
              </div>
              <div class="cluster" data-justify="between" data-align="center">
                <span style="opacity: 0.75; font-size: 0.72rem;">Fecha Cita:</span>
                <span id="cobro-summary-fecha" style="font-size: 0.75rem;">--</span>
              </div>
            </div>
          </div>

          <!-- Tarjeta Resumen Total Acumulado -->
          <div id="cobro-total-summary-card" class="box" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 6px; padding: 0.35rem 0.55rem; display: flex; flex-direction: column; justify-content: space-between;">
            <div class="cluster" data-justify="between" data-align="center" style="gap: 4px;">
              <span style="font-size: 0.72rem; font-weight: 600; opacity: 0.85;">Total Cobrado:</span>
              <span id="cobro-count-badge" class="badge" data-paint="success" style="font-size: 0.68rem; padding: 1px 6px;">0 pagos</span>
            </div>
            <div class="cluster" data-justify="between" data-align="baseline" style="gap: 4px; margin-top: 1px;">
              <strong id="cobro-total-usd-display" style="font-size: 1.05rem; font-weight: 800; color: #10b981;">$0.00 USD</strong>
              <span id="cobro-total-bs-display" style="font-size: 0.82rem; font-weight: 700; opacity: 0.9;">0,00 Bs.</span>
            </div>
          </div>
        </div>

        <!-- Sección: Lista de Pagos Registrados -->
        <div class="box stack cobro-history-box" data-surface="sunken" data-border style="padding: 0.35rem 0.55rem; border-radius: 6px; gap: 0.3rem;">
          <div class="cluster" data-justify="between" data-align="center">
            <div class="cluster" data-gap="xs" data-align="center">
              <span style="font-size: 0.78rem; font-weight: 700;">📋 Pagos Registrados</span>
              <span id="cobro-pagos-count" class="badge" data-paint="neutral" style="font-size: 0.65rem; padding: 1px 5px;">0</span>
            </div>
            <button type="button" id="btn-otro-pago" class="button btn-otro-pago" data-paint="primary" data-size="sm" style="font-size: 0.72rem; padding: 0.15rem 0.55rem; height: 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;" title="Incluir otro pago asociado a esta misma cita">
              ➕ Incluir Otro Pago
            </button>
          </div>

          <!-- Contenedor dinámico de lista de pagos -->
          <div id="cobros-lista-items" class="cobros-lista-container" style="max-height: 110px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; padding-right: 2px;">
            <div style="text-align: center; font-size: 0.73rem; opacity: 0.7; padding: 0.4rem 0;">
              No hay pagos registrados para esta cita aún.
            </div>
          </div>
        </div>

        <!-- Formulario para Registrar / Editar Pago -->
        <form id="form-cobro-cita" class="stack" data-gap="xs">
          <input type="hidden" id="cobro-cita-id" value="" />
          <input type="hidden" id="cobro-id" value="" />

          <!-- Barra de Modo del Formulario -->
          <div class="cluster" data-justify="between" data-align="center" style="padding: 0 0.15rem;">
            <div class="cluster" data-gap="xs" data-align="center">
              <span id="cobro-form-mode-badge" class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">➕ NUEVO PAGO</span>
              <span id="cobro-form-mode-title" style="font-size: 0.76rem; font-weight: 600; opacity: 0.85;">Registrar pago para esta cita</span>
            </div>
            <button type="button" id="btn-cancel-edit-cobro" class="button" data-variant="ghost" data-size="sm" style="display: none; font-size: 0.70rem; height: 20px; padding: 0 6px; color: var(--primary, #0284c7);">
              ✕ Cancelar edición / Nuevo pago
            </button>
          </div>

          <div class="cobro-form-grid">
            <!-- Columna Izquierda: Tasa del Día, Fecha de Pago -->
            <div class="stack cobro-col" data-gap="xs">
              <!-- Tasa de Cambio del Día (Oficial BCV) -->
              <div class="field">
                <div class="cluster" data-justify="between" data-align="center" style="margin-bottom: 0.12rem;">
                  <label for="cobro-tasa-cambio" class="label" style="margin-bottom: 0; font-size: 0.76rem;">Tasa Oficial BCV *</label>
                  <button type="button" id="btn-refresh-tasa-cobro" class="button" data-variant="ghost" data-size="sm" style="font-size: 0.67rem; padding: 1px 4px; height: 18px;" title="Refrescar tasa más reciente">
                    🔄 Refrescar
                  </button>
                </div>
                
                <div class="box cluster" data-justify="between" data-align="center" style="background: rgba(2, 132, 199, 0.08); border: 1px solid rgba(2, 132, 199, 0.22); border-radius: 6px; padding: 0.25rem 0.45rem;">
                  <div class="cluster" data-gap="xs" data-align="center">
                    <span style="font-size: 0.95rem;">📈</span>
                    <div>
                      <span style="font-size: 0.66rem; opacity: 0.75; display: block; line-height: 1;">Tasa del día:</span>
                      <strong id="cobro-tasa-display" style="font-size: 0.82rem; color: #0284c7;">Cargando...</strong>
                    </div>
                  </div>
                  <span id="cobro-tasa-fecha-badge" class="badge" data-paint="neutral" style="font-size: 0.64rem; padding: 1px 3px;">--</span>
                </div>
                <input type="hidden" id="cobro-tasa-cambio" value="" required />
              </div>

              <!-- Fecha del Pago -->
              <div class="field">
                <label for="cobro-fecha-pago" class="label" style="margin-bottom: 0.12rem; font-size: 0.76rem;">Fecha del Pago *</label>
                <input type="date" id="cobro-fecha-pago" class="input" style="padding: 0.25rem 0.45rem; font-size: 0.82rem; height: 32px;" required />
              </div>
            </div>

            <!-- Columna Derecha: Monto USD, Equivalente Bs, Método de Pago -->
            <div class="stack cobro-col" data-gap="xs">
              <!-- Monto en Dólares ($ USD) -->
              <div class="field">
                <label for="cobro-monto-usd" class="label" style="margin-bottom: 0.12rem; font-size: 0.76rem;">Monto en Dólares ($ USD) *</label>
                <div style="position: relative; display: flex; align-items: center;">
                  <span class="cobro-currency-symbol" style="position: absolute; left: 0.65rem; top: 50%; transform: translateY(-50%); font-weight: 700; color: #10b981; font-size: 0.92rem; pointer-events: none; z-index: 2;">$</span>
                  <input 
                    type="number" 
                    id="cobro-monto-usd" 
                    class="input input-currency" 
                    style="padding-left: 2rem !important; font-size: 0.9rem; font-weight: 700; height: 32px; width: 100%;" 
                    step="0.01" 
                    min="0.01" 
                    placeholder="0.00" 
                    required 
                    autofocus 
                  />
                </div>
              </div>

              <!-- Equivalente en Bolívares (Bs.) -->
              <div class="field">
                <label class="label" style="margin-bottom: 0.12rem; font-size: 0.76rem;">Total en Bolívares (Bs.)</label>
                <div class="box" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 6px; padding: 0.25rem 0.45rem;">
                  <div class="cluster" data-justify="between" data-align="center">
                    <span style="font-size: 0.72rem; font-weight: 600; color: #10b981;">Equivalente:</span>
                    <strong id="cobro-monto-bs-display" style="font-size: 0.95rem; font-weight: 800; color: #10b981;">
                      0,00 Bs.
                    </strong>
                  </div>
                  <small id="cobro-formula-hint" style="font-size: 0.65rem; opacity: 0.75; display: block; margin-top: 1px;">
                    Calculado automáticamente con la tasa del día
                  </small>
                </div>
              </div>

              <!-- Referencia / Forma de Pago (Opcional) -->
              <div class="field">
                <label for="cobro-referencia" class="label" style="margin-bottom: 0.12rem; font-size: 0.76rem;">Método de Pago / Referencia</label>
                <input 
                  type="text" 
                  id="cobro-referencia" 
                  class="input" 
                  style="padding: 0.25rem 0.45rem; font-size: 0.82rem; height: 32px;" 
                  placeholder="Ej. Efectivo Divisas / Pago Móvil / Punto" 
                />
              </div>
            </div>
          </div>

          <!-- Pie del Modal de Cobro -->
          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.35rem; padding-top: 0.35rem; border-top: 1px solid rgba(125, 125, 125, 0.15);">
            <div class="cluster" style="gap: 0.4rem;">
              <button type="button" class="button btn-close-cobro-modal" data-variant="ghost" style="font-size: 0.78rem; padding: 0.25rem 0.7rem; height: 30px;">Cerrar</button>
              <button type="button" id="btn-otro-pago-footer" class="button btn-otro-pago" data-variant="ghost" style="font-size: 0.78rem; padding: 0.25rem 0.7rem; height: 30px; font-weight: 600; color: #0284c7;" title="Limpiar formulario para registrar otro pago a esta misma cita">
                ➕ Incluir Otro Pago
              </button>
            </div>
            <button type="submit" id="btn-submit-cobro" class="button" data-paint="success" style="font-weight: 700; font-size: 0.78rem; padding: 0.25rem 0.85rem; height: 30px;">
              💾 Guardar Pago
            </button>
          </footer>
        </form>

      </div>
    </dialog>
  `;
}
