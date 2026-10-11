# Guía de Conexión y Configuración de Supabase

Este documento detalla los pasos para enlazar la aplicación con tu proyecto en la nube de Supabase.

---

## 1. Crear el Proyecto en Supabase

1. Ingresa a [https://supabase.com/](https://supabase.com/) e inicia sesión.
2. Haz clic en **New Project** y selecciona tu organización.
3. Asigna un nombre al proyecto (por ejemplo `odk-app`), una contraseña para la base de datos y elige la región más cercana.

---

## 2. Obtener las Claves de Conexión

1. En el panel de control de tu proyecto, ve a **Project Settings** (ícono de engranaje) > **API**.
2. Copia los siguientes valores:
   - **Project URL:** Por ejemplo `https://abcdefghijklm.supabase.co`
   - **anon / public key:** Cadena JWT larga que comienza con `eyJhbGci...`

---

## 3. Configurar el Archivo `.env`

Abre el archivo [`.env`](file:///c:/xampp/htdocs/odk/.env) en la raíz del proyecto y reemplaza los parámetros:

```env
VITE_SUPABASE_URL=https://abcdefghijklm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_TABLE=records
```

Guarda los cambios. Si el servidor de desarrollo está corriendo (`npm run dev`), Vite recargará las variables automáticamente.

---

## 4. Crear la Tabla de Base de Datos

En el panel de Supabase, abre la pestaña **SQL Editor** y ejecuta el siguiente script:

```sql
-- Crear tabla de registros
create table if not exists public.records (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text default 'General',
  status text default 'Pendiente',
  priority text default 'Media',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar Row Level Security (RLS)
alter table public.records enable row level security;

-- Política de lectura y escritura para clientes con clave anónima (pública)
create policy "Permitir todas las operaciones publicas"
  on public.records
  for all
  to anon
  using (true)
  with check (true);
```

---

## 5. Verificación

Abre la aplicación en el navegador y haz clic en el botón **"🔍 Test de Conexión"**. El indicador cambiará a **"🟢 En Línea (Supabase Live)"**, confirmando que tanto la autenticación como la lectura y escritura se están realizando directamente en tu base de datos remota.
