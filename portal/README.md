# LKN Kundenportal – nächste Releaseversion

Eigenständiges Next.js-Portal auf Vercel, Backend Neon Postgres/Auth/private Storage. **Sicherheitsfreigabe für echte Mandantendokumente steht weiterhin aus.**

- **Vercel-Projekt:** `lkn-kundenportal`
- **Temporäre stabile URL:** https://lkn-kundenportal.vercel.app/
- **Finale URL nach DNS:** https://portal.lkn-group.ch/
- **Website:** GitHub Pages mit CNAME `lkn-group.ch`
- **Admin:** eigenes Rollenrecht in `portal_admins`, zusätzlich Authenticator-TOTP.
- **Kunde:** zugeordnete Dokumente ausschliesslich innerhalb seines Mandanten; Admin darf auswählen und Dokumente für Mandanten hochladen.
- **Benachrichtigung:** Admin-Upload erzeugt eine mandantenbezogene Warteschlange; SMTP vom Mailhoster oder alternativ Resend; ohne verifizierten Sender kein Versand.
- **Wiederholungen:** ein täglicher geheimer Vercel-Cron für fehlgeschlagene Benachrichtigungen (Hobby kompatibel).
- **Login:** keine Demo-/Pilot-Beschriftung, E-Mail/Passwort, Passwort-Rücksetzung und passwortloser Einmalcode.
- **Branding:** offizielles Dachlinienlogo `lkn-logo-v2.png`, Header und Favicon.

## Konfiguration
Vercel benötigt weiterhin `DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `ADMIN_TOTP_ENCRYPTION_KEY`, vier `AWS_*`-Storage-Variablen und `CRON_SECRET`. E-Mail-Variablen laut `DNS_EMAIL_SETUP.md`.

## Tests und Freigabe
Automatisierte Mandantentrennung und private Speicherung wurden zuvor geprüft. Noch offen: vollständiger Browser-E2E-Test mit zwei verifizierten Kundenkonten und einem Admin mit MFA, tatsächliche E-Mail-Zustellung, unabhängige wiederherstellbare Dateibackups und Datenschutz-/Sicherheitsprüfung.

Vor dem produktiven Go-live ausschliesslich künstliche Dokumente verwenden. Details: `SECURITY.md`, `OPERATIONS.md`, `tests/README.md`.

## Deploymentdisziplin
Die Portaländerungen auf Branch `release/lkn-kundenportal-v1` sammeln und **erst nach Abschluss** mit `main` zusammenführen. Dann den Pull Request mergen und **genau ein manuelles Vercel-Produktionsdeployment über die REST-API** aus dem freigegebenen Git-Commit ausführen. `portal/vercel.json` setzt `git.deploymentEnabled=false`: automatische Deployments nach GitHub-Pushs werden damit nach Aktivierung der neuen Konfiguration dauerhaft ausgeschaltet. Preview-Deployments sind während der Sammelphase deaktiviert.
