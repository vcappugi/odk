/**
 * Vercel Serverless Function: Proxy para scraping de tasa BCV (Banco Central de Venezuela)
 * Resuelve restricciones de CORS para la obtención de datos del portal www.bcv.org.ve
 */
export default async function handler(req, res) {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, User-Agent');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const response = await fetch('https://www.bcv.org.ve/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      }
    });

    if (!response.ok) {
      throw new Error(`El Banco Central de Venezuela respondió con código HTTP ${response.status}`);
    }

    const html = await response.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    console.error('[API BCV Proxy Error]:', error);
    return res.status(500).json({
      error: error.message || 'Error al conectar con la página del Banco Central de Venezuela'
    });
  }
}
