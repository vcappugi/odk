/**
 * Componente Modal / Dialog de Registro (Yeti Dialog)
 */

export function renderRecordModal() {
  return `
    <dialog id="record-dialog" class="dialog box" data-surface="raised" data-border>
      <form id="record-form" method="dialog" class="stack" data-gap="md">
        <div class="cluster modal-header" data-justify="between" data-align="center">
          <h3 id="modal-title">Nuevo Registro</h3>
          <button type="button" class="button btn-close-dialog" data-variant="ghost" aria-label="Cerrar modal">&times;</button>
        </div>

        <input type="hidden" id="record-id" name="id" value="">

        <div class="field stack" data-gap="2xs">
          <label for="record-title-input"><strong>Título:</strong></label>
          <input type="text" id="record-title-input" name="title" required placeholder="Ej. Inspección de campo ODK" class="form-input">
        </div>

        <div class="field stack" data-gap="2xs">
          <label for="record-desc-input"><strong>Descripción:</strong></label>
          <textarea id="record-desc-input" name="description" rows="3" placeholder="Detalles u observaciones del registro..." class="form-input"></textarea>
        </div>

        <div class="grid" data-min="xs" data-columns="3" data-gap="sm">
          <div class="field stack" data-gap="2xs">
            <label for="record-category-input">Categoría:</label>
            <select id="record-category-input" name="category" class="form-select">
              <option value="Campo">Campo</option>
              <option value="Auditoría">Auditoría</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Diseño UI">Diseño UI</option>
              <option value="General">General</option>
            </select>
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="record-status-input">Estado:</label>
            <select id="record-status-input" name="status" class="form-select">
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          <div class="field stack" data-gap="2xs">
            <label for="record-priority-input">Prioridad:</label>
            <select id="record-priority-input" name="priority" class="form-select">
              <option value="Baja">Baja</option>
              <option value="Media" selected>Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>
        </div>

        <div class="cluster modal-actions" data-justify="end" data-gap="sm">
          <button type="button" class="button btn-close-dialog" data-variant="ghost">Cancelar</button>
          <button type="submit" id="btn-save-record" class="button" data-paint="primary">Guardar Registro</button>
        </div>
      </form>
    </dialog>
  `;
}
