// Supabase Edge Function — create-mp-preference
// Runtime: Deno
// Deploy: supabase functions deploy create-mp-preference --no-verify-jwt

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');
  console.log('[MP] ACCESS_TOKEN present:', !!ACCESS_TOKEN);

  if (!ACCESS_TOKEN) {
    console.error('[MP] MP_ACCESS_TOKEN secret not set');
    return json({ error: 'MP_ACCESS_TOKEN no configurado en Supabase secrets.' }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  console.log('[MP] Received body keys:', Object.keys(body));
  console.log('[MP] items count:', body?.items?.length);
  console.log('[MP] orderId:', body?.orderId);
  console.log('[MP] buyer.email:', body?.buyer?.email);

  if (!Array.isArray(body?.items) || body.items.length === 0) {
    return json({ error: 'items[] requerido y no vacío.' }, 400);
  }
  if (!body?.orderId) {
    return json({ error: 'orderId requerido.' }, 400);
  }
  if (!body?.buyer?.email) {
    return json({ error: 'buyer.email requerido.' }, 400);
  }

  // ── Preference payload — minimal and explicit ────────────────────────────────
  const preference = {
    items: body.items.map((item: any, idx: number) => ({
      id:          String(item.productId || `prod-${idx}`),
      title:       String(item.name || 'Producto').slice(0, 255),
      quantity:    Math.max(1, Number(item.quantity)),
      currency_id: 'MXN',
      unit_price:  Math.max(0.01, Number(item.price)),
    })),

    payer: {
      name:  String(body.buyer.name  || ''),
      email: String(body.buyer.email),
    },

    // Hardcoded — no auto_return, no dynamic siteUrl, no extra fields
    back_urls: {
      success: 'http://localhost:5173/?mp_return=exitoso',
      failure: 'http://localhost:5173/?mp_return=fallido',
      pending: 'http://localhost:5173/?mp_return=pendiente',
    },

    external_reference: String(body.orderId),
  };

  console.log('[MP] Preference to send:', JSON.stringify(preference));

  let mpRes: Response;
  try {
    mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[MP] Network error:', msg);
    return json({ error: `Error de red: ${msg}` }, 502);
  }

  let mpData: any;
  try {
    mpData = await mpRes.json();
  } catch {
    console.error('[MP] Non-JSON response, HTTP:', mpRes.status);
    return json({ error: `Respuesta inválida de MP (HTTP ${mpRes.status})` }, 502);
  }

  console.log('[MP] MP response status:', mpRes.status);
  console.log('[MP] MP response body:', JSON.stringify(mpData));

  if (!mpRes.ok || !mpData?.id) {
    const cause = Array.isArray(mpData?.cause)
      ? (mpData.cause as any[]).map((c: any) => c.description).filter(Boolean).join('; ')
      : '';
    const msg = mpData?.message || mpData?.error || `HTTP ${mpRes.status}`;
    console.error('[MP] Error from MP:', msg, cause);
    return json({ error: cause ? `${msg}: ${cause}` : msg }, 422);
  }

  console.log('[MP] ✅ OK — preference_id:', mpData.id);
  return json({
    preference_id:      mpData.id,
    init_point:         mpData.init_point,
    sandbox_init_point: mpData.sandbox_init_point,
  });
});
