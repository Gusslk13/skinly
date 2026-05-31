/**
 * Edge Function: send-notification
 *
 * Sends a Firebase Cloud Messaging (FCM v1 API) push notification to:
 *   - a specific user (by userId), or
 *   - all users with a given role (e.g. 'admin')
 *
 * Body: { userId?, role?, title, body, data? }
 *
 * Uses FIREBASE_SERVICE_ACCOUNT secret (JSON string of the Firebase service account key).
 * Requires: supabase secrets set FIREBASE_SERVICE_ACCOUNT='...'
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Base64url encode a Uint8Array (no padding) */
function base64url(data: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...data));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/** Encode a JS object as base64url JSON */
function encodeJson(obj: unknown): string {
  return base64url(new TextEncoder().encode(JSON.stringify(obj)));
}

/**
 * Build a signed RS256 JWT for Google OAuth2.
 * @param serviceAccount - parsed Firebase service account JSON
 * @param scope - OAuth2 scope to request
 */
async function buildJwt(serviceAccount: Record<string, string>, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeJson({ alg: 'RS256', typ: 'JWT' });
  const payload = encodeJson({
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope,
  });

  const signingInput = `${header}.${payload}`;

  // Import the private key (PKCS#8 PEM → CryptoKey)
  const pemBody = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const keyBuffer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64url(new Uint8Array(signature))}`;
}

/** Exchange a signed JWT for a Google OAuth2 access token */
async function getAccessToken(serviceAccount: Record<string, string>): Promise<string> {
  const jwt = await buildJwt(serviceAccount, 'https://www.googleapis.com/auth/firebase.messaging');

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const json = await res.json();
  if (!json.access_token) {
    throw new Error(`OAuth2 token error: ${JSON.stringify(json)}`);
  }
  return json.access_token as string;
}

/** Send a single FCM message via the v1 API */
async function sendFcmMessage(
  projectId: string,
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message: Record<string, unknown> = {
    message: {
      token: fcmToken,
      notification: { title, body },
      ...(data ? { data } : {}),
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(message),
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn(`[FCM] Failed for token ${fcmToken.slice(0, 20)}…: ${err}`);
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
      },
    });
  }

  try {
    const { userId, role, title, body, data } = await req.json() as {
      userId?: string;
      role?: string;
      title: string;
      body: string;
      data?: Record<string, string>;
    };

    if (!userId && !role) {
      return new Response(JSON.stringify({ error: 'userId or role required' }), { status: 400 });
    }

    // Load service account secret
    const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
    if (!saRaw) throw new Error('FIREBASE_SERVICE_ACCOUNT secret not set');
    const serviceAccount = JSON.parse(saRaw) as Record<string, string>;
    const projectId = serviceAccount.project_id;

    // Supabase admin client (service role) to read users table
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!;
    const serviceRole  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(supabaseUrl, serviceRole);

    // Resolve FCM tokens
    let tokens: string[] = [];

    if (userId) {
      const { data: row } = await admin
        .from('users')
        .select('fcm_token')
        .eq('id', userId)
        .maybeSingle();
      if (row?.fcm_token) tokens = [row.fcm_token];
    } else if (role) {
      const { data: rows } = await admin
        .from('users')
        .select('fcm_token')
        .eq('role', role)
        .not('fcm_token', 'is', null);
      tokens = (rows ?? []).map((r: any) => r.fcm_token).filter(Boolean);
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, total: 0, note: 'No FCM tokens found' }), { status: 200 });
    }

    // Get Google OAuth2 access token once and reuse for all sends
    const accessToken = await getAccessToken(serviceAccount);

    // Fire all notifications in parallel
    await Promise.allSettled(
      tokens.map((token) => sendFcmMessage(projectId, accessToken, token, title, body, data)),
    );

    return new Response(JSON.stringify({ sent: tokens.length, total: tokens.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err: any) {
    console.error('[send-notification] Unhandled error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
