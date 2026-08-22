# LKN Group Website – Release V7

Static, responsive multi-page corporate website for LKN Group, deployed via GitHub Pages.

## Current release
**V7**

## Website structure
- Startseite
- LK Treuhand
- LK Immobilien
- LK Versicherungen
- Über uns
- Kontakt
- Impressum
- Datenschutz

## V7 changes
- Standardized the bottom consultation CTA section across Startseite, Treuhand, Immobilien, Versicherungen and Über uns
- Removed telephone number, email address and postal address from these CTA cards
- Kept a single prominent `Erstgespräch vereinbaren` button linking to the Kontakt page
- Added shared styling so the CTA card has the same appearance and spacing across all relevant pages
- Updated stylesheet cache version to V7

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
