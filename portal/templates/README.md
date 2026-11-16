# LKN-Branded Password Reset Email (Vorlage)

Diese HTML-Vorlage wird **noch nicht automatisch versendet**. Die aktuell eingerichtete Neon Auth nutzt den gemeinsamen Neon-Absender.

Für vollständig gebrandete E-Mails sind gemäss Neon-Dokumentation nötig:
1. Ein dedizierter E-Mail-Provider (z.B. Resend, Postmark oder SMTP), dessen Domain nachweislich LKN gehört.
2. Ein sicherer Auth-Webhook für das Ereignis `send.magic_link` / Passwort-Reset.
3. Ein geprüfter Event-Handler, der die von Neon bereitgestellte Rücksetz-URL in `{{RESET_URL}}` einsetzt, den Versand veranlasst und dabei den Webhook authentifiziert.
4. Tests für gültige, abgelaufene und manipulierte Links sowie SPF/DKIM/DMARC.

Die Vorlage niemals öffentlich als echten Versandmechanismus interpretieren. In V1 nutzt der Passwort-Reset Neons Shared SMTP. Der Text im E-Mail-Template enthält absichtlich keine persönlichen Kundendaten.
