/**
 * Portal configuration for IOT365.
 *
 * Currently a single-portal setup (student). The helpers below
 * are kept minimal — expand if multi-portal routing is added in
 * the future.
 */

/** @typedef {'student'} PortalId */

export const PORTAL_IDS = /** @type {const} */ (['student']);

/**
 * Persists the active portal mode to localStorage so the auth
 * redirect logic can restore the correct portal after page reload.
 *
 * @param {PortalId} portal
 */
export function persistPortalMode(portal) {
  try {
    localStorage.setItem('auth_portal_mode', portal);
  } catch {
    /* Silently ignore — private/incognito mode may block localStorage */
  }
}
