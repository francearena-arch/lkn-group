# LKN Group – Pilotstatus (16. November 2026)

## Zielbild
Ein gemeinsames Login. Die Berechtigung folgt ausschliesslich aus serverseitig gespeicherten Rollen:
- **Mandant:** Sieht, lädt und lädt herunter ausschliesslich innerhalb des eigenen Mandanten.
- **Administrator:** Nach zusätzlicher Authenticator-TOTP-Prüfung aktive Mandanten suchen, auswählen und deren Dokumente verwalten. Ohne Auswahl keine Dokumentenliste.

## Umgesetzt
- Offizielles LKN-Logo im Header und neue Favicon-Einbindung.
- Keine öffentliche Demoauswahl oder prominente Demo-Banner mehr. Anmeldung erforderlich.
- „Zurück zur Website“-Button.
- Geschützte Neon PostgreSQL-/Object-Storage-API (PDF, PNG, JPEG, maximal 3 MB).
- Mandantenbezogene Liste/Upload/Download, Audit-Einträge und kurzlebige Sitzungen.
- Admin-MFA: AES-256-GCM-verschlüsseltes TOTP-Geheimnis, QR-Enrollment, Code-Prüfung, begrenzte Fehlversuche, Sitzungsbindung und ablaufendes HttpOnly/SameSite=Strict-Cookie.
- Admin-Suche und Mandantenauswahl; kein Wechsel während Upload.
- Zwei künstliche PDF-Dateien tatsächlich im privaten Storage, je eine pro Testmandant.

## Technische Prüfungen
- Build und reale S3-Speicher-Roundtrips bestanden.
- 10 Szenarien zur Mandantenauswahl sowie 8 positive/negative Dokumentberechtigungen bestanden.
- Unauthentifizierter API-Aufruf (Session/Endpunkte) geprüft.
- Neon-Datenbanksnapshot erstellt und in separaten Branch wiederhergestellt, mit Tabellendaten validiert.

## Noch offen / **vor echten Mandantendaten zwingend**
1. **Vollständige Browser-End-to-End-Tests mit drei separaten kontrollierten Login-Sitzungen** (Admin nach TOTP sowie zwei Mandanten mit eigenen E-Mail-Inboxen). Accounts können ohne Zugriff auf die jeweiligen Postfächer/aktive Einmalcodes nicht vollständig durchgetestet werden.
2. **Backup von privaten Dokumenten:** Beim Restore des DB-Snapshots war der Object-Storage-Bucket auf dem Restore-Branch nicht vorhanden. Deshalb ist eine unabhängige zweite Sicherung der Dokumentdateien mit Restore-Test notwendig.
3. Neon Free unterstützt für dieses Projekt derzeit keine automatische Snapshot-Planung. Bei kostenpflichtigem Produktivbetrieb Backup-Service aktivieren und kontrollieren.
4. MFA im echten Browser einschliesslich Login, Einrichtung, Login-Neustart, Session-Ablauf und Logout abnehmen. Recovery-Prozess definieren.
5. Datensicherung/RPO/RTO, Upload-Antivirus, Incident-Response und externe Sicherheitsprüfung.
6. E-Mail-Provider und Domain für Branding sowie End-to-End-Reset noch nicht finalisiert.
7. Schweizer DSG-/Auftragsbearbeiter- und Hostingregion-Prüfung, Löschfristen und rechtliche Finalisierung.
8. Datenbankseitige zusätzliche Zugriffskontrollen (Defense in Depth) prüfen; aktuell erzwingen die autorisierten Server-Endpunkte die Rechte.
9. Initiale Kundenkonten mit verifizierten, echten E-Mail-Adressen und persönlichen Zugangsdaten ausgeben.

**Freigabe:** Design-/Technikpilot mit ausschliesslich künstlichen Testdokumenten. **Keine Freigabe für echte Mandantendaten.**
