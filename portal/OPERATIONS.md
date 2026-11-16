# LKN Group – Betriebs-/Sicherheitsfreigabe

## Zweck
Betriebsverfahren für einen treuhänderischen Mandantenbereich. Bis alle Kontrollen bestanden sind: **keine echten Kundendaten hochladen.**

## Freigabe-Gates
- [x] Private Neon Storage, serverseitige Mandantenautorisierung, API- und SQL-Tests
- [x] Admin-TOTP-Codepfad und serverseitige zusätzliche Session-Prüfung implementiert
- [ ] Admin-TOTP-Einrichtung und Wiederanmeldung im realen Browser erfolgreich getestet
- [ ] Zwei **verifizierte** Mandanten-Testkonten und ein Admin-Testkonto durch einen vollständigen Browser-E2E-Lauf nachweislich isoliert
- [ ] Externes, verschlüsseltes Dokumentenbackup unabhängig von Neon konfiguriert
- [ ] *Tatsächliche* Wiederherstellung: Postgres + alle zugehörigen Dateibinaries, Vollständigkeits- und Hash-Abgleich
- [ ] Passwort-Reset-E-Mail-Ende-zu-Ende mit eigenem validierten Absender getestet
- [ ] Dateiscan, Lösch-/Aufbewahrungsfristen, DSG/AVV, Rollen-/Audit-Review
- [ ] DNS und verbindliche Zuständigkeiten sowie Incident-/Supportprozess geregelt

## Backups
Ein Neon-Snapshot der Datenbank wurde testweise in einem Branch wiederhergestellt. Der private Object-Storage-Bucket fehlte dort. **Deshalb ist bisher keine vollständige Datenwiederherstellung belegt.**

Für den produktiven Betrieb: tägliche Sicherung der PostgreSQL-Daten plus versioniertes, verschlüsseltes, extern gespeichertes Objektbackup (z.B. separater AWS-S3-Bucket oder vergleichbar). Monatlich ein Restore in einer isolierten Umgebung mit Abgleich aller Dokumentenmetadaten gegen Binärdateien und Prüfsummen. Backup-Zugangsschlüssel separat verwalten, Restore dokumentieren.

## Kosten
Monatliche Servicepauschale: CHF 350 (Budget, kein Anbieter-Einzelpreisversprechen): Neon CHF 35, Vercel CHF 25, Backups/Monitoring CHF 25, E-Mail/Domain CHF 15, KI-Werkzeuge anteilig CHF 25, Updates und Bugfixing CHF 225. Total CHF 350. Mehrverbrauch/Neuentwicklung/externes Audit sind separat zu vereinbaren.

## Deployment
Vercel: Projekt `lkn-client-portal-demo`; Next.js-Verzeichnis `portal/`; GitHub `francearena-arch/lkn-group`. Auf dem Free-Account wurde das Tageslimit von 100 API-Deployments erreicht. Die Projektkonfiguration wurde korrigiert, ein neuer erfolgreicher Produktionsbuild steht **noch aus**.
