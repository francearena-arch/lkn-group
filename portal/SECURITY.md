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
