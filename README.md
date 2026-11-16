# LKN Group Website – V15 (16 November 2026)

## Veröffentlichte Website
- GitHub Pages – Domain: `lkn-group.ch` (CNAME in Repository; DNS/SSL separat prüfen).
- Öffentliche Seiten: Startseite, Treuhand, Immobilien, Versicherungen, Über uns, Kontakt, Impressum, Datenschutz.
- Offizielles LKN-Logo: `lkn-logo-v2.png`, auch Favicon.
- Das Hero-Fotomotiv wurde durch die selbstenthaltende Datei `hero-office-v2.svg` mit dem neuen offiziellen Dachlinienlogo ersetzt. Die ursprünglich aktive Datei mit altem Zeichen wurde aus dem Repository entfernt.
- Kundenlogin führt vorläufig zu `https://lkn-kundenportal.vercel.app/`. Finale Subdomain `portal.lkn-group.ch` ist in Vercel registriert, braucht noch DNS beim Hosttech-Namensserver.

## Kundenportal
- Source: `portal/` im selben Repository; separate Next.js-Anwendung auf Vercel.
- Vercel-Projekt heisst `lkn-kundenportal`.
- Damit nicht jede Website-Änderung einen Portal-Build auslöst, ist in Vercel Skip-Unchanged/MONOREPO-Logik aktiviert. Das Portal nur nach konsolidierten Änderungen deployen.
- E-Mail-/SMTP-Integration und Sicherheitsfreigaben: `portal/README.md`, `portal/SECURITY.md`, `portal/OPERATIONS.md`.

## Deployment
- Website: Commit auf `main`, GitHub Pages Root.
- Portal: getrenntes Vercel-Deployment aus Ordner `portal/`.
- Niemals geheime API-Schlüssel, SMTP-Passwörter oder Mandanteninhalte ins öffentliche GitHub-Repository übernehmen.
- Keine echten sensiblen Mandantenunterlagen vor dokumentierter Sicherheits-, Backup- und Datenschutzfreigabe.
