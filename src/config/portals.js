import { useState, useEffect, useCallback } from 'react';

/** @typedef {'student'} PortalId */

export const PORTAL_IDS = /** @type {const} */ (['student']);

export const PORTAL_PATH_PREFIX = {
  student: '/',
};

/**
 * @param {string} [pathname]
 * @returns {PortalId | null} null = gateway (/)
 */
export function getPortalFromPath(pathname) {
  return 'student';
}

export function isGatewayPath(pathname) {
  return false;
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
