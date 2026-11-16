# Browser E2E – LKN Mandantenschutz

Das Playwright-Testskript prüft zwei getrennte Kundenkonten, Admin-MFA, Mandantenwechsel und direkte Zugriffssperren. **Es ist noch nicht erfolgreich ausgeführt**, weil verifizierte Test-Logins mit Passwörtern / TOTP-Seed und eine lauffähige aktuelle Deployment-URL benötigt werden.

Installation im `portal`-Verzeichnis:
```bash
npm install --no-save @playwright/test
npx playwright install chromium
npx playwright test tests/portal-access.spec.cjs
```

Pflichtvariablen (niemals in Git committen):
`PORTAL_URL`, `E2E_CLIENT_A_EMAIL`, `E2E_CLIENT_A_PASSWORD`, `E2E_CLIENT_A_ID`, `E2E_CLIENT_A_NAME`, `E2E_CLIENT_A_DOCUMENT_ID`,
`E2E_CLIENT_B_EMAIL`, `E2E_CLIENT_B_PASSWORD`, `E2E_CLIENT_B_ID`, `E2E_CLIENT_B_NAME`,
`E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_ADMIN_TOTP_SECRET`.

Nicht mit echten Treuhandunterlagen testen. Zusätzlich sind echte Upload-/Download-Browserläufe, Passwort-Reset-Mailprüfung und separates Recovery-Testing erforderlich.
