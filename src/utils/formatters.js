/**
 * Formateadores de fecha, texto y badges
 */

export function formatDate(isoString) {
  if (!isoString) return 'Fecha no disponible';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function getStatusPaint(status) {
  switch (status?.toLowerCase()) {
    case 'completado':
    case 'activo':
      return 'success';
    case 'en progreso':
    case 'revisión':
      return 'primary';
    case 'pendiente':
      return 'warning';
    case 'cancelado':
    case 'error':
      return 'alert';
    default:
      return 'neutral';
  }
}

export function getPriorityPaint(priority) {
  switch (priority?.toLowerCase()) {
    case 'alta':
    case 'urgente':
      return 'alert';
    case 'media':
      return 'warning';
    case 'baja':
      return 'neutral';
    default:
      return 'neutral';
  }
}
