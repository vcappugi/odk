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

    // 6. Botón Imprimir / PDF (Imprime el listado de cobros con Dr. y totales)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-finance-print') || e.target.closest('.btn-print-cobros')) {
        e.preventDefault();
        this.printCobrosList();
      }
    });

    // 7. Buscador dinámico en la tabla de cobros con recálculo dinámico de totales
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('finance-search-cobros-input') || e.target.id === 'finance-search-cobros' || e.target.id === 'finance-search-cobros-dash') {
        const query = e.target.value.toLowerCase().trim();
        const card = e.target.closest('.finance-cobros-card');
        const rows = card ? card.querySelectorAll('.finance-cobro-row') : $$('.finance-cobro-row');
        rows.forEach(row => {
          const text = row.dataset.search || '';
          row.style.display = text.includes(query) ? '' : 'none';
        });
        this.updateVisibleCobrosTotals(card);
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
  },

  /**
   * Recalcula en tiempo real los totales de cobros en pantalla según las filas visibles tras buscar
   */
  updateVisibleCobrosTotals(targetCard = null) {
    const formatUSD = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatBs = (val) => `${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

    const cards = targetCard ? [targetCard] : $$('.finance-cobros-card');
    cards.forEach(card => {
      const rows = card.querySelectorAll('.finance-cobro-row');
      let visibleUSD = 0;
      let visibleBs = 0;
      let visibleCount = 0;

      rows.forEach(r => {
        if (r.style.display !== 'none') {
          visibleUSD += Number(r.dataset.usd) || 0;
          visibleBs += Number(r.dataset.bs) || 0;
          visibleCount++;
        }
      });

      const countEl = card.querySelector('.finance-cobros-count');
      if (countEl) countEl.textContent = visibleCount;

      const usdEl = card.querySelector('.finance-total-usd');
      if (usdEl) usdEl.textContent = formatUSD(visibleUSD);

      const bsEl = card.querySelector('.finance-total-bs');
      if (bsEl) bsEl.textContent = formatBs(visibleBs);

      const headerUsdEl = card.querySelector('.header-total-usd');
      if (headerUsdEl) headerUsdEl.textContent = formatUSD(visibleUSD);

      const headerBsEl = card.querySelector('.header-total-bs');
      if (headerBsEl) headerBsEl.textContent = formatBs(visibleBs);
    });
  },

  /**
   * Imprime mediante iframe silencioso sin alterar el layout principal
   */
  printHtmlDocument(htmlContent) {
    let iframe = document.getElementById('finance-print-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'finance-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('[FinancePrint] Fallback al diálogo nativo de impresión:', err);
        window.print();
      }
    }, 350);
  },

  /**
   * Genera el informe imprimible del registro de cobros con columna de Dr. y totales en USD y Bs.
   */
  printCobrosList() {
    if (!this.currentMetrics) {
      notificationService.warning('No hay datos financieros cargados para imprimir.');
      return;
    }

    const { cobrosDetallados, period, dateRange } = this.currentMetrics;
    const activeSede = this.getLoggedInConsultorio();
    const sedeNombre = activeSede?.nombre || 'Sede Principal';

    let totalUSD = 0;
    let totalBs = 0;
    cobrosDetallados.forEach(c => {
      totalUSD += Number(c.monto_usd) || 0;
      totalBs += Number(c.monto_bs) || 0;
    });

    const formatUSD = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatBs = (val) => `${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

    const periodLabelMap = {
      today: 'El día de hoy (Hoy)',
      week: 'Esta Semana',
      month: 'Este Mes',
      quarter: 'Últimos 3 Meses',
      year: 'Este Año (2026)',
      all: 'Todo el Histórico'
    };
    const periodText = periodLabelMap[period] || period;
    const nowFormatted = new Date().toLocaleString('es-VE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const rowsHtml = cobrosDetallados.length === 0
      ? `<tr><td colspan="7" style="text-align: center; padding: 25px; color: #64748b;">No hay cobros registrados en el periodo seleccionado.</td></tr>`
      : cobrosDetallados.map((c, i) => {
          const docName = c.doctor_nombre ? (c.doctor_nombre.toLowerCase().startsWith('dr') ? c.doctor_nombre : 'Dr(a). ' + c.doctor_nombre) : 'Especialista';
          return `
            <tr>
              <td style="text-align: center; color: #64748b; font-weight: 600;">${i + 1}</td>
              <td style="font-weight: 600;">${c.fecha_pago}</td>
              <td>
                <strong>${c.paciente_nombre}</strong>
                <small style="display: block; color: #64748b; font-size: 9px;">CI: ${c.paciente_ci}</small>
              </td>
              <td><strong>${docName}</strong></td>
              <td>
                <span>${c.metodo_pago || c.metodo}</span>
                ${c.referencia && c.referencia !== 'Sin referencia registrada' ? `<small style="display: block; color: #64748b; font-size: 8.5px;">Ref: ${c.referencia}</small>` : ''}
              </td>
              <td style="text-align: right; color: #059669; font-weight: 700;">${formatUSD(c.monto_usd)}</td>
              <td style="text-align: right; color: #0284c7; font-weight: 700;">${formatBs(c.monto_bs)}</td>
            </tr>
          `;
        }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Reporte de Registro de Cobros · ODONTOKRIS · ${sedeNombre}</title>
        <style>
          @page {
            size: letter landscape;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          body {
            color: #1e293b;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 10.5px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .logo-title h1 {
            margin: 0;
            font-size: 18px;
            color: #0284c7;
            font-weight: 800;
            letter-spacing: -0.3px;
          }
          .logo-title p {
            margin: 3px 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .report-meta {
            text-align: right;
            font-size: 10px;
            color: #334155;
            line-height: 1.45;
          }
          .summary-strip {
            display: flex;
            gap: 12px;
            margin-bottom: 12px;
          }
          .summary-card {
            flex: 1;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 6px 12px;
            background: #f8fafc;
          }
          .summary-card.highlight-usd {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }
          .summary-card.highlight-bs {
            background: #f0f9ff;
            border-color: #bae6fd;
          }
          .summary-card .label {
            font-size: 8.5px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .summary-card .value {
            font-size: 15px;
            font-weight: 800;
            margin-top: 2px;
          }
          .summary-card.highlight-usd .value { color: #059669; }
          .summary-card.highlight-bs .value { color: #0284c7; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
          }
          th, td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-transform: uppercase;
            font-size: 9.5px;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          tfoot td {
            background: #e2e8f0 !important;
            font-weight: 800;
            border-top: 2px solid #0f172a;
            border-bottom: 2px solid #0f172a;
          }
          .footer-note {
            margin-top: 10px;
            font-size: 8.5px;
            color: #94a3b8;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="logo-title">
            <h1>ODONTOKRIS · Sistema Odontológico</h1>
            <p>Registro Detallado de Cobros y Liquidación</p>
          </div>
          <div class="report-meta">
            <div><strong>Sede:</strong> ${sedeNombre}</div>
            <div><strong>Periodo:</strong> ${periodText} (${dateRange.start} al ${dateRange.end})</div>
            <div><strong>Fecha Emisión:</strong> ${nowFormatted}</div>
          </div>
        </header>

        <div class="summary-strip">
          <div class="summary-card">
            <div class="label">Total Transacciones</div>
            <div class="value">${cobrosDetallados.length} cobros</div>
          </div>
          <div class="summary-card highlight-usd">
            <div class="label">Total Facturado en Dólares ($)</div>
            <div class="value">${formatUSD(totalUSD)}</div>
          </div>
          <div class="summary-card highlight-bs">
            <div class="label">Total Facturado en Bolívares (Bs.)</div>
            <div class="value">${formatBs(totalBs)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 4%; text-align: center;">#</th>
              <th style="width: 10%;">Fecha</th>
              <th style="width: 23%;">Paciente</th>
              <th style="width: 20%;">Dr. (Especialista)</th>
              <th style="width: 17%;">Método / Ref.</th>
              <th style="width: 13%; text-align: right;">Total ($ USD)</th>
              <th style="width: 13%; text-align: right;">Total (Bs.)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align: right; text-transform: uppercase;">
                TOTAL GENERAL (${cobrosDetallados.length} COBROS):
              </td>
              <td style="text-align: right; color: #059669; font-size: 11px;">
                ${formatUSD(totalUSD)}
              </td>
              <td style="text-align: right; color: #0284c7; font-size: 11px;">
                ${formatBs(totalBs)}
              </td>
            </tr>
          </tfoot>
        </table>

        <div class="footer-note">
          Documento generado automáticamente por ODONTOKRIS · Sistema de Gestión Odontológica · Confidencial
        </div>
      </body>
      </html>
    `;

    this.printHtmlDocument(printHtml);
  }
};
