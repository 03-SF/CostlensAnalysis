import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  formatLockMessage,
} from "./rateLimit";

beforeEach(() => {
  sessionStorage.clear();
});

describe("checkRateLimit", () => {
  it("allows the first attempt", () => {
    const result = checkRateLimit("user@example.com");
    expect(result.allowed).toBe(true);
  });

  it("allows when no previous record exists", () => {
    const result = checkRateLimit("newuser@example.com");
    expect(result.allowed).toBe(true);
  });
});

describe("recordFailedAttempt", () => {
  it("allows the first 4 failed attempts with a warning", () => {
    for (let i = 1; i <= 4; i++) {
      const result = recordFailedAttempt("user@example.com");
      expect(result.allowed).toBe(false);
      expect(result.locked).toBe(false);
      if (!result.allowed && !result.locked) {
        expect(result.message).toContain("remaining");
      }
    }
  });

  it("locks after 5 failed attempts", () => {
    for (let i = 0; i < 4; i++) {
      recordFailedAttempt("locked@example.com");
    }
    const fifth = recordFailedAttempt("locked@example.com");
    expect(fifth.allowed).toBe(false);
    expect(fifth.locked).toBe(true);
    if (!fifth.allowed && fifth.locked) {
      expect(fifth.secondsRemaining).toBeGreaterThan(0);
    }
  });

  it("prevents further attempts after lockout", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("locked2@example.com");
    }
    const check = checkRateLimit("locked2@example.com");
    expect(check.allowed).toBe(false);
    expect(check.locked).toBe(true);
  });
});

describe("clearRateLimit", () => {
  it("removes the rate limit record", () => {
    recordFailedAttempt("cleared@example.com");
    clearRateLimit("cleared@example.com");
    const check = checkRateLimit("cleared@example.com");
    expect(check.allowed).toBe(true);
  });
});

describe("formatLockMessage", () => {
  it("shows ~1 minute for short lockouts", () => {
    expect(formatLockMessage(30)).toContain("1 minute");
  });

  it("shows minutes for longer lockouts", () => {
    expect(formatLockMessage(600)).toContain("10 minutes");
  });
});

describe("rate limit isolation", () => {
  it("does not share limits between different emails", () => {
    recordFailedAttempt("user1@example.com");
    recordFailedAttempt("user1@example.com");
    const user2Check = checkRateLimit("user2@example.com");
    expect(user2Check.allowed).toBe(true);
  });
});
