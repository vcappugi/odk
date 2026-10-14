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
import { permissionService } from './services/permissionService.js';
import { env } from './config/env.js';
import { $ } from './utils/dom.js';

// Componentes y Módulos
import { renderAuthModal } from './modules/auth/authView.js';
import { authModel } from './modules/auth/authModel.js';
import { authController } from './modules/auth/authController.js';
import { calendarController } from './modules/calendar/calendarController.js';
import { renderQuickActionsBar } from './modules/quickActions/quickActionsView.js';
import { quickActionsController } from './modules/quickActions/quickActionsController.js';
import { patientController } from './modules/patients/patientController.js';
import { renderAdminConfigModal } from './modules/admin/adminView.js';
import { adminController } from './modules/admin/adminController.js';
import { renderCitaModal } from './modules/cita/citaView.js';
import { citaController } from './modules/cita/citaController.js';
import { renderHistorialModal } from './modules/historial/historialView.js';
import { historialController } from './modules/historial/historialController.js';
import { renderOdontogramaModal } from './modules/odontograma/odontogramaView.js';
import { odontogramaController } from './modules/odontograma/odontogramaController.js';

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

  // 4b. Inicializar servicio de permisos según roles_permision
  await permissionService.init();

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

  // 11. Inicializar controlador de historial médico (CRUD historial_medico)
  historialController.init();

  // 12. Inicializar controlador de odontograma clínico (CRUD detalle_odontograma)
  odontogramaController.init();

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

  const currentUser = authModel.getCurrentUser();
  const isAuthenticated = Boolean(currentUser);

  appRoot.innerHTML = `
    <div class="odontokris-layout stack" data-gap="md" data-auth-status="${isAuthenticated ? 'authenticated' : 'unauthenticated'}">
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

            <!-- Botones de Acción (Login / Sesión Activa) -->
            <div id="main-user-display" class="compact-auth-actions">
              <!-- Renderizado dinámicamente por authController -->
            </div>
          </div>

        </div>
      </header>

      <!-- 2. VISTA PARA USUARIOS NO AUTENTICADOS (GUEST): Pantalla informativa destacada sin calendario ni filtros -->
      <section id="guest-welcome-view" class="guest-welcome-card box" data-surface="raised" data-border style="${isAuthenticated ? 'display: none;' : 'display: flex;'}">
        <div class="guest-welcome-content">
          <div class="guest-dental-emblem" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7.5 3.5C5.5 3.5 3.5 5.5 3.5 8.5C3.5 12 5 14 6.5 17.5C7.5 19.8 8.5 21 9.5 21C10.5 21 10.8 19 11.2 16.5C11.6 14.5 11.8 14 12 14C12.2 14 12.4 14.5 12.8 16.5C13.2 19 13.5 21 14.5 21C15.5 21 16.5 19.8 17.5 17.5C19 14 20.5 12 20.5 8.5C20.5 5.5 18.5 3.5 16.5 3.5C14.5 3.5 13 5 12 5C11 5 9.5 3.5 7.5 3.5Z" fill="currentColor" fill-opacity="0.18" stroke="currentColor" stroke-width="1.8"/>
              <path d="M15.5 7.5L16.5 5.5L17.5 7.5L19.5 8.5L17.5 9.5L16.5 11.5L15.5 9.5L13.5 8.5L15.5 7.5Z" fill="currentColor"/>
            </svg>
          </div>
          
          <h1 class="guest-system-headline">
            Sistema de Gestión de consultorio odontologico
          </h1>

          <div class="guest-whatsapp-banner">
            <a href="https://wa.me/584148674528" target="_blank" rel="noopener noreferrer" class="guest-whatsapp-link" title="Contactar por WhatsApp al (+58)4148674528">
              <span class="whatsapp-badge-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.81 13.47 3.81 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.05 7.42C8.87 7.42 8.57 7.49 8.32 7.76C8.07 8.04 7.36 8.7 7.36 10.05C7.36 11.4 8.34 12.7 8.48 12.89C8.62 13.08 10.41 15.84 13.15 17.02C13.8 17.3 14.31 17.47 14.7 17.6C15.35 17.81 15.95 17.78 16.42 17.71C16.94 17.63 18.02 17.05 18.25 16.41C18.48 15.77 18.48 15.22 18.41 15.11C18.34 15 18.15 14.93 17.87 14.79C17.59 14.65 16.21 13.97 15.96 13.88C15.7 13.79 15.52 13.74 15.33 14.02C15.14 14.3 14.61 14.93 14.45 15.11C14.29 15.3 14.12 15.32 13.84 15.18C13.56 15.04 12.67 14.75 11.62 13.81C10.8 13.08 10.24 12.18 10.1 11.95C9.96 11.71 10.08 11.58 10.22 11.44C10.35 11.31 10.51 11.1 10.65 10.94C10.79 10.78 10.83 10.66 10.93 10.48C11.02 10.29 10.97 10.13 10.9 10C10.83 9.86 10.28 8.5 10.05 7.95C9.82 7.42 9.59 7.49 9.42 7.49C9.25 7.48 9.05 7.42 9.05 7.42Z"/>
                </svg>
              </span>
              <span class="guest-whatsapp-label">información (Whatsapp) (+58)4148674528</span>
            </a>
          </div>

          <div class="guest-action-cta">
            <button type="button" class="button btn-auth-trigger btn-guest-portal" data-paint="primary" data-size="lg">
              <span class="btn-icon">🔑</span>
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </div>
      </section>

      <!-- 3. VISTA PARA USUARIOS AUTENTICADOS: Barra de gestión y Calendario completo con filtros -->
      <div id="authenticated-app-view" class="authenticated-app-view stack" data-gap="md" style="${isAuthenticated ? '' : 'display: none;'}">
        <!-- BARRA DE BOTONES DE ACCESO RÁPIDO (Espacio arriba del calendario) -->
        ${renderQuickActionsBar()}

        <!-- SECCIÓN PRINCIPAL: Calendario Odontológico Completo -->
        <main id="content" class="calendar-main-section">
          <div class="calendar-card box" data-surface="raised" data-border>
            <div class="stack" data-gap="md">
              
              <!-- Barra de Herramientas del Calendario (Navegación + Filtro Doctor + Vistas) -->
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

                <!-- Controles de la derecha: Filtro por Doctor + Selector de Vistas -->
                <div class="cluster cal-toolbar-right" data-gap="sm" data-align="center">
                  <!-- Filtro por Doctor -->
                  <div class="cluster cal-doctor-filter-cluster" data-gap="2xs" data-align="center">
                    <label for="cal-doctor-filter" class="cal-doctor-filter-label" title="Filtrar citas por doctor">
                      <span class="filter-icon">🩺</span>
                      <span class="filter-text">Doctor:</span>
                    </label>
                    <select id="cal-doctor-filter" class="form-input form-select cal-doctor-filter-select" aria-label="Filtrar citas por doctor">
                      <option value="all">👨‍⚕️ Todos los doctores</option>
                    </select>
                  </div>

                  <!-- Selector de Vistas: Mes | Semana | Día -->
                  <div class="cluster cal-views-selector" data-gap="2xs" role="tablist">
                    <button type="button" class="button btn-cal-view" data-view="month" data-variant="ghost" data-size="sm" role="tab">
                      Mes
                    </button>
                    <button type="button" class="button btn-cal-view" data-view="week" data-paint="primary" data-size="sm" role="tab">
                      Semana
                    </button>
                    <button type="button" class="button btn-cal-view" data-view="day" data-variant="ghost" data-size="sm" role="tab">
                      Día
                    </button>
                  </div>
                </div>

              </div>

              <!-- Barra de Leyenda de Doctores y Colores Diferenciados -->
              <div id="cal-doctor-legend" class="cal-doctor-legend cluster" data-gap="2xs" data-align="center">
                <!-- Renderizado dinámicamente por calendarController -->
              </div>

              <!-- Contenedor dinámico de la vista activa (Mes, Semana o Día) -->
              <div id="cal-view-container" class="cal-view-container">
                <!-- Renderizado dinámico por calendarController -->
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- Modal Dialog para Autenticación (Login) -->
    ${renderAuthModal()}

    <!-- Modal Dialog para Configuración Administrativa (Admin en user_roles) -->
    ${renderAdminConfigModal()}

    <!-- Modal Dialog para Citas Odontológicas (CRUD Calendario) -->
    ${renderCitaModal()}

    <!-- Modal Dialog para Historial Médico Odontológico (CRUD historial_medico) -->
    ${renderHistorialModal()}

    <!-- Modal Dialog para Odontograma Clínico Gráfico (CRUD detalle_odontograma) -->
    ${renderOdontogramaModal()}
  `;
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}
