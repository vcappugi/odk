/**
 * Componente Barra de Navegación Limpia (Yeti Nav)
 * Contiene el logo de la aplicación, estado de usuario y switch de tema.
 */
import { env } from '../config/env.js';

export function renderNavbar() {
  return `
    <nav class="nav main-navbar" aria-label="Principal" data-sticky>
      <a class="cluster brand-link" data-gap="sm" data-brand href="#" style="text-decoration: none;">
        <div class="brand-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <span class="brand-name">${env.appName}</span>
      </a>

      <!-- Acciones de cabecera -->
      <div data-actions class="cluster navbar-actions-group" data-gap="xs" data-align="center">
        <div id="navbar-auth-section">
          <!-- Renderizado dinámico según sesión -->
        </div>
        <button id="theme-toggle-btn" class="button btn-theme-toggle" data-variant="ghost" data-size="sm" aria-label="Alternar tema" title="Cambiar tema">
          <span class="theme-icon">🌓</span>
        </button>
      </div>
    </nav>
  `;
}
