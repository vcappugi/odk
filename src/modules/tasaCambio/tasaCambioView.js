/**
 * Vista de Tasas de Cambio (TasaCambioView)
 * Renderiza la sección CRUD dentro de Configuración Administrativa
 * y el modal con el botón de scraping del Banco Central de Venezuela (BCV).
 */

export function renderTasaSection() {
  return `
    <!-- 5. VISTA: GESTIÓN DE TASAS DE CAMBIO (CRUD COMPLETO TABLA tasa_cambio) -->
    <section id="admin-section-tasa" class="admin-section stack" data-gap="md" style="display: none;">
      
      <!-- Cabecera de la Sección -->
      <div class="cluster" data-justify="between" data-align="center">
        <div>
          <div class="cluster" data-gap="xs" data-align="center">
            <h4 style="margin: 0; font-size: 1rem;">💵 Tasas de Cambio Oficial (BCV)</h4>
            <span class="badge" data-paint="success" style="font-size: 0.7rem; font-weight: 700;">USD / VES</span>
          </div>
          <small style="opacity: 0.75; font-size: 0.78rem;">
            Historial de tasas de cambio registradas con scraping automático del Banco Central de Venezuela
          </small>
        </div>
        <div class="cluster" data-gap="xs">
          <button type="button" id="btn-admin-new-tasa" class="button" data-paint="primary" data-size="sm">
            ➕ Registrar Nueva Tasa
          </button>
          <button type="button" class="button btn-admin-back-hub" data-variant="ghost" data-size="sm">
            ◀ Volver al Menú
          </button>
        </div>
      </div>

      <!-- Banner Informativo / Tasa Vigente Activa -->
      <div id="tasa-vigente-hero" class="box cluster" data-surface="raised" data-border data-justify="between" data-align="center" style="padding: 0.85rem 1.1rem; border-left: 4px solid var(--color-primary, #0284c7);">
        <div class="cluster" data-gap="sm" data-align="center">
          <div style="font-size: 1.8rem; line-height: 1;">🏛️</div>
          <div>
            <div style="font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.75;">
              Tasa Oficial Vigente en el Sistema
            </div>
            <div id="tasa-vigente-display" style="font-size: 1.25rem; font-weight: 800; color: var(--color-text, inherit);">
              Cargando tasa vigente...
            </div>
          </div>
        </div>
        <div class="cluster" data-gap="xs" data-align="center">
          <button type="button" id="btn-quick-scrape-new" class="button" data-paint="success" data-size="sm" title="Consultar BCV y abrir modal de registro">
            🔄 Consultar Tasa BCV Hoy
          </button>
        </div>
      </div>

      <!-- Barra de Filtro / Búsqueda -->
      <div class="cluster" data-justify="between" data-align="center">
        <div class="cluster" data-gap="xs" data-align="center">
          <span style="font-size: 0.82rem; font-weight: 600;">Registros Históricos:</span>
          <span id="tasa-count-badge" class="badge" data-paint="neutral" style="font-size: 0.72rem;">0 registros</span>
        </div>
        <input type="search" id="admin-tasa-search-input" class="input" placeholder="🔍 Buscar por fecha o valor..." style="max-width: 250px;" />
      </div>

      <!-- Tabla de Tasas de Cambio -->
      <div class="admin-users-table-wrapper box" data-surface="sunken" data-border style="padding: 0; max-height: 420px; overflow-y: auto;">
        <table class="table" style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
          <thead>
            <tr style="border-bottom: 1px solid rgba(125,125,125,0.2); position: sticky; top: 0; background: var(--color-surface, #fff); z-index: 2;">
              <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.78rem;"># ID</th>
              <th style="padding: 0.65rem 0.85rem; text-align: left; font-size: 0.78rem;">📅 Fecha Oficial</th>
              <th style="padding: 0.65rem 0.85rem; text-align: right; font-size: 0.78rem;">💵 Tasa USD (Bs.)</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.78rem;">🕒 Registrado El</th>
              <th style="padding: 0.65rem 0.85rem; text-align: center; font-size: 0.78rem; width: 110px;">⚙️ Acciones</th>
            </tr>
          </thead>
          <tbody id="admin-tasa-table-body">
            <tr>
              <td colspan="5" style="padding: 2rem; text-align: center; opacity: 0.7;">
                Cargando tasas de cambio...
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </section>
  `;
}

