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
