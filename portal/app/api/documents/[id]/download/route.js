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
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)) return reject(404, 'Dokument nicht gefunden');
    const sql = db();
    const rows = await sql.query(
      "SELECT d.id,d.client_id,d.title,d.object_key,d.mime_type FROM public.portal_documents d INNER JOIN public.portal_clients c ON c.id=d.client_id INNER JOIN public.portal_memberships m ON m.client_id=d.client_id WHERE d.id=$1 AND m.user_id=$2 AND c.status='active' AND d.object_key IS NOT NULL LIMIT 1",
      [id,user.id]
    );
    if (!rows.length) return reject(404, 'Dokument nicht gefunden');
    const document = rows[0];
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
        'Content-Disposition': 'attachment; filename="' + asciiName + '"; filename*=UTF-8\\'\\'' + encodeURIComponent(safeName),
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
