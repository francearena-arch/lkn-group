import crypto from 'node:crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sender = () => process.env.LKN_VERIFIED_SENDER || '';

function transportReady() {
  return Boolean(sender() && (
    (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) ||
    process.env.RESEND_API_KEY
  ));
}

async function verifyNeonWebhook(raw, headers) {
  if (raw.length > 32768) throw new Error('Payload too large');
  const signature = headers.get('x-neon-signature');
  const kid = headers.get('x-neon-signature-kid');
  const timestamp = headers.get('x-neon-timestamp');
  if (!signature || !kid || !timestamp) throw new Error('Missing signature');
  const at = Number(timestamp);
  if (!Number.isFinite(at) || Math.abs(Date.now() - at) > 5 * 60 * 1000) throw new Error('Timestamp outside window');
  const [headerB64, empty, sigB64, extra] = signature.split('.');
  if (!headerB64 || empty !== '' || !sigB64 || extra !== undefined) throw new Error('Bad signature format');
  const protectedHeader = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
  if (protectedHeader.alg !== 'EdDSA') throw new Error('Unsupported signature algorithm');
  const res = await fetch(process.env.NEON_AUTH_BASE_URL + '/.well-known/jwks.json', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error('Unable to retrieve JWKS');
  const jwks = await res.json();
  const jwk = jwks.keys.find(k => k.kid === kid);
  if (!jwk) throw new Error('Signing key not found');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const bodyB64 = Buffer.from(raw, 'utf8').toString('base64url');
  const payloadB64 = Buffer.from(timestamp + '.' + bodyB64, 'utf8').toString('base64url');
  if (!crypto.verify(null, Buffer.from(headerB64 + '.' + payloadB64), publicKey, Buffer.from(sigB64, 'base64url'))) {
    throw new Error('Invalid signature');
  }
  return JSON.parse(raw);
}

function renderEmail({ title, explanatory, actionUrl, actionLabel, code }) {
  const logoUrl = process.env.LKN_EMAIL_LOGO_URL || 'https://francearena-arch.github.io/lkn-group/lkn-logo-v2.png';
  return '<!doctype html><html lang="de"><body style="margin:0;padding:32px 12px;background:#f3f7fc;font-family:Arial,sans-serif;color:#233654">' +
    '<table role="presentation" style="max-width:580px;width:100%;margin:auto;border:1px solid #d9e4f1;border-radius:14px;background:white"><tr><td style="padding:32px;border-top:5px solid #0b63b6">' +
    '<img width="90" style="display:block;max-width:90px;height:auto" alt="LKN Group" src="' + escapeHtml(logoUrl) + '">' +
    '<p style="font-size:11px;color:#0b63b6;letter-spacing:2px;font-weight:bold">KUNDENPORTAL</p>' +
    '<h1 style="font-family:Georgia,serif;font-size:29px;color:#083677">' + escapeHtml(title) + '</h1>' +
    '<p style="font-size:16px;line-height:1.65">' + escapeHtml(explanatory) + '</p>' +
    (code ? '<p style="font-size:29px;font-weight:700;letter-spacing:6px;color:#083677">' + escapeHtml(code) + '</p>' : '') +
    (actionUrl ? '<p style="margin:30px 0"><a href="' + escapeHtml(actionUrl) + '" style="display:inline-block;background:#083677;color:white;border-radius:8px;text-decoration:none;font-size:15px;font-weight:bold;padding:15px 22px">' + escapeHtml(actionLabel) + '</a></p>' : '') +
    '<p style="font-size:13px;line-height:1.6;color:#68788d">Falls Sie diese Anfrage nicht gestellt haben, können Sie diese Nachricht ignorieren. Teilen Sie Passwörter, Codes und Links niemals mit Dritten.</p>' +
    '<p style="margin-top:28px;font-size:14px">Freundliche Grüsse<br><b>LKN Group</b></p></td></tr></table></body></html>';
}

async function sendEmail(to, subject, html, idempotencyKey) {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    const nodemailer = (await import('nodemailer')).default;
    const port = Number(process.env.SMTP_PORT || 587);
    if (port !== 465 && port !== 587) throw new Error('Unsupported SMTP port');
    const smtp = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      tls: { rejectUnauthorized: true },
      connectionTimeout: 8000,
      socketTimeout: 10000
    });
    try {
      const result = await smtp.sendMail({ from: sender(), to, subject, html });
      if (!result.accepted?.length) throw new Error('Recipient not accepted by SMTP');
      return result.messageId;
    } finally { smtp.close(); }
  }
  if (!process.env.RESEND_API_KEY) throw new Error('Email provider not configured');
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ from: sender(), to: [to], subject, html }),
    signal: AbortSignal.timeout(8000)
  });
  if (!r.ok) throw new Error('Mail API failed');
}

export async function POST(request) {
  if (!transportReady()) return new Response('Email delivery not configured', { status: 503 });
  try {
    const event = await verifyNeonWebhook(await request.text(), request.headers);
    if (!['send.magic_link', 'send.otp'].includes(event.event_type)) return Response.json({ ignored: true });
    const to = String(event.user?.email || '');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return new Response('Invalid recipient', { status: 400 });
    const data = event.event_data || {};
    let title, subject, explanation, url, label, code;
    if (event.event_type === 'send.otp') {
      if (!/^\d{6}$/.test(String(data.otp_code || ''))) return new Response('Invalid code', { status: 400 });
      code = data.otp_code;
      title = 'Ihr einmaliger Sicherheitscode';
      subject = 'Ihr Sicherheitscode für LKN Group';
      explanation = 'Geben Sie diesen einmaligen Code im LKN-Kundenportal ein. Er ist nur für kurze Zeit gültig.';
    } else {
      url = String(data.link_url || '');
      if (!url.startsWith('https://')) return new Response('Invalid link', { status: 400 });
      const reset = data.link_type === 'forget-password';
      title = reset ? 'Passwort zurücksetzen' : 'Ihre Anmeldung bestätigen';
      subject = reset ? 'LKN Group – Passwort zurücksetzen' : 'LKN Group – Anmeldebestätigung';
      explanation = reset ? 'Sie haben angefordert, Ihr Passwort neu festzulegen. Öffnen Sie dafür den folgenden Link.' : 'Bestätigen Sie Ihre Anmeldung über den folgenden sicheren Link.';
      label = reset ? 'Neues Passwort festlegen' : 'Anmeldung bestätigen';
    }
    const html = renderEmail({ title, explanatory: explanation, actionUrl: url, actionLabel: label, code });
    await sendEmail(to, subject, html, String(event.event_id || 'lkn-auth-email'));
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return new Response('Invalid webhook signature or delivery failed', { status: 400 });
  }
}
