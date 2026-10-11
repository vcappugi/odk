# Guía de Compilación y Desarrollo de la App de Android

La aplicación utiliza **Capacitor** para empaquetar el frontend web en una aplicación nativa de Android de alto rendimiento.

---

## 1. Requisitos Previos

- **Node.js** v18 o superior.
- **Android Studio** (versión reciente con Android SDK instalado).
- Variable de entorno `ANDROID_HOME` o SDK configurado en Android Studio.

---

## 2. Flujo de Trabajo

### Sincronización Web -> Android
Cada vez que realices cambios en el código de `src/`, debes reconstruir el bundle web y sincronizarlo con la carpeta nativa:

```bash
npm run cap:sync
```

Este comando ejecuta internamente:
1. `vite build`: Compila los archivos JavaScript, estilos Yeti CSS y plantillas a la carpeta `dist/`.
2. `npx cap sync android`: Copia los archivos de `dist/` a `android/app/src/main/assets/public/` y actualiza los plugins de Capacitor.

---

## 3. Abrir en Android Studio

Para abrir el proyecto en Android Studio:

```bash
npm run cap:open
```

Una vez en Android Studio:
1. Espera a que Gradle termine de sincronizar las dependencias.
2. Selecciona un emulador (AVD) o conecta un dispositivo Android físico con depuración USB habilitada.
3. Haz clic en el botón verde **Run (Play)** en la barra superior.

---

## 4. Generar el Archivo APK o AAB para Distribución

Dentro de Android Studio:
1. Menú **Build** > **Generate Signed Bundle / APK**.
2. Selecciona **APK** (para pruebas directas) o **Android App Bundle** (para Google Play Store).
3. Selecciona tu almacén de claves (keystore) o crea uno nuevo para firmar la aplicación.
4. Elige la variante **release** y presiona **Create**.

El archivo APK generado se ubicará en:
`android/app/release/app-release.apk`
