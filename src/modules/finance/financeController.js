/**
 * Controlador del Panel Financiero
 * Módulo: Panel Financiero
 * ODONTOKRIS - Sistema Odontológico
 */

import { financeModel } from './financeModel.js';
import {
  renderDashboardTab,
  renderCobrosTab,
  renderTratamientosTab,
  renderDoctoresTab
} from './financeView.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { notificationService } from '../../services/notificationService.js';
import { calendarController } from '../calendar/calendarController.js';
import { $, $$ } from '../../utils/dom.js';

export const financeController = {
  currentMetrics: null,
  activeTab: 'dashboard',
  isPanelOpen: false,

  /**
   * Inicializa el controlador del Panel Financiero y escucha eventos
   */
  init() {
    this.attachEventListeners();
  },

  /**
   * Vincula los listeners de interacción de usuario
   */
  attachEventListeners() {
    // 1. Clic en botón "Panel Financiero" de la barra superior de acciones
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#btn-quick-finance');
      if (btn) {
        e.preventDefault();
        if (this.isPanelOpen) {
          this.showCalendar();
        } else {
          this.showFinancePanel();
        }
      }
    });

    // 2. Clic en botón "Ver Calendario" para regresar al calendario
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-finance-back-calendar')) {
        e.preventDefault();
        this.showCalendar();
      }
    });

    // 3. Cambio de pestañas dentro del Panel Financiero
    document.addEventListener('click', (e) => {
      const tabBtn = e.target.closest('.btn-finance-tab');
      if (tabBtn) {
        const targetTab = tabBtn.dataset.tab;
        if (targetTab) {
          this.switchTab(targetTab);
        }
      }
    });

    // 4. Cambio de filtros (Periodo y Sede)
    document.addEventListener('change', async (e) => {
      if (e.target.id === 'finance-filter-period' || e.target.id === 'finance-filter-consultorio') {
        await this.loadAndRender();
      }
    });

    // 5. Botón Refrescar
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-finance-refresh')) {
        notificationService.info('Actualizando métricas financieras...');
        await this.loadAndRender();
        notificationService.success('Métricas financieras actualizadas.');
      }
    });

    // 6. Botón Imprimir / PDF
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-finance-print')) {
        window.print();
      }
    });

    // 7. Buscador dinámico en la tabla de cobros
    document.addEventListener('input', (e) => {
      if (e.target.id === 'finance-search-cobros') {
        const query = e.target.value.toLowerCase().trim();
        const rows = $$('.finance-cobro-row');
        rows.forEach(row => {
          const text = row.dataset.search || '';
          row.style.display = text.includes(query) ? '' : 'none';
        });
      }
    });

    // 8. Eventos del sistema para auto-refrescar si hay cambios
    window.addEventListener('auth:change', () => {
      if (this.isPanelOpen) this.loadAndRender();
    });
    window.addEventListener('consultorio:changed', () => {
      if (this.isPanelOpen) this.loadAndRender();
    });
    window.addEventListener('cobro:saved', () => {
      if (this.isPanelOpen) this.loadAndRender();
    });
    window.addEventListener('cita:saved', () => {
      if (this.isPanelOpen) this.loadAndRender();
    });
  },

  /**
   * Cambia a la vista del Panel Financiero ocultando el calendario
   */
  async showFinancePanel() {
    const calendarMain = $('#content');
    const financeMain = $('#finance-main-section');
    const quickFinanceBtn = $('#btn-quick-finance');

    if (!financeMain) return;

    this.isPanelOpen = true;

    // 1. Ocultar el calendario principal
    if (calendarMain) {
      calendarMain.style.display = 'none';
    }

    // 2. Mostrar la sección del Panel Financiero
    financeMain.style.display = 'flex';

    // 3. Actualizar estado visual del botón en la barra superior
    if (quickFinanceBtn) {
      quickFinanceBtn.removeAttribute('data-variant');
      quickFinanceBtn.setAttribute('data-paint', 'primary');
      quickFinanceBtn.classList.add('is-active-view');
      quickFinanceBtn.title = 'Panel Financiero Activo (Clic para volver al Calendario)';
    }

    // 4. Cargar y renderizar las métricas
    await this.loadAndRender();

    // 5. Scroll suave a la cabecera
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Regresa a la vista del Calendario de Citas
   */
  showCalendar() {
    const calendarMain = $('#content');
    const financeMain = $('#finance-main-section');
    const quickFinanceBtn = $('#btn-quick-finance');

    this.isPanelOpen = false;

    // 1. Ocultar el Panel Financiero
    if (financeMain) {
      financeMain.style.display = 'none';
    }

    // 2. Restaurar el Calendario principal
    if (calendarMain) {
      calendarMain.style.display = '';
    }

    // 3. Restaurar botón a su estado normal
    if (quickFinanceBtn) {
      quickFinanceBtn.removeAttribute('data-paint');
      quickFinanceBtn.setAttribute('data-variant', 'ghost');
      quickFinanceBtn.classList.remove('is-active-view');
      quickFinanceBtn.title = 'Panel Financiero: Dashboard, Ingresos y Métricas Económicas';
    }

    // 4. Refrescar calendario para sincronizar posibles cambios
    try {
      if (calendarController && typeof calendarController.refresh === 'function') {
        calendarController.refresh();
      }
    } catch {
      // Ignorar si no está listo
    }
  },

  /**
   * Cambia entre las pestañas del Panel Financiero
   */
  switchTab(tabName) {
    this.activeTab = tabName;

    // Actualizar botones de pestaña
    $$('.btn-finance-tab').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('is-active');
        btn.setAttribute('data-paint', 'primary');
        btn.removeAttribute('data-variant');
      } else {
        btn.classList.remove('is-active');
        btn.removeAttribute('data-paint');
        btn.setAttribute('data-variant', 'ghost');
      }
    });

    // Mostrar/ocultar contenedores
    const tabs = ['dashboard', 'cobros', 'tratamientos', 'doctores'];
    tabs.forEach(t => {
      const container = $(`#finance-tab-content-${t}`);
      if (container) {
        container.style.display = t === tabName ? (t === 'dashboard' ? 'flex' : 'block') : 'none';
      }
    });
  },

  /**
   * Carga los datos de Supabase y renderiza todas las vistas del panel
   */
  async loadAndRender() {
    const periodSelect = $('#finance-filter-period');
    const consultorioSelect = $('#finance-filter-consultorio');

    const period = periodSelect?.value || 'week';
    const consultorioId = consultorioSelect?.value || null;

    try {
      // Mostrar indicador de carga si está en dashboard
      const dashContainer = $('#finance-tab-content-dashboard');
      if (dashContainer && !this.currentMetrics) {
        dashContainer.innerHTML = `
          <div class="finance-loading-box box" style="text-align: center; padding: 2.5rem 1rem;">
            <span class="spinner" data-size="md"></span>
            <p style="margin-top: 0.5rem; font-size: 0.88rem; opacity: 0.8;">Cargando métricas financieras y estadísticas clínicas...</p>
          </div>
        `;
      }

      // Obtener métricas consolidadas
      const metrics = await financeModel.getMetrics({
        period,
        consultorioId
      });
      this.currentMetrics = metrics;

      // Actualizar opciones de consultorios en el selector si aún no se han poblado
      if (consultorioSelect && consultorioSelect.options.length <= 1) {
        const activeSede = consultorioModel.getActiveConsultorio();
        consultorioSelect.innerHTML = '<option value="">Todas las Sedes</option>';
        (metrics.consultorios || []).forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = c.nombre;
          if (activeSede && String(c.id) === String(activeSede.id)) {
            opt.selected = true;
          }
          consultorioSelect.appendChild(opt);
        });
      }

      // Inyectar HTML en cada una de las 4 pestañas
      if (dashContainer) {
        dashContainer.innerHTML = renderDashboardTab(metrics);
      }

      const cobrosContainer = $('#finance-tab-content-cobros');
      if (cobrosContainer) {
        cobrosContainer.innerHTML = renderCobrosTab(metrics);
      }

      const tratamientosContainer = $('#finance-tab-content-tratamientos');
      if (tratamientosContainer) {
        tratamientosContainer.innerHTML = renderTratamientosTab(metrics);
      }

      const doctoresContainer = $('#finance-tab-content-doctores');
      if (doctoresContainer) {
        doctoresContainer.innerHTML = renderDoctoresTab(metrics);
      }

      // Mantener la pestaña activa
      this.switchTab(this.activeTab);

    } catch (err) {
      console.error('[FinanceController] Error cargando métricas:', err);
      notificationService.error('Ocurrió un error al cargar las métricas financieras.');
    }
  }
};
