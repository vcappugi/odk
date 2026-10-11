/**
 * Controlador del Calendario Odontológico (Calendar Controller)
 * Maneja el estado de fecha, vista (mes/semana/día), navegación y renderizado de citas reales.
 */
import { calendarView } from './calendarView.js';
import { citaModel } from '../cita/citaModel.js';
import { citaController } from '../cita/citaController.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { permissionService } from '../../services/permissionService.js';
import { notificationService } from '../../services/notificationService.js';
import { $, $$ } from '../../utils/dom.js';

let currentDate = new Date();
let viewMode = 'month'; // 'month' | 'week' | 'day'
const todayDate = new Date();
let cachedCitas = [];

export const calendarController = {
  async init() {
    this.bindEvents();
    this.subscribeToChanges();
    await this.loadCitas();
    this.render();
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
   * Suscribe a cambios en citas o consultorios
   */
  subscribeToChanges() {
    // Cuando se crea, edita o elimina una cita
    citaModel.subscribe(async () => {
      await this.loadCitas();
      this.render();
    });

    // Cuando el usuario cambia de consultorio / sede activa
    consultorioModel.subscribe(async () => {
      await this.loadCitas();
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

    // 5. Clic sobre una CITA EXISTENTE -> Abrir modal en modo EDITAR / ELIMINAR
    document.addEventListener('click', (e) => {
      const citaTarget = e.target.closest('[data-cita-id]');
      if (citaTarget) {
        e.stopPropagation();
        const citaId = citaTarget.getAttribute('data-cita-id');
        if (citaId) {
          citaController.openEditModal(parseInt(citaId, 10));
        }
      }
    });

    // 6. Clic en botón / número para ir a la vista diaria
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

    // 7. Clic en ESPACIOS VACÍOS DEL CALENDARIO -> Abrir modal para AGREGAR CITA
    document.addEventListener('click', (e) => {
      // Si hizo clic en una cita existente, ignorar (ya manejado en paso 5)
      if (e.target.closest('[data-cita-id]')) return;

      // Clic explícito en botón o slot de agendar
      const addTrigger = e.target.closest('[data-action="add-cita"], .clickable-empty-slot, .month-cell-empty-hint');
      if (addTrigger) {
        e.stopPropagation();
        if (!permissionService.canWrite('modal-cita')) {
          notificationService.warning('Tu rol no tiene permiso para agendar citas.');
          return;
        }
        const fecha = addTrigger.getAttribute('data-date');
        const horaDesde = addTrigger.getAttribute('data-time') || '09:00';
        const horaHasta = addTrigger.getAttribute('data-time-end') || '10:00';
        citaController.openCreateModal({ fecha, horaDesde, horaHasta });
        return;
      }

      // Clic en el cuerpo de una celda de día (vista mes)
      const dayCell = e.target.closest('.cal-day-cell:not(.is-other-month)');
      if (dayCell) {
        // Si el clic fue en el número de día, ya fue manejado por view-day
        if (e.target.closest('[data-action="view-day"]')) return;

        if (!permissionService.canWrite('modal-cita')) {
          notificationService.warning('Tu rol no tiene permiso para agendar citas.');
          return;
        }

        const dateStr = dayCell.getAttribute('data-date');
        if (dateStr) {
          citaController.openCreateModal({ fecha: dateStr, horaDesde: '09:00', horaHasta: '10:00' });
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

    // Actualizar botones de vista
    $$('.btn-cal-view').forEach(btn => {
      const btnView = btn.getAttribute('data-view');
      if (btnView === newMode) {
        btn.setAttribute('data-paint', 'primary');
        btn.removeAttribute('data-variant');
      } else {
        btn.setAttribute('data-variant', 'ghost');
        btn.removeAttribute('data-paint');
      }
    });

    this.render();
  },

  /**
   * Renderiza el contenido del calendario en el DOM
   */
  render() {
    const titleEl = $('#cal-period-title');
    const container = $('#cal-view-container');

    if (!container) return;

    // 1. Actualizar el título dinámico del periodo
    if (titleEl) {
      titleEl.textContent = calendarView.getPeriodTitle(currentDate, viewMode);
    }

    // 2. Renderizar la vista correspondiente con las citas de la BD
    if (viewMode === 'month') {
      container.innerHTML = calendarView.renderMonthView(currentDate, todayDate, cachedCitas);
    } else if (viewMode === 'week') {
      container.innerHTML = calendarView.renderWeekView(currentDate, todayDate, cachedCitas);
    } else if (viewMode === 'day') {
      container.innerHTML = calendarView.renderDayView(currentDate, todayDate, cachedCitas);
    }
  }
};
