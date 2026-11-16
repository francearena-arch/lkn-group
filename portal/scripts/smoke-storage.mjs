import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { neon } from '@neondatabase/serverless';
import { randomUUID } from 'node:crypto';

const required = ['AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_ENDPOINT_URL_S3','AWS_REGION','DATABASE_URL'];
for (const x of required) if (!process.env[x]) throw new Error('SMOKE: Missing env variable '+x);
const s3=new S3Client({
  region:process.env.AWS_REGION,endpoint:process.env.AWS_ENDPOINT_URL_S3,forcePathStyle:true,
  credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY}
});
const sql=neon(process.env.DATABASE_URL);
const key='__smoketest__/'+randomUUID()+'.pdf';
const body=Buffer.from('%PDF-1.4\n% LKN test data - no customer content\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n');
let uploaded=false;
try {
  await s3.send(new PutObjectCommand({Bucket:'lkn-demo-documents',Key:key,Body:body,ContentType:'application/pdf'}));
  uploaded=true;
  const got=await s3.send(new GetObjectCommand({Bucket:'lkn-demo-documents',Key:key}));
  const bytes=Buffer.from(await got.Body.transformToByteArray());
  if(!body.equals(bytes))throw Error('SMOKE: storage byte mismatch');
  console.log('SMOKE STORAGE: UPLOAD DOWNLOAD BYTES PASS');

  const users=await sql.query("SELECT user_id,client_id FROM public.portal_memberships WHERE role='client' ORDER BY created_at LIMIT 20");
  const seen=new Map();
  for(const u of users){
    const docs=await sql.query("SELECT d.client_id,d.id FROM public.portal_documents d JOIN public.portal_memberships m ON m.client_id=d.client_id JOIN public.portal_clients c ON c.id=d.client_id WHERE m.user_id=$1 AND c.status='active'",[u.user_id]);
    for(const d of docs) if(d.client_id!==u.client_id)throw Error('SMOKE: cross-tenant leak');
    seen.set(u.client_id,docs.length);
  }
  if(seen.size<2)throw Error('SMOKE: require at least two distinct test clients');
  if(Array.from(seen.values()).some(x=>x===0))throw Error('SMOKE: test client has no docs');
  const absent=await sql.query("SELECT d.id FROM public.portal_documents d JOIN public.portal_memberships m ON m.client_id=d.client_id WHERE m.user_id=$1",['00000000-0000-4000-8000-000000000000']);
  if(absent.length)throw Error('SMOKE: unassigned identity sees docs');
  console.log('SMOKE TENANTS: SEPARATION PASS ('+seen.size+' distinct clients)');
} finally{
  if(uploaded){
    await s3.send(new DeleteObjectCommand({Bucket:'lkn-demo-documents',Key:key}));
    console.log('SMOKE STORAGE: EPHEMERAL TEST OBJECT REMOVED');
  }
}
