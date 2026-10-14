/**
 * Controlador de Gestión de Pacientes (CRUD Completo)
 * Maneja eventos de la interfaz, llamadas a patientModel, consultorioModel,
 * integración con Google Drive para fotos y feedback al usuario.
 */

import { patientModel } from './patientModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { googleDriveService, GOOGLE_DRIVE_CONFIG } from '../../services/googleDriveService.js';
import { renderPatientTableRow, renderEmptyPatientsState } from './patientView.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { historialController } from '../historial/historialController.js';
import { odontogramaController } from '../odontograma/odontogramaController.js';
import { patientPrintService } from './patientPrintService.js';
import { $ } from '../../utils/dom.js';

export const patientController = {
  patientsList: [],
  consultoriosList: [],
  isLoading: false,
  pendingDeleteId: null,
  pendingDeleteName: '',
  selectedPhotoFile: null,
  isUploadingPhoto: false,

  init() {
    this.attachEventListeners();
    this.populateConsultoriosSelect();

    // Escuchar cambio de sede activa para refrescar inmediatamente la lista de pacientes y el campo consultorio
    consultorioModel.subscribe((newConsultorio) => {
      console.log('🏢 [PatientController] Filtrando por nueva sede:', newConsultorio?.nombre);
      this.populateConsultoriosSelect();
      this.loadPatients();
    });

    window.addEventListener('auth:change', () => {
      this.populateConsultoriosSelect();
      this.loadPatients();
    });
  },

  attachEventListeners() {
    // 1. Abrir modal principal de Gestión de Pacientes
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-quick-patient') || e.target.closest('#btn-quick-client')) {
        this.openManagementModal();
      }
    });

    // 2. Botón recargar listado
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-refresh-patients')) {
        this.loadPatients();
      }
    });

    // 3. Botón para abrir modal de creación
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-create-patient')) {
        this.openCreateForm();
      }
    });

    // 4. Botón editar paciente en la fila
    document.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit-patient');
      if (editBtn) {
        const id = editBtn.dataset.id;
        this.openEditForm(id);
      }
    });

    // 5. Botón eliminar paciente en la fila
    document.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.btn-delete-patient');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const name = deleteBtn.dataset.name || 'este paciente';
        this.handleDeletePatient(id, name);
      }
    });

    // 5b. Botón abrir historial médico desde la fila del paciente
    document.addEventListener('click', (e) => {
      const histRowBtn = e.target.closest('.btn-patient-row-historial');
      if (histRowBtn) {
        const id = histRowBtn.dataset.id;
        const name = histRowBtn.dataset.name || '';
        historialController.openHistorial(id, name);
      }
    });

    // 5c. Botón abrir historial médico desde el modal de edición del paciente
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-patient-open-historial')) {
        const id = $('#patient-field-id')?.value;
        const name = $('#patient-field-name')?.value;
        if (id) {
          historialController.openHistorial(id, name);
        } else {
          notificationService.warning('Primero debe guardar los datos del paciente para crear su historial.');
        }
      }
    });

    // 5d. Botón abrir Odontograma desde la fila del paciente
    document.addEventListener('click', (e) => {
      const odoRowBtn = e.target.closest('.btn-patient-row-odontograma');
      if (odoRowBtn) {
        const id = odoRowBtn.dataset.id;
        const name = odoRowBtn.dataset.name || '';
        odontogramaController.openOdontograma(id, name);
      }
    });

    // 5e. Botón abrir Odontograma desde el modal de edición del paciente
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-patient-open-odontograma')) {
        const id = $('#patient-field-id')?.value;
        const name = $('#patient-field-name')?.value;
        if (id) {
          odontogramaController.openOdontograma(id, name);
        } else {
          notificationService.warning('Primero debe guardar los datos del paciente para abrir su odontograma.');
        }
      }
    });

    // 5f. Botón imprimir ficha clínica en PDF desde el modal de edición
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-patient-print-pdf')) {
        const id = $('#patient-field-id')?.value;
        if (id) {
          patientPrintService.printPatientFicha(id);
        } else {
          notificationService.warning('Primero debe guardar los datos del paciente para generar su ficha PDF.');
        }
      }
    });

    // 5g. Botón imprimir ficha clínica en PDF desde la fila de la tabla
    document.addEventListener('click', (e) => {
      const printBtn = e.target.closest('.btn-patient-row-print');
      if (printBtn) {
        const id = printBtn.dataset.id;
        if (id) {
          patientPrintService.printPatientFicha(id);
        }
      }
    });

    // 6. Cerrar modales
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-patient-form')) {
        this.closeDialog('modal-patient-form');
      }
      if (e.target.closest('.btn-close-drive-config')) {
        this.closeDialog('modal-drive-config');
      }
      if (e.target.closest('.btn-close-confirm')) {
        this.pendingDeleteId = null;
        this.pendingDeleteName = '';
        this.closeDialog('modal-confirm-delete');
      }
      if (e.target.closest('.btn-close-print-preview')) {
        this.closeDialog('modal-patient-print-preview');
      }
      if (e.target.closest('#btn-trigger-print') || e.target.closest('#btn-trigger-print-bottom')) {
        patientPrintService.executePrint();
      }
    });

    // 7. Acción confirmar eliminación de paciente
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-confirm-delete-action')) {
        await this.executeDelete();
      }
    });

    // 8. Buscador en vivo
    const searchInput = $('#patient-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterPatients(e.target.value.toLowerCase().trim());
      });
    }

    // 9. Abrir carpeta de Google Drive
    document.addEventListener('click', (e) => {
      if (
        e.target.closest('#btn-quick-open-drive') ||
        e.target.closest('#btn-open-drive-folder-modal')
      ) {
        googleDriveService.openDriveFolder();
      }
    });

    // 10. Abrir modal de configuración del Webhook de Drive
    document.addEventListener('click', (e) => {
      if (
        e.target.closest('#btn-open-drive-config') ||
        e.target.closest('#btn-patient-configure-drive')
      ) {
        this.openDriveConfigModal();
      }
    });

    // 11. Guardar configuración del Webhook
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-save-drive-config')) {
        this.saveDriveConfig();
      }
    });

    // 11b. Probar conexión del Webhook
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-test-drive-config')) {
        await this.handleTestDriveConfig();
      }
    });

    // 12. Copiar código de Google Apps Script
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-copy-apps-script')) {
        this.copyAppsScriptCode();
      }
    });

    // 13. Ir a Google Apps Script
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-open-apps-script-site')) {
        window.open('https://script.google.com/home', '_blank', 'noopener,noreferrer');
      }
    });

    // 14. Abrir selector de archivos al pulsar el botón "Seleccionar Foto"
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-pick-photo-file')) {
        e.preventDefault();
        const fi = $('#patient-photo-file-input');
        if (fi) {
          fi.value = ''; // Permite seleccionar el mismo archivo si el usuario reintenta
          fi.click();
        }
      }
    });

    // 15. Manejar evento de selección de archivo de imagen (delegado)
    document.addEventListener('change', async (e) => {
      if (e.target && e.target.id === 'patient-photo-file-input') {
        const file = e.target.files && e.target.files[0];
        if (file) {
          await this.handlePhotoFileSelected(file);
        }
      }
    });

    // 16. Botón manual de "Subir a Drive"
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-upload-photo-drive')) {
        await this.handleUploadPhotoToDrive();
      }
    });

    // 17. Quitar foto seleccionada
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-remove-photo')) {
        this.clearPhotoSelection();
      }
    });

    // 18. Actualización en tiempo real al escribir en el campo URL de Foto
    const photoUrlInput = $('#patient-field-foto');
    if (photoUrlInput) {
      photoUrlInput.addEventListener('input', (e) => {
        this.updatePreviewFromUrl(e.target.value.trim());
      });
    }

    // 19. Cambio en Fecha de Nacimiento (calcular edad automáticamente)
    const birthdateInput = $('#patient-field-birthdate');
    if (birthdateInput) {
      birthdateInput.addEventListener('input', (e) => {
        this.updateAgeBadge(e.target.value);
      });
    }

    // 20. Envío del formulario (Crear o Modificar)
    const form = $('#form-patient');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleFormSubmit();
      });
    }
  },

  /**
   * Carga los consultorios y asegura la fijación del consultorio activo
   */
  async loadConsultorios() {
    this.populateConsultoriosSelect();
  },

  /**
   * Abre el modal principal y carga los datos desde Supabase
   */
  async openManagementModal() {
    if (!permissionService.canRead('modal-patient-form')) {
      notificationService.warning('Tu rol no tiene permiso para consultar el módulo de pacientes.');
      return;
    }
    this.openDialog('modal-manage-patients');
    await this.loadPatients();

    // Controlar visibilidad del botón para crear pacientes según permiso de escritura
    const btnCreate = $('#btn-open-create-patient');
    if (btnCreate) {
      btnCreate.style.display = permissionService.canWrite('modal-patient-form') ? 'inline-flex' : 'none';
    }
  },

  /**
   * Carga exclusivamente el consultorio con el que se logueó el usuario en el formulario de paciente
   * y lo mantiene bloqueado para no permitir ningún otro consultorio.
   */
  populateConsultoriosSelect() {
    const select = $('#patient-field-consultorio');
    if (!select) return;

    const activeConsultorio = consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio() 
      || authModel.getCurrentUser()?.consultorio;
    
    const activeId = activeConsultorio?.id ? String(activeConsultorio.id) : '';

    if (activeConsultorio && activeId) {
      select.innerHTML = `<option value="${activeId}" selected>🏢 ${activeConsultorio.nombre} (Sede de la sesión activa)</option>`;
      select.value = activeId;
      select.disabled = true;
    } else {
      select.innerHTML = `<option value="" disabled selected>No hay sede activa en la sesión</option>`;
      select.disabled = true;
    }

    const hint = $('#patient-consultorio-hint');
    if (hint && activeConsultorio) {
      hint.textContent = `🔒 Sede fijada al consultorio de la sesión: ${activeConsultorio.nombre}`;
    }
  },

  /**
   * Consulta Supabase y actualiza la tabla
   */
  async loadPatients() {
    const tbody = $('#patients-table-body');
    const countLabel = $('#patients-count-label');
    const activeConsultorio = consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio() 
      || authModel.getCurrentUser()?.consultorio;
    const consultorioId = activeConsultorio?.id ? Number(activeConsultorio.id) : null;

    this.isLoading = true;
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="table-loading-cell" style="text-align: center; padding: 2rem;">
            <span>🔄 Cargando pacientes desde Supabase...</span>
          </td>
        </tr>
      `;
    }

    try {
      this.patientsList = await patientModel.getAll(consultorioId);
      this.renderTable(this.patientsList);

      if (countLabel) {
        const sedeText = activeConsultorio ? ` · 🏢 Sede: ${activeConsultorio.nombre}` : '';
        countLabel.textContent = `${this.patientsList.length} ${this.patientsList.length === 1 ? 'paciente' : 'pacientes'}${sedeText}`;
      }
    } catch (err) {
      console.error('[PatientController] Error al cargar pacientes:', err);
      notificationService.error('Error al conectar con la lista de pacientes.');
      if (tbody) {
        tbody.innerHTML = renderEmptyPatientsState(false);
      }
      if (countLabel) {
        countLabel.textContent = 'Error al cargar';
      }
    } finally {
      this.isLoading = false;
    }
  },

  /**
   * Renderiza el cuerpo de la tabla
   */
  renderTable(list, isSearch = false) {
    const tbody = $('#patients-table-body');
    if (!tbody) return;

    if (!list || list.length === 0) {
      tbody.innerHTML = renderEmptyPatientsState(isSearch);
      return;
    }

    tbody.innerHTML = list.map(p => renderPatientTableRow(p)).join('');

    // Si no tiene permiso de escritura, ocultar botones de eliminar y deshabilitar edición destructiva
    const canWrite = permissionService.canWrite('modal-patient-form');
    if (!canWrite) {
      tbody.querySelectorAll('.btn-delete-patient').forEach(btn => {
        btn.style.display = 'none';
      });
    }
  },

  /**
   * Filtra los pacientes en memoria según el texto de búsqueda
   */
  filterPatients(query) {
    if (!query) {
      this.renderTable(this.patientsList, false);
      return;
    }

    const filtered = this.patientsList.filter(p => {
      const name = (p.nombre || '').toLowerCase();
      const ci = (p.ci || '').toLowerCase();
      const phone = (p.telefono || '').toLowerCase();
      const mail = (p.mail || '').toLowerCase();
      const consultorio = String(p.consultorio_id || '');
      return (
        name.includes(query) ||
        ci.includes(query) ||
        phone.includes(query) ||
        mail.includes(query) ||
        consultorio.includes(query)
      );
    });

    this.renderTable(filtered, true);
  },

  /**
   * Abre el formulario en modo CREAR
   */
  openCreateForm() {
    const canWritePatient = permissionService.canWrite('modal-patient-form');
    const canWriteCita = permissionService.canWrite('modal-cita');

    if (!canWritePatient && !canWriteCita) {
      notificationService.warning('Tu rol no tiene permiso para registrar nuevos pacientes.');
      return;
    }

    const form = $('#form-patient');
    if (form) {
      form.reset();
      form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = false);
    }

    const idField = $('#patient-field-id');
    if (idField) idField.value = '';

    const title = $('#patient-form-title');
    if (title) title.textContent = 'Nuevo Paciente';

    const icon = $('#patient-form-icon');
    if (icon) icon.textContent = '➕';

    const submitBtn = $('#btn-submit-patient-form');
    if (submitBtn) {
      submitBtn.style.display = 'inline-flex';
      submitBtn.textContent = 'Guardar Paciente';
    }

    // Limpiar foto, previsualización y badges
    this.clearPhotoSelection();
    this.updateAgeBadge('');
    this.populateConsultoriosSelect();

    // En modo creación ocultar acceso a historial, odontograma y ficha PDF
    const btnHistorial = $('#btn-patient-open-historial');
    if (btnHistorial) btnHistorial.style.display = 'none';
    const btnOdonto = $('#btn-patient-open-odontograma');
    if (btnOdonto) btnOdonto.style.display = 'none';
    const btnPrint = $('#btn-patient-print-pdf');
    if (btnPrint) btnPrint.style.display = 'none';

    this.openDialog('modal-patient-form');
  },

  /**
   * Abre el formulario en modo EDITAR (Modificar)
   */
  openEditForm(patientId) {
    if (!permissionService.canRead('modal-patient-form')) {
      notificationService.warning('Tu rol no tiene permiso para consultar datos de pacientes.');
      return;
    }

    const canWrite = permissionService.canWrite('modal-patient-form');

    const patient = this.patientsList.find(p => String(p.id) === String(patientId));
    if (!patient) {
      notificationService.error('Paciente no encontrado.');
      return;
    }

    const idField = $('#patient-field-id');
    const nameInput = $('#patient-field-name');
    const ciInput = $('#patient-field-ci');
    const phoneInput = $('#patient-field-phone');
    const mailInput = $('#patient-field-mail');
    const addressInput = $('#patient-field-address');
    const sexSelect = $('#patient-field-sex');
    const birthdateInput = $('#patient-field-birthdate');
    const fotoInput = $('#patient-field-foto');

    if (idField) idField.value = patient.id;
    if (nameInput) nameInput.value = patient.nombre || '';
    if (ciInput) ciInput.value = patient.ci || '';
    if (phoneInput) phoneInput.value = patient.telefono || '';
    if (mailInput) mailInput.value = patient.mail || '';
    if (addressInput) addressInput.value = patient.direccion || '';
    if (sexSelect) sexSelect.value = patient.sexo || '';

    // Fecha de nacimiento (cortar si viene con timestamp)
    if (birthdateInput) {
      const bDate = patient.fecha_nacimiento ? String(patient.fecha_nacimiento).slice(0, 10) : '';
      birthdateInput.value = bDate;
      this.updateAgeBadge(bDate);
    }

    // Foto
    this.currentLocalPreview = null;
    if (fotoInput) {
      fotoInput.value = patient.foto || '';
    }
    this.updatePreviewFromUrl(patient.foto);

    const title = $('#patient-form-title');
    if (title) title.textContent = canWrite ? 'Modificar Paciente' : 'Consulta de Ficha de Paciente';

    const icon = $('#patient-form-icon');
    if (icon) icon.textContent = canWrite ? '✏️' : '👁️';

    const submitBtn = $('#btn-submit-patient-form');
    if (submitBtn) {
      submitBtn.style.display = canWrite ? 'inline-flex' : 'none';
      submitBtn.textContent = 'Actualizar Datos';
    }

    // Habilitar o deshabilitar inputs
    const form = $('#form-patient');
    if (form) {
      form.querySelectorAll('input, select, textarea').forEach(el => {
        el.disabled = !canWrite;
      });
    }

    // El consultorio debe quedar estrictamente bloqueado con la sede activa del usuario logueado
    this.populateConsultoriosSelect();

    // Mostrar botón de acceso al Historial Médico, Odontograma y Ficha PDF en modo Edición
    const btnHistorial = $('#btn-patient-open-historial');
    if (btnHistorial) {
      btnHistorial.style.display = 'inline-flex';
    }
    const btnOdonto = $('#btn-patient-open-odontograma');
    if (btnOdonto) {
      btnOdonto.style.display = 'inline-flex';
    }
    const btnPrint = $('#btn-patient-print-pdf');
    if (btnPrint) {
      btnPrint.style.display = 'inline-flex';
    }

    this.openDialog('modal-patient-form');
  },

  /**
   * Maneja la selección local de un archivo de imagen
   */
  async handlePhotoFileSelected(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notificationService.error('El archivo debe ser una imagen válida (.jpg, .png, etc.).');
      return;
    }

    this.selectedPhotoFile = file;

    // 1. Previsualización instantánea en memoria (0 milisegundos mediante URL.createObjectURL)
    try {
      const objectUrl = URL.createObjectURL(file);
      this.currentLocalPreview = objectUrl;
      this.setPreviewImage(objectUrl);
    } catch (err) {
      console.warn('[PatientController] Error creando objectURL:', err);
    }

    // 2. Subir imagen a Google Drive
    try {
      await this.handleUploadPhotoToDrive();
    } catch (err) {
      console.error('[PatientController] Error procesando foto:', err);
    }
  },

  /**
   * Ejecuta la subida de la imagen seleccionada a Google Drive
   */
  async handleUploadPhotoToDrive() {
    if (!this.selectedPhotoFile) {
      return;
    }

    const patientName = $('#patient-field-name')?.value.trim() || 'paciente';
    const uploadBtn = $('#btn-upload-photo-drive');
    const spinner = $('#patient-photo-spinner');

    this.isUploadingPhoto = true;
    if (uploadBtn) {
      uploadBtn.disabled = true;
      uploadBtn.textContent = 'Subiendo...';
    }
    if (spinner) spinner.style.display = 'flex';

    try {
      const result = await googleDriveService.uploadImageToDrive(this.selectedPhotoFile, {
        patientName
      });

      // Asignar la URL directa al campo oculto para que quede lista para Supabase
      const fotoInput = $('#patient-field-foto');
      if (fotoInput) {
        fotoInput.value = result.directUrl;
      }

      // Mantener la imagen del paciente visible inmediatamente en el cuadro
      if (this.currentLocalPreview) {
        this.setPreviewImage(this.currentLocalPreview);
      } else {
        this.setPreviewImage(result.directUrl);
      }

      // Limpiar estados y ocultar botón de reintento
      this.setPhotoStatus('', 'info');
      if (uploadBtn) {
        uploadBtn.style.display = 'none';
      }

      this.selectedPhotoFile = null;

    } catch (err) {
      console.error('[PatientController] Error al subir foto a Google Drive:', err);

      // Solo si ocurre un error real mostramos advertencia al usuario
      if (err.isMissingWebhook) {
        this.openDriveConfigModal();
      } else {
        this.setPhotoStatus(`❌ ${err.message}`, 'error');
        notificationService.error(`No se pudo subir a Drive: ${err.message}`);
      }

      if (uploadBtn) {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Reintentar Subida';
        uploadBtn.style.display = 'inline-flex';
      }

    } finally {
      this.isUploadingPhoto = false;
      if (spinner) spinner.style.display = 'none';
    }
  },

  /**
   * Actualiza la previsualización al ingresar una URL de imagen o de Google Drive
   */
  updatePreviewFromUrl(url) {
    if (!url) {
      this.setPreviewImage(null);
      return;
    }

    const directUrl = googleDriveService.formatDriveImageUrl(url);
    this.setPreviewImage(directUrl);

    const removeBtn = $('#btn-remove-photo');
    if (removeBtn) removeBtn.style.display = 'inline-flex';
  },

  /**
   * Establece la fuente de la previsualización del avatar
   */
  setPreviewImage(src) {
    const imgEl = $('#patient-avatar-preview-img');
    const placeholderEl = $('#patient-avatar-placeholder');

    if (!src) {
      if (imgEl) {
        imgEl.src = '';
        imgEl.style.display = 'none';
      }
      if (placeholderEl) {
        placeholderEl.style.display = 'flex';
      }
      return;
    }

    if (imgEl) {
      imgEl.referrerPolicy = 'no-referrer';
      imgEl.src = src;
      imgEl.style.display = 'block';
      imgEl.onerror = () => {
        // Si teníamos una previsualización local en memoria, mantenerla siempre antes de caer al placeholder
        if (this.currentLocalPreview && imgEl.src !== this.currentLocalPreview) {
          imgEl.src = this.currentLocalPreview;
          imgEl.style.display = 'block';
          if (placeholderEl) placeholderEl.style.display = 'none';
          return;
        }
        // Si falla lh3, intentar thumbnail
        if (src.includes('lh3.googleusercontent.com/d/')) {
          const fallback = googleDriveService.getThumbnailFallbackUrl(src);
          if (fallback && fallback !== src && imgEl.src !== fallback) {
            imgEl.src = fallback;
            imgEl.style.display = 'block';
            if (placeholderEl) placeholderEl.style.display = 'none';
            return;
          }
        }
        imgEl.style.display = 'none';
        if (placeholderEl) placeholderEl.style.display = 'flex';
      };
    }
    if (placeholderEl) {
      placeholderEl.style.display = 'none';
    }
  },

  /**
   * Limpia la foto seleccionada y el campo
   */
  clearPhotoSelection() {
    this.selectedPhotoFile = null;
    this.currentLocalPreview = null;
    const fileInput = $('#patient-photo-file-input');
    if (fileInput) fileInput.value = '';

    const fotoInput = $('#patient-field-foto');
    if (fotoInput) fotoInput.value = '';

    this.setPreviewImage(null);

    const uploadBtn = $('#btn-upload-photo-drive');
    if (uploadBtn) uploadBtn.style.display = 'none';

    const removeBtn = $('#btn-remove-photo');
    if (removeBtn) removeBtn.style.display = 'none';

    this.setPhotoStatus('', 'info');
  },

  /**
   * Muestra mensaje de estado de la foto
   */
  setPhotoStatus(msg, type = 'info') {
    const statusEl = $('#patient-photo-status-msg');
    if (!statusEl) return;

    if (!msg) {
      statusEl.style.display = 'none';
      statusEl.textContent = '';
      return;
    }

    statusEl.style.display = 'block';
    statusEl.innerHTML = typeof msg === 'string' ? msg.replace(/\n/g, '<br>') : msg;

    if (type === 'success') {
      statusEl.style.color = '#10b981';
    } else if (type === 'error') {
      statusEl.style.color = '#ef4444';
    } else if (type === 'warning') {
      statusEl.style.color = '#f59e0b';
    } else {
      statusEl.style.color = 'var(--text-muted, #64748b)';
    }
  },

  /**
   * Calcula y muestra la insignia de edad según la fecha de nacimiento
   */
  updateAgeBadge(dateString) {
    const badge = $('#patient-birthdate-age-badge');
    if (!badge) return;

    if (!dateString) {
      badge.style.display = 'none';
      badge.textContent = '';
      return;
    }

    try {
      const birth = new Date(dateString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }

      if (!isNaN(age) && age >= 0 && age < 125) {
        badge.style.display = 'inline-flex';
        badge.textContent = `${age} ${age === 1 ? 'año' : 'años'}`;
      } else {
        badge.style.display = 'none';
      }
    } catch {
      badge.style.display = 'none';
    }
  },

  /**
   * Abre el modal de configuración del Webhook de Google Drive
   */
  openDriveConfigModal() {
    const input = $('#input-drive-webhook-url');
    if (input) {
      input.value = googleDriveService.getWebhookUrl();
    }
    const feedbackEl = $('#drive-config-test-feedback');
    if (feedbackEl) {
      feedbackEl.style.display = 'none';
      feedbackEl.innerHTML = '';
    }
    this.openDialog('modal-drive-config');
  },

  /**
   * Guarda la URL del Webhook ingresada por el usuario
   */
  saveDriveConfig() {
    const input = $('#input-drive-webhook-url');
    const url = input?.value.trim() || '';

    if (url) {
      const validation = googleDriveService.validateWebhookUrl(url);
      if (!validation.valid) {
        notificationService.error(validation.error);
        const feedbackEl = $('#drive-config-test-feedback');
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.style.background = 'rgba(239, 68, 68, 0.15)';
          feedbackEl.style.color = '#ef4444';
          feedbackEl.innerHTML = `⚠️ <strong>URL no válida:</strong><br>${validation.error.replace(/\n/g, '<br>')}`;
        }
        return;
      }
    }

    googleDriveService.setWebhookUrl(url);

    if (url) {
      notificationService.success('Webhook de Google Drive guardado correctamente.');
    } else {
      notificationService.info('Webhook eliminado. Las subidas quedarán en modo manual.');
    }

    this.closeDialog('modal-drive-config');
  },

  /**
   * Prueba la conectividad con el Webhook de Google Apps Script
   */
  async handleTestDriveConfig() {
    const input = $('#input-drive-webhook-url');
    const feedbackEl = $('#drive-config-test-feedback');
    const testBtn = $('#btn-test-drive-config');
    const url = input?.value.trim() || '';

    if (!url) {
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = 'rgba(239, 68, 68, 0.15)';
        feedbackEl.style.color = '#ef4444';
        feedbackEl.innerHTML = '⚠️ Por favor ingresa primero la URL del Webhook antes de probar la conexión.';
      }
      return;
    }

    if (testBtn) {
      testBtn.disabled = true;
      testBtn.textContent = 'Probando...';
    }

    if (feedbackEl) {
      feedbackEl.style.display = 'block';
      feedbackEl.style.background = 'rgba(2, 132, 199, 0.12)';
      feedbackEl.style.color = '#0284c7';
      feedbackEl.innerHTML = '🔄 Conectando con Google Apps Script...';
    }

    try {
      await googleDriveService.testConnection(url);
      if (feedbackEl) {
        feedbackEl.style.background = 'rgba(16, 185, 129, 0.15)';
        feedbackEl.style.color = '#10b981';
        feedbackEl.innerHTML = '✅ <strong>¡Conexión Exitosa!</strong> El Webhook de Google Apps Script está activo y listo para subir fotos a tu carpeta de Drive.';
      }
      notificationService.success('Conexión con Google Drive verificada con éxito.');
    } catch (err) {
      if (feedbackEl) {
        feedbackEl.style.background = 'rgba(239, 68, 68, 0.12)';
        feedbackEl.style.color = '#ef4444';
        feedbackEl.innerHTML = `<strong>Error de conexión:</strong><br>${err.message.replace(/\n/g, '<br>')}`;
      }
      notificationService.error('Falló la prueba con el Webhook de Google Drive.');
    } finally {
      if (testBtn) {
        testBtn.disabled = false;
        testBtn.textContent = '🧪 Probar Conexión';
      }
    }
  },

  /**
   * Copia el código de Google Apps Script al portapapeles
   */
  async copyAppsScriptCode() {
    try {
      const code = googleDriveService.getAppsScriptTemplate();
      await navigator.clipboard.writeText(code);
      notificationService.success('Código de Google Apps Script copiado al portapapeles.');
    } catch {
      notificationService.info('Copia el código desde el archivo docs/GOOGLE_APPS_SCRIPT_DRIVE.md');
    }
  },

  /**
   * Procesa el guardado (Crear o Actualizar)
   */
  async handleFormSubmit() {
    const idField = $('#patient-field-id');
    const nameInput = $('#patient-field-name');
    const ciInput = $('#patient-field-ci');
    const phoneInput = $('#patient-field-phone');
    const mailInput = $('#patient-field-mail');
    const addressInput = $('#patient-field-address');
    const sexSelect = $('#patient-field-sex');
    const birthdateInput = $('#patient-field-birthdate');
    const consultorioSelect = $('#patient-field-consultorio');
    const fotoInput = $('#patient-field-foto');
    const submitBtn = $('#btn-submit-patient-form');

    const id = idField?.value;
    const nombre = nameInput?.value.trim();
    const ci = ciInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const mail = mailInput?.value.trim() || null;
    const direccion = addressInput?.value.trim() || null;
    const sexo = sexSelect?.value || null;
    const fecha_nacimiento = birthdateInput?.value || null;

    // No permitir otro consultorio que no sea el logueado en la sesión
    const activeConsultorio = consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio() 
      || authModel.getCurrentUser()?.consultorio;

    if (!activeConsultorio?.id) {
      notificationService.error('Debes tener un consultorio activo en la sesión para registrar o modificar un paciente.');
      return;
    }

    const consultorio_id = Number(activeConsultorio.id);

    let foto = fotoInput?.value.trim() || null;

    if (!nombre || !ci || !telefono) {
      notificationService.error('Nombre, Cédula y Teléfono son obligatorios.');
      return;
    }

    // Si el usuario seleccionó un archivo pero no hizo clic en "Subir a Drive", intentar subirlo ahora
    if (this.selectedPhotoFile && !foto) {
      const webhookUrl = googleDriveService.getWebhookUrl();
      if (webhookUrl) {
        try {
          if (submitBtn) submitBtn.textContent = 'Subiendo foto a Drive...';
          const uploadRes = await googleDriveService.uploadImageToDrive(this.selectedPhotoFile, {
            patientName: nombre
          });
          foto = uploadRes.directUrl;
        } catch (err) {
          console.warn('[PatientController] No se pudo subir foto previa a guardar:', err);
          notificationService.error(`No se pudo subir la foto a Drive: ${err.message}`);
        }
      }
    }

    // Si la foto ingresada es un enlace de Google Drive, formatearla para que se visualice correctamente
    if (foto) {
      foto = googleDriveService.formatDriveImageUrl(foto);
    }

    const patientData = {
      nombre,
      ci,
      telefono,
      mail,
      direccion,
      sexo,
      fecha_nacimiento,
      consultorio_id,
      foto
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = id ? 'Actualizando...' : 'Guardando...';
    }

    try {
      if (id) {
        // MODO MODIFICAR
        await patientModel.update(id, patientData);
        notificationService.success(`Paciente "${nombre}" modificado correctamente.`);
      } else {
        // MODO CREAR
        await patientModel.create(patientData);
        notificationService.success(`Paciente "${nombre}" registrado con éxito.`);
      }

      this.closeDialog('modal-patient-form');
      $('#form-patient')?.reset();
      this.clearPhotoSelection();

      // Recargar y actualizar listado
      await this.loadPatients();

    } catch (err) {
      console.error('[PatientController] Error al guardar paciente:', err);
      notificationService.error(`Error al guardar: ${err.message || 'Intente nuevamente'}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = id ? 'Actualizar Datos' : 'Guardar Paciente';
      }
    }
  },

  /**
   * Abre el modal de confirmación para eliminar un paciente
   */
  handleDeletePatient(id, name) {
    this.pendingDeleteId = id;
    this.pendingDeleteName = name;

    const msgEl = $('#confirm-delete-message');
    if (msgEl) {
      msgEl.innerHTML = `¿Estás seguro de que deseas eliminar al paciente <strong>"${name}"</strong>?`;
    }

    this.openDialog('modal-confirm-delete');
  },

  /**
   * Ejecuta la eliminación definitiva tras confirmar en el modal
   */
  async executeDelete() {
    if (!this.pendingDeleteId) return;

    const id = this.pendingDeleteId;
    const name = this.pendingDeleteName;
    const confirmBtn = $('#btn-confirm-delete-action');

    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Eliminando...';
    }

    try {
      await patientModel.delete(id);
      notificationService.success(`Paciente "${name}" eliminado correctamente.`);
      this.closeDialog('modal-confirm-delete');
      this.pendingDeleteId = null;
      this.pendingDeleteName = '';
      await this.loadPatients();
    } catch (err) {
      console.error('[PatientController] Error eliminando paciente:', err);
      notificationService.error(`No se pudo eliminar: ${err.message || 'Error en base de datos'}`);
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Eliminar Definitivamente';
      }
    }
  },

  openDialog(dialogId) {
    const dialog = $(`#${dialogId}`);
    if (!dialog) return;

    try {
      if (dialog.open) {
        if (typeof dialog.close === 'function') {
          dialog.close();
        } else {
          dialog.removeAttribute('open');
        }
      }

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (err) {
      console.warn(`[PatientController] Error abriendo diálogo ${dialogId}:`, err);
      try {
        dialog.setAttribute('open', '');
      } catch (fallbackErr) {
        console.error('[PatientController] Fallback open failed:', fallbackErr);
      }
    }
  },

  closeDialog(dialogId) {
    const dialog = $(`#${dialogId}`);
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  }
};
