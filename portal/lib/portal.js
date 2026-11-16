import 'server-only';
import { auth } from './auth';
import { neon } from '@neondatabase/serverless';
import { decideTenantScope } from './tenant-access.mjs';

export const db = () => neon(process.env.DATABASE_URL);

export async function requirePortalUser() {
  const { data, error } = await auth.getSession();
  if (error || !data?.user?.id) return null;
  return { id: String(data.user.id), email: String(data.user.email || ''), sessionId: String(data.session?.id || '') };
}

export async function isPortalAdmin(sql, userId) {
  const rows = await sql.query(
    'SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true LIMIT 1',
    [userId]
  );
  return rows.length === 1;
}

export async function getClientMembership(sql, userId) {
  const rows = await sql.query(
    "SELECT m.client_id, c.name FROM public.portal_memberships m INNER JOIN public.portal_clients c ON c.id=m.client_id WHERE m.user_id=$1 AND m.role='client' AND c.status='active' ORDER BY m.created_at ASC LIMIT 2",
    [userId]
  );
  return rows.length === 1 ? rows[0] : null;
}

export async function resolveClientAccess(sql, userId, requestedClientId, sessionId) {
  const admin = await isPortalAdmin(sql, userId);
  if (admin) {
    const {isAdminMfaVerified}=await import('./mfa');
    if(!(await isAdminMfaVerified(sql,{id:userId,sessionId}))) return {ok:false,status:403,isAdmin:true,error:'Zweitfaktor erforderlich'};
    const decision = decideTenantScope({ isAdmin: true, requestedClientId });
    if (!decision.allowed) return { ok: false, status: decision.status, isAdmin: true, error: decision.error };
    const rows = await sql.query(
      "SELECT id AS client_id, name FROM public.portal_clients WHERE id=$1 AND status='active' LIMIT 1",
      [decision.clientId]
    );
    return rows.length
      ? { ok: true, isAdmin: true, ...rows[0] }
      : { ok: false, status: 404, isAdmin: true, error: 'Mandant nicht gefunden' };
  }
  const membership = await getClientMembership(sql, userId);
  const decision = decideTenantScope({
    isAdmin: false,
    assignedClientId: membership?.client_id ? String(membership.client_id) : null,
    requestedClientId
  });
  if (!decision.allowed) return { ok: false, status: decision.status, isAdmin: false, error: decision.error };
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
