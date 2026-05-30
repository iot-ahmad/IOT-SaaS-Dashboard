import { useState, useEffect, useCallback } from 'react';

/** @typedef {'customer' | 'student' | 'enterprise'} PortalId */

export const PORTAL_IDS = /** @type {const} */ (['customer', 'student', 'enterprise']);

export const PORTAL_PATH_PREFIX = {
  customer: '/customer',
  student: '/student',
  enterprise: '/enterprise',
};

/**
 * @param {string} [pathname]
 * @returns {PortalId | null} null = gateway (/)
 */
export function getPortalFromPath(pathname = typeof window !== 'undefined' ? window.location.pathname : '/') {
  const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean)[0];
  if (seg === 'customer' || seg === 'student' || seg === 'enterprise') return seg;
  return null;
}

export function isGatewayPath(pathname = typeof window !== 'undefined' ? window.location.pathname : '/') {
  return getPortalFromPath(pathname) === null;
}

/** @param {PortalId} portal */
export function getPortalPath(portal) {
  return PORTAL_PATH_PREFIX[portal];
}

/** @param {PortalId} portal */
export function getPortalUrl(portal) {
  return `${window.location.origin}${getPortalPath(portal)}`;
}

export function getGatewayUrl() {
  return `${window.location.origin}/`;
}

/** @param {PortalId} portal */
export function persistPortalMode(portal) {
  try {
    localStorage.setItem('auth_portal_mode', portal);
  } catch {
    /* ignore */
  }
}

/**
 * @param {PortalId} portal
 * @param {{ replace?: boolean }} [opts]
 */
export function navigateToPortal(portal, opts = {}) {
  persistPortalMode(portal);
  const url = getPortalUrl(portal);
  if (opts.replace) window.history.replaceState({ portal }, '', url);
  else window.history.pushState({ portal }, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** @param {{ replace?: boolean }} [opts] */
export function navigateToGateway(opts = {}) {
  const url = getGatewayUrl();
  if (opts.replace) window.history.replaceState({}, '', url);
  else window.history.pushState({}, '', url);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

/** @param {string | null} stored @param {PortalId | null} pathPortal */
export function resolvePortalMode(stored, pathPortal) {
  if (pathPortal) return pathPortal;
  if (stored === 'enterprise' || stored === 'customer' || stored === 'student') return stored;
  return 'student';
}

export function usePortalPath() {
  const read = () => getPortalFromPath();
  const [pathPortal, setPathPortal] = useState(read);

  useEffect(() => {
    const sync = () => setPathPortal(read());
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  const goToPortal = useCallback((portal, opts) => {
    navigateToPortal(portal, opts);
    setPathPortal(portal);
  }, []);

  const goToGateway = useCallback((opts) => {
    navigateToGateway(opts);
    setPathPortal(null);
  }, []);

  return { pathPortal, goToPortal, goToGateway };
}
