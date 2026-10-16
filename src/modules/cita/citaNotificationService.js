/**
 * Servicio de Notificaciones y Recordatorios de Citas Odontológicas
 * ODONTOKRIS - Sistema Odontológico
 * 
 * Permite enviar los datos de la cita al paciente bajo dos modalidades:
 * 1. Programación / Confirmación de Cita (Cita agendada)
 * 2. Recordatorio de Cita (Recordatorio preventivo previo a la consulta)
 * 
 * Vías de despacho: WhatsApp (usando el mismo mecanismo de cumpleaños),
 * Correo Electrónico (mailto) y copiado rápido al portapapeles.
 */

import { notificationService } from '../../services/notificationService.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { patientModel } from '../patients/patientModel.js';
import { $ } from '../../utils/dom.js';

export const citaNotificationService = {
  currentData: null,
  activeContext: null,

  /**
   * Formatea una fecha YYYY-MM-DD a formato largo en español
   * Ej: "Miércoles, 21 de Octubre de 2026"
   */
  formatFechaEspanol(dateStr) {
    if (!dateStr) return 'Fecha por definir';
    try {
      const parts = String(dateStr).slice(0, 10).split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const d = new Date(year, month, day, 12, 0, 0);
        
        const raw = d.toLocaleDateString('es-VE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        // Capitalizar primera letra
        return raw.charAt(0).toUpperCase() + raw.slice(1);
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  },

  /**
   * Formatea una hora HH:MM a formato 12 horas con AM/PM
   * Ej: "09:00" -> "09:00 AM", "15:30" -> "03:30 PM"
   */
  formatHora12(horaStr) {
    if (!horaStr) return '';
    try {
      const parts = String(horaStr).split(':');
      const numH = parseInt(parts[0], 10);
      if (isNaN(numH)) return horaStr;
      const ampm = numH >= 12 ? 'PM' : 'AM';
      const h12 = numH % 12 || 12;
      const m = parts[1] || '00';
      return `${String(h12).padStart(2, '0')}:${m} ${ampm}`;
    } catch {
      return horaStr;
    }
  },

  /**
   * Construye el objeto de datos unificado para la notificación
   */
  buildNotificationData({ cita, paciente = null, doctor = null, consultorio = null, type = 'recordatorio' }) {
    const safePaciente = paciente || cita?.paciente || {};
    const pacienteNombre = safePaciente.nombre || 'Paciente';
    const pacienteCi = safePaciente.ci ? String(safePaciente.ci).trim() : '';
    const pacienteTelefono = safePaciente.telefono || '';
    const pacienteMail = safePaciente.mail || '';

    const safeDoctor = doctor || cita?.doctor || {};
    const rawDocName = safeDoctor.nombre || 'Especialista';
    const doctorNombre = rawDocName.startsWith('Dr') ? rawDocName : `Dr(a). ${rawDocName}`;

    const activeConsultorio = consultorio 
      || consultorioModel.getActiveConsultorio() 
      || authModel.getActiveConsultorio()
      || authModel.getCurrentUser()?.consultorio;
    const consultorioNombre = activeConsultorio?.nombre || 'Sede Principal';

    const fechaRaw = cita?.fecha || new Date().toISOString().split('T')[0];
    const fechaFormateada = this.formatFechaEspanol(fechaRaw);

    const horaDesdeRaw = cita?.hora_desde || '09:00';
    const horaHastaRaw = cita?.hora_hasta || '10:00';
    const horaDesde12 = this.formatHora12(horaDesdeRaw);
    const horaHasta12 = this.formatHora12(horaHastaRaw);

    const motivo = (cita?.observacion || '').trim();

    return {
      type, // 'programacion' | 'recordatorio'
      citaId: cita?.id || null,
      fechaRaw,
      fechaFormateada,
      horaDesdeRaw,
      horaHastaRaw,
      horaDesde12,
      horaHasta12,
      motivo,
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
      }
    };
  },

  /**
   * Construye el mensaje para WhatsApp
   */
  buildWhatsAppMessage(data) {
    const isRecordatorio = data.type === 'recordatorio';

    if (isRecordatorio) {
      return (
`🦷 *ODONTOKRIS — Sistema Odontológico*
⏰ *RECORDATORIO DE CITA ODONTOLÓGICA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimado(a) *${data.paciente.nombre}*, le saludamos cordialmente desde *ODONTOKRIS* para recordarle su próxima consulta odontológica:

📅 *Fecha:* ${data.fechaFormateada}
⏰ *Horario:* ${data.horaDesde12} a ${data.horaHasta12}
👨‍⚕️ *Especialista:* ${data.doctor.nombre}
🏥 *Sede:* ${data.consultorio.nombre}
${data.motivo ? `📋 *Motivo / Tratamiento:* ${data.motivo}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Por favor confirme su asistencia respondiendo a este mensaje con un *"CONFIRMO"*.
⚠️ Si requiere reprogramar su consulta, le agradecemos notificarnos a la brevedad posible.

¡Cuidar su sonrisa es nuestra mayor satisfacción!`
      );
    } else {
      return (
`🦷 *ODONTOKRIS — Sistema Odontológico*
📅 *CONFIRMACIÓN DE CITA ODONTOLÓGICA*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Estimado(a) *${data.paciente.nombre}*, nos complace confirmarle que su consulta odontológica ha sido programada con éxito:

📅 *Fecha:* ${data.fechaFormateada}
⏰ *Horario:* ${data.horaDesde12} a ${data.horaHasta12}
👨‍⚕️ *Especialista:* ${data.doctor.nombre}
🏥 *Sede:* ${data.consultorio.nombre}
${data.motivo ? `📋 *Motivo / Consulta:* ${data.motivo}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 *Recomendaciones para su consulta:*
• Por favor presentarse 10 minutos antes de la hora pautada.
• En caso de no poder asistir, le agradecemos notificarnos con al menos 24 horas de anticipación.

¡Esperamos brindarle una excelente atención en ODONTOKRIS!
Si tiene alguna duda o inquietud, estamos a su total disposición.`
      );
    }
  },

  /**
   * Asunto para el correo electrónico
   */
  buildEmailSubject(data) {
    const tag = data.type === 'recordatorio' ? '⏰ Recordatorio' : '📅 Confirmación';
    return `${tag} de Cita Odontológica - ODONTOKRIS (${data.paciente.nombre} · ${data.fechaFormateada})`;
  },

  /**
   * Cuerpo para el correo electrónico (mailto)
   */
  buildEmailBody(data) {
    const isRecordatorio = data.type === 'recordatorio';
    const headerTitle = isRecordatorio ? 'RECORDATORIO DE CITA ODONTOLÓGICA' : 'CONFIRMACIÓN DE CITA ODONTOLÓGICA';

    return (
`Estimado(a) ${data.paciente.nombre},

${isRecordatorio 
  ? 'Le saludamos cordialmente de ODONTOKRIS para recordarle los detalles de su próxima cita odontológica:'
  : 'Nos complace confirmarle que su cita odontológica ha sido programada con éxito en ODONTOKRIS:'}

============================================================
           ODONTOKRIS — SISTEMA ODONTOLÓGICO
              ${headerTitle}
============================================================

DETALLES DE LA CITA:
- Paciente: ${data.paciente.nombre}${data.paciente.ci ? ` (C.I. ${data.paciente.ci})` : ''}
- Fecha: ${data.fechaFormateada}
- Horario: ${data.horaDesde12} a ${data.horaHasta12}
- Especialista: ${data.doctor.nombre}
- Sede / Consultorio: ${data.consultorio.nombre}
${data.motivo ? `- Motivo / Procedimiento: ${data.motivo}\n` : ''}
INDICACIONES IMPORTANTES:
- Por favor presentarse con 10 minutos de antelación a su horario pautado.
- Si requiere reprogramar su consulta, le agradecemos comunicarse con nosotros con anticipación.

============================================================
Agradecemos enormemente su preferencia.
ODONTOKRIS — Sistema Odontológico`
    );
  },

  /**
   * Envía el mensaje mediante WhatsApp Web / App
   */
  sendWhatsApp(phoneInputVal, data) {
    const rawPhone = (phoneInputVal || data.paciente.telefono || '').replace(/\D/g, '');
    if (!rawPhone) {
      notificationService.warning('Por favor ingrese o verifique el número de teléfono/WhatsApp del paciente.');
      const input = $('#cita-notify-phone');
      if (input) input.focus();
      return;
    }

    const cleanPhone = rawPhone.startsWith('58') ? rawPhone : ('58' + rawPhone.replace(/^0+/, ''));
    const message = this.buildWhatsAppMessage(data);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank', 'noopener,noreferrer');
    notificationService.success('Abriendo WhatsApp con los datos de la cita...');
  },

  /**
   * Envía el correo mediante mailto
   */
  sendEmail(emailInputVal, data) {
    const email = (emailInputVal || data.paciente.mail || '').trim();
    if (!email || !email.includes('@')) {
      notificationService.warning('Por favor ingrese un correo electrónico válido para el paciente.');
      const input = $('#cita-notify-email');
      if (input) input.focus();
      return;
    }

    const subject = this.buildEmailSubject(data);
    const body = this.buildEmailBody(data);
    const mailtoUrl = `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoUrl;
    notificationService.success('Abriendo cliente de correo electrónico...');
  },

  /**
   * Copia el mensaje al portapapeles
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
      notificationService.success('Texto de la cita copiado al portapapeles.');
    } catch (err) {
      console.warn('[CitaNotificationService] Error copiando texto:', err);
      notificationService.info('No se pudo copiar automáticamente.');
    }
  },

  /**
   * Renderiza la tarjeta de vista previa del mensaje
   */
  renderPreviewCard(data) {
    const isRecordatorio = data.type === 'recordatorio';

    return `
      <div class="cita-notify-preview-card box stack" data-gap="xs">
        
        <!-- Encabezado de la Tarjeta -->
        <div class="cluster" data-justify="between" data-align="start" style="border-bottom: 1px dashed rgba(125, 125, 125, 0.35); padding-bottom: 0.45rem;">
          <div>
            <div class="cluster" data-gap="xs" data-align="center">
              <span style="font-size: 1.2rem;">${isRecordatorio ? '⏰' : '📅'}</span>
              <strong style="font-size: 0.95rem; color: #0284c7; letter-spacing: 0.3px;">ODONTOKRIS</strong>
            </div>
            <div style="font-size: 0.70rem; opacity: 0.75; margin-top: 1px;">
              Sistema Odontológico · <strong>${data.consultorio.nombre}</strong>
            </div>
          </div>
          <span class="badge" data-paint="${isRecordatorio ? 'warning' : 'primary'}" style="font-size: 0.68rem; font-weight: 700; text-transform: uppercase;">
            ${isRecordatorio ? '⏰ RECORDATORIO DE CITA' : '📅 CITA PROGRAMADA'}
          </span>
        </div>

        <!-- Mensaje al Paciente -->
        <p style="margin: 0; font-size: 0.75rem; line-height: 1.35;">
          ${isRecordatorio 
            ? `Estimado(a) <strong>${data.paciente.nombre}</strong>, le recordamos su próxima consulta odontológica:` 
            : `Estimado(a) <strong>${data.paciente.nombre}</strong>, su consulta odontológica ha sido programada con éxito:`}
        </p>

        <!-- Bloque de Detalles de Horario y Consulta -->
        <div style="background: rgba(14, 165, 233, 0.06); border: 1px solid rgba(14, 165, 233, 0.22); border-radius: 6px; padding: 0.5rem 0.7rem; font-size: 0.76rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.45rem;">
          <div>
            <span style="opacity: 0.75; font-size: 0.68rem; display: block;">FECHA</span>
            <strong style="color: #0284c7; font-size: 0.82rem;">${data.fechaFormateada}</strong>
          </div>
          <div>
            <span style="opacity: 0.75; font-size: 0.68rem; display: block;">HORARIO</span>
            <strong style="color: #0f172a; font-size: 0.82rem;">${data.horaDesde12} a ${data.horaHasta12}</strong>
          </div>
          <div>
            <span style="opacity: 0.75; font-size: 0.68rem; display: block;">ESPECIALISTA</span>
            <strong style="color: #0f172a;">${data.doctor.nombre}</strong>
          </div>
          <div>
            <span style="opacity: 0.75; font-size: 0.68rem; display: block;">SEDE / CONSULTORIO</span>
            <span>${data.consultorio.nombre}</span>
          </div>
          ${data.motivo ? `
            <div style="grid-column: span 2; border-top: 1px dashed rgba(14, 165, 233, 0.2); padding-top: 0.3rem; margin-top: 0.15rem;">
              <span style="opacity: 0.75; font-size: 0.68rem; display: block;">MOTIVO / OBSERVACIÓN</span>
              <span style="font-weight: 500;">${data.motivo}</span>
            </div>
          ` : ''}
        </div>

        <!-- Nota / Recomendación Final -->
        <div style="font-size: 0.71rem; opacity: 0.85; line-height: 1.3; background: rgba(125, 125, 125, 0.05); padding: 0.35rem 0.55rem; border-radius: 4px;">
          ${isRecordatorio 
            ? '✅ <em>Se solicita al paciente responder este mensaje para confirmar o notificar reprogramación.</em>' 
            : '📍 <em>Por favor presentarse con 10 minutos de anticipación. Notificar con 24h previas en caso de cambio.</em>'}
        </div>

      </div>
    `;
  },

  /**
   * Abre el Modal de Notificación de Cita
   */
  async openNotificationModal({ cita, paciente = null, doctor = null, consultorio = null, defaultType = 'recordatorio' }) {
    const dialog = $('#modal-notificar-cita');
    if (!dialog) return;

    // Asegurar datos del paciente
    let resolvedPaciente = paciente || cita?.paciente;
    if (!resolvedPaciente && cita?.paciente_id) {
      try {
        resolvedPaciente = await patientModel.getById(cita.paciente_id);
      } catch (e) {
        console.warn('[CitaNotificationService] Error cargando paciente:', e);
      }
    }

    this.activeContext = {
      cita,
      paciente: resolvedPaciente,
      doctor: doctor || cita?.doctor,
      consultorio: consultorio || consultorioModel.getActiveConsultorio(),
      type: defaultType
    };

    this.currentData = this.buildNotificationData(this.activeContext);

    // Inyectar vista previa
    const previewContainer = $('#cita-notify-preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = this.renderPreviewCard(this.currentData);
    }

    // Actualizar botones de tipo
    this.updateTypeButtons(defaultType);

    // Pre-llenar campos de contacto del paciente
    const phoneInput = $('#cita-notify-phone');
    const emailInput = $('#cita-notify-email');
    if (phoneInput) {
      phoneInput.value = this.currentData.paciente.telefono || '';
    }
    if (emailInput) {
      emailInput.value = this.currentData.paciente.mail || '';
    }

    // Abrir modal
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }

    // Asegurar elevación de toasts en Top Layer
    if (notificationService._ensureTopLayer) {
      const toastContainer = document.getElementById('toast-container');
      if (toastContainer) notificationService._ensureTopLayer(toastContainer);
    }
  },

  /**
   * Actualiza el estado visual de los botones de tipo (Programación vs Recordatorio)
   */
  updateTypeButtons(type) {
    const btnProg = $('#btn-type-programacion');
    const btnRec = $('#btn-type-recordatorio');

    if (btnProg && btnRec) {
      if (type === 'programacion') {
        btnProg.setAttribute('data-variant', 'primary');
        btnProg.setAttribute('data-paint', 'primary');
        btnProg.classList.add('active');
        btnRec.setAttribute('data-variant', 'ghost');
        btnRec.removeAttribute('data-paint');
        btnRec.classList.remove('active');
      } else {
        btnRec.setAttribute('data-variant', 'primary');
        btnRec.setAttribute('data-paint', 'warning');
        btnRec.classList.add('active');
        btnProg.setAttribute('data-variant', 'ghost');
        btnProg.removeAttribute('data-paint');
        btnProg.classList.remove('active');
      }
    }
  },

  /**
   * Cambia el tipo de notificación activo
   */
  switchType(type) {
    if (!this.activeContext) return;
    this.activeContext.type = type;
    this.currentData = this.buildNotificationData(this.activeContext);

    const previewContainer = $('#cita-notify-preview-container');
    if (previewContainer) {
      previewContainer.innerHTML = this.renderPreviewCard(this.currentData);
    }

    this.updateTypeButtons(type);
  },

  /**
   * Cierra el modal de notificación
   */
  closeNotificationModal() {
    const dialog = $('#modal-notificar-cita');
    if (dialog && dialog.open) {
      dialog.close();
    }
  },

  /**
   * Inicializa escuchas de eventos del modal de notificaciones
   */
  initEvents() {
    // 1. Cerrar modal
    document.addEventListener('click', (e) => {
      if (e.target.closest('.btn-close-notify-modal')) {
        this.closeNotificationModal();
      }
    });

    // 2. Conmutar a "Programación"
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-type-programacion')) {
        e.preventDefault();
        this.switchType('programacion');
      }
    });

    // 3. Conmutar a "Recordatorio"
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-type-recordatorio')) {
        e.preventDefault();
        this.switchType('recordatorio');
      }
    });

    // 4. Enviar por WhatsApp
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-notify-send-whatsapp')) {
        e.preventDefault();
        const phone = $('#cita-notify-phone')?.value;
        if (this.currentData) {
          this.sendWhatsApp(phone, this.currentData);
        }
      }
    });

    // 5. Enviar por Correo Electrónico
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-notify-send-email')) {
        e.preventDefault();
        const email = $('#cita-notify-email')?.value;
        if (this.currentData) {
          this.sendEmail(email, this.currentData);
        }
      }
    });

    // 6. Copiar texto formateado
    document.addEventListener('click', async (e) => {
      if (e.target.closest('#btn-notify-copy-text')) {
        e.preventDefault();
        if (this.currentData) {
          await this.copyText(this.currentData);
        }
      }
    });
  }
};
