/**
 * Componente de Estado y Configuración de Conexión Supabase
 */
import { env } from '../config/env.js';
import { getConnectionStatus } from '../services/supabaseClient.js';
import { escapeHTML } from '../utils/dom.js';

export function renderConnectionBanner() {
  const status = getConnectionStatus();
  const isConfigured = env.isSupabaseConfigured();

  return `
    <section id="supabase-status" class="center" data-max="xl" aria-labelledby="status-heading">
      <div class="box status-card" data-surface="raised" data-border>
        <div class="stack" data-gap="md">
          <div class="cluster status-header" data-justify="between" data-align="center">
            <div class="cluster" data-gap="sm" data-align="center">
              <span class="status-indicator ${status.isLive ? 'is-live' : 'is-demo'}"></span>
              <div>
                <h3 id="status-heading" class="status-title">Conectividad de Base de Datos Supabase</h3>
                <p class="status-subtitle">Estado del servicio: <strong>${status.isLive ? '🟢 En Línea (Supabase Live)' : (isConfigured ? '🟡 Conectando...' : '🟣 Modo Demostración Local')}</strong></p>
              </div>
            </div>
            <button id="btn-recheck-supabase" class="button" data-variant="ghost" data-size="sm">
              🔍 Test de Conexión
            </button>
          </div>

          <div class="alert" data-paint="${status.isLive ? 'success' : (isConfigured ? 'warning' : 'primary')}">
            <p><strong>Info:</strong> ${escapeHTML(status.message)}</p>
          </div>

          <div class="grid params-grid" data-min="xs" data-columns="3" data-gap="sm">
            <div class="param-item box" data-surface="sunken">
              <span class="param-label">VITE_SUPABASE_URL</span>
              <code class="param-value">${escapeHTML(env.supabaseUrl || 'No configurado')}</code>
            </div>
            <div class="param-item box" data-surface="sunken">
              <span class="param-label">VITE_SUPABASE_ANON_KEY</span>
              <code class="param-value">${env.supabaseAnonKey ? `${env.supabaseAnonKey.slice(0, 16)}...` : 'No configurado'}</code>
            </div>
            <div class="param-item box" data-surface="sunken">
              <span class="param-label">VITE_SUPABASE_TABLE</span>
              <code class="param-value">${escapeHTML(env.supabaseTable)}</code>
            </div>
          </div>

          <details class="sql-instructions box" data-surface="sunken">
            <summary><strong>📋 Instrucciones para crear la tabla en Supabase (SQL Editor)</strong></summary>
            <div class="stack" data-gap="xs" style="margin-top: 0.75rem;">
              <p>Copia y ejecuta este script en el <em>SQL Editor</em> de tu proyecto en <a href="https://supabase.com/dashboard" target="_blank" rel="noopener">Supabase</a>:</p>
              <pre class="sql-code"><code>create table if not exists records (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text default 'General',
  status text default 'Pendiente',
  priority text default 'Media',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table records enable row level security;

-- Politica publica de lectura y escritura para pruebas (Anon key)
create policy "Permitir acceso publico para pruebas"
  on records for all
  using (true)
  with check (true);</code></pre>
            </div>
          </details>
        </div>
      </div>
    </section>
  `;
}
