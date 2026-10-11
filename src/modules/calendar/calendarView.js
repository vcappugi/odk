/**
 * Vista del Calendario Odontológico (Calendar View)
 * Genera el marcado para las vistas de Mes, Semana y Día con Foundation Yeti CSS.
 */

const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Citas odontológicas de muestra para hacer la interfaz viva y profesional
const SAMPLE_APPOINTMENTS = [
  { dayOffset: 0, hour: 9, patient: 'Carlos Mendoza', treatment: 'Limpieza Dental', status: 'confirmada' },
  { dayOffset: 0, hour: 11, patient: 'Mariana Silva', treatment: 'Valoración Ortodoncia', status: 'en_espera' },
  { dayOffset: 0, hour: 15, patient: 'Andrés Gómez', treatment: 'Control de Brackets', status: 'confirmada' },
  { dayOffset: 1, hour: 10, patient: 'Lucía Torres', treatment: 'Extracción Simple', status: 'confirmada' },
  { dayOffset: 2, hour: 14, patient: 'Roberto Díaz', treatment: 'Endodoncia Pieza 16', status: 'confirmada' },
  { dayOffset: -1, hour: 16, patient: 'Elena Ramos', treatment: 'Blanqueamiento', status: 'realizada' }
];

export const calendarView = {
  /**
   * Obtiene el título legible según la fecha y el modo de vista
   */
  getPeriodTitle(date, mode) {
    const year = date.getFullYear();
    const monthName = MONTHS_NAMES[date.getMonth()];

    if (mode === 'month') {
      return `${monthName} ${year}`;
    }

    if (mode === 'week') {
      const weekDays = this.getWeekDays(date);
      const first = weekDays[0];
      const last = weekDays[6];
      const firstMonth = MONTHS_NAMES[first.getMonth()].slice(0, 3);
      const lastMonth = MONTHS_NAMES[last.getMonth()].slice(0, 3);

      if (first.getMonth() === last.getMonth()) {
        return `${first.getDate()} - ${last.getDate()} de ${firstMonth} ${year}`;
      }
      return `${first.getDate()} ${firstMonth} - ${last.getDate()} ${lastMonth} ${year}`;
    }

    if (mode === 'day') {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
      return `${dayName}, ${date.getDate()} de ${monthName} ${year}`;
    }

    return `${monthName} ${year}`;
  },

  /**
   * Comprueba si dos fechas corresponden al mismo día del año
   */
  isSameDay(d1, d2) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  },

  /**
   * Obtiene el arreglo de los 7 días de la semana (Lunes a Domingo) para una fecha dada
   */
  getWeekDays(baseDate) {
    const current = new Date(baseDate);
    const day = current.getDay();
    // En JS 0 es Domingo. Si es domingo (0), offset es -6 para llegar al lunes previo.
    const diffToMonday = day === 0 ? -6 : 1 - day;
    current.setDate(current.getDate() + diffToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  },

  /**
   * 1. RENDER VISTA POR MES
   */
  renderMonthView(activeDate, todayDate) {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let daysHtml = '';

    // Días del mes anterior
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      daysHtml += `
        <div class="cal-day-cell is-other-month" data-disabled="true">
          <span class="day-number">${dayNum}</span>
        </div>
      `;
    }

    // Días del mes activo
    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = new Date(year, month, i);
      const isToday = this.isSameDay(thisDate, todayDate);
      const isSelected = this.isSameDay(thisDate, activeDate);

      // Simular citas en algunos días
      const hasCita = (i === todayDate.getDate() && month === todayDate.getMonth()) || i === 15 || i === 22;

      daysHtml += `
        <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" 
             data-date="${thisDate.toISOString()}" 
             tabindex="0"
             role="button"
             aria-label="${i} de ${MONTHS_NAMES[month]}">
          <div class="day-header cluster" data-justify="between" data-align="center">
            <span class="day-number">${i}</span>
            ${isToday ? '<span class="today-tag">Hoy</span>' : ''}
          </div>
          <div class="day-content">
            ${hasCita ? '<span class="appointment-dot" title="Citas agendadas">🦷</span>' : ''}
          </div>
        </div>
      `;
    }

    // Días del mes siguiente para completar la cuadrícula (múltiplo de 7)
    const totalCells = startingDay + daysInMonth;
    const nextDays = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= nextDays; i++) {
      daysHtml += `
        <div class="cal-day-cell is-other-month" data-disabled="true">
          <span class="day-number">${i}</span>
        </div>
      `;
    }

    const headersHtml = DAYS_SHORT.map(d => `<div class="cal-weekday-header">${d}</div>`).join('');

    return `
      <div class="cal-month-wrapper stack" data-gap="xs">
        <div class="cal-weekdays-row">
          ${headersHtml}
        </div>
        <div class="cal-month-grid">
          ${daysHtml}
        </div>
      </div>
    `;
  },

  /**
   * 2. RENDER VISTA POR SEMANA
   */
  renderWeekView(activeDate, todayDate) {
    const weekDays = this.getWeekDays(activeDate);

    const columnsHtml = weekDays.map((d, index) => {
      const isToday = this.isSameDay(d, todayDate);
      const isSelected = this.isSameDay(d, activeDate);
      const dayName = DAYS_SHORT[index];
      const dayNumber = d.getDate();

      // Citas de ejemplo para el día actual
      const dayAppointments = isToday ? [
        { time: '09:00 AM', patient: 'Carlos Mendoza', treatment: 'Limpieza Dental', type: 'primary' },
        { time: '11:30 AM', patient: 'Mariana Silva', treatment: 'Ortodoncia', type: 'secondary' },
        { time: '03:00 PM', patient: 'Andrés Gómez', treatment: 'Control', type: 'success' }
      ] : (index === 2 ? [
        { time: '10:00 AM', patient: 'Lucía Torres', treatment: 'Extracción', type: 'primary' }
      ] : []);

      const appointmentsHtml = dayAppointments.map(app => `
        <div class="cal-appointment-card" data-app-type="${app.type}">
          <time class="app-time">${app.time}</time>
          <strong class="app-patient">${app.patient}</strong>
          <span class="app-treatment">${app.treatment}</span>
        </div>
      `).join('');

      return `
        <div class="cal-week-col ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${d.toISOString()}">
          <div class="week-col-header">
            <span class="col-day-name">${dayName}</span>
            <span class="col-day-num">${dayNumber}</span>
            ${isToday ? '<span class="today-tag-small">Hoy</span>' : ''}
          </div>
          <div class="week-col-body stack" data-gap="xs">
            ${appointmentsHtml || '<div class="empty-slot">Sin citas</div>'}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cal-week-wrapper">
        <div class="cal-week-grid">
          ${columnsHtml}
        </div>
      </div>
    `;
  },

  /**
   * 3. RENDER VISTA POR DÍA
   */
  renderDayView(activeDate, todayDate) {
    const isToday = this.isSameDay(activeDate, todayDate);
    const hours = [
      '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];

    // Citas para la vista detallada por horas
    const slotsMap = {
      '09:00 AM': { patient: 'Carlos Mendoza', treatment: 'Limpieza Dental Profiláctica', doctor: 'Dra. Kris', status: 'En consulta' },
      '11:00 AM': { patient: 'Mariana Silva', treatment: 'Ajuste de Ortodoncia', doctor: 'Dra. Kris', status: 'Confirmada' },
      '03:00 PM': { patient: 'Andrés Gómez', treatment: 'Control Post-Operatorio', doctor: 'Dra. Kris', status: 'Programada' }
    };

    const timeSlotsHtml = hours.map(hour => {
      const app = slotsMap[hour];
      return `
        <div class="cal-hour-row cluster" data-gap="sm" data-align="center">
          <div class="hour-label">${hour}</div>
          <div class="hour-content">
            ${app ? `
              <div class="day-agenda-card box cluster" data-surface="raised" data-border data-justify="between" data-align="center">
                <div class="stack" data-gap="2xs">
                  <strong class="agenda-patient">🦷 ${app.patient}</strong>
                  <span class="agenda-treatment">${app.treatment}</span>
                </div>
                <div class="cluster" data-gap="xs">
                  <span class="badge" data-paint="primary">${app.doctor}</span>
                  <span class="badge" data-paint="success">${app.status}</span>
                </div>
              </div>
            ` : `
              <div class="hour-empty-slot">
                <span>Disponible para turno odontológico</span>
              </div>
            `}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cal-day-wrapper stack" data-gap="md">
        <div class="cal-day-banner cluster" data-justify="between" data-align="center">
          <div class="cluster" data-gap="sm" data-align="center">
            <span class="day-banner-badge">${activeDate.getDate()}</span>
            <div>
              <h4 style="margin: 0;">Agenda de Consultorio</h4>
              <p style="margin: 0; opacity: 0.75; font-size: 0.88rem;">${this.getPeriodTitle(activeDate, 'day')}</p>
            </div>
          </div>
          ${isToday ? '<span class="badge" data-paint="success">Día Actual (Hoy)</span>' : ''}
        </div>

        <div class="cal-day-timeline stack" data-gap="xs">
          ${timeSlotsHtml}
        </div>
      </div>
    `;
  }
};
