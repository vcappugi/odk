# Guía de Conexión: Subida de Fotos a Google Drive

Esta guía explica cómo habilitar la subida automática de fotografías de pacientes a la carpeta designada de Google Drive:
**Carpeta:** [https://drive.google.com/drive/folders/13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J](https://drive.google.com/drive/folders/13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J)  
**ID de Carpeta:** `13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J`

---

## Pasos para el Despliegue en 2 minutos

### 1. Crear el proyecto en Google Apps Script
1. Abre [https://script.google.com/home](https://script.google.com/home) con la cuenta de Google propietaria o con acceso de edición a la carpeta.
2. Haz clic en **"Nuevo proyecto"** (arriba a la izquierda).
3. Nómbralo: `ODONTOKRIS - Subida Drive`.

### 2. Pegar el código del Webhook
Borra el contenido de `Código.gs` y pega lo siguiente:

```javascript
// =====================================================================
// GOOGLE APPS SCRIPT: SUBIDA DE IMÁGENES A GOOGLE DRIVE
// Carpeta destino: https://drive.google.com/drive/folders/13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J
// =====================================================================

function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var folderId = contents.folderId || "13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J";
    var folder = DriveApp.getFolderById(folderId);
    
    var filename = contents.filename || ("paciente_" + new Date().getTime() + ".jpg");
    var mimeType = contents.mimeType || "image/jpeg";
    var base64Data = contents.base64;
    
    if (base64Data.indexOf(",") > -1) {
      base64Data = base64Data.split(",")[1];
    }
    
    var decoded = Utilities.base64Decode(base64Data);
    var blob = Utilities.newBlob(decoded, mimeType, filename);
    var file = folder.createFile(blob);
    
    // Intentar habilitar acceso de lectura si los permisos de la cuenta/carpeta lo permiten.
    // Si la carpeta ya es compartida o las políticas de Google restringen modificar enlaces, se ignora de forma segura.
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (sharingError) {
      // El archivo ya fue creado con éxito en la carpeta compartida
    }
    
    var fileId = file.getId();
    var directUrl = "https://lh3.googleusercontent.com/d/" + fileId;
    var viewUrl = "https://drive.google.com/file/d/" + fileId + "/view";
    
    var response = {
      status: "success",
      fileId: fileId,
      filename: filename,
      directUrl: directUrl,
      viewUrl: viewUrl
    };
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    var errorResponse = {
      status: "error",
      message: error.toString()
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    folderId: "13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
```

### 3. Implementar como Aplicación Web
1. Arriba a la derecha, haz clic en **"Implementar" (Deploy)** > **"Nueva implementación" (New deployment)**.
2. En el engranaje ⚙️ "Seleccionar tipo", elige **"Aplicación web" (Web app)**.
3. Configura:
   - **Descripción:** `Webhook ODONTOKRIS Pacientes`
   - **Ejecutar como:** `Yo (tu correo)`
   - **Quién tiene acceso:** `Cualquier usuario (Anyone)` *(Crucial para permitir la subida desde el navegador)*
4. Haz clic en **"Implementar"**.
5. Concede los permisos de Google Drive requeridos (Google mostrará una ventana para autorizar el acceso a Drive).
6. Copia la **URL de la aplicación web** (termina en `/exec`).

### 4. Configurar la URL en ODONTOKRIS
Tienes dos opciones sencillas:
- **Opción A (Desde la app):** En la ventana de paciente, haz clic en el botón **"⚙️ Webhook Drive"**, pega la URL y guarda.
- **Opción B (En `.env`):** Añade la variable a tu archivo `.env`:
  ```env
  VITE_GOOGLE_SCRIPT_DRIVE_URL=https://script.google.com/macros/s/TU_SCRIPT_ID/exec
  ```

¡Listo! A partir de ese momento, cada vez que selecciones una foto en la ventana de paciente, se subirá automáticamente a tu carpeta de Google Drive y se guardará su URL recuperable en la base de datos Supabase.

---

## Solución al error "Failed to fetch"

Si al hacer clic en "Subir a Drive" o "Probar Conexión" obtienes el error `Failed to fetch`, se debe a una de estas tres razones:

### 1. El permiso no está en "Cualquier usuario" (Causa más común: 95%)
Por defecto, Google Apps Script configura el acceso en **"Solo yo"** (Only myself). Cuando una página web intenta comunicarse con el script, Google redirige la petición a la pantalla de inicio de sesión de Google (`accounts.google.com`), lo cual es bloqueado por las políticas CORS del navegador y genera el error `Failed to fetch`.

**Cómo solucionarlo en 30 segundos:**
1. Ve a [script.google.com](https://script.google.com/) y abre tu proyecto.
2. Arriba a la derecha, haz clic en **Implementar (Deploy) > Administrar implementaciones (Manage deployments)**.
3. Haz clic en el ícono de **Editar ✏️** (lápiz) de la implementación activa.
4. En el desplegable **Versión**, selecciona **"Nueva versión"**.
5. En el campo **"Quién tiene acceso" (Who has access)**, cambia la opción a:  
   👉 **"Cualquier usuario" (Anyone)**
6. Haz clic en **Implementar**.
7. Copia la URL actualizada (terminada en `/exec`) y pégala en la app.

### 2. La URL termina en `/dev` en lugar de `/exec`
La URL de prueba terminada en `/dev` exige que el navegador tenga una sesión activa en Google y no permite peticiones anónimas CORS. Siempre utiliza la URL que termina en `/exec`.

### 3. Se ingresó el enlace de la carpeta de Drive en lugar del script
La URL configurada **no debe ser** `https://drive.google.com/drive/folders/...`. La carpeta de Google Drive no es una API web directa. La URL del Webhook debe comenzar con:
`https://script.google.com/macros/s/.../exec`
