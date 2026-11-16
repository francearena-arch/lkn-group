const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pure, security-sensitive decision function.
 * This decision is used by server API handlers, not by frontend controls.
 */
export function decideTenantScope({ isAdmin, assignedClientId, requestedClientId }) {
  const requested = requestedClientId || null;
  if (isAdmin) {
    if (!requested || !UUID.test(requested))
      return { allowed: false, status: 400, error: 'Bitte einen Mandanten auswählen' };
    return { allowed: true, clientId: requested };
  }
  if (!assignedClientId)
    return { allowed: false, status: 403, error: 'Kein freigeschalteter Mandantenzugang' };
  if (requested && requested !== assignedClientId)
    return { allowed: false, status: 403, error: 'Zugriff verweigert' };
  return { allowed: true, clientId: assignedClientId };
}
