/**
 * Controlador del Calendario Odontológico (Calendar Controller)
 * Maneja el estado de fecha, vista (mes/semana/día), navegación y renderizado de citas reales.
 * Gestiona el filtro reactivo por doctor y sincroniza la paleta de colores.
 * Protege la privacidad mostrando 'Ocupado' cuando no se está logueado.
 */
import { calendarView, getDoctorColorMeta } from './calendarView.js';
import { citaModel } from '../cita/citaModel.js';
import { citaController } from '../cita/citaController.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { adminModel } from '../admin/adminModel.js';
import { authModel } from '../auth/authModel.js';
import { authController } from '../auth/authController.js';
import { permissionService } from '../../services/permissionService.js';
import { notificationService } from '../../services/notificationService.js';
import { $, $$ } from '../../utils/dom.js';

let currentDate = new Date();
let viewMode = 'week'; // 'week' predefinido por requerimiento | 'month' | 'day'
const todayDate = new Date();
let cachedCitas = [];
let cachedDoctors = [];
let selectedDoctorId = 'all';

export const calendarController = {
  async init() {
    this.bindEvents();
    this.subscribeToChanges();
    this.updateViewButtons();
    await this.loadData();
    this.render();
  },

  /**
   * Carga tanto las citas como el listado de doctores para el filtro
   */
  async loadData() {
    await Promise.all([
      this.loadCitas(),
      this.loadDoctors()
    ]);
    this.updateDoctorFilterOptions();
    this.updateDoctorLegend();
  },

  /**
   * Carga las citas desde la tabla Supabase 'cita'
   */
  async loadCitas() {
    try {
      const activeSede = consultorioModel.getActiveConsultorio();
      cachedCitas = await citaModel.getAll(activeSede?.id);
    } catch (err) {
      console.warn('[CalendarController] Error cargando citas:', err);
      cachedCitas = [];
    }
  },

  /**
   * Carga los doctores registrados y calcula cuántas citas tiene cada uno
   */
  async loadDoctors() {
    try {
      let docs = await adminModel.getDoctores();
      if (!Array.isArray(docs)) docs = [];

      // Mapear doctores y recolectar si hay doctores adicionales presentes en citas
      const docMap = new Map();
      docs.forEach(d => {
        docMap.set(String(d.id), { ...d, count: 0 });
      });

      // Incluir doctores referenciados en las citas que no estén en la tabla o activos
      cachedCitas.forEach(c => {
        if (c.doctor_id) {
          const sId = String(c.doctor_id);
          if (!docMap.has(sId)) {
            docMap.set(sId, {
              id: c.doctor_id,
              nombre: c.doctor?.nombre || `Doctor #${c.doctor_id}`,
              count: 0
            });
          }
        }
      });

      // Calcular conteo de citas por doctor
      cachedCitas.forEach(c => {
        if (c.doctor_id) {
          const sId = String(c.doctor_id);
          const d = docMap.get(sId);
          if (d) d.count = (d.count || 0) + 1;
        }
      });

      cachedDoctors = Array.from(docMap.values()).sort((a, b) => a.id - b.id);
    } catch (err) {
      console.warn('[CalendarController] Error cargando doctores:', err);
      cachedDoctors = [];
    }
  },

  /**
   * Actualiza las opciones del desplegable de filtro por doctor en la barra superior
   */
  updateDoctorFilterOptions() {
    const select = $('#cal-doctor-filter');
    if (!select) return;

    const unassignedCount = cachedCitas.filter(c => !c.doctor_id).length;

    let optionsHtml = `
      <option value="all" ${selectedDoctorId === 'all' ? 'selected' : ''}>
        👨‍⚕️ Todos los doctores (${cachedCitas.length})
      </option>
    `;

    cachedDoctors.forEach(d => {
      const isSelected = String(selectedDoctorId) === String(d.id) ? 'selected' : '';
      optionsHtml += `
        <option value="${d.id}" ${isSelected}>
          🩺 Dr(a). ${d.nombre} (${d.count || 0})
        </option>
      `;
    });

    if (unassignedCount > 0) {
      const isSelected = selectedDoctorId === 'unassigned' ? 'selected' : '';
      optionsHtml += `
        <option value="unassigned" ${isSelected}>
          ⚠️ Sin doctor asignado (${unassignedCount})
        </option>
      `;
    }

    select.innerHTML = optionsHtml;
  },

  /**
   * Renderiza la leyenda interactiva de colores de los doctores
   */
  updateDoctorLegend() {
    const legendEl = $('#cal-doctor-legend');
    if (!legendEl) return;

    const unassignedCount = cachedCitas.filter(c => !c.doctor_id).length;
    legendEl.innerHTML = calendarView.renderDoctorLegend(
      cachedDoctors,
      selectedDoctorId,
      cachedCitas.length,
      unassignedCount
    );
  },

  /**
   * Aplica un filtro de doctor y refresca la vista
   */
  setDoctorFilter(doctorId) {
    selectedDoctorId = doctorId || 'all';

    // Sincronizar el select
    const select = $('#cal-doctor-filter');
    if (select && select.value !== selectedDoctorId) {
      select.value = selectedDoctorId;
    }

    // Actualizar estado activo en la leyenda
    this.updateDoctorLegend();

    // Renderizar citas filtradas
    this.render();
  },

  /**
   * Devuelve las citas filtradas según el doctor seleccionado
   */
  getFilteredCitas() {
    if (!selectedDoctorId || selectedDoctorId === 'all') {
      return cachedCitas;
    }
    if (selectedDoctorId === 'unassigned') {
      return cachedCitas.filter(c => !c.doctor_id);
    }
    return cachedCitas.filter(c => String(c.doctor_id) === String(selectedDoctorId));
  },

  /**
   * Suscribe a cambios en citas, consultorios o autenticación
   */
  subscribeToChanges() {
    // Cuando se crea, edita o elimina una cita
    citaModel.subscribe(async () => {
      await this.loadData();
      this.render();
    });

    // Cuando el usuario cambia de consultorio / sede activa
    consultorioModel.subscribe(async () => {
      await this.loadData();
      this.render();
    });

    // Cuando cambian los doctores registrados (crear, modificar o eliminar)
    window.addEventListener('doctors:changed', async () => {
      await this.loadData();
      this.render();
    });

    // Cuando el usuario inicia o cierra sesión
    window.addEventListener('auth:change', async (e) => {
      const user = e.detail?.user || authModel.getCurrentUser();
      if (user) {
        await this.loadData();
      }
      this.render();
    });
  },

  bindEvents() {
    // 1. Botón Periodo Anterior
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-prev')) {
        this.navigate(-1);
      }
    });

    // 2. Botón Periodo Siguiente
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-next')) {
        this.navigate(1);
      }
    });

    // 3. Botón Hoy
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-today')) {
        currentDate = new Date();
        this.render();
      }
    });

    // 4. Cambio de vista (Mes / Semana / Día)
    document.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.btn-cal-view');
      if (viewBtn) {
        const mode = viewBtn.getAttribute('data-view');
        if (mode && mode !== viewMode) {
          this.switchView(mode);
        }
      }
    });

    // 5. Cambio en el SELECT de Filtro por Doctor
    document.addEventListener('change', (e) => {
      if (e.target && e.target.id === 'cal-doctor-filter') {
        this.setDoctorFilter(e.target.value);
      }
    });

    // 6. Clic en CHIP de la Leyenda de Doctores
    document.addEventListener('click', (e) => {
      const legendChip = e.target.closest('.legend-chip[data-doctor-id]');
      if (legendChip) {
        e.preventDefault();
        const docId = legendChip.getAttribute('data-doctor-id');
        this.setDoctorFilter(docId);
      }
    });

    // 7. Clic sobre una CITA EXISTENTE -> Abrir modal en modo EDITAR / ELIMINAR (si está autenticado)
    document.addEventListener('click', (e) => {
      const citaTarget = e.target.closest('[data-cita-id]');
      if (citaTarget) {
        e.stopPropagation();

        const currentUser = authModel.getCurrentUser();
        if (!currentUser) {
          notificationService.info('Inicie sesión para ver los detalles del paciente o gestionar las citas.');
          authController.openModal();
          return;
        }

        const citaId = citaTarget.getAttribute('data-cita-id');
        if (citaId) {
          citaController.openEditModal(parseInt(citaId, 10));
        }
      }
    });

    // 8. Clic en botón / número para ir a la vista diaria
    document.addEventListener('click', (e) => {
      const viewDayTarget = e.target.closest('[data-action="view-day"]');
      if (viewDayTarget) {
        e.stopPropagation();
        const dateStr = viewDayTarget.getAttribute('data-date');
        if (dateStr) {
          const [y, m, d] = dateStr.split('-').map(Number);
          currentDate = new Date(y, m - 1, d);
          this.switchView('day');
        }
      }
    });

    // 9. Clic en ESPACIOS VACÍOS DEL CALENDARIO -> Abrir modal para AGREGAR CITA
    document.addEventListener('click', (e) => {
      // Si hizo clic en una cita existente o botón de control, ignorar
      if (e.target.closest('[data-cita-id]')) return;
      if (e.target.closest('.legend-chip')) return;
      if (e.target.closest('#cal-doctor-filter')) return;

      const currentUser = authModel.getCurrentUser();

      // Resolver doctor predeterminado si hay filtro de doctor activo
      const defaultDoctorId = (selectedDoctorId && selectedDoctorId !== 'all' && selectedDoctorId !== 'unassigned')
        ? parseInt(selectedDoctorId, 10)
        : null;

      // Clic explícito en botón o slot de agendar
      const addTrigger = e.target.closest('[data-action="add-cita"], .clickable-empty-slot, .month-cell-empty-hint');
      if (addTrigger) {
        e.stopPropagation();

        if (!currentUser) {
          notificationService.info('Inicie sesión para agendar una cita.');
          authController.openModal();
          return;
        }

        if (!permissionService.canWrite('modal-cita')) {
          notificationService.warning('Tu rol no tiene permiso para agendar citas.');
          return;
        }
        const fecha = addTrigger.getAttribute('data-date');
        const horaDesde = addTrigger.getAttribute('data-time') || '09:00';
        const horaHasta = addTrigger.getAttribute('data-time-end') || '10:00';
        citaController.openCreateModal({ fecha, horaDesde, horaHasta, doctorId: defaultDoctorId });
        return;
      }

      // Clic en el cuerpo de una celda de día (vista mes)
      const dayCell = e.target.closest('.cal-day-cell:not(.is-other-month)');
      if (dayCell) {
        // Si el clic fue en el número de día, ya fue manejado por view-day
        if (e.target.closest('[data-action="view-day"]')) return;

        if (!currentUser) {
          notificationService.info('Inicie sesión para agendar una cita.');
          authController.openModal();
          return;
        }

        if (!permissionService.canWrite('modal-cita')) {
          notificationService.warning('Tu rol no tiene permiso para agendar citas.');
          return;
        }

        const dateStr = dayCell.getAttribute('data-date');
        if (dateStr) {
          citaController.openCreateModal({ fecha: dateStr, horaDesde: '09:00', horaHasta: '10:00', doctorId: defaultDoctorId });
        }
      }
    });
  },

  /**
   * Navega hacia el periodo anterior (-1) o siguiente (+1) según la vista activa
   */
  navigate(direction) {
    const d = new Date(currentDate);

    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + (direction * 7));
    } else if (viewMode === 'day') {
      d.setDate(d.getDate() + direction);
    }

    currentDate = d;
    this.render();
  },

  /**
   * Cambia el modo de visualización (month, week, day)
   */
  switchView(newMode) {
    if (newMode === 'month' && !permissionService.canRead('cal-month')) {
      notificationService.warning('Tu rol no tiene permiso para consultar la vista mensual.');
      return;
    }
    if (newMode === 'week' && !permissionService.canRead('cal-week')) {
      notificationService.warning('Tu rol no tiene permiso para consultar la vista semanal.');
      return;
    }
    if (newMode === 'day' && !permissionService.canRead('cal-day')) {
      notificationService.warning('Tu rol no tiene permiso para consultar la vista diaria.');
      return;
    }

    viewMode = newMode;
    this.updateViewButtons();
    this.render();
  },

  /**
   * Sincroniza el resaltado visual de los botones de vista según el viewMode activo
   */
  updateViewButtons() {
    $$('.btn-cal-view').forEach(btn => {
      const btnView = btn.getAttribute('data-view');
      if (btnView === viewMode) {
        btn.setAttribute('data-paint', 'primary');
        btn.removeAttribute('data-variant');
      } else {
        btn.setAttribute('data-variant', 'ghost');
        btn.removeAttribute('data-paint');
      }
    });
  },

  /**
   * Renderiza el contenido del calendario en el DOM con las citas filtradas.
   * Si no hay sesión activa, omite el renderizado para proteger la vista.
   */
  render() {
    const currentUser = authModel.getCurrentUser();
    const container = $('#cal-view-container');

    if (!currentUser) {
      if (container) container.innerHTML = '';
      return;
    }

    if (!container) return;

    const titleEl = $('#cal-period-title');
    const filteredCitas = this.getFilteredCitas();
    const isAuthenticated = true;

    // 1. Actualizar el título dinámico del periodo
    if (titleEl) {
      const baseTitle = calendarView.getPeriodTitle(currentDate, viewMode);
      if (selectedDoctorId && selectedDoctorId !== 'all') {
        let docName = 'Filtro';
        if (selectedDoctorId === 'unassigned') {
          docName = 'Sin Dr.';
        } else {
          const doc = cachedDoctors.find(d => String(d.id) === String(selectedDoctorId));
          docName = doc?.nombre ? `Dr(a). ${doc.nombre.split(' ')[0]}` : 'Doctor';
        }
        titleEl.innerHTML = `${baseTitle} <span class="cal-filter-active-badge">🩺 ${docName} (${filteredCitas.length})</span>`;
      } else {
        titleEl.textContent = baseTitle;
      }
    }

    // 2. Renderizar la vista correspondiente con las citas filtradas y estado de autenticación
    if (viewMode === 'month') {
      container.innerHTML = calendarView.renderMonthView(currentDate, todayDate, filteredCitas, { isAuthenticated });
    } else if (viewMode === 'week') {
      container.innerHTML = calendarView.renderWeekView(currentDate, todayDate, filteredCitas, { isAuthenticated });
      // Auto-centrar en el día de hoy si estamos en la semana actual
      const todayCol = container.querySelector('.cal-week-col.is-today');
      if (todayCol) {
        requestAnimationFrame(() => {
          todayCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        });
      }
    } else if (viewMode === 'day') {
      container.innerHTML = calendarView.renderDayView(currentDate, todayDate, filteredCitas, { isAuthenticated });
    }
  }
};
