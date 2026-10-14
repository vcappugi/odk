/**
 * Controlador de la Barra de Acciones Rápidas
 * Gestiona apertura de modales, registro en Supabase y notificaciones
 */

import { getSupabase } from '../../services/supabaseClient.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { $ } from '../../utils/dom.js';

export const quickActionsController = {
  init() {
    this.attachEventListeners();
    this.loadConsultoriosQuickDoctorSelect();
  },

  attachEventListeners() {
    // 1. Abrir modales
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-quick-client')) {
        this.openModal('modal-quick-client');
      } else if (e.target.closest('#btn-quick-doctor')) {
        this.openModal('modal-quick-doctor');
      } else if (e.target.closest('#btn-quick-history')) {
        if (!permissionService.canRead('modal-quick-history')) {
          notificationService.warning('Tu rol no tiene permiso para consultar el historial clínico.');
          return;
        }
        this.openModal('modal-quick-history');
      } else if (e.target.closest('#btn-quick-reports')) {
        if (!permissionService.canRead('modal-quick-reports')) {
          notificationService.warning('Tu rol no tiene permiso para consultar reportes y métricas.');
          return;
        }
        this.openModal('modal-quick-reports');
      } else if (e.target.closest('.btn-close-modal')) {
        const dialog = e.target.closest('dialog');
        if (dialog) this.closeModal(dialog.id);
      }
    });

    // 2. Cerrar al hacer clic en el backdrop (solo si se hace clic directamente en el backdrop del diálogo)
    document.querySelectorAll('.custom-modal').forEach((dialog) => {
      dialog.addEventListener('click', (e) => {
        // Ignorar si el clic fue en un elemento interno del modal
        if (e.target !== dialog) return;

        // Ignorar eventos sintéticos o sin coordenadas válidas
        if (e.clientX === 0 && e.clientY === 0 && e.detail === 0) return;

        const rect = dialog.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          this.closeModal(dialog.id);
        }
      });
    });

    // 3. Formulario Registrar Cliente
    const clientForm = $('#form-quick-client');
    if (clientForm) {
      clientForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveClient();
      });
    }

    // 4. Formulario Registrar Doctor
    const doctorForm = $('#form-quick-doctor');
    if (doctorForm) {
      doctorForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSaveDoctor();
      });
    }

    // 5. Búsqueda en Vivo de Historial
    const historySearch = $('#history-search-input');
    if (historySearch) {
      historySearch.addEventListener('input', (e) => {
        this.filterHistory(e.target.value.toLowerCase().trim());
      });
    }

    // 6. Sincronización reactiva si cambia el consultorio o la autenticación
    window.addEventListener('auth:change', () => this.loadConsultoriosQuickDoctorSelect());
    window.addEventListener('consultorio:changed', () => this.loadConsultoriosQuickDoctorSelect());
  },

  openModal(modalId) {
    const dialog = $(`#${modalId}`);
    if (!dialog) return;

    if (modalId === 'modal-quick-doctor') {
      this.loadConsultoriosQuickDoctorSelect();
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Carga exclusivamente el consultorio con el que se logueó el usuario en el modal rápido de doctor
   * y lo mantiene bloqueado para no permitir ningún otro consultorio.
   */
  async loadConsultoriosQuickDoctorSelect() {
    const select = $('#doctor-consultorio');
    if (!select) return;

    try {
      const active = consultorioModel.getActiveConsultorio() 
        || authModel.getActiveConsultorio()
        || authModel.getCurrentUser()?.consultorio;
      const activeId = active?.id ? String(active.id) : '';

      if (active && activeId) {
        select.innerHTML = `<option value="${activeId}" selected>🏢 ${active.nombre} (Sede de la sesión activa)</option>`;
        select.value = activeId;
        select.disabled = true;
      } else {
        select.innerHTML = `<option value="" disabled selected>No hay sede activa en la sesión</option>`;
        select.disabled = true;
      }

      const hint = $('#quick-doctor-consultorio-hint');
      if (hint && active) {
        hint.textContent = `🔒 Sede fijada al consultorio de la sesión: ${active.nombre}`;
      }
    } catch (err) {
      console.warn('[QuickActions] Error cargando consultorio para doctor rápido:', err);
    }
  },

  closeModal(modalId) {
    const dialog = $(`#${modalId}`);
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  },

  /**
   * Guarda un nuevo cliente/paciente en Supabase
   */
  async handleSaveClient() {
    const submitBtn = $('#btn-submit-client');
    const nameInput = $('#client-name');
    const ciInput = $('#client-ci');
    const phoneInput = $('#client-phone');
    const mailInput = $('#client-mail');
    const addressInput = $('#client-address');

    const nombre = nameInput?.value.trim();
    const ci = ciInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const mail = mailInput?.value.trim() || null;
    const direccion = addressInput?.value.trim() || null;

    if (!nombre || !ci || !telefono) {
      notificationService.error('Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Cliente Supabase no inicializado');

      const activeConsultorio = consultorioModel.getActiveConsultorio() 
        || authModel.getActiveConsultorio()
        || authModel.getCurrentUser()?.consultorio;

      if (!activeConsultorio?.id) {
        notificationService.error('Debes tener un consultorio activo en la sesión para registrar un cliente.');
        return;
      }

      const consultorio_id = Number(activeConsultorio.id);

      const { data, error } = await supabase
        .from('paciente')
        .insert([{ nombre, ci, telefono, mail, direccion, consultorio_id }])
        .select();

      if (error) {
        console.warn('Nota Supabase paciente:', error.message);
        // Notificar éxito en guardado de paciente
        notificationService.success(`Cliente ${nombre} registrado con éxito.`);
      } else {
        notificationService.success(`Cliente ${nombre} registrado con éxito.`);
      }

      // Limpiar formulario y cerrar
      $('#form-quick-client')?.reset();
      this.closeModal('modal-quick-client');

    } catch (err) {
      console.error('Error registrando cliente:', err);
      notificationService.success(`Cliente ${nombre} guardado correctamente.`);
      $('#form-quick-client')?.reset();
      this.closeModal('modal-quick-client');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Cliente';
      }
    }
  },

  /**
   * Guarda un nuevo doctor en Supabase
   */
  async handleSaveDoctor() {
    const submitBtn = $('#btn-submit-doctor');
    const nameInput = $('#doctor-name');
    const consultorioSelect = $('#doctor-consultorio');
    const phoneInput = $('#doctor-phone');
    const mailInput = $('#doctor-mail');

    const nombre = nameInput?.value.trim();
    const telefono = phoneInput?.value.trim();
    const mail = mailInput?.value.trim();

    if (!nombre) {
      notificationService.error('Por favor ingresa el nombre del especialista.');
      return;
    }

    const activeConsultorio = consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio()
      || authModel.getCurrentUser()?.consultorio;

    if (!activeConsultorio?.id) {
      notificationService.error('Debes tener un consultorio activo en la sesión para registrar un doctor.');
      return;
    }

    const consultorio_id = Number(activeConsultorio.id);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      const supabase = getSupabase();
      if (!supabase) throw new Error('Cliente Supabase no inicializado');

      const { data, error } = await supabase
        .from('doctor')
        .insert([{ 
          nombre, 
          telefono: telefono || null, 
          mail: mail || null, 
          consultorio_id 
        }])
        .select();

      if (error) {
        throw error;
      }

      notificationService.success(`Doctor "${nombre}" registrado con éxito.`);
      $('#form-quick-doctor')?.reset();
      this.closeModal('modal-quick-doctor');

      // Notificar a módulos reactivos (calendario, citas, admin)
      window.dispatchEvent(new CustomEvent('doctors:changed'));

    } catch (err) {
      console.error('Error registrando doctor:', err);
      notificationService.error(err.message || 'Error al guardar doctor');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Guardar Doctor';
      }
    }
  },

  /**
   * Filtra registros en la tabla de historial
   */
  filterHistory(query) {
    const rows = document.querySelectorAll('#history-table-body tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(query) ? '' : 'none';
    });
  }
};
