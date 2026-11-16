# LKN Kundenportal – Betriebs- und Freigabekontrollen

## Voraussetzungen
- [x] Einheitliche Login-Seite, explizite Kunden-/Administratorrechte im Backend
- [x] Admin-TOTP implementiert und serverseitig für Adminzugriffe vorgeschrieben
- [x] Private Neon-Speicherung; Dokumentpfade und Downloadberechtigungen werden pro Mandant geprüft
- [x] Mandanten-Suchfunktion, Dropdown und Admin-Upload implementiert
- [x] Benachrichtigungswarteschlange pro verifiziertem Kundenkonto vorbereitet
- [x] SMTP- und optionaler Resend-Versandcode vorbereitet; täglicher Retry-Cron
- [x] DNS-Subdomain bei Vercel angelegt, Vercel-Projekt und Neon-Projekt in `lkn-kundenportal` umbenannt
- [ ] DNS-CNAME `portal → cname.vercel-dns.com` bei Hosttech gesetzt und HTTPS verifiziert
- [ ] E-Mail-Host ermittelt, eigene SMTP- oder Resend-Absender-Domain verifiziert, Testnachricht zugestellt
- [ ] Neon Auth Shared SMTP durch verifizierten Firmenabsender ersetzt; Passwortreset/Einmalcode vollständig getestet
- [ ] Zwei verifizierte Testmandanten sowie Admin mit echtem MFA im Browser durchgespielt
- [ ] Unabhängiges verschlüsseltes Dateibackup + erfolgreicher kompletter Restore einschliesslich Datei-Prüfsummen
- [ ] Malware-/Dateitypenprüfung, Aufbewahrungs-/Löschkonzept, DSG-Prüfung und unabhängige Security-Abnahme
- [ ] Ein einzelner erfolgreicher Next.js Produktionsbuild aus dem konsolidierten Release-Commit

## Backups
Neon-DB-Snapshot wurde zuvor in separatem Branch wiederhergestellt. Der private Object-Storage-Bucket fehlte dabei; vollständige Dateiwiederherstellung deshalb weiterhin **nicht verifiziert**. Es dürfen bis zur Behebung keine echten Treuhandunterlagen hochgeladen werden.

## Kostenangebot
Monatliche Pauschale CHF 350 (kalkuliertes Angebot, kein Nachweis realer Anbieterrechnungen): Neon CHF 35, Vercel CHF 25, Backups/Monitoring CHF 25, E-Mail/Domain CHF 15, KI-Arbeitsmittel CHF 25, Updates & Bugfixing CHF 225. Leistungsumfang und Mehrkosten vertraglich definieren.

## Deploymentkontrolle
- Nur ein konsolidierter Portal-Release statt vieler Einzeldeployments.
- Aktiver Repository-Hauptbranch: `main`; vorbereiteter Portal-Branch: `release/lkn-kundenportal-v1`.
- Vercel-Projektname: `lkn-kundenportal`; Root Directory: `portal`.
- `portal/vercel.json` deaktiviert automatische Git-Deployments dauerhaft; nach dem **ersten manuellen API-Release** werden reine Website-Commits kein Portal-Deployment mehr auslösen. Preview-Deployments sind vorläufig deaktiviert.
- Vercel Hobby Limit (100 kostenlose API-Deployments/Tag) zuvor erreicht; beim nächsten Zeitpunkt **einen einzelnen manuellen REST-API-Deploy direkt aus dem Release-Branch** durchführen, danach erst PR #1 nach `main` mergen (nicht zusätzlich über Dashboard deployen), anschliessend Build/Runtime/Seiten und Sicherheit prüfen.

## Neon Branch-Konfiguration
- Projekt: `lkn-kundenportal` (Projekt-ID `wispy-feather-78804019`).
- **Default-/Anwendungsbranch:** `production` (`br-cool-hall-baod8q45`); dort liegen der private Storage-Bucket und die Tabellen inklusive Benachrichtigungswarteschlange.
- Älterer Restore-Branch: `restore-snapshot-2026-11-16` (`br-plain-dew-bamsz5es`); nur Wiederherstellungsprüfung, **nicht** als produktive Datenquelle verwenden.
- Bei jeder Datenbankmigration **explizit** die Branch-ID `br-cool-hall-baod8q45` angeben; kein blindes SQL auf einem beliebigen Branch. Vercel-Datenbank-URL muss auf diesen Branch zeigen.

## Release-Nachtrag: E-Mail-Webhook und Domaincheck
- Webhook-Code für Branding ist vorbereitet, in Neon aber noch **nicht aktiviert**. Einmalcodes und Passwort-Reset laufen bis zur SMTP-Konfiguration über den Shared-Provider.
- Vercel Domain Configuration meldet für `portal.lkn-group.ch` **misconfigured=true**, obwohl die Domain am Projekt registriert und die Zuordnung verifiziert ist. Hosttech-CNAME fehlt; keine öffentliche Umstellung des Login-Links vor DNS-/HTTPS-Abnahme.
- Website-Audit: die acht HTML-Seiten referenzieren nur `lkn-logo-v2.png`, die Startseite zusätzlich `hero-office-v2.svg` mit eingebettetem offiziellen Dachlinienlogo; keine alten Bildpfade in HTML.
- GitHub Actions prüft den Portal-Build auf dem Release-Branch ohne Produktionsgeheimnisse. Für den nächsten Release bleibt es bei **einem** manuellen Vercel-Deploy aus dem konsolidierten Branch, nach erfolgreichem Test erst Merge nach `main`.
