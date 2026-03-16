exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { N8N_WEBHOOK_URL, N8N_AUTH_PASSWORD } = process.env;

  if (!N8N_WEBHOOK_URL) {
    return { statusCode: 500, body: JSON.stringify({ error: 'N8N_WEBHOOK_URL non configurée' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'JSON invalide' }) };
  }

  const headers = { 'Content-Type': 'application/json' };

  if (N8N_AUTH_PASSWORD) {
    headers['Authorization'] = 'Basic ' + Buffer.from('n8n:' + N8N_AUTH_PASSWORD).toString('base64');
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        preferences: body.preferences
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Erreur n8n:', response.status, text);
      return { statusCode: 502, body: JSON.stringify({ error: 'Erreur du webhook n8n' }) };
    }

    const data = await response.text();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, data })
    };
  } catch (error) {
    console.error('Erreur réseau n8n:', error);
    return { statusCode: 502, body: JSON.stringify({ error: 'Impossible de joindre le webhook n8n' }) };
  }
};
