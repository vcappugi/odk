/**
 * =====================================================================
 * ODONTOKRIS - Sistema Odontológico
 * Cabecera superior compacta con logo e inicio de sesión +
 * Calendario interactivo inferior (Mes / Semana / Día con navegación).
 * =====================================================================
 */

// Importación de Framework CSS Yeti de Foundation y tema de tokens
import './assets/vendor/yeti/yeti.css';
import './assets/vendor/yeti/theme.css';
import './assets/vendor/yeti/yeti.js';

// Estilos de la aplicación
import './assets/styles/app.css';

// Servicios y configuración
import { platformService } from './services/platformService.js';
import { checkConnection } from './services/supabaseClient.js';
import { env } from './config/env.js';
import { $ } from './utils/dom.js';

// Componentes y Módulos
import { renderAuthModal } from './modules/auth/authView.js';
import { authController } from './modules/auth/authController.js';
import { calendarController } from './modules/calendar/calendarController.js';
import { renderQuickActionsBar } from './modules/quickActions/quickActionsView.js';
import { quickActionsController } from './modules/quickActions/quickActionsController.js';
import { patientController } from './modules/patients/patientController.js';
import { renderAdminConfigModal } from './modules/admin/adminView.js';
import { adminController } from './modules/admin/adminController.js';
import { renderCitaModal } from './modules/cita/citaView.js';
import { citaController } from './modules/cita/citaController.js';

/**
 * Inicialización de la aplicación
 */
async function bootstrapApp() {
  console.log('🦷 Inicializando ODONTOKRIS Sistema Odontológico...');

  // 1. Inicializar detección de plataforma (Web / Android)
  platformService.initPlatformListeners();

  // 2. Comprobar conectividad inicial con Supabase
  await checkConnection();

  // 3. Montar la estructura visual limpia y responsiva en el DOM
  mountAppLayout();

  // 4. Configurar selector de tema claro / oscuro (persistente)
  setupTheme();

  // 5. Inicializar controlador de autenticación (Login & Registro)
  authController.init();

  // 6. Inicializar controlador del calendario (Mes / Semana / Día)
  calendarController.init();

  // 7. Inicializar controlador de acciones rápidas (Doctor, Historial, Reportes)
  quickActionsController.init();

  // 8. Inicializar controlador de gestión de pacientes (CRUD completo)
  patientController.init();

  // 9. Inicializar controlador de configuración administrativa (user_roles)
  adminController.init();

  // 10. Inicializar controlador de citas (CRUD calendario)
  citaController.init();

  console.log('✅ ODONTOKRIS inicializado con éxito.');
}

/**
 * Configura el cambio y persistencia de tema Claro / Oscuro
 */
function setupTheme() {
  const THEME_STORAGE_KEY = 'odontokris_theme';
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  applyTheme(currentTheme);

  document.addEventListener('click', (e) => {
    const toggleBtn = e.target.closest('#theme-toggle-btn');
    if (!toggleBtn) return;

    const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';

    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  });
}

/**
 * Aplica el tema en el elemento raíz e icono del botón
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.setAttribute('color-scheme', theme);
  document.documentElement.style.colorScheme = theme;

  const iconEl = $('#theme-toggle-icon');
  const btnEl = $('#theme-toggle-btn');

  if (iconEl) {
    iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
  if (btnEl) {
    btnEl.setAttribute('title', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    btnEl.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  }
}

/**
 * Monta la interfaz de usuario en el contenedor raíz
 * Marco superior pequeño con logo y acceso + Calendario inferior completo
 */
