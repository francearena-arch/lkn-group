import 'server-only';
import { db } from './portal';

const portalUrl = 'https://lkn-client-portal-demo.vercel.app/';
const safe = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function emailHtml() {
  return '<!doctype html><html lang="de"><body style="margin:0;padding:36px 16px;background:#f3f7fc;font-family:Arial,sans-serif;color:#142e54">' +
    '<table role="presentation" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;margin:auto;background:#fff;border:1px solid #dce6f1;border-radius:16px">' +
    '<tr><td style="padding:30px;border-top:5px solid #0b63b6"><strong style="font:700 28px Georgia,serif;color:#123b70">LKN GROUP</strong>' +
    '<p style="font-size:11px;letter-spacing:2px;color:#0b63b6;font-weight:700">KUNDENPORTAL</p>' +
    '<h1 style="font:700 30px Georgia,serif;color:#123b70">Neue Dokumente für Sie</h1>' +
    '<p style="font-size:16px;line-height:1.6">Guten Tag</p>' +
    '<p style="font-size:16px;line-height:1.6">In Ihrem persönlichen LKN-Kundenportal wurden neue Dokumente bereitgestellt. Melden Sie sich an, um Ihre Unterlagen sicher einzusehen.</p>' +
    '<p style="margin:28px 0"><a href="'+safe(portalUrl)+'" style="display:inline-block;padding:14px 22px;border-radius:8px;background:#083677;color:white;text-decoration:none;font-weight:700">Zum Kundenportal</a></p>' +
    '<p style="font-size:13px;line-height:1.6;color:#627187">Aus Datenschutzgründen werden dieser Benachrichtigung keine Dokumente beigefügt. Falls Sie keine Nachricht erwartet haben, kontaktieren Sie die LKN Group direkt.</p>' +
    '<p style="margin-top:26px;font-size:14px">Freundliche Grüsse<br><strong>LKN Group</strong></p>' +
    '</td></tr></table></body></html>';
}

export async function enqueueAdminDocumentNotifications(sql, { documentId, clientId, isAdmin }) {
  if (!isAdmin) return { enabled: false, queued: 0, reason: 'customer-upload' };
  // Only a verified and registered recipient in this very client's membership.
  const recipients = await sql.query(
    'SELECT DISTINCT u.id::text AS user_id, u.email FROM public.portal_memberships m JOIN neon_auth."user" u ON u.id::text=m.user_id WHERE m.client_id=$1 AND m.role=$2 AND u."emailVerified"=true AND u.email IS NOT NULL AND u.email<>$3',
    [clientId,'client','']
  );
  for (const recipient of recipients) {
    await sql.query(
      "INSERT INTO public.portal_notifications(document_id,client_id,recipient_user_id,recipient_email,event_type,status) VALUES($1,$2,$3,$4,'admin_document_uploaded','pending') ON CONFLICT (document_id,recipient_user_id,event_type) DO NOTHING",
      [documentId,clientId,recipient.user_id,recipient.email]
    );
  }
  return { enabled: true, queued: recipients.length, reason: recipients.length ? 'pending-delivery' : 'no-verified-client-email' };
}

export async function dispatchDocumentNotifications(sql, documentId) {
  if (!process.env.RESEND_API_KEY || !process.env.LKN_VERIFIED_SENDER) {
    return { configured: false, sent: 0, pending: true };
  }
  const pending = await sql.query(
    "SELECT id,recipient_email FROM public.portal_notifications WHERE document_id=$1 AND (status IN ('pending','failed') OR (status='sending' AND processing_at<now()-interval '15 minutes')) AND attempts<5 ORDER BY created_at LIMIT 20",
    [documentId]
  );
  let sent = 0;
  for (const note of pending) {
    const locked = await sql.query(
      "UPDATE public.portal_notifications SET status='sending',processing_at=now(),attempts=attempts+1 WHERE id=$1 AND (status IN ('pending','failed') OR (status='sending' AND processing_at<now()-interval '15 minutes')) AND attempts<5 RETURNING id",
      [note.id]
    );
    if (!locked.length) continue;
    try {
      const response = await fetch('https://api.resend.com/emails',{
        method:'POST',
        headers:{'Authorization':'Bearer '+process.env.RESEND_API_KEY,'Content-Type':'application/json','Idempotency-Key':note.id},
        body:JSON.stringify({
          from:process.env.LKN_VERIFIED_SENDER,
          to:[note.recipient_email],
          subject:'Neue Dokumente in Ihrem LKN-Kundenportal',
          html:emailHtml()
        }),
        signal:AbortSignal.timeout(8000)
      });
      const result = await response.json().catch(()=>({}));
      if (!response.ok || !result.id) throw new Error('E-Mail-Provider hat die Anfrage nicht bestätigt');
      await sql.query("UPDATE public.portal_notifications SET status='sent',provider_message_id=$2,sent_at=now(),last_error=NULL WHERE id=$1",[note.id,String(result.id)]);
      sent += 1;
    } catch {
      await sql.query("UPDATE public.portal_notifications SET status='failed',last_error='Versand nicht bestätigt' WHERE id=$1",[note.id]);
    }
  }
  return { configured:true,sent,pending:pending.length>sent };
}

export async function dispatchPendingNotifications(limit=20) {
  if (!process.env.RESEND_API_KEY || !process.env.LKN_VERIFIED_SENDER) return {configured:false,sent:0};
  const sql=db();
  const documents = await sql.query(
    "SELECT DISTINCT document_id FROM public.portal_notifications WHERE status IN ('pending','failed') AND attempts<5 ORDER BY document_id LIMIT $1",
    [limit]
  );
  let sent=0;
  for (const document of documents) sent += (await dispatchDocumentNotifications(sql,document.document_id)).sent;
  return {configured:true,sent};
}
