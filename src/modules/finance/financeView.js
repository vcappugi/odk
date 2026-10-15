/**
 * Vista del Panel Financiero y Dashboard Económico
 * Módulo: Panel Financiero
 * ODONTOKRIS - Sistema Odontológico
 */

/**
 * Renderiza la sección principal del Panel Financiero (se monta en el layout principal junto al calendario)
 */
export function renderFinanceSection() {
  return `
    <section id="finance-main-section" class="finance-main-section box stack" data-surface="raised" data-border data-gap="md" style="display: none;">
      
      <!-- 1. Cabecera del Panel Financiero: Título, Filtros y Acciones -->
      <header class="finance-header cluster" data-justify="between" data-align="center">
        
        <div class="cluster" data-gap="sm" data-align="center">
          <div class="finance-header-icon-box" aria-hidden="true">
            <span>📈</span>
          </div>
          <div>
            <div class="cluster" data-gap="xs" data-align="center">
              <h2 class="finance-title" style="margin: 0; font-size: 1.25rem; font-weight: 700;">
                Panel Financiero & Métricas
              </h2>
              <span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700;">
                Tiempo Real
              </span>
            </div>
            <p class="finance-subtitle" style="margin: 0.15rem 0 0; font-size: 0.78rem; opacity: 0.75;">
              Facturación en Dólares ($) y Bolívares (Bs.), top tratamientos y pacientes atendidos
            </p>
          </div>
        </div>

        <!-- Controles y Filtros Rápidos -->
        <div class="finance-toolbar cluster" data-gap="xs" data-align="center">
          
          <!-- Filtro de Periodo -->
          <div class="cluster" data-gap="3xs" data-align="center">
            <label for="finance-filter-period" class="finance-filter-label" style="font-size: 0.75rem; font-weight: 600; opacity: 0.85;">
              📅 Periodo:
            </label>
            <select id="finance-filter-period" class="input input-compact finance-select" style="font-size: 0.78rem; height: 30px;">
              <option value="week" selected>Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="quarter">Últimos 3 Meses</option>
              <option value="year">Este Año (2026)</option>
              <option value="all">Todo el Histórico</option>
            </select>
          </div>

          <!-- Filtro de Consultorio / Sede -->
          <div class="cluster" data-gap="3xs" data-align="center">
            <label for="finance-filter-consultorio" class="finance-filter-label" style="font-size: 0.75rem; font-weight: 600; opacity: 0.85;">
              🏥 Sede:
            </label>
            <select id="finance-filter-consultorio" class="input input-compact finance-select" style="font-size: 0.78rem; height: 30px;">
              <option value="">Todas las Sedes</option>
            </select>
          </div>

          <!-- Botón Actualizar -->
          <button type="button" id="btn-finance-refresh" class="button" data-variant="ghost" data-size="sm" title="Actualizar datos y métricas" style="height: 30px;">
            <span>🔄</span>
          </button>

          <!-- Botón Imprimir / PDF -->
          <button type="button" id="btn-finance-print" class="button" data-variant="outlined" data-size="sm" title="Imprimir informe financiero en PDF" style="height: 30px; font-weight: 600; font-size: 0.78rem;">
            <span>🖨️ Imprimir</span>
          </button>

          <!-- Botón Destacado: Volver al Calendario -->
          <button type="button" id="btn-finance-back-calendar" class="button" data-paint="primary" data-size="sm" title="Regresar al calendario de citas" style="height: 30px; font-weight: 700; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span>📅</span>
            <span>Ver Calendario</span>
          </button>

        </div>

      </header>

      <!-- 2. Pestañas de Sub-Navegación del Panel Financiero -->
      <nav class="finance-nav-tabs cluster" data-gap="2xs" role="tablist">
        <button type="button" class="button btn-finance-tab is-active" data-tab="dashboard" data-paint="primary" data-size="sm">
          <span>📊 Dashboard General</span>
        </button>
        <button type="button" class="button btn-finance-tab" data-tab="cobros" data-variant="ghost" data-size="sm">
          <span>💳 Registro de Cobros</span>
        </button>
        <button type="button" class="button btn-finance-tab" data-tab="tratamientos" data-variant="ghost" data-size="sm">
          <span>🦷 Top Tratamientos</span>
        </button>
        <button type="button" class="button btn-finance-tab" data-tab="doctores" data-variant="ghost" data-size="sm">
          <span>👨‍⚕️ Rendimiento Doctores</span>
        </button>
      </nav>

      <!-- 3. Contenedores de Vistas según la pestaña activa -->
      
      <!-- PESTAÑA 1: DASHBOARD GENERAL (Activo por Defecto) -->
      <div id="finance-tab-content-dashboard" class="finance-tab-content stack" data-gap="md">
        <!-- Se inyecta dinámicamente con renderDashboardTab(metrics) -->
        <div class="finance-loading-box box" style="text-align: center; padding: 2.5rem 1rem;">
          <span class="spinner" data-size="md"></span>
          <p style="margin-top: 0.5rem; font-size: 0.88rem; opacity: 0.8;">Cargando métricas financieras y estadísticas clínicas...</p>
        </div>
      </div>

      <!-- PESTAÑA 2: REGISTRO DE COBROS -->
      <div id="finance-tab-content-cobros" class="finance-tab-content stack" data-gap="sm" style="display: none;">
        <!-- Se inyecta dinámicamente con renderCobrosTab(metrics) -->
      </div>

      <!-- PESTAÑA 3: TOP TRATAMIENTOS -->
      <div id="finance-tab-content-tratamientos" class="finance-tab-content stack" data-gap="sm" style="display: none;">
        <!-- Se inyecta dinámicamente con renderTratamientosTab(metrics) -->
      </div>

      <!-- PESTAÑA 4: RENDIMIENTO DOCTORES -->
      <div id="finance-tab-content-doctores" class="finance-tab-content stack" data-gap="sm" style="display: none;">
        <!-- Se inyecta dinámicamente con renderDoctoresTab(metrics) -->
      </div>

    </section>
  `;
}

