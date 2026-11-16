# LKN Group Website – Pilot Release V13

Responsive corporate website and separate LKN customer portal.

## Website
- GitHub Pages: https://francearena-arch.github.io/lkn-group/
- Main pages: Startseite, Treuhand, Immobilien, Versicherungen, Über uns, Kontakt, Impressum, Datenschutz.
- The new official roofline **LKN GROUP** logo is stored as `lkn-logo-v2.png` and used across the public site.
- Portal access: https://lkn-client-portal-demo.vercel.app/

## Customer portal
- Next.js source code: `portal/`
- Neon: PostgreSQL, Managed Better Auth, private Object Storage.
- One login form; server-side roles control customer or administrator dashboard.
- Customer: can list/upload/download only documents belonging to an assigned client.
- Administrator: client selection/search; extra application-level TOTP verification required for privileged access.
- Download and upload are restricted on the server, not just in the browser.
- Automatic authorization and private storage smoke tests passed previously; see `portal/SECURITY.md`.
- Test data only. **Not approved for confidential production documents.**

## Current deployment blocker
Vercel Hobby reported its limit of 100 API deployments per day on 16 Nov 2026. The Vercel project root was corrected to `portal/`, but the updated repository has **not yet been successfully redeployed** since the limit occurred. Do not represent the current live deployment as the final release until a new build succeeds.

## Security release gates
- Browser E2E with two verified customer accounts and admin MFA is still pending.
- A Neon database snapshot was restored, but the private document bucket did not restore into that branch. Full file restore from an independent encrypted backup still needs implementation and verification.
- Branded transactional mail is pending LKN sender verification and provider configuration.
- Independent security/legal review, malware scanning and incident processes before accepting real customer data.

## Deploy
- Public website: GitHub Pages `main`, folder `/`.
- Portal: Vercel Next.js project `lkn-client-portal-demo`, rootDirectory `portal`.
- Environment secrets remain on Vercel only; never commit credentials.
- Main release checklist and costs: `portal/OPERATIONS.md`.
