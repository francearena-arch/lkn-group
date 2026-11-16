# LKN Group Kundenportal

Technischer Stand (16. November 2026): Next.js auf Vercel, Neon PostgreSQL, Neon Managed Auth und privater Neon Object Storage.

## Rollen und Dateien

- **Mandant:** Anmeldung über dieselbe Login-Maske wie Admin. Server prüft Zuordnung in `portal_memberships`. Nur Dokumente des eigenen Mandanten können angesehen, hochgeladen oder heruntergeladen werden.
- **Administrator:** Die Berechtigung wird ausschliesslich über `portal_admins` kontrolliert. Zusätzlich ist ein zeitlich begrenzter TOTP-Zweitfaktor vorgeschrieben. Nach Anmeldung kann der Admin Mandanten suchen, auswählen und für diese Dokumente hochladen bzw. abrufen.
- Die API vertraut nie auf einen übergebenen Mandantenwert, ohne die Rolle serverseitig zu prüfen.
- Privater Bucket `lkn-demo-documents`; Dateien werden durch Eigentümer-ID und eindeutigen Objektschlüssel getrennt gespeichert.

## Dokumentbenachrichtigungen

Bei einem **erfolgreichen Admin-Upload** wird für jede registrierte und **verifizierte** Mandanten-E-Mail-Adresse eine Benachrichtigung in `portal_notifications` vorgemerkt. Es werden keine Dokumente per E-Mail mitgeschickt.

- `lib/notifications.js` enthält Empfängerauswahl, E-Mail-Vorlage und Versand per Resend-API.
- `RESEND_API_KEY` und `LKN_VERIFIED_SENDER` müssen nach Verifizierung einer LKN-Domain als sichere Vercel-Umgebungsvariablen hinterlegt werden.
- Ohne diese Konfiguration **erfolgt kein automatischer E-Mail-Versand**; Einträge bleiben in der Warteschlange.
- Ein Geheimnis `CRON_SECRET` und der geschützte Endpoint `/api/internal/notifications` stehen für künftige Wiederholungsversuche zur Verfügung. Eine produktive Zeitplanung und Zustellprüfung sind noch einzurichten.
- Bestehende Demo-Identitäten mit `example.com`-Adressen sind nicht verifiziert und erhalten bewusst **keine** Benachrichtigungen.
- Versandbestätigung, Fehlerfälle, Bounce-Handling und Abgleich von Empfängerdaten sind vor Produktivbetrieb zu testen.

## Anmeldung

- E-Mail und Passwort; beide Eingabefelder sind leer.
- `Passwort vergessen?` führt zu einem Link zum Zurücksetzen.
- `Einmalcode per E-Mail senden` ermöglicht die Anmeldung ohne Passwort mit einem befristeten Code an die registrierte Adresse.
- Admin-MFA ist unabhängig hiervon und kann durch E-Mail-OTP nicht umgangen werden.

## Technische Tests

- Automatische SQL- und Storage-Tests: Mandantentrennung und bytegenauer Upload/Download mit künstlichen Dateien bestanden.
- Echte Browser-End-to-End-Tests mit 2 verifizierten Testmandanten und Admin-MFA, Passwort-Reset-Mailversand und Zustellung der Upload-Benachrichtigungen sind **noch offen**.
- Für eine vollständige Backupfreigabe fehlt die geprüfte Wiederherstellung der privaten Dokument-Dateibinaries. Siehe `SECURITY.md` und `OPERATIONS.md`.

## Deployment

- Portal: `https://lkn-client-portal-demo.vercel.app/` (technische Projektadresse, trotz neutralem UI)
- Öffentliche Website: `https://francearena-arch.github.io/lkn-group/`
- Vercel-Projekt `lkn-client-portal-demo`, Source Root `portal/`
- Kein Upload echter sensibler Kundenunterlagen bis zur Sicherheits- und Datenschutzfreigabe.
