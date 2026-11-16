-- LKN Kundenportal – tenant-role hardening
-- Purpose: make portal_admins the only source of administrator privileges
-- and ensure every normal portal identity belongs to at most one client.

BEGIN;

-- Admin identities must not also remain in the customer membership table.
DELETE FROM public.portal_memberships
WHERE role = 'admin';

ALTER TABLE public.portal_memberships
  DROP CONSTRAINT IF EXISTS portal_memberships_role_check;

ALTER TABLE public.portal_memberships
  ADD CONSTRAINT portal_memberships_role_check
  CHECK (role = 'client');

ALTER TABLE public.portal_memberships
  ADD CONSTRAINT portal_memberships_user_id_unique
  UNIQUE (user_id);

COMMIT;
