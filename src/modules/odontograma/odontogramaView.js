/**
 * Vista del Odontograma Clínico Gráfico Interactivo (FDI)
 * ODONTOKRIS - Sistema Odontológico
 * 
 * Basado en la nomenclatura FDI (Federación Dental Internacional)
 * Arcadas Superior e Inferior con 5 caras por pieza dental:
 * Vestibular (V), Palatino/Lingual (P/L), Mesial (M), Distal (D), Oclusal/Incisal (O/I)
 */

// Definición de piezas dentales permanentes (adultos)
export const ADULT_TEETH = {
  // Cuadrante 1: Superior Derecho (18 al 11)
  Q1: [18, 17, 16, 15, 14, 13, 12, 11],
  // Cuadrante 2: Superior Izquierdo (21 al 28)
  Q2: [21, 22, 23, 24, 25, 26, 27, 28],
  // Cuadrante 4: Inferior Derecho (48 al 41)
  Q4: [48, 47, 46, 45, 44, 43, 42, 41],
  // Cuadrante 3: Inferior Izquierdo (31 al 38)
  Q3: [31, 32, 33, 34, 35, 36, 37, 38]
};

// Definición de piezas dentales temporales (niños / dentición decidua)
export const CHILD_TEETH = {
  Q5: [55, 54, 53, 52, 51],
  Q6: [61, 62, 63, 64, 65],
  Q8: [85, 84, 83, 82, 81],
  Q7: [71, 72, 73, 74, 75]
};

// Catálogo de estados odontológicos y convenciones de color
export const DENTAL_STATES = {
  CARIES: { id: 'Caries', label: 'Caries', color: '#ef4444', type: 'surface', icon: '🔴' },
  RESINA: { id: 'Resina', label: 'Obturación (Resina)', color: '#0ea5e9', type: 'surface', icon: '🔵' },
  AMALGAMA: { id: 'Amalgama', label: 'Amalgama', color: '#64748b', type: 'surface', icon: '⚪' },
  SELLANTE: { id: 'Sellante', label: 'Sellante', color: '#10b981', type: 'surface', icon: '🛡️' },
  AUSENTE: { id: 'Ausente', label: 'Diente Ausente', color: '#374151', type: 'whole', icon: '❌' },
  EXTRACCION: { id: 'Extracción Indicada', label: 'Extracción Indicada', color: '#dc2626', type: 'whole', icon: '🔺' },
  CORONA: { id: 'Corona', label: 'Corona / Prótesis', color: '#f59e0b', type: 'whole', icon: '👑' },
  ENDODONCIA: { id: 'Endodoncia', label: 'Endodoncia', color: '#8b5cf6', type: 'whole', icon: '⚡' },
  IMPLANTE: { id: 'Implante', label: 'Implante', color: '#06b6d4', type: 'whole', icon: '🔩' },
  FRACTURA: { id: 'Fractura', label: 'Fractura', color: '#e11d48', type: 'whole', icon: '⚡' },
  SANO: { id: 'Sano', label: 'Sano / Limpiar', color: '#ffffff', type: 'clear', icon: '✨' }
};

/**
 * Renderiza el modal principal del Odontograma Gráfico
 */
