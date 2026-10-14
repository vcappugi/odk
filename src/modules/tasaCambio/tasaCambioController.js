/**
 * Controlador de Tasas de Cambio (TasaCambioController)
 * Gestiona el CRUD completo de la tabla 'tasa_cambio' y la integración
 * con el servicio de scraping del Banco Central de Venezuela (BCV).
 */

import { tasaCambioModel } from './tasaCambioModel.js';
import { bcvScraperService } from './bcvScraperService.js';
import { renderTasaTableRows } from './tasaCambioView.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { $ } from '../../utils/dom.js';

export const tasaCambioController = {
  tasasCache: [],
  isScraping: false,

  init() {
    this.bindEvents();
  },

  bindEvents() {
    // 1. Abrir modal para crear nueva tasa
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-admin-new-tasa')) {
        this.openCreateModal();
      }
    });

    // 1b. Botón rápido de consultar tasa hoy desde la cabecera
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-quick-scrape-new')) {
        this.openCreateModal();
        await this.handleScrapeBCV();
      }
    });

    // 2. Cerrar modal de tasa
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-tasa-modal')) {
        this.closeModal();
      }
    });

    // 3. Botón de Scraping al BCV dentro del modal
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-scrape-bcv')) {
        await this.handleScrapeBCV();
      }
    });

    // 4. Envío de formulario (Crear / Editar)
    const form = $('#form-admin-tasa');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSave();
      });
    }

    // 5. Clics en la tabla (Editar / Eliminar)
    document.addEventListener('click', async (e) => {
      // Editar
      const editBtn = e.target.closest('.btn-edit-tasa');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        await this.openEditModal(id);
        return;
      }

      // Eliminar
      const delBtn = e.target.closest('.btn-delete-tasa');
      if (delBtn) {
        const id = delBtn.getAttribute('data-id');
        const fecha = delBtn.getAttribute('data-fecha') || '';
        await this.handleDelete(id, fecha);
        return;
      }
    });

    // 6. Búsqueda y filtrado en tiempo real
    const searchInput = $('#admin-tasa-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterTable(e.target.value);
      });
    }
  },

  /**
   * Carga la tabla y el banner de tasa vigente
   */
  async loadTable() {
    const tbody = $('#admin-tasa-table-body');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 2rem; text-align: center; opacity: 0.7;">
            Cargando tasas de cambio...
          </td>
        </tr>
      `;
    }

    try {
      const data = await tasaCambioModel.getAll();
      this.tasasCache = data || [];
      this.renderTableData(this.tasasCache);
      this.updateHeroDisplay();
    } catch (err) {
      console.error('[tasaCambioController] Error al cargar tasas:', err);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" style="padding: 2rem; text-align: center; color: #ef4444;">
              Error al cargar las tasas de cambio: ${err.message}
            </td>
          </tr>
        `;
      }
    }
  },

  /**
   * Renderiza las filas en el cuerpo de la tabla
   */
  renderTableData(list) {
    const tbody = $('#admin-tasa-table-body');
    const badge = $('#tasa-count-badge');

    if (badge) {
      badge.textContent = `${list.length} ${list.length === 1 ? 'registro' : 'registros'}`;
    }

    if (tbody) {
      tbody.innerHTML = renderTasaTableRows(list);
    }
  },

  /**
   * Actualiza el widget de tasa vigente con el valor más reciente
   */
  updateHeroDisplay() {
    const display = $('#tasa-vigente-display');
    if (!display) return;

    if (!this.tasasCache || this.tasasCache.length === 0) {
      display.innerHTML = `
        <span style="font-size: 0.95rem; opacity: 0.75; font-weight: 500;">
          No hay tasa registrada. Consulta el BCV para establecerla.
        </span>
      `;
      return;
    }

    const latest = this.tasasCache[0];
    const valFormatted = typeof latest.valorUSD === 'number'
      ? latest.valorUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      : String(latest.valorUSD);

    let fechaFormatted = latest.fecha || '';
    if (latest.fecha && latest.fecha.includes('-')) {
      const parts = latest.fecha.split('-');
      if (parts.length === 3) fechaFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    display.innerHTML = `
      <div class="cluster" data-gap="xs" data-align="baseline">
        <span style="color: #10b981;">${valFormatted} Bs. / USD</span>
        <span style="font-size: 0.8rem; font-weight: 500; opacity: 0.7;">(Fecha Valor: ${fechaFormatted})</span>
      </div>
    `;
  },

  /**
   * Filtra las tasas en memoria por fecha o monto
   */
  filterTable(query) {
    const term = (query || '').toLowerCase().trim();
    if (!term) {
      this.renderTableData(this.tasasCache);
      return;
    }

    const filtered = this.tasasCache.filter(item => {
      const f = (item.fecha || '').toLowerCase();
      const v = String(item.valorUSD || '').toLowerCase();
      const id = String(item.id || '');
      return f.includes(term) || v.includes(term) || id.includes(term);
    });

    this.renderTableData(filtered);
  },

  /**
   * Realiza el scraping a https://www.bcv.org.ve/
   * y coloca los valores en los campos 'fecha' y 'valorUSD' del modal
   */
  async handleScrapeBCV() {
    if (this.isScraping) return;
    this.isScraping = true;

    const btn = $('#btn-scrape-bcv');
    const icon = $('#scrape-bcv-icon');
    const text = $('#scrape-bcv-text');
    const spinner = $('#scrape-bcv-spinner');
    const msg = $('#scrape-bcv-msg');
    const fechaInput = $('#admin-tasa-fecha');
    const valorInput = $('#admin-tasa-valor');

    // Estado visual de carga
    if (btn) btn.disabled = true;
    if (icon) icon.style.display = 'none';
    if (text) text.textContent = 'Consultando BCV...';
    if (spinner) spinner.style.display = 'inline-block';
    if (msg) {
      msg.style.display = 'block';
      msg.style.background = 'rgba(2, 132, 199, 0.12)';
      msg.style.color = '#0284c7';
      msg.innerHTML = '⏳ Conectando con www.bcv.org.ve y procesando indicadores oficiales...';
    }

    try {
      const data = await bcvScraperService.fetchRate();

      // Colocar los valores en los campos de fecha y valorUSD
      if (fechaInput && data.fecha) {
        fechaInput.value = data.fecha;
      }
      if (valorInput && data.valorUSD) {
        valorInput.value = data.valorUSD;
      }

      // Mensaje de éxito
      if (msg) {
        msg.style.background = 'rgba(16, 185, 129, 0.15)';
        msg.style.color = '#047857';
        const formattedVal = data.valorUSD.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
        msg.innerHTML = `✅ <strong>Tasa BCV obtenida:</strong> ${formattedVal} Bs./USD — Fecha: ${data.fechaTexto || data.fecha}`;
      }

      notificationService.success(`Tasa BCV obtenida con éxito: ${data.valorUSD} Bs. para la fecha ${data.fecha}`);
    } catch (err) {
      console.warn('[tasaCambioController] Error en scraping:', err);

      if (msg) {
        msg.style.background = 'rgba(239, 68, 68, 0.12)';
        msg.style.color = '#dc2626';
        msg.innerHTML = `⚠️ No se pudo extraer automáticamente: ${err.message}. Puedes ingresar los valores manualmente en los campos.`;
      }

      notificationService.warning('No se pudo conectar con el portal del BCV. Ingresa la fecha y valor manualmente.');
    } finally {
      this.isScraping = false;
      if (btn) btn.disabled = false;
      if (icon) icon.style.display = 'inline-block';
      if (text) text.textContent = 'Obtener Tasa Oficial BCV';
      if (spinner) spinner.style.display = 'none';
    }
  },

  /**
   * Abre el modal en modo Creación
   */
  openCreateModal() {
    const dialog = $('#modal-tasa-form');
    if (!dialog) return;

    // Resetear formulario
    $('#admin-tasa-id').value = '';
    $('#admin-tasa-fecha').value = new Date().toISOString().split('T')[0];
    $('#admin-tasa-valor').value = '';

    const title = $('#tasa-form-title');
    if (title) title.textContent = '➕ Registrar Tasa de Cambio';

    const msg = $('#scrape-bcv-msg');
    if (msg) {
      msg.style.display = 'none';
      msg.innerHTML = '';
    }

    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  },

  /**
   * Abre el modal en modo Edición
   */
  async openEditModal(id) {
    const dialog = $('#modal-tasa-form');
    if (!dialog || !id) return;

    try {
      const item = await tasaCambioModel.getById(id);
      if (!item) {
        notificationService.error('No se encontró el registro de tasa de cambio.');
        return;
      }

      $('#admin-tasa-id').value = item.id;
      $('#admin-tasa-fecha').value = item.fecha || '';
      $('#admin-tasa-valor').value = item.valorUSD || '';

      const title = $('#tasa-form-title');
      if (title) title.textContent = `✏️ Editar Tasa de Cambio #${item.id}`;

      const msg = $('#scrape-bcv-msg');
      if (msg) {
        msg.style.display = 'none';
        msg.innerHTML = '';
      }

      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      } else {
        dialog.setAttribute('open', '');
      }
    } catch (err) {
      console.error('[tasaCambioController] Error al abrir edición:', err);
      notificationService.error(`Error al cargar datos: ${err.message}`);
    }
  },

  /**
   * Cierra el modal de tasa
   */
  closeModal() {
    const dialog = $('#modal-tasa-form');
    if (!dialog) return;

    if (typeof dialog.close === 'function') {
      dialog.close();
    } else {
      dialog.removeAttribute('open');
    }
  },

  /**
   * Guarda los datos del formulario (Crear o Actualizar)
   */
  async handleSave() {
    const idInput = $('#admin-tasa-id');
    const fechaInput = $('#admin-tasa-fecha');
    const valorInput = $('#admin-tasa-valor');
    const submitBtn = $('#btn-submit-tasa');

    const id = idInput?.value?.trim();
    const fecha = fechaInput?.value?.trim();
    const valorUSD = valorInput?.value?.trim();

    if (!fecha || !valorUSD) {
      notificationService.warning('Por favor completa los campos de Fecha y Valor USD.');
      return;
    }

    const originalBtnText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Guardando...';
    }

    try {
      if (id) {
        await tasaCambioModel.update(id, { fecha, valorUSD });
        notificationService.success('Tasa de cambio actualizada correctamente.');
      } else {
        await tasaCambioModel.create({ fecha, valorUSD });
        notificationService.success('Tasa de cambio registrada en tasa_cambio con éxito.');
      }

      this.closeModal();
      await this.loadTable();
    } catch (err) {
      console.error('[tasaCambioController] Error al guardar:', err);
      notificationService.error(`Error al guardar tasa: ${err.message}`);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
      }
    }
  },

  /**
   * Elimina un registro de tasa de cambio
   */
  async handleDelete(id, fecha) {
    if (!confirm(`¿Estás seguro de eliminar el registro de tasa de cambio del día "${fecha}" (#${id})?`)) {
      return;
    }

    try {
      await tasaCambioModel.delete(id);
      notificationService.success('Registro de tasa de cambio eliminado.');
      await this.loadTable();
    } catch (err) {
      console.error('[tasaCambioController] Error al eliminar:', err);
      notificationService.error(`Error al eliminar: ${err.message}`);
    }
  }
};
