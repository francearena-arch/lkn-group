# LKN Group Website – V14 (16 November 2026)

## Veröffentlichte Website
- GitHub Pages – Domain: `lkn-group.ch` (CNAME in Repository; DNS/SSL separat prüfen).
- Öffentliche Seiten: Startseite, Treuhand, Immobilien, Versicherungen, Über uns, Kontakt, Impressum, Datenschutz.
- Offizielles LKN-Logo: `lkn-logo-v2.png`, auch Favicon.
- Ein altes Logo im ursprünglichen Fotomotiv der Startseite wird durch eine offizielle LKN-Markenplakette überdeckt. Ein vollständig neu generiertes Bildmotiv liegt separat als Austauschdatei bereit und sollte nach Upload die ursprüngliche Bilddatei ersetzen.
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