export function renderTasaModal() {
  return `
    <!-- Modal Secundario: Registrar / Modificar Tasa de Cambio con Scraping BCV -->
    <dialog id="modal-tasa-form" class="dialog custom-modal" aria-labelledby="tasa-form-title" style="max-width: 520px; width: 94vw; z-index: 100010;">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-size: 1.25rem;">💵</span>
            <div>
              <h3 id="tasa-form-title" style="margin: 0; font-size: 1.05rem;">Registrar Tasa de Cambio</h3>
              <small id="tasa-form-subtitle" style="opacity: 0.75; font-size: 0.76rem;">
                Consulta la web del BCV o introduce los datos manualmente
              </small>
            </div>
          </div>
          <button type="button" class="button btn-close-tasa-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
        </header>

        <!-- Bloque Destacado de Scraping del Banco Central de Venezuela -->
        <div class="box stack" data-surface="sunken" data-border data-gap="xs" style="background: rgba(16, 185, 129, 0.05); border-color: rgba(16, 185, 129, 0.3);">
          <div class="cluster" data-justify="between" data-align="center">
            <div class="cluster" data-gap="2xs" data-align="center">
              <span style="font-size: 1.1rem;">🏛️</span>
              <strong style="font-size: 0.82rem; color: #047857;">Banco Central de Venezuela (BCV)</strong>
            </div>
            <a href="https://www.bcv.org.ve/" target="_blank" rel="noopener noreferrer" style="font-size: 0.72rem; text-decoration: underline; opacity: 0.85;">
              www.bcv.org.ve ↗
            </a>
          </div>
          <p style="margin: 0; font-size: 0.76rem; opacity: 0.85; line-height: 1.35;">
            Presiona el botón para consultar en tiempo real el portal del BCV y extraer el valor del dólar <code>div#dolar</code> y la fecha valor <code>span[datatype="xsd:dateTime"]</code>.
          </p>
          <div class="cluster" data-align="center" data-gap="xs" style="margin-top: 0.25rem;">
            <button type="button" id="btn-scrape-bcv" class="button" data-paint="success" data-size="sm" style="font-weight: 700;">
              <span id="scrape-bcv-icon">🔄</span>
              <span id="scrape-bcv-text">Obtener Tasa Oficial BCV</span>
            </button>
            <span id="scrape-bcv-spinner" class="spinner" style="display: none; width: 16px; height: 16px;" aria-hidden="true"></span>
          </div>
          <div id="scrape-bcv-msg" style="display: none; font-size: 0.78rem; font-weight: 600; padding: 0.3rem 0.5rem; border-radius: 4px;"></div>
        </div>

        <!-- Formulario Principal -->
        <form id="form-admin-tasa" class="stack" data-gap="sm">
          <input type="hidden" id="admin-tasa-id" value="" />

          <!-- Campo Fecha -->
          <div class="field">
            <label for="admin-tasa-fecha" class="label" style="font-weight: 600; font-size: 0.82rem;">
              📅 Fecha Oficial (BCV) *
            </label>
            <input type="date" id="admin-tasa-fecha" class="input" required />
            <small style="opacity: 0.7; font-size: 0.72rem;">
              Corresponde a la fecha valor oficial publicada por el BCV (<code>span datatype="xsd:dateTime"</code>).
            </small>
          </div>

          <!-- Campo Valor USD -->
          <div class="field">
            <label for="admin-tasa-valor" class="label" style="font-weight: 600; font-size: 0.82rem;">
              💵 Valor USD en Bolívares (Bs.) *
            </label>
            <input type="number" id="admin-tasa-valor" class="input" step="0.0001" min="0.0001" placeholder="Ej. 876.7976" required />
            <small style="opacity: 0.7; font-size: 0.72rem;">
              Monto exacto de 1 USD en bolívares extraído de <code>div id="dolar"</code>.
            </small>
          </div>

          <!-- Botones de Acción -->
          <footer class="cluster modal-footer" data-justify="end" data-gap="xs" style="margin-top: 0.6rem; padding-top: 0.6rem; border-top: 1px solid rgba(125,125,125,0.15);">
            <button type="button" class="button btn-close-tasa-modal" data-variant="ghost">
              Cancelar
            </button>
            <button type="submit" id="btn-submit-tasa" class="button" data-paint="primary">
              💾 Guardar Tasa de Cambio
            </button>
          </footer>
        </form>

      </div>
    </dialog>
  `;
}

/**
 * Renderiza las filas de la tabla de tasas de cambio
 * @param {Array} tasas 
 * @returns {string}
 */
export function renderTasaTableRows(tasas) {
  if (!tasas || tasas.length === 0) {
    return `
      <tr>
        <td colspan="5" style="padding: 2.5rem 1rem; text-align: center;">
          <div class="stack" data-gap="xs" data-align="center">
            <span style="font-size: 2rem;">💵</span>
            <p style="margin: 0; font-weight: 600; font-size: 0.9rem;">No hay tasas de cambio registradas aún.</p>
            <p style="margin: 0; font-size: 0.78rem; opacity: 0.75;">
              Haz clic en "Registrar Nueva Tasa" o usa el botón para obtener la tasa oficial del BCV del día.
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  return tasas.map(item => {
    const formattedValor = typeof item.valorUSD === 'number'
      ? item.valorUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : String(item.valorUSD || '0.00');

    let formattedFecha = item.fecha || 'Sin fecha';
    if (item.fecha && item.fecha.includes('-')) {
      const parts = item.fecha.split('-');
      if (parts.length === 3) {
        formattedFecha = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }

    let createdDisplay = '—';
    if (item.created_at) {
      try {
        const d = new Date(item.created_at);
        createdDisplay = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' });
      } catch {
        createdDisplay = '—';
      }
    }

    return `
      <tr style="border-bottom: 1px solid rgba(125,125,125,0.1);">
        <td style="padding: 0.6rem 0.85rem; font-weight: 700; opacity: 0.75;">
          #${item.id}
        </td>
        <td style="padding: 0.6rem 0.85rem; font-weight: 600;">
          📅 ${formattedFecha}
        </td>
        <td style="padding: 0.6rem 0.85rem; text-align: right;">
          <span class="badge" data-paint="success" style="font-size: 0.82rem; font-weight: 700;">
            ${formattedValor} Bs.
          </span>
        </td>
        <td style="padding: 0.6rem 0.85rem; text-align: center; opacity: 0.75; font-size: 0.78rem;">
          ${createdDisplay}
        </td>
        <td style="padding: 0.6rem 0.85rem; text-align: center;">
          <div class="cluster" data-gap="2xs" data-justify="center">
            <button type="button" class="button btn-edit-tasa" data-id="${item.id}" data-variant="ghost" data-size="sm" title="Editar tasa">
              ✏️
            </button>
            <button type="button" class="button btn-delete-tasa" data-id="${item.id}" data-fecha="${formattedFecha}" data-variant="ghost" data-size="sm" title="Eliminar tasa" style="color: #ef4444;">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}
