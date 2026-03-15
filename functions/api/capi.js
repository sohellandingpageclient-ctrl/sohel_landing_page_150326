/**
 * Meta Conversions API (CAPI) — Cloudflare Pages Function
 *
 * Receives event data from the browser and forwards it to Meta CAPI.
 * The Access Token stays server-side — never exposed to the browser.
 *
 * Required environment variables (set in Cloudflare Pages dashboard):
 *   META_PIXEL_ID      — your 15-16 digit Pixel ID
 *   META_ACCESS_TOKEN  — your Meta System User access token
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  const PIXEL_ID     = env.META_PIXEL_ID;
  const ACCESS_TOKEN = env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.error('Missing META_PIXEL_ID or META_ACCESS_TOKEN env vars');
    return new Response('Server config error', { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { eventName, eventID, fbp, fbc, sourceUrl, userAgent, testCode } = body;

  if (!eventName || !eventID) {
    return new Response('Missing eventName or eventID', { status: 400 });
  }

  // Cloudflare provides the real client IP via cf-connecting-ip
  const rawIp = request.headers.get('cf-connecting-ip') ||
                request.headers.get('x-forwarded-for') || '';
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
          client_user_agent: userAgent || request.headers.get('user-agent') || '',
          fbp: fbp  || undefined,
          fbc: fbc  || undefined
        }
      }
    ]
  };

  // Add test event code if provided
  if (testCode) capiPayload.test_event_code = testCode;

  // Send to Meta Graph API
  const apiUrl = `https://graph.facebook.com/v22.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

  try {
    const response = await fetch(apiUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(capiPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta CAPI error:', JSON.stringify(result));
    }

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    console.error('CAPI fetch failed:', err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
