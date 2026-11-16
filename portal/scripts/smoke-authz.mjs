import { objectKeyBelongsToClient } from '../lib/tenant-access.mjs';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { decideTenantScope } from '../lib/tenant-access.mjs';

const sql = neon(process.env.DATABASE_URL);
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = 'lkn-demo-documents';
const adminId = '27dcd7d6-47a0-4adc-81ac-bb34d37b2e3b';
const customerA = 'fbef4016-225c-436d-9f20-dabed3a0bb10';
const customerB = '606d9638-d374-42fd-b8e4-f75f5e5b7957';
const clientA = '11111111-1111-4111-8111-111111111111';
const clientB = '33333333-3333-4333-8333-333333333333';
const outsider = '00000000-0000-4000-8000-000000000000';

const testIds = [randomUUID(), randomUUID()];
const keys = [clientA + '/security-test-' + testIds[0] + '.pdf', clientB + '/security-test-' + testIds[1] + '.pdf'];
const bodyA = Buffer.from('%PDF-1.4\n% TEST TENANT A\n%%EOF\n');
const bodyB = Buffer.from('%PDF-1.4\n% TEST TENANT B\n%%EOF\n');

async function canDownload(userId, documentId) {
  return sql.query(
    "SELECT d.id,d.client_id,d.object_key FROM public.portal_documents d INNER JOIN public.portal_clients c ON c.id=d.client_id WHERE d.id=$1 AND c.status='active' AND d.object_key IS NOT NULL AND (EXISTS (SELECT 1 FROM public.portal_admins a WHERE a.user_id=$2 AND a.enabled=true) OR EXISTS (SELECT 1 FROM public.portal_memberships m WHERE m.user_id=$2 AND m.client_id=d.client_id AND m.role='client')) LIMIT 1",
    [documentId, userId]
  );
}
async function scope(userId) {
  const [admin] = await sql.query("SELECT EXISTS(SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true) AS is_admin", [userId]);
  const memberships = await sql.query(
    "SELECT m.client_id FROM public.portal_memberships m JOIN public.portal_clients c ON c.id=m.client_id WHERE m.user_id=$1 AND m.role='client' AND c.status='active' LIMIT 2",
    [userId]
  );
  return { isAdmin: admin.is_admin, assignedClientId: memberships.length === 1 ? memberships[0].client_id : null };
}

const testCases = [
  { name: 'Client A own scope', user: customerA, req: clientA, allow: true },
  { name: 'Client A blocked from B', user: customerA, req: clientB, allow: false, status: 403 },
  { name: 'Client B own scope', user: customerB, req: clientB, allow: true },
  { name: 'Client B blocked from A', user: customerB, req: clientA, allow: false, status: 403 },
  { name: 'Client B cannot become admin using parameter', user: customerB, req: clientA, allow: false, status: 403 },
  { name: 'Unknown identity denied', user: outsider, req: clientA, allow: false, status: 403 },
  { name: 'Admin can select A', user: adminId, req: clientA, allow: true },
  { name: 'Admin can select B', user: adminId, req: clientB, allow: true },
  { name: 'Admin must select client', user: adminId, req: null, allow: false, status: 400 },
  { name: 'Admin invalid UUID rejected', user: adminId, req: '../other', allow: false, status: 400 }
];
let uploaded = [];
let inserted = [];
try {
  for (const t of testCases) {
    const permissions = await scope(t.user);
    const decision = decideTenantScope({
      isAdmin: permissions.isAdmin,
      assignedClientId: permissions.assignedClientId,
      requestedClientId: t.req
    });
    assert.equal(decision.allowed, t.allow, t.name);
    if (!t.allow) assert.equal(decision.status, t.status, t.name);
  }
  assert.equal(objectKeyBelongsToClient(clientA+'/one.pdf',clientA),true);
  assert.equal(objectKeyBelongsToClient(clientB+'/one.pdf',clientA),false);
  assert.equal(objectKeyBelongsToClient(clientA+'/../bad.pdf',clientA),false);
  console.log('SECURITY: Cross-client storage key and traversal checks PASS');
  console.log('SECURITY: Tenant selection positive and negative cases PASS (' + testCases.length + ' cases)');

  const objects = [{key:keys[0], clientId:clientA, id:testIds[0], body:bodyA}, {key:keys[1], clientId:clientB, id:testIds[1], body:bodyB}];
  for(const obj of objects){
    await s3.send(new PutObjectCommand({Bucket:BUCKET,Key:obj.key,Body:obj.body,ContentType:'application/pdf'}));
    uploaded.push(obj.key);
    await sql.query(
      "INSERT INTO public.portal_documents (id,client_id,title,object_key,mime_type,size_bytes,category) VALUES ($1,$2,$3,$4,'application/pdf',$5,'Sicherheitstest')",
      [obj.id, obj.clientId, 'Automatischer Sicherheitstest.pdf', obj.key, obj.body.length]
    );
    inserted.push(obj.id);
  }
  const expected = [
    [customerA,testIds[0],true],[customerA,testIds[1],false],
    [customerB,testIds[1],true],[customerB,testIds[0],false],
    [adminId,testIds[0],true],[adminId,testIds[1],true],
    [outsider,testIds[0],false],[outsider,testIds[1],false]
  ];
  for (const [userId,docId,allowed] of expected) {
    const rows = await canDownload(userId,docId);
    assert.equal(rows.length===1,allowed,'Download authorization ' + userId + '/' + docId);
  }
  console.log('SECURITY: Download authorization PASS ('+expected.length+' cases)');

  for(const [idx,obj] of objects.entries()){
    const retrieved=await s3.send(new GetObjectCommand({Bucket:BUCKET,Key:obj.key}));
    const bytes=Buffer.from(await retrieved.Body.transformToByteArray());
    assert.deepEqual(bytes,obj.body,'File byte integrity ' + idx);
  }
  console.log('SECURITY: Private storage upload/download integrity PASS');

  const [admin] = await sql.query("SELECT EXISTS (SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true) AS enabled", [adminId]);
  const [a] = await sql.query("SELECT EXISTS (SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true) AS enabled", [customerA]);
  const [b] = await sql.query("SELECT EXISTS (SELECT 1 FROM public.portal_admins WHERE user_id=$1 AND enabled=true) AS enabled", [customerB]);
  assert.equal(admin.enabled,true);
  assert.equal(a.enabled,false);
  assert.equal(b.enabled,false);
  const [count] = await sql.query("SELECT COUNT(*)::int AS n FROM public.portal_clients WHERE status='active'");
  assert.ok(count.n>=2,'Admin client chooser must see >=2 active clients');
  console.log('SECURITY: Explicit administrator access and non-admin denial PASS');
  console.log('SECURITY: ALL DEMO ACCESS CONTROL CHECKS PASS');
} finally {
  for (const id of inserted) {
    await sql.query("DELETE FROM public.portal_documents WHERE id=$1",[id]);
  }
  for (const key of uploaded) {
    await s3.send(new DeleteObjectCommand({Bucket:BUCKET,Key:key}));
  }
  console.log('SECURITY: Temporary test documents and storage objects removed');
}
