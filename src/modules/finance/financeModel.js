/**
 * Modelo Financiero y Estadístico (Supabase)
 * Módulo: Panel Financiero
 * ODONTOKRIS - Sistema Odontológico
 */

import { getSupabase } from '../../services/supabaseClient.js';
import { consultorioModel } from '../consultorio/consultorioModel.js';
import { isCitaAtendida } from '../cita/citaModel.js';

export const financeModel = {
  /**
   * Obtiene todos los datos sin procesar necesarios para los cálculos financieros
   */
  async fetchRawData() {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        cobros: [],
        citas: [],
        historial: [],
        pacientes: [],
        doctores: [],
        consultorios: []
      };
    }

    try {
      const [
        cobrosRes,
        citasRes,
        historialRes,
        pacientesRes,
        doctoresRes,
        consultoriosRes
      ] = await Promise.all([
        supabase
          .from('cobro_cita')
          .select('*')
          .order('fecha_pago', { ascending: false }),
        supabase
          .from('cita')
          .select(`
            id,
            fecha,
            hora_desde,
            hora_hasta,
            observacion,
            consultorio_id,
            paciente_id,
            doctor_id,
            estatus,
            created_at,
            paciente:paciente_id ( id, nombre, ci, telefono ),
            doctor:doctor_id ( id, nombre, telefono )
          `)
          .order('fecha', { ascending: false }),
        supabase
          .from('historial_medico')
          .select('id, paciente_id, cita_id, doctor_id, fecha, motivo_consulta, diagnostico, tratamiento, created_at')
          .order('fecha', { ascending: false }),
        supabase
          .from('paciente')
          .select('id, nombre, ci, telefono, consultorio_id, created_at'),
        supabase
          .from('doctor')
          .select('id, nombre, telefono, activo'),
        supabase
          .from('consultorio')
          .select('id, nombre, direccion')
      ]);

      return {
        cobros: cobrosRes.data || [],
        citas: citasRes.data || [],
        historial: historialRes.data || [],
        pacientes: pacientesRes.data || [],
        doctores: doctoresRes.data || [],
        consultorios: consultoriosRes.data || []
      };
    } catch (err) {
      console.warn('[FinanceModel] Error obteniendo datos sin procesar:', err);
      return {
        cobros: [],
        citas: [],
        historial: [],
        pacientes: [],
        doctores: [],
        consultorios: []
      };
    }
  },

  /**
   * Helper para parsear fechas YYYY-MM-DD sin desajuste de zona horaria
   */
  parseDateAtNoon(dateStr) {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const cleanStr = dateStr.substring(0, 10);
    const parts = cleanStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month, day, 12, 0, 0, 0);
  },

  /**
   * Obtiene las fechas de inicio y fin para un periodo dado
   * @param {string} period 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom'
   * @param {Object} customRange { start: string, end: string }
   */
  getDateRangeForPeriod(period = 'week', customRange = null) {
    const today = new Date();
    let startDate = new Date();
    let endDate = new Date();

    if (period === 'custom' && customRange?.start && customRange?.end) {
      return {
        start: new Date(customRange.start + 'T00:00:00'),
        end: new Date(customRange.end + 'T23:59:59')
      };
    }

    if (period === 'today') {
      // El día de hoy (desde las 00:00:00 hasta las 23:59:59.999 de hoy)
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    } else if (period === 'week') {
      // Semana actual (Lunes a Domingo)
      const dayOfWeek = today.getDay(); // 0 es Domingo
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + diffToMonday, 0, 0, 0, 0);
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6, 23, 59, 59, 999);
    } else if (period === 'month') {
      // Mes actual (1ro al último día del mes)
      startDate = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'quarter') {
      // Últimos 3 meses
      startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1, 0, 0, 0);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      // Todo el año en curso
      startDate = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // 'all' o histórico completo
      startDate = new Date(2020, 0, 1, 0, 0, 0);
      endDate = new Date(2035, 11, 31, 23, 59, 59, 999);
    }

    return { start: startDate, end: endDate };
  },

  /**
   * Helper para normalizar nombres de tratamientos
   */
  normalizeTreatmentName(rawText) {
    if (!rawText || typeof rawText !== 'string') return '';
    let clean = rawText
      .replace(/^procedimiento:\s*/i, '')
      .replace(/^tratamiento:\s*/i, '')
      .replace(/^diagnóstico:\s*/i, '')
      .trim();

    if (!clean || clean.length < 3) return '';

    // Normalizar patrones comunes para consolidar estadísticas
    const lower = clean.toLowerCase();
    if (lower.includes('resina') || lower.includes('obturación con resina') || lower.includes('calza')) {
      return 'Restauración con Resina Dental';
    }
    if (lower.includes('amalgama')) {
      return 'Restauración con Amalgama';
    }
    if (lower.includes('profilaxis') || lower.includes('limpieza')) {
      return 'Limpieza y Profilaxis Dental';
    }
    if (lower.includes('endodoncia') || lower.includes('conducto') || lower.includes('pulpectomía')) {
      return 'Tratamiento de Conducto (Endodoncia)';
    }
    if (lower.includes('exodoncia') || lower.includes('extracción') || lower.includes('extraccion')) {
      return 'Extracción Dental (Exodoncia)';
    }
    if (lower.includes('ortodoncia') || lower.includes('bracket') || lower.includes('liga')) {
      return 'Control y Ajuste de Ortodoncia';
    }
    if (lower.includes('corona') || lower.includes('prótesis') || lower.includes('protesis')) {
      return 'Rehabilitación Protésica / Corona';
    }
    if (lower.includes('blanqueamiento')) {
      return 'Blanqueamiento Dental';
    }
    if (lower.includes('implante')) {
      return 'Implante Dental Osteointegrado';
    }
    if (lower.includes('revisión') || lower.includes('revision') || lower.includes('consulta') || lower.includes('valoración')) {
      return 'Consulta Diagnóstica y Evaluación';
    }

    // Capitalizar primera letra
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  },

  /**
   * Determina la categoría del método de pago a partir del campo 'metodo_pago' o fallback a referencia
   * Opciones oficiales: "Punto de Venta", "Efectivo Divisas", "Efectivo Bs", "Pago Movil", "Binance", "Otros"
   */
  categorizePaymentMethod(cobro) {
    if (!cobro) return 'Efectivo Divisas';

    // 1. Prioridad: campo metodo_pago registrado en BD
    const rawMetodo = typeof cobro === 'object' ? cobro.metodo_pago : cobro;
    if (rawMetodo && typeof rawMetodo === 'string' && rawMetodo.trim()) {
      const clean = rawMetodo.trim();
      const valid = ['Punto de Venta', 'Efectivo Divisas', 'Efectivo Bs', 'Pago Movil', 'Binance', 'Otros'];
      if (valid.includes(clean)) {
        return clean;
      }
      // Mapeos menores por si hay diferencias de tilde
      const lower = clean.toLowerCase();
      if (lower.includes('punto')) return 'Punto de Venta';
      if (lower.includes('divisa') || lower.includes('dolar') || lower.includes('usd')) return 'Efectivo Divisas';
      if (lower.includes('bs') || lower.includes('bolivar')) return 'Efectivo Bs';
      if (lower.includes('movil') || lower.includes('móvil')) return 'Pago Movil';
      if (lower.includes('binance') || lower.includes('usdt')) return 'Binance';
      if (lower.includes('otro')) return 'Otros';
      return clean;
    }

    // 2. Fallback: analizar texto de referencia para registros históricos
    const referencia = typeof cobro === 'object' ? cobro.referencia : cobro;
    if (!referencia || typeof referencia !== 'string') {
      return 'Efectivo Divisas';
    }
    const lowerRef = referencia.toLowerCase();
    if (lowerRef.includes('punto') || lowerRef.includes('tarjeta') || lowerRef.includes('pos') || lowerRef.includes('débito') || lowerRef.includes('crédito')) {
      return 'Punto de Venta';
    }
    if (lowerRef.includes('pago móvil') || lowerRef.includes('pagomovil') || lowerRef.includes('pago movil') || lowerRef.includes('pm')) {
      return 'Pago Movil';
    }
    if (lowerRef.includes('binance') || lowerRef.includes('usdt')) {
      return 'Binance';
    }
    if (lowerRef.includes('bs') || lowerRef.includes('bolivar') || lowerRef.includes('bolívares')) {
      return 'Efectivo Bs';
    }
    if (lowerRef.includes('efectivo') || lowerRef.includes('dolar') || lowerRef.includes('dólar') || lowerRef.includes('cash') || lowerRef.includes('usd')) {
      return 'Efectivo Divisas';
    }
    return 'Otros';
  },

  /**
   * Calcula todos los indicadores financieros y clínicos consolidados
   * @param {Object} options { period, consultorioId, doctorId, customRange }
   */
  async getMetrics(options = {}) {
    const {
      period = 'week',
      consultorioId = null,
      doctorId = null,
      customRange = null
    } = options;

    const raw = await this.fetchRawData();
    const { start, end } = this.getDateRangeForPeriod(period, customRange);

    // Mapeos rápidos para asociar datos
    const citasMap = new Map();
    raw.citas.forEach(c => citasMap.set(c.id, c));

    const pacientesMap = new Map();
    raw.pacientes.forEach(p => pacientesMap.set(p.id, p));

    const doctoresMap = new Map();
    raw.doctores.forEach(d => doctoresMap.set(d.id, d));

    // 1. Filtrar Cobros
    const filteredCobros = raw.cobros.filter(cobro => {
      const cita = citasMap.get(cobro.cita_id);

      // Filtro por consultorio: El cobro debe pertenecer a una cita de dicho consultorio
      if (consultorioId) {
        if (!cita || String(cita.consultorio_id) !== String(consultorioId)) return false;
      }

      // Filtro por doctor
      if (doctorId) {
        if (!cita || String(cita.doctor_id) !== String(doctorId)) return false;
      }

      // Filtro por fecha (usar fecha_pago o fecha de creación)
      const cobroDate = this.parseDateAtNoon(cobro.fecha_pago || cobro.created_at);
      if (!cobroDate) return period === 'all';
      return cobroDate >= start && cobroDate <= end;
    });

    // 2. Filtrar Citas
    const filteredCitas = raw.citas.filter(cita => {
      if (consultorioId) {
        if (String(cita.consultorio_id) !== String(consultorioId)) return false;
      }
      if (doctorId) {
        if (String(cita.doctor_id) !== String(doctorId)) return false;
      }
      const citaDate = this.parseDateAtNoon(cita.fecha);
      if (!citaDate) return false;
      return citaDate >= start && citaDate <= end;
    });

    // 3. Filtrar Historial Médico
    const filteredHistorial = raw.historial.filter(h => {
      const cita = h.cita_id ? citasMap.get(h.cita_id) : null;
      if (consultorioId) {
        if (!cita || String(cita.consultorio_id) !== String(consultorioId)) return false;
      }
      if (doctorId) {
        if (!h.doctor_id || String(h.doctor_id) !== String(doctorId)) return false;
      }
      const hDate = this.parseDateAtNoon(h.fecha || h.created_at);
      if (!hDate) return false;
      return hDate >= start && hDate <= end;
    });

    // =========================================================================
    // INDICADOR 1: TOTAL INGRESOS POR SEMANA Y DESGLOSE POR DÍA
    // =========================================================================
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const currentWeekMonday = new Date(today);
    currentWeekMonday.setDate(today.getDate() + diffToMonday);
    currentWeekMonday.setHours(0, 0, 0, 0);

    const currentWeekSunday = new Date(currentWeekMonday);
    currentWeekSunday.setDate(currentWeekMonday.getDate() + 6);
    currentWeekSunday.setHours(23, 59, 59, 999);

    const prevWeekMonday = new Date(currentWeekMonday);
    prevWeekMonday.setDate(currentWeekMonday.getDate() - 7);
    const prevWeekSunday = new Date(currentWeekSunday);
    prevWeekSunday.setDate(currentWeekSunday.getDate() - 7);

    // Inicializar desglose diario de la semana actual (Lun a Dom)
    const weekDays = [
      { key: 1, name: 'Lunes', short: 'Lun', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 2, name: 'Martes', short: 'Mar', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 3, name: 'Miércoles', short: 'Mié', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 4, name: 'Jueves', short: 'Jue', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 5, name: 'Viernes', short: 'Vie', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 6, name: 'Sábado', short: 'Sáb', totalUSD: 0, totalBs: 0, count: 0 },
      { key: 0, name: 'Domingo', short: 'Dom', totalUSD: 0, totalBs: 0, count: 0 }
    ];

    let currentWeekTotalUSD = 0;
    let currentWeekTotalBs = 0;
    let currentWeekCount = 0;

    let prevWeekTotalUSD = 0;
    let prevWeekTotalBs = 0;

    raw.cobros.forEach(cobro => {
      const cita = citasMap.get(cobro.cita_id);
      if (consultorioId && (!cita || String(cita.consultorio_id) !== String(consultorioId))) return;
      if (doctorId && (!cita || String(cita.doctor_id) !== String(doctorId))) return;

      const cDate = this.parseDateAtNoon(cobro.fecha_pago || cobro.created_at);
      if (!cDate) return;

      const usd = Number(cobro.monto_cobrado) || 0;
      const rate = Number(cobro.tasa_cambio) || 1;
      const bs = usd * rate;

      // Semana actual
      if (cDate >= currentWeekMonday && cDate <= currentWeekSunday) {
        currentWeekTotalUSD += usd;
        currentWeekTotalBs += bs;
        currentWeekCount += 1;

        const dow = cDate.getDay();
        const targetDay = weekDays.find(d => d.key === dow);
        if (targetDay) {
          targetDay.totalUSD += usd;
          targetDay.totalBs += bs;
          targetDay.count += 1;
        }
      }

      // Semana anterior
      if (cDate >= prevWeekMonday && cDate <= prevWeekSunday) {
        prevWeekTotalUSD += usd;
        prevWeekTotalBs += bs;
      }
    });

    // Variación porcentual semana vs anterior
    let weekPercentChange = 0;
    if (prevWeekTotalUSD > 0) {
      weekPercentChange = ((currentWeekTotalUSD - prevWeekTotalUSD) / prevWeekTotalUSD) * 100;
    } else if (currentWeekTotalUSD > 0) {
      weekPercentChange = 100;
    }

    // Tendencia de las últimas 6 semanas para gráfico evolutivo
    const sixWeeksTrend = [];
    for (let i = 5; i >= 0; i--) {
      const wStart = new Date(currentWeekMonday);
      wStart.setDate(currentWeekMonday.getDate() - (i * 7));
      const wEnd = new Date(wStart);
      wEnd.setDate(wStart.getDate() + 6);
      wEnd.setHours(23, 59, 59, 999);

      let wUSD = 0;
      let wBs = 0;
      let wCount = 0;

      raw.cobros.forEach(cobro => {
        const cita = citasMap.get(cobro.cita_id);
        if (consultorioId && (!cita || String(cita.consultorio_id) !== String(consultorioId))) return;
        if (doctorId && (!cita || String(cita.doctor_id) !== String(doctorId))) return;

        const cDate = this.parseDateAtNoon(cobro.fecha_pago || cobro.created_at);
        if (!cDate) return;

        if (cDate >= wStart && cDate <= wEnd) {
          const usd = Number(cobro.monto_cobrado) || 0;
          const rate = Number(cobro.tasa_cambio) || 1;
          wUSD += usd;
          wBs += (usd * rate);
          wCount += 1;
        }
      });

      const label = i === 0 ? 'Semana Actual' : (i === 1 ? 'Semana Pasada' : `Sem -${i}`);
      sixWeeksTrend.push({
        label,
        startDate: wStart.toISOString().substring(0, 10),
        endDate: wEnd.toISOString().substring(0, 10),
        totalUSD: wUSD,
        totalBs: wBs,
        count: wCount
      });
    }

    // =========================================================================
    // INDICADOR 2: TOP 10 DE TRATAMIENTOS
    // =========================================================================
    const treatmentsCountMap = new Map();
    let totalTreatmentsEvaluated = 0;

    // 1. Tratamientos registrados en historial_medico
    filteredHistorial.forEach(h => {
      const normalized = this.normalizeTreatmentName(h.tratamiento || h.motivo_consulta);
      if (normalized && normalized !== 'Pieza sana') {
        const current = treatmentsCountMap.get(normalized) || { count: 0, sampleDiagnosticos: [] };
        current.count += 1;
        if (h.diagnostico && !current.sampleDiagnosticos.includes(h.diagnostico)) {
          current.sampleDiagnosticos.push(h.diagnostico);
        }
        treatmentsCountMap.set(normalized, current);
        totalTreatmentsEvaluated += 1;
      }
    });

    // 2. Observaciones registradas en citas atendidas
    filteredCitas.forEach(c => {
      if (c.observacion) {
        const normalized = this.normalizeTreatmentName(c.observacion);
        if (normalized && normalized !== 'Pieza sana') {
          const current = treatmentsCountMap.get(normalized) || { count: 0, sampleDiagnosticos: [] };
          current.count += 1;
          treatmentsCountMap.set(normalized, current);
          totalTreatmentsEvaluated += 1;
        }
      }
    });

    // Ordenar y tomar los 10 primeros
    const sortedTreatments = Array.from(treatmentsCountMap.entries())
      .map(([name, data]) => {
        const percentage = totalTreatmentsEvaluated > 0
          ? ((data.count / totalTreatmentsEvaluated) * 100)
          : 0;
        return {
          name,
          count: data.count,
          percentage: Number(percentage.toFixed(1)),
          sampleDiagnosticos: data.sampleDiagnosticos
        };
      })
      .sort((a, b) => b.count - a.count);

    const topTenTreatments = sortedTreatments.slice(0, 10);

    // =========================================================================
    // INDICADOR 3: CANTIDAD DE PACIENTES ATENDIDOS Y CITAS
    // =========================================================================
    const attendedCitas = filteredCitas.filter(c => isCitaAtendida(c.estatus));
    const uniqueAttendedPatientIds = new Set(
      attendedCitas.map(c => c.paciente_id).filter(Boolean)
    );
    const totalPacientesAtendidos = uniqueAttendedPatientIds.size;
    const totalCitasAtendidas = attendedCitas.length;
    const totalCitasProgramadas = filteredCitas.length;
    const citasPendientes = filteredCitas.filter(c => !isCitaAtendida(c.estatus)).length;

    // Tasa de asistencia
    const asistenciaRate = totalCitasProgramadas > 0
      ? ((totalCitasAtendidas / totalCitasProgramadas) * 100)
      : 0;

    // Nuevos pacientes registrados en el periodo
    const nuevosPacientes = raw.pacientes.filter(p => {
      if (consultorioId && String(p.consultorio_id) !== String(consultorioId)) return false;
      const pDate = this.parseDateAtNoon(p.created_at);
      if (!pDate) return false;
      return pDate >= start && pDate <= end;
    }).length;

    // =========================================================================
    // INDICADOR 4: FACTURACIÓN TOTAL DEL PERIODO Y TICKET PROMEDIO
    // =========================================================================
    let totalFacturadoUSD = 0;
    let totalFacturadoBs = 0;
    let totalTransacciones = filteredCobros.length;

    filteredCobros.forEach(cobro => {
      const usd = Number(cobro.monto_cobrado) || 0;
      const rate = Number(cobro.tasa_cambio) || 1;
      totalFacturadoUSD += usd;
      totalFacturadoBs += (usd * rate);
    });

    const ticketPromedioUSD = totalCitasAtendidas > 0
      ? (totalFacturadoUSD / totalCitasAtendidas)
      : (totalTransacciones > 0 ? (totalFacturadoUSD / totalTransacciones) : 0);

    // =========================================================================
    // INDICADOR 5: DISTRIBUCIÓN POR MÉTODOS DE PAGO
    // =========================================================================
    const paymentMethodsMap = new Map();
    filteredCobros.forEach(cobro => {
      const method = this.categorizePaymentMethod(cobro);
      const usd = Number(cobro.monto_cobrado) || 0;
      const rate = Number(cobro.tasa_cambio) || 1;
      const bs = usd * rate;

      const current = paymentMethodsMap.get(method) || { count: 0, totalUSD: 0, totalBs: 0 };
      current.count += 1;
      current.totalUSD += usd;
      current.totalBs += bs;
      paymentMethodsMap.set(method, current);
    });

    const metodosPago = Array.from(paymentMethodsMap.entries())
      .map(([method, data]) => {
        const percentage = totalFacturadoUSD > 0
          ? ((data.totalUSD / totalFacturadoUSD) * 100)
          : 0;
        return {
          method,
          count: data.count,
          totalUSD: data.totalUSD,
          totalBs: data.totalBs,
          percentage: Number(percentage.toFixed(1))
        };
      })
      .sort((a, b) => b.totalUSD - a.totalUSD);

    // =========================================================================
    // INDICADOR 6: RENDIMIENTO POR DOCTOR
    // =========================================================================
    const doctorStatsMap = new Map();
    raw.doctores.forEach(doc => {
      doctorStatsMap.set(doc.id, {
        id: doc.id,
        nombre: doc.nombre,
        citasAtendidas: 0,
        citasTotales: 0,
        facturadoUSD: 0,
        facturadoBs: 0
      });
    });

    filteredCitas.forEach(c => {
      if (!c.doctor_id) return;
      let stat = doctorStatsMap.get(c.doctor_id);
      if (!stat) {
        stat = {
          id: c.doctor_id,
          nombre: c.doctor?.nombre || 'Doctor Especialista',
          citasAtendidas: 0,
          citasTotales: 0,
          facturadoUSD: 0,
          facturadoBs: 0
        };
        doctorStatsMap.set(c.doctor_id, stat);
      }
      stat.citasTotales += 1;
      if (isCitaAtendida(c.estatus)) {
        stat.citasAtendidas += 1;
      }
    });

    filteredCobros.forEach(cobro => {
      const cita = citasMap.get(cobro.cita_id);
      if (!cita || !cita.doctor_id) return;
      const stat = doctorStatsMap.get(cita.doctor_id);
      if (stat) {
        const usd = Number(cobro.monto_cobrado) || 0;
        const rate = Number(cobro.tasa_cambio) || 1;
        stat.facturadoUSD += usd;
        stat.facturadoBs += (usd * rate);
      }
    });

    const rendimientoDoctores = Array.from(doctorStatsMap.values())
      .filter(d => d.citasTotales > 0 || d.facturadoUSD > 0)
      .sort((a, b) => b.facturadoUSD - a.facturadoUSD);

    // =========================================================================
    // LISTADO ENRIQUECIDO DE COBROS PARA LA TABLA DE TRANSACCIONES
    // =========================================================================
    const cobrosDetallados = filteredCobros.map(cobro => {
      const cita = citasMap.get(cobro.cita_id);
      const paciente = cita?.paciente_id ? pacientesMap.get(cita.paciente_id) : (cita?.paciente || null);
      const doctor = cita?.doctor_id ? doctoresMap.get(cita.doctor_id) : (cita?.doctor || null);
      const usd = Number(cobro.monto_cobrado) || 0;
      const rate = Number(cobro.tasa_cambio) || 1;
      const bs = usd * rate;

      return {
        id: cobro.id,
        cita_id: cobro.cita_id,
        fecha_pago: (cobro.fecha_pago || cobro.created_at || '').substring(0, 10),
        monto_usd: usd,
        tasa_cambio: rate,
        monto_bs: bs,
        metodo_pago: cobro.metodo_pago || this.categorizePaymentMethod(cobro),
        referencia: cobro.referencia || 'Sin referencia registrada',
        metodo: this.categorizePaymentMethod(cobro),
        confirmado: cobro.confirmado !== false,
        paciente_nombre: paciente?.nombre || 'Paciente no especificado',
        paciente_ci: paciente?.ci || '--',
        doctor_nombre: doctor?.nombre || 'Especialista',
        observacion_cita: cita?.observacion || ''
      };
    });

    const formatDateYMD = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      period,
      dateRange: {
        start: formatDateYMD(start),
        end: formatDateYMD(end)
      },
      consultorioId,
      doctorId,
      // Indicador 1: Semana
      semana: {
        totalUSD: currentWeekTotalUSD,
        totalBs: currentWeekTotalBs,
        transacciones: currentWeekCount,
        prevWeekTotalUSD,
        prevWeekTotalBs,
        percentChange: Number(weekPercentChange.toFixed(1)),
        dias: weekDays,
        tendenciaSeisSemanas: sixWeeksTrend
      },
      // Indicador 2: Top 10 Tratamientos
      topTenTratamientos: topTenTreatments,
      totalTratamientosEvaluados: totalTreatmentsEvaluated,
      // Indicador 3: Pacientes
      pacientes: {
        atendidosUnicos: totalPacientesAtendidos,
        citasAtendidas: totalCitasAtendidas,
        citasProgramadas: totalCitasProgramadas,
        citasPendientes,
        tasaAsistencia: Number(asistenciaRate.toFixed(1)),
        nuevosPacientes
      },
      // Indicadores Consolidados
      global: {
        totalFacturadoUSD,
        totalFacturadoBs,
        totalTransacciones,
        ticketPromedioUSD: Number(ticketPromedioUSD.toFixed(2))
      },
      metodosPago,
      rendimientoDoctores,
      cobrosDetallados,
      consultorios: raw.consultorios,
      doctores: raw.doctores
    };
  }
};
