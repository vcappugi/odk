/**
 * Servicio de Notificaciones y Alertas
 * Genera alertas nativas compatibles con Yeti CSS (.alert)
 */

export const notificationService = {
  /**
   * Muestra un mensaje flotante utilizando el componente Alert de Yeti CSS
   * @param {string} message - Mensaje a mostrar
   * @param {'primary'|'success'|'warning'|'alert'|'neutral'} type - Tipo/color de alerta
   * @param {number} duration - Duración en milisegundos
   */
  show(message, type = 'primary', duration = 4000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'stack toast-dock';
      container.setAttribute('data-gap', 'xs');
      document.body.appendChild(container);
    }

    const alertEl = document.createElement('div');
    alertEl.className = 'alert';
    alertEl.setAttribute('data-paint', type);
    alertEl.setAttribute('role', 'alert');

    alertEl.innerHTML = `
      <p>${message}</p>
      <button type="button" data-close aria-label="Cerrar">&times;</button>
    `;

    container.appendChild(alertEl);

    if (duration > 0) {
      setTimeout(() => {
        if (alertEl.isConnected) {
          const closeBtn = alertEl.querySelector('[data-close]');
          if (closeBtn) {
            closeBtn.click();
          } else {
            alertEl.remove();
          }
        }
      }, duration);
    }
  },

  success(msg) {
    this.show(msg, 'success');
  },

  error(msg) {
    this.show(msg, 'alert', 6000);
  },

  info(msg) {
    this.show(msg, 'primary');
  },

  warning(msg) {
    this.show(msg, 'warning', 5000);
  }
};