function mountAppLayout() {
  const appRoot = $('#app');
  if (!appRoot) return;

  appRoot.innerHTML = `
    <div class="odontokris-layout stack" data-gap="md">
      <!-- 1. MARCO SUPERIOR COMPACTO: Logo pequeño, Título, Modo Oscuro/Claro y Acceso -->
      <header class="top-compact-header box" data-surface="raised" data-border>
        <div class="header-inner cluster" data-justify="between" data-align="center">
          
          <!-- Identidad Odontológica: Logo pequeño y Título -->
          <div class="cluster brand-compact-group" data-gap="sm" data-align="center">
            <div class="brand-logo-dental-compact" aria-label="Logo ODONTOKRIS">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                <!-- Diente estilizado minimalista -->
                <path d="M7.5 3.5C5.5 3.5 3.5 5.5 3.5 8.5C3.5 12 5 14 6.5 17.5C7.5 19.8 8.5 21 9.5 21C10.5 21 10.8 19 11.2 16.5C11.6 14.5 11.8 14 12 14C12.2 14 12.4 14.5 12.8 16.5C13.2 19 13.5 21 14.5 21C15.5 21 16.5 19.8 17.5 17.5C19 14 20.5 12 20.5 8.5C20.5 5.5 18.5 3.5 16.5 3.5C14.5 3.5 13 5 12 5C11 5 9.5 3.5 7.5 3.5Z" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="1.8"/>
                <!-- Brillo dental -->
                <path d="M15.5 7.5L16.5 5.5L17.5 7.5L19.5 8.5L17.5 9.5L16.5 11.5L15.5 9.5L13.5 8.5L15.5 7.5Z" fill="currentColor"/>
              </svg>
            </div>
            <div class="brand-text-block">
              <h2 class="compact-system-title">ODONTOKRIS</h2>
              <span class="compact-system-subtitle">Sistema Odontológico</span>
            </div>
          </div>

          <!-- Acciones de Cabecera: Botón de Cambio de Tema y Sesión de Usuario -->
          <div class="cluster header-actions-cluster" data-gap="xs" data-align="center">
            <!-- Botón pequeño para cambiar de tema claro a oscuro -->
            <button type="button" id="theme-toggle-btn" class="button btn-theme-toggle" data-variant="ghost" data-size="sm" title="Cambiar tema (Claro / Oscuro)" aria-label="Cambiar tema">
              <span id="theme-toggle-icon">🌙</span>
            </button>

            <!-- Botones de Acción (Login / Auto-Registro / Sesión Activa) -->
            <div id="main-user-display" class="compact-auth-actions">
              <!-- Renderizado dinámicamente por authController -->
            </div>
          </div>

        </div>
      </header>

      <!-- 2. BARRA DE BOTONES DE ACCESO RÁPIDO (Espacio arriba del calendario) -->
      ${renderQuickActionsBar()}

      <!-- 3. SECCIÓN PRINCIPAL: Calendario Odontológico Completo -->
      <main id="content" class="calendar-main-section">
        <div class="calendar-card box" data-surface="raised" data-border>
          <div class="stack" data-gap="md">
            
            <!-- Barra de Herramientas del Calendario (Navegación + Vistas) -->
            <div class="calendar-toolbar cluster" data-justify="between" data-align="center">
              
              <!-- Navegación: Anterior, Hoy, Siguiente + Título Dinámico -->
              <div class="cluster cal-nav-group" data-gap="sm" data-align="center">
                <div class="cluster cal-nav-buttons" data-gap="2xs">
                  <button type="button" id="btn-cal-prev" class="button" data-variant="ghost" data-size="sm" title="Periodo anterior">
                    ◀
                  </button>
                  <button type="button" id="btn-cal-today" class="button" data-variant="ghost" data-size="sm" title="Ir a la fecha actual">
                    Hoy
                  </button>
                  <button type="button" id="btn-cal-next" class="button" data-variant="ghost" data-size="sm" title="Periodo siguiente">
                    ▶
                  </button>
                </div>
                <h3 id="cal-period-title" class="cal-period-title">Cargando...</h3>
              </div>

              <!-- Selector de Vistas: Mes | Semana | Día -->
              <div class="cluster cal-views-selector" data-gap="2xs" role="tablist">
                <button type="button" class="button btn-cal-view" data-view="month" data-paint="primary" data-size="sm" role="tab">
                  Mes
                </button>
                <button type="button" class="button btn-cal-view" data-view="week" data-variant="ghost" data-size="sm" role="tab">
                  Semana
                </button>
                <button type="button" class="button btn-cal-view" data-view="day" data-variant="ghost" data-size="sm" role="tab">
                  Día
                </button>
              </div>

            </div>

            <!-- Contenedor dinámico de la vista activa (Mes, Semana o Día) -->
            <div id="cal-view-container" class="cal-view-container">
              <!-- Renderizado dinámico por calendarController -->
            </div>

          </div>
        </div>
      </main>
    </div>

    <!-- Modal Dialog para Autenticación (Login / Auto-Registro) -->
    ${renderAuthModal()}

    <!-- Modal Dialog para Configuración Administrativa (Admin en user_roles) -->
    ${renderAdminConfigModal()}

    <!-- Modal Dialog para Citas Odontológicas (CRUD Calendario) -->
    ${renderCitaModal()}
  `;
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
