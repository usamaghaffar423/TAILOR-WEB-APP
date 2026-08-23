// SHA-256 hex digest of the developer PIN. The PIN itself is never written
// anywhere in the codebase — only this hash. To regenerate for a new PIN:
//   node -e "console.log(require('crypto').createHash('sha256').update('NEWPIN').digest('hex'))"
export const HEALTH_PIN_HASH = '5d45b6dab369465f5791cb8f5ba5c9b83962213978e3b951163dcd03ccae7a73';

// Session key — PIN unlock persists for the browser session only (sessionStorage)
export const HEALTH_SESSION_KEY = 'dh_dev_unlocked';

export const CHECK_TIMEOUT_MS = 5000;

export const RESPONSE_TIME_THRESHOLDS = {
  OK: 500, // < 500ms  → green
  SLOW: 1500, // < 1500ms → yellow
  // >= 1500ms or error   → red
} as const;

export const MAX_PIN_ATTEMPTS = 5;
export const LOCKOUT_SECONDS = 60;
