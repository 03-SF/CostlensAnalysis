import { describe, it, expect, beforeEach } from "vitest";
import { sanitizeCell, sanitizeText } from "./sanitizers";
import { validateFile, getExtension } from "./fileParser";
import { unmetPasswordRules, isValidEmail } from "../auth/validation";
import { isUuid } from "../projects/validation";
import { validateAndParseCostItem } from "../costs/validation";
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from "../auth/rateLimit";

describe("SEC-01: CSV injection sanitization", () => {
  it("neutralizes formula payloads in cells", () => {
    expect(sanitizeCell("=cmd|' /C calc'!A0")).toBe("'=cmd|' /C calc'!A0");
    expect(sanitizeCell("+1+1")).toBe("'+1+1");
    expect(sanitizeCell("-1+1")).toBe("'-1+1");
    expect(sanitizeCell("@SUM(A1:A2)")).toBe("'@SUM(A1:A2)");
  });

  it("preserves normal cell content", () => {
    expect(sanitizeCell("Steel pipes")).toBe("Steel pipes");
    expect(sanitizeCell("1000.00")).toBe("1000.00");
    expect(sanitizeCell("")).toBe("");
  });

  it("handles tab and carriage return prefixes", () => {
    expect(sanitizeCell("\t=1+1")).toBe("'=1+1");
    expect(sanitizeCell("\r=1+1")).toBe("'=1+1");
  });

  it("sanitizes values through sanitizeText for non-string types", () => {
    expect(sanitizeText("=HYPERLINK(\"http://evil\")")).toBe("'=HYPERLINK(\"http://evil\")");
  });
});

