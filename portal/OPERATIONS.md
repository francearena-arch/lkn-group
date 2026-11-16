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
- Auto-Skip für unveränderte Monorepo-Pfade und Preview-Abschaltung eingerichtet.
- Vercel Hobby Limit (100 kostenlose API-Deployments/Tag) zuvor erreicht; beim nächsten Zeitpunkt einen einzigen Release durchführen und anschliessend Build/Runtime/Seiten und Sicherheit prüfen.
