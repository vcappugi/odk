/**
 * Controlador de Historial Médico Odontológico (CRUD Completo)
 * Maneja eventos, persistencia en historial_medico y enlace directo desde
 * la Ficha de Paciente y desde el Modal de Citas Odontológicas.
 */

import { historialModel } from './historialModel.js';
import { renderHistorialCard } from './historialView.js';
import { adminModel } from '../admin/adminModel.js';
import { patientModel } from '../patients/patientModel.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { $ } from '../../utils/dom.js';

export const historialController = {
  currentPacienteId: null,
  currentPacienteNombre: '',
  currentCitaId: null,
  cachedEntries: [],
  doctoresList: [],

  init() {
    this.bindEvents();
    this.loadDoctores();
  },

  async loadDoctores() {
    try {
      this.doctoresList = await adminModel.getDoctores();
      this.populateDoctoresSelect();
    } catch (err) {
      console.warn('[HistorialController] Error cargando doctores:', err);
    }
  },

  populateDoctoresSelect(selectedDoctorId = null) {
    const select = $('#historial-field-doctor');
    if (!select) return;

    let html = '<option value="">Odontólogo General / Seleccione...</option>';
    if (this.doctoresList && this.doctoresList.length > 0) {
      this.doctoresList.forEach(d => {
        const isSel = String(d.id) === String(selectedDoctorId) ? 'selected' : '';
        html += `<option value="${d.id}" ${isSel}>${d.nombre}</option>`;
      });
    }
    select.innerHTML = html;
  },

  bindEvents() {
    // 1. Abrir formulario de nueva entrada
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-historial-new-entry')) {
        this.openCreateEntry();
      }
    });

    // 2. Cancelar formulario de entrada
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cancel-historial-entry') || e.target.closest('#btn-cancel-historial-form')) {
        this.hideForm();
      }
    });

    // 3. Envío del formulario de historial (Crear o Actualizar)
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'form-historial-entry') {
        e.preventDefault();
        await this.handleSubmitEntry();
      }
    });

    // 4. Botón editar entrada en la tarjeta
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-historial-entry');
      if (editBtn) {
        const id = editBtn.dataset.id;
        this.openEditEntry(id);
      }
    });

    // 5. Botón eliminar entrada en la tarjeta
    document.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('.btn-delete-historial-entry');
      if (delBtn) {
        const id = delBtn.dataset.id;
        await this.handleDeleteEntry(id);
      }
    });

    // 6. Cerrar modal de historial
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-historial-modal')) {
        this.closeModal();
      }
    });
  },

  /**
   * Abre el modal de historial médico para un paciente dado
   * @param {number|string} pacienteId 
   * @param {string} pacienteNombre 
   * @param {number|string|null} optionalCitaId 
   */
  async openHistorial(pacienteId, pacienteNombre = '', optionalCitaId = null) {
    if (!pacienteId) {
      notificationService.warning('Debe seleccionar o especificar un paciente primero.');
      return;
    }

    if (!permissionService.canRead('modal-historial-medico')) {
      notificationService.warning('Tu rol no tiene permiso para consultar el historial médico.');
      return;
    }

    this.currentPacienteId = pacienteId;
    this.currentPacienteNombre = pacienteNombre;
    this.currentCitaId = optionalCitaId || null;

    // Si no tenemos el nombre del paciente, consultarlo rápidamente
    if (!pacienteNombre) {
      try {
        const p = await patientModel.getById(pacienteId);
        if (p) {
          this.currentPacienteNombre = p.nombre || `Paciente #${pacienteId}`;
        }
      } catch {
        this.currentPacienteNombre = `Paciente #${pacienteId}`;
      }
    }

    // Actualizar encabezados
    const titleBadge = $('#historial-patient-name-badge');
    const subtitle = $('#historial-patient-subtitle');
    if (titleBadge) {
      titleBadge.textContent = this.currentPacienteNombre || `Paciente #${pacienteId}`;
    }
    if (subtitle) {
      const citaTxt = optionalCitaId ? ` · Enlazado a Cita #${optionalCitaId}` : '';
      subtitle.textContent = `Expediente clínico del paciente ID: ${pacienteId}${citaTxt}`;
    }

    // Ocultar formulario de edición y resetearlo
    this.hideForm();

    // Actualizar lista de doctores en el select
    await this.loadDoctores();

    // Mostrar modal
    const dialog = $('#modal-historial-medico');
    if (dialog) {
      dialog.showModal();
    }

    // Cargar entradas de este paciente
    await this.loadPatientHistory();
  },

  /**
   * Carga y renderiza el historial del paciente actual
   */
  async loadPatientHistory() {
    const listContainer = $('#historial-timeline-list');
    const countBadge = $('#historial-entries-count');
    const alertsBanner = $('#historial-alerts-banner');
    const allergiesSpan = $('#historial-critical-allergies');
    const backgroundSpan = $('#historial-critical-background');
    const statusInfo = $('#historial-status-info');

    if (listContainer) {
      listContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; opacity: 0.8;">
          <span class="spinner" data-size="sm"></span>
          <p style="margin-top: 0.5rem; font-size: 0.85rem;">Cargando historial médico...</p>
        </div>
      `;
    }

    try {
      this.cachedEntries = await historialModel.getAllByPaciente(this.currentPacienteId);

      if (countBadge) {
        countBadge.textContent = `${this.cachedEntries.length} ${this.cachedEntries.length === 1 ? 'registro' : 'registros'}`;
      }

      // Si la tabla no existe aún en Supabase, indicarlo amigablemente
      if (statusInfo) {
        if (historialModel.tableAvailableOnSupabase === false) {
          statusInfo.innerHTML = `
            <span style="color: #f59e0b;">⚠️ Modo Local (Ejecute scripts/create_historial_medico.sql en Supabase para sincronización en la nube)</span>
          `;
        } else {
          statusInfo.innerHTML = `
            <span style="color: #10b981;">✓ Sincronizado con tabla 'historial_medico' de Supabase</span>
          `;
        }
      }

      // Detectar alergias y antecedentes críticos a través del historial
      let foundAllergies = [];
      let foundAntecedents = [];
      this.cachedEntries.forEach(e => {
        if (e.alergias && e.alergias.trim() && e.alergias.toLowerCase() !== 'ninguna' && !foundAllergies.includes(e.alergias.trim())) {
          foundAllergies.push(e.alergias.trim());
        }
        if (e.antecedentes && e.antecedentes.trim() && !foundAntecedents.includes(e.antecedentes.trim())) {
          foundAntecedents.push(e.antecedentes.trim());
        }
      });

      if (alertsBanner && allergiesSpan) {
        if (foundAllergies.length > 0 || foundAntecedents.length > 0) {
          alertsBanner.style.display = 'block';
          allergiesSpan.textContent = foundAllergies.length > 0 ? foundAllergies.join(' | ') : 'Sin alergias registradas';
          if (backgroundSpan) {
            backgroundSpan.textContent = foundAntecedents.length > 0 ? `Antecedentes: ${foundAntecedents.join(', ')}` : '';
          }
        } else {
          alertsBanner.style.display = 'none';
        }
      }

      // Renderizar listado de tarjetas
      if (listContainer) {
        if (!this.cachedEntries || this.cachedEntries.length === 0) {
          listContainer.innerHTML = `
            <div class="timeline-empty-state" style="text-align: center; padding: 2.5rem 1rem; opacity: 0.7;">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;">📄</span>
              <strong>No hay registros en el historial médico</strong>
              <p style="margin: 0.25rem 0 0.75rem; font-size: 0.85rem;">
                Haga clic en "+ Nueva Entrada" para registrar la primera consulta o tratamiento de este paciente.
              </p>
            </div>
          `;
        } else {
          listContainer.innerHTML = this.cachedEntries.map(entry => renderHistorialCard(entry)).join('');
        }
      }

      // Permisos de escritura sobre botones de editar/eliminar
      const canWrite = permissionService.canWrite('modal-historial-medico');
      const newEntryBtn = $('#btn-historial-new-entry');
      if (newEntryBtn) {
        newEntryBtn.style.display = canWrite ? 'inline-flex' : 'none';
      }
      if (!canWrite) {
        document.querySelectorAll('.btn-edit-historial-entry, .btn-delete-historial-entry').forEach(btn => {
          btn.style.display = 'none';
        });
      }

    } catch (err) {
      console.error('[HistorialController] Error al obtener historial:', err);
      if (listContainer) {
        listContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #ef4444;">
            <p>Error al cargar el historial del paciente: ${err.message}</p>
          </div>
        `;
      }
    }
  },

  /**
   * Abre el formulario para crear una nueva entrada
   */
  openCreateEntry() {
    if (!permissionService.canWrite('modal-historial-medico')) {
      notificationService.warning('Tu rol no tiene permiso para agregar entradas al historial médico.');
      return;
    }

    const form = $('#form-historial-entry');
    const container = $('#historial-form-container');
    const modeTitle = $('#historial-form-mode-title');
    if (!form || !container) return;

    form.reset();
    $('#historial-entry-id').value = '';
    $('#historial-entry-paciente-id').value = this.currentPacienteId || '';
    $('#historial-entry-cita-id').value = this.currentCitaId || '';

    // Fecha actual por defecto
    const todayStr = new Date().toISOString().split('T')[0];
    $('#historial-field-fecha').value = todayStr;

    if (modeTitle) {
      modeTitle.textContent = '➕ Nueva Consulta / Entrada de Historial';
    }

    this.populateDoctoresSelect();

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /**
   * Abre el formulario para modificar una entrada existente
   */
  openEditEntry(entryId) {
    if (!permissionService.canWrite('modal-historial-medico')) {
      notificationService.warning('Tu rol no tiene permiso para modificar el historial médico.');
      return;
    }

    const entry = this.cachedEntries.find(e => String(e.id) === String(entryId));
    if (!entry) {
      notificationService.error('Registro de historial no encontrado.');
      return;
    }

    const container = $('#historial-form-container');
    const modeTitle = $('#historial-form-mode-title');
    if (!container) return;

    $('#historial-entry-id').value = entry.id;
    $('#historial-entry-paciente-id').value = entry.paciente_id;
    $('#historial-entry-cita-id').value = entry.cita_id || '';

    $('#historial-field-fecha').value = entry.fecha ? entry.fecha.slice(0, 10) : '';
    this.populateDoctoresSelect(entry.doctor_id);

    $('#historial-field-motivo').value = entry.motivo_consulta || '';
    $('#historial-field-diagnostico').value = entry.diagnostico || '';
    $('#historial-field-tratamiento').value = entry.tratamiento || '';
    $('#historial-field-alergias').value = entry.alergias || '';
    $('#historial-field-antecedentes').value = entry.antecedentes || '';
    $('#historial-field-medicamentos').value = entry.medicamentos || '';
    $('#historial-field-observaciones').value = entry.observaciones || '';

    if (modeTitle) {
      modeTitle.textContent = '✏️ Modificar Entrada de Historial';
    }

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },

  /**
   * Oculta el formulario de entrada
   */
  hideForm() {
    const container = $('#historial-form-container');
    if (container) {
      container.style.display = 'none';
    }
  },

  /**
   * Guarda o actualiza la entrada en el historial
   */
  async handleSubmitEntry() {
    const id = $('#historial-entry-id')?.value;
    const pacienteId = $('#historial-entry-paciente-id')?.value || this.currentPacienteId;
    const citaId = $('#historial-entry-cita-id')?.value || null;
    const fecha = $('#historial-field-fecha')?.value;
    const doctorId = $('#historial-field-doctor')?.value || null;
    const motivo = $('#historial-field-motivo')?.value?.trim();
    const diagnostico = $('#historial-field-diagnostico')?.value?.trim();
    const tratamiento = $('#historial-field-tratamiento')?.value?.trim();
    const alergias = $('#historial-field-alergias')?.value?.trim();
    const antecedentes = $('#historial-field-antecedentes')?.value?.trim();
    const medicamentos = $('#historial-field-medicamentos')?.value?.trim();
    const observaciones = $('#historial-field-observaciones')?.value?.trim();

    if (!pacienteId) {
      notificationService.error('Falta el ID del paciente.');
      return;
    }

    if (!fecha || !motivo || !diagnostico || !tratamiento) {
      notificationService.warning('Por favor complete los campos obligatorios (*).');
      return;
    }

    const payload = {
      paciente_id: pacienteId,
      cita_id: citaId,
      doctor_id: doctorId,
      fecha,
      motivo_consulta: motivo,
      diagnostico,
      tratamiento,
      alergias,
      antecedentes,
      medicamentos,
      observaciones
    };

    const submitBtn = $('#btn-submit-historial-entry');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      if (id) {
        // Actualizar
        await historialModel.update(id, payload);
        notificationService.success('Entrada de historial actualizada correctamente.');
      } else {
        // Crear
        await historialModel.create(payload);
        notificationService.success('Nueva entrada registrada en el historial médico.');
      }

      this.hideForm();
      await this.loadPatientHistory();
    } catch (err) {
      console.error('[HistorialController] Error guardando historial:', err);
      notificationService.error('Error al guardar en el historial: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 Guardar en Historial';
      }
    }
  },

  /**
   * Elimina una entrada del historial
   */
  async handleDeleteEntry(entryId) {
    if (!permissionService.canWrite('modal-historial-medico')) {
      notificationService.warning('Tu rol no tiene permiso para eliminar registros del historial.');
      return;
    }

    const confirmDelete = window.confirm('¿Está seguro de que desea eliminar definitivamente este registro del historial médico?');
    if (!confirmDelete) return;

    try {
      await historialModel.delete(entryId);
      notificationService.success('Registro eliminado del historial médico.');
      await this.loadPatientHistory();
    } catch (err) {
      console.error('[HistorialController] Error eliminando entrada:', err);
      notificationService.error('No se pudo eliminar el registro: ' + err.message);
    }
  },

  /**
   * Cierra el modal de historial
   */
  closeModal() {
    const dialog = $('#modal-historial-medico');
    if (dialog && dialog.open) {
      dialog.close();
    }
  }
};
