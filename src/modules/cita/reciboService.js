/**
 * Servicio de Generación, Envío e Impresión de Recibos de Pago
 * ODONTOKRIS - Sistema Odontológico
 * 
 * Permite generar recibos de pago desde el modal de cobro de citas,
 * con envío directo por WhatsApp (usando el formato de felicitación de cumpleaños),
 * envío por Correo Electrónico (mailto), copiado rápido y formato imprimible en PDF.
 */

import { notificationService } from '../../services/notificationService.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { patientModel } from '../patients/patientModel.js';
import { $ } from '../../utils/dom.js';

export const reciboService = {
  currentReceiptData: null,
  activeContext: null,

  /**
   * Genera el objeto estructurado con todos los datos necesarios para el recibo
   */
  buildReceiptData({ cita, cobroId = null, allCobros = [], paciente = null, doctor = null, consultorio = null }) {
    const cobros = Array.isArray(allCobros) ? allCobros : (allCobros ? [allCobros] : []);
    
    // Si se especificó un cobro particular, mostrar solo ese pago.
    // Si cobroId es null y hay varios pagos, mostrar el consolidado de la cita.
    const selectedCobro = cobroId ? cobros.find(c => Number(c.id) === Number(cobroId)) : null;
    const isSingle = Boolean(selectedCobro) || cobros.length === 1;
    const activeCobro = selectedCobro || (cobros.length === 1 ? cobros[0] : null);

    let items = [];
    let reciboNumero = '';
    let fechaEmision = '';

    if (activeCobro) {
      const montoUsd = Number(activeCobro.monto_cobrado || 0);
      const tasa = Number(activeCobro.tasa_cambio || 1);
      const montoBs = montoUsd * tasa;
      reciboNumero = `REC-${String(activeCobro.id).padStart(5, '0')}`;
      fechaEmision = activeCobro.fecha_pago || new Date().toISOString().split('T')[0];

      items.push({
        id: activeCobro.id,
        fecha: activeCobro.fecha_pago || fechaEmision,
        montoUsd,
        tasa,
        montoBs,
        metodo: activeCobro.metodo_pago || 'Efectivo Divisas',
        referencia: activeCobro.referencia || '',
        formattedUsd: montoUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        formattedBs: montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        formattedTasa: tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
      });
    } else {
      // Consolidado de todos los cobros de la cita
      reciboNumero = `REC-CITA-${cita?.id || '000'}`;
      fechaEmision = cobros[cobros.length - 1]?.fecha_pago || new Date().toISOString().split('T')[0];

      items = cobros.map((c, index) => {
        const montoUsd = Number(c.monto_cobrado || 0);
        const tasa = Number(c.tasa_cambio || 1);
        const montoBs = montoUsd * tasa;
        return {
          id: c.id,
          index: index + 1,
          fecha: c.fecha_pago || fechaEmision,
          montoUsd,
          tasa,
          montoBs,
          metodo: c.metodo_pago || 'Efectivo Divisas',
          referencia: c.referencia || '',
          formattedUsd: montoUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          formattedBs: montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          formattedTasa: tasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
        };
      });
    }

    const totalUsd = items.reduce((acc, it) => acc + it.montoUsd, 0);
    const totalBs = items.reduce((acc, it) => acc + it.montoBs, 0);
    const avgTasa = items.length > 0 ? items[items.length - 1].tasa : 1;

    // Datos del paciente
    const safePaciente = paciente || cita?.paciente || {};
    const pacienteNombre = safePaciente.nombre || 'Paciente';
    const pacienteCi = safePaciente.ci ? String(safePaciente.ci).trim() : 'No registrada';
    const pacienteTelefono = safePaciente.telefono || '';
    const pacienteMail = safePaciente.mail || '';

    // Datos del doctor
    const safeDoctor = doctor || cita?.doctor || {};
    const rawDocName = safeDoctor.nombre || 'Especialista';
    const doctorNombre = rawDocName.startsWith('Dr') ? rawDocName : `Dr(a). ${rawDocName}`;

    // Datos de la sede
    const activeConsultorio = consultorio 
      || consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio()
      || authModel.getCurrentUser()?.consultorio;
    const consultorioNombre = activeConsultorio?.nombre || 'Sede Principal';

    return {
      reciboNumero,
      fechaEmision,
      isSingle,
      cobroId: activeCobro ? activeCobro.id : null,
      citaId: cita?.id || null,
      citaFecha: cita?.fecha || fechaEmision,
      paciente: {
        id: safePaciente.id || null,
        nombre: pacienteNombre,
        ci: pacienteCi,
        telefono: pacienteTelefono,
        mail: pacienteMail
      },
      doctor: {
        id: safeDoctor.id || null,
        nombre: doctorNombre
      },
      consultorio: {
        id: activeConsultorio?.id || null,
        nombre: consultorioNombre
      },
      items,
      totalUsd,
      totalBs,
      totalUsdFormatted: totalUsd.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      totalBsFormatted: totalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      tasaFormatted: avgTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })
    };
  },

  /**
   * Construye el texto enriquecido para el envío por WhatsApp
   * Utiliza el mismo mecanismo de formato de la felicitación de cumpleaños.
   */
  buildWhatsAppMessage(data) {
    const itemsText = data.items.map((it, idx) => {
      const refPart = it.referencia ? ` (Ref: ${it.referencia})` : '';
      return `• Pago #${idx + 1}: *$${it.formattedUsd} USD* (~${it.formattedBs} Bs.)\n  ↳ ${it.metodo}${refPart}`;
    }).join('\n');

    return (
`🦷 *ODONTOKRIS — Sistema Odontológico*
🧾 *COMPROBANTE / RECIBO DE PAGO*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimado(a) *${data.paciente.nombre}*, hemos recibido su pago satisfactoriamente:

📌 *N° Recibo:* ${data.reciboNumero}
📅 *Fecha:* ${data.fechaEmision}
👤 *Paciente:* ${data.paciente.nombre} (C.I. ${data.paciente.ci})
👨‍⚕️ *Especialista:* ${data.doctor.nombre}
🏥 *Sede:* ${data.consultorio.nombre}

*DETALLE DEL COBRO:*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💵 *TOTAL PAGADO:* $${data.totalUsdFormatted} USD
📈 *TASA OFICIAL BCV:* 1 USD = ${data.tasaFormatted} Bs.
🇻🇪 *TOTAL BOLÍVARES:* ${data.totalBsFormatted} Bs.
✅ *ESTATUS:* PAGO CONFIRMADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

¡Muchas gracias por su confianza en ODONTOKRIS!
Si tiene alguna consulta, estamos a su total disposición.`
    );
  },

  /**
   * Construye el asunto del correo electrónico
   */
  buildEmailSubject(data) {
    return `🧾 Recibo de Pago N° ${data.reciboNumero} - ODONTOKRIS (${data.paciente.nombre})`;
  },

  /**
   * Construye el cuerpo del correo electrónico para mailto
   */
  buildEmailBody(data) {
    const itemsText = data.items.map((it, idx) => {
      const refPart = it.referencia ? ` | Ref: ${it.referencia}` : '';
      return `  - Pago #${idx + 1}: $${it.formattedUsd} USD (~${it.formattedBs} Bs.) | ${it.metodo}${refPart}`;
    }).join('\n');

    return (
`Estimado(a) ${data.paciente.nombre},

Le hacemos entrega de su comprobante oficial de pago por servicios odontológicos en ODONTOKRIS:

============================================================
           ODONTOKRIS — SISTEMA ODONTOLÓGICO
              COMPROBANTE / RECIBO DE PAGO
============================================================

N° de Recibo: ${data.reciboNumero}
Fecha de Emisión: ${data.fechaEmision}
Sede: ${data.consultorio.nombre}

DATOS DEL PACIENTE:
- Nombre: ${data.paciente.nombre}
- Cédula de Identidad: ${data.paciente.ci}
- Especialista Tratante: ${data.doctor.nombre}

DESGLOSE DE PAGO(S):
${itemsText}

TOTAL CANCELADO:
- Total en Divisas ($ USD): $${data.totalUsdFormatted} USD
- Tasa Oficial BCV: 1 USD = ${data.tasaFormatted} Bs.
- Total en Bolívares (Bs.): ${data.totalBsFormatted} Bs.
- Estatus: PAGO CONFIRMADO

============================================================
Agradecemos enormemente su preferencia y confianza en nosotros.
ODONTOKRIS — Sistema Odontológico`
    );
  },

  /**
   * Abre WhatsApp con el mensaje pre-cargado (mismo mecanismo de cumpleaños)
   */
  sendWhatsApp(phoneInputVal, data) {
    const rawPhone = (phoneInputVal || data.paciente.telefono || '').replace(/\D/g, '');
    if (!rawPhone) {
      notificationService.warning('Por favor ingrese o verifique el número de teléfono/WhatsApp del paciente.');
      const input = $('#recibo-send-phone');
      if (input) input.focus();
      return;
    }

    const cleanPhone = rawPhone.startsWith('58') ? rawPhone : ('58' + rawPhone.replace(/^0+/, ''));
    const message = this.buildWhatsAppMessage(data);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    notificationService.success('Abriendo WhatsApp con el recibo de pago...');
  },

  /**
   * Abre el cliente de correo con el recibo pre-cargado
   */
  sendEmail(emailInputVal, data) {
    const email = (emailInputVal || data.paciente.mail || '').trim();
    if (!email || !email.includes('@')) {
      notificationService.warning('Por favor ingrese un correo electrónico válido para el paciente.');
      const input = $('#recibo-send-email');
      if (input) input.focus();
      return;
    }

    const subject = this.buildEmailSubject(data);
    const body = this.buildEmailBody(data);
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    notificationService.success('Abriendo aplicación de correo electrónico...');
  },

  /**
   * Copia el texto formateado al portapapeles
   */
  async copyText(data) {
    const text = this.buildWhatsAppMessage(data);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      notificationService.success('Texto del recibo copiado al portapapeles.');
    } catch (err) {
      console.warn('[ReciboService] Error copiando texto:', err);
      notificationService.info('No se pudo copiar automáticamente. Por favor seleccione y copie el texto.');
    }
  },

  /**
   * Imprime el recibo mediante un iframe oculto de alta resolución
   */
  printReceipt(data) {
    notificationService.info('Preparando recibo para impresión...');

    const printStyles = `
      @page {
        size: auto;
        margin: 12mm 15mm;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        color: #0f172a;
        background: #ffffff;
        margin: 0;
        padding: 0;
        font-size: 13px;
        line-height: 1.45;
      }
      .receipt-print-wrapper {
        max-width: 550px;
        margin: 0 auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 24px;
      }
      .print-header {
        text-align: center;
        border-bottom: 2px solid #0284c7;
        padding-bottom: 12px;
        margin-bottom: 16px;
      }
      .print-brand {
        font-size: 20px;
        font-weight: 800;
        color: #0284c7;
        letter-spacing: 0.5px;
      }
      .print-subbrand {
        font-size: 11px;
        text-transform: uppercase;
        color: #64748b;
        letter-spacing: 1px;
        margin-top: 2px;
      }
      .print-receipt-tag {
        display: inline-block;
        background: #f0fdf4;
        border: 1px solid #86efac;
        color: #166534;
        font-weight: 700;
        font-size: 11px;
        padding: 3px 10px;
        border-radius: 4px;
        margin-top: 8px;
        text-transform: uppercase;
      }
      .print-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 16px;
        background: #f8fafc;
        border: 1px solid #f1f5f9;
        border-radius: 6px;
        padding: 12px;
        font-size: 12px;
      }
      .print-item-lbl {
        color: #64748b;
        font-size: 11px;
        display: block;
      }
      .print-item-val {
        font-weight: 600;
        color: #0f172a;
      }
      table.print-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 16px;
      }
      table.print-table th {
        background: #f1f5f9;
        color: #334155;
        font-size: 11px;
        text-transform: uppercase;
        padding: 8px 10px;
        text-align: left;
        border-bottom: 1px solid #cbd5e1;
      }
      table.print-table td {
        padding: 8px 10px;
        border-bottom: 1px solid #f1f5f9;
        font-size: 12px;
      }
      .print-totals {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 14px 16px;
        margin-bottom: 20px;
      }
      .print-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
      }
      .print-total-row.main {
        border-top: 1px dashed #cbd5e1;
        padding-top: 8px;
        margin-top: 8px;
        font-size: 16px;
        font-weight: 800;
        color: #10b981;
      }
      .print-stamp {
        display: inline-block;
        border: 2px solid #10b981;
        color: #10b981;
        font-weight: 800;
        font-size: 12px;
        padding: 4px 12px;
        border-radius: 4px;
        letter-spacing: 1px;
        text-transform: uppercase;
        transform: rotate(-3deg);
      }
      .print-footer-signatures {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-top: 36px;
        text-align: center;
        font-size: 11px;
      }
      .print-sig-line {
        border-top: 1px solid #94a3b8;
        padding-top: 6px;
        color: #475569;
      }
      .print-disclaimer {
        text-align: center;
        font-size: 10px;
        color: #94a3b8;
        margin-top: 24px;
        border-top: 1px solid #f1f5f9;
        padding-top: 8px;
      }
    `;

    const printHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Recibo de Pago · ${data.reciboNumero} · ODONTOKRIS</title>
        <style>${printStyles}</style>
      </head>
      <body>
        <div class="receipt-print-wrapper">
          <div class="print-header">
            <div class="print-brand">🦷 ODONTOKRIS</div>
            <div class="print-subbrand">Sistema Odontológico Integral · ${data.consultorio.nombre}</div>
            <div class="print-receipt-tag">Comprobante de Recepción de Pago</div>
          </div>

          <div class="print-grid">
            <div>
              <span class="print-item-lbl">N° DE COMPROBANTE</span>
              <span class="print-item-val" style="color: #0284c7; font-size: 13px;">${data.reciboNumero}</span>
            </div>
            <div>
              <span class="print-item-lbl">FECHA DE EMISIÓN</span>
              <span class="print-item-val">${data.fechaEmision}</span>
            </div>
            <div>
              <span class="print-item-lbl">PACIENTE</span>
              <span class="print-item-val">${data.paciente.nombre}</span>
            </div>
            <div>
              <span class="print-item-lbl">CÉDULA DE IDENTIDAD</span>
              <span class="print-item-val">${data.paciente.ci}</span>
            </div>
            <div>
              <span class="print-item-lbl">ESPECIALISTA TRATANTE</span>
              <span class="print-item-val">${data.doctor.nombre}</span>
            </div>
            <div>
              <span class="print-item-lbl">CONSULTORIO / SEDE</span>
              <span class="print-item-val">${data.consultorio.nombre}</span>
            </div>
          </div>

          <table class="print-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Concepto / Método</th>
                <th>Referencia</th>
                <th style="text-align: right;">Monto ($ USD)</th>
                <th style="text-align: right;">Equivalente (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((it, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>
                    <strong>Atención Odontológica</strong><br>
                    <small style="color: #64748b;">${it.metodo}</small>
                  </td>
                  <td>${it.referencia || 'N/A'}</td>
                  <td style="text-align: right; font-weight: 700; color: #10b981;">$${it.formattedUsd}</td>
                  <td style="text-align: right; font-weight: 600;">${it.formattedBs} Bs.</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="print-totals">
            <div class="print-total-row">
              <span style="color: #64748b;">Tasa Oficial BCV:</span>
              <span style="font-weight: 600;">1 USD = ${data.tasaFormatted} Bs.</span>
            </div>
            <div class="print-total-row main">
              <span>TOTAL PAGADO:</span>
              <div style="text-align: right;">
                <div>$${data.totalUsdFormatted} USD</div>
                <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">
                  ~ ${data.totalBsFormatted} Bs.
                </div>
              </div>
            </div>
            <div style="margin-top: 10px; text-align: right;">
              <span class="print-stamp">✓ PAGO CONFIRMADO</span>
            </div>
          </div>

          <div class="print-footer-signatures">
            <div class="print-sig-col">
              <div style="height: 35px;"></div>
              <div class="print-sig-line">Firma y Sello Odontológico</div>
            </div>
            <div class="print-sig-col">
              <div style="height: 35px;"></div>
              <div class="print-sig-line">Firma del Paciente</div>
            </div>
          </div>

          <div class="print-disclaimer">
            Este comprobante certifica la recepción conforme del pago por servicios odontológicos profesionales prestados en ODONTOKRIS. Documento no válido como factura fiscal.
          </div>
        </div>
      </body>
      </html>
    `;

    // Inyección en iframe oculto para impresión limpia
    let iframe = document.getElementById('print-receipt-iframe');
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'print-receipt-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printHtml);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.warn('[ReciboService] Fallback a print en ventana principal:', err);
        window.print();
      }
    }, 250);
  },

  /**
   * Renderiza el contenedor del recibo dentro del modal
   */
  renderPreviewCard(data) {
    const isSingle = data.isSingle;

    return `
      <div class="receipt-preview-card box stack" data-gap="xs">
        
        <!-- Encabezado del Recibo -->
        <div class="cluster" data-justify="between" data-align="start" style="border-bottom: 1px dashed rgba(125, 125, 125, 0.35); padding-bottom: 0.5rem;">
          <div>
            <div class="cluster" data-gap="xs" data-align="center">
              <span style="font-size: 1.25rem;">🦷</span>
              <strong style="font-size: 1.05rem; color: #0284c7; letter-spacing: 0.5px;">ODONTOKRIS</strong>
            </div>
            <div style="font-size: 0.72rem; opacity: 0.75; margin-top: 1px;">
              Sistema Odontológico · <strong>${data.consultorio.nombre}</strong>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">
              ${isSingle ? 'RECIBO DE PAGO' : 'RECIBO CONSOLIDADO'}
            </span>
            <div style="font-size: 0.76rem; font-weight: 700; color: #0284c7; margin-top: 2px;">
              ${data.reciboNumero}
            </div>
            <div style="font-size: 0.68rem; opacity: 0.75;">
              ${data.fechaEmision}
            </div>
          </div>
        </div>

        <!-- Datos del Paciente y Especialista -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem; background: rgba(125, 125, 125, 0.05); border: 1px solid rgba(125, 125, 125, 0.15); border-radius: 6px; padding: 0.45rem 0.65rem; font-size: 0.74rem;">
          <div>
            <span style="opacity: 0.7; font-size: 0.68rem; display: block;">PACIENTE</span>
            <strong style="color: var(--primary, #0284c7);">${data.paciente.nombre}</strong>
            <div style="opacity: 0.85; font-size: 0.70rem;">C.I.: <strong>${data.paciente.ci}</strong></div>
          </div>
          <div>
            <span style="opacity: 0.7; font-size: 0.68rem; display: block;">ESPECIALISTA TRATANTE</span>
            <strong style="color: #0f172a;">${data.doctor.nombre}</strong>
            <div style="opacity: 0.85; font-size: 0.70rem;">Sede: <strong>${data.consultorio.nombre}</strong></div>
          </div>
        </div>

        <!-- Desglose de Pagos -->
        <div class="receipt-items-container" style="max-height: 120px; overflow-y: auto;">
          <table class="table" style="width: 100%; font-size: 0.73rem; margin: 0;">
            <thead>
              <tr style="border-bottom: 1px solid rgba(125, 125, 125, 0.2);">
                <th style="padding: 3px 6px; text-align: left; opacity: 0.8;">Concepto / Método</th>
                <th style="padding: 3px 6px; text-align: left; opacity: 0.8;">Ref.</th>
                <th style="padding: 3px 6px; text-align: right; opacity: 0.8;">Monto ($ USD)</th>
                <th style="padding: 3px 6px; text-align: right; opacity: 0.8;">Equiv. (Bs.)</th>
              </tr>
            </thead>
            <tbody>
              ${data.items.map((it, idx) => `
                <tr style="border-bottom: 1px solid rgba(125, 125, 125, 0.08);">
                  <td style="padding: 4px 6px;">
                    <strong>Atención Odontológica</strong><br>
                    <span class="badge" data-paint="neutral" style="font-size: 0.64rem; padding: 0 4px;">${it.metodo}</span>
                  </td>
                  <td style="padding: 4px 6px; font-size: 0.70rem; opacity: 0.85;">
                    ${it.referencia || '--'}
                  </td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 700; color: #10b981;">
                    $${it.formattedUsd}
                  </td>
                  <td style="padding: 4px 6px; text-align: right; font-weight: 600; opacity: 0.9;">
                    ${it.formattedBs} Bs.
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Totales Acumulados y Sello -->
        <div class="box" style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.28); border-radius: 6px; padding: 0.45rem 0.65rem;">
          <div class="cluster" data-justify="between" data-align="center">
            <span style="font-size: 0.70rem; opacity: 0.8;">Tasa Oficial BCV:</span>
            <span style="font-size: 0.72rem; font-weight: 600;">1 USD = ${data.tasaFormatted} Bs.</span>
          </div>
          <div class="cluster" data-justify="between" data-align="baseline" style="margin-top: 3px;">
            <div>
              <span style="font-size: 0.74rem; font-weight: 700;">TOTAL PAGADO:</span>
            </div>
            <div style="text-align: right;">
              <strong style="font-size: 1.15rem; font-weight: 800; color: #10b981;">$${data.totalUsdFormatted} USD</strong>
              <div style="font-size: 0.80rem; font-weight: 700; opacity: 0.9;">~ ${data.totalBsFormatted} Bs.</div>
            </div>
          </div>
          <div class="cluster" data-justify="end" style="margin-top: 4px;">
            <span class="receipt-stamp-paid">✓ PAGO CONFIRMADO</span>
          </div>
        </div>

      </div>
    `;
  },

  /**
   * Abre el Modal de Recibo y lo llena con los datos de cobro
   */
  async openReciboModal({ cita, cobroId = null, allCobros = [], paciente = null, doctor = null, consultorio = null }) {
    const dialog = $('#modal-recibo-pago');
    if (!dialog) return;

    // Asegurar datos del paciente si faltan detalles
    let resolvedPaciente = paciente || cita?.paciente;
    if (!resolvedPaciente && cita?.paciente_id) {
      try {
        resolvedPaciente = await patientModel.getById(cita.paciente_id);
      } catch (e) {
        console.warn('[ReciboService] Error cargando paciente:', e);
      }
    }

    this.activeContext = {
      cita,
      cobroId,
      allCobros,
      paciente: resolvedPaciente,
      doctor: doctor || cita?.doctor,
      consultorio: consultorio || consultorioModel.getActiveConsultorio()
    };

    this.currentReceiptData = this.buildReceiptData(this.activeContext);

    // Inyectar previsualización
    const previewContainer = $('#recibo-preview-card-container');
    if (previewContainer) {
      previewContainer.innerHTML = this.renderPreviewCard(this.currentReceiptData);
    }

    // Pestañas de selección de pago si hay múltiples
    const selectorContainer = $('#recibo-cobros-selector');
    if (selectorContainer) {
      if (allCobros.length > 1) {
        selectorContainer.style.display = 'flex';
        selectorContainer.innerHTML = `
          <button type="button" class="button btn-recibo-switch ${!cobroId ? 'btn-recibo-active' : ''}" data-id="" data-size="2xs" data-variant="${!cobroId ? 'primary' : 'ghost'}" style="font-size: 0.68rem; font-weight: 700;">
            🧾 Todos (${allCobros.length})
          </button>
          ${allCobros.map((c, i) => `
            <button type="button" class="button btn-recibo-switch ${Number(cobroId) === Number(c.id) ? 'btn-recibo-active' : ''}" data-id="${c.id}" data-size="2xs" data-variant="${Number(cobroId) === Number(c.id) ? 'primary' : 'ghost'}" style="font-size: 0.68rem; font-weight: 600;">
              #${i + 1} ($${Number(c.monto_cobrado).toFixed(2)})
            </button>
          `).join('')}
        `;
      } else {
        selectorContainer.style.display = 'none';
        selectorContainer.innerHTML = '';
      }
    }

    // Pre-llenar campos de contacto del paciente
    const phoneInput = $('#recibo-send-phone');
    const emailInput = $('#recibo-send-email');
    if (phoneInput) {
      phoneInput.value = this.currentReceiptData.paciente.telefono || '';
    }
    if (emailInput) {
      emailInput.value = this.currentReceiptData.paciente.mail || '';
    }

    // Abrir modal
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    // Asegurar que las alertas toast queden por encima de este modal
    if (notificationService._ensureTopLayer) {
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) notificationService._ensureTopLayer(toastContainer);
    }
  },

  /**
   * Cierra el modal de recibo
   */
  closeReciboModal() {
    const dialog = $('#modal-recibo-pago');
    if (dialog && dialog.open) {
      dialog.close();
    }
  },

  /**
   * Inicializa escuchas de eventos del modal de recibos
   */
  initEvents() {
    // 1. Cerrar modal de recibo
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-recibo-modal')) {
        this.closeReciboModal();
      }
    });

    // 2. Enviar por WhatsApp
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-recibo-send-whatsapp')) {
        e.preventDefault();
        const phone = $('#recibo-send-phone')?.value;
        if (this.currentReceiptData) {
          this.sendWhatsApp(phone, this.currentReceiptData);
        }
      }
    });

    // 3. Enviar por Correo Electrónico
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-recibo-send-email')) {
        e.preventDefault();
        const email = $('#recibo-send-email')?.value;
        if (this.currentReceiptData) {
          this.sendEmail(email, this.currentReceiptData);
        }
      }
    });

    // 4. Copiar Texto del Recibo
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-recibo-copy-text')) {
        e.preventDefault();
        if (this.currentReceiptData) {
          await this.copyText(this.currentReceiptData);
        }
      }
    });

    // 5. Imprimir Recibo
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-recibo-print')) {
        e.preventDefault();
        if (this.currentReceiptData) {
          this.printReceipt(this.currentReceiptData);
        }
      }
    });

    // 6. Conmutar entre pagos en el recibo (si hay múltiples cobros)
    document.addEventListener('click', (e) => {
      const switchBtn = e.target.closest('.btn-recibo-switch');
      if (switchBtn && this.activeContext) {
        e.preventDefault();
        const cobroId = switchBtn.dataset.id ? Number(switchBtn.dataset.id) : null;
        this.activeContext.cobroId = cobroId;
        this.currentReceiptData = this.buildReceiptData(this.activeContext);

        // Actualizar previsualización
        const previewContainer = $('#recibo-preview-card-container');
        if (previewContainer) {
          previewContainer.innerHTML = this.renderPreviewCard(this.currentReceiptData);
        }

        // Actualizar botones de conmutación
        document.querySelectorAll('.btn-recibo-switch').forEach(btn => {
          const isThis = (btn.dataset.id === '' && !cobroId) || (Number(btn.dataset.id) === Number(cobroId));
          btn.setAttribute('data-variant', isThis ? 'primary' : 'ghost');
          if (isThis) btn.classList.add('btn-recibo-active');
          else btn.classList.remove('btn-recibo-active');
        });
      }
    });
  }
};
