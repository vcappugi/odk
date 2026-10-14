/**
 * Vercel Serverless Function: Proxy para subida de fotos a Google Drive (Google Apps Script)
 * Evita bloqueos de CORS, extensiones de navegador y restricciones de origen en Vercel
 */

const DEFAULT_GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxURUZFZSseFvqj3scccuJlk9_gGAvZTYkKxw4GhlEA8fNknbqHcwn_dd9I_gjXWoD3/exec';

export default async function handler(req, res) {
  // Configuración de encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, x-target-webhook-url');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const customUrl = req.headers['x-target-webhook-url'] || req.query?.targetUrl;
  const targetUrl =
    (typeof customUrl === 'string' && customUrl.startsWith('https://script.google.com/'))
      ? customUrl
      : (
          process.env.VITE_GOOGLE_SCRIPT_DRIVE_URL ||
          process.env.GOOGLE_SCRIPT_DRIVE_URL ||
          process.env.GOOGLE_WEBHOOK_URL ||
          DEFAULT_GOOGLE_SCRIPT_URL
        );

  if (req.method === 'GET') {
    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        redirect: 'follow'
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      let payload;
      if (typeof req.body === 'string') {
        payload = req.body;
      } else if (req.body && Buffer.isBuffer(req.body)) {
        payload = req.body.toString('utf8');
      } else {
        payload = JSON.stringify(req.body);
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        body: payload,
        headers: {
          'Content-Type': 'text/plain'
        },
        redirect: 'follow'
      });

      if (!response.ok) {
        return res.status(response.status).json({
          status: 'error',
          message: `Error de Google Apps Script: ${response.status} ${response.statusText}`
        });
      }

      const result = await response.json();
      return res.status(200).json(result);
    } catch (err) {
      console.error('[API upload-drive Error]:', err);
      return res.status(500).json({
        status: 'error',
        message: err.message || 'Error comunicándose con Google Apps Script desde el servidor de Vercel'
      });
    }
  }

  return res.status(405).json({ status: 'error', message: 'Método no permitido' });
}
