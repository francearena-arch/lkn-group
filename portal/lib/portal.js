import 'server-only';
import { auth } from './auth';
import { neon } from '@neondatabase/serverless';

export const db = () => neon(process.env.DATABASE_URL);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function requirePortalUser() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) return null;
  return { id: String(data.user.id), email: String(data.user.email || '') };
}

// Administrative privileges are independent of membership roles.
// Neither email addresses nor user-controlled metadata grant administrator rights.
export async function isPortalAdmin(sql, userId) {
  const rows = await sql.query(
    'SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true LIMIT 1',
    [userId]
  );
  return rows.length === 1;
}

export async function getClientMembership(sql, userId) {
  const rows = await sql.query(
    "SELECT m.client_id, c.name FROM public.portal_memberships m INNER JOIN public.portal_clients c ON c.id=m.client_id WHERE m.user_id=$1 AND c.status='active' ORDER BY m.created_at ASC LIMIT 1",
    [userId]
  );
  return rows[0] || null;
}

// A client-supplied client_id never grants access.
// Admins must explicitly select an active client; customers may use only
// their assigned tenant and are denied requests naming another tenant.
export async function resolveClientAccess(sql, userId, requestedClientId) {
  const admin = await isPortalAdmin(sql, userId);
  if (admin) {
    if (!requestedClientId || !UUID.test(requestedClientId))
      return { ok: false, status: 400, isAdmin: true, error: 'Bitte einen Mandanten auswählen' };
    const rows = await sql.query(
      "SELECT id AS client_id, name FROM public.portal_clients WHERE id=$1 AND status='active' LIMIT 1",
      [requestedClientId]
    );
    return rows.length
      ? { ok: true, isAdmin: true, ...rows[0] }
      : { ok: false, status: 404, isAdmin: true, error: 'Mandant nicht gefunden' };
  }

  const membership = await getClientMembership(sql, userId);
  if (!membership) return { ok: false, status: 403, isAdmin: false, error: 'Kein freigeschalteter Mandantenzugang' };
  if (requestedClientId && requestedClientId !== String(membership.client_id))
    return { ok: false, status: 403, isAdmin: false, error: 'Zugriff verweigert' };
  return { ok: true, isAdmin: false, ...membership };
}

export function reject(status, message) {
  return Response.json({ error: message }, {
    status,
    headers: { 'Cache-Control': 'private, no-store, max-age=0' }
  });
}

export function checkSameOrigin(req) {
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  return Boolean(origin && origin === url.origin);
}
