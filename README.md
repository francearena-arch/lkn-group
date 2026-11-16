# LKN Group Website – Release V12

Static, responsive multi-page corporate website for LKN Group, deployed via GitHub Pages.

## Current release
**V12**

## V11 changes
- Standardized the three homepage service-area tags
- `Treuhand`, `Immobilien` and `Versicherungen` now use the same light-blue visual treatment
- Removed the grey muted styling from Immobilien and Versicherungen
- Updated stylesheet cache version to V11
- No other layout, content or functionality changes

## Website structure
- Startseite
- LK Treuhand
- LK Immobilien
- LK Versicherungen
- Über uns
- Kontakt
- Impressum
- Datenschutz

## Deployment
GitHub Pages

- Branch: `main`
- Folder: `/ (root)`
- Entry point: `index.html`

## Main files
- `index.html`
- `treuhand.html`
- `immobilien.html`
- `versicherungen.html`
- `ueber-uns.html`
- `kontakt.html`
- `impressum.html`
- `datenschutz.html`
- `styles.css`
- `script.js`
- `lkn-logo.jpg`
- `hero-office.jpg`
- `.nojekyll`

## Release workflow
1. Extract the ZIP locally.
2. Upload all files directly to the repository root.
3. Replace the existing files.
4. Commit the changes to `main`.
5. GitHub Pages deploys automatically.

## Notes
The legal pages remain working drafts and should be reviewed against the final company details and actual data-processing setup before production launch.

## V12 – Kundenportal Demo
- Kundenlogin-Navigation in Desktop und Mobile ergänzt.
- Separates Next.js-Portal unter `portal/` hinzugefügt.
- Neon Auth, PostgreSQL-Datenmodell und privater Storage-Bucket vorbereitet.
- Demo-Inhalte sind fiktiv; echte Uploads und Downloads bleiben bis zur Sicherheitsabnahme deaktiviert.
- Vercel-Testprojekt angelegt. Backend-Zugangsdaten müssen ausschliesslich über Vercel-Umgebungsvariablen verwaltet werden.
- Kein Produktivbetrieb mit echten Mandantendaten.
