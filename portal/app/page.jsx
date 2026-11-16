'use client';
import { useEffect, useRef, useState } from 'react';
import { createAuthClient } from '@neon/auth/next';

const authClient = createAuthClient();
const examples = [
  { id: 'sample-a', title: 'Steuererklärung 2025.pdf', category: 'Steuern', date: '12. November 2026' },
  { id: 'sample-b', title: 'Jahresabschluss 2025.pdf', category: 'Buchhaltung', date: '5. November 2026' },
  { id: 'sample-c', title: 'Lohnabrechnung Oktober.pdf', category: 'Lohnwesen', date: '31. Oktober 2026' }
];

export default function Page() {
  const [mode, setMode] = useState('demo');
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
  const [selectedClientId, setSelectedClientId] = useState('');
  const [clientName, setClientName] = useState('Muster Treuhand AG');
  const [rows, setRows] = useState(examples);
  const [pending, setPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('Allgemein');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const requestSequence = useRef(0);

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
    try { await authClient.signOut(); } finally {
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
      setUploadMessage('Dokument sicher hochgeladen.');
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
        <span className="mark">LKN</span><span>GROUP <small>KUNDENPORTAL</small></span>
      </a>
      <nav>
        <a href="https://francearena-arch.github.io/lkn-group/">Zur Website</a>
        {user && <button onClick={signOut}>Abmelden</button>}
      </nav>
    </header>

    <main className="wrap">
      {mode === 'login' ?
        <section className="login">
          <div className="eyebrow">GESCHÜTZTER KUNDENBEREICH</div>
          <h1>Willkommen zurück.</h1>
          <p>Melden Sie sich mit Ihrem persönlichen Kundenkonto an.</p>
          <form onSubmit={signIn}>
            <label>E-Mail-Adresse
              <input type="email" autoComplete="username" required value={login}
                onChange={e => setLogin(e.target.value)} placeholder="name@beispiel.ch"/>
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
            <p>Alternativ ohne Passwort anmelden</p>
            <button type="button" className="linkbtn" onClick={sendOtp} disabled={busy}>Einmalcode per E-Mail senden</button>
            {otpSent && <div>
              <label>Einmalcode
                <input inputMode="numeric" autoComplete="one-time-code" value={otp}
                  onChange={e => setOtp(e.target.value)} placeholder="Einmalcode"/>
              </label>
              <button className="primary" onClick={signInOtp} disabled={busy || !otp}>Mit Einmalcode anmelden</button>
            </div>}
          </div>
          <button className="linkbtn" onClick={() => { setMode('demo'); setError(''); }}>
            Demo ohne Kundendaten ansehen
          </button>
        </section> :
        <>
          <section className="intro">
            <div>
              <div className="eyebrow">LKN GROUP / {mode === 'demo' ? 'INTERAKTIVE DEMO' : isAdmin ? 'ADMINISTRATOR' : 'KUNDENBEREICH'}</div>
              <h1>{isAdmin && mode === 'portal' ? 'Mandantenverwaltung.' : 'Guten Tag' + (mode === 'demo' ? ', Herr Muster' : '') + '.'}</h1>
              <p>{isAdmin && mode === 'portal'
                ? 'Wählen Sie einen Mandanten. Dokumente und Uploads werden ausschliesslich diesem Mandanten zugeordnet.'
                : 'Ihr persönlicher Bereich für Dokumente und den Austausch mit LKN.'}</p>
            </div>
            {mode === 'demo' &&
              <button className="primary" onClick={() => setMode('login')}>Zum Kundenlogin</button>}
          </section>

          {mode === 'demo' &&
            <div className="notice">Demoansicht mit ausschliesslich fiktiven Daten. Keine echten Kundendokumente.</div>}

          {mode === 'portal' && isAdmin &&
            <section className="adminSelector" aria-label="Mandant auswählen">
              <label htmlFor="clientChoice">Mandant auswählen</label>
              <select id="clientChoice" value={selectedClientId} onChange={e => chooseClient(e.target.value)}>
                <option value="">Bitte Mandanten auswählen</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
            <article><span>Neue Dokumente</span><strong>{mode === 'demo' ? 3 : 0}</strong><small>{mode === 'demo' ? 'Fiktive Beispieldaten' : 'Aktuell keine neuen Markierungen'}</small></article>
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
                    <span className="muted">{mode === 'demo' ? 'Beispiel' : 'Noch keine Datei'}</span>}
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
                  <p>{mode === 'demo' ? 'Uploads sind in der öffentlichen Demoansicht deaktiviert.'
                    : selectionRequired ? 'Bitte zuerst einen Mandanten auswählen.'
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
      <span>© LKN Group · Kundenportal Demo</span>
      <span>Nur für Testzwecke · Keine echten Kundendaten</span>
    </footer>
  </>;
}
