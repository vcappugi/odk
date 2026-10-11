/**
 * Vista del Calendario Odontológico (Calendar View)
 * Genera el marcado para las vistas de Mes, Semana y Día con datos reales de la tabla 'cita'.
 */

const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Formatea una fecha local a formato 'YYYY-MM-DD'
 */
function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
   * @param {Date} activeDate
   * @param {Date} todayDate
   * @param {Array} citas - Citas reales de Supabase
   */
  renderMonthView(activeDate, todayDate, citas = []) {
    const year = activeDate.getFullYear();
    const month = activeDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    // Ajustar para que la semana empiece en Lunes (0 = Lunes, 6 = Domingo)
    const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    let daysHtml = '';

    // Días del mes anterior (deshabilitados)
    for (let i = startingDay - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      daysHtml += `
        <div class="cal-day-cell is-other-month" data-disabled="true">
          <div class="day-header cluster" data-justify="start">
            <span class="day-number">${dayNum}</span>
          </div>
        </div>
      `;
    }

    // Días del mes activo
    for (let i = 1; i <= daysInMonth; i++) {
      const thisDate = new Date(year, month, i);
      const dateStr = toLocalDateStr(thisDate);
      const isToday = this.isSameDay(thisDate, todayDate);
      const isSelected = this.isSameDay(thisDate, activeDate);

      // Filtrar citas correspondientes a este día
      const dayCitas = citas.filter(c => c.fecha === dateStr);

      let appointmentsHtml = '';
      if (dayCitas.length > 0) {
        appointmentsHtml = `
          <div class="cal-month-citas-list stack" data-gap="2xs">
            ${dayCitas.slice(0, 3).map(c => `
              <div class="cal-month-cita-chip" data-cita-id="${c.id}" title="${c.hora_desde?.slice(0, 5)}: ${c.paciente?.nombre || 'Paciente'}">
                <span class="chip-time">${c.hora_desde ? c.hora_desde.slice(0, 5) : ''}</span>
                <span class="chip-patient">${c.paciente?.nombre || 'Paciente'}</span>
              </div>
            `).join('')}
            ${dayCitas.length > 3 ? `<span class="citas-more-badge">+${dayCitas.length - 3} más</span>` : ''}
          </div>
        `;
      } else {
        appointmentsHtml = `
          <div class="month-cell-empty-hint" data-action="add-cita" data-date="${dateStr}">
            <span class="hint-plus">+</span>
          </div>
        `;
      }

      daysHtml += `
        <div class="cal-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" 
             data-date="${dateStr}" 
             tabindex="0"
             role="button"
             aria-label="${i} de ${MONTHS_NAMES[month]}">
          <div class="day-header cluster" data-justify="between" data-align="center">
            <span class="day-number" data-action="view-day" data-date="${dateStr}" title="Ver agenda de este día">${i}</span>
            ${isToday ? '<span class="today-tag">Hoy</span>' : ''}
          </div>
          <div class="day-content" data-action="add-cita" data-date="${dateStr}">
            ${appointmentsHtml}
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
          <div class="day-header cluster" data-justify="start">
            <span class="day-number">${i}</span>
          </div>
        </div>
      `;
    }

    const headersHtml = DAYS_SHORT.map((d, idx) => `
      <div class="cal-weekday-header">
        <span class="weekday-name-short">${d}</span>
        <span class="weekday-name-mini">${['L', 'M', 'X', 'J', 'V', 'S', 'D'][idx]}</span>
      </div>
    `).join('');

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
   * @param {Date} activeDate
   * @param {Date} todayDate
   * @param {Array} citas - Citas reales de Supabase
   */
  renderWeekView(activeDate, todayDate, citas = []) {
    const weekDays = this.getWeekDays(activeDate);

    const columnsHtml = weekDays.map((d, index) => {
      const dateStr = toLocalDateStr(d);
      const isToday = this.isSameDay(d, todayDate);
      const isSelected = this.isSameDay(d, activeDate);
      const dayName = DAYS_SHORT[index];
      const dayNumber = d.getDate();

      // Citas de este día
      const dayCitas = citas.filter(c => c.fecha === dateStr);

      let appointmentsHtml = '';
      if (dayCitas.length > 0) {
        appointmentsHtml = dayCitas.map(c => `
          <div class="cal-appointment-card" data-cita-id="${c.id}" title="Clic para modificar o eliminar">
            <time class="app-time">⏰ ${c.hora_desde ? c.hora_desde.slice(0, 5) : ''} - ${c.hora_hasta ? c.hora_hasta.slice(0, 5) : ''}</time>
            <strong class="app-patient">👤 ${c.paciente?.nombre || 'Paciente'}</strong>
            <span class="app-treatment">${c.observacion || (c.doctor?.nombre ? 'Dr(a). ' + c.doctor.nombre : 'Consulta')}</span>
          </div>
        `).join('');
      }

      return `
        <div class="cal-week-col ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateStr}">
          <div class="week-col-header" data-action="view-day" data-date="${dateStr}">
            <span class="col-day-name">${dayName}</span>
            <span class="col-day-num">${dayNumber}</span>
            ${isToday ? '<span class="today-tag-small">Hoy</span>' : ''}
          </div>
          <div class="week-col-body stack" data-gap="xs">
            ${appointmentsHtml}
            <div class="empty-slot clickable-empty-slot" data-action="add-cita" data-date="${dateStr}">
              <span>➕ Clic para agendar</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="cal-week-container stack" data-gap="xs">
        <div class="cal-week-scroll-hint">
          <span>👈 Desliza horizontalmente para ver los 7 días 👉</span>
        </div>
        <div class="cal-week-wrapper">
          <div class="cal-week-grid">
            ${columnsHtml}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 3. RENDER VISTA POR DÍA
   * @param {Date} activeDate
   * @param {Date} todayDate
   * @param {Array} citas - Citas reales de Supabase
   */
  renderDayView(activeDate, todayDate, citas = []) {
    const dateStr = toLocalDateStr(activeDate);
    const isToday = this.isSameDay(activeDate, todayDate);

    // Horas disponibles para la agenda (08:00 AM a 06:00 PM)
    const hours = [
      { label: '08:00 AM', hourNum: 8 },
      { label: '09:00 AM', hourNum: 9 },
      { label: '10:00 AM', hourNum: 10 },
      { label: '11:00 AM', hourNum: 11 },
      { label: '12:00 PM', hourNum: 12 },
      { label: '01:00 PM', hourNum: 13 },
      { label: '02:00 PM', hourNum: 14 },
      { label: '03:00 PM', hourNum: 15 },
      { label: '04:00 PM', hourNum: 16 },
      { label: '05:00 PM', hourNum: 17 },
      { label: '06:00 PM', hourNum: 18 }
    ];

    // Citas correspondientes al día seleccionado
    const dayCitas = citas.filter(c => c.fecha === dateStr);

    const timeSlotsHtml = hours.map(h => {
      const hourStr = String(h.hourNum).padStart(2, '0');
      const nextHourStr = String(h.hourNum + 1).padStart(2, '0');

      // Citas que inician en esta hora (ej: 09:00, 09:30)
      const slotCitas = dayCitas.filter(c => {
        if (!c.hora_desde) return false;
        const cHour = parseInt(c.hora_desde.split(':')[0], 10);
        return cHour === h.hourNum;
      });

      return `
        <div class="cal-hour-row cluster" data-gap="sm" data-align="center">
          <div class="hour-label">${h.label}</div>
          <div class="hour-content stack" data-gap="xs">
            ${slotCitas.length > 0 ? slotCitas.map(c => `
              <div class="day-agenda-card box cluster" 
                   data-surface="raised" 
                   data-border 
                   data-justify="between" 
                   data-align="center"
                   data-cita-id="${c.id}"
                   title="Clic para modificar o eliminar cita">
                <div class="stack" data-gap="2xs">
                  <strong class="agenda-patient">🦷 👤 ${c.paciente?.nombre || 'Paciente sin nombre'} ${c.paciente?.ci ? `(CI: ${c.paciente.ci})` : ''}</strong>
                  <span class="agenda-treatment">
                    ⏰ <strong>${c.hora_desde?.slice(0, 5)} - ${c.hora_hasta?.slice(0, 5)}</strong> | ${c.observacion || 'Consulta odontológica'}
                  </span>
                </div>
                <div class="cluster" data-gap="xs">
                  ${c.doctor?.nombre ? `<span class="badge" data-paint="primary">🩺 Dr(a). ${c.doctor.nombre}</span>` : ''}
                  <span class="badge" data-paint="success" style="cursor: pointer;">✏️ Modificar</span>
                </div>
              </div>
            `).join('') : `
              <div class="hour-empty-slot clickable-empty-slot" 
                   data-action="add-cita" 
                   data-date="${dateStr}" 
                   data-time="${hourStr}:00" 
                   data-time-end="${nextHourStr}:00"
                   title="Clic para agendar cita en este horario">
                <span>➕ Disponible a las ${h.label} — Clic para agendar cita</span>
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
              <p style="margin: 0; opacity: 0.75; font-size: 0.88rem;">${this.getPeriodTitle(activeDate, 'day')} (${dayCitas.length} citas programadas)</p>
            </div>
          </div>
          <div class="cluster" data-gap="xs">
            <button type="button" class="button btn-add-cita-quick" data-action="add-cita" data-date="${dateStr}" data-paint="primary" data-size="sm">
              ➕ Agendar Cita
            </button>
            ${isToday ? '<span class="badge" data-paint="success">Día Actual (Hoy)</span>' : ''}
          </div>
        </div>

        <div class="cal-day-timeline stack" data-gap="xs">
          ${timeSlotsHtml}
        </div>
      </div>
    `;
  }
};
