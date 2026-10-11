/**
 * Componente Hero (Yeti Center / Hero)
 */
import { env } from '../config/env.js';

export function renderHero() {
  return `
    <section class="center" data-max="xl" aria-labelledby="hero-title">
      <div class="hero stack" data-gap="md">
        <div class="cluster" data-gap="xs">
          <span class="badge" data-paint="primary">Yeti CSS 7.0</span>
          <span class="badge" data-paint="neutral">JavaScript ES Modules</span>
          <span class="badge" data-paint="secondary">Supabase DB</span>
          <span class="badge" data-paint="success">Capacitor Android</span>
        </div>

        <h1 id="hero-title" class="hero-title">
          Arquitectura Modular Web & Android
        </h1>

        <p class="lede">
          Solución responsive de alto rendimiento diseñada con Foundation Yeti CSS,
          conectividad en tiempo real con base de datos <strong>Supabase</strong> y empaquetado nativo para <strong>Android</strong>.
        </p>

        <div class="cluster hero-actions" data-gap="sm">
          <button id="btn-open-create-modal" class="button" data-paint="primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            Nuevo Registro
          </button>
          <a href="#supabase-status" class="button" data-variant="outlined">
            Ver Estado de Base de Datos
          </a>
          <button id="btn-sync-data" class="button" data-variant="ghost" title="Sincronizar datos">
            🔄 Recargar
          </button>
        </div>
      </div>
    </section>
  `;
}
