// Función serverless (Vercel) y middleware local:
// Obtiene el token público de Spotify de forma segura en el servidor evitando errores de CORS.

let cachedToken = null;
let tokenExpiry = 0;

export async function obtenerTokenSpotify(clientId, clientSecret) {
  const ahora = Date.now();
  if (cachedToken && ahora < tokenExpiry - 60000) {
    return { access_token: cachedToken };
  }

  const id = clientId || process.env.VITE_SPOTIFY_CLIENT_ID;
  const secret = clientSecret || process.env.VITE_SPOTIFY_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error('Faltan las credenciales de Spotify en las variables de entorno.');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: id,
      client_secret: secret,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error de Spotify API: ${errorText}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = ahora + data.expires_in * 1000;

  return { access_token: cachedToken };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const data = await obtenerTokenSpotify();
    return res.status(200).json(data);
  } catch (err) {
    console.error('Error obteniendo token de Spotify:', err);
    return res.status(500).json({ error: err.message });
  }
}
