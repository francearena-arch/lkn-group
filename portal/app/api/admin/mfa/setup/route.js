import QRCode from 'qrcode';
import {db,requirePortalUser,isPortalAdmin,reject} from '../../../../../lib/portal';
import {getMfaRecord,encryptSecret,authenticator} from '../../../../../lib/mfa';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{
 const user=await requirePortalUser();if(!user)return reject(401,'Nicht angemeldet');
 const sql=db();if(!(await isPortalAdmin(sql,user.id)))return reject(403,'Zugriff verweigert');
 const record=await getMfaRecord(sql,user.id);
 if(record?.enabled)return reject(403,'Zweitfaktor bereits eingerichtet');
 const secret=authenticator.generateSecret();
 await sql.query('INSERT INTO public.portal_admin_mfa(user_id,secret_ciphertext,enabled) VALUES($1,$2,false) ON CONFLICT(user_id) DO UPDATE SET secret_ciphertext=excluded.secret_ciphertext WHERE public.portal_admin_mfa.enabled=false',[user.id,encryptSecret(secret)]);
 const uri=authenticator.keyuri(user.email||user.id,'LKN Group Kundenportal',secret);
 return Response.json({qr:await QRCode.toDataURL(uri,{margin:2,width:220}),secret},{headers:{'Cache-Control':'private,no-store'}});
 }catch{return reject(503,'Zweitfaktor-Einrichtung nicht verfügbar')}
}
