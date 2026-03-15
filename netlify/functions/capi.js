/**
 * Meta Conversions API (CAPI) — Netlify Serverless Function
 *
 * Receives event data from the browser and forwards it to Meta CAPI.
 * The Access Token stays server-side — never exposed to the browser.
 *
 * Required environment variables (set in Netlify dashboard):
 *   META_PIXEL_ID      — your 15-16 digit Pixel ID
 *   META_ACCESS_TOKEN  — your Meta System User access token
 */

exports.handler = async function (event) {

  // Only accept POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const PIXEL_ID     = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('Missing META_PIXEL_ID or META_ACCESS_TOKEN env vars');
    return { statusCode: 500, body: 'Server config error' };
  }

  // Parse request body
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { eventName, eventID, fbp, fbc, sourceUrl, userAgent } = body;

  if (!eventName || !eventID) {
    return { statusCode: 400, body: 'Missing eventName or eventID' };
  }

  // Get real client IP (Netlify passes this in x-forwarded-for)
  const rawIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || '';
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
          // Server-side signals — improve match quality significantly
          client_ip_address: clientIp,
          client_user_agent: userAgent || event.headers['user-agent'] || '',
          // Facebook cookies — passed from browser for user identity matching
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

    if (!response.ok) {
      console.error('Meta CAPI error:', JSON.stringify(result));
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: result })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, events_received: result.events_received })
    };

  } catch (err) {
    console.error('CAPI fetch failed:', err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message })
    };
  }
};
