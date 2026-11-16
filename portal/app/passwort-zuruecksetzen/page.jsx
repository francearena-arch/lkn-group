'use client';
import {useEffect,useState} from 'react';
import {createAuthClient} from '@neon/auth/next';
const authClient=createAuthClient();

export default function ResetPassword(){
 const[token,setToken]=useState('');
 const[password,setPassword]=useState('');
 const[confirm,setConfirm]=useState('');
 const[busy,setBusy]=useState(false);
 const[done,setDone]=useState(false);
 const[error,setError]=useState('');
 useEffect(()=>{
  const params=new URLSearchParams(window.location.search);
  setToken(params.get('token')||'');
  if(params.get('error'))setError('Der Link ist ungültig oder abgelaufen. Bitte fordern Sie einen neuen an.');
 },[]);
 async function submit(e){
  e.preventDefault();
  if(password.length<12){setError('Bitte verwenden Sie mindestens 12 Zeichen.');return;}
  if(password!==confirm){setError('Die Passwörter stimmen nicht überein.');return;}
  if(!token){setError('Der Rücksetzlink enthält keinen gültigen Token.');return;}
  setBusy(true);setError('');
  try{
   const {error:authError}=await authClient.resetPassword({newPassword:password,token});
   if(authError) setError('Das Passwort konnte nicht geändert werden. Der Link ist möglicherweise abgelaufen.');
   else {setDone(true);window.history.replaceState({},'',window.location.pathname);}
  }catch{setError('Die Passwortänderung konnte nicht abgeschlossen werden.');}
  finally{setBusy(false);}
 }
 return <main className="recoveryPage"><section className="login recoveryCard">
  <a className="backLink" href="/">← Zur Anmeldung</a><div className="eyebrow">LKN GROUP · KUNDENPORTAL</div>
  <h1>{done?'Passwort geändert.':'Neues Passwort festlegen.'}</h1>
  {done?<><p>Ihr Passwort wurde aktualisiert. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.</p><a className="primary recoveryButton" href="/">Zur Anmeldung</a></>:
  <><p>Wählen Sie ein neues Passwort mit mindestens 12 Zeichen.</p>
  <form onSubmit={submit}>
   <label>Neues Passwort<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
   <label>Neues Passwort bestätigen<input type="password" autoComplete="new-password" minLength={12} required value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
   {error&&<p role="alert" className="error">{error}</p>}
   <button type="submit" className="primary" disabled={busy||!token}>{busy?'Passwort wird geändert …':'Passwort speichern'}</button>
  </form>
  {!token&&<a className="linkbtn" href="/passwort-vergessen">Neuen Link anfordern</a>}</>}
 </section></main>;
}