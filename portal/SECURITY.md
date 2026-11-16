# LKN Kundenportal – Security Review (Demo)

## Architektur und Rechte

- Authentifizierung: Neon Managed Auth; Identität aus serverseitig verifizierter Session.
- Adminberechtigung: ausschliesslich über `public.portal_admins` mit `enabled = true`.
- Mandantenberechtigung: `public.portal_memberships`, begrenzt auf einen aktiven Mandanten je Kunde in der aktuellen UI.
- Administration: `GET /api/clients` ausschliesslich für explizite Admins; Auswahl ist verpflichtend, bevor Dokumente angezeigt werden.
- Dokumentliste: `GET /api/documents` verwendet die serverseitig aufgelöste `client_id`; ein Kundennutzer kann keinen fremden Mandanten über Query-Parameter auswählen.
- Upload: `POST /api/documents` bindet `client_id` serverseitig; Admin kann nach Auswahl eines aktiven Mandanten dorthin hochladen.
- Download: `GET /api/documents/[id]/download` prüft für jeden Request Session und entweder dokumenteigene Mandantenmitgliedschaft oder explizite Adminberechtigung.
- Storage: privater Neon-Bucket; Storage-Credentials nur auf dem Server. Dateischlüssel beginnen mit der überprüften Mandanten-ID; fremde und verdächtige Schlüssel werden zurückgewiesen.
- Antworten enthalten `Cache-Control: private, no-store`; der Client leert alte Dokumente bei Mandantenwechsel; Wechsel während Upload ist gesperrt.

## Automatisiert überprüft

Build-/Integrationstests im Vercel-Deployment, nur mit fiktiven Daten:

1. 10 positive/negative Tests für Mandantenauswahl bestanden.
2. 8 positive/negative Tests für Downloadberechtigung bestanden.
3. Ausschluss fremder Storage-Pfade und einfacher Path-Traversal-Muster bestanden.
4. Privater S3-Upload und bytegenauer Download von künstlichen Testdateien bestanden.
5. Explizite Adminberechtigung vs. normale Mandantenkonten bestanden.
6. Testobjekte und temporäre Dokumentmetadaten nach dem Test entfernt.
7. Live-Anonymprüfung: `/api/auth/get-session` antwortet `200 null`; `/api/clients`, `/api/documents` und ein Download ohne Anmeldung verweigern mit `401`.

## Noch nicht getestet / keine Produktivfreigabe

- Browser-End-to-End-Tests mit **zwei real angemeldeten separaten Testaccounts** und Admin (inkl. Accountwechsel, Upload, Abruf und Direktlink nach Logout).
- Unabhängige Penetrationstests und Schwachstellenprüfung.
- Administrativer zweiter Authentifizierungsfaktor (MFA); Neon Managed Auth bietet dies aktuell nicht standardmässig, geeigneter Anbieter/Ansatz ist vor der Verarbeitung echter Treuhanddaten zu wählen.
- Datenbankseitige zusätzliche Mandantentrennung über RLS oder separate Rollen; derzeit erfolgt die Autorisierung auf den serverseitigen API-Endpunkten.
- Malware-Scanning, Dateityp-/Dateiinhaltsprüfung für produktive Dokumente, Aufbewahrungs-/Löschkonzept, Backup/Wiederherstellung, Datenschutz- und Auftragsbearbeitungsprüfung.
- Passwort-Reset und gebrandeter E-Mail-Versand vollständig Ende-zu-Ende.

**Status: freigegebene Demo mit Testdaten; nicht für echte Mandantenunterlagen freigeben.**


## Pilot-Erweiterung: App-basiertes Admin-MFA
- Die Managed-Auth-Anmeldung bleibt gemeinsame Einstiegsmöglichkeit für Mandant und Admin.
- Einträge in `public.portal_admins` bestimmen serverseitig die Adminberechtigung.
- Für Admins: Authenticator-Einrichtung mit verschlüsseltem AES-256-GCM TOTP-Secret, Prüfung des sechsstelligen Codes und 8 Stunden Ablaufzeit der zusätzlichen Session. Token ist HttpOnly, Secure, SameSite=Strict und an die Neon-Auth-Session-ID gebunden.
- Bei fehlendem MFA verweigern `/api/clients`, `/api/documents` (GET/POST) und `/api/documents/[id]/download` Adminzugriff.
- MFA-Setup verwendet CSRF-geprüften POST; maximal 5 Fehlversuche in 10 Minuten.
- Die **erste reale MFA-Einrichtung, Code-Prüfung, Session-Erneuerung und Wiederherstellung** muss noch mit einem angemeldeten Admin im Browser abgeschlossen werden.

## Wiederherstellung und Backups
- Neon-Datenbanksnapshot `snap-royal-base-baiiu22p` wurde erfolgreich als separater Branch wiederhergestellt; die Datenbank enthielt 2 Mandanten und 4 Dokument-Metadatensätze zum Testzeitpunkt.
- **Wichtig:** Der private Object-Storage-Bucket fehlte im wiederhergestellten Branch. Eine vollständige Wiederherstellung von Dokumentdateien ist damit **nicht** nachgewiesen.
- Automatische Snapshot-Planung war im Neon-Free-Projekt nicht verfügbar.
- Vor echten Mandantendokumenten: unabhängige verschlüsselte Storage-Sicherung an separaten Speicherort und protokollierter Restore-Test erforderlich.

## Pilotkonten und Inhaltsstand
- Admin-Identität über eigene, zugriffsberechtigte E-Mail-Adresse; Demo-Kundenidentität über zweite Test-E-Mail-Adresse.
- Zwei fiktive PDFs tatsächlich im privaten Storage abgelegt (eines pro Testmandant); diese sind keine echten Kundendokumente.
- Zwei getrennte, vollständig angemeldete Test-Browsersitzungen mit echtem E-Mail-Code und TOTP wurden noch nicht automatisiert durchgespielt. Keine Produktivfreigabe.
