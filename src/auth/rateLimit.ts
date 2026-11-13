type AttemptRecord = {
  count: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
};

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

const storageKey = "cl_auth_rate_limit";

function readStore(): Record<string, AttemptRecord> {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, AttemptRecord>;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, AttemptRecord>): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(store));
  } catch {
    // sessionStorage may be unavailable (private mode); rate limiting degrades gracefully
  }
}

function now(): number {
  return Date.now();
}

export type RateLimitResult =
  | { allowed: true; locked: false }
  | { allowed: false; locked: true; secondsRemaining: number }
  | { allowed: false; locked: false; message: string };

export function checkRateLimit(identifier: string): RateLimitResult {
  const store = readStore();
  const record = store[identifier];
  const t = now();

  if (record?.lockedUntil && record.lockedUntil > t) {
    const secondsRemaining = Math.ceil((record.lockedUntil - t) / 1000);
    return { allowed: false, locked: true, secondsRemaining };
  }

  if (record?.lockedUntil && record.lockedUntil <= t) {
    delete store[identifier];
    writeStore(store);
  }

  return { allowed: true, locked: false };
}

export function recordFailedAttempt(identifier: string): RateLimitResult {
  const store = readStore();
  const t = now();
  const record = store[identifier] ?? { count: 0, firstAttemptAt: t, lockedUntil: null };

  if (record.firstAttemptAt < t - WINDOW_MS) {
    record.count = 0;
    record.firstAttemptAt = t;
  }

  record.count += 1;

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = t + LOCKOUT_MS;
    store[identifier] = record;
    writeStore(store);
    const secondsRemaining = Math.ceil(LOCKOUT_MS / 1000);
    return { allowed: false, locked: true, secondsRemaining };
  }

  store[identifier] = record;
  writeStore(store);

  const remaining = MAX_ATTEMPTS - record.count;
  return {
    allowed: false,
    locked: false,
    message: `Too many attempts. ${remaining} ${remaining === 1 ? "try" : "tries"} remaining before a 15-minute lockout.`,
  };
}

export function clearRateLimit(identifier: string): void {
  const store = readStore();
  delete store[identifier];
  writeStore(store);
}

export function formatLockMessage(secondsRemaining: number): string {
  const minutes = Math.ceil(secondsRemaining / 60);
  if (minutes <= 1) {
    return "Too many failed attempts. Please wait about 1 minute and try again.";
  }
  return `Too many failed attempts. Please wait about ${minutes} minutes and try again.`;
}
