import {neon} from '@neondatabase/serverless';
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';

function pdf(text){
  const escaped=text.replace(/[()\\]/g,'\\$&');
  const stream='BT /F1 17 Tf 60 770 Td ('+escaped+') Tj ET';
  const obj=[
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>',
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
    '<</Length '+Buffer.byteLength(stream)+'>>\\nstream\\n'+stream+'\\nendstream'
  ];
  let out='%PDF-1.4\\n';const positions=[0];
  obj.forEach((content,i)=>{positions.push(Buffer.byteLength(out));out+=(i+1)+' 0 obj\\n'+content+'\\nendobj\\n'});
  const p=Buffer.byteLength(out);out+='xref\\n0 6\\n0000000000 65535 f \\n';
  for(const pos of positions.slice(1))out+=String(pos).padStart(10,'0')+' 00000 n \\n';
  out+='trailer <</Size 6/Root 1 0 R>>\\nstartxref\\n'+p+'\\n%%EOF\\n';
  return Buffer.from(out.replaceAll('\\n','\n'));
}
const client=new S3Client({region:process.env.AWS_REGION,endpoint:process.env.AWS_ENDPOINT_URL_S3,forcePathStyle:true,credentials:{accessKeyId:process.env.AWS_ACCESS_KEY_ID,secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY}});
const sql=neon(process.env.DATABASE_URL);
const entries=[
 {clientId:'11111111-1111-4111-8111-111111111111',id:'a1a1a1a1-1111-4111-8111-111111111111',title:'LKN Muster AG - Testdokument.pdf'},
 {clientId:'33333333-3333-4333-8333-333333333333',id:'b2b2b2b2-2222-4222-8222-222222222222',title:'LKN Demo Beispiel B - Testdokument.pdf'}
];
for(const doc of entries){
 const key=doc.clientId+'/'+doc.id+'.pdf';
 const buf=pdf('LKN GROUP - TESTDOKUMENT - KEINE ECHTEN MANDANTENDATEN');
 await client.send(new PutObjectCommand({Bucket:'lkn-demo-documents',Key:key,Body:buf,ContentType:'application/pdf'}));
 await sql.query('INSERT INTO public.portal_documents(id,client_id,title,object_key,mime_type,size_bytes,category,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,object_key=EXCLUDED.object_key,mime_type=EXCLUDED.mime_type,size_bytes=EXCLUDED.size_bytes',[doc.id,doc.clientId,doc.title,key,'application/pdf',buf.length,'Allgemein','lkn-pilot-seed']);
 console.log('Pilot document seeded for '+doc.clientId.slice(0,8));
}
