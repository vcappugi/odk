/**
 * Controlador de Citas Odontológicas (Cita Controller)
 * Gestiona el formulario, creación, edición, eliminación y apertura del modal
 */

import { citaModel } from './citaModel.js';
import { patientModel } from '../patients/patientModel.js';
import { patientController } from '../patients/patientController.js';
import { adminModel } from '../admin/adminModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { notificationService } from '../../services/notificationService.js';
import { $ } from '../../utils/dom.js';

export const citaController = {
  activeCitaId: null,

  init() {
    this.bindEvents();
    this.subscribeToPatientChanges();
  },

  /**
   * Escucha la creación o actualización de pacientes para auto-refrescar y preseleccionar
   */
  subscribeToPatientChanges() {
    window.addEventListener('patient:saved', async (e) => {
      const savedPatient = e.detail;
      const pacienteSelect = $('#cita-paciente');
      // Si el select de paciente está presente en el modal de citas, refrescar opciones
      if (pacienteSelect && savedPatient?.id) {
        await this.populateSelects(savedPatient.id);
        pacienteSelect.value = String(savedPatient.id);
      }
    });
  },

  bindEvents() {
    // 1. Envío del formulario (Crear o Actualizar)
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'form-cita') {
        e.preventDefault();
        await this.handleSubmit();
      }
    });

    // 2. Botón Eliminar Cita
    document.addEventListener('click', async (e) => {
      if (e.target && (e.target.id === 'btn-delete-cita' || e.target.closest('#btn-delete-cita'))) {
        e.preventDefault();
        await this.handleDelete();
      }
    });

    // 3. Botón / Icono para Agregar Paciente desde el Modal de Citas
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cita-add-patient') || e.target.closest('#btn-cita-add-patient-icon')) {
        e.preventDefault();
        e.stopPropagation();
        patientController.openCreateForm();
      }
    });

    // 4. Cerrar modal con botón cancelar o X
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#modal-cita .btn-close-modal');
      if (closeBtn) {
        this.closeModal();
      }
    });
  },

  /**
   * Abre el modal en modo CREAR
   */
  async openCreateModal({ fecha = null, horaDesde = '09:00', horaHasta = '10:00' } = {}) {
    const dialog = $('#modal-cita');
    const form = $('#form-cita');
    if (!dialog || !form) return;

    this.activeCitaId = null;
    form.reset();

    $('#cita-id').value = '';
    $('#modal-cita-title').textContent = '📅 Agendar Cita Odontológica';
    $('#modal-cita-subtitle').textContent = 'Seleccione el paciente y horario de la cita';
    $('#btn-delete-cita').style.display = 'none';
    $('#btn-submit-cita').textContent = '💾 Agendar Cita';

    // Cargar listas desplegables
    await this.populateSelects();

    // Establecer fecha por defecto
    const todayStr = new Date().toISOString().split('T')[0];
    $('#cita-fecha').value = fecha || todayStr;
    $('#cita-hora-desde').value = horaDesde || '09:00';
    $('#cita-hora-hasta').value = horaHasta || '10:00';

    dialog.showModal();
  },

  /**
   * Abre el modal en modo EDITAR / VER
   */
  async openEditModal(citaId) {
    const dialog = $('#modal-cita');
    const form = $('#form-cita');
    if (!dialog || !form) return;

    this.activeCitaId = citaId;
    form.reset();

    $('#cita-id').value = citaId;
    $('#modal-cita-title').textContent = '✏️ Modificar Cita Odontológica';
    $('#modal-cita-subtitle').textContent = 'Puede cambiar la fecha, la hora o eliminar esta cita';
    $('#btn-delete-cita').style.display = 'inline-flex';
    $('#btn-submit-cita').textContent = '💾 Actualizar Cita';

    try {
      const cita = await citaModel.getById(citaId);
      if (!cita) {
        notificationService.show('No se encontró la información de la cita.', 'alert');
        return;
      }

      await this.populateSelects(cita.paciente_id, cita.doctor_id);

      $('#cita-fecha').value = cita.fecha || '';
      $('#cita-hora-desde').value = cita.hora_desde ? cita.hora_desde.slice(0, 5) : '09:00';
      $('#cita-hora-hasta').value = cita.hora_hasta ? cita.hora_hasta.slice(0, 5) : '10:00';
      $('#cita-observacion').value = cita.observacion || '';

      dialog.showModal();
    } catch (err) {
      console.error('[CitaController] Error cargando cita para edición:', err);
      notificationService.show('Error al abrir la cita: ' + err.message, 'alert');
    }
  },

  /**
   * Cierra el modal
   */
  closeModal() {
    const dialog = $('#modal-cita');
    if (dialog && dialog.open) {
      dialog.close();
    }
    this.activeCitaId = null;
  },

  /**
   * Carga los pacientes y doctores en los selects del formulario
   */
  async populateSelects(selectedPacienteId = null, selectedDoctorId = null) {
    const pacienteSelect = $('#cita-paciente');
    const doctorSelect = $('#cita-doctor');

    const activeSede = consultorioModel.getActiveConsultorio();

    // 1. Pacientes
    if (pacienteSelect) {
      pacienteSelect.innerHTML = '<option value="" disabled>Cargando pacientes...</option>';
      try {
        const pacientes = await patientModel.getAll(activeSede?.id);
        if (pacientes.length === 0) {
          pacienteSelect.innerHTML = '<option value="" disabled selected>No hay pacientes registrados</option>';
        } else {
          pacienteSelect.innerHTML = '<option value="" disabled ' + (!selectedPacienteId ? 'selected' : '') + '>Seleccione un paciente...</option>' +
            pacientes.map(p => `
              <option value="${p.id}" ${selectedPacienteId == p.id ? 'selected' : ''}>
                ${p.nombre} ${p.ci ? `(CI: ${p.ci})` : ''} ${p.telefono ? `— 📞 ${p.telefono}` : ''}
              </option>
            `).join('');
        }
      } catch (err) {
        console.error('[CitaController] Error listando pacientes:', err);
        pacienteSelect.innerHTML = '<option value="" disabled>Error cargando pacientes</option>';
      }
    }

    // 2. Doctores (Obligatorio)
    if (doctorSelect) {
      doctorSelect.innerHTML = '<option value="" disabled>Cargando doctores...</option>';
      try {
        const doctores = await adminModel.getDoctores();
        if (doctores && doctores.length > 0) {
          doctorSelect.innerHTML = '<option value="" disabled ' + (!selectedDoctorId ? 'selected' : '') + '>Seleccione un doctor registrado...</option>' +
            doctores.map(d => `
              <option value="${d.id}" ${selectedDoctorId == d.id ? 'selected' : ''}>
                ${d.nombre} ${d.consultorio?.nombre ? `[${d.consultorio.nombre}]` : ''}
              </option>
            `).join('');
        } else {
          doctorSelect.innerHTML = '<option value="" disabled selected>No hay doctores registrados (Cree uno en Configuración)</option>';
        }
      } catch (err) {
        console.warn('[CitaController] Error listando doctores:', err);
        doctorSelect.innerHTML = '<option value="" disabled selected>Error al cargar lista de doctores</option>';
      }
    }
  },

  /**
   * Procesa el envío del formulario
   */
  async handleSubmit() {
    const id = $('#cita-id')?.value;
    const pacienteId = $('#cita-paciente')?.value;
    const doctorId = $('#cita-doctor')?.value;
    const fecha = $('#cita-fecha')?.value;
    const horaDesde = $('#cita-hora-desde')?.value;
    const horaHasta = $('#cita-hora-hasta')?.value;
    const observacion = $('#cita-observacion')?.value?.trim();

    if (!pacienteId) {
      notificationService.show('Por favor seleccione un paciente.', 'warning');
      return;
    }

    if (!doctorId) {
      notificationService.show('Por favor seleccione el doctor o especialista asignado.', 'warning');
      return;
    }

    if (!fecha) {
      notificationService.show('Por favor seleccione la fecha de la cita.', 'warning');
      return;
    }

    if (!horaDesde || !horaHasta) {
      notificationService.show('Debe definir la hora de inicio y fin.', 'warning');
      return;
    }

    if (horaHasta <= horaDesde) {
      notificationService.show('La hora de fin debe ser posterior a la hora de inicio.', 'warning');
      return;
    }

    const submitBtn = $('#btn-submit-cita');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Guardando...';
    }

    try {
      const payload = {
        paciente_id: parseInt(pacienteId, 10),
        doctor_id: parseInt(doctorId, 10),
        fecha,
        hora_desde: horaDesde.length === 5 ? `${horaDesde}:00` : horaDesde,
        hora_hasta: horaHasta.length === 5 ? `${horaHasta}:00` : horaHasta,
        observacion: observacion || null
      };

      if (id) {
        await citaModel.update(parseInt(id, 10), payload);
        notificationService.show('✅ Cita actualizada exitosamente.', 'success');
      } else {
        await citaModel.create(payload);
        notificationService.show('✅ Cita agendada exitosamente en el calendario.', 'success');
      }

      this.closeModal();
    } catch (err) {
      console.error('[CitaController] Error guardando cita:', err);
      notificationService.show(`Error al guardar cita: ${err.message}`, 'alert');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  },

  /**
   * Elimina la cita activa
   */
  async handleDelete() {
    if (!this.activeCitaId) return;

    const confirmed = window.confirm('¿Está seguro de que desea eliminar definitivamente esta cita?');
    if (!confirmed) return;

    const deleteBtn = $('#btn-delete-cita');
    const originalText = deleteBtn ? deleteBtn.textContent : '';
    if (deleteBtn) {
      deleteBtn.disabled = true;
      deleteBtn.textContent = '⏳ Eliminando...';
    }

    try {
      await citaModel.delete(this.activeCitaId);
      notificationService.show('🗑️ Cita eliminada con éxito.', 'success');
      this.closeModal();
    } catch (err) {
      console.error('[CitaController] Error eliminando cita:', err);
      notificationService.show(`Error al eliminar cita: ${err.message}`, 'alert');
    } finally {
      if (deleteBtn) {
        deleteBtn.disabled = false;
        deleteBtn.textContent = originalText;
      }
    }
  }
};
