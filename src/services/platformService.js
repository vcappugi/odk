/**
 * Servicio de Plataforma (Capacitor Android / Web)
 * Detecta el entorno de ejecución y proporciona funciones nativas adaptadas.
 */
import { Capacitor } from '@capacitor/core';
import { APP_CONSTANTS } from '../config/constants.js';

export const platformService = {
  /**
   * Obtiene la plataforma actual: 'android', 'ios' o 'web'
   */
  getPlatform() {
    try {
      return Capacitor.getPlatform();
    } catch {
      return APP_CONSTANTS.PLATFORMS.WEB;
    }
  },

  /**
   * Indica si la aplicación está corriendo en un dispositivo nativo (Android/iOS)
   */
  isNative() {
    try {
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  },

  /**
   * Indica si la aplicación está corriendo específicamente en Android
   */
  isAndroid() {
    return this.getPlatform() === APP_CONSTANTS.PLATFORMS.ANDROID;
  },

  /**
   * Configura oyentes de eventos nativos para Android (como el botón Atrás)
   */
  initPlatformListeners() {
    const platform = this.getPlatform();
    console.log(`[PlatformService] Plataforma detectada: ${platform} (Nativo: ${this.isNative()})`);

    // Añade clase al body para permitir ajustes CSS específicos de Android (ej. safe-areas)
    document.documentElement.classList.add(`platform-${platform}`);
    if (this.isNative()) {
      document.documentElement.classList.add('is-native');
    }
  }
};