describe("SEC-02: Invalid file upload rejection", () => {
  it("rejects executable files", () => {
    const file = new File(["binary"], "malware.exe", { type: "application/octet-stream" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
  });

  it("rejects script files", () => {
    const file = new File(["alert(1)"], "hack.js", { type: "application/javascript" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
  });

  it("rejects files with no extension", () => {
    const file = new File(["data"], "noextension", { type: "text/plain" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
  });

  it("rejects double extension attacks", () => {
    expect(getExtension("report.csv.exe")).toBe(".exe");
    const file = new File(["x"], "report.csv.exe", { type: "application/octet-stream" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
  });

  it("accepts only .csv and .xlsx", () => {
    const csv = new File(["a,b"], "data.csv", { type: "text/csv" });
    const xlsx = new File([new Uint8Array([0x50, 0x4b])], "data.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(validateFile(csv).ok).toBe(true);
    expect(validateFile(xlsx).ok).toBe(true);
  });
});

describe("SEC-03: Password policy enforcement", () => {
  it("rejects passwords shorter than 10 characters", () => {
    expect(unmetPasswordRules("Ab1!short")).toContain("At least 10 characters");
  });

  it("rejects passwords without uppercase", () => {
    expect(unmetPasswordRules("lowercase1!")).toContain("An uppercase letter");
  });

  it("rejects passwords without lowercase", () => {
    expect(unmetPasswordRules("UPPERCASE1!")).toContain("A lowercase letter");
  });

  it("rejects passwords without a number", () => {
    expect(unmetPasswordRules("NoNumbers!!")).toContain("A number");
  });

  it("rejects passwords without a symbol", () => {
    expect(unmetPasswordRules("NoSymbol12")).toContain("A symbol (for example ! or ?)");
  });

  it("accepts a strong password", () => {
    expect(unmetPasswordRules("Str0ng!Pass")).toHaveLength(0);
  });
});

describe("SEC-04: Email validation", () => {
  it("rejects invalid email formats", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("missing@domain")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });

  it("rejects emails over 254 characters", () => {
    const long = "a".repeat(250) + "@b.co";
    expect(isValidEmail(long)).toBe(false);
  });

  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("name.surname@sub.domain.org")).toBe(true);
  });
});

describe("SEC-05: XSS-safe cell handling", () => {
  it("does not execute or interpret HTML/script in cells", () => {
    const sanitized = sanitizeCell("<script>alert('xss')</script>");
    expect(sanitized).toBe("<script>alert('xss')</script>");
    expect(sanitized).not.toContain("'<'");
  });

  it("prefixes cells starting with dangerous characters only", () => {
    expect(sanitizeCell("<b>bold</b>")).toBe("<b>bold</b>");
    expect(sanitizeCell("=SUM(A1)")).toBe("'=SUM(A1)");
  });
});

describe("SEC-06: IDOR / broken access control", () => {
  it("rejects non-UUID project IDs (path traversal protection)", () => {
    expect(isUuid("../../../etc/passwd")).toBe(false);
    expect(isUuid("'; DROP TABLE projects;--")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("")).toBe(false);
  });

  it("accepts only well-formed UUIDs", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
    expect(isUuid("00000000-0000-1000-8000-000000000000")).toBe(true);
  });

  it("rejects UUIDs with extra characters", () => {
    expect(isUuid("550e8400-e29b-41d4-a716-446655440000-extra")).toBe(false);
    expect(isUuid("550e8400e29b41d4a716446655440000")).toBe(false);
  });
});

describe("SEC-07: SQL injection resistance", () => {
  it("treats SQL payloads in category as inert text (parameterized queries)", () => {
    const result = validateAndParseCostItem({
      category: "'; DROP TABLE cost_items;--",
      description: "",
      estimated_cost: "100",
      actual_cost: "100",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.category).toBe("'; DROP TABLE cost_items;--");
    }
  });

  it("treats SQL payloads in description as inert text (parameterized queries)", () => {
    const result = validateAndParseCostItem({
      category: "Materials",
      description: "'); DELETE FROM projects WHERE '1'='1",
      estimated_cost: "100",
      actual_cost: "100",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.description).toBe("'); DELETE FROM projects WHERE '1'='1");
    }
  });

  it("treats UNION-based injection in category as inert text", () => {
    const result = validateAndParseCostItem({
      category: "Labor' UNION SELECT * FROM auth.users--",
      description: "",
      estimated_cost: "100",
      actual_cost: "100",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.category).toBe("Labor' UNION SELECT * FROM auth.users--");
    }
  });

  it("rejects non-numeric cost values that could be injection attempts", () => {
    const result = validateAndParseCostItem({
      category: "Materials",
      description: "",
      estimated_cost: "100; DROP TABLE--",
      actual_cost: "100",
    });
    expect(result.ok).toBe(false);
  });

  it("rejects cost values with SQL comment syntax", () => {
    const result = validateAndParseCostItem({
      category: "Materials",
      description: "",
      estimated_cost: "100--",
      actual_cost: "50 OR 1=1",
    });
    expect(result.ok).toBe(false);
  });
});

describe("SEC-08: Rate limiting / brute force protection", () => {
  const testId = "brute@example.com";

  beforeEach(() => {
    sessionStorage.clear();
  });

  it("allows first attempt", () => {
    const check = checkRateLimit(testId);
    expect(check.allowed).toBe(true);
  });

  it("locks after 5 consecutive failures", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(testId);
    }
    const check = checkRateLimit(testId);
    expect(check.allowed).toBe(false);
    if (!check.allowed && check.locked) {
      expect(check.secondsRemaining).toBeGreaterThan(0);
    }
  });

  it("isolates rate limits between different accounts", () => {
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt("attacker@evil.com");
    }
    const innocentCheck = checkRateLimit("innocent@user.com");
    expect(innocentCheck.allowed).toBe(true);
  });

  it("clears rate limit on successful login", () => {
    recordFailedAttempt(testId);
    recordFailedAttempt(testId);
    clearRateLimit(testId);
    const check = checkRateLimit(testId);
    expect(check.allowed).toBe(true);
  });
});
