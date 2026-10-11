/**
 * Controlador de Registros (Records Controller)
 * Conecta los eventos del usuario entre la vista, el modelo y las notificaciones.
 */
import { recordsModel } from './recordsModel.js';
import { renderRecordsGrid } from './recordsView.js';
import { notificationService } from '../../services/notificationService.js';
import { $, $$ } from '../../utils/dom.js';

let currentRecords = [];
let currentSource = 'local';

export const recordsController = {
  async init() {
    this.bindGlobalEvents();
    await this.loadRecords();
  },

  async loadRecords() {
    const container = $('#records-container');
    if (!container) return;

    container.innerHTML = `
      <div class="box" style="text-align: center; padding: 2rem;">
        <span class="spinner" aria-label="Cargando"></span>
        <p>Cargando registros...</p>
      </div>
    `;

    try {
      const { data, error, source } = await recordsModel.getAll();
      currentRecords = data || [];
      currentSource = source;

      container.innerHTML = renderRecordsGrid(currentRecords, currentSource);
      this.bindCardEvents();

      if (error) {
        notificationService.warning(`Aviso: ${error}. Mostrando datos locales.`);
      }
    } catch (err) {
      console.error('[RecordsController] Error al cargar registros:', err);
      container.innerHTML = `<p class="alert" data-paint="alert">Error cargando registros: ${err.message}</p>`;
    }
  },

  bindGlobalEvents() {
    // Abrir modal de nuevo registro
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-create-modal') || e.target.closest('.btn-create-trigger')) {
        this.openCreateModal();
      }
    });

    // Cerrar modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-dialog')) {
        this.closeModal();
      }
    });

    // Envío del formulario
    const form = $('#record-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }

    // Botón de sincronización / recarga
    const syncBtn = $('#btn-sync-data');
    if (syncBtn) {
      syncBtn.addEventListener('click', async () => {
        notificationService.info('Sincronizando datos con la base de datos...');
        await this.loadRecords();
      });
    }
  },

  bindCardEvents() {
    // Botones de editar
    $$('.btn-edit-record').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        this.openEditModal(id);
      });
    });

    // Botones de eliminar
    $$('.btn-delete-record').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        await this.handleDelete(id);
      });
    });
  },

  openCreateModal() {
    const dialog = $('#record-dialog');
    const form = $('#record-form');
    const title = $('#modal-title');
    if (!dialog || !form) return;

    form.reset();
    $('#record-id').value = '';
    title.textContent = 'Nuevo Registro';

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  openEditModal(id) {
    const record = currentRecords.find(r => r.id === id);
    if (!record) return;

    const dialog = $('#record-dialog');
    const title = $('#modal-title');
    if (!dialog) return;

    $('#record-id').value = record.id;
    $('#record-title-input').value = record.title || '';
    $('#record-desc-input').value = record.description || '';
    $('#record-category-input').value = record.category || 'General';
    $('#record-status-input').value = record.status || 'Pendiente';
    $('#record-priority-input').value = record.priority || 'Media';
    title.textContent = 'Editar Registro';

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  closeModal() {
    const dialog = $('#record-dialog');
    if (!dialog) return;
    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  },

  async handleFormSubmit() {
    const id = $('#record-id').value;
    const formData = {
      title: $('#record-title-input').value.trim(),
      description: $('#record-desc-input').value.trim(),
      category: $('#record-category-input').value,
      status: $('#record-status-input').value,
      priority: $('#record-priority-input').value
    };

    if (!formData.title) {
      notificationService.warning('El título es obligatorio.');
      return;
    }

    const saveBtn = $('#btn-save-record');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';

    try {
      if (id) {
        const { error, source } = await recordsModel.update(id, formData);
        if (error) {
          notificationService.warning(`Actualizado en modo local (${error})`);
        } else {
          notificationService.success(`Registro actualizado correctamente (${source === 'supabase' ? 'Supabase' : 'Local'}).`);
        }
      } else {
        const { error, source } = await recordsModel.create(formData);
        if (error) {
          notificationService.warning(`Creado en modo local (${error})`);
        } else {
          notificationService.success(`Registro creado exitosamente (${source === 'supabase' ? 'Supabase' : 'Local'}).`);
        }
      }

      this.closeModal();
      await this.loadRecords();
    } catch (err) {
      notificationService.error(`Error guardando registro: ${err.message}`);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Registro';
    }
  },

  async handleDelete(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      return;
    }

    try {
      const { error } = await recordsModel.delete(id);
      if (error) {
        notificationService.warning(`Eliminado con advertencia: ${error}`);
      } else {
        notificationService.success('Registro eliminado exitosamente.');
      }
      await this.loadRecords();
    } catch (err) {
      notificationService.error(`Error eliminando registro: ${err.message}`);
    }
  }
};
