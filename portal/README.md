# LKN Client Portal (Demo)

## Status
Demo UI + Neon-managed authentication and database metadata. Demo mode uses fictional information. Real customer accounts need an explicit membership in portal_memberships. File upload/download is intentionally disabled pending secure storage API and authorization testing.

## Environment (Vercel)
- DATABASE_URL: pooled Neon Postgres URL (server only)
- NEON_AUTH_BASE_URL: Managed Neon Auth URL
- NEON_AUTH_COOKIE_SECRET: random >=32 character secret (server only)

## Safe testing
1. Open the public demo mode (no real files).
2. Configure env vars on Vercel and redeploy.
3. Create user through Neon Auth, then insert user_id/client_id membership after identity verification.
4. Verify 401 for signed-out API and isolation between accounts before live use.

Not production ready; no actual customer data should be used.

## Passwort vergessen – Demo-Release
- Link unterhalb von `Sicher anmelden`: `/passwort-vergessen`
- Passwort-Reset per Neon Auth: `requestPasswordReset` und `resetPassword`
- Rücksetzseite: `/passwort-zuruecksetzen`
- Generische Rückmeldung unabhängig davon, ob ein Konto existiert (Schutz vor Nutzerabfrage)
- Minimale Passwortlänge: 12 Zeichen; Passwortbestätigung; tokenbasierte Freigabe
- Existing Neon Auth setting: revoke_sessions_on_password_reset = true
- Bei Neon Auth ist aktuell der gemeinsame Versand `auth@mail.myneon.app` aktiv.
- Vollständig gebrandete LKN-E-Mail-Vorlage liegt unter `templates/password-reset-email.html`, ist aber **noch nicht an den Versand angebunden**.
- Für Markenversand benötigt: eigener verifizierter Absender, Versandprovider, authentifizierter send.magic_link-Webhook und End-to-End-Test.
- Test nur mit freigegebenen Testadressen; keine echten Kundendaten verwenden.
