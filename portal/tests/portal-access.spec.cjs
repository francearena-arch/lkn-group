const {test,expect} = require('@playwright/test');

const base = process.env.PORTAL_URL || 'https://lkn-client-portal-demo.vercel.app';
const required = ['E2E_CLIENT_A_EMAIL','E2E_CLIENT_A_PASSWORD','E2E_CLIENT_B_EMAIL','E2E_CLIENT_B_PASSWORD','E2E_ADMIN_EMAIL','E2E_ADMIN_PASSWORD','E2E_ADMIN_TOTP_SECRET'];
test.beforeAll(() => {
  for (const key of required) if (!process.env[key]) throw new Error('Missing test credential: ' + key);
});
async function signIn(page,email,password) {
  await page.goto(base);
  await page.getByLabel('E-Mail-Adresse').fill(email);
  await page.getByLabel('Passwort', {exact:true}).fill(password);
  await page.getByRole('button',{name:'Sicher anmelden'}).click();
}
test('customer A: own docs visible, admin selector not visible, other client blocked',async({page,request})=>{
  await signIn(page,process.env.E2E_CLIENT_A_EMAIL,process.env.E2E_CLIENT_A_PASSWORD);
  await expect(page.getByText('Mandant auswählen',{exact:true})).toHaveCount(0);
  const my=await request.get(base+'/api/documents',{headers:{Cookie:(await page.context().cookies()).map(c=>c.name+'='+c.value).join('; ')}});
  expect(my.status()).toBe(200);
  const own=await my.json();
  expect(own.isAdmin).toBe(false);
  const blocked=await request.get(base+'/api/documents?client_id='+encodeURIComponent(process.env.E2E_CLIENT_B_ID),{headers:{Cookie:(await page.context().cookies()).map(c=>c.name+'='+c.value).join('; ')}});
  expect(blocked.status()).toBe(403);
});
test('customer B: cannot access customer A documents via direct URL',async({page,request})=>{
  await signIn(page,process.env.E2E_CLIENT_B_EMAIL,process.env.E2E_CLIENT_B_PASSWORD);
  const cookies=(await page.context().cookies()).map(c=>c.name+'='+c.value).join('; ');
  const blocked=await request.get(base+'/api/documents?client_id='+encodeURIComponent(process.env.E2E_CLIENT_A_ID),{headers:{Cookie:cookies}});
  expect(blocked.status()).toBe(403);
  const file=await request.get(base+'/api/documents/'+process.env.E2E_CLIENT_A_DOCUMENT_ID+'/download',{headers:{Cookie:cookies}});
  expect(file.status()).toBe(404);
});
test('admin: mandatory MFA and both client dropdown scopes',async({page})=>{
  await signIn(page,process.env.E2E_ADMIN_EMAIL,process.env.E2E_ADMIN_PASSWORD);
  await expect(page.getByText(/ZWEI-FAKTOR-ANMELDUNG/)).toBeVisible();
  // Generate TOTP only in the trusted test runner; never commit the secret.
  const {authenticator}=require('otplib');
  const code=authenticator.generate(process.env.E2E_ADMIN_TOTP_SECRET);
  await page.locator('input[inputmode="numeric"]').first().fill(code);
  await page.getByRole('button',{name:/bestätigen|anmelden|freischalten/i}).click();
  await expect(page.getByText('Mandantenverwaltung.')).toBeVisible();
  await page.locator('#clientChoice').selectOption(process.env.E2E_CLIENT_A_ID);
  await expect(page.getByText(process.env.E2E_CLIENT_A_NAME)).toBeVisible();
  await page.locator('#clientChoice').selectOption(process.env.E2E_CLIENT_B_ID);
  await expect(page.getByText(process.env.E2E_CLIENT_B_NAME)).toBeVisible();
});
test('anonymous cannot read data or download a document',async({request})=>{
  const a=await request.get(base+'/api/documents');expect(a.status()).toBe(401);
  const b=await request.get(base+'/api/clients');expect(b.status()).toBe(401);
  const c=await request.get(base+'/api/documents/'+process.env.E2E_CLIENT_A_DOCUMENT_ID+'/download');
  expect(c.status()).toBe(401);
});