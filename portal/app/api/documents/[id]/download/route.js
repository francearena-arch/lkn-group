import {isPortalAdmin} from '../../../../../lib/portal';
import {isAdminMfaVerified} from '../../../../../lib/mfa';
import { objectKeyBelongsToClient } from '../../../../../lib/tenant-access.mjs';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { db, requirePortalUser, reject } from '../../../../../lib/portal';
import { storageClient, BUCKET } from '../../../../../lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const user = await requirePortalUser();
    if (!user) return reject(401, 'Nicht angemeldet');
    const { id } = await params;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return reject(404, 'Dokument nicht gefunden');
    const sql = db();
    if((await isPortalAdmin(sql,user.id)) && !(await isAdminMfaVerified(sql,user))) return reject(403,'Zweitfaktor erforderlich');
    const rows = await sql.query(
      "SELECT d.id,d.client_id,d.title,d.object_key,d.mime_type FROM public.portal_documents d INNER JOIN public.portal_clients c ON c.id=d.client_id WHERE d.id=$1 AND c.status='active' AND d.object_key IS NOT NULL AND (EXISTS (SELECT 1 FROM public.portal_admins a WHERE a.user_id=$2 AND a.enabled=true) OR EXISTS (SELECT 1 FROM public.portal_memberships m WHERE m.user_id=$2 AND m.client_id=d.client_id AND m.role='client')) LIMIT 1",
      [id,user.id]
    );
    if (!rows.length) return reject(404, 'Dokument nicht gefunden');
    const document = rows[0];
    if (!objectKeyBelongsToClient(document.object_key, String(document.client_id))) return reject(404, 'Dokument nicht gefunden');
    const result = await storageClient().send(new GetObjectCommand({ Bucket: BUCKET, Key: document.object_key }));
    if (!result.Body) return reject(503, 'Datei nicht abrufbar');
    const bytes = await result.Body.transformToByteArray();
    try {
      await sql.query(
        "INSERT INTO public.portal_audit_log(actor_user_id,client_id,action,document_id) VALUES ($1,$2,'document.download',$3)",
        [user.id,document.client_id,document.id]
      );
    } catch {
      return reject(503, 'Download-Protokollierung derzeit nicht verfügbar');
    }
    const safeName = String(document.title).replace(/[\x00-\x1f\x7f"\\\/]/g,'_').slice(0,180);
    const asciiName = safeName.replace(/[^\x20-\x7e]/g,'_');
    return new Response(bytes, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="' + asciiName + '"; filename*=UTF-8' + "''" + encodeURIComponent(safeName),
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': 'sandbox',
        'X-Robots-Tag': 'noindex, nofollow'
      }
    });
  } catch {
    return reject(503, 'Download derzeit nicht verfügbar');
  }
}
