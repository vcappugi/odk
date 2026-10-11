# ODK Modular App — Web Responsive & Android Native

Aplicación web modular responsive de alto rendimiento con desarrollo de aplicación nativa para **Android**, construida con el framework CSS **Foundation Yeti (v7.0)**, JavaScript modular (ES Modules con Vite) e integración en tiempo real con bases de datos **Supabase**.

---

## 🚀 Características Principales

- **Módulo de Autenticación con Encriptación:** Ventana modal con pestañas de **Inicio de Sesión** y **Auto-Registro** conectada directamente a la tabla `usuario` de Supabase. Las contraseñas se almacenan fuertemente encriptadas con **bcrypt** (salt rounds).
- **Arquitectura Modular Limpia:** Estructura desacoplada en capas (Config, Services, Modules, Components, Utils).
- **Framework CSS Yeti (Foundation):** Diseño responsive moderno basado en tokens de diseño CSS nativos (`oklch()`, `light-dark()`, atributos de diseño `data-gap`, `data-surface`, `data-min`).
- **Soporte Nativo Android:** Integración completa con **Capacitor**, con carpeta `android/` lista para sincronizar y compilar APKs en Android Studio.
- **Base de Datos Supabase:** Cliente `@supabase/supabase-js` con detección de estado en vivo, respaldo local/offline resiliente y variables centralizadas en `.env`.
- **Modo Claro / Oscuro Dinámico:** Persistencia automática del tema seleccionado por el usuario.
- **Herramienta de Compilación Vite:** Recarga rápida en desarrollo (HMR) y empaquetado optimizado para la web y Android WebView.

---

## 📁 Estructura del Proyecto

```
odk/
├── .env                         # Parámetros de conexión de Supabase y app
├── .env.example                 # Plantilla de variables de entorno
├── capacitor.config.json        # Configuración nativa para Capacitor Android
├── vite.config.js               # Configuración del empaquetador Vite (base relativa)
├── package.json                 # Dependencias y scripts de ejecución
├── index.html                   # Punto de entrada HTML con layout Yeti Shell
│
├── android/                     # Proyecto nativo de Android (Gradle / Java)
│   ├── app/
│   │   ├── src/main/AndroidManifest.xml
│   │   └── src/main/assets/public/   # Assets web sincronizados
│   └── build.gradle
│
├── docs/                        # Documentación técnica detallada
│   ├── ARCHITECTURE.md          # Guía de arquitectura modular
│   ├── SUPABASE_SETUP.md        # Configuración de base de datos y SQL
│   └── ANDROID_BUILD.md         # Guía de compilación y APK en Android Studio
│
└── src/
    ├── assets/
    │   ├── styles/
    │   │   └── app.css          # Estilos propios, fuentes Outfit y safe-areas móviles
    │   └── vendor/
    │       └── yeti/
    │           ├── yeti.css     # Framework Yeti CSS 7.0 de Foundation
    │           ├── yeti.js      # Módulos JS de Yeti (alerts, dialogs, etc.)
    │           └── theme.css    # Tokens de tema claro/oscuro de Yeti
    │
    ├── config/
    │   ├── env.js               # Validador y exportador de variables .env
    │   └── constants.js         # Constantes del sistema y estados
    │
    ├── services/
    │   ├── supabaseClient.js    # Inicialización del cliente Supabase y test de ping
    │   ├── storageService.js    # Respaldo de persistencia local y datos iniciales
    │   ├── platformService.js   # Detección de plataforma (Web vs Android Nativo)
    │   └── notificationService.js # Despachador de alertas y toasts Yeti
    │
    ├── modules/
    │   ├── auth/                # Módulo de Autenticación (Login & Auto-Registro)
    │   │   ├── authModel.js     # Encriptación bcrypt y consultas a tabla 'usuario'
    │   │   ├── authView.js      # Modal Yeti de Login / Auto-Registro y pestañas
    │   │   └── authController.js# Control de sesión, visibilidad y eventos
    │   └── records/             # Módulo de Dominio (CRUD de Registros)
    │       ├── recordsModel.js  # Consultas a Supabase / fallback local
    │       ├── recordsView.js   # Renderizado de tarjetas y grilla Yeti
    │       └── recordsController.js # Lógica de eventos, modal y borrado
    │
    ├── components/              # Componentes de interfaz reutilizables
    │   ├── Navbar.js            # Barra de navegación con drawer responsive móvil
    │   ├── Hero.js              # Sección principal informativa
    │   ├── ConnectionBanner.js  # Monitor de estado y visor SQL para Supabase
    │   ├── RecordModal.js       # Diálogo nativo modal de creación/edición
    │   └── AndroidGuide.js      # Tarjetas con pasos de desarrollo Android
    │
    ├── utils/
    │   ├── dom.js               # Funciones de utilidad para manipulación del DOM
    │   └── formatters.js        # Formateadores de fecha y badges Yeti
    │
    └── main.js                  # Inicialización y arranque de la aplicación
```

---

## ⚙️ Configuración de Parámetros (`.env`)

Edita el archivo [`.env`](file:///c:/xampp/htdocs/odk/.env) ubicado en la raíz del proyecto:

```env
# URL de tu proyecto en Supabase
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima (anon public key)
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui

# Nombre de la aplicación y tabla
VITE_APP_NAME="ODK Modular App"
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
VITE_SUPABASE_TABLE=records
```

> **Nota:** Si ejecutas la aplicación antes de configurar tus credenciales reales, la app funcionará automáticamente en **Modo Demostración Local**, permitiéndote probar la interfaz y el CRUD sin errores de conexión.

---

## 🛠️ Comandos de Desarrollo

### 1. Desarrollo Web
```bash
# Iniciar servidor de desarrollo con recarga rápida
npm run dev

# Compilar para producción (genera la carpeta dist/)
npm run build

# Previsualizar la compilación de producción localmente
npm run preview
```

### 2. Desarrollo para Android
```bash
# Compilar web y sincronizar cambios con la carpeta android/
npm run cap:sync

# Abrir el proyecto en Android Studio
npm run cap:open

# Ejecutar directamente en emulador o dispositivo Android conectado
npm run cap:run
```

---

## 🗄️ Esquema SQL para Supabase

Para habilitar la sincronización en la nube, ve a [Supabase Dashboard](https://supabase.com/dashboard) > **SQL Editor** y ejecuta:

```sql
create table if not exists records (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text default 'General',
  status text default 'Pendiente',
  priority text default 'Media',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar seguridad de nivel de fila (RLS)
alter table records enable row level security;

-- Política de acceso para clientes anónimos
create policy "Acceso publico para pruebas"
  on records for all
  using (true)
  with check (true);
```

---

## 📱 Despliegue en Dispositivo Android

1. Asegúrate de tener instalado [Android Studio](https://developer.android.com/studio).
2. Ejecuta `npm run cap:sync` para reflejar cualquier cambio en el código web.
3. Ejecuta `npm run cap:open` para abrir la carpeta `android/` en Android Studio.
4. Presiona el botón verde **Run** (o presiona `Shift + F10`) para lanzar la aplicación en tu emulador o dispositivo físico.
