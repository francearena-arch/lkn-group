import {isAdminMfaVerified} from '../../../lib/mfa';
import { db, requirePortalUser, isPortalAdmin, reject } from '../../../lib/portal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await requirePortalUser();
    if (!user) return reject(401, 'Nicht angemeldet');
    const sql = db();
    if (!(await isPortalAdmin(sql, user.id))) return reject(403, 'Keine Administratorberechtigung');
    if (!(await isAdminMfaVerified(sql,user))) return reject(403,'Zweitfaktor erforderlich');
    const clients = await sql.query(
      "SELECT id, name FROM public.portal_clients WHERE status='active' ORDER BY name ASC LIMIT 200"
    );
    return Response.json({ clients, isAdmin: true }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' }
    });
  } catch {
    return reject(503, 'Mandantenübersicht nicht verfügbar');
  }
}
