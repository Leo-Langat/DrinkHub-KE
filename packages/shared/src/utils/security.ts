/**
 * Security & Session Timeout Utilities
 * Shared across server, staff-portal, admin-portal, and customer-pwa.
 */

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours max shift length

/**
 * Safely parses JWT payload in browser/Node without external libraries.
 */
export function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Checks if a JWT access token is expired or about to expire within bufferMs.
 */
export function isJwtExpired(token: string | null | undefined, bufferMs = 5000): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const expiresAtMs = payload.exp * 1000;
  return expiresAtMs - bufferMs <= Date.now();
}

/**
 * Returns remaining milliseconds before JWT expires.
 */
export function getTokenRemainingTime(token: string | null | undefined): number {
  if (!token) return 0;
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return 0;
  return Math.max(0, payload.exp * 1000 - Date.now());
}

/**
 * Checks if the total session time exceeds absolute maximum lifetime (e.g. 12h shift).
 */
export function isSessionExpired(loginTimeMs: number | null | undefined, maxSessionMs = MAX_SESSION_MS): boolean {
  if (!loginTimeMs) return false;
  return Date.now() - loginTimeMs >= maxSessionMs;
}
