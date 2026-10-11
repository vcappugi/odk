/**
 * Servicio de Generación e Impresión de Ficha Clínica en PDF
 * ODONTOKRIS - Sistema Odontológico
 * 
 * Genera un informe clínico completo y estéticamente impecable que incluye:
 * - Datos demográficos y fotografía del paciente
 * - Alertas médicas críticas (Alergias, Antecedentes, Medicación)
 * - Odontograma Gráfico Vectorial Completo (FDI 32 piezas) con convenciones de color
 * - Tabla detallada de hallazgos odontológicos por pieza y caras
 * - Historial médico completo y cronología de consultas
 * - Área de firma y sello profesional odontológico
 */

import { patientModel } from './patientModel.js';
import { historialModel } from '../historial/historialModel.js';
import { odontogramaModel } from '../odontograma/odontogramaModel.js';
import { ADULT_TEETH, renderToothComponent } from '../odontograma/odontogramaView.js';
import { googleDriveService } from '../../services/googleDriveService.js';
import { notificationService } from '../../services/notificationService.js';
import { $ } from '../../utils/dom.js';

export const patientPrintService = {
  /**
   * Genera el HTML de la Ficha Clínica Integral del Paciente
   * @param {Object} patient 
   * @param {Array} historyList 
   * @param {Object} odontogramaMap 
   */
  generateFichaHtml(patient, historyList = [], odontogramaMap = {}) {
    const safeName = patient.nombre || 'Paciente sin nombre';
    const safeCi = patient.ci || 'No especificada';
    const safePhone = patient.telefono || 'No registrado';
    const safeMail = patient.mail || 'No registrado';
    const safeAddr = patient.direccion || 'No registrada';
    const safeSex = patient.sexo || 'No especificado';
    const safeBirthdate = patient.fecha_nacimiento ? String(patient.fecha_nacimiento).slice(0, 10) : 'No especificada';
    
    let ageText = 'No especificada';
    if (patient.fecha_nacimiento) {
      try {
        const birthYear = new Date(patient.fecha_nacimiento).getFullYear();
        const curYear = new Date().getFullYear();
        const age = curYear - birthYear;
        if (!isNaN(age) && age > 0) ageText = `${age} años`;
      } catch {}
    }

    const photoUrl = patient.foto ? googleDriveService.formatDriveImageUrl(patient.foto) : '';
    const nowStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const nowTime = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    // 1. Extraer alergias y antecedentes acumulados en el historial
    let alergiasArr = [];
    let antecedentesArr = [];
    let medicamentosArr = [];

    historyList.forEach(h => {
      if (h.alergias && h.alergias.trim() && h.alergias.toLowerCase() !== 'ninguna' && !alergiasArr.includes(h.alergias.trim())) {
        alergiasArr.push(h.alergias.trim());
      }
      if (h.antecedentes && h.antecedentes.trim() && !antecedentesArr.includes(h.antecedentes.trim())) {
        antecedentesArr.push(h.antecedentes.trim());
      }
      if (h.medicamentos && h.medicamentos.trim() && !medicamentosArr.includes(h.medicamentos.trim())) {
        medicamentosArr.push(h.medicamentos.trim());
      }
    });

    const alergiasText = alergiasArr.length > 0 ? alergiasArr.join(' · ') : 'Sin alergias conocidas reportadas';
    const antecedentesText = antecedentesArr.length > 0 ? antecedentesArr.join(' · ') : 'Sin antecedentes patológicos relevantes';
    const medicamentosText = medicamentosArr.length > 0 ? medicamentosArr.join(' · ') : 'Ninguno reportado';

    // 2. Renderizar Odontograma Gráfico (Cuadrantes FDI)
    const renderPrintQuadrant = (teethList, isUpper) => {
      return teethList.map(t => renderToothComponent(t, odontogramaMap[t], isUpper)).join('');
    };

    // 3. Hallazgos del odontograma
    const affectedTeeth = Object.values(odontogramaMap).filter(t => t.estado_inicial && t.estado_inicial !== 'Sano');

    return `
      <div id="patient-printable-document" class="printable-ficha-wrapper">
        
        <!-- 1. ENCABEZADO INSTITUCIONAL ODONTOKRIS -->
        <header class="print-header">
          <div class="print-header-inner">
            <div class="print-brand-group">
              <div class="print-logo-box">
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#0284c7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M7.5 3.5C5.5 3.5 3.5 5.5 3.5 8.5C3.5 12 5 14 6.5 17.5C7.5 19.8 8.5 21 9.5 21C10.5 21 10.8 19 11.2 16.5C11.6 14.5 11.8 14 12 14C12.2 14 12.4 14.5 12.8 16.5C13.2 19 13.5 21 14.5 21C15.5 21 16.5 19.8 17.5 17.5C19 14 20.5 12 20.5 8.5C20.5 5.5 18.5 3.5 16.5 3.5C14.5 3.5 13 5 12 5C11 5 9.5 3.5 7.5 3.5Z" fill="#0284c7" fill-opacity="0.15"/>
                  <path d="M15.5 7.5L16.5 5.5L17.5 7.5L19.5 8.5L17.5 9.5L16.5 11.5L15.5 9.5L13.5 8.5L15.5 7.5Z" fill="#0284c7"/>
                </svg>
              </div>
              <div>
                <h1 class="print-clinic-title">ODONTOKRIS</h1>
                <p class="print-clinic-subtitle">SISTEMA ODONTOLÓGICO INTEGRAL · HISTORIA CLÍNICA</p>
              </div>
            </div>

            <div class="print-doc-meta">
              <span class="print-meta-badge">FICHA CLÍNICA DE PACIENTE</span>
              <small>Fecha de Emisión: <strong>${nowStr}</strong> ${nowTime}</small>
              <small>ID Paciente: <strong>#${patient.id}</strong></small>
            </div>
          </div>
        </header>

        <!-- 2. DATOS DE IDENTIFICACIÓN DEL PACIENTE -->
        <section class="print-section print-patient-card">
          <h2 class="print-section-title">1. DATOS GENERALES DEL PACIENTE</h2>
          
          <div class="print-patient-grid">
            <div class="print-patient-photo-col">
              ${photoUrl ? `
                <img src="${photoUrl}" alt="Foto de ${safeName}" class="print-avatar-img" referrerpolicy="no-referrer" />
              ` : `
                <div class="print-avatar-placeholder">👤</div>
              `}
            </div>

            <div class="print-patient-info-table">
              <div class="print-info-row">
                <span class="print-lbl">Nombre Completo:</span>
                <span class="print-val print-val-highlight">${safeName}</span>
                <span class="print-lbl">Cédula / Identificación:</span>
                <span class="print-val"><strong>${safeCi}</strong></span>
              </div>

              <div class="print-info-row">
                <span class="print-lbl">Fecha de Nacimiento:</span>
                <span class="print-val">${safeBirthdate} (${ageText})</span>
                <span class="print-lbl">Sexo / Género:</span>
                <span class="print-val">${safeSex}</span>
              </div>

              <div class="print-info-row">
                <span class="print-lbl">Teléfono de Contacto:</span>
                <span class="print-val">${safePhone}</span>
                <span class="print-lbl">Correo Electrónico:</span>
                <span class="print-val">${safeMail}</span>
              </div>

              <div class="print-info-row print-info-row-full">
                <span class="print-lbl">Dirección de Residencia:</span>
                <span class="print-val">${safeAddr}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. ALERTAS MÉDICAS Y ANTECEDENTES RELEVANTES -->
        <section class="print-section print-alerts-section">
          <h2 class="print-section-title">2. ANTECEDENTES Y ALERTAS CLÍNICAS</h2>
          
          <div class="print-alerts-grid">
            <div class="print-alert-card print-alert-danger">
              <div class="print-alert-header">
                <strong>⚠️ ALERGIAS CONOCIDAS</strong>
              </div>
              <p class="print-alert-body">${alergiasText}</p>
            </div>

            <div class="print-alert-card print-alert-warning">
              <div class="print-alert-header">
                <strong>🩺 ANTECEDENTES MÉDICOS / PATOLÓGICOS</strong>
              </div>
              <p class="print-alert-body">${antecedentesText}</p>
            </div>

            <div class="print-alert-card print-alert-info">
              <div class="print-alert-header">
                <strong>💊 MEDICAMENTOS HABITUALES</strong>
              </div>
              <p class="print-alert-body">${medicamentosText}</p>
            </div>
          </div>
        </section>

        <!-- 4. ODONTOGRAMA CLÍNICO GRÁFICO (FDI) -->
        <section class="print-section print-odontograma-section">
          <div class="print-section-header cluster" style="justify-content: space-between; align-items: center;">
            <h2 class="print-section-title" style="margin: 0;">3. ODONTOGRAMA CLÍNICO GRÁFICO (NOMENCLATURA FDI)</h2>
            <span class="print-sub-tag">Dentición Permanente (32 Piezas)</span>
          </div>

          <div class="print-odontograma-box">
            <!-- Arcada Superior -->
            <div class="print-arch-label">MAXILAR SUPERIOR (CUADRANTES 1 Y 2)</div>
            <div class="print-teeth-row">
              <div class="print-quadrant">${renderPrintQuadrant(ADULT_TEETH.Q1, true)}</div>
              <div class="print-midline"></div>
              <div class="print-quadrant">${renderPrintQuadrant(ADULT_TEETH.Q2, true)}</div>
            </div>

            <!-- Línea Oclusal -->
            <div class="print-occlusion-line">──── LÍNEA DE OCLUSIÓN DENTAL ────</div>

            <!-- Arcada Inferior -->
            <div class="print-teeth-row">
              <div class="print-quadrant">${renderPrintQuadrant(ADULT_TEETH.Q4, false)}</div>
              <div class="print-midline"></div>
              <div class="print-quadrant">${renderPrintQuadrant(ADULT_TEETH.Q3, false)}</div>
            </div>
            <div class="print-arch-label">MANDÍBULA INFERIOR (CUADRANTES 4 Y 3)</div>

            <!-- Leyenda Odontológica Impresa -->
            <div class="print-odonto-legend">
              <span><strong>Leyenda:</strong></span>
              <span>🔴 Caries Activa</span>
              <span>🔵 Obturación Resina</span>
              <span>⚪ Amalgama</span>
              <span>❌ Ausente / Extraído</span>
              <span>🔺 Extracción Indicada</span>
              <span>👑 Corona Protésica</span>
              <span>⚡ Endodoncia</span>
              <span>🔩 Implante</span>
            </div>
          </div>

          <!-- Tabla de Hallazgos en Odontograma -->
          <div class="print-findings-box" style="margin-top: 0.6rem;">
            <h3 class="print-subsection-title">Hallazgos y Tratamientos Odontológicos Registrados:</h3>
            ${affectedTeeth.length > 0 ? `
              <table class="print-table">
                <thead>
                  <tr>
                    <th style="width: 15%;">Pieza Dental</th>
                    <th style="width: 20%;">Caras Involucradas</th>
                    <th style="width: 25%;">Diagnóstico / Estado</th>
                    <th style="width: 40%;">Tratamiento Indicado / Observación</th>
                  </tr>
                </thead>
                <tbody>
                  ${affectedTeeth.map(t => `
                    <tr>
                      <td><strong>Pieza #${t.numero_pieza}</strong></td>
                      <td>${t.caras_afectadas || 'Toda la pieza'}</td>
                      <td><span class="print-badge-status">${t.estado_inicial}</span></td>
                      <td>${t.tratamiento || ''} ${t.observacion ? `<em>(${t.observacion})</em>` : ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            ` : `
              <p class="print-empty-note">✓ No se registraron piezas dentales con patologías activas pendientes al momento de la emisión.</p>
            `}
          </div>
        </section>

        <!-- 5. HISTORIAL MÉDICO Y EVOLUCIÓN CLÍNICA -->
        <section class="print-section print-history-section">
          <h2 class="print-section-title">4. HISTORIAL MÉDICO Y EVOLUCIÓN CLÍNICA DE CONSULTAS</h2>
          
          ${historyList && historyList.length > 0 ? `
            <table class="print-table print-history-table">
              <thead>
                <tr>
                  <th style="width: 14%;">Fecha</th>
                  <th style="width: 18%;">Profesional</th>
                  <th style="width: 22%;">Motivo de Consulta</th>
                  <th style="width: 22%;">Diagnóstico Clínico</th>
                  <th style="width: 24%;">Tratamiento y Evolución</th>
                </tr>
              </thead>
              <tbody>
                ${historyList.map(h => {
                  const fStr = h.fecha ? new Date(h.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) : '--/--/----';
                  const doc = h.doctor?.nombre || (h.doctor_id ? `Doctor #${h.doctor_id}` : 'Odontólogo General');
                  return `
                    <tr>
                      <td><strong>${fStr}</strong></td>
                      <td>👨‍⚕️ ${doc}</td>
                      <td>${escapeHtml(h.motivo_consulta || 'Consulta general')}</td>
                      <td>${escapeHtml(h.diagnostico || 'Evaluación clínica')}</td>
                      <td>
                        <strong>${escapeHtml(h.tratamiento || 'Atención realizada')}</strong>
                        ${h.observaciones ? `<br><small style="color: #64748b;">${escapeHtml(h.observaciones)}</small>` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : `
            <p class="print-empty-note">Sin registros clínicos previos en el historial médico.</p>
          `}
        </section>

        <!-- 6. ÁREA DE FIRMAS Y VALIDEZ LEGAL -->
        <footer class="print-footer">
          <div class="print-signatures-grid">
            <div class="print-sign-box">
              <div class="print-sign-line"></div>
              <strong>FIRMA Y SELLO DEL ODONTÓLOGO</strong>
              <small>Colegio de Odontólogos / Matrícula Profesional</small>
            </div>

            <div class="print-sign-box">
              <div class="print-sign-line"></div>
              <strong>FIRMA DEL PACIENTE O REPRESENTANTE</strong>
              <small>Conformidad con la historia clínica y plan de tratamiento</small>
            </div>
          </div>

          <div class="print-disclaimer">
            <small>Documento generado digitalmente por ODONTOKRIS Sistema Odontológico. Válido como Ficha Clínica Odontológica Integral.</small>
          </div>
        </footer>

      </div>
    `;
  },

  currentPatientData: null,

  /**
   * Genera los estilos CSS embebidos completos para asegurar que la impresión sea exacta y no en blanco
   */
  getPrintableStyles() {
    return `
      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @page {
        size: A4 portrait;
        margin: 8mm 10mm;
      }
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 9pt;
        line-height: 1.35;
      }
      .printable-ficha-wrapper {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        background: #ffffff;
        padding: 0;
      }
      /* Header */
      .print-header {
        margin-bottom: 8px;
        border-bottom: 2.5px solid #0284c7;
        padding-bottom: 6px;
      }
      .print-header-inner {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .print-brand-group {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .print-logo-box {
        width: 38px;
        height: 38px;
        background: rgba(2, 132, 199, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .print-clinic-title {
        margin: 0;
        font-size: 16pt;
        font-weight: 800;
        color: #0284c7;
        letter-spacing: -0.02em;
        line-height: 1;
      }
      .print-clinic-subtitle {
        margin: 2px 0 0;
        font-size: 6.5pt;
        font-weight: 600;
        color: #64748b;
        letter-spacing: 0.05em;
      }
      .print-doc-meta {
        text-align: right;
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 7.5pt;
        color: #475569;
      }
      .print-meta-badge {
        background: #0284c7;
        color: #ffffff;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 7pt;
        display: inline-block;
        align-self: flex-end;
      }
      /* Sections */
      .print-section {
        margin-bottom: 8px;
        page-break-inside: avoid;
      }
      .print-section-title {
        font-size: 8.5pt;
        font-weight: 700;
        color: #0f172a;
        border-left: 3.5px solid #0284c7;
        padding-left: 6px;
        margin: 0 0 4px 0;
        text-transform: uppercase;
        letter-spacing: 0.03em;
      }
      .print-sub-tag {
        font-size: 6.5pt;
        color: #64748b;
        font-weight: 600;
      }
      /* Patient data */
      .print-patient-grid {
        display: flex;
        gap: 10px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 6px 8px;
        align-items: center;
      }
      .print-patient-photo-col {
        width: 58px;
        height: 58px;
        flex-shrink: 0;
      }
      .print-avatar-img {
        width: 58px;
        height: 58px;
        object-fit: cover;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        display: block;
      }
      .print-avatar-placeholder {
        width: 58px;
        height: 58px;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
      }
      .print-patient-info-table {
        flex: 1;
        display: grid;
        grid-template-columns: auto 1fr auto 1fr;
        gap: 3px 8px;
        font-size: 7.8pt;
        align-items: center;
      }
      .print-info-row {
        display: contents;
      }
      .print-lbl {
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
      }
      .print-val {
        color: #0f172a;
      }
      .print-val-highlight {
        font-weight: 700;
        color: #0284c7;
        font-size: 8.5pt;
      }
      /* Alerts */
      .print-alerts-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 6px;
      }
      .print-alert-card {
        border-radius: 6px;
        padding: 5px 7px;
        font-size: 7.5pt;
        border: 1px solid #e2e8f0;
      }
      .print-alert-danger {
        background: #fef2f2 !important;
        border-color: #fecaca !important;
        color: #991b1b !important;
      }
      .print-alert-warning {
        background: #fffbeb !important;
        border-color: #fef3c7 !important;
        color: #92400e !important;
      }
      .print-alert-info {
        background: #f0f9ff !important;
        border-color: #bae6fd !important;
        color: #075985 !important;
      }
      .print-alert-header {
        font-weight: 700;
        margin-bottom: 2px;
        font-size: 7pt;
      }
      .print-alert-body {
        margin: 0;
        line-height: 1.25;
      }
      /* Odontograma */
      .print-odontograma-box {
        background: #f8fafc;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 5px;
        page-break-inside: avoid;
      }
      .print-arch-label {
        font-size: 6.5pt;
        font-weight: 700;
        color: #64748b;
        text-align: center;
        letter-spacing: 0.05em;
        margin: 1px 0;
      }
      .print-teeth-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 3px;
        margin: 2px 0;
      }
      .print-quadrant {
        display: flex;
        gap: 2px;
        align-items: center;
      }
      .print-midline {
        width: 2px;
        height: 32px;
        background: #94a3b8;
        margin: 0 3px;
      }
      .print-occlusion-line {
        text-align: center;
        font-size: 5.5pt;
        font-weight: 700;
        color: #94a3b8;
        letter-spacing: 0.1em;
        margin: 1px 0;
      }
      .tooth-unit {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 36px !important;
        user-select: none;
      }
      .tooth-number {
        font-size: 6pt !important;
        font-weight: 700;
        padding: 0 2px !important;
        background: #e2e8f0;
        border-radius: 3px;
        margin-bottom: 1px;
        line-height: 1.1;
      }
      .tooth-svg-box {
        width: 30px !important;
        height: 30px !important;
        position: relative;
      }
      .tooth-svg {
        width: 30px !important;
        height: 30px !important;
        display: block;
      }
      .print-odonto-legend {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 4px 10px;
        font-size: 6pt;
        color: #475569;
        margin-top: 4px;
        padding-top: 3px;
        border-top: 1px dashed #cbd5e1;
      }
      /* Tables */
      .print-findings-box {
        margin-top: 5px;
      }
      .print-subsection-title {
        font-size: 7.5pt;
        font-weight: 700;
        color: #334155;
        margin: 0 0 2px 0;
      }
      .print-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 7.2pt;
        margin-top: 2px;
      }
      .print-table th {
        background: #f1f5f9 !important;
        color: #334155 !important;
        font-weight: 700;
        padding: 3px 5px;
        border: 1px solid #cbd5e1;
        text-align: left;
        font-size: 6.8pt;
      }
      .print-table td {
        padding: 3px 5px;
        border: 1px solid #e2e8f0;
        color: #1e293b;
        vertical-align: top;
      }
      .print-table tr:nth-child(even) {
        background: #f8fafc;
      }
      .print-badge-status {
        background: #e0f2fe !important;
        color: #0369a1 !important;
        padding: 1px 3px;
        border-radius: 3px;
        font-size: 6pt;
        font-weight: 600;
        display: inline-block;
      }
      .print-empty-note {
        font-size: 7pt;
        color: #64748b;
        font-style: italic;
        margin: 2px 0;
      }
      /* Footer */
      .print-footer {
        margin-top: 12px;
        page-break-inside: avoid;
      }
      .print-signatures-grid {
        display: flex;
        justify-content: space-around;
        gap: 30px;
        margin-top: 16px;
      }
      .print-sign-box {
        width: 200px;
        text-align: center;
        font-size: 6.8pt;
        color: #334155;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .print-sign-line {
        width: 170px;
        height: 1px;
        background: #334155;
        margin-bottom: 4px;
      }
      .print-disclaimer {
        text-align: center;
        margin-top: 10px;
        color: #94a3b8;
        font-size: 5.8pt;
      }
    `;
  },

  /**
   * Ejecuta la impresión de forma aislada a través de un iframe invisible
   * garantizando que el PDF renderice exactamente la ficha clínica sin interferencia de modales ni páginas en blanco
   */
  executePrint() {
    if (!this.currentPatientData) {
      window.print();
      return;
    }

    const { patient, historyList, odontogramaMap } = this.currentPatientData;
    const fichaHtml = this.generateFichaHtml(patient, historyList, odontogramaMap);
    const styles = this.getPrintableStyles();

    let iframe = document.getElementById('odk-print-iframe');
    if (iframe) {
      iframe.remove();
    }

    iframe = document.createElement('iframe');
    iframe.id = 'odk-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '1024px';
    iframe.style.height = '1000px';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ficha Clínica · ${escapeHtml(patient.nombre || 'Paciente')}</title>
        <style>${styles}</style>
      </head>
      <body>
        ${fichaHtml}
      </body>
      </html>
    `);
    doc.close();

    // Pequeño timeout para permitir que fuentes, imágenes y SVG se estabilicen antes de invocar print()
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('[patientPrintService] Fallback a print en ventana principal:', err);
        window.print();
      }
    }, 300);
  },

  /**
   * Abre la vista previa de impresión y permite imprimir / guardar como PDF
   * @param {number|string} patientId 
   */
  async printPatientFicha(patientId) {
    if (!patientId) {
      notificationService.warning('Seleccione un paciente para imprimir su ficha.');
      return;
    }

    notificationService.info('Preparando ficha clínica en PDF con historial y odontograma...');

    try {
      // 1. Obtener paciente
      const patient = await patientModel.getById(patientId);
      if (!patient) {
        notificationService.error('Paciente no encontrado.');
        return;
      }

      // 2. Obtener historial médico
      const historyList = await historialModel.getAllByPaciente(patientId);

      // 3. Obtener odontograma
      const odontogramaMap = await odontogramaModel.getOdontogramaByPaciente(patientId);

      // Guardar referencia activa para el botón de impresión
      this.currentPatientData = { patient, historyList, odontogramaMap };

      // 4. Inyectar contenido en el contenedor de vista previa
      const previewModal = $('#modal-patient-print-preview');
      const container = $('#patient-print-preview-content');

      if (!previewModal || !container) {
        this.ensurePrintPreviewModalInDom();
      }

      const modalEl = $('#modal-patient-print-preview');
      const contentEl = $('#patient-print-preview-content');

      if (contentEl) {
        contentEl.innerHTML = this.generateFichaHtml(patient, historyList, odontogramaMap);
      }
      
      // Actualizar título
      const titleEl = $('#print-preview-patient-title');
      if (titleEl) {
        titleEl.textContent = `Ficha Clínica · ${patient.nombre} (CI: ${patient.ci || 'S/CI'})`;
      }

      if (modalEl && typeof modalEl.showModal === 'function') {
        modalEl.showModal();
      }
    } catch (err) {
      console.error('[PatientPrintService] Error generando ficha PDF:', err);
      notificationService.error('No se pudo generar la ficha clínica: ' + err.message);
    }
  },

  /**
   * Crea el modal de vista previa de impresión en el DOM si aún no existe
   */
  ensurePrintPreviewModalInDom() {
    if ($('#modal-patient-print-preview')) return;

    const modalHtml = `
      <dialog id="modal-patient-print-preview" class="dialog custom-modal modal-wide" aria-labelledby="print-preview-patient-title" style="max-width: 980px; width: 96vw;">
        <div class="modal-box box stack" data-surface="raised" data-border data-gap="sm" style="max-height: 94vh; display: flex; flex-direction: column;">
          
          <header class="modal-header cluster no-print" data-justify="between" data-align="center">
            <div class="cluster" data-gap="xs" data-align="center">
              <span class="modal-icon-badge" style="font-size: 1.4rem;">🖨️</span>
              <div>
                <h3 id="print-preview-patient-title" style="margin: 0; font-size: 1.2rem;">Ficha Clínica del Paciente</h3>
                <small style="opacity: 0.75; font-size: 0.8rem;">Vista previa de impresión y exportación en formato PDF</small>
              </div>
            </div>

            <div class="cluster" data-gap="xs">
              <button type="button" id="btn-trigger-print" class="button" data-paint="primary" data-size="sm">
                <span>🖨️ Imprimir / Guardar como PDF</span>
              </button>
              <button type="button" class="button btn-close-print-preview" data-variant="ghost" data-size="sm" aria-label="Cerrar vista previa">✕</button>
            </div>
          </header>

          <div class="print-preview-body" style="overflow-y: auto; flex: 1; padding: 0.5rem; background: rgba(0,0,0,0.03); border-radius: 6px;">
            <div id="patient-print-preview-content"></div>
          </div>

          <footer class="cluster modal-footer no-print" data-justify="end" data-gap="xs" style="padding-top: 0.4rem; border-top: 1px solid rgba(125,125,125,0.15);">
            <button type="button" class="button btn-close-print-preview" data-variant="ghost">Cerrar</button>
            <button type="button" id="btn-trigger-print-bottom" class="button" data-paint="primary">
              🖨️ Imprimir / Guardar como PDF
            </button>
          </footer>

        </div>
      </dialog>
    `;

    const div = document.createElement('div');
    div.innerHTML = modalHtml;
    document.body.appendChild(div.firstElementChild);

    // Eventos del modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-print-preview')) {
        const d = $('#modal-patient-print-preview');
        if (d && d.open) d.close();
      }
      if (e.target.closest('#btn-trigger-print') || e.target.closest('#btn-trigger-print-bottom')) {
        this.executePrint();
      }
    });
  }
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