export function renderOdontogramaModal() {
  return `
    <!-- Modal Principal del Odontograma Gráfico -->
    <dialog id="modal-odontograma" class="dialog custom-modal modal-wide" aria-labelledby="odontograma-modal-title" style="max-width: 1120px; width: 98vw;">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="md" style="padding: 1.25rem;">
        
        <!-- Cabecera del Modal -->
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="font-size: 1.5rem;">🦷</span>
            <div>
              <div class="cluster" data-gap="xs" data-align="center">
                <h3 id="odontograma-modal-title" style="margin: 0; font-size: 1.25rem;">Odontograma Clínico Gráfico</h3>
                <span id="odontograma-patient-badge" class="badge" data-paint="primary" style="font-weight: 600; font-size: 0.85rem;">
                  Paciente
                </span>
                <span id="odontograma-record-badge" class="badge" data-paint="neutral" style="font-size: 0.75rem;">
                  Ficha Odontológica Única
                </span>
              </div>
              <small style="opacity: 0.75; font-size: 0.8rem;">
                Cada cambio realizado en este odontograma se registrará automáticamente en el <strong>Historial Médico</strong> del paciente
              </small>
            </div>
          </div>

          <div class="cluster" data-gap="xs">
            <button type="button" id="btn-odontograma-to-historial" class="button" data-variant="outlined" data-size="sm" title="Ver historial médico completo de este paciente">
              📋 Ver Historial Médico
            </button>
            <button type="button" class="button btn-close-odontograma-modal" data-variant="ghost" data-size="sm" aria-label="Cerrar modal">✕</button>
          </div>
        </header>

        <!-- Barra de Herramientas y Paleta Odontológica Activa -->
        <div class="odontograma-toolbar-box box stack" data-surface="sunken" data-border data-gap="xs" style="padding: 0.75rem; border-radius: 8px;">
          <div class="cluster" data-justify="between" data-align="center" style="flex-wrap: wrap; gap: 0.5rem;">
            
            <!-- Selector de Dentición (Permanente / Temporal) -->
            <div class="cluster" data-gap="2xs" data-align="center">
              <span style="font-size: 0.82rem; font-weight: 600; opacity: 0.85;">Dentición:</span>
              <div class="cluster" data-gap="2xs" role="tablist">
                <button type="button" id="btn-denticion-adulto" class="button btn-denticion-toggle" data-paint="primary" data-size="sm">
                  Permanente (32)
                </button>
                <button type="button" id="btn-denticion-nino" class="button btn-denticion-toggle" data-variant="ghost" data-size="sm">
                  Temporal / Infantil (20)
                </button>
              </div>
            </div>

            <!-- Resumen Estadístico Rápido de la Dentadura -->
            <div id="odontograma-kpis-bar" class="cluster" data-gap="xs" style="font-size: 0.75rem;">
              <span class="badge" style="background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3);" id="kpi-caries">
                🔴 Caries: 0
              </span>
              <span class="badge" style="background: rgba(14,165,233,0.15); color: #0ea5e9; border: 1px solid rgba(14,165,233,0.3);" id="kpi-resinas">
                🔵 Obturados: 0
              </span>
              <span class="badge" style="background: rgba(100,116,139,0.15); color: #64748b; border: 1px solid rgba(100,116,139,0.3);" id="kpi-ausentes">
                ❌ Ausentes: 0
              </span>
              <span class="badge" style="background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3);" id="kpi-protesis">
                👑 Coronas/Endo: 0
              </span>
            </div>

          </div>

          <!-- Paleta Dental de Herramientas Rápidas (Click-to-Paint) -->
          <div class="dental-palette-bar cluster" data-gap="2xs" data-align="center" style="margin-top: 0.4rem; padding-top: 0.4rem; border-top: 1px solid rgba(125,125,125,0.15); flex-wrap: wrap;">
            <span style="font-size: 0.78rem; font-weight: 600; opacity: 0.85; margin-right: 0.25rem;">Herramienta Activa:</span>
            
            <button type="button" class="button btn-tool-item is-active" data-tool="Caries" data-size="sm" title="Marcar caries en las caras seleccionadas (Rojo)" style="border-left: 4px solid #ef4444;">
              🔴 Caries
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Resina" data-size="sm" title="Marcar obturación con resina (Azul)" style="border-left: 4px solid #0ea5e9;">
              🔵 Resina
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Amalgama" data-size="sm" title="Marcar obturación con amalgama" style="border-left: 4px solid #64748b;">
              ⚪ Amalgama
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Sellante" data-size="sm" title="Marcar sellante preventivo (Verde)" style="border-left: 4px solid #10b981;">
              🛡️ Sellante
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Ausente" data-size="sm" title="Marcar diente ausente / extraído (Cruz Negra)" style="border-left: 4px solid #374151;">
              ❌ Ausente
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Extracción Indicada" data-size="sm" title="Marcar diente para extracción quirúrgica" style="border-left: 4px solid #dc2626;">
              🔺 Extracción
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Corona" data-size="sm" title="Marcar corona protésica" style="border-left: 4px solid #f59e0b;">
              👑 Corona
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Endodoncia" data-size="sm" title="Marcar tratamiento de conducto" style="border-left: 4px solid #8b5cf6;">
              ⚡ Endodoncia
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Implante" data-size="sm" title="Marcar implante oseointegrado" style="border-left: 4px solid #06b6d4;">
              🔩 Implante
            </button>
            <button type="button" class="button btn-tool-item" data-tool="Sano" data-size="sm" title="Restablecer cara o diente a estado sano" style="border-left: 4px solid #94a3b8;">
              ✨ Sano / Limpiar
            </button>
            <button type="button" class="button btn-tool-item" data-tool="INSPECT" data-size="sm" title="Inspección detallada con diagnóstico y notas" style="border-left: 4px solid var(--primary, #0ea5e9);">
              ✏️ Inspeccionar
            </button>
          </div>
        </div>

        <!-- CONTENEDOR PRINCIPAL DEL ODONTOGRAMA GRÁFICO (ARCADAS SUPERIOR E INFERIOR) -->
        <div class="odontograma-canvas-wrapper box" data-surface="sunken" data-border style="padding: 1rem; border-radius: 8px; overflow-x: auto;">
          
          <div id="odontograma-adult-container" class="odontograma-teeth-grid stack" data-gap="md">
            
            <!-- 1. ARCADA SUPERIOR (MAXILAR) -->
            <div class="arch-section stack" data-gap="2xs">
              <div class="cluster" data-justify="between" data-align="center" style="padding: 0 0.5rem;">
                <span class="arch-tag badge" data-paint="neutral" style="font-size: 0.72rem; font-weight: 700;">
                  MAXILAR SUPERIOR · CUADRANTE 1 (DERECHO)
                </span>
                <span style="font-size: 0.75rem; font-weight: 600; opacity: 0.6; text-transform: uppercase;">
                  LÍNEA MEDIA MAXILAR
                </span>
                <span class="arch-tag badge" data-paint="neutral" style="font-size: 0.72rem; font-weight: 700;">
                  MAXILAR SUPERIOR · CUADRANTE 2 (IZQUIERDO)
                </span>
              </div>

              <!-- Fila de Dientes Superiores (18-11 y 21-28) -->
              <div class="teeth-row cluster" data-justify="center" data-align="center" style="gap: 4px; padding-bottom: 0.5rem;">
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-1-teeth">
                  <!-- Se inyectan piezas 18 al 11 -->
                </div>
                <div class="midline-divider" style="width: 2px; height: 75px; background: rgba(14,165,233,0.4); margin: 0 6px;"></div>
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-2-teeth">
                  <!-- Se inyectan piezas 21 al 28 -->
                </div>
              </div>
            </div>

            <!-- Separador Central de Oclusión -->
            <div class="occlusion-plane-divider cluster" data-justify="center" data-align="center" style="opacity: 0.4; font-size: 0.7rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
              <span>──── PLANO DE OCLUSIÓN DENTAL ────</span>
            </div>

            <!-- 2. ARCADA INFERIOR (MANDIBULAR) -->
            <div class="arch-section stack" data-gap="2xs">
              <!-- Fila de Dientes Inferiores (48-41 y 31-38) -->
              <div class="teeth-row cluster" data-justify="center" data-align="center" style="gap: 4px; padding-top: 0.5rem;">
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-4-teeth">
                  <!-- Se inyectan piezas 48 al 41 -->
                </div>
                <div class="midline-divider" style="width: 2px; height: 75px; background: rgba(14,165,233,0.4); margin: 0 6px;"></div>
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-3-teeth">
                  <!-- Se inyectan piezas 31 al 38 -->
                </div>
              </div>

              <div class="cluster" data-justify="between" data-align="center" style="padding: 0 0.5rem;">
                <span class="arch-tag badge" data-paint="neutral" style="font-size: 0.72rem; font-weight: 700;">
                  MANDÍBULA INFERIOR · CUADRANTE 4 (DERECHO)
                </span>
                <span style="font-size: 0.75rem; font-weight: 600; opacity: 0.6; text-transform: uppercase;">
                  LÍNEA MEDIA MANDIBULAR
                </span>
                <span class="arch-tag badge" data-paint="neutral" style="font-size: 0.72rem; font-weight: 700;">
                  MANDÍBULA INFERIOR · CUADRANTE 3 (IZQUIERDO)
                </span>
              </div>
            </div>

          </div>

          <!-- CONTENEDOR INFANTIL / TEMPORAL (OCULTO POR DEFECTO) -->
          <div id="odontograma-child-container" class="odontograma-teeth-grid stack" data-gap="md" style="display: none;">
            <!-- Arcada Superior Infantil (55-51 | 61-65) -->
            <div class="arch-section stack" data-gap="2xs">
              <div class="teeth-row cluster" data-justify="center" data-align="center" style="gap: 4px;">
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-5-teeth"></div>
                <div class="midline-divider" style="width: 2px; height: 75px; background: rgba(14,165,233,0.4); margin: 0 6px;"></div>
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-6-teeth"></div>
              </div>
            </div>

            <div class="occlusion-plane-divider cluster" data-justify="center" data-align="center" style="opacity: 0.4; font-size: 0.7rem; font-weight: 700; letter-spacing: 2px;">
              <span>──── PLANO OCLUSAL INFANTIL ────</span>
            </div>

            <!-- Arcada Inferior Infantil (85-81 | 71-75) -->
            <div class="arch-section stack" data-gap="2xs">
              <div class="teeth-row cluster" data-justify="center" data-align="center" style="gap: 4px;">
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-8-teeth"></div>
                <div class="midline-divider" style="width: 2px; height: 75px; background: rgba(14,165,233,0.4); margin: 0 6px;"></div>
                <div class="quadrant-group cluster" data-gap="2xs" id="quadrant-7-teeth"></div>
              </div>
            </div>
          </div>

        </div>

        <!-- Leyenda Clínica y Pie de Modal -->
        <footer class="cluster modal-footer" data-justify="between" data-align="center" style="border-top: 1px solid rgba(125,125,125,0.15); padding-top: 0.5rem; flex-wrap: wrap;">
          <div class="cluster" data-gap="sm" data-align="center" style="font-size: 0.75rem; opacity: 0.85;">
            <span><strong>Convenciones:</strong></span>
            <span>🔴 Caries Activa</span>
            <span>🔵 Obturación Resina</span>
            <span>⚪ Amalgama</span>
            <span>❌ Ausente</span>
            <span>🔺 Extracción</span>
            <span>👑 Corona</span>
            <span>⚡ Endodoncia</span>
            <span>🛡️ Sellante</span>
          </div>

          <div class="cluster" data-gap="xs">
            <button type="button" class="button btn-close-odontograma-modal" data-variant="ghost">Cerrar</button>
          </div>
        </footer>

      </div>
    </dialog>

    <!-- Modal Secundario: Inspección / Diagnóstico Detallado de una Pieza Dental -->
    <dialog id="modal-tooth-detail" class="dialog custom-modal" aria-labelledby="tooth-detail-title" style="max-width: 520px; width: 92vw;">
      <div class="modal-box box stack" data-surface="raised" data-border data-gap="sm">
        
        <header class="modal-header cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="xs" data-align="center">
            <span class="modal-icon-badge" style="font-size: 1.3rem;">🦷</span>
            <div>
              <h3 id="tooth-detail-title" style="margin: 0; font-size: 1.15rem;">Diagnóstico Pieza #16</h3>
              <small id="tooth-detail-subtitle" style="opacity: 0.75; font-size: 0.78rem;">Primer Molar Superior Derecho</small>
            </div>
          </div>
          <button type="button" class="button btn-close-tooth-detail" data-variant="ghost" data-size="sm" aria-label="Cerrar">✕</button>
        </header>

        <form id="form-tooth-detail" class="stack" data-gap="sm">
          <input type="hidden" id="tooth-detail-num" value="" />

          <!-- Selección de Caras Anatómicas Afectadas -->
          <div class="field">
            <label class="label" style="font-size: 0.82rem; margin-bottom: 0.25rem;">Caras Afectadas / Involucradas:</label>
            <div class="cluster" data-gap="xs" style="flex-wrap: wrap;" id="tooth-faces-checkboxes">
              <label class="cluster" data-gap="2xs" style="font-size: 0.8rem; cursor: pointer;">
                <input type="checkbox" name="tooth_face" value="O" id="face-chk-O" />
                <span>Oclusal / Incisal (O)</span>
              </label>
              <label class="cluster" data-gap="2xs" style="font-size: 0.8rem; cursor: pointer;">
                <input type="checkbox" name="tooth_face" value="M" id="face-chk-M" />
                <span>Mesial (M)</span>
              </label>
              <label class="cluster" data-gap="2xs" style="font-size: 0.8rem; cursor: pointer;">
                <input type="checkbox" name="tooth_face" value="D" id="face-chk-D" />
                <span>Distal (D)</span>
              </label>
              <label class="cluster" data-gap="2xs" style="font-size: 0.8rem; cursor: pointer;">
                <input type="checkbox" name="tooth_face" value="V" id="face-chk-V" />
                <span>Vestibular (V)</span>
              </label>
              <label class="cluster" data-gap="2xs" style="font-size: 0.8rem; cursor: pointer;">
                <input type="checkbox" name="tooth_face" value="P" id="face-chk-P" />
                <span id="face-chk-P-label">Palatino / Lingual (P)</span>
              </label>
            </div>
          </div>

          <!-- Diagnóstico Clínico / Estado Inicial -->
          <div class="field">
            <label for="tooth-field-estado" class="label" style="font-size: 0.82rem; margin-bottom: 0.2rem;">Diagnóstico / Estado Dental *</label>
            <select id="tooth-field-estado" class="input input-compact" required>
              <option value="Sano">✨ Sano (Sin patología activa)</option>
              <option value="Caries">🔴 Caries Dental Activa</option>
              <option value="Resina">🔵 Obturación previa con Resina</option>
              <option value="Amalgama">⚪ Obturación previa con Amalgama</option>
              <option value="Ausente">❌ Diente Ausente / Extraído</option>
              <option value="Extracción Indicada">🔺 Indicado para Extracción</option>
              <option value="Corona">👑 Corona Fija / Prótesis</option>
              <option value="Endodoncia">⚡ Tratamiento de Conducto (Endodoncia)</option>
              <option value="Implante">🔩 Implante Dental</option>
              <option value="Fractura">⚡ Fractura Dental</option>
              <option value="Sellante">🛡️ Sellante Preventivo</option>
            </select>
          </div>

          <!-- Procedimiento / Tratamiento Realizado o Indicado -->
          <div class="field">
            <label for="tooth-field-tratamiento" class="label" style="font-size: 0.82rem; margin-bottom: 0.2rem;">Tratamiento Realizado / Indicado *</label>
            <input type="text" id="tooth-field-tratamiento" class="input input-compact" placeholder="Ej. Restauración clase II con resina compuesta fotocurada..." required />
          </div>

          <!-- Observaciones Clínicas -->
          <div class="field">
            <label for="tooth-field-observacion" class="label" style="font-size: 0.82rem; margin-bottom: 0.2rem;">Observaciones Clínicas</label>
            <textarea id="tooth-field-observacion" class="input input-compact" rows="2" placeholder="Ej. Sensibilidad al frío, cavitación profunda en cara oclusal..."></textarea>
          </div>

          <!-- Pie del Formulario -->
          <footer class="cluster modal-footer" data-justify="between" data-align="center" style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(125,125,125,0.15);">
            <button type="button" id="btn-tooth-clear" class="button" data-variant="outlined" data-size="sm" style="color: #64748b;">
              ✨ Restablecer a Sano
            </button>
            <div class="cluster" data-gap="xs">
              <button type="button" class="button btn-close-tooth-detail" data-variant="ghost" data-size="sm">Cancelar</button>
              <button type="submit" id="btn-submit-tooth-detail" class="button" data-paint="primary" data-size="sm">
                💾 Guardar en Odontograma e Historial
              </button>
            </div>
          </footer>
        </form>

      </div>
    </dialog>
  `;
}

