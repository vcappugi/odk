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
import { authModel } from '../auth/authModel.js';
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
    this.syncConsultorioFilter();
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

    // 4. Cambio de filtros (Periodo)
    document.addEventListener('change', async (e) => {
      if (e.target.id === 'finance-filter-period') {
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
      this.syncConsultorioFilter();
      if (this.isPanelOpen) this.loadAndRender();
    });
    window.addEventListener('consultorio:changed', () => {
      this.syncConsultorioFilter();
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
   * Obtiene la sede o consultorio de la sesión activa del usuario
   */
  getLoggedInConsultorio() {
    let sede = consultorioModel.getActiveConsultorio() || authModel.getActiveConsultorio();
    if (!sede) {
      const user = authModel.getCurrentUser();
      if (user?.consultorio) {
        sede = user.consultorio;
      } else if (user?.consultorio_id) {
        sede = {
          id: user.consultorio_id,
          nombre: user.consultorio_nombre || `Sede #${user.consultorio_id}`
        };
      }
    }
    return sede;
  },

  /**
   * Sincroniza el selector para que ÚNICAMENTE muestre el consultorio por el que se logueó el usuario
   */
  syncConsultorioFilter(consultoriosList = []) {
    const consultorioSelect = $('#finance-filter-consultorio');
    if (!consultorioSelect) return;

    let activeSede = this.getLoggedInConsultorio();
    if (activeSede && activeSede.id) {
      if (!activeSede.nombre || activeSede.nombre.includes('Sesión') || activeSede.nombre.startsWith('Sede #')) {
        const match = consultoriosList.find(c => String(c.id) === String(activeSede.id));
        if (match && match.nombre) {
          activeSede.nombre = match.nombre;
        }
      }
      consultorioSelect.innerHTML = `<option value="${activeSede.id}" selected>🔒 🏥 ${activeSede.nombre}</option>`;
      consultorioSelect.title = `Filtro fijado al consultorio de la sesión: ${activeSede.nombre}`;
    } else {
      consultorioSelect.innerHTML = `<option value="" selected>🔒 🏥 Sede de la Sesión</option>`;
      consultorioSelect.title = 'Filtro fijado al consultorio de la sesión actual';
    }
    consultorioSelect.disabled = true;
  },

  /**
   * Carga los datos de Supabase y renderiza todas las vistas del panel
   */
  async loadAndRender() {
    const periodSelect = $('#finance-filter-period');
    const period = periodSelect?.value || 'week';

    const activeSede = this.getLoggedInConsultorio();
    const consultorioId = activeSede?.id || null;

    // Asegurar que el selector muestre únicamente el consultorio de la sesión
    this.syncConsultorioFilter();

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

      // Obtener métricas consolidadas filtradas estrictamente por el consultorio de la sesión
      const metrics = await financeModel.getMetrics({
        period,
        consultorioId
      });
      this.currentMetrics = metrics;

      // Si los consultorios vinieron de la BD, sincronizar nombre de sede en el selector
      if (metrics.consultorios && metrics.consultorios.length > 0) {
        this.syncConsultorioFilter(metrics.consultorios);
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