/**
 * Renderiza el Dashboard General con las tarjetas KPI, gráfico semanal, top 10 tratamientos, etc.
 * @param {Object} metrics Datos calculados de financeModel.getMetrics()
 */
export function renderDashboardTab(metrics) {
  const { semana, pacientes, global, topTenTratamientos, metodosPago } = metrics;

  // Formateadores numéricos
  const formatUSD = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBs = (val) => `${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

  // Trend de la semana
  const isPositiveWeek = semana.percentChange >= 0;
  const weekTrendBadge = isPositiveWeek
    ? `<span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700;">↑ +${semana.percentChange}% vs anterior</span>`
    : `<span class="badge" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; font-size: 0.68rem; font-weight: 700;">↓ ${semana.percentChange}% vs anterior</span>`;

  // Encontrar el día con mayor ingreso de la semana para escalar el gráfico de barras
  const maxDayUSD = Math.max(...semana.dias.map(d => d.totalUSD), 1);

  return `
    <div class="finance-dashboard-wrapper stack" data-gap="md">

      <!-- ===================================================================
           A. CUADRÍCULA SUPERIOR: 4 HERO KPI CARDS
           =================================================================== -->
      <div class="finance-kpi-grid">
        
        <!-- KPI 1: Total Ingresos por Semana (Requisito Principal) -->
        <div class="finance-kpi-card box kpi-card-highlight" data-surface="raised" data-border>
          <div class="cluster" data-justify="between" data-align="center">
            <span class="finance-kpi-label">Total Ingresos de la Semana</span>
            <span class="finance-kpi-icon-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">💰</span>
          </div>
          <div class="finance-kpi-values-wrap">
            <strong class="finance-kpi-main-val" style="color: #10b981;">
              ${formatUSD(semana.totalUSD)}
            </strong>
            <span class="finance-kpi-sub-val">
              ≈ ${formatBs(semana.totalBs)}
            </span>
          </div>
          <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
            ${weekTrendBadge}
            <span style="font-size: 0.72rem; opacity: 0.75;">${semana.transacciones} pagos recibidos</span>
          </div>
        </div>

        <!-- KPI 2: Total Facturado en el Periodo Seleccionado -->
        <div class="finance-kpi-card box" data-surface="raised" data-border>
          <div class="cluster" data-justify="between" data-align="center">
            <span class="finance-kpi-label">Facturación Total (${metrics.period === 'week' ? 'Semanal' : (metrics.period === 'month' ? 'Mensual' : 'Periodo')})</span>
            <span class="finance-kpi-icon-badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7;">📊</span>
          </div>
          <div class="finance-kpi-values-wrap">
            <strong class="finance-kpi-main-val" style="color: #0284c7;">
              ${formatUSD(global.totalFacturadoUSD)}
            </strong>
            <span class="finance-kpi-sub-val">
              ≈ ${formatBs(global.totalFacturadoBs)}
            </span>
          </div>
          <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
            <span class="badge" data-paint="neutral" style="font-size: 0.68rem;">Rango: ${metrics.dateRange.start} a ${metrics.dateRange.end}</span>
            <span style="font-size: 0.72rem; opacity: 0.75;">${global.totalTransacciones} cobros</span>
          </div>
        </div>

        <!-- KPI 3: Cantidad de Pacientes Atendidos (Requisito Principal) -->
        <div class="finance-kpi-card box" data-surface="raised" data-border>
          <div class="cluster" data-justify="between" data-align="center">
            <span class="finance-kpi-label">Pacientes Atendidos</span>
            <span class="finance-kpi-icon-badge" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">👥</span>
          </div>
          <div class="finance-kpi-values-wrap">
            <strong class="finance-kpi-main-val" style="color: #8b5cf6;">
              ${pacientes.atendidosUnicos} <span style="font-size: 0.95rem; font-weight: 500;">pacientes</span>
            </strong>
            <span class="finance-kpi-sub-val">
              ${pacientes.citasAtendidas} citas realizadas de ${pacientes.citasProgramadas} agendadas
            </span>
          </div>
          <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
            <span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700;">
              ${pacientes.tasaAsistencia}% Asistencia
            </span>
            <span style="font-size: 0.72rem; color: #3b82f6; font-weight: 600;">+${pacientes.nuevosPacientes} nuevos</span>
          </div>
        </div>

        <!-- KPI 4: Ticket Promedio por Paciente / Cita -->
        <div class="finance-kpi-card box" data-surface="raised" data-border>
          <div class="cluster" data-justify="between" data-align="center">
            <span class="finance-kpi-label">Ticket Promedio</span>
            <span class="finance-kpi-icon-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🏷️</span>
          </div>
          <div class="finance-kpi-values-wrap">
            <strong class="finance-kpi-main-val" style="color: #f59e0b;">
              ${formatUSD(global.ticketPromedioUSD)}
            </strong>
            <span class="finance-kpi-sub-val">
              Ingreso promedio por consulta cobrada
            </span>
          </div>
          <div class="cluster" data-justify="between" data-align="center" style="margin-top: 0.25rem;">
            <span class="badge" data-paint="neutral" style="font-size: 0.68rem;">Rendimiento Clínico</span>
            <span style="font-size: 0.72rem; opacity: 0.75;">${pacientes.citasPendientes} citas por atender</span>
          </div>
        </div>

      </div>

      <!-- ===================================================================
           B. SECCIÓN: DESGLOSE DE INGRESOS POR DÍA DE LA SEMANA + TENDENCIA
           =================================================================== -->
      <div class="finance-two-col-grid">
        
        <!-- Gráfico de Barras: Ingresos por Día de la Semana (Lunes a Domingo) -->
        <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <div>
              <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">
                📅 Ingresos por Día de la Semana
              </h3>
              <small style="opacity: 0.75; font-size: 0.74rem;">
                Semana en curso (Lunes a Domingo) en Dólares ($ USD)
              </small>
            </div>
            <span class="badge" data-paint="primary" style="font-size: 0.7rem; font-weight: 700;">
              Total: ${formatUSD(semana.totalUSD)}
            </span>
          </div>

          <!-- Contenedor del Gráfico de Barras -->
          <div class="finance-bar-chart-container">
            <div class="finance-bars-track">
              ${semana.dias.map(dia => {
                const heightPercent = maxDayUSD > 0 ? Math.max((dia.totalUSD / maxDayUSD) * 100, 6) : 6;
                const hasRevenue = dia.totalUSD > 0;
                return `
                  <div class="finance-bar-column ${hasRevenue ? 'has-revenue' : ''}" title="${dia.name}: ${formatUSD(dia.totalUSD)} (${formatBs(dia.totalBs)}) - ${dia.count} cobros">
                    <span class="finance-bar-amount">${hasRevenue ? formatUSD(dia.totalUSD) : '$0'}</span>
                    <div class="finance-bar-fill-wrap">
                      <div class="finance-bar-fill" style="height: ${heightPercent}%;"></div>
                    </div>
                    <span class="finance-bar-day-name">${dia.short}</span>
                    <small class="finance-bar-count-badge">${dia.count} p.</small>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <!-- Tendencia de Crecimiento: Últimas 6 Semanas -->
        <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <div>
              <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">
                📈 Evolución (Últimas 6 Semanas)
              </h3>
              <small style="opacity: 0.75; font-size: 0.74rem;">
                Tendencia histórica y comparativa semanal
              </small>
            </div>
            <span class="badge" data-paint="neutral" style="font-size: 0.7rem;">Historial 6 semanas</span>
          </div>

          <div class="finance-weekly-trend-list stack" data-gap="xs">
            ${semana.tendenciaSeisSemanas.map((w, idx) => {
              const maxWeek = Math.max(...semana.tendenciaSeisSemanas.map(x => x.totalUSD), 1);
              const widthPercent = Math.max((w.totalUSD / maxWeek) * 100, 3);
              const isCurrent = idx === semana.tendenciaSeisSemanas.length - 1;
              return `
                <div class="finance-trend-row ${isCurrent ? 'is-current-week' : ''}">
                  <div class="cluster" data-justify="between" style="font-size: 0.76rem; margin-bottom: 2px;">
                    <span style="font-weight: ${isCurrent ? '700' : '500'}; color: ${isCurrent ? '#10b981' : 'inherit'};">
                      ${w.label} ${isCurrent ? '⭐' : ''}
                    </span>
                    <strong>${formatUSD(w.totalUSD)}</strong>
                  </div>
                  <div class="finance-trend-bar-bg">
                    <div class="finance-trend-bar-fill ${isCurrent ? 'fill-current' : ''}" style="width: ${widthPercent}%;"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

      </div>

      <!-- ===================================================================
           C. SECCIÓN: TOP 10 DE TRATAMIENTOS ODONTOLÓGICOS (Requisito Principal)
           =================================================================== -->
      <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
        
        <header class="cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="finance-kpi-icon-badge" style="background: rgba(2, 132, 199, 0.15); color: #0284c7; width: 32px; height: 32px; font-size: 1.1rem;">🦷</span>
            <div>
              <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">
                Top 10 de Tratamientos Odontológicos
              </h3>
              <small style="opacity: 0.75; font-size: 0.75rem;">
                Procedimientos clínicos más demandados y realizados en el consultorio
              </small>
            </div>
          </div>
          <span class="badge" data-paint="primary" style="font-size: 0.72rem; font-weight: 700;">
            ${metrics.totalTratamientosEvaluados} Procedimientos Analizados
          </span>
        </header>

        <!-- Cuadrícula del Top 10 Tratamientos -->
        ${topTenTratamientos.length === 0 ? `
          <div style="text-align: center; padding: 1.5rem; opacity: 0.7; font-size: 0.85rem;">
            Aún no se han registrado tratamientos en el periodo seleccionado.
          </div>
        ` : `
          <div class="finance-top-treatments-grid">
            ${topTenTratamientos.map((t, index) => {
              const rank = index + 1;
              let rankBadgeStyle = 'background: rgba(125, 125, 125, 0.15); color: inherit;';
              let medal = `#${rank}`;
              if (rank === 1) {
                rankBadgeStyle = 'background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%); color: #ffffff; font-weight: 800;';
                medal = '🥇 #1';
              } else if (rank === 2) {
                rankBadgeStyle = 'background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%); color: #ffffff; font-weight: 800;';
                medal = '🥈 #2';
              } else if (rank === 3) {
                rankBadgeStyle = 'background: linear-gradient(135deg, #b45309 0%, #78350f 100%); color: #ffffff; font-weight: 800;';
                medal = '🥉 #3';
              }

              // Color de barra según posición
              const barGradient = rank <= 3
                ? 'linear-gradient(90deg, #0284c7 0%, #10b981 100%)'
                : 'linear-gradient(90deg, #6366f1 0%, #0284c7 100%)';

              return `
                <div class="top-treatment-card box" data-surface="sunken" data-border style="padding: 0.55rem 0.75rem; border-radius: 8px;">
                  <div class="cluster" data-justify="between" data-align="center" style="gap: 6px;">
                    <div class="cluster" data-gap="xs" data-align="center">
                      <span class="treatment-rank-badge" style="${rankBadgeStyle} padding: 2px 7px; border-radius: 9999px; font-size: 0.72rem;">
                        ${medal}
                      </span>
                      <strong class="treatment-name" style="font-size: 0.84rem; color: var(--primary, #0284c7);">
                        ${t.name}
                      </strong>
                    </div>
                    <span class="badge" data-paint="neutral" style="font-size: 0.7rem; font-weight: 700; white-space: nowrap;">
                      ${t.count} ${t.count === 1 ? 'vez' : 'veces'}
                    </span>
                  </div>

                  <!-- Barra de Progreso del Tratamiento -->
                  <div style="margin-top: 0.4rem;">
                    <div class="cluster" data-justify="between" style="font-size: 0.70rem; opacity: 0.8; margin-bottom: 2px;">
                      <span>Frecuencia clínica:</span>
                      <strong>${t.percentage}% del total</strong>
                    </div>
                    <div class="treatment-bar-track" style="background: rgba(125, 125, 125, 0.15); height: 6px; border-radius: 3px; overflow: hidden;">
                      <div class="treatment-bar-fill" style="background: ${barGradient}; width: ${Math.max(t.percentage, 5)}%; height: 100%; border-radius: 3px;"></div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}

      </div>

      <!-- ===================================================================
           D. SECCIÓN: MÉTODOS DE PAGO Y RESUMEN CLÍNICO
           =================================================================== -->
      <div class="finance-two-col-grid">
        
        <!-- Métodos de Pago Registrados -->
        <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">
              💳 Distribución de Métodos de Pago
            </h3>
            <span class="badge" data-paint="neutral" style="font-size: 0.68rem;">Divisas y Bolívares</span>
          </div>

          ${metodosPago.length === 0 ? `
            <div style="text-align: center; padding: 1.5rem; opacity: 0.7; font-size: 0.82rem;">
              No hay pagos registrados en este periodo.
            </div>
          ` : `
            <div class="stack" data-gap="xs">
              ${metodosPago.map(m => `
                <div class="payment-method-row box" data-surface="sunken" data-border style="padding: 0.45rem 0.65rem; border-radius: 6px;">
                  <div class="cluster" data-justify="between" data-align="center" style="font-size: 0.78rem;">
                    <div class="cluster" data-gap="2xs" data-align="center">
                      <span style="font-size: 0.95rem;">${m.method.includes('Zelle') ? '🟣' : (m.method.includes('Punto') ? '💳' : (m.method.includes('Móvil') ? '📱' : '💵'))}</span>
                      <strong>${m.method}</strong>
                      <span class="badge" data-paint="neutral" style="font-size: 0.65rem; padding: 1px 4px;">${m.count}</span>
                    </div>
                    <div style="text-align: right;">
                      <strong style="color: #10b981; font-size: 0.82rem;">${formatUSD(m.totalUSD)}</strong>
                      <small style="display: block; font-size: 0.68rem; opacity: 0.75;">(${m.percentage}%)</small>
                    </div>
                  </div>
                  <!-- Barra de porcentaje -->
                  <div style="background: rgba(125, 125, 125, 0.15); height: 4px; border-radius: 2px; margin-top: 4px; overflow: hidden;">
                    <div style="background: #10b981; width: ${m.percentage}%; height: 100%;"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <!-- Resumen de Cumplimiento Clínico -->
        <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <h3 style="margin: 0; font-size: 1rem; font-weight: 700;">
              📋 Cumplimiento Clínico y Asistencia
            </h3>
            <span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700;">
              ${pacientes.tasaAsistencia}% Asistencia
            </span>
          </div>

          <div class="stack" data-gap="xs">
            
            <div class="clinical-summary-item box" data-surface="sunken" data-border style="padding: 0.5rem 0.7rem; border-radius: 6px;">
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span>🟢</span>
                  <span style="font-size: 0.8rem; font-weight: 600;">Citas Atendidas / Realizadas:</span>
                </div>
                <strong style="font-size: 0.95rem; color: #10b981;">${pacientes.citasAtendidas}</strong>
              </div>
            </div>

            <div class="clinical-summary-item box" data-surface="sunken" data-border style="padding: 0.5rem 0.7rem; border-radius: 6px;">
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span>🟡</span>
                  <span style="font-size: 0.8rem; font-weight: 600;">Citas Pendientes / En Espera:</span>
                </div>
                <strong style="font-size: 0.95rem; color: #f59e0b;">${pacientes.citasPendientes}</strong>
              </div>
            </div>

            <div class="clinical-summary-item box" data-surface="sunken" data-border style="padding: 0.5rem 0.7rem; border-radius: 6px;">
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span>👤</span>
                  <span style="font-size: 0.8rem; font-weight: 600;">Pacientes Únicos Atendidos:</span>
                </div>
                <strong style="font-size: 0.95rem; color: #0284c7;">${pacientes.atendidosUnicos}</strong>
              </div>
            </div>

            <div class="clinical-summary-item box" data-surface="sunken" data-border style="padding: 0.5rem 0.7rem; border-radius: 6px;">
              <div class="cluster" data-justify="between" data-align="center">
                <div class="cluster" data-gap="xs" data-align="center">
                  <span>✨</span>
                  <span style="font-size: 0.8rem; font-weight: 600;">Nuevos Pacientes Registrados:</span>
                </div>
                <strong style="font-size: 0.95rem; color: #8b5cf6;">${pacientes.nuevosPacientes}</strong>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * Renderiza la Pestaña 2: Registro Detallado de Cobros
 */
export function renderCobrosTab(metrics) {
  const { cobrosDetallados } = metrics;
  const formatUSD = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatBs = (val) => `${Number(val || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs.`;

  return `
    <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
      <div class="cluster" data-justify="between" data-align="center">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">
            💳 Libro Diario de Cobros y Pagos
          </h3>
          <small style="opacity: 0.75; font-size: 0.75rem;">
            Lista detallada de pagos recibidos con tasa oficial BCV, método y referencia
          </small>
        </div>
        <div class="cluster" data-gap="xs">
          <input 
            type="search" 
            id="finance-search-cobros" 
            class="input input-compact" 
            placeholder="🔍 Buscar paciente o referencia..." 
            style="width: 240px; font-size: 0.78rem; height: 30px;"
          />
          <span class="badge" data-paint="success" style="font-size: 0.72rem; font-weight: 700;">
            ${cobrosDetallados.length} Transacciones
          </span>
        </div>
      </div>

      <div class="table-scroll-container" style="max-height: 480px; overflow-y: auto;">
        <table class="table finance-table" style="width: 100%; font-size: 0.8rem;">
          <thead>
            <tr>
              <th style="width: 12%;">Fecha</th>
              <th style="width: 25%;">Paciente</th>
              <th style="width: 18%;">Especialista</th>
              <th style="width: 14%; text-align: right;">Monto ($ USD)</th>
              <th style="width: 12%; text-align: right;">Tasa BCV</th>
              <th style="width: 19%;">Método / Referencia</th>
            </tr>
          </thead>
          <tbody id="finance-cobros-tbody">
            ${cobrosDetallados.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: 2rem; opacity: 0.7;">
                  No hay cobros registrados en el periodo seleccionado.
                </td>
              </tr>
            ` : cobrosDetallados.map(c => `
              <tr class="finance-cobro-row" data-search="${(c.paciente_nombre + ' ' + c.paciente_ci + ' ' + c.referencia + ' ' + c.doctor_nombre).toLowerCase()}">
                <td>
                  <strong>${c.fecha_pago}</strong>
                </td>
                <td>
                  <div class="stack" style="gap: 1px;">
                    <strong style="color: var(--primary, #0284c7);">${c.paciente_nombre}</strong>
                    <small style="opacity: 0.7; font-size: 0.70rem;">CI: ${c.paciente_ci}</small>
                  </div>
                </td>
                <td>
                  <span>${c.doctor_nombre}</span>
                </td>
                <td style="text-align: right;">
                  <strong style="color: #10b981; font-size: 0.88rem;">${formatUSD(c.monto_usd)}</strong>
                  <small style="display: block; font-size: 0.68rem; opacity: 0.75;">≈ ${formatBs(c.monto_bs)}</small>
                </td>
                <td style="text-align: right; opacity: 0.85;">
                  ${Number(c.tasa_cambio).toFixed(2)} Bs/$
                </td>
                <td>
                  <span class="badge" data-paint="neutral" style="font-size: 0.68rem; font-weight: 600;">
                    ${c.metodo}
                  </span>
                  <small style="display: block; opacity: 0.75; font-size: 0.68rem; margin-top: 2px;">
                    ${c.referencia}
                  </small>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Renderiza la Pestaña 3: Top Tratamientos Extendido
 */
export function renderTratamientosTab(metrics) {
  const { topTenTratamientos, totalTratamientosEvaluados } = metrics;

  return `
    <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
      <div class="cluster" data-justify="between" data-align="center">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">
            🦷 Clasificación y Frecuencia de Tratamientos
          </h3>
          <small style="opacity: 0.75; font-size: 0.75rem;">
            Desglose analítico de tratamientos registrados en el historial médico y citas
          </small>
        </div>
        <span class="badge" data-paint="primary" style="font-size: 0.72rem; font-weight: 700;">
          Total: ${totalTratamientosEvaluados} Procedimientos
        </span>
      </div>

      <div class="table-scroll-container">
        <table class="table" style="width: 100%; font-size: 0.82rem;">
          <thead>
            <tr>
              <th style="width: 10%; text-align: center;">Ranking</th>
              <th style="width: 45%;">Procedimiento / Tratamiento</th>
              <th style="width: 15%; text-align: center;">Veces Realizado</th>
              <th style="width: 30%;">Porcentaje sobre Total</th>
            </tr>
          </thead>
          <tbody>
            ${topTenTratamientos.map((t, idx) => `
              <tr>
                <td style="text-align: center;">
                  <strong style="font-size: 0.9rem;">#${idx + 1}</strong>
                </td>
                <td>
                  <strong style="color: var(--primary, #0284c7);">${t.name}</strong>
                  ${t.sampleDiagnosticos?.length ? `<small style="display: block; opacity: 0.7; font-size: 0.70rem;">Ej. ${t.sampleDiagnosticos[0]}</small>` : ''}
                </td>
                <td style="text-align: center;">
                  <span class="badge" data-paint="success" style="font-size: 0.75rem; font-weight: 700;">
                    ${t.count}
                  </span>
                </td>
                <td>
                  <div class="cluster" data-justify="between" style="font-size: 0.72rem; margin-bottom: 2px;">
                    <span>Frecuencia:</span>
                    <strong>${t.percentage}%</strong>
                  </div>
                  <div style="background: rgba(125, 125, 125, 0.15); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="background: #0284c7; width: ${t.percentage}%; height: 100%;"></div>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

/**
 * Renderiza la Pestaña 4: Rendimiento por Doctor
 */
export function renderDoctoresTab(metrics) {
  const { rendimientoDoctores } = metrics;
  const formatUSD = (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return `
    <div class="box stack finance-card" data-surface="raised" data-border data-gap="sm">
      <div class="cluster" data-justify="between" data-align="center">
        <div>
          <h3 style="margin: 0; font-size: 1.05rem; font-weight: 700;">
            👨‍⚕️ Rendimiento por Especialista / Doctor
          </h3>
          <small style="opacity: 0.75; font-size: 0.75rem;">
            Consultas atendidas y volumen de cobro generado por cada doctor
          </small>
        </div>
      </div>

      <div class="table-scroll-container">
        <table class="table" style="width: 100%; font-size: 0.82rem;">
          <thead>
            <tr>
              <th style="width: 35%;">Doctor / Especialista</th>
              <th style="width: 20%; text-align: center;">Citas Atendidas</th>
              <th style="width: 20%; text-align: center;">Citas Agendadas</th>
              <th style="width: 25%; text-align: right;">Facturación ($ USD)</th>
            </tr>
          </thead>
          <tbody>
            ${rendimientoDoctores.length === 0 ? `
              <tr>
                <td colspan="4" style="text-align: center; padding: 2rem; opacity: 0.7;">
                  No hay doctores con actividad registrada en el periodo.
                </td>
              </tr>
            ` : rendimientoDoctores.map(d => `
              <tr>
                <td>
                  <strong>${d.nombre}</strong>
                </td>
                <td style="text-align: center;">
                  <span class="badge" data-paint="success" style="font-weight: 700;">
                    ${d.citasAtendidas} atendidas
                  </span>
                </td>
                <td style="text-align: center; opacity: 0.85;">
                  ${d.citasTotales} totales
                </td>
                <td style="text-align: right;">
                  <strong style="color: #10b981; font-size: 0.9rem;">
                    ${formatUSD(d.facturadoUSD)}
                  </strong>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
