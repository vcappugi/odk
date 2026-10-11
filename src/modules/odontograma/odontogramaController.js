/**
 * Controlador del Odontograma Clínico Gráfico
 * Gestiona la interacción con las piezas dentales, paleta de herramientas,
 * persistencia en detalle_odontograma y creación automática de entradas en historial_medico.
 */

import { odontogramaModel } from './odontogramaModel.js';
import { 
  renderToothComponent, 
  ADULT_TEETH, 
  CHILD_TEETH, 
  DENTAL_STATES 
} from './odontogramaView.js';
import { patientModel } from '../patients/patientModel.js';
import { historialController } from '../historial/historialController.js';
import { notificationService } from '../../services/notificationService.js';
import { permissionService } from '../../services/permissionService.js';
import { $ } from '../../utils/dom.js';

export const odontogramaController = {
  currentPacienteId: null,
  currentPacienteNombre: '',
  currentCitaId: null,
  activeTool: 'Caries', // Herramienta activa por defecto
  denticionMode: 'adulto', // 'adulto' | 'nino'
  odontogramaData: {}, // Mapa { [numero_pieza]: toothRecord }

  init() {
    this.bindEvents();

    // Escuchar cambios guardados en el modelo para reactividad en tiempo real
    odontogramaModel.subscribe((event) => {
      if (event.type === 'tooth_saved' && String(event.pacienteId) === String(this.currentPacienteId)) {
        this.odontogramaData[event.tooth.numero_pieza] = event.tooth;
        this.renderTeethGrid();
        this.updateKPIs();
      }
    });
  },

  bindEvents() {
    // 1. Selección de herramienta de la paleta
    document.addEventListener('click', (e) => {
      const toolBtn = e.target.closest('.btn-tool-item');
      if (toolBtn) {
        document.querySelectorAll('.btn-tool-item').forEach(b => b.classList.remove('is-active'));
        toolBtn.classList.add('is-active');
        this.activeTool = toolBtn.dataset.tool;
      }
    });

    // 2. Conmutador de Dentición (Permanente / Temporal)
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-denticion-adulto')) {
        this.setDenticionMode('adulto');
      } else if (e.target.closest('#btn-denticion-nino')) {
        this.setDenticionMode('nino');
      }
    });

    // 3. Clic directo en una cara de la pieza dental (SVG Polygon)
    document.addEventListener('click', async (e) => {
      const surfacePoly = e.target.closest('.tooth-surface-polygon');
      if (surfacePoly) {
        const toothNum = Number(surfacePoly.dataset.tooth);
        const faceKey = surfacePoly.dataset.face;
        await this.handleSurfaceClick(toothNum, faceKey);
      }
    });

    // 4. Clic en botón inspeccionar / lápiz de la pieza
    document.addEventListener('click', (e) => {
      const inspectBtn = e.target.closest('.btn-inspect-tooth') || e.target.closest('.tooth-number');
      if (inspectBtn) {
        const toothUnit = inspectBtn.closest('.tooth-unit');
        const toothNum = Number(inspectBtn.dataset.tooth || toothUnit?.dataset.tooth);
        if (toothNum) {
          this.openToothDetailModal(toothNum);
        }
      }
    });

    // 5. Envío del formulario de detalle de pieza
    document.addEventListener('submit', async (e) => {
      if (e.target && e.target.id === 'form-tooth-detail') {
        e.preventDefault();
        await this.handleSubmitToothDetail();
      }
    });

    // 6. Botón restablecer a sano en modal de detalle
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-tooth-clear')) {
        const toothNum = Number($('#tooth-detail-num')?.value);
        if (toothNum) {
          await this.clearTooth(toothNum);
          this.closeDialog('modal-tooth-detail');
        }
      }
    });

    // 7. Cerrar modales de odontograma
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-odontograma-modal')) {
        this.closeDialog('modal-odontograma');
      }
      if (e.target.closest('.btn-close-tooth-detail')) {
        this.closeDialog('modal-tooth-detail');
      }
    });

    // 8. Botón navegar hacia el Historial Médico desde el Odontograma
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-odontograma-to-historial')) {
        this.closeDialog('modal-odontograma');
        historialController.openHistorial(this.currentPacienteId, this.currentPacienteNombre, this.currentCitaId);
      }
    });
  },

  /**
   * Abre el Odontograma Gráfico para un paciente específico
   * @param {number|string} pacienteId
   * @param {string} pacienteNombre
   * @param {number|string|null} optionalCitaId
   */
  async openOdontograma(pacienteId, pacienteNombre = '', optionalCitaId = null) {
    if (!pacienteId) {
      notificationService.warning('Seleccione un paciente para ver su odontograma.');
      return;
    }

    if (!permissionService.canRead('modal-odontograma')) {
      notificationService.warning('Tu rol no tiene permiso para consultar el odontograma.');
      return;
    }

    this.currentPacienteId = pacienteId;
    this.currentPacienteNombre = pacienteNombre;
    this.currentCitaId = optionalCitaId || null;

    // Obtener nombre si no fue suministrado
    if (!pacienteNombre) {
      try {
        const p = await patientModel.getById(pacienteId);
        if (p) this.currentPacienteNombre = p.nombre || `Paciente #${pacienteId}`;
      } catch {
        this.currentPacienteNombre = `Paciente #${pacienteId}`;
      }
    }

    // Actualizar badges
    const badge = $('#odontograma-patient-badge');
    if (badge) badge.textContent = this.currentPacienteNombre || `Paciente #${pacienteId}`;

    // Cargar odontograma desde modelo
    this.odontogramaData = await odontogramaModel.getOdontogramaByPaciente(pacienteId);

    // Renderizar cuadrantes
    this.renderTeethGrid();
    this.updateKPIs();

    // Mostrar modal
    const dialog = $('#modal-odontograma');
    if (dialog) dialog.showModal();
  },

  /**
   * Cambia el modo de dentición (Adulto / Niño)
   */
  setDenticionMode(mode) {
    this.denticionMode = mode;
    const btnAdulto = $('#btn-denticion-adulto');
    const btnNino = $('#btn-denticion-nino');
    const adultGrid = $('#odontograma-adult-container');
    const childGrid = $('#odontograma-child-container');

    if (mode === 'adulto') {
      if (btnAdulto) { btnAdulto.setAttribute('data-paint', 'primary'); btnAdulto.removeAttribute('data-variant'); }
      if (btnNino) { btnNino.setAttribute('data-variant', 'ghost'); btnNino.removeAttribute('data-paint'); }
      if (adultGrid) adultGrid.style.display = 'flex';
      if (childGrid) childGrid.style.display = 'none';
    } else {
      if (btnNino) { btnNino.setAttribute('data-paint', 'primary'); btnNino.removeAttribute('data-variant'); }
      if (btnAdulto) { btnAdulto.setAttribute('data-variant', 'ghost'); btnAdulto.removeAttribute('data-paint'); }
      if (adultGrid) adultGrid.style.display = 'none';
      if (childGrid) childGrid.style.display = 'flex';
    }

    this.renderTeethGrid();
  },

  /**
   * Renderiza las arcadas completas según el estado actual
   */
  renderTeethGrid() {
    if (this.denticionMode === 'adulto') {
      const q1 = $('#quadrant-1-teeth');
      const q2 = $('#quadrant-2-teeth');
      const q4 = $('#quadrant-4-teeth');
      const q3 = $('#quadrant-3-teeth');

      if (q1) q1.innerHTML = ADULT_TEETH.Q1.map(t => renderToothComponent(t, this.odontogramaData[t], true)).join('');
      if (q2) q2.innerHTML = ADULT_TEETH.Q2.map(t => renderToothComponent(t, this.odontogramaData[t], true)).join('');
      if (q4) q4.innerHTML = ADULT_TEETH.Q4.map(t => renderToothComponent(t, this.odontogramaData[t], false)).join('');
      if (q3) q3.innerHTML = ADULT_TEETH.Q3.map(t => renderToothComponent(t, this.odontogramaData[t], false)).join('');
    } else {
      const q5 = $('#quadrant-5-teeth');
      const q6 = $('#quadrant-6-teeth');
      const q8 = $('#quadrant-8-teeth');
      const q7 = $('#quadrant-7-teeth');

      if (q5) q5.innerHTML = CHILD_TEETH.Q5.map(t => renderToothComponent(t, this.odontogramaData[t], true)).join('');
      if (q6) q6.innerHTML = CHILD_TEETH.Q6.map(t => renderToothComponent(t, this.odontogramaData[t], true)).join('');
      if (q8) q8.innerHTML = CHILD_TEETH.Q8.map(t => renderToothComponent(t, this.odontogramaData[t], false)).join('');
      if (q7) q7.innerHTML = CHILD_TEETH.Q7.map(t => renderToothComponent(t, this.odontogramaData[t], false)).join('');
    }
  },

  /**
   * Actualiza el resumen de métricas clínicas del odontograma
   */
  updateKPIs() {
    let cariesCount = 0;
    let resinasCount = 0;
    let ausentesCount = 0;
    let protesisCount = 0;

    Object.values(this.odontogramaData).forEach(t => {
      const est = (t.estado_inicial || '').toLowerCase();
      if (est === 'caries') cariesCount++;
      else if (est === 'resina' || est === 'amalgama' || est === 'sellante') resinasCount++;
      else if (est === 'ausente' || est === 'extracción indicada') ausentesCount++;
      else if (est === 'corona' || est === 'endodoncia' || est === 'implante') protesisCount++;
    });

    const kpiC = $('#kpi-caries');
    const kpiR = $('#kpi-resinas');
    const kpiA = $('#kpi-ausentes');
    const kpiP = $('#kpi-protesis');

    if (kpiC) kpiC.textContent = `🔴 Caries: ${cariesCount}`;
    if (kpiR) kpiR.textContent = `🔵 Obturados: ${resinasCount}`;
    if (kpiA) kpiA.textContent = `❌ Ausentes: ${ausentesCount}`;
    if (kpiP) kpiP.textContent = `👑 Coronas/Endo: ${protesisCount}`;
  },

  /**
   * Maneja el clic directo sobre una cara o pieza dental
   */
  async handleSurfaceClick(toothNum, faceKey) {
    if (!permissionService.canWrite('modal-odontograma')) {
      notificationService.warning('Tu rol no tiene permiso para modificar el odontograma.');
      return;
    }

    // Si la herramienta activa es inspeccionar, abrir modal detallado
    if (this.activeTool === 'INSPECT') {
      this.openToothDetailModal(toothNum);
      return;
    }

    // Si la herramienta activa es "Sano", limpiar pieza
    if (this.activeTool === 'Sano') {
      await this.clearTooth(toothNum);
      return;
    }

    const currentRecord = this.odontogramaData[toothNum] || {};
    const currentFaces = (currentRecord.caras_afectadas || '')
      .split(',')
      .map(f => f.trim().toUpperCase())
      .filter(Boolean);

    let newFaces = [...currentFaces];
    let newEstado = this.activeTool;
    let newTratamiento = '';

    // Si es una condición de diente completo
    if (['Ausente', 'Extracción Indicada', 'Corona', 'Endodoncia', 'Implante'].includes(this.activeTool)) {
      newFaces = [];
      if (this.activeTool === 'Ausente') newTratamiento = 'Exodoncia previa';
      else if (this.activeTool === 'Extracción Indicada') newTratamiento = 'Exodoncia indicada';
      else if (this.activeTool === 'Corona') newTratamiento = 'Rehabilitación con corona protésica';
      else if (this.activeTool === 'Endodoncia') newTratamiento = 'Tratamiento endodóntico';
      else if (this.activeTool === 'Implante') newTratamiento = 'Implante dental osteointegrado';
    } else {
      // Condición de superficie (Caries, Resina, Amalgama, Sellante)
      if (newFaces.includes(faceKey)) {
        // Si ya tenía esa cara marcada con el mismo estado, la quitamos
        if (currentRecord.estado_inicial === this.activeTool) {
          newFaces = newFaces.filter(f => f !== faceKey);
        }
      } else {
        newFaces.push(faceKey);
      }

      if (newFaces.length === 0) {
        newEstado = 'Sano';
        newTratamiento = 'Pieza sana';
      } else {
        if (this.activeTool === 'Caries') newTratamiento = 'Operatoría dental requerida (Restauración)';
        else if (this.activeTool === 'Resina') newTratamiento = 'Restauración con resina compuesta';
        else if (this.activeTool === 'Amalgama') newTratamiento = 'Restauración con amalgama dental';
        else if (this.activeTool === 'Sellante') newTratamiento = 'Sellante de fosas y fisuras';
      }
    }

    const payload = {
      numero_pieza: toothNum,
      caras_afectadas: newFaces.join(','),
      estado_inicial: newEstado,
      tratamiento: newTratamiento,
      observacion: `Aplicado mediante herramienta rápida: ${this.activeTool}`
    };

    try {
      // Guardar en odontograma y registrar automáticamente en historial médico
      await odontogramaModel.saveTooth(this.currentPacienteId, payload, {
        citaId: this.currentCitaId
      });

      notificationService.success(`Pieza #${toothNum} actualizada y registrada en el Historial Médico.`);
    } catch (err) {
      console.error('[OdontogramaController] Error al guardar pieza:', err);
      notificationService.error('Error al actualizar odontograma: ' + err.message);
    }
  },

  /**
   * Abre el modal de inspección y edición detallada de la pieza
   */
  openToothDetailModal(toothNum) {
    const dialog = $('#modal-tooth-detail');
    if (!dialog) return;

    const record = this.odontogramaData[toothNum] || {};
    const faces = (record.caras_afectadas || '').split(',').map(f => f.trim().toUpperCase());

    $('#tooth-detail-num').value = toothNum;
    $('#tooth-detail-title').textContent = `Diagnóstico Clínico · Pieza #${toothNum}`;
    $('#tooth-detail-subtitle').textContent = this.getToothAnatomyName(toothNum);

    // Marcar checkboxes de caras
    ['O', 'M', 'D', 'V', 'P'].forEach(faceKey => {
      const chk = $(`#face-chk-${faceKey}`);
      if (chk) chk.checked = faces.includes(faceKey);
    });

    const isUpper = toothNum < 30 || (toothNum >= 50 && toothNum < 70);
    const pLabel = $('#face-chk-P-label');
    if (pLabel) pLabel.textContent = isUpper ? 'Palatino (P)' : 'Lingual (L)';

    // Diagnóstico
    const estadoSelect = $('#tooth-field-estado');
    if (estadoSelect) estadoSelect.value = record.estado_inicial || 'Sano';

    // Tratamiento
    const tratInput = $('#tooth-field-tratamiento');
    if (tratInput) tratInput.value = record.tratamiento || '';

    // Observaciones
    const obsInput = $('#tooth-field-observacion');
    if (obsInput) obsInput.value = record.observacion || '';

    // Deshabilitar formulario si es modo solo lectura
    const canWrite = permissionService.canWrite('modal-odontograma');
    const form = $('#form-tooth-detail');
    if (form) {
      form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = !canWrite);
    }
    const saveBtn = $('#btn-submit-tooth-detail');
    if (saveBtn) saveBtn.style.display = canWrite ? 'inline-flex' : 'none';
    const clearBtn = $('#btn-tooth-clear');
    if (clearBtn) clearBtn.style.display = canWrite ? 'inline-flex' : 'none';

    dialog.showModal();
  },

  /**
   * Procesa el formulario detallado de la pieza
   */
  async handleSubmitToothDetail() {
    const toothNum = Number($('#tooth-detail-num')?.value);
    const estado = $('#tooth-field-estado')?.value || 'Sano';
    const tratamiento = $('#tooth-field-tratamiento')?.value?.trim();
    const observacion = $('#tooth-field-observacion')?.value?.trim();

    // Recoger caras seleccionadas
    const selectedFaces = [];
    document.querySelectorAll('#tooth-faces-checkboxes input[name="tooth_face"]:checked').forEach(c => {
      selectedFaces.push(c.value);
    });

    const payload = {
      numero_pieza: toothNum,
      caras_afectadas: selectedFaces.join(','),
      estado_inicial: estado,
      tratamiento: tratamiento,
      observacion: observacion
    };

    const submitBtn = $('#btn-submit-tooth-detail');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Guardando...'; }

    try {
      await odontogramaModel.saveTooth(this.currentPacienteId, payload, {
        citaId: this.currentCitaId
      });

      this.closeDialog('modal-tooth-detail');
      notificationService.success(`Pieza #${toothNum} actualizada y registrada en el Historial Médico.`);
    } catch (err) {
      console.error('[OdontogramaController] Error:', err);
      notificationService.error('Error al guardar: ' + err.message);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '💾 Guardar en Odontograma e Historial'; }
    }
  },

  /**
   * Restablece una pieza a estado Sano
   */
  async clearTooth(toothNum) {
    try {
      await odontogramaModel.clearTooth(this.currentPacienteId, toothNum, {
        citaId: this.currentCitaId
      });
      notificationService.success(`Pieza #${toothNum} restablecida a Sana y registrada en el Historial Médico.`);
    } catch (err) {
      notificationService.error('Error al restablecer pieza: ' + err.message);
    }
  },

  closeDialog(dialogId) {
    const dialog = $(`#${dialogId}`);
    if (dialog && dialog.open) dialog.close();
  },

  /**
   * Retorna el nombre anatómico odontológico según el número FDI
   */
  getToothAnatomyName(num) {
    const quadrant = Math.floor(num / 10);
    const position = num % 10;
    
    const quadNames = {
      1: 'Superior Derecho',
      2: 'Superior Izquierdo',
      3: 'Inferior Izquierdo',
      4: 'Inferior Derecho',
      5: 'Temporal Sup. Derecho',
      6: 'Temporal Sup. Izquierdo',
      7: 'Temporal Inf. Izquierdo',
      8: 'Temporal Inf. Derecho'
    };

    const toothNames = {
      1: 'Incisivo Central',
      2: 'Incisivo Lateral',
      3: 'Canino',
      4: 'Primer Premolar',
      5: 'Segundo Premolar',
      6: 'Primer Molar',
      7: 'Segundo Molar',
      8: 'Tercer Molar (Cordal)'
    };

    return `${toothNames[position] || 'Diente'} ${quadNames[quadrant] || ''}`;
  }
};
