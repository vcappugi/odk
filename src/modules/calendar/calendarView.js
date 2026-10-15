/**
 * Vista del Calendario Odontológico (Calendar View)
 * Genera el marcado para las vistas de Mes, Semana y Día con datos reales de la tabla 'cita'.
 * Asigna colores diferenciados a cada doctor, oculta datos sensibles de pacientes cuando no se está logueado
 * y genera la leyenda interactiva.
 */

import { isCitaAtendida, normalizeCitaEstatus } from '../cita/citaModel.js';

const DAYS_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Paleta de colores armoniosa para diferenciar doctores
 */
export const DOCTOR_PALETTES = [
  { id: 0, className: 'doc-color-0', border: '#0284c7', bg: 'rgba(2, 132, 199, 0.14)', text: '#0284c7', name: 'Azul Océano' },
  { id: 1, className: 'doc-color-1', border: '#059669', bg: 'rgba(16, 185, 129, 0.14)', text: '#059669', name: 'Verde Esmeralda' },
  { id: 2, className: 'doc-color-2', border: '#7c3aed', bg: 'rgba(139, 92, 246, 0.14)', text: '#7c3aed', name: 'Púrpura Amatista' },
  { id: 3, className: 'doc-color-3', border: '#d97706', bg: 'rgba(245, 158, 11, 0.15)', text: '#b45309', name: 'Ámbar Cálido' },
  { id: 4, className: 'doc-color-4', border: '#e11d48', bg: 'rgba(244, 63, 94, 0.14)', text: '#e11d48', name: 'Rosa Coral' },
  { id: 5, className: 'doc-color-5', border: '#0d9488', bg: 'rgba(20, 184, 166, 0.14)', text: '#0d9488', name: 'Verde Turquesa' },
  { id: 6, className: 'doc-color-6', border: '#4f46e5', bg: 'rgba(99, 102, 241, 0.14)', text: '#4f46e5', name: 'Índigo Profundo' },
  { id: 7, className: 'doc-color-7', border: '#c026d3', bg: 'rgba(217, 70, 239, 0.14)', text: '#c026d3', name: 'Fucsia Rubí' },
  { id: 8, className: 'doc-color-8', border: '#0891b2', bg: 'rgba(6, 182, 212, 0.14)', text: '#0891b2', name: 'Cian Glaciar' },
  { id: 9, className: 'doc-color-9', border: '#ea580c', bg: 'rgba(249, 115, 22, 0.14)', text: '#ea580c', name: 'Naranja Cítrico' },
  { id: 10, className: 'doc-color-10', border: '#65a30d', bg: 'rgba(132, 204, 22, 0.15)', text: '#65a30d', name: 'Verde Lima' },
  { id: 11, className: 'doc-color-11', border: '#b45309', bg: 'rgba(180, 83, 9, 0.14)', text: '#b45309', name: 'Canela Bronce' },
];

/**
 * Obtiene los metadatos de color asignados a un doctor
 * @param {number|string|null} doctorId
 */
export function getDoctorColorMeta(doctorId) {
  if (doctorId === null || doctorId === undefined || doctorId === '' || doctorId === 'unassigned') {
    return {
      className: 'doc-color-neutral',
      border: '#64748b',
      bg: 'rgba(100, 116, 139, 0.14)',
      text: '#64748b',
      name: 'Sin Asignar'
    };
  }
  const num = typeof doctorId === 'number' ? doctorId : parseInt(String(doctorId).replace(/\D/g, ''), 10);
  let idx = 0;
  if (!isNaN(num) && num > 0) {
    idx = (num - 1) % DOCTOR_PALETTES.length;
  } else {
    let hash = 0;
    const str = String(doctorId);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    idx = Math.abs(hash) % DOCTOR_PALETTES.length;
  }
  return DOCTOR_PALETTES[idx];
}

/**
 * Nombre completo formateado del doctor
 */
export function getDoctorDisplayName(doctor) {
  if (!doctor || !doctor.nombre) return 'Sin doctor asignado';
  const name = doctor.nombre.trim();
  if (/^dr/i.test(name)) return name;
  return `Dr(a). ${name}`;
}

/**
 * Nombre abreviado para chips compactos
 */
export function getDoctorShortName(doctor) {
  if (!doctor || !doctor.nombre) return 'Sin Dr.';
  let name = doctor.nombre.trim().replace(/^dr(a)?\.?\s*/i, '');
  const parts = name.split(/\s+/);
  if (parts.length === 1) return `Dr. ${parts[0]}`;
  return `Dr. ${parts[parts.length - 1]}`;
}

/**
 * Procesa la información del paciente y la observación protegiendo la privacidad si no hay sesión activa.
 * Cuando NO está logueado se muestra 'Ocupado' en lugar del nombre del paciente.
 * @param {Object} cita
 * @param {boolean} isAuthenticated
 */
