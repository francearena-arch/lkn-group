# LKN Group Kundenportal – Pilot V1

**Technischer Stand:** Private Neon database/storage, Neon Auth, serverseitige customer vs. admin permissions, admin TOTP (app-level), upload/download interface and secure API routes implemented. Tests using artificial files passed previously. All real customer data is prohibited until the release gates are complete.

## Links
- Portal: https://lkn-client-portal-demo.vercel.app/
- Public website: https://francearena-arch.github.io/lkn-group/

## Architecture
- Next.js on Vercel, source in `portal/`
- Neon PostgreSQL `lkn_portal`
- Neon Managed Auth, one combined sign-in page
- `public.portal_memberships`: customers assigned to a specific client
- `public.portal_admins`: explicit administrator access only
- Admin TOTP additional session check, mandatory for admin data access
- Storage bucket `lkn-demo-documents`: private
- Documents scoped by client ID in SQL and storage key
- Protected upload `POST /api/documents`, listing `GET /api/documents`, download `GET /api/documents/[id]/download`

## Demo accounts
A registered mailbox is required for each real test login. Existing Neon Auth users include accounts associated with the owner's email and dummy addresses. The dummy `example.com` accounts cannot receive email, and should not be advertised as functional to Raimond. No hardcoded login passwords are committed. A personal, deliverable administrator email and two deliverable test emails or a managed credential provisioning process must be agreed before a complete browser E2E run.

## Automated tests
- `node scripts/smoke-storage.mjs` (requires Neon and S3 env vars)
- `node scripts/smoke-authz.mjs` (requires Neon and S3 env vars)
- Browser E2E specification: `tests/portal-access.spec.cjs`, **not yet executed**. See `tests/README.md`.

## Environment
`DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `ADMIN_TOTP_ENCRYPTION_KEY`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`. Secret values are stored only in Vercel.

## Password reset and emails
- Recovery pages `/passwort-vergessen` and `/passwort-zuruecksetzen` are implemented.
- Branded HTML exists under `templates/`, but Neon still uses shared SMTP pending an authorised LKN sender/domain and email provider.
- End-to-end email deliverability/password-reset verification remains open.

## Live status
The most recent repository changes have **not been redeployed** due to Vercel Hobby's API deployment quota (100/day). Root directory has been set to `portal/` in project settings; a fresh successful build and live runtime check remain necessary.

**No production approval for real tax, payroll, financial or identity documents.**
