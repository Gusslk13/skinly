// Helper para llamar a la Edge Function send-notification desde el cliente.
// Fire-and-forget: los errores se logean pero no bloquean el flujo principal.

const EDGE_URL  = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification`;
const ANON_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export interface NotifPayload {
  /** UUID del usuario destino. Mutuamente exclusivo con `role`. */
  userId?: string;
  /** Envía a TODOS los usuarios con este rol (ej. 'admin'). */
  role?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export const sendNotification = async (payload: NotifPayload): Promise<void> => {
  if (!payload.userId && !payload.role) return;
  try {
    await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey':         ANON_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn('[sendNotification] Error (non-blocking):', e);
  }
};
