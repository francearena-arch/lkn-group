import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { db, requirePortalUser, resolveClientAccess, reject, checkSameOrigin } from '../../../lib/portal';
import { storageClient, BUCKET } from '../../../lib/storage';
import { objectKeyBelongsToClient } from '../../../lib/tenant-access.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_SIZE = 3 * 1024 * 1024;
const TYPES = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg'
};

function validateFile(file, bytes) {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!TYPES[ext] || file.type !== TYPES[ext]) return null;
  if (bytes.length === 0 || bytes.length > MAX_SIZE) return null;
  if (ext === 'pdf' && !Buffer.from(bytes.subarray(0, 5)).equals(Buffer.from('%PDF-'))) return null;
  if (ext === 'png' && !Buffer.from(bytes.subarray(0, 8)).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return null;
  if ((ext === 'jpg' || ext === 'jpeg') && !(bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)) return null;
  return { ext, mime: TYPES[ext] };
}

export async function GET(request) {
  try {
    const user = await requirePortalUser();
    if (!user) return reject(401, 'Nicht angemeldet');
    const sql = db();
    const requested = new URL(request.url).searchParams.get('client_id');
    const access = await resolveClientAccess(sql, user.id, requested, user.sessionId);
    if (!access.ok) return reject(access.status, access.error);

    const documents = await sql.query(
      "SELECT id,title,category,mime_type,size_bytes,created_at,object_key,(object_key IS NOT NULL) AS downloadable FROM public.portal_documents WHERE client_id=$1 ORDER BY created_at DESC LIMIT 100",
      [access.client_id]
    );
    return Response.json({
      documents: documents.map(({ object_key, ...d }) => ({ ...d, downloadable: Boolean(d.downloadable && objectKeyBelongsToClient(object_key, String(access.client_id))) })),
      clientId: access.client_id,
      clientName: access.name,
      isAdmin: access.isAdmin,
      access: 'active'
    }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' }
    });
  } catch {
    return reject(503, 'Dokumente vorübergehend nicht verfügbar');
  }
}

export async function POST(request) {
  try {
    if (!checkSameOrigin(request)) return reject(403, 'Ungültiger Request-Ursprung');
    const user = await requirePortalUser();
    if (!user) return reject(401, 'Nicht angemeldet');
    const length = Number(request.headers.get('content-length') || 0);
    if (length > MAX_SIZE + 100000) return reject(413, 'Datei zu gross. Maximum: 3 MB.');

    const form = await request.formData();
    const requested = form.get('client_id');
    const sql = db();
    const access = await resolveClientAccess(sql, user.id, typeof requested === 'string' ? requested : null, user.sessionId);
    if (!access.ok) return reject(access.status, access.error);

    const file = form.get('file');
    if (!file || typeof file.arrayBuffer !== 'function' || typeof file.name !== 'string')
      return reject(400, 'Bitte eine Datei auswählen');
    if (file.size > MAX_SIZE || file.size === 0)
      return reject(413, 'Datei zu gross oder leer. Maximum: 3 MB.');

    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = validateFile(file, bytes);
    if (!type) return reject(415, 'Nur gültige PDF-, PNG- oder JPEG-Dateien sind erlaubt');

    const documentId = crypto.randomUUID();
    const objectKey = access.client_id + '/' + documentId + '.' + type.ext;
    const title = file.name.replace(/[\x00-\x1f\x7f\/\\]/g, '').trim().slice(0, 180);
    if (!title) return reject(400, 'Ungültiger Dateiname');
    const category = String(form.get('category') || 'Allgemein').slice(0, 40);

    const client = storageClient();
    await client.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: bytes,
      ContentType: type.mime,
      ContentLength: bytes.byteLength,
      ServerSideEncryption: 'AES256'
    }));
    try {
      await sql.query(
        "INSERT INTO public.portal_documents (id,client_id,title,object_key,mime_type,size_bytes,category,uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
        [documentId, access.client_id, title, objectKey, type.mime, bytes.byteLength, category, user.id]
      );
      await sql.query(
        "INSERT INTO public.portal_audit_log(actor_user_id,client_id,action,document_id) VALUES ($1,$2,'document.upload',$3)",
        [user.id, access.client_id, documentId]
      );
    } catch {
      // Roll back metadata if the audit insert failed after document creation.
      try {
        await sql.query("DELETE FROM public.portal_documents WHERE id=$1 AND uploaded_by=$2", [documentId, user.id]);
      } catch {}
      try { await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: objectKey })); } catch {}
      return reject(503, 'Upload konnte nicht gespeichert werden');
    }
    return Response.json({ ok: true, id: documentId }, {
      status: 201,
      headers: { 'Cache-Control': 'private, no-store, max-age=0' }
    });
  } catch {
    return reject(503, 'Upload derzeit nicht verfügbar');
  }
}
