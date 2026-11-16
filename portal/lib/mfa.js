import 'server-only';
import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { authenticator } from 'otplib';
import { db } from './portal';

export const COOKIE_NAME='lkn_admin_mfa';
export const MFA_TTL_SECONDS=8*60*60;
function key(){
  const k=process.env.ADMIN_TOTP_ENCRYPTION_KEY;
  if(!/^[a-f0-9]{64}$/i.test(k||'')) throw new Error('MFA encryption key missing');
  return Buffer.from(k,'hex');
}
export function encryptSecret(cleartext){
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv('aes-256-gcm',key(),iv);
  const data=Buffer.concat([cipher.update(cleartext,'utf8'),cipher.final()]);
  return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join('.');
}
export function decryptSecret(blob){
  const [iv,tag,data]=String(blob).split('.');
  const decipher=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(iv,'base64url'));
  decipher.setAuthTag(Buffer.from(tag,'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data,'base64url')),decipher.final()]).toString('utf8');
}
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
export async function getMfaRecord(sql,userId){
  const x=await sql.query('SELECT enabled,secret_ciphertext FROM public.portal_admin_mfa WHERE user_id=$1 LIMIT 1',[userId]);
  return x[0]||null;
}
export async function isAdminMfaVerified(sql,user){
  if(!user?.id||!user?.sessionId)return false;
  const jar=await cookies();
  const token=jar.get(COOKIE_NAME)?.value;
  if(!token || !/^[a-f0-9]{64}$/.test(token))return false;
  const found=await sql.query(
    'SELECT 1 FROM public.portal_admin_mfa_sessions s JOIN public.portal_admin_mfa a ON a.user_id=s.user_id WHERE s.token_hash=$1 AND s.user_id=$2 AND s.auth_session_id=$3 AND s.expires_at>now() AND a.enabled=true LIMIT 1',
    [hash(token),user.id,user.sessionId]
  );
  return found.length===1;
}
export async function makeMfaSession(sql,user){
  const token=crypto.randomBytes(32).toString('hex');
  await sql.query('INSERT INTO public.portal_admin_mfa_sessions(token_hash,user_id,auth_session_id,expires_at) VALUES($1,$2,$3,now()+interval \'8 hours\')',[hash(token),user.id,user.sessionId]);
  const jar=await cookies();
  jar.set(COOKIE_NAME,token,{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:MFA_TTL_SECONDS});
}
export function verifyTotp(secret,code){
  if(!/^[0-9]{6}$/.test(String(code)))return false;
  authenticator.options={window:1,step:30};
  return authenticator.check(String(code),secret);
}
export {authenticator};
