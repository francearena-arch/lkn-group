import {cookies} from 'next/headers';
import crypto from 'node:crypto';
import {db,checkSameOrigin,reject} from '../../../../../lib/portal';
import {COOKIE_NAME} from '../../../../../lib/mfa';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(request){
 if(!checkSameOrigin(request))return reject(403,'Ungültiger Ursprung');
 try{
 const jar=await cookies();const token=jar.get(COOKIE_NAME)?.value;
 if(token)await db().query('DELETE FROM public.portal_admin_mfa_sessions WHERE token_hash=$1',[crypto.createHash('sha256').update(token).digest('hex')]);
 jar.delete(COOKIE_NAME);return Response.json({ok:true});
 }catch{return reject(503,'Abmeldung nicht verfügbar')}
}
