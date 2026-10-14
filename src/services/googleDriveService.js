/**
 * Servicio de Integración con Google Drive
 * Maneja la subida de imágenes a la carpeta designada y
 * el formateo de URLs de Google Drive para recuperación y visualización directa.
 */

import { env } from '../config/env.js';

export const GOOGLE_DRIVE_CONFIG = {
  FOLDER_ID: '13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J',
  FOLDER_URL: 'https://drive.google.com/drive/folders/13kU4_JR4ehQxVc-IQfRMLUOFR57MHt3J',
  DEFAULT_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbxURUZFZSseFvqj3scccuJlk9_gGAvZTYkKxw4GhlEA8fNknbqHcwn_dd9I_gjXWoD3/exec',
  LOCAL_STORAGE_KEY: 'odk_google_drive_webhook_url'
};

export const googleDriveService = {
  /**
   * Obtiene la URL del Webhook de Google Apps Script configurada
   * Lee desde localStorage (si fue personalizado) o desde variables de entorno (Vercel / Vite / .env)
   * con fallback garantizado a la URL oficial de producción.
   */
  getWebhookUrl() {
    // 1. Verificar si el usuario guardó una URL personalizada en localStorage
    try {
      const stored = localStorage.getItem(GOOGLE_DRIVE_CONFIG.LOCAL_STORAGE_KEY);
      if (stored && stored.trim() !== '') {
        return stored.trim();
      }
    } catch {
      // Ignorar error de acceso a localStorage
    }

    // 2. Verificar si está configurado en las variables de entorno de Vercel / Vite
    const envUrl = (env.googleScriptDriveUrl || '').trim();
    if (envUrl) {
      return envUrl;
    }

    // 3. Fallback a la URL oficial de producción
    return GOOGLE_DRIVE_CONFIG.DEFAULT_WEBHOOK_URL;
  },

  /**
   * Indica si el webhook proviene de una variable de entorno de Vercel / Vite
   */
  isConfiguredViaEnv() {
    return Boolean(env.googleScriptDriveUrl && env.googleScriptDriveUrl.trim());
  },

  /**
   * Guarda la URL del Webhook en localStorage
   */
  setWebhookUrl(url) {
    try {
      if (!url) {
        localStorage.removeItem(GOOGLE_DRIVE_CONFIG.LOCAL_STORAGE_KEY);
      } else {
        localStorage.setItem(GOOGLE_DRIVE_CONFIG.LOCAL_STORAGE_KEY, url.trim());
      }
      return true;
    } catch (e) {
      console.warn('[GoogleDriveService] Error guardando webhook URL:', e);
      return false;
    }
  },

  /**
   * Valida la estructura de la URL del Webhook y detecta errores comunes de configuración
   */
  validateWebhookUrl(url) {
    if (!url || typeof url !== 'string' || !url.trim()) {
      return {
        valid: false,
        error: 'No has configurado la URL del Webhook de Google Apps Script. Haz clic en "⚙️ Configurar Webhook Drive" para ingresarla.'
      };
    }

    const trimmed = url.trim();

    // Error común 1: El usuario ingresó el enlace de la carpeta de Google Drive
    if (trimmed.includes('drive.google.com')) {
      return {
        valid: false,
        error: 'Has ingresado el enlace de la carpeta de Google Drive en lugar del Webhook.\n\nLa carpeta de Drive no puede recibir archivos mediante peticiones directas desde el navegador. Debes crear un script en script.google.com e implementar la "Aplicación web" (con acceso: "Cualquier usuario"). La URL correcta comienza con https://script.google.com/macros/s/.../exec'
      };
    }

    // Error común 2: URL de prueba /dev
    if (trimmed.includes('/dev')) {
      return {
        valid: false,
        error: 'La URL termina en "/dev". Las URLs de prueba de Google requieren inicio de sesión con cookies y provocan "Failed to fetch".\n\nEn Google Apps Script, haz clic en "Implementar" > "Nueva implementación" > "Aplicación web" y copia la URL oficial que termina en "/exec".'
      };
    }

    // Error común 3: URL del editor de código
    if (trimmed.includes('/edit')) {
      return {
        valid: false,
        error: 'Has ingresado la URL del editor de código de Google Apps Script. Debes hacer clic en "Implementar" > "Nueva implementación" > "Aplicación web" y copiar la URL generada que termina en "/exec".'
      };
    }

    // Error común 4: Dominio diferente a script.google.com
    if (!trimmed.includes('script.google.com') && !trimmed.includes('script.googleusercontent.com')) {
      return {
        valid: false,
        error: 'La URL ingresada no es válida para Google Apps Script. Debe comenzar con https://script.google.com/macros/s/... y terminar en /exec'
      };
    }

    return {
      valid: true,
      url: trimmed
    };
  },

  /**
   * Prueba la conectividad con el Webhook de Google Apps Script
   */
  async testConnection(urlToTest = null) {
    const targetUrl = urlToTest || this.getWebhookUrl();
    const validation = this.validateWebhookUrl(targetUrl);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // 1. Probar conexión directa
    try {
      const response = await fetch(validation.url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          message: 'Conexión exitosa con el Webhook de Google Apps Script.'
        };
      }
    } catch (directErr) {
      console.warn('[GoogleDriveService] Prueba directa falló, intentando proxy Vercel:', directErr);
    }

    // 2. Probar a través del proxy de Vercel (/api/upload-drive)
    try {
      const response = await fetch('/api/upload-drive', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'x-target-webhook-url': validation.url
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          data,
          message: 'Conexión exitosa con Google Apps Script (a través del Proxy Vercel).'
        };
      }
    } catch (proxyErr) {
      console.warn('[GoogleDriveService] Prueba vía proxy también falló:', proxyErr);
    }

    throw new Error(
      'Error de conexión (Failed to fetch).\n\n' +
      'Causas más frecuentes:\n' +
      '1. Permisos en Google Apps Script: Al implementar, debes elegir obligatoriamente "Quién tiene acceso: Cualquier usuario" (Anyone). Si seleccionaste "Solo yo", Google bloquea la conexión.\n' +
      '2. Bloqueador de anuncios / extensiones: Algunos bloqueadores restringen scripts de terceros.\n\n' +
      'Solución: Ve a script.google.com > Implementar > Administrar implementaciones > Editar ✏️ > Cambia "Quién tiene acceso" a "Cualquier usuario" > Implementar.'
    );
  },

  /**
   * Extrae el ID de un archivo o carpeta de Google Drive a partir de varios formatos de URL
   */
  extractDriveFileId(input) {
    if (!input || typeof input !== 'string') return null;
    const trimmed = input.trim();

    // 1. /d/<id>
    const matchD = trimmed.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (matchD && matchD[1]) return matchD[1];

    // 2. id=<id>
    const matchId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,})/);
    if (matchId && matchId[1]) return matchId[1];

    // 3. Cadena pura que parece un ID de Google Drive (25 a 55 caracteres alfanuméricos)
    if (/^[a-zA-Z0-9_-]{25,55}$/.test(trimmed)) {
      return trimmed;
    }

    return null;
  },

  /**
   * Transforma cualquier enlace o ID de Google Drive en una URL de imagen directamente recuperable
   */
  formatDriveImageUrl(urlOrId) {
    if (!urlOrId || typeof urlOrId !== 'string') return '';
    const trimmed = urlOrId.trim();

    // Si es un data URL base64 o blob local, retornar directo
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
      return trimmed;
    }

    // Si es un enlace de Google Drive o ID de archivo
    const fileId = this.extractDriveFileId(trimmed);
    if (fileId) {
      // lh3.googleusercontent.com/d/<id> es el endpoint oficial más veloz y confiable de Google Drive para imágenes públicas
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return trimmed;
  },

  /**
   * URL alternativa como respaldo si el servidor principal tiene problemas
   */
  getThumbnailFallbackUrl(urlOrId) {
    const fileId = this.extractDriveFileId(urlOrId);
    if (fileId) {
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
    return urlOrId || '';
  },

  /**
   * Convierte un objeto File a Base64
   */
  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  },

  /**
   * Sube un archivo de imagen al Google Drive mediante el Webhook de Google Apps Script
   */
  async uploadImageToDrive(file, options = {}) {
    if (!file) throw new Error('No se seleccionó ningún archivo de imagen.');

    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo seleccionado no es una imagen válida.');
    }

    // Límite de 8MB para asegurar transmisión ligera
    if (file.size > 8 * 1024 * 1024) {
      throw new Error('La imagen excede el límite de 8MB. Selecciona una imagen más liviana.');
    }

    const webhookUrl = this.getWebhookUrl();
    const validation = this.validateWebhookUrl(webhookUrl);
    if (!validation.valid) {
      const error = new Error(validation.error);
      error.isMissingWebhook = true;
      throw error;
    }

    // Convertir a base64
    const base64Data = await this.fileToBase64(file);

    // Preparar nombre descriptivo
    const patientSlug = (options.patientName || 'paciente')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    const extension = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const finalFilename = `${patientSlug}_${timestamp}.${extension}`;

    const payload = {
      folderId: GOOGLE_DRIVE_CONFIG.FOLDER_ID,
      filename: finalFilename,
      mimeType: file.type || 'image/jpeg',
      base64: base64Data
    };

    // Intentar subida: primero directa al webhook, con fallback automático al proxy de Vercel (/api/upload-drive)
    const endpoints = [
      { name: 'direct', url: validation.url },
      { name: 'vercel-proxy', url: '/api/upload-drive' }
    ];

    let result = null;
    let lastError = null;

    for (const ep of endpoints) {
      try {
        const headers = {
          'Content-Type': 'text/plain'
        };
        if (ep.name === 'vercel-proxy') {
          headers['x-target-webhook-url'] = validation.url;
        }

        const response = await fetch(ep.url, {
          method: 'POST',
          body: JSON.stringify(payload),
          headers,
          redirect: 'follow'
        });

        if (!response.ok) {
          throw new Error(`Código HTTP ${response.status} en endpoint ${ep.name}`);
        }

        const json = await response.json();
        if (json && json.status === 'success') {
          result = json;
          break;
        } else if (json && json.status === 'error') {
          throw new Error(json.message || 'Error reportado por el Webhook');
        }
      } catch (err) {
        console.warn(`[GoogleDriveService] Intento fallido con endpoint '${ep.name}':`, err);
        lastError = err;
      }
    }

    if (!result) {
      console.error('[GoogleDriveService] Todos los endpoints de subida fallaron:', lastError);
      throw new Error(
        'Error de conexión con Google Drive.\n\n' +
        'El navegador no pudo completar la subida. Causas más frecuentes:\n' +
        '1. La aplicación web en Google Apps Script debe estar implementada con "Quién tiene acceso: Cualquier usuario" (Anyone).\n' +
        '2. La URL debe terminar en /exec (no en /dev ni /edit).\n\n' +
        '👉 Para verificarlo:\n' +
        'Abre script.google.com > Tu proyecto > "Implementar" > "Administrar implementaciones" > Edita la implementación (ícono lápiz ✏️) > En "Quién tiene acceso" selecciona "Cualquier usuario" > Implementar.'
      );
    }

    const fileId = result.fileId;
    const directUrl = result.directUrl || `https://lh3.googleusercontent.com/d/${fileId}`;
    const viewUrl = result.viewUrl || `https://drive.google.com/file/d/${fileId}/view`;

    return {
      fileId,
      directUrl,
      viewUrl,
      filename: finalFilename
    };
  },

  /**
   * Abre la carpeta de Google Drive en una nueva pestaña
   */
  openDriveFolder() {
    window.open(GOOGLE_DRIVE_CONFIG.FOLDER_URL, '_blank', 'noopener,noreferrer');
  },

  /**
   * Código listo para copiar del Google Apps Script
   */
  getAppsScriptTemplate() {
    return `// =====================================================================
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
    
    // Intentar habilitar acceso de lectura público si los permisos de la cuenta/carpeta lo permiten
    // Si la carpeta ya es compartida o la cuenta restringe compartir enlaces, se ignora de forma segura
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
}`;
  }
};
