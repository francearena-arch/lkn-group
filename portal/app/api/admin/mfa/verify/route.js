import {db,requirePortalUser,isPortalAdmin,reject,checkSameOrigin} from '../../../../../lib/portal';
import {getMfaRecord,decryptSecret,verifyTotp,makeMfaSession} from '../../../../../lib/mfa';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request){
 try{
 if(!checkSameOrigin(request))return reject(403,'Ungültiger Ursprung');
 const user=await requirePortalUser();if(!user)return reject(401,'Nicht angemeldet');
 const sql=db();if(!(await isPortalAdmin(sql,user.id)))return reject(403,'Zugriff verweigert');
 const recent=await sql.query("SELECT count(*)::int AS n FROM public.portal_admin_mfa_attempts WHERE user_id=$1 AND success=false AND created_at>now()-interval '10 minutes'",[user.id]);
 if(recent[0]?.n>=5)return reject(429,'Zu viele Versuche. Bitte später erneut versuchen');
 const {code}=await request.json();
 const rec=await getMfaRecord(sql,user.id);if(!rec)return reject(400,'Zweitfaktor nicht eingerichtet');
 const valid=verifyTotp(decryptSecret(rec.secret_ciphertext),code);
 await sql.query('INSERT INTO public.portal_admin_mfa_attempts(user_id,success) VALUES($1,$2)',[user.id,valid]);
 if(!valid)return reject(401,'Ungültiger oder abgelaufener Code');
 if(!rec.enabled)await sql.query('UPDATE public.portal_admin_mfa SET enabled=true,activated_at=now() WHERE user_id=$1 AND enabled=false',[user.id]);
 await makeMfaSession(sql,user);
 return Response.json({ok:true},{headers:{'Cache-Control':'private,no-store'}});
 }catch{return reject(503,'Zweitfaktor-Prüfung nicht verfügbar')}
}
