/**
 * Meta Conversions API (CAPI) — Vercel Serverless Function
 *
 * Receives event data from the browser and forwards it to Meta CAPI.
 * The Access Token stays server-side — never exposed to the browser.
 *
 * Required environment variables (set in Vercel dashboard):
 *   META_PIXEL_ID      — your 15-16 digit Pixel ID
 *   META_ACCESS_TOKEN  — your Meta System User access token
 */

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const PIXEL_ID     = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('Missing META_PIXEL_ID or META_ACCESS_TOKEN env vars');
    return res.status(500).send('Server config error');
  }

  const { eventName, eventID, fbp, fbc, sourceUrl, userAgent } = req.body;

  if (!eventName || !eventID) {
    return res.status(400).send('Missing eventName or eventID');
  }

  // Get real client IP (Vercel passes this in x-forwarded-for)
  const rawIp = req.headers['x-forwarded-for'] || '';
  const clientIp = rawIp.split(',')[0].trim() || undefined;

  // Build the CAPI payload
  const capiPayload = {
    data: [
      {
        event_name:       eventName,
        event_time:       Math.floor(Date.now() / 1000),
        event_id:         eventID,           // deduplication with browser pixel
        event_source_url: sourceUrl || '',
        action_source:    'website',
        ...(eventName === 'Subscribe' ? {
          custom_data: { currency: 'INR', value: 0 }
        } : {}),
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: userAgent || req.headers['user-agent'] || '',
          fbp: fbp  || undefined,
          fbc: fbc  || undefined
        }
      }
    ]
  };

  // Send to Meta Graph API
  const apiUrl = `https://graph.facebook.com/v20.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(capiPayload)
    });

    const result = await response.json();

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (!response.ok) {
      console.error('Meta CAPI error:', JSON.stringify(result));
      return res.status(502).json({ error: result });
    }

    return res.status(200).json({ success: true, events_received: result.events_received });

  } catch (err) {
    console.error('CAPI fetch failed:', err.message);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: err.message });
  }
}
