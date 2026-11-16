# Domain- und E-Mail-Anbindung – LKN Kundenportal

## Festgestellter Stand
- Die öffentliche Website hat im GitHub-Repository die CNAME-Datei \`lkn-group.ch\`.
- Die Nameserver der Domain werden von Hosttech verwaltet (\`ns1.hosttech.ch\`, \`ns2.hosttech.ch\`, \`ns3.hosttech.ch\`).
- Das Vercel-Projekt trägt den Namen \`lkn-kundenportal\`.
- \`lkn-kundenportal.vercel.app\` wurde bei Vercel als geprüfte technische Domain hinzugefügt und ist erreichbar.
- \`portal.lkn-group.ch\` ist im Vercel-Projekt eingetragen, aber DNS ist laut Vercel noch nicht korrekt konfiguriert.
- Der Domain-/DNS-Anbieter ist nicht zwingend identisch mit dem E-Mail-Host.

## DNS-Eintrag bei Hosttech
Für die gewünschte Subdomain \`portal.lkn-group.ch\` muss in der Hosttech-DNS-Verwaltung ein CNAME-Record angelegt werden:
- **Typ:** CNAME
- **Hostname/Name:** \`portal\`
- **Ziel:** \`cname.vercel-dns.com\`

Bestehende MX-, SPF-, DKIM-, DMARC-, A- und www-Einträge der öffentlichen Website nicht ohne separaten Audit verändern.

Nach Setzen: Vercel Project Domains, HTTPS-Zertifikat und Browserzugriff prüfen; erst dann öffentlich sichtbare Login-Links auf \`https://portal.lkn-group.ch/\` umstellen.

Die Variante \`lkn-group.ch/kundenportal\` erfordert eine eigene Routing-/Proxy-Lösung. Für die derzeit getrennten GitHub-Pages- und Vercel-Anwendungen ist die Subdomain die risikoärmere Architektur.

## E-Mail (Raimonds vorhandener Dienst kann ausreichen)
Resend ist **optional**, nicht zwingend.

### Weg A: Bestehendes SMTP des E-Mail-Hosters
Für Benachrichtigungen über neue Dokumente in Vercel hinterlegen:
- \`SMTP_HOST\`: verifizierter SMTP-Host
- \`SMTP_PORT\`: \`465\` (SSL) oder \`587\` (STARTTLS)
- \`SMTP_USER\`: technischer Mail-Login
- \`SMTP_PASSWORD\`: Mail-/App-Passwort
- \`LKN_VERIFIED_SENDER\`: autorisierter Absender, z.B. \`LKN Group <portal@lkn-group.ch>\`
- \`LKN_PORTAL_PUBLIC_URL\`: später \`https://portal.lkn-group.ch/\`

Diese Werte **nur** als sensitive Vercel Environment Variables speichern. SMTP-Zugangsdaten niemals in GitHub. Zustellung und SPF/DKIM/DMARC mit einer verifizierten Testadresse prüfen.

### Weg B: Resend als Alternative
- \`RESEND_API_KEY\`, \`LKN_VERIFIED_SENDER\` und verifizierte Domain hinterlegen.
- Wenn SMTP vollständig konfiguriert ist, wird SMTP bevorzugt. Ohne SMTP wird Resend verwendet.

### Neon Auth (Login, Einmalcode, Passwort-Reset)
Neon Auth versendet bis zur Umstellung weiterhin über seinen Shared Provider. Zur Verwendung der eigenen Domain müssen **separat in Neon Auth** SMTP-Einstellungen hinterlegt werden. Eine vollständig eigene HTML-Gestaltung erfordert ergänzend einen signaturgeprüften Auth-WebHook oder eine andere unterstützte E-Mail-Template-Integration. Eine blosse SMTP-Umstellung ändert nicht automatisch das Template.

## Versandlogik
- Nach einem Admin-Upload wird eine Benachrichtigung für alle verifizierten Mitglieder **des ausgewählten Mandanten** in der Datenbank vorgemerkt.
- Keine PDF- oder personenbezogenen Dokumenteninhalte in E-Mails.
- Versand direkt nach Upload, sofern Anbieter konfiguriert.
- Ausstehende/fehlgeschlagene E-Mails werden täglich über geschützten Vercel-Cron erneut versucht.
- Der Cron verwendet das sensitive Vercel Environment Secret \`CRON_SECRET\`.
- Produktion erst nach Test der Mailzustellung und der Ablehnung fremder/ungeprüfter Adressen freigeben.

## Zusatz: Vollständig gebrandete Neon Auth-Mails
Die Next.js-Route `/api/webhooks/neon-auth` ist im Release-Branch vorbereitet. Aktivierung erst nach verifizierter E-Mail-Domain, SMTP- bzw. Resend-Zugang, erfolgreichem End-to-End-Test und Nachweis der Signaturvalidierung. Anschliessend in Neon Auth nur `send.otp` und `send.magic_link` auf `https://lkn-kundenportal.vercel.app/api/webhooks/neon-auth` abonnieren (später auf endgültige Portal-Domain umstellen). Der bisherige Shared-Versand muss bis dahin aktiv bleiben, weil ein aktivierter Webhook den Default-Versand ersetzt.
