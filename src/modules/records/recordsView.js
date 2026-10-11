/**
 * Vista de Registros (Records View)
 * Renderiza la grilla responsiva de tarjetas utilizando componentes Yeti CSS.
 */
import { escapeHTML } from '../../utils/dom.js';
import { formatDate, getStatusPaint, getPriorityPaint } from '../../utils/formatters.js';

export function renderRecordsGrid(records = [], source = 'local') {
  if (records.length === 0) {
    return `
      <div class="box empty-state" data-surface="raised" data-border>
        <div class="stack" data-gap="sm" style="text-align: center; padding: 2rem;">
          <div class="empty-icon">📂</div>
          <h3>No hay registros disponibles</h3>
          <p class="lede">Crea tu primer registro para guardarlo en la base de datos Supabase o en almacenamiento local.</p>
          <div class="cluster" data-justify="center">
            <button class="button btn-create-trigger" data-paint="primary">Crear Primer Registro</button>
          </div>
        </div>
      </div>
    `;
  }

  const cardsHtml = records.map(record => {
    const statusPaint = getStatusPaint(record.status);
    const priorityPaint = getPriorityPaint(record.priority);

    return `
      <article class="card box record-card" data-surface="raised" data-border data-id="${record.id}">
        <div class="stack" data-gap="sm">
          <div class="cluster" data-justify="between" data-align="center">
            <span class="badge" data-paint="${statusPaint}">${escapeHTML(record.status || 'General')}</span>
            <div class="cluster" data-gap="xs">
              <span class="badge" data-paint="${priorityPaint}">${escapeHTML(record.priority || 'Normal')}</span>
              <span class="category-tag">${escapeHTML(record.category || 'General')}</span>
            </div>
          </div>

          <div class="record-content">
            <h3 class="record-title">${escapeHTML(record.title)}</h3>
            <p class="record-desc">${escapeHTML(record.description || 'Sin descripción adicional.')}</p>
          </div>

          <div class="record-footer cluster" data-justify="between" data-align="center">
            <time class="record-date">${formatDate(record.created_at)}</time>
            <div class="cluster record-actions" data-gap="xs">
              <button type="button" class="button btn-edit-record" data-size="xs" data-variant="ghost" data-id="${record.id}" title="Editar">
                ✏️
              </button>
              <button type="button" class="button btn-delete-record" data-size="xs" data-variant="ghost" data-id="${record.id}" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  return `
    <div class="records-header cluster" data-justify="between" data-align="center">
      <div class="cluster" data-gap="sm" data-align="center">
        <h2>Registros Activos (${records.length})</h2>
        <span class="badge" data-paint="${source === 'supabase' ? 'success' : 'neutral'}">
          ${source === 'supabase' ? '☁️ Supabase Cloud' : '💾 Modo Local'}
        </span>
      </div>
      <button class="button btn-create-trigger" data-paint="primary" data-size="sm">
        + Añadir
      </button>
    </div>
    <div class="grid records-grid" data-min="sm" data-columns="3" data-gap="md">
      ${cardsHtml}
    </div>
  `;
}
