import 'server-only';
import { auth } from './auth';
import { neon } from '@neondatabase/serverless';

export const db = () => neon(process.env.DATABASE_URL);

export async function requirePortalUser() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) return null;
  return { id: String(data.user.id), email: String(data.user.email || '') };
}

export async function getClientMembership(sql, userId) {
  const records = await sql.query(
    "SELECT m.client_id, m.role, c.name FROM public.portal_memberships m JOIN public.portal_clients c ON c.id = m.client_id WHERE m.user_id = $1 AND c.status = 'active' ORDER BY m.created_at ASC LIMIT 1",
    [userId]
  );
  return records[0] || null;
}

export function reject(status, message) {
  return Response.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function checkSameOrigin(req) {
  const origin = req.headers.get('origin');
  const url = new URL(req.url);
  return Boolean(origin && origin === url.origin);
}
