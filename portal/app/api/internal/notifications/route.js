import { dispatchPendingNotifications } from '../../../../lib/notifications';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(req) {
  const secret=process.env.CRON_SECRET;
  const auth=req.headers.get('authorization');
  if(!secret || auth!=='Bearer '+secret) return new Response('Unauthorized',{status:401});
  try {
    const result=await dispatchPendingNotifications(20);
    return Response.json(result,{headers:{'Cache-Control':'private,no-store'}});
  } catch {
    return Response.json({error:'Versandverarbeitung nicht verfügbar'},{status:503});
  }
}