export function getAppointmentDisplayInfo(cita, isAuthenticated) {
  if (!isAuthenticated) {
    return {
      paciente: 'Ocupado',
      pacienteFull: 'Ocupado',
      pacienteCi: '',
      observacion: 'Horario reservado',
      isMasked: true
    };
  }

  const pName = cita.paciente?.nombre?.trim() || 'Paciente sin nombre';
  const pCi = cita.paciente?.ci ? `(CI: ${cita.paciente.ci})` : '';
  const obs = cita.observacion?.trim() || 'Consulta odontológica';

  return {
    paciente: pName,
    pacienteFull: pName,
    pacienteCi: pCi,
    observacion: obs,
    isMasked: false
  };
}

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
   * @param {Array} citas - Citas filtradas
   * @param {Object} options - { isAuthenticated }
   */
  renderMonthView(activeDate, todayDate, citas = [], { isAuthenticated = false } = {}) {
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
            ${dayCitas.slice(0, 3).map(c => {
              const colorMeta = getDoctorColorMeta(c.doctor_id);
              const docFull = getDoctorDisplayName(c.doctor);
              const docShort = getDoctorShortName(c.doctor);
              const hora = c.hora_desde ? c.hora_desde.slice(0, 5) : '';
              const info = getAppointmentDisplayInfo(c, isAuthenticated);

              const normStatus = normalizeCitaEstatus(c.estatus);
              const isAtendida = normStatus === 'ATENDIDO';
              const isNoAsistio = normStatus === 'NO ASISTIO';

              let statusText = 'Pendiente';
              let statusClass = 'is-pendiente';
              let statusCheck = '';

              if (isAtendida) {
                statusText = 'Atendido';
                statusClass = 'is-atendida';
                statusCheck = '<span class="chip-status-check" title="Atendido">✓</span> ';
              } else if (isNoAsistio) {
                statusText = 'No Asistió';
                statusClass = 'is-no-asistio';
                statusCheck = '<span class="chip-status-missed" title="No Asistió">✗</span> ';
              }

              return `
                <div class="cal-month-cita-chip ${colorMeta.className} ${info.isMasked ? 'is-masked' : ''} ${statusClass}" 
                     data-cita-id="${c.id}" 
                     title="🩺 ${docFull}&#10;⏰ ${hora}&#10;👤 ${info.paciente}&#10;📌 Estatus: ${statusText}">
                  <span class="chip-dot" style="background-color: var(--doc-border);"></span>
                  <span class="chip-time">${hora}</span>
                  <span class="chip-patient">${info.isMasked ? '🔒 ' : ''}${statusCheck}${info.paciente}</span>
                  <span class="chip-doc">${docShort}</span>
                </div>
              `;
            }).join('')}
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
   * @param {Array} citas - Citas filtradas
   * @param {Object} options - { isAuthenticated }
   */
  renderWeekView(activeDate, todayDate, citas = [], { isAuthenticated = false } = {}) {
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
        appointmentsHtml = dayCitas.map(c => {
          const colorMeta = getDoctorColorMeta(c.doctor_id);
          const docFull = getDoctorDisplayName(c.doctor);
          const docShort = getDoctorShortName(c.doctor);
          const horaDesde = c.hora_desde ? c.hora_desde.slice(0, 5) : '';
          const horaHasta = c.hora_hasta ? c.hora_hasta.slice(0, 5) : '';
          const info = getAppointmentDisplayInfo(c, isAuthenticated);

          const normStatus = normalizeCitaEstatus(c.estatus);
          let statusBadge = `<span class="badge-status-pill badge-status-pendiente" title="Cita Pendiente">🟡 Pendiente</span>`;
          let statusTitle = 'Pendiente';

          if (normStatus === 'ATENDIDO') {
            statusBadge = `<span class="badge-status-pill badge-status-atendida" title="Cita Atendida (Bloqueada)">🟢 Atendido</span>`;
            statusTitle = 'Atendido';
          } else if (normStatus === 'NO ASISTIO') {
            statusBadge = `<span class="badge-status-pill badge-status-no-asistio" title="Cita No Asistió">🔴 No Asistió</span>`;
            statusTitle = 'No Asistió';
          }

          return `
            <div class="cal-appointment-card ${colorMeta.className} ${info.isMasked ? 'is-masked' : ''}" 
                 data-cita-id="${c.id}" 
                 title="🩺 ${docFull} — ${info.paciente} (${statusTitle})">
              <div class="app-card-header cluster" data-justify="between" data-align="center">
                <time class="app-time">⏰ ${horaDesde} - ${horaHasta}</time>
                <div class="cluster" data-gap="2xs" data-align="center">
                  ${statusBadge}
                  <span class="badge-doctor-pill" style="background-color: var(--doc-border); color: #fff;" title="${docFull}">
                    🩺 ${docShort}
                  </span>
                </div>
              </div>
              <strong class="app-patient">${info.isMasked ? '🔒 ' : '👤 '}${info.paciente}</strong>
              <span class="app-treatment">${info.observacion}</span>
            </div>
          `;
        }).join('');
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
   * @param {Array} citas - Citas filtradas
   * @param {Object} options - { isAuthenticated }
   */
  renderDayView(activeDate, todayDate, citas = [], { isAuthenticated = false } = {}) {
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
            ${slotCitas.length > 0 ? slotCitas.map(c => {
              const colorMeta = getDoctorColorMeta(c.doctor_id);
              const docFull = getDoctorDisplayName(c.doctor);
              const horaDesde = c.hora_desde?.slice(0, 5) || '';
              const horaHasta = c.hora_hasta?.slice(0, 5) || '';
              const info = getAppointmentDisplayInfo(c, isAuthenticated);

              const normStatus = normalizeCitaEstatus(c.estatus);
              const isAtendida = normStatus === 'ATENDIDO';
              const isNoAsistio = normStatus === 'NO ASISTIO';

              let statusBadge = `<span class="badge-status-pill badge-status-pendiente" title="Estatus: Pendiente">🟡 Pendiente</span>`;
              if (isAtendida) {
                statusBadge = `<span class="badge-status-pill badge-status-atendida" title="Estatus: Atendido (Bloqueada)">🟢 Atendido</span>`;
              } else if (isNoAsistio) {
                statusBadge = `<span class="badge-status-pill badge-status-no-asistio" title="Estatus: No Asistió">🔴 No Asistió</span>`;
              }

              return `
                <div class="day-agenda-card box cluster ${colorMeta.className} ${info.isMasked ? 'is-masked' : ''}" 
                     data-surface="raised" 
                     data-border 
                     data-justify="between" 
                     data-align="center"
                     data-cita-id="${c.id}"
                     title="${info.isMasked ? 'Horario ocupado' : (isAtendida ? 'Cita Atendida (Bloqueada) — Clic para consultar o cobrar' : 'Clic para modificar o eliminar cita')}">
                  <div class="stack" data-gap="2xs">
                    <strong class="agenda-patient">🦷 ${info.isMasked ? '🔒 ' : '👤 '}${info.pacienteFull} ${info.pacienteCi}</strong>
                    <span class="agenda-treatment">
                      ⏰ <strong>${horaDesde} - ${horaHasta}</strong> | ${info.observacion}
                    </span>
                  </div>
                  <div class="cluster" data-gap="xs" data-align="center">
                    ${statusBadge}
                    <span class="badge badge-doctor-pill" style="background-color: var(--doc-border); color: #fff;">
                      🩺 ${docFull}
                    </span>
                    ${info.isMasked ? `
                      <span class="badge" data-paint="neutral" title="Inicie sesión para gestionar">🔒 Reservado</span>
                    ` : isAtendida ? `
                      <span class="badge" data-paint="primary" style="cursor: pointer;" title="Cita Atendida — Clic para ver o liquidar cobro">👁️ Atendido / Cobro</span>
                    ` : `
                      <span class="badge" data-paint="success" style="cursor: pointer;">✏️ Modificar</span>
                    `}
                  </div>
                </div>
              `;
            }).join('') : `
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
  },

  /**
   * Genera el HTML de la barra de leyenda de doctores interactiva
   * @param {Array} doctors - Lista de doctores registrados
   * @param {string|number} selectedDoctorId - ID del doctor filtrado actualmente o 'all'
   * @param {number} totalCitas - Total de citas en el periodo/sistema
   * @param {number} unassignedCount - Total de citas sin doctor
   */
  renderDoctorLegend(doctors = [], selectedDoctorId = 'all', totalCitas = 0, unassignedCount = 0) {
    if (!doctors || doctors.length === 0) {
      return '';
    }

    const allActive = (!selectedDoctorId || selectedDoctorId === 'all') ? 'is-active' : '';

    const doctorChips = doctors.map(d => {
      const colorMeta = getDoctorColorMeta(d.id);
      const isActive = String(selectedDoctorId) === String(d.id) ? 'is-active' : '';
      const docShort = getDoctorShortName(d);
      return `
        <button type="button" 
                class="legend-chip ${colorMeta.className} ${isActive}" 
                data-doctor-id="${d.id}"
                title="Filtrar citas por ${d.nombre}">
          <span class="legend-dot" style="background-color: var(--doc-border);"></span>
          <span class="legend-name">${docShort}</span>
          <span class="legend-count">${d.count || 0}</span>
        </button>
      `;
    }).join('');

    const unassignedChip = unassignedCount > 0 ? `
      <button type="button" 
              class="legend-chip doc-color-neutral ${selectedDoctorId === 'unassigned' ? 'is-active' : ''}" 
              data-doctor-id="unassigned"
              title="Filtrar citas sin doctor asignado">
        <span class="legend-dot" style="background-color: #64748b;"></span>
        <span class="legend-name">Sin Dr.</span>
        <span class="legend-count">${unassignedCount}</span>
      </button>
    ` : '';

    return `
      <div class="legend-inner-cluster cluster" data-gap="2xs" data-align="center">
        <span class="legend-title">🩺 Doctores:</span>
        <button type="button" 
                class="legend-chip legend-chip-all ${allActive}" 
                data-doctor-id="all"
                title="Ver citas de todos los doctores">
          <span class="legend-dot" style="background: linear-gradient(135deg, #0284c7, #10b981, #8b5cf6);"></span>
          <span class="legend-name">Todos</span>
          <span class="legend-count">${totalCitas}</span>
        </button>
        ${doctorChips}
        ${unassignedChip}
      </div>
    `;
  }
};
