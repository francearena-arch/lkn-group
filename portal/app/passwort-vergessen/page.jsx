'use client';
import {useState} from 'react';
import {createAuthClient} from '@neon/auth/next';
const authClient=createAuthClient();

export default function ForgotPassword(){
 const[email,setEmail]=useState('');
 const[busy,setBusy]=useState(false);
 const[done,setDone]=useState(false);
 const[error,setError]=useState('');
 async function submit(e){
  e.preventDefault(); setBusy(true); setError('');
  try {
    const {error:authError}=await authClient.requestPasswordReset({
      email:email.trim(),
      redirectTo:window.location.origin+'/passwort-zuruecksetzen'
    });
    if(authError) {
      // Do not disclose whether an email address has an account.
      setDone(true);
    } else setDone(true);
  }catch {
    setError('Der Versand konnte zurzeit nicht verarbeitet werden. Bitte versuchen Sie es später erneut.');
  }finally{setBusy(false);}
 }
 return <main className="recoveryPage"><section className="login recoveryCard">
  <a className="backLink" href="/">← Zur Anmeldung</a>
  <div className="eyebrow">LKN GROUP · KUNDENPORTAL</div>
  <h1>Passwort vergessen?</h1>
  {done?<><p>Falls für diese E-Mail-Adresse ein Kundenkonto existiert, erhalten Sie einen Link zum Zurücksetzen Ihres Passworts.</p><p className="recoveryNote">Bitte prüfen Sie auch Ihren Spam-Ordner. Der Link ist nur begrenzte Zeit gültig.</p><a className="primary recoveryButton" href="/">Zur Anmeldung</a></>:
   <><p>Geben Sie Ihre registrierte E-Mail-Adresse ein. Wir senden Ihnen einen Link, mit dem Sie ein neues Passwort festlegen können.</p>
   <form onSubmit={submit}>
    <label>E-Mail-Adresse<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@beispiel.ch"/></label>
    {error&&<p role="alert" className="error">{error}</p>}
    <button type="submit" className="primary" disabled={busy}>{busy?'Link wird angefordert …':'Link zum Zurücksetzen senden'}</button>
   </form></>}
  <p className="recoveryFootnote">Aus Sicherheitsgründen bestätigen wir nicht, ob ein Kundenkonto zu dieser E-Mail-Adresse existiert.</p>
 </section></main>;
}