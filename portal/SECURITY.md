# LKN Kundenportal – Sicherheitsstatus

## Implemented controls (code)
- All protected API calls require a Neon Auth server session.
- `portal_memberships` binds a normal customer to assigned client records.
- `portal_admins` is a separate, explicit administrative allowlist.
- Customer document list/upload/download is restricted to the authorised client ID on the **server**, never based on dropdown visibility.
- Admin document access and client listing require additional application TOTP verification bound to the authenticated session and a short-lived, HttpOnly Secure SameSite=Strict cookie.
- Admin client selection is mandatory. The UI clears old documents on switching and prevents switching during upload.
- Private Neon object storage with client-prefixed object keys. Download verifies the object key matches the ownership recorded in the database.
- Download routes are non-public and use no-store responses.
- Admin OTP failures are rate limited in the database.

## Verified technical tests
The previously successful Vercel build logs show:
- 10 positive/negative tests for customer/admin scope
- 8 download-authorization tests across 2 distinct test clients
- object-path isolation and traversal checks
- private PDF upload/download byte-integrity checks, with temporary files deleted
- unauthenticated endpoints responded with 401; unauthenticated `get-session` returned null after correcting the Neon Auth URL.

These checks validate code and database access logic; they **are not** a complete browser penetration test.

## Backup findings
A Neon database snapshot was successfully restored to another branch, showing 2 clients and 4 document metadata records. The private object-storage bucket was not present in that recovered branch. Consequently, **full document recovery is NOT proven**.
Before production: encrypted independent backups of PostgreSQL and file objects with separate credentials and a documented restore drill including binary checksums.

## Not yet verified; production blockers
- [ ] Three real browser sessions: two verified customer mailboxes plus an administrator account, including upload, download, direct foreign URL denial, re-login, logout, stale session and MFA setup/expiry.
- [ ] A real admin has enrolled TOTP and successfully tested setup, code retry, expiry and emergency account recovery.
- [ ] Offsite backup and **successful restore of actual file content** independently of Neon.
- [ ] Branded sender and password-reset end-to-end verification.
- [ ] Malware/abuse scanning, retention and secure deletion policy, access logs/alerting, recovery playbook.
- [ ] Swiss DSG legal and hosting/processor review, independent security review.
- [ ] New production build after Vercel deployment quota resets/upgrades.

**Status:** Test-data pilot, not approved for live confidential mandates.
