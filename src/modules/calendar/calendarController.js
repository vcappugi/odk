/**
 * Controlador del Calendario Odontológico (Calendar Controller)
 * Maneja el estado de fecha, vista (mes/semana/día), navegación y renderizado.
 */
import { calendarView } from './calendarView.js';
import { $, $$ } from '../../utils/dom.js';

let currentDate = new Date();
let viewMode = 'month'; // 'month' | 'week' | 'day'
const todayDate = new Date();

export const calendarController = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // Botón Anterior
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-prev')) {
        this.navigate(-1);
      }
    });

    // Botón Siguiente
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-next')) {
        this.navigate(1);
      }
    });

    // Botón Hoy
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-cal-today')) {
        currentDate = new Date();
        this.render();
      }
    });

    // Cambio de vista (Mes / Semana / Día)
    document.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.btn-cal-view');
      if (viewBtn) {
        const mode = viewBtn.getAttribute('data-view');
        if (mode && mode !== viewMode) {
          this.switchView(mode);
        }
      }
    });

    // Clic en una celda de día (en vista de mes) para abrir la vista por día
    document.addEventListener('click', (e) => {
      const dayCell = e.target.closest('.cal-day-cell:not(.is-other-month)');
      if (dayCell) {
        const dateStr = dayCell.getAttribute('data-date');
        if (dateStr) {
          currentDate = new Date(dateStr);
          this.switchView('day');
        }
      }
    });

    // Clic en una columna de día (en vista de semana) para abrir la vista por día
    document.addEventListener('click', (e) => {
      const weekCol = e.target.closest('.cal-week-col');
      if (weekCol) {
        const dateStr = weekCol.getAttribute('data-date');
        if (dateStr) {
          currentDate = new Date(dateStr);
          this.switchView('day');
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

    // 2. Renderizar la vista correspondiente
    if (viewMode === 'month') {
      container.innerHTML = calendarView.renderMonthView(currentDate, todayDate);
    } else if (viewMode === 'week') {
      container.innerHTML = calendarView.renderWeekView(currentDate, todayDate);
    } else if (viewMode === 'day') {
      container.innerHTML = calendarView.renderDayView(currentDate, todayDate);
    }
  }
};
