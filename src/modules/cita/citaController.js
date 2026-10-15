/**
 * Controlador de Citas Odontológicas (Cita Controller)
 * Gestiona el formulario, creación, edición, eliminación y apertura del modal de citas,
 * así como el bloqueo de campos y registro de cobros en cobro_cita con tasa del día.
 */

import { citaModel, isCitaAtendida, normalizeCitaEstatus } from './citaModel.js';
import { cobroModel } from './cobroModel.js';
import { tasaCambioModel } from '../tasaCambio/tasaCambioModel.js';
import { patientModel } from '../patients/patientModel.js';
import { patientController } from '../patients/patientController.js';
import { adminModel } from '../admin/adminModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { historialController } from '../historial/historialController.js';
import { historialModel } from '../historial/historialModel.js';
import { odontogramaController } from '../odontograma/odontogramaController.js';
import { reciboService } from './reciboService.js';
import { $ } from '../../utils/dom.js';

export const citaController = {
  activeCitaId: null,
  activeCitaData: null,
  currentCobro: null,
  currentCobros: [],
  editingCobroId: null,
  currentTasa: 0,

  init() {
    this.bindEvents();
    this.subscribeToPatientChanges();
    reciboService.initEvents();
  },

  /**
   * Escucha la creación o actualización de pacientes para auto-refrescar y preseleccionar
   */
  subscribeToPatientChanges() {
    window.addEventListener('patient:saved', async (e) => {
      const savedPatient = e.detail;
      const pacienteSelect = $('#cita-paciente');
      if (pacienteSelect && savedPatient?.id) {
        await this.populateSelects(savedPatient.id);
        pacienteSelect.value = String(savedPatient.id);
        this.updateHistorialBtnVisibility();
      }
    });
  },

  bindEvents() {
    // 1. Envío del formulario de la Cita (Crear o Actualizar)
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

    // 3b. Cambio de paciente seleccionado en el select de citas -> actualizar visibilidad de botones de historial
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'cita-paciente') {
        this.updateHistorialBtnVisibility();
      }
    });

    // 3c. Cambio dinámico en el Estatus de la Cita -> activar/inactivar campos y botón de cobro
    document.addEventListener('change', async (e) => {
      if (e.target && e.target.id === 'cita-estatus') {
        const val = normalizeCitaEstatus(e.target.value);
        const isRealizada = isCitaAtendida(val);
        await this.applyEstatusState(isRealizada, this.currentCobros || this.currentCobro, val);
      }
    });

    // 3d. Botón para abrir el Historial Médico del paciente desde la Cita
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cita-open-historial') || e.target.closest('#btn-cita-footer-historial')) {
        e.preventDefault();
        const pacienteSelect = $('#cita-paciente');
        const pacienteId = pacienteSelect?.value;
        if (!pacienteId) {
          notificationService.warning('Seleccione un paciente de la lista para ver su historial médico.');
          return;
        }
        const opt = pacienteSelect.options[pacienteSelect.selectedIndex];
        const rawText = opt?.text || '';
        const pacienteName = rawText.split('(')[0].trim() || `Paciente #${pacienteId}`;
        historialController.openHistorial(pacienteId, pacienteName, this.activeCitaId);
      }
    });

    // 3e. Botón para abrir el Odontograma del paciente desde la Cita
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cita-open-odontograma') || e.target.closest('#btn-cita-footer-odontograma')) {
        e.preventDefault();
        const pacienteSelect = $('#cita-paciente');
        const pacienteId = pacienteSelect?.value;
        if (!pacienteId) {
          notificationService.warning('Seleccione un paciente de la lista para abrir su odontograma.');
          return;
        }
        const opt = pacienteSelect.options[pacienteSelect.selectedIndex];
        const rawText = opt?.text || '';
        const pacienteName = rawText.split('(')[0].trim() || `Paciente #${pacienteId}`;
        odontogramaController.openOdontograma(pacienteId, pacienteName, this.activeCitaId);
      }
    });

    // 4. Botón de Cobro de Cita -> Abre el modal de liquidación/cobro
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-cita-cobro')) {
        e.preventDefault();
        await this.openCobroModal();
      }
    });

    // 4b. Botón para Incluir Otro Pago o Cancelar Edición
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-otro-pago') || e.target.closest('#btn-cancel-edit-cobro')) {
        e.preventDefault();
        await this.startNewCobro();
      }
    });

    // 4c. Botón Editar Pago individual en la lista de cobros
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-cobro');
      if (editBtn) {
        e.preventDefault();
        const cobroId = editBtn.dataset.id;
        if (cobroId) this.editCobro(cobroId);
      }
    });

    // 4d. Botón Eliminar Pago individual en la lista de cobros
    document.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('.btn-delete-cobro');
      if (delBtn) {
        e.preventDefault();
        const cobroId = delBtn.dataset.id;
        if (cobroId) await this.deleteCobro(cobroId);
      }
    });

    // 4e. Botón Recibo de Pago individual en la lista de cobros
    document.addEventListener('click', async (e) => {
      const reciboBtn = e.target.closest('.btn-recibo-cobro');
      if (reciboBtn) {
        e.preventDefault();
        const cobroId = reciboBtn.dataset.id;
        await this.openRecibo(cobroId);
      }
    });

    // 4f. Botón Generar Recibo de Pago General / Consolidado desde el modal de cobro
    document.addEventListener('click', async (e) => {
      if (e.target.closest('.btn-generar-recibo')) {
        e.preventDefault();
        await this.openRecibo(null);
      }
    });

    // 5. Input de Monto en Dólares ($ USD) -> Recalcula en vivo Bolívares según la tasa del día
    document.addEventListener('input', (e) => {
      if (e.target && e.target.id === 'cobro-monto-usd') {
        this.recalculateCobroBs();
      }
    });

    // 6. Botón refrescar tasa en el modal de cobro
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-refresh-tasa-cobro')) {
        e.preventDefault();
        await this.refreshTasaCobro();
      }
    });

    // 7. Envío del formulario de Cobro (Guardar en cobro_cita)
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'form-cobro-cita') {
        e.preventDefault();
        await this.handleCobroSubmit();
      }
    });

    // 8. Cerrar modal de Cobro
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-cobro-modal')) {
        this.closeCobroModal();
      }
    });

    // 9. Cerrar modal de Cita con botón cancelar o X
    document.addEventListener('click', (e) => {
      const closeBtn = e.target.closest('#modal-cita .btn-close-modal');
      if (closeBtn) {
        this.closeModal();
      }
    });

    // 10. Escuchar eventos globales de cambios en cobros
    window.addEventListener('cobro:changed', async (e) => {
      const changedCitaId = e.detail?.citaId;
      if (changedCitaId && this.activeCitaId && Number(changedCitaId) === Number(this.activeCitaId)) {
        this.currentCobros = await cobroModel.getAllByCitaId(this.activeCitaId);
        this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;
        const normStatus = normalizeCitaEstatus(this.activeCitaData?.estatus);
        await this.applyEstatusState(isCitaAtendida(normStatus), this.currentCobros, normStatus);
      }
    });
  },

  /**
   * Aplica el estado de bloqueo a los campos cuando la cita está en estatus ATENDIDO,
   * y muestra/oculta el botón de cobro de acuerdo al estatus
   * @param {boolean} isRealizada
   * @param {Object|null} existingCobro
   * @param {string|null} currentStatusVal
   */
  async applyEstatusState(isRealizada, existingCobro = null, currentStatusVal = null) {
    const banner = $('#cita-realizada-banner');
    const bannerTitle = $('#cita-banner-title');
    const bannerText = $('#cita-banner-text');
    const bannerIcon = $('#cita-banner-icon');
    const cobroBtn = $('#btn-cita-cobro');
    const cobroBtnText = $('#btn-cita-cobro-text');
    const submitBtn = $('#btn-submit-cita');
    const delBtn = $('#btn-delete-cita');
    const btnAddPatient = $('#btn-cita-add-patient');
    const btnAddPatientIcon = $('#btn-cita-add-patient-icon');
    const estatusSelect = $('#cita-estatus');

    // Campos a bloquear/desbloquear
    const fieldsToLock = [
      $('#cita-paciente'),
      $('#cita-doctor'),
      $('#cita-fecha'),
      $('#cita-hora-desde'),
      $('#cita-hora-hasta'),
      $('#cita-observacion')
    ];

    const canWrite = permissionService.canWrite('modal-cita');
    const isAlreadyAtendida = isCitaAtendida(this.activeCitaData?.estatus);
    const selectedStatus = currentStatusVal || estatusSelect?.value || (isAlreadyAtendida ? 'ATENDIDO' : 'PENDIENTE');

    if (isRealizada) {
      // INACTIVAR CAMPOS DE LA VENTANA DE CITA
      fieldsToLock.forEach(field => {
        if (field) {
          field.disabled = true;
          field.style.cursor = 'not-allowed';
          field.style.opacity = '0.75';
        }
      });

      if (btnAddPatient) {
        btnAddPatient.style.display = 'none';
        btnAddPatient.disabled = true;
      }
      if (btnAddPatientIcon) {
        btnAddPatientIcon.style.display = 'none';
        btnAddPatientIcon.disabled = true;
      }

      // SI LA CITA YA ESTABA EN ESTATUS ATENDIDO (PERSISTIDA EN BD):
      // No podrá ser alterada ni eliminada
      if (isAlreadyAtendida) {
        if (estatusSelect) {
          estatusSelect.disabled = true;
          estatusSelect.style.cursor = 'not-allowed';
          estatusSelect.style.opacity = '0.75';
        }

        // Ocultar y deshabilitar definitivamente botones de eliminar y actualizar/guardar
        if (delBtn) {
          delBtn.style.display = 'none';
          delBtn.disabled = true;
        }
        if (submitBtn) {
          submitBtn.style.display = 'none';
          submitBtn.disabled = true;
        }

        if (banner) {
          banner.style.display = 'block';
          banner.style.background = 'rgba(16, 185, 129, 0.12)';
          banner.style.borderColor = 'rgba(16, 185, 129, 0.35)';
          if (bannerIcon) bannerIcon.textContent = '🔒';
          if (bannerTitle) bannerTitle.textContent = 'Cita en Estatus ATENDIDO (Bloqueada)';
          if (bannerText) bannerText.innerHTML = 'Esta consulta está en estatus <strong>ATENDIDO</strong> y <strong>no puede ser modificada ni eliminada</strong>. Utilice el botón <strong>Cobro</strong> para registrar o verificar la liquidación.';
        }
      } else {
        // La cita estaba en otro estatus y el usuario está seleccionando ATENDIDO para guardarla
        if (estatusSelect) {
          estatusSelect.disabled = !canWrite;
          estatusSelect.style.cursor = '';
          estatusSelect.style.opacity = '';
        }

        // Ocultar botón eliminar mientras esté en transición a ATENDIDO
        if (delBtn) delBtn.style.display = 'none';

        // Permitir guardar para registrar la cita como ATENDIDO
        if (submitBtn && canWrite) {
          submitBtn.style.display = 'inline-flex';
          submitBtn.disabled = false;
          submitBtn.textContent = '💾 Guardar como ATENDIDO';
        }

        if (banner) {
          banner.style.display = 'block';
          banner.style.background = 'rgba(16, 185, 129, 0.12)';
          banner.style.borderColor = 'rgba(16, 185, 129, 0.35)';
          if (bannerIcon) bannerIcon.textContent = '🟢';
          if (bannerTitle) bannerTitle.textContent = 'Estatus seleccionado: ATENDIDO';
          if (bannerText) bannerText.innerHTML = 'Al guardar, la cita quedará registrada como <strong>ATENDIDO</strong> y quedará permanentemente bloqueada para modificaciones.';
        }
      }

      // ACTIVAR BOTÓN DE COBRO
      if (cobroBtn) {
        cobroBtn.style.display = 'inline-flex';
        cobroBtn.disabled = false;

        const cobrosList = Array.isArray(existingCobro) 
          ? existingCobro 
          : (existingCobro ? [existingCobro] : (this.currentCobros || []));

        if (cobrosList.length === 1) {
          const c = cobrosList[0];
          if (cobroBtnText) cobroBtnText.textContent = `✅ Cobro: $${Number(c.monto_cobrado || 0).toFixed(2)} USD`;
        } else if (cobrosList.length > 1) {
          const totalUsd = cobrosList.reduce((acc, c) => acc + Number(c.monto_cobrado || 0), 0);
          if (cobroBtnText) cobroBtnText.textContent = `✅ Cobros (${cobrosList.length}): $${totalUsd.toFixed(2)} USD`;
        } else {
          if (cobroBtnText) cobroBtnText.textContent = '💳 Cobrar Cita';
        }
      }

    } else {
      // HABILITAR CAMPOS (Cita Pendiente o No Asistió)
      fieldsToLock.forEach(field => {
        if (field) {
          field.disabled = !canWrite;
          field.style.cursor = '';
          field.style.opacity = '';
        }
      });

      if (estatusSelect) {
        estatusSelect.disabled = !canWrite;
        estatusSelect.style.cursor = '';
        estatusSelect.style.opacity = '';
      }

      if (btnAddPatient) {
        btnAddPatient.style.display = 'inline-flex';
        btnAddPatient.disabled = !canWrite;
        btnAddPatient.style.cursor = canWrite ? 'pointer' : 'not-allowed';
        btnAddPatient.style.opacity = canWrite ? '1' : '0.6';
      }
      if (btnAddPatientIcon) {
        btnAddPatientIcon.style.display = 'inline-flex';
        btnAddPatientIcon.disabled = !canWrite;
        btnAddPatientIcon.style.cursor = canWrite ? 'pointer' : 'not-allowed';
        btnAddPatientIcon.style.opacity = canWrite ? '1' : '0.6';
      }

      // Mostrar banner informativo específico si es NO ASISTIO
      if (selectedStatus === 'NO ASISTIO') {
        if (banner) {
          banner.style.display = 'block';
          banner.style.background = 'rgba(239, 68, 68, 0.12)';
          banner.style.borderColor = 'rgba(239, 68, 68, 0.35)';
          if (bannerIcon) bannerIcon.textContent = '🔴';
          if (bannerTitle) bannerTitle.textContent = 'Estatus: NO ASISTIO';
          if (bannerText) bannerText.innerHTML = 'El paciente no se presentó a su cita programada.';
        }
      } else {
        if (banner) banner.style.display = 'none';
      }

      // Mostrar botón eliminar si la cita existe y no está atendida
      if (delBtn) {
        delBtn.style.display = (this.activeCitaId && canWrite) ? 'inline-flex' : 'none';
        delBtn.disabled = false;
      }

      // Ocultar botón de cobro en citas no atendidas
      if (cobroBtn) {
        cobroBtn.style.display = 'none';
      }

      if (submitBtn && canWrite) {
        submitBtn.style.display = 'inline-flex';
        submitBtn.disabled = false;
        submitBtn.textContent = this.activeCitaId ? '💾 Actualizar Cita' : '💾 Agendar Cita';
      }
    }
  },

  /**
   * Abre el modal en modo CREAR
   */
  async openCreateModal({ fecha = null, horaDesde = '09:00', horaHasta = '10:00', doctorId = null } = {}) {
    const dialog = $('#modal-cita');
    const form = $('#form-cita');
    if (!dialog || !form) return;

    if (!permissionService.canWrite('modal-cita')) {
      notificationService.warning('Tu rol no tiene permiso para agendar o registrar citas odontológicas.');
      return;
    }

    this.activeCitaId = null;
    this.activeCitaData = null;
    this.currentCobro = null;
    this.currentCobros = [];
    this.editingCobroId = null;
    form.reset();

    // Habilitar campos y botones
    form.querySelectorAll('input, select, textarea, button').forEach(el => {
      el.disabled = false;
      el.style.cursor = '';
      el.style.opacity = '';
    });

    const btnAddPatient = $('#btn-cita-add-patient');
    const btnAddPatientIcon = $('#btn-cita-add-patient-icon');
    if (btnAddPatient) {
      btnAddPatient.disabled = false;
      btnAddPatient.style.display = 'inline-flex';
      btnAddPatient.style.cursor = 'pointer';
      btnAddPatient.style.opacity = '1';
    }
    if (btnAddPatientIcon) {
      btnAddPatientIcon.disabled = false;
      btnAddPatientIcon.style.display = 'inline-flex';
      btnAddPatientIcon.style.cursor = 'pointer';
      btnAddPatientIcon.style.opacity = '1';
    }

    $('#cita-id').value = '';
    $('#modal-cita-title').textContent = '📅 Agendar Cita Odontológica';
    $('#modal-cita-subtitle').textContent = 'Seleccione el paciente y horario de la cita';
    $('#btn-delete-cita').style.display = 'none';
    const submitBtn = $('#btn-submit-cita');
    if (submitBtn) {
      submitBtn.style.display = 'inline-flex';
      submitBtn.textContent = '💾 Agendar Cita';
    }

    // Cargar listas desplegables
    await this.populateSelects(null, doctorId);
    this.updateHistorialBtnVisibility();

    // Establecer fecha por defecto y estatus inicial (Pendiente)
    const todayStr = new Date().toISOString().split('T')[0];
    $('#cita-fecha').value = fecha || todayStr;
    $('#cita-hora-desde').value = horaDesde || '09:00';
    $('#cita-hora-hasta').value = horaHasta || '10:00';
    const estatusSelect = $('#cita-estatus');
    if (estatusSelect) estatusSelect.value = 'PENDIENTE';

    await this.applyEstatusState(false, null, 'PENDIENTE');

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Abre el modal en modo EDITAR / VER
   */
  async openEditModal(citaId) {
    const dialog = $('#modal-cita');
    const form = $('#form-cita');
    if (!dialog || !form) return;

    if (!permissionService.canRead('modal-cita')) {
      notificationService.warning('Tu rol no tiene permiso para consultar citas odontológicas.');
      return;
    }

    const canWrite = permissionService.canWrite('modal-cita');

    this.activeCitaId = citaId;
    form.reset();

    $('#cita-id').value = citaId;
    $('#modal-cita-title').textContent = canWrite ? '✏️ Detalle de Cita Odontológica' : '👁️ Consulta de Cita Odontológica';
    $('#modal-cita-subtitle').textContent = canWrite 
      ? 'Gestión de horario, estatus y liquidación de cobro' 
      : 'Modo Solo Lectura (Sin permisos de modificación para este rol)';

    const delBtn = $('#btn-delete-cita');
    if (delBtn) delBtn.style.display = canWrite ? 'inline-flex' : 'none';

    const submitBtn = $('#btn-submit-cita');
    if (submitBtn) {
      submitBtn.style.display = canWrite ? 'inline-flex' : 'none';
      submitBtn.textContent = '💾 Actualizar Cita';
    }

    try {
      const cita = await citaModel.getById(citaId);
      if (!cita) {
        notificationService.show('No se encontró la información de la cita.', 'alert');
        return;
      }

      this.activeCitaData = cita;
      const normalizedStatus = normalizeCitaEstatus(cita.estatus);
      const isAlreadyAtendida = isCitaAtendida(cita.estatus);

      if (isAlreadyAtendida) {
        $('#modal-cita-title').textContent = '🔒 Cita Odontológica (ATENDIDO)';
        $('#modal-cita-subtitle').textContent = 'Registro finalizado — Esta cita está en estatus ATENDIDO y no puede ser alterada ni eliminada';
      } else {
        $('#modal-cita-title').textContent = canWrite ? '✏️ Detalle de Cita Odontológica' : '👁️ Consulta de Cita Odontológica';
        $('#modal-cita-subtitle').textContent = canWrite 
          ? 'Gestión de horario, estatus y liquidación de cobro' 
          : 'Modo Solo Lectura (Sin permisos de modificación para este rol)';
      }

      await this.populateSelects(cita.paciente_id, cita.doctor_id);
      this.updateHistorialBtnVisibility();

      $('#cita-fecha').value = cita.fecha || '';
      $('#cita-hora-desde').value = cita.hora_desde ? cita.hora_desde.slice(0, 5) : '09:00';
      $('#cita-hora-hasta').value = cita.hora_hasta ? cita.hora_hasta.slice(0, 5) : '10:00';
      $('#cita-observacion').value = cita.observacion || '';
      
      const estatusSelect = $('#cita-estatus');
      if (estatusSelect) {
        estatusSelect.value = normalizedStatus;
      }

      // Consultar todos los cobros registrados para esta cita en cobro_cita
      const existingCobros = await cobroModel.getAllByCitaId(citaId);
      this.currentCobros = existingCobros || [];
      this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;

      // Inactivar campos y aplicar bloqueo si la cita está realizada/atendida
      await this.applyEstatusState(isAlreadyAtendida, this.currentCobros, normalizedStatus);

      if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (err) {
      console.error('[CitaController] Error cargando cita para edición:', err);
      notificationService.show('Error al abrir la cita: ' + err.message, 'alert');
    }
  },

  /**
   * Cierra el modal de citas
   */
  closeModal() {
    const dialog = $('#modal-cita');
    if (dialog && dialog.open) {
      dialog.close();
    }
    this.activeCitaId = null;
    this.activeCitaData = null;
    this.updateHistorialBtnVisibility();

    // Reestablecer botones de nuevo paciente para prevenir que queden deshabilitados
    const btnAddPatient = $('#btn-cita-add-patient');
    const btnAddPatientIcon = $('#btn-cita-add-patient-icon');
    if (btnAddPatient) {
      btnAddPatient.disabled = false;
      btnAddPatient.style.display = 'inline-flex';
      btnAddPatient.style.cursor = 'pointer';
      btnAddPatient.style.opacity = '1';
    }
    if (btnAddPatientIcon) {
      btnAddPatientIcon.disabled = false;
      btnAddPatientIcon.style.display = 'inline-flex';
      btnAddPatientIcon.style.cursor = 'pointer';
      btnAddPatientIcon.style.opacity = '1';
    }
  },

  /**
   * Abre el Modal de Cobro para la cita activa y carga todos sus pagos
   */
  async openCobroModal() {
    const dialog = $('#modal-cobro-cita');
    if (!dialog) return;

    if (!this.activeCitaId) {
      notificationService.warning('Primero debe guardar la cita en estatus ATENDIDO para poder registrar o consultar cobros.');
      return;
    }

    // Asegurar que tengamos los datos completos de la cita
    let cita = this.activeCitaData;
    if (!cita) {
      cita = await citaModel.getById(this.activeCitaId);
      this.activeCitaData = cita;
    }

    // 1. Mostrar resumen de la cita
    const summaryPaciente = $('#cobro-summary-paciente');
    const summaryDoctor = $('#cobro-summary-doctor');
    const summaryFecha = $('#cobro-summary-fecha');

    if (summaryPaciente) {
      summaryPaciente.textContent = cita?.paciente?.nombre 
        ? `${cita.paciente.nombre} ${cita.paciente.ci ? `(CI: ${cita.paciente.ci})` : ''}` 
        : 'Paciente general';
    }
    if (summaryDoctor) {
      summaryDoctor.textContent = cita?.doctor?.nombre ? `Dr(a). ${cita.doctor.nombre}` : 'Sin doctor';
    }
    if (summaryFecha) {
      summaryFecha.textContent = `${cita?.fecha || ''} | ${cita?.hora_desde ? cita.hora_desde.slice(0, 5) : ''} - ${cita?.hora_hasta ? cita.hora_hasta.slice(0, 5) : ''}`;
    }

    // 2. IDs ocultos
    $('#cobro-cita-id').value = this.activeCitaId;

    // 3. Cargar y mostrar la tasa de cambio del día
    await this.refreshTasaCobro();

    // 4. Obtener todos los cobros asociados a la cita
    this.currentCobros = await cobroModel.getAllByCitaId(this.activeCitaId);
    this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;

    // 5. Renderizar lista de pagos y acumulados
    this.renderCobrosList();

    // 6. Preparar formulario en modo nuevo cobro o incluir otro pago
    await this.startNewCobro();

    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Renderiza la lista de pagos registrados para la cita y actualiza los totales acumulados
   */
  renderCobrosList() {
    const container = $('#cobros-lista-items');
    const totalUsdDisplay = $('#cobro-total-usd-display');
    const totalBsDisplay = $('#cobro-total-bs-display');
    const countBadge = $('#cobro-count-badge');
    const pagosCount = $('#cobro-pagos-count');

    const cobros = this.currentCobros || [];
    const count = cobros.length;

    // Actualizar contadores
    if (countBadge) countBadge.textContent = count === 1 ? '1 pago' : `${count} pagos`;
    if (pagosCount) pagosCount.textContent = String(count);

    // Calcular totales acumulados
    let totalUsd = 0;
    let totalBs = 0;

    cobros.forEach(c => {
      const monto = Number(c.monto_cobrado || 0);
      const tasa = Number(c.tasa_cambio || this.currentTasa || 0);
      totalUsd += monto;
      totalBs += monto * tasa;
    });

    if (totalUsdDisplay) {
      totalUsdDisplay.textContent = `$${totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    }
    if (totalBsDisplay) {
      totalBsDisplay.textContent = `${totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;
    }

    if (!container) return;

    if (count === 0) {
      container.innerHTML = `
        <div style="text-align: center; font-size: 0.73rem; opacity: 0.7; padding: 0.4rem 0;">
          No hay pagos registrados para esta cita aún. Ingrese el monto abajo para registrar el primer cobro.
        </div>
      `;
      return;
    }

    container.innerHTML = cobros.map((cobro, index) => {
      const isSelected = this.editingCobroId && Number(this.editingCobroId) === Number(cobro.id);
      const montoUsd = Number(cobro.monto_cobrado || 0);
      const tasa = Number(cobro.tasa_cambio || this.currentTasa || 0);
      const montoBs = montoUsd * tasa;
      const formattedBs = montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const formattedUsd = montoUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fechaStr = cobro.fecha_pago || '--';

      return `
        <div class="box cluster cobro-list-item ${isSelected ? 'cobro-item-selected' : ''}" 
             data-id="${cobro.id}" 
             style="padding: 0.3rem 0.5rem; border-radius: 6px; font-size: 0.75rem; justify-content: space-between; align-items: center; background: ${isSelected ? 'rgba(2, 132, 199, 0.12)' : 'rgba(125, 125, 125, 0.05)'}; border: 1px solid ${isSelected ? 'var(--primary, #0284c7)' : 'rgba(125, 125, 125, 0.2)'}; gap: 0.35rem;">
          <div class="cluster" style="gap: 0.45rem; align-items: center; flex: 1; min-width: 0; flex-wrap: wrap;">
            <span class="badge" data-paint="${isSelected ? 'primary' : 'neutral'}" style="font-weight: 700; font-size: 0.67rem; padding: 1px 5px;">#${index + 1}</span>
            <span style="opacity: 0.85; font-size: 0.72rem; white-space: nowrap;">📅 ${fechaStr}</span>
            <strong style="color: #10b981; font-size: 0.82rem; white-space: nowrap;">$${formattedUsd} USD</strong>
            <span style="opacity: 0.75; font-size: 0.71rem; white-space: nowrap;">(~${formattedBs} Bs.)</span>
            <span class="badge" data-paint="success" style="font-size: 0.66rem; font-weight: 600;">🏷️ ${cobro.metodo_pago || 'Efectivo Divisas'}</span>
            ${cobro.referencia ? `<span class="badge" data-paint="neutral" style="font-size: 0.66rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${cobro.referencia}">Ref: ${cobro.referencia}</span>` : ''}
          </div>
          <div class="cluster" style="gap: 0.25rem; flex-shrink: 0;">
            <button type="button" class="button btn-recibo-cobro" data-id="${cobro.id}" data-variant="ghost" data-size="sm" style="font-size: 0.68rem; padding: 1px 6px; height: 22px; color: #0284c7; font-weight: 700;" title="Generar recibo de este pago para WhatsApp, Correo o Impresión">
              🧾 Recibo
            </button>
            <button type="button" class="button btn-edit-cobro" data-id="${cobro.id}" data-variant="ghost" data-size="sm" style="font-size: 0.68rem; padding: 1px 6px; height: 22px;" title="Editar este pago">
              ✏️ Editar
            </button>
            <button type="button" class="button btn-delete-cobro" data-id="${cobro.id}" data-variant="ghost" data-size="sm" style="font-size: 0.68rem; padding: 1px 6px; height: 22px; color: #ef4444;" title="Eliminar este pago">
              🗑️
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  /**
   * Prepara el formulario para registrar un NUEVO cobro (otro pago asociado a la cita)
   */
  async startNewCobro() {
    this.editingCobroId = null;

    $('#cobro-id').value = '';
    $('#cobro-monto-usd').value = '';
    const metodoSelect = $('#cobro-metodo-pago');
    if (metodoSelect) metodoSelect.value = 'Efectivo Divisas';
    $('#cobro-referencia').value = '';

    const today = new Date().toISOString().split('T')[0];
    const fechaInput = $('#cobro-fecha-pago');
    if (fechaInput) fechaInput.value = today;

    const count = (this.currentCobros || []).length;
    const modeBadge = $('#cobro-form-mode-badge');
    const modeTitle = $('#cobro-form-mode-title');
    const cancelEditBtn = $('#btn-cancel-edit-cobro');
    const submitBtn = $('#btn-submit-cobro');

    if (modeBadge) {
      modeBadge.textContent = count > 0 ? '➕ OTRO PAGO' : '➕ NUEVO PAGO';
      modeBadge.setAttribute('data-paint', 'success');
    }
    if (modeTitle) {
      modeTitle.textContent = count > 0 
        ? `Registrar pago adicional #${count + 1} para esta cita` 
        : 'Registrar pago inicial para esta cita';
    }
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    if (submitBtn) submitBtn.textContent = '💾 Guardar Pago';

    // Recargar tasa del día actual
    await this.refreshTasaCobro();
    this.recalculateCobroBs();
    this.renderCobrosList();

    const montoInput = $('#cobro-monto-usd');
    if (montoInput) montoInput.focus();
  },

  /**
   * Carga un cobro existente en el formulario para editarlo
   * @param {number|string} cobroId
   */
  editCobro(cobroId) {
    const cobro = (this.currentCobros || []).find(c => Number(c.id) === Number(cobroId));
    if (!cobro) return;

    this.editingCobroId = Number(cobroId);

    $('#cobro-id').value = cobro.id;
    $('#cobro-monto-usd').value = cobro.monto_cobrado || '';
    const metodoSelect = $('#cobro-metodo-pago');
    if (metodoSelect) {
      metodoSelect.value = cobro.metodo_pago || 'Efectivo Divisas';
    }
    $('#cobro-referencia').value = cobro.referencia || '';

    const fechaInput = $('#cobro-fecha-pago');
    if (fechaInput && cobro.fecha_pago) {
      fechaInput.value = cobro.fecha_pago;
    }

    if (cobro.tasa_cambio) {
      this.currentTasa = Number(cobro.tasa_cambio);
      $('#cobro-tasa-cambio').value = this.currentTasa;
      const tasaDisplay = $('#cobro-tasa-display');
      if (tasaDisplay) {
        tasaDisplay.textContent = `1 USD = ${this.currentTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Bs.`;
      }
    }

    const index = (this.currentCobros || []).findIndex(c => Number(c.id) === Number(cobroId));
    const modeBadge = $('#cobro-form-mode-badge');
    const modeTitle = $('#cobro-form-mode-title');
    const cancelEditBtn = $('#btn-cancel-edit-cobro');
    const submitBtn = $('#btn-submit-cobro');

    if (modeBadge) {
      modeBadge.textContent = `✏️ EDITANDO #${index + 1}`;
      modeBadge.setAttribute('data-paint', 'primary');
    }
    if (modeTitle) {
      modeTitle.textContent = `Modificando pago #${index + 1} ($${Number(cobro.monto_cobrado).toFixed(2)} USD)`;
    }
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.textContent = '💾 Actualizar Pago';

    this.recalculateCobroBs();
    this.renderCobrosList();

    const montoInput = $('#cobro-monto-usd');
    if (montoInput) montoInput.focus();
  },

  /**
   * Elimina un cobro asociado a la cita
   * @param {number|string} cobroId
   */
  async deleteCobro(cobroId) {
    const cobro = (this.currentCobros || []).find(c => Number(c.id) === Number(cobroId));
    if (!cobro) return;

    const montoFormatted = Number(cobro.monto_cobrado || 0).toFixed(2);
    const confirmMsg = `¿Está seguro de eliminar este pago de $${montoFormatted} USD registrado el ${cobro.fecha_pago || ''}?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await cobroModel.delete(cobroId, this.activeCitaId);
      notificationService.success(`Pago de $${montoFormatted} USD eliminado.`);

      // Recargar pagos de la cita
      this.currentCobros = await cobroModel.getAllByCitaId(this.activeCitaId);
      this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;

      // Si se estaba editando este pago, resetear formulario
      if (this.editingCobroId && Number(this.editingCobroId) === Number(cobroId)) {
        await this.startNewCobro();
      } else {
        this.renderCobrosList();
      }

      // Actualizar botón de cobro en modal de cita
      await this.applyEstatusState(true, this.currentCobros);
    } catch (err) {
      console.error('[CitaController] Error eliminando cobro:', err);
      notificationService.show('Error al eliminar el pago: ' + err.message, 'alert');
    }
  },

  /**
   * Cierra el modal de cobro
   */
  closeCobroModal() {
    const dialog = $('#modal-cobro-cita');
    if (dialog && dialog.open) {
      dialog.close();
    }
    this.editingCobroId = null;
  },

  /**
   * Abre la ventana modal para generar, enviar por WhatsApp/Correo o imprimir el recibo de pago
   * @param {number|string|null} cobroId - ID del cobro individual o null para consolidado
   */
  async openRecibo(cobroId = null) {
    if (!this.currentCobros || this.currentCobros.length === 0) {
      notificationService.warning('Primero debe registrar al menos un cobro para poder emitir el recibo de pago.');
      return;
    }

    let cita = this.activeCitaData;
    if (!cita && this.activeCitaId) {
      cita = await citaModel.getById(this.activeCitaId);
      this.activeCitaData = cita;
    }

    let paciente = cita?.paciente;
    if (!paciente && cita?.paciente_id) {
      try {
        paciente = await patientModel.getById(cita.paciente_id);
      } catch (err) {
        console.warn('[CitaController] Error obteniendo paciente para recibo:', err);
      }
    }

    const consultorio = consultorioModel.getActiveConsultorio()
      || authModel.getActiveConsultorio()
      || authModel.getCurrentUser()?.consultorio;

    // Consultar el detalle de la historia médica vinculada a esta cita o paciente
    let historia = null;
    try {
      historia = await historialModel.getByCitaOrPatient(cita?.id, cita?.paciente_id, cita?.fecha);
    } catch (err) {
      console.warn('[CitaController] Error obteniendo historia médica para recibo:', err);
    }

    await reciboService.openReciboModal({
      cita,
      cobroId,
      allCobros: this.currentCobros,
      paciente,
      doctor: cita?.doctor,
      consultorio,
      historia
    });
  },

  /**
   * Consulta la tasa de cambio oficial más reciente de la tabla tasa_cambio
   */
  async refreshTasaCobro() {
    const tasaDisplay = $('#cobro-tasa-display');
    const tasaBadge = $('#cobro-tasa-fecha-badge');
    const tasaInput = $('#cobro-tasa-cambio');

    if (tasaDisplay) tasaDisplay.textContent = 'Consultando tasa...';

    try {
      const latest = await tasaCambioModel.getLatest();
      if (latest && latest.valorUSD) {
        this.currentTasa = Number(latest.valorUSD);
        if (tasaInput) tasaInput.value = this.currentTasa;
        if (tasaDisplay) {
          tasaDisplay.textContent = `1 USD = ${this.currentTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Bs.`;
        }
        if (tasaBadge) {
          tasaBadge.textContent = latest.fecha ? `Oficial: ${latest.fecha}` : 'Tasa del día';
        }
      } else {
        this.currentTasa = 876.80; // Fallback razonable si no hay registro
        if (tasaInput) tasaInput.value = this.currentTasa;
        if (tasaDisplay) {
          tasaDisplay.textContent = `1 USD = ${this.currentTasa.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs. (Estimada)`;
        }
        if (tasaBadge) tasaBadge.textContent = 'Por defecto';
      }
    } catch (err) {
      console.warn('[CitaController] Error obteniendo tasa de cambio:', err);
      this.currentTasa = 876.80;
      if (tasaInput) tasaInput.value = this.currentTasa;
      if (tasaDisplay) tasaDisplay.textContent = `1 USD = ${this.currentTasa} Bs.`;
    }

    this.recalculateCobroBs();
  },

  /**
   * Recalcula y muestra en vivo el valor en Bolívares según el monto en dólares y la tasa del día
   */
  recalculateCobroBs() {
    const montoUsdInput = $('#cobro-monto-usd');
    const bsDisplay = $('#cobro-monto-bs-display');
    const formulaHint = $('#cobro-formula-hint');

    const montoUsd = parseFloat(montoUsdInput?.value || '0');
    const tasa = this.currentTasa || parseFloat($('#cobro-tasa-cambio')?.value || '0');

    if (!isNaN(montoUsd) && montoUsd > 0 && !isNaN(tasa) && tasa > 0) {
      const totalBs = montoUsd * tasa;
      const formattedBs = totalBs.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      if (bsDisplay) bsDisplay.textContent = `${formattedBs} Bs.`;
      if (formulaHint) {
        formulaHint.textContent = `Calculado: $${montoUsd.toFixed(2)} USD × ${tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} Bs./$`;
      }
    } else {
      if (bsDisplay) bsDisplay.textContent = '0,00 Bs.';
      if (formulaHint) {
        formulaHint.textContent = 'Calculado automáticamente: $0.00 × Tasa del día';
      }
    }
  },

  /**
   * Procesa el guardado del cobro en la tabla cobro_cita
   * Permite actualizar un cobro existente o crear un nuevo cobro asociado a la misma cita (n pagos)
   */
  async handleCobroSubmit() {
    const submitBtn = $('#btn-submit-cobro');
    const cobroId = $('#cobro-id')?.value;
    const citaId = $('#cobro-cita-id')?.value;
    const fechaPago = $('#cobro-fecha-pago')?.value;
    const montoUsdStr = $('#cobro-monto-usd')?.value;
    const metodoPago = $('#cobro-metodo-pago')?.value || 'Efectivo Divisas';
    const referencia = $('#cobro-referencia')?.value?.trim();
    const tasa = this.currentTasa || parseFloat($('#cobro-tasa-cambio')?.value || '0');

    if (!citaId) {
      notificationService.show('Error: Identificador de cita no encontrado.', 'alert');
      return;
    }

    if (!fechaPago) {
      notificationService.show('Por favor seleccione la fecha del cobro.', 'warning');
      return;
    }

    const montoUsd = parseFloat(montoUsdStr);
    if (isNaN(montoUsd) || montoUsd <= 0) {
      notificationService.show('Por favor ingresa un monto válido en dólares ($ USD).', 'warning');
      $('#cobro-monto-usd')?.focus();
      return;
    }

    if (!tasa || tasa <= 0) {
      notificationService.show('No se ha detectado una tasa de cambio válida.', 'warning');
      return;
    }

    const totalBs = montoUsd * tasa;
    const formattedBs = totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Guardando pago...';
    }

    try {
      const payload = {
        cita_id: Number(citaId),
        monto_cobrado: montoUsd,
        tasa_cambio: tasa,
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        referencia: referencia || null,
        confirmado: true
      };

      if (cobroId) {
        await cobroModel.update(cobroId, payload);
        notificationService.success(`Pago actualizado: $${montoUsd.toFixed(2)} USD (~${formattedBs} Bs.)`);
      } else {
        await cobroModel.create(payload);
        notificationService.success(`Pago registrado exitosamente: $${montoUsd.toFixed(2)} USD (~${formattedBs} Bs.)`);
      }

      // Recargar todos los pagos de la cita
      this.currentCobros = await cobroModel.getAllByCitaId(citaId);
      this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;

      // Actualizar botón de cobro en ventana de cita
      await this.applyEstatusState(true, this.currentCobros);

      // Limpiar formulario y dejarlo listo para incluir OTRO pago
      await this.startNewCobro();
    } catch (err) {
      console.error('[CitaController] Error guardando cobro:', err);
      notificationService.show(`Error al registrar cobro: ${err.message}`, 'alert');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  },

  /**
   * Actualiza la visibilidad de los botones de acceso al Historial Médico
   */
  updateHistorialBtnVisibility() {
    const pacienteId = $('#cita-paciente')?.value;
    const wrap = $('#cita-patient-historial-wrap');
    const footerHistBtn = $('#btn-cita-footer-historial');
    const footerOdoBtn = $('#btn-cita-footer-odontograma');
    const isVisible = Boolean(pacienteId);

    if (wrap) wrap.style.display = isVisible ? 'block' : 'none';
    if (footerHistBtn) footerHistBtn.style.display = isVisible ? 'inline-flex' : 'none';
    if (footerOdoBtn) footerOdoBtn.style.display = isVisible ? 'inline-flex' : 'none';
  },

  /**
   * Carga los pacientes y doctores en los selects del formulario
   */
  async populateSelects(selectedPacienteId = null, selectedDoctorId = null) {
    const pacienteSelect = $('#cita-paciente');
    const doctorSelect = $('#cita-doctor');

    const activeSede = consultorioModel.getActiveConsultorio()
      || authModel.getActiveConsultorio()
      || authModel.getCurrentUser()?.consultorio;

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
        const doctores = await adminModel.getDoctores(activeSede?.id);
        if (doctores && doctores.length > 0) {
          doctorSelect.innerHTML = '<option value="" disabled ' + (!selectedDoctorId ? 'selected' : '') + '>Seleccione un doctor registrado...</option>' +
            doctores.map(d => `
              <option value="${d.id}" ${selectedDoctorId == d.id ? 'selected' : ''}>
                ${d.nombre} ${d.consultorio?.nombre ? `[${d.consultorio.nombre}]` : ''}
              </option>
            `).join('');
        } else {
          doctorSelect.innerHTML = '<option value="" disabled selected>No hay doctores registrados en este consultorio</option>';
        }
      } catch (err) {
        console.warn('[CitaController] Error listando doctores:', err);
        doctorSelect.innerHTML = '<option value="" disabled selected>Error al cargar lista de doctores</option>';
      }
    }
  },

  /**
   * Procesa el envío del formulario de la Cita
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

    // Si la cita ya está en estatus ATENDIDO en la base de datos, no puede ser alterada
    if (id && this.activeCitaData && isCitaAtendida(this.activeCitaData.estatus)) {
      notificationService.warning('Esta cita ya se encuentra en estatus ATENDIDO y no puede ser alterada.');
      return;
    }

    if (id) {
      // Re-verificar contra base de datos para máxima integridad
      const currentDb = await citaModel.getById(parseInt(id, 10));
      if (currentDb && isCitaAtendida(currentDb.estatus)) {
        notificationService.warning('Esta cita ya se encuentra en estatus ATENDIDO y no puede ser alterada.');
        this.activeCitaData = currentDb;
        await this.applyEstatusState(true, this.currentCobros || this.currentCobro, 'ATENDIDO');
        return;
      }
    }

    const submitBtn = $('#btn-submit-cita');
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '⏳ Guardando...';
    }

    try {
      const activeConsultorio = consultorioModel.getActiveConsultorio()
        || authModel.getActiveConsultorio()
        || authModel.getCurrentUser()?.consultorio;
      const consultorio_id = activeConsultorio?.id ? Number(activeConsultorio.id) : null;

      const estatusRaw = $('#cita-estatus')?.value;
      const estatus = normalizeCitaEstatus(estatusRaw);

      const payload = {
        paciente_id: parseInt(pacienteId, 10),
        doctor_id: parseInt(doctorId, 10),
        fecha,
        hora_desde: horaDesde.length === 5 ? `${horaDesde}:00` : horaDesde,
        hora_hasta: horaHasta.length === 5 ? `${horaHasta}:00` : horaHasta,
        observacion: observacion || null,
        estatus,
        consultorio_id
      };

      if (id) {
        await citaModel.update(parseInt(id, 10), payload);
        notificationService.show('✅ Cita actualizada exitosamente.', 'success');
        
        // Si el usuario marcó la cita como ATENDIDO al actualizar, actualizar estado local
        if (isCitaAtendida(estatus)) {
          this.activeCitaData = { ...this.activeCitaData, ...payload, estatus: 'ATENDIDO' };
          const existingCobros = await cobroModel.getAllByCitaId(id);
          this.currentCobros = existingCobros || [];
          this.currentCobro = this.currentCobros.length > 0 ? this.currentCobros[0] : null;
          await this.applyEstatusState(true, this.currentCobros, 'ATENDIDO');
        }
      } else {
        const createdCita = await citaModel.create(payload);
        notificationService.show('✅ Cita agendada exitosamente en el calendario.', 'success');
        if (createdCita?.id) {
          this.activeCitaId = createdCita.id;
          this.activeCitaData = createdCita;
        }
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

    // Si la cita ya está en estatus ATENDIDO, no puede ser eliminada
    if (this.activeCitaData && isCitaAtendida(this.activeCitaData.estatus)) {
      notificationService.warning('Una cita con estatus ATENDIDO no puede ser eliminada.');
      return;
    }

    if (this.activeCitaId) {
      const currentDb = await citaModel.getById(this.activeCitaId);
      if (currentDb && isCitaAtendida(currentDb.estatus)) {
        notificationService.warning('Una cita con estatus ATENDIDO no puede ser eliminada.');
        this.activeCitaData = currentDb;
        await this.applyEstatusState(true, this.currentCobro, 'ATENDIDO');
        return;
      }
    }

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
