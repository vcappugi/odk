/**
 * Servicio de Scraping para el Banco Central de Venezuela (BCV)
 * URL Oficial: https://www.bcv.org.ve/
 * Extrae:
 * - div id="dolar" -> tasa oficial de USD
 * - span datatype="xsd:dateTime" -> fecha valor oficial
 */

export const bcvScraperService = {
  /**
   * Analiza el HTML del portal del BCV y extrae la tasa del dólar y la fecha valor
   * @param {string} html 
   * @returns {{ valorUSD: number|null, fecha: string|null, fechaTexto: string }}
   */
  parseBCVHtml(html) {
    let valorUSD = null;
    let fecha = null;
    let fechaTexto = '';

    if (!html || typeof html !== 'string') {
      throw new Error('El contenido HTML recibido del BCV está vacío');
    }

    // 1. Intento primario con DOMParser en navegador
    try {
      if (typeof window !== 'undefined' && window.DOMParser) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // a. Extraer valor del dólar desde div id="dolar"
        const dolarDiv = doc.querySelector('#dolar') || doc.getElementById('dolar');
        if (dolarDiv) {
          const strongEl = dolarDiv.querySelector('strong');
          if (strongEl) {
            const rawVal = strongEl.textContent.trim();
            const normalized = rawVal.replace(/\./g, '').replace(',', '.');
            const num = parseFloat(normalized);
            if (!isNaN(num) && num > 0) {
              valorUSD = num;
            }
          }
        }

        // b. Extraer fecha valor desde span con datatype="xsd:dateTime"
        const dateSpan = doc.querySelector('span[datatype="xsd:dateTime"]') || 
                         doc.querySelector('[datatype="xsd:dateTime"]');
        if (dateSpan) {
          fechaTexto = dateSpan.textContent.trim();
          const contentAttr = dateSpan.getAttribute('content');
          if (contentAttr && contentAttr.includes('T')) {
            fecha = contentAttr.split('T')[0];
          } else if (contentAttr && /^\d{4}-\d{2}-\d{2}/.test(contentAttr)) {
            fecha = contentAttr.substring(0, 10);
          }
        }
      }
    } catch (domErr) {
      console.warn('[bcvScraperService] Error con DOMParser, usando fallback regex:', domErr);
    }

    // 2. Fallback con Expresiones Regulares si DOMParser no resolvió
    if (valorUSD === null) {
      const dolarMatch = html.match(/id=["']dolar["'][\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i) ||
                         html.match(/id=["']dolar["'][\s\S]*?<\/div>/i);
      
      const snippet = dolarMatch ? dolarMatch[0] : '';
      const strongMatch = snippet.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i) ||
                          html.match(/id=["']dolar["'][\s\S]{1,600}?<strong[^>]*>([\s\S]*?)<\/strong>/i);

      if (strongMatch) {
        const rawVal = strongMatch[1].replace(/<[^>]+>/g, '').trim();
        const normalized = rawVal.replace(/\./g, '').replace(',', '.');
        const num = parseFloat(normalized);
        if (!isNaN(num) && num > 0) {
          valorUSD = num;
        }
      }
    }

    if (!fecha) {
      const dateTagMatch = html.match(/<span[^>]*datatype=["']xsd:dateTime["'][^>]*content=["']([^"']+)["'][^>]*>([\s\S]*?)<\/span>/i) ||
                           html.match(/<span[^>]*content=["']([^"']+)["'][^>]*datatype=["']xsd:dateTime["'][^>]*>([\s\S]*?)<\/span>/i);

      if (dateTagMatch) {
        const iso = dateTagMatch[1];
        if (iso && iso.includes('T')) {
          fecha = iso.split('T')[0];
        } else if (iso && /^\d{4}-\d{2}-\d{2}/.test(iso)) {
          fecha = iso.substring(0, 10);
        }
        if (dateTagMatch[2]) {
          fechaTexto = dateTagMatch[2].replace(/<[^>]+>/g, '').trim();
        }
      }
    }

    // Si aún no se obtuvo fecha pero hay texto en español (ej: "Martes, 13 Octubre 2026")
    if (!fecha && fechaTexto) {
      const parsedDate = this.parseSpanishDate(fechaTexto);
      if (parsedDate) {
        fecha = parsedDate;
      }
    }

    // Fallback de fecha al día actual si no se encontró atributo en el span
    if (!fecha) {
      const now = new Date();
      fecha = now.toISOString().split('T')[0];
    }

    return {
      valorUSD,
      fecha,
      fechaTexto
    };
  },

  /**
   * Intenta convertir fecha en texto en español a formato YYYY-MM-DD
   * @param {string} text 
   * @returns {string|null}
   */
  parseSpanishDate(text) {
    if (!text) return null;
    const months = {
      enero: '01', febrero: '02', marzo: '03', abril: '04',
      mayo: '05', junio: '06', julio: '07', agosto: '08',
      septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
    };

    const match = text.toLowerCase().match(/(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})/);
    if (match) {
      const day = match[1].padStart(2, '0');
      const monthStr = match[2];
      const year = match[3];
      const month = months[monthStr];
      if (month) {
        return `${year}-${month}-${day}`;
      }
    }
    return null;
  },

  /**
   * Obtiene el HTML del portal del BCV con reintentos y proxies anti-CORS
   * @returns {Promise<{ valorUSD: number, fecha: string, fechaTexto: string }>}
   */
  async fetchRate() {
    const endpoints = [
      // 1. Endpoint proxy local Vite o Vercel Serverless
      {
        url: '/api/bcv',
        type: 'proxy'
      },
      // 2. Endpoint PHP para Apache XAMPP
      {
        url: 'php/bcv.php',
        type: 'php'
      },
      // 3. Fallback proxy público allorigins
      {
        url: `https://api.allorigins.win/raw?url=${encodeURIComponent('https://www.bcv.org.ve/')}`,
        type: 'cors-proxy-1'
      },
      // 4. Fallback proxy público corsproxy.io
      {
        url: `https://corsproxy.io/?url=${encodeURIComponent('https://www.bcv.org.ve/')}`,
        type: 'cors-proxy-2'
      },
      // 5. Intento directo (por si el entorno lo permite o es Capacitor)
      {
        url: 'https://www.bcv.org.ve/',
        type: 'direct'
      }
    ];

    let lastError = null;

    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(ep.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} en ${ep.type}`);
        }

        const html = await response.text();
        if (html && (html.includes('id="dolar"') || html.includes('USD') || html.includes('bcv.org.ve'))) {
          const result = this.parseBCVHtml(html);
          if (result && result.valorUSD) {
            return result;
          }
        }
      } catch (err) {
        lastError = err;
        console.warn(`[bcvScraperService] Intento fallido con ${ep.type} (${ep.url}):`, err.message);
      }
    }

    throw new Error(
      'No se pudo conectar automáticamente con la página del Banco Central de Venezuela. ' +
      'Por favor verifica tu conexión a internet o ingresa la tasa manualmente. ' +
      (lastError ? `(${lastError.message})` : '')
    );
  }
};
