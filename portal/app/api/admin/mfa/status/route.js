import {db,requirePortalUser,isPortalAdmin,reject} from '../../../../../lib/portal';
import {getMfaRecord,isAdminMfaVerified} from '../../../../../lib/mfa';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{
 const user=await requirePortalUser();if(!user)return reject(401,'Nicht angemeldet');
 const sql=db();const admin=await isPortalAdmin(sql,user.id);
 if(!admin)return Response.json({isAdmin:false},{headers:{'Cache-Control':'private,no-store'}});
 const record=await getMfaRecord(sql,user.id);
 return Response.json({isAdmin:true,configured:Boolean(record?.enabled),verified:await isAdminMfaVerified(sql,user)},{headers:{'Cache-Control':'private,no-store'}});
 }catch{return reject(503,'MFA-Status nicht verfügbar')}
}
