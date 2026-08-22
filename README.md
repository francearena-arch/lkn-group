# LKN Group Website – Release V10

Static, responsive multi-page corporate website for LKN Group, deployed via GitHub Pages.

## Current release
**V9**

## Website structure
- Startseite
- LK Treuhand
- LK Immobilien
- LK Versicherungen
- Über uns
- Kontakt
- Impressum
- Datenschutz

## V9 changes
- Renamed the homepage competence-section label to `UNSERE LEISTUNGSBEREICHE`
- Structured the competence headline into two clean desktop lines:
  - `Drei Kompetenzbereiche.`
  - `Ein verlässlicher Partner.`
- Preserved responsive behavior on mobile
- Restored `styles.css`, `script.js` and `.nojekyll` to the release package for complete GitHub repository maintenance
- Updated stylesheet cache version to V9

## Deployment
GitHub Pages

- Branch: `main`
- Folder: `/ (root)`
- Entry point: `index.html`

## Main files
- `index.html` – homepage
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

## Release workflow
1. Extract the release ZIP locally.
2. Upload all files directly to the repository root.
3. Replace existing files when prompted.
4. Delete obsolete files that are no longer part of the release.
5. Commit changes to `main`.
6. GitHub Pages deploys automatically.

## Notes
The legal pages are working drafts for a Swiss corporate website and should be reviewed against the final company details, actual data-processing activities, analytics tools, forms, cookies and third-party services before production launch.

## V10 changes
- Hero label: `LKN GROUP`
- Competence section label: `UNSERE LEISTUNGSBEREICHE`
- Updated cache version to V10
