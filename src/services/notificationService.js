/**
 * Servicio de Notificaciones y Alertas
 * Genera alertas nativas compatibles con Yeti CSS (.alert)
 * Compatible con modales nativos (<dialog.showModal()>) para garantizar que los toasts
 * siempre se visualicen con máxima nitidez por encima de cualquier backdrop difuminado.
 */

export const notificationService = {
  _getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'stack toast-dock';
      container.setAttribute('data-gap', 'xs');

      // Si el navegador soporta Popover API nativo, habilitarlo para entrar al Top Layer
      if (typeof container.showPopover === 'function') {
        container.setAttribute('popover', 'manual');
      }

      document.body.appendChild(container);
    }
    return container;
  },

  _ensureTopLayer(container) {
    if (!container) return;

    // Detectar si hay modales <dialog[open]> activos en la página
    const openDialogs = Array.from(document.querySelectorAll('dialog[open]')).filter(d => {
      const style = window.getComputedStyle(d);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    const topDialog = openDialogs.length > 0 ? openDialogs[openDialogs.length - 1] : null;

    // 1. Si el navegador soporta Popover API, promover el contenedor al Top Layer
    if (typeof container.showPopover === 'function') {
      try {
        if (!container.hasAttribute('popover')) {
          container.setAttribute('popover', 'manual');
        }
        // Si ya estaba abierto, cerrar y reabrir para que quede encima del modal más reciente en el Top Layer
        if (container.matches(':popover-open')) {
          container.hidePopover();
        }
        container.showPopover();
        return;
      } catch (err) {
        console.warn('[NotificationService] Error al activar Top Layer con showPopover:', err);
      }
    }

    // 2. Estrategia complementaria / fallback:
    // Si hay un modal activo y popover no se usó o falló, mover el contenedor dentro del modal abierto
    // para que forme parte del contexto del diálogo y quede por delante del ::backdrop difuminado.
    const targetParent = topDialog || document.body;
    if (container.parentElement !== targetParent) {
      targetParent.appendChild(container);
    }
  },

  /**
   * Muestra un mensaje flotante utilizando el componente Alert de Yeti CSS
   * @param {string} message - Mensaje a mostrar
   * @param {'primary'|'success'|'warning'|'alert'|'neutral'} type - Tipo/color de alerta
   * @param {number} duration - Duración en milisegundos
   */
  show(message, type = 'primary', duration = 4000) {
    const container = this._getContainer();
    this._ensureTopLayer(container);

    const alertEl = document.createElement('div');
    alertEl.className = 'alert toast-alert-item';
    alertEl.setAttribute('data-paint', type);
    alertEl.setAttribute('role', 'alert');

    alertEl.innerHTML = `
      <p style="margin: 0; font-weight: 500;">${message}</p>
      <button type="button" data-close aria-label="Cerrar">&times;</button>
    `;

    container.appendChild(alertEl);

    // Asegurar que el popover permanezca abierto si está disponible
    if (typeof container.showPopover === 'function') {
      try {
        if (!container.matches(':popover-open')) {
          container.showPopover();
        }
      } catch {
        // Ignorar
      }
    }

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
        // Si no quedan alertas en el contenedor y usa popover, podemos cerrarlo limpiamente
        if (container.children.length === 0 && typeof container.hidePopover === 'function') {
          try {
            if (container.matches(':popover-open')) {
              container.hidePopover();
            }
          } catch {
            // Ignorar
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

// Escuchar cierre de diálogos para retornar el contenedor a document.body si estaba dentro de un modal cerrado
if (typeof document !== 'undefined') {
  document.addEventListener('close', (e) => {
    if (e.target && e.target.tagName === 'DIALOG') {
      const container = document.getElementById('toast-container');
      if (container && e.target.contains(container)) {
        const remainingDialogs = Array.from(document.querySelectorAll('dialog[open]')).filter(d => d !== e.target);
        const nextParent = remainingDialogs.length > 0 ? remainingDialogs[remainingDialogs.length - 1] : document.body;
        nextParent.appendChild(container);
      }
    }
  }, true);
}
