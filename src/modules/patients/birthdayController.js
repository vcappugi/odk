/**
 * Controlador de Cumpleañeros de la Semana
 * Módulo: Pacientes / Notificaciones Clínicas
 * ODONTOKRIS - Sistema Odontológico
 */

import { patientModel } from './patientModel.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { authModel } from '../auth/authModel.js';
import { $ } from '../../utils/dom.js';

export const birthdayController = {
  /**
   * Inicializa el banner de cumpleañeros y escucha eventos del sistema
   */
  init() {
    this.renderBanner();

    // Escuchar eventos de sesión, consultorio y pacientes
    window.addEventListener('auth:change', () => this.renderBanner());
    window.addEventListener('consultorio:changed', () => this.renderBanner());
    window.addEventListener('patient:saved', () => this.renderBanner());
    window.addEventListener('patient:deleted', () => this.renderBanner());
  },

  /**
   * Obtiene los 7 días de la semana actual (Lunes a Domingo)
   */
  getCurrentWeekDays() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday, 0, 0, 0, 0);
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i, 12, 0, 0);
      weekDays.push({
        date: d,
        month: d.getMonth() + 1, // 1 a 12
        day: d.getDate(),
        dayName: dayNames[d.getDay()],
        monthName: monthNames[d.getMonth()],
        isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
      });
    }

    const sunday = weekDays[6];
    const rangeText = `${monday.getDate()} al ${sunday.day} de ${monthNames[sunday.date.getMonth()]}`;

    return { weekDays, monday, sunday: sunday.date, rangeText };
  },

  /**
   * Obtiene los pacientes del consultorio logueado cuyo cumpleaños cae en esta semana
   */
  async getWeeklyBirthdays() {
    const activeSede = consultorioModel.getActiveConsultorio() || authModel.getActiveConsultorio() || authModel.getCurrentUser()?.consultorio;
    const consultorioId = activeSede?.id || authModel.getCurrentUser()?.consultorio_id || null;

    if (!consultorioId) {
      return { birthdays: [], rangeText: '', sedeNombre: 'Sede de la Sesión' };
    }

    try {
      const allPatients = await patientModel.getAll(consultorioId);
      const { weekDays, rangeText } = this.getCurrentWeekDays();
      const birthdays = [];

      allPatients.forEach(patient => {
        // Validación estricta por consultorio logueado
        if (patient.consultorio_id && String(patient.consultorio_id) !== String(consultorioId)) {
          return;
        }

        if (!patient.fecha_nacimiento) return;
        const bStr = String(patient.fecha_nacimiento).substring(0, 10);
        const parts = bStr.split('-').map(Number);
        if (parts.length !== 3) return;
        const [bYear, bMonth, bDay] = parts;
        if (isNaN(bMonth) || isNaN(bDay)) return;

        // Comprobar si coincide con algún día de esta semana
        const matchDay = weekDays.find(wd => wd.month === bMonth && wd.day === bDay);
        if (matchDay) {
          const turningAge = (!isNaN(bYear) && bYear > 1900) ? (matchDay.date.getFullYear() - bYear) : null;
          birthdays.push({
            id: patient.id,
            nombre: patient.nombre,
            ci: patient.ci || '',
            telefono: patient.telefono || '',
            fecha_nacimiento: bStr,
            dayName: matchDay.dayName,
            dayNumber: matchDay.day,
            monthName: matchDay.monthName,
            isToday: matchDay.isToday,
            turningAge,
            targetDate: matchDay.date
          });
        }
      });

      // Ordenar: primero los que cumplen hoy, luego en orden cronológico semanal
      birthdays.sort((a, b) => {
        if (a.isToday && !b.isToday) return -1;
        if (!a.isToday && b.isToday) return 1;
        return a.targetDate - b.targetDate;
      });

      return {
        birthdays,
        rangeText,
        sedeNombre: activeSede?.nombre || 'esta sede'
      };
    } catch (err) {
      console.warn('[BirthdayController] Error obteniendo cumpleañeros:', err);
      return { birthdays: [], rangeText: '', sedeNombre: 'esta sede' };
    }
  },

  /**
   * Renderiza el mensaje de cumpleañeros en la interfaz
   */
  async renderBanner() {
    const container = $('#weekly-birthday-banner');
    if (!container) return;

    const currentUser = authModel.getCurrentUser();
    if (!currentUser) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    const { birthdays, rangeText, sedeNombre } = await this.getWeeklyBirthdays();
    container.style.display = 'block';

    if (birthdays.length === 0) {
      container.innerHTML = `
        <div class="weekly-birthday-banner-wrap">
          <div class="birthday-banner-card box cluster" data-justify="between" data-align="center">
            <div class="cluster" data-gap="xs" data-align="center">
              <span class="birthday-banner-icon" aria-hidden="true">🎂</span>
              <div>
                <strong style="font-size: 0.84rem; color: #d97706;">Cumpleañeros de la semana (${rangeText}):</strong>
                <span style="font-size: 0.80rem; opacity: 0.85; margin-left: 0.25rem;">
                  No hay pacientes de cumpleaños registrados para esta semana en ${sedeNombre}.
                </span>
              </div>
            </div>
            <span class="badge" data-paint="neutral" style="font-size: 0.68rem; opacity: 0.8;">
              🏥 ${sedeNombre}
            </span>
          </div>
        </div>
      `;
      return;
    }

    const todayCount = birthdays.filter(b => b.isToday).length;

    container.innerHTML = `
      <div class="weekly-birthday-banner-wrap">
        <div class="birthday-banner-card box stack" data-gap="2xs">
          
          <div class="cluster" data-justify="between" data-align="center">
            <div class="cluster" data-gap="xs" data-align="center">
              <span class="birthday-banner-icon birthday-banner-icon-animated" aria-hidden="true">🎉</span>
              <div>
                <div class="cluster" data-gap="2xs" data-align="center">
                  <h4 class="birthday-banner-title">
                    🎂 Cumpleañeros de la Semana (${rangeText})
                  </h4>
                  <span class="badge" data-paint="warning" style="font-size: 0.68rem; font-weight: 800;">
                    ${birthdays.length} ${birthdays.length === 1 ? 'cumpleañero' : 'cumpleañeros'}
                  </span>
                  ${todayCount > 0 ? `
                    <span class="badge" data-paint="success" style="font-size: 0.68rem; font-weight: 800; background: #10b981; color: #ffffff;">
                      ⭐ ¡${todayCount} de cumpleaños hoy!
                    </span>
                  ` : ''}
                </div>
                <small style="opacity: 0.8; font-size: 0.72rem;">
                  Pacientes de ${sedeNombre} que celebran su cumpleaños en esta semana
                </small>
              </div>
            </div>

            <span class="badge" data-paint="neutral" style="font-size: 0.68rem; opacity: 0.85;">
              🏥 ${sedeNombre}
            </span>
          </div>

          <!-- Listado de fichas de cumpleañeros -->
          <div class="birthday-chips-cluster cluster" data-gap="xs" data-align="center">
            ${birthdays.map(p => {
              const cleanPhone = (p.telefono || '').replace(/\D/g, '');
              const waLink = cleanPhone ? `https://wa.me/${cleanPhone.startsWith('58') ? cleanPhone : ('58' + cleanPhone.replace(/^0+/, ''))}?text=${encodeURIComponent(`¡Hola ${p.nombre}! 🦷 Desde ODONTOKRIS te deseamos un muy Feliz Cumpleaños 🎉🎂 Esperamos que pases un día maravilloso lleno de salud y alegría.`)}` : null;

              return `
                <div class="birthday-patient-chip ${p.isToday ? 'is-today' : ''}">
                  <span style="font-size: 0.95rem;">${p.isToday ? '🎁' : '🎈'}</span>
                  <strong class="birthday-patient-name">${p.nombre}</strong>
                  <span class="badge ${p.isToday ? '' : 'birthday-badge-day'}" data-paint="${p.isToday ? 'success' : 'neutral'}" style="font-size: 0.68rem; font-weight: 700;">
                    ${p.isToday ? '¡HOY!' : `${p.dayName} ${p.dayNumber}`}
                  </span>
                  ${p.turningAge ? `
                    <span class="birthday-turning-age">(${p.turningAge} años)</span>
                  ` : ''}
                  ${waLink ? `
                    <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="button btn-birthday-wa" data-paint="success" data-size="2xs" title="Enviar felicitación por WhatsApp al paciente">
                      <span>💬 Felicitar</span>
                    </a>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>

        </div>
      </div>
    `;
  }
};
