# Arquitectura Modular del Proyecto

Este documento describe los principios arquitectónicos y la organización del código implementada en **ODK Modular App**.

---

## 1. Principios de Diseño

1. **Separación de Responsabilidades (SoC):** Cada capa cumple un rol específico:
   - `config/`: Variables de entorno y constantes.
   - `services/`: Comunicación con APIs externas, persistencia y hardware nativo.
   - `modules/`: Lógica de negocio y entidades de dominio divididas en Modelo-Vista-Controlador (MVC).
   - `components/`: Bloques de interfaz de usuario desacoplados.
   - `utils/`: Funciones puras de ayuda (formato, DOM, cadenas).
2. **Offline-First & Resiliencia:** Si la red falla o las claves de Supabase no están configuradas, la aplicación cambia a modo local sin bloquear al usuario ni generar errores críticos en la interfaz.
3. **Multi-Plataforma Unificada:** Un solo código base en JavaScript y CSS corre de forma idéntica en el navegador web y dentro del contenedor WebView nativo de Android impulsado por Capacitor.
4. **Adhesión Estricta a Foundation Yeti CSS:** 
   - Estructura `class="shell"`, `class="box"`, `class="card"`, `class="grid"`, `class="cluster"`.
   - Modificadores por atributos `data-*` (`data-gap`, `data-surface`, `data-paint`, `data-min`).
   - Gestión de temas claros y oscuros mediante CSS Cascade Layers y tokens nativos (`light-dark()`, `oklch()`).

---

## 2. Diagrama de Capas

```
┌────────────────────────────────────────────────────────┐
│                   index.html (Yeti Shell)              │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                        main.js                         │
└───────┬───────────────────┬───────────────────┬────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Componentes │    │   Módulos    │    │  Servicios   │
│  UI (Yeti)   │    │  de Dominio  │    │              │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ - Navbar     │    │ records/     │    │ - Supabase   │
│ - Hero       │    │  - Model     │    │ - Storage    │
│ - Status     │    │  - View      │    │ - Platform   │
│ - Modal      │    │  - Ctrl      │    │ - Alert/Toast│
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 3. Extensibilidad: Cómo añadir un nuevo módulo

Para agregar una nueva funcionalidad (por ejemplo, `users` o `inspections`):

1. Crea la carpeta en `src/modules/<nuevo-modulo>/`.
2. Define los archivos:
   - `<modulo>Model.js`: Maneja las llamadas a la tabla correspondiente en Supabase (`supabase.from('nueva_tabla')`).
   - `<modulo>View.js`: Genera el marcado HTML utilizando clases y atributos de Yeti CSS.
   - `<modulo>Controller.js`: Escucha eventos, interactúa con el modelo y actualiza la vista.
3. Importa e inicializa el controlador en [`src/main.js`](file:///c:/xampp/htdocs/odk/src/main.js).
