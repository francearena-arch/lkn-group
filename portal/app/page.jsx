'use client';
import { useEffect, useRef, useState } from 'react';
import { createAuthClient } from '@neon/auth/next';

const authClient = createAuthClient();
export default function Page() {
  const [mode, setMode] = useState('login');
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('Muster Treuhand AG');
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Allgemein');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [mfaConfigured,setMfaConfigured]=useState(false);
  const [mfaQr,setMfaQr]=useState('');
  const [mfaSecret,setMfaSecret]=useState('');
  const [mfaCode,setMfaCode]=useState('');
  const [mfaBusy,setMfaBusy]=useState(false);
  const requestSequence = useRef(0);

  async function prepareMfa(){
    setMfaBusy(true);setError('');
    try{
      const res=await fetch('/api/admin/mfa/setup',{method:'POST',cache:'no-store'});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'MFA-Einrichtung nicht verfügbar');
      setMfaQr(data.qr);setMfaSecret(data.secret);
    }catch(e){setError(e.message)}
    finally{setMfaBusy(false)}
  }
  async function confirmMfa(event){
    event.preventDefault();setMfaBusy(true);setError('');
    try{
      const res=await fetch('/api/admin/mfa/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:mfaCode})});
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Zweitfaktor konnte nicht geprüft werden');
      setMfaCode('');setMfaSecret('');setMfaQr('');await initializePortal();
    }catch(e){setError(e.message)}
    finally{setMfaBusy(false)}
  }
  useEffect(()=>{if(mode==='mfa'&&!mfaConfigured&&!mfaQr)prepareMfa();},[mode,mfaConfigured,mfaQr]);

  async function refreshDocuments(clientId = '') {
    const seq = ++requestSequence.current;
    setRows([]);
    setError('');
    setLoading(true);
    try {
      const url = clientId ? '/api/documents?client_id=' + encodeURIComponent(clientId) : '/api/documents';
      const response = await fetch(url, { cache: 'no-store', credentials: 'same-origin' });
      const data = await response.json();
      if (seq !== requestSequence.current) return;
      if (response.status === 401) {
        setUser(null);
        setMode('login');
        setError('Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.');
        return;
      }
      if (!response.ok) {
        setPending(true);
        setError(data.error || 'Dokumente sind vorübergehend nicht erreichbar.');
        return;
      }
      setPending(false);
      setRows((data.documents || []).map(document => ({
        ...document,
        date: new Date(document.created_at).toLocaleDateString('de-CH')
      })));
      setClientName(data.clientName || 'Mandant');
    } catch {
      if (seq === requestSequence.current) {
        setPending(true);
        setError('Die Verbindung zur Dokumentenverwaltung ist derzeit nicht verfügbar.');
      }
    } finally {
      if (seq === requestSequence.current) setLoading(false);
    }
  }

  async function initializePortal() {
    setMode('portal');
    setError('');
    setPending(false);
    setRows([]);
    try {
      const statusResponse=await fetch('/api/admin/mfa/status',{cache:'no-store'});
      const status=await statusResponse.json();
      if(!statusResponse.ok)throw new Error('Zugriffsprüfung nicht verfügbar');
      if(status.isAdmin && !status.verified){
        setIsAdmin(true);setMfaConfigured(Boolean(status.configured));
        setMode('mfa');setLoading(false);setRows([]);
        return;
      }
      setMfaConfigured(Boolean(status.configured));
      const response = await fetch('/api/clients', { cache: 'no-store', credentials: 'same-origin' });
      if (response.ok) {
        const data = await response.json();
        if (data.isAdmin) {
          ++requestSequence.current;
          setIsAdmin(true);
          setClients(data.clients || []);
          setSelectedClientId('');
          setClientName('Bitte Mandanten auswählen');
          setLoading(false);
          return;
        }
      }
      if (response.status === 401) {
        setMode('login');
        setUser(null);
        return;
      }
      if (response.status !== 403) {
        setError('Die Benutzerrechte konnten nicht überprüft werden.');
        setPending(true);
        return;
      }
      setIsAdmin(false);
      setClients([]);
      setClientSearch('');
      setSelectedClientId('');
      await refreshDocuments();
    } catch {
      setError('Die Benutzerrechte konnten nicht überprüft werden.');
      setPending(true);
    }
  }

  useEffect(() => {
    authClient.getSession().then(result => {
      if (result.data?.user) {
        setUser(result.data.user);
        initializePortal();
      }
    }).catch(() => {});
  }, []);

  async function signIn(event) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      const result = await authClient.signIn.email({ email: login, password });
      if (result.error) setError('Anmeldung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.');
      else {
        setUser(result.data?.user || { email: login });
        await initializePortal();
      }
    } catch { setError('Anmeldung derzeit nicht verfügbar.'); }
    finally { setBusy(false); }
  }

  async function sendOtp() {
    if (!login) { setError('Bitte zuerst Ihre E-Mail-Adresse eingeben.'); return; }
    setBusy(true); setError('');
    try {
      const result = await authClient.emailOtp.sendVerificationOtp({ email: login, type: 'sign-in' });
      if (result.error) setError('Einmalcode konnte nicht versendet werden.');
      else setOtpSent(true);
    } catch { setError('Der Einmalcode ist derzeit nicht verfügbar.'); }
    finally { setBusy(false); }
  }

  async function signInOtp() {
    if (!otp) return;
    setBusy(true); setError('');
    try {
      const result = await authClient.signIn.emailOtp({ email: login, otp });
      if (result.error) setError('Ungültiger oder abgelaufener Einmalcode.');
      else {
        setUser(result.data?.user || { email: login });
        await initializePortal();
      }
    } catch { setError('Anmeldung derzeit nicht verfügbar.'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    ++requestSequence.current;
    try { await fetch('/api/admin/mfa/logout',{method:'POST'}).catch(()=>{});await authClient.signOut(); } finally {
      setUser(null);
      setMode('login');
      setIsAdmin(false);
      setClients([]);
      setSelectedClientId('');
      setRows([]);
      setError('');
      setPending(false);
    }
  }

  function chooseClient(id) {
    ++requestSequence.current;
    setSelectedClientId(id);
    setSelectedFile(null);
    setUploadMessage('');
    setRows([]);
    setClientName(id ? clients.find(c => c.id === id)?.name || 'Mandant' : 'Bitte Mandanten auswählen');
    setPending(false);
    if (id) refreshDocuments(id);
    else setLoading(false);
  }

  async function uploadDocument(event) {
    event.preventDefault();
    if (!selectedFile || (isAdmin && !selectedClientId) || pending) return;
    setUploading(true); setUploadMessage('');
    try {
      const form = new FormData();
      form.set('file', selectedFile);
      form.set('category', uploadCategory);
      if (isAdmin) form.set('client_id', selectedClientId);
      const response = await fetch('/api/documents', {
        method: 'POST', body: form, credentials: 'same-origin'
      });
      const result = await response.json();
      if (!response.ok) {
        setUploadMessage(result.error || 'Upload fehlgeschlagen.');
        return;
      }
      setSelectedFile(null);
      if (isAdmin) {
        const note=result.notification;
        if (!note) setUploadMessage('Dokument hochgeladen. Benachrichtigungsstatus nicht verfügbar.');
        else if (note.queued === 0) setUploadMessage('Dokument hochgeladen. Keine verifizierte Kunden-E-Mail für eine Benachrichtigung hinterlegt.');
        else if (note.delivery?.sent === note.queued) setUploadMessage('Dokument hochgeladen. E-Mail-Benachrichtigung versendet.');
        else setUploadMessage('Dokument hochgeladen. E-Mail-Benachrichtigung vorgemerkt; Versand noch ausstehend.');
      } else setUploadMessage('Dokument sicher hochgeladen.');
      await refreshDocuments(isAdmin ? selectedClientId : '');
    } catch {
      setUploadMessage('Upload derzeit nicht möglich.');
    } finally { setUploading(false); }
  }

  const selectionRequired = mode === 'portal' && isAdmin && !selectedClientId;
  const uploadEnabled = mode === 'portal' && !pending && !selectionRequired && !loading;

  return <>
    <header className="top">
      <a className="identity" href="https://francearena-arch.github.io/lkn-group/" aria-label="Zur LKN Website">
<img className="portalLogo" src="/lkn-logo-v2.png" alt="LKN Group"/><span className="portalTitle">KUNDENPORTAL</span>
      </a>
      <nav>
        <a className="backWebsite" href="https://francearena-arch.github.io/lkn-group/">← Zurück zur Website</a>
        {user && <button onClick={signOut}>Abmelden</button>}
      </nav>
    </header>

    <main className="wrap">
      {mode === 'mfa' ? <section className="login mfaCard">
        <div className="eyebrow">ADMINISTRATOR · ZWEI-FAKTOR-ANMELDUNG</div>
        <h1>{mfaConfigured?'Zugang bestätigen.':'Zweitfaktor einrichten.'}</h1>
        <p>{mfaConfigured?'Bitte den sechsstelligen Code aus Ihrer Authenticator-App eingeben.':'Scannen Sie den QR-Code mit Ihrer Authenticator-App (z. B. Microsoft Authenticator oder Google Authenticator). Danach bestätigen Sie den angezeigten Code.'}</p>
        {!mfaConfigured&&mfaQr&&<div className="qrArea"><img src={mfaQr} alt="Authenticator-QR-Code"/><p>Alternativer Einrichtungsschlüssel:</p><code className="mfaSecret">{mfaSecret}</code></div>}
        <form onSubmit={confirmMfa}>
          <label>Einmalcode<input autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={mfaCode} onChange={e=>setMfaCode(e.target.value)} placeholder="000000"/></label>
          {error&&<p className="error" role="alert">{error}</p>}
          <button className="primary" disabled={mfaBusy||mfaCode.length!==6}>{mfaBusy?'Prüfung läuft …':'Zugang bestätigen'}</button>
        </form>
        <p className="mfaNote">Administratorzugriff wird erst nach erfolgreicher Zwei-Faktor-Prüfung freigeschaltet.</p>
      </section> : mode === 'login' ?
        <section className="login">
          <div className="eyebrow">GESCHÜTZTER KUNDENBEREICH</div>
          <h1>Willkommen zurück.</h1>
          <p>Melden Sie sich mit Ihrem persönlichen Kundenkonto an.</p>
          <form onSubmit={signIn}>
            <label>E-Mail-Adresse
              <input type="email" autoComplete="username" required value={login}
                onChange={e => setLogin(e.target.value)} />
            </label>
            <label>Passwort
              <input type="password" autoComplete="current-password" required value={password}
                onChange={e => setPassword(e.target.value)}/>
            </label>
            {error && <p role="alert" className="error">{error}</p>}
            <button className="primary" disabled={busy}>{busy ? 'Anmeldung läuft …' : 'Sicher anmelden'}</button>
          </form>
          <a className="forgotLink" href="/passwort-vergessen">Passwort vergessen?</a>
          <div className="otpbox">
            <button type="button" className="linkbtn" onClick={sendOtp} disabled={busy}>Einmalcode per E-Mail senden</button>
            {otpSent && <div>
              <label>Einmalcode
                <input inputMode="numeric" autoComplete="one-time-code" value={otp}
                  onChange={e => setOtp(e.target.value)} placeholder="Einmalcode"/>
              </label>
              <button className="primary" onClick={signInOtp} disabled={busy || !otp}>Mit Einmalcode anmelden</button>
            </div>}
          </div>

        </section> :
        <>
          <section className="intro">
            <div>
              <div className="eyebrow">LKN GROUP / {isAdmin ? 'MANDANTENVERWALTUNG' : 'KUNDENBEREICH'}</div>
              <h1>{isAdmin && mode === 'portal' ? 'Mandantenverwaltung.' : 'Guten Tag.'}</h1>
              <p>{isAdmin && mode === 'portal'
                ? 'Wählen Sie einen Mandanten. Dokumente und Uploads werden ausschliesslich diesem Mandanten zugeordnet.'
                : 'Ihr persönlicher Bereich für Dokumente und den Austausch mit LKN.'}</p>
            </div>

          </section>



          {mode === 'portal' && isAdmin &&
            <section className="adminSelector" aria-label="Mandant auswählen">
              <label htmlFor="clientChoice">Mandant auswählen</label>
              <input className="clientSearch" type="search" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} placeholder="Mandant suchen …" aria-label="Mandant suchen"/>
              <select id="clientChoice" value={selectedClientId} disabled={uploading} onChange={e => chooseClient(e.target.value)}>
                <option value="">Bitte Mandanten auswählen</option>
                {clients.filter(c=>c.name.toLocaleLowerCase('de').includes(clientSearch.trim().toLocaleLowerCase('de'))||c.id===selectedClientId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span>Administratorzugang – Mandanten werden strikt getrennt angezeigt.</span>
            </section>}

          {selectionRequired &&
            <div className="notice">Bitte wählen Sie oben einen Mandanten aus, um dessen Dokumente zu sehen.</div>}
          {pending &&
            <div className="notice">{error || 'Der Benutzerzugang ist noch keinem aktiven Mandanten zugewiesen.'}</div>}

          <section className="stats">
            <article><span>Meine Dokumente</span><strong>{rows.length}</strong><small>Dokumentenübersicht</small></article>
            <article><span>Mandant</span><strong className="sm">{clientName}</strong><small>{isAdmin ? 'Ausgewählter Mandant' : 'Geschützter Bereich'}</small></article>
            <article><span>Neue Dokumente</span><strong>{0}</strong><small>{'Aktuell keine neuen Markierungen'}</small></article>
          </section>

          <div className="columns">
            <section className="panel">
              <div className="panelhead"><div className="eyebrow">DOKUMENTENABLAGE</div><h2>Dokumente</h2></div>
              {loading && <p className="empty">Dokumente werden geladen …</p>}
              {!loading && rows.length === 0 && <p className="empty">{selectionRequired
                ? 'Bitte zuerst Mandant auswählen.'
                : 'Keine Dokumente vorhanden.'}</p>}
              {!loading && rows.map(d =>
                <div className="file" key={d.id}>
                  <span className="fileicon">PDF</span>
                  <div className="grow"><b>{d.title}</b><small>{d.category} · {d.date}</small></div>
                  {mode === 'portal' && d.downloadable ?
                    <a className="documentDownload" href={'/api/documents/' + encodeURIComponent(d.id) + '/download'}>
                      Herunterladen ↓
                    </a> :
                    <span className="muted">{'Noch keine Datei'}</span>}
                </div>)}
            </section>

            <aside className="panel">
              <div className="eyebrow">DOKUMENTE EINREICHEN</div>
              <h2>Unterlagen austauschen</h2>
              {uploadEnabled ?
                <form className="drop uploadForm" onSubmit={uploadDocument}>
                  <span className="uploadIcon">↥</span>
                  <strong>Dokument hochladen</strong><p>PDF, JPG oder PNG · maximal 3 MB</p>
                  <label className="filePickLabel">Datei auswählen
                    <input type="file" required accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                      onChange={e => { setSelectedFile(e.target.files?.[0] || null); setUploadMessage(''); }}/>
                  </label>
                  {selectedFile && <span className="pickedName">{selectedFile.name}</span>}
                  <label className="uploadCategory">Kategorie
                    <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}>
                      {['Allgemein', 'Steuern', 'Buchhaltung', 'Lohnwesen', 'Immobilien', 'Versicherungen']
                        .map(v => <option key={v}>{v}</option>)}
                    </select>
                  </label>
                  <button className="primary" type="submit" disabled={!selectedFile || uploading}>
                    {uploading ? 'Wird hochgeladen …' : 'Sicher hochladen'}
                  </button>
                  {uploadMessage && <p role="status" className="uploadResult">{uploadMessage}</p>}
                </form> :
                <div className="drop">
                  <span className="uploadIcon">↥</span><strong>Dokument hochladen</strong>
                  <p>{selectionRequired ? 'Bitte zuerst einen Mandanten auswählen.'
                    : 'Upload derzeit nicht verfügbar.'}</p>
                  <button disabled>Upload nicht verfügbar</button>
                </div>}
              <div className="help">
                <b>Direkter Kontakt</b><p>Fragen zu Ihren Dokumenten? Wir helfen Ihnen persönlich.</p>
                <a href="mailto:info@lkn-group.ch">info@lkn-group.ch →</a>
              </div>
            </aside>
          </div>
        </>}
    </main>

    <footer className="footer">
      <span>© LKN Group · Kundenportal</span>
      <span>Vertraulicher Dokumentenaustausch</span>
    </footer>
  </>;
}