/**
 * Genera el SVG geométrico de una pieza dental individual
 * @param {number} toothNum - Número FDI de la pieza (ej. 16, 21, 36)
 * @param {Object} toothData - Estado del diente de detalle_odontograma
 * @param {boolean} isUpper - Si es maxilar superior (true) o inferior (false)
 */
export function renderToothComponent(toothNum, toothData = null, isUpper = true) {
  const faces = (toothData?.caras_afectadas || '').split(',').map(f => f.trim().toUpperCase());
  const estado = toothData?.estado_inicial || 'Sano';
  const isAusente = estado === 'Ausente';
  const isExtraccion = estado === 'Extracción Indicada';
  const isCorona = estado === 'Corona';
  const isEndodoncia = estado === 'Endodoncia';
  const isImplante = estado === 'Implante';
  const isFractura = estado === 'Fractura';

  // Obtener color para cada cara según el diagnóstico
  const getColorForFace = (faceKey) => {
    if (!faces.includes(faceKey)) return 'var(--tooth-bg-normal, #f8fafc)';
    if (estado === 'Caries') return '#ef4444';
    if (estado === 'Resina') return '#0ea5e9';
    if (estado === 'Amalgama') return '#64748b';
    if (estado === 'Sellante') return '#10b981';
    return '#0ea5e9';
  };

  const topFaceKey = isUpper ? 'V' : 'L'; // Superior = Vestibular en maxilar, Lingual en mandíbula
  const bottomFaceKey = isUpper ? 'P' : 'V'; // Inferior = Palatino en maxilar, Vestibular en mandíbula
  const leftFaceKey = (toothNum < 20 || (toothNum >= 40 && toothNum < 50) || toothNum >= 80) ? 'D' : 'M';
  const rightFaceKey = (toothNum < 20 || (toothNum >= 40 && toothNum < 50) || toothNum >= 80) ? 'M' : 'D';

  const colorTop = getColorForFace(topFaceKey);
  const colorBottom = getColorForFace(bottomFaceKey);
  const colorLeft = getColorForFace(leftFaceKey);
  const colorRight = getColorForFace(rightFaceKey);
  const colorCenter = getColorForFace('O');

  const crownBorder = isCorona ? 'stroke="#f59e0b" stroke-width="2.5"' : '';

  return `
    <div class="tooth-unit stack" data-gap="2xs" data-tooth="${toothNum}" style="align-items: center; width: 52px; user-select: none;">
      <!-- Número de la Pieza (FDI) -->
      ${isUpper ? `
        <span class="tooth-number badge" style="font-size: 0.72rem; font-weight: 700; padding: 1px 5px; cursor: pointer;" title="Inspeccionar pieza #${toothNum}">
          ${toothNum}
        </span>
      ` : ''}

      <!-- Contenedor SVG Interactivo de 5 Caras -->
      <div class="tooth-svg-box" style="position: relative; width: 44px; height: 44px; cursor: pointer;">
        <svg viewBox="0 0 44 44" width="44" height="44" class="tooth-svg" style="display: block; overflow: visible; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));">
          <!-- Borde exterior de corona si aplica -->
          ${isCorona ? `<rect x="0" y="0" width="44" height="44" fill="none" rx="4" ${crownBorder} stroke-dasharray="3,2" />` : ''}

          <!-- Cara Superior (Vestibular/Lingual) -->
          <polygon 
            points="0,0 44,0 33,11 11,11" 
            fill="${colorTop}" 
            stroke="#94a3b8" 
            stroke-width="1"
            class="tooth-surface-polygon"
            data-tooth="${toothNum}" 
            data-face="${topFaceKey}"
          >
            <title>Pieza #${toothNum} - Cara ${topFaceKey} (${topFaceKey === 'V' ? 'Vestibular' : 'Lingual'})</title>
          </polygon>

          <!-- Cara Inferior (Palatino/Vestibular) -->
          <polygon 
            points="11,33 33,33 44,44 0,44" 
            fill="${colorBottom}" 
            stroke="#94a3b8" 
            stroke-width="1"
            class="tooth-surface-polygon"
            data-tooth="${toothNum}" 
            data-face="${bottomFaceKey}"
          >
            <title>Pieza #${toothNum} - Cara ${bottomFaceKey} (${bottomFaceKey === 'P' ? 'Palatino' : 'Vestibular'})</title>
          </polygon>

          <!-- Cara Izquierda (Mesial/Distal) -->
          <polygon 
            points="0,0 11,11 11,33 0,44" 
            fill="${colorLeft}" 
            stroke="#94a3b8" 
            stroke-width="1"
            class="tooth-surface-polygon"
            data-tooth="${toothNum}" 
            data-face="${leftFaceKey}"
          >
            <title>Pieza #${toothNum} - Cara ${leftFaceKey} (${leftFaceKey === 'M' ? 'Mesial' : 'Distal'})</title>
          </polygon>

          <!-- Cara Derecha (Distal/Mesial) -->
          <polygon 
            points="44,0 44,44 33,33 33,11" 
            fill="${colorRight}" 
            stroke="#94a3b8" 
            stroke-width="1"
            class="tooth-surface-polygon"
            data-tooth="${toothNum}" 
            data-face="${rightFaceKey}"
          >
            <title>Pieza #${toothNum} - Cara ${rightFaceKey} (${rightFaceKey === 'M' ? 'Mesial' : 'Distal'})</title>
          </polygon>

          <!-- Cara Central (Oclusal / Incisal) -->
          <polygon 
            points="11,11 33,11 33,33 11,33" 
            fill="${colorCenter}" 
            stroke="#94a3b8" 
            stroke-width="1"
            class="tooth-surface-polygon"
            data-tooth="${toothNum}" 
            data-face="O"
          >
            <title>Pieza #${toothNum} - Cara Oclusal/Incisal</title>
          </polygon>

          <!-- Overlays de Diente Completo: Ausente (X gris) o Extracción (X roja) -->
          ${isAusente ? `
            <line x1="2" y1="2" x2="42" y2="42" stroke="#374151" stroke-width="3.5" stroke-linecap="round" />
            <line x1="42" y1="2" x2="2" y2="42" stroke="#374151" stroke-width="3.5" stroke-linecap="round" />
          ` : ''}

          ${isExtraccion ? `
            <line x1="2" y1="2" x2="42" y2="42" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round" />
            <line x1="42" y1="2" x2="2" y2="42" stroke="#dc2626" stroke-width="3.5" stroke-linecap="round" />
          ` : ''}

          <!-- Overlay de Endodoncia (flecha azul en conducto) -->
          ${isEndodoncia ? `
            <line x1="22" y1="2" x2="22" y2="42" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" />
            <circle cx="22" cy="6" r="3" fill="#8b5cf6" />
          ` : ''}

          <!-- Overlay de Implante (Tornillo) -->
          ${isImplante ? `
            <line x1="22" y1="12" x2="22" y2="38" stroke="#06b6d4" stroke-width="4" />
            <line x1="16" y1="18" x2="28" y2="18" stroke="#06b6d4" stroke-width="2" />
            <line x1="17" y1="24" x2="27" y2="24" stroke="#06b6d4" stroke-width="2" />
            <line x1="18" y1="30" x2="26" y2="30" stroke="#06b6d4" stroke-width="2" />
          ` : ''}

          <!-- Overlay de Fractura -->
          ${isFractura ? `
            <path d="M 10,6 L 22,20 L 16,28 L 34,40" stroke="#e11d48" stroke-width="2.5" fill="none" />
          ` : ''}
        </svg>

        <!-- Indicador flotante si tiene tratamiento registrado -->
        ${(estado && estado !== 'Sano') ? `
          <div class="tooth-status-dot" style="position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background: ${DENTAL_STATES[estado.toUpperCase()]?.color || '#0ea5e9'}; border: 1.5px solid #fff;" title="${estado}"></div>
        ` : ''}
      </div>

      <!-- Número de la Pieza para Arcada Inferior -->
      ${!isUpper ? `
        <span class="tooth-number badge" style="font-size: 0.72rem; font-weight: 700; padding: 1px 5px; cursor: pointer;" title="Inspeccionar pieza #${toothNum}">
          ${toothNum}
        </span>
      ` : ''}

      <!-- Botón de Inspección Rápida -->
      <button type="button" class="btn-inspect-tooth" data-tooth="${toothNum}" title="Ver detalles clínicos de #${toothNum}" style="background: none; border: none; padding: 0; font-size: 0.65rem; cursor: pointer; opacity: 0.6; line-height: 1;">
        ✏️
      </button>
    </div>
  `;
}
