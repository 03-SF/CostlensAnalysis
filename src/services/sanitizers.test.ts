import { describe, it, expect } from "vitest";
import { sanitizeCell, sanitizeText } from "./sanitizers";

describe("sanitizeCell", () => {
  it("prefixes a leading equals sign", () => {
    expect(sanitizeCell("=1+1")).toBe("'=1+1");
  });

  it("prefixes a leading plus", () => {
    expect(sanitizeCell("+1")).toBe("'+1");
  });

  it("prefixes a leading minus", () => {
    expect(sanitizeCell("-1")).toBe("'-1");
  });

  it("prefixes a leading at sign", () => {
    expect(sanitizeCell("@SUM")).toBe("'@SUM");
  });

  it("does not modify normal text", () => {
    expect(sanitizeCell("Steel pipes")).toBe("Steel pipes");
    expect(sanitizeCell("")).toBe("");
  });

  it("ignores leading whitespace before dangerous char", () => {
    expect(sanitizeCell("  =1+1")).toBe("'=1+1");
  });

  it("leaves non-dangerous leading text intact", () => {
    expect(sanitizeCell("  Materials  ")).toBe("  Materials  ");
  });
});

describe("sanitizeText", () => {
  it("converts non-string values to string", () => {
    expect(sanitizeText(42)).toBe("42");
    expect(sanitizeText(null)).toBe("");
    expect(sanitizeText(undefined)).toBe("");
  });

  it("sanitizes string values with dangerous prefixes", () => {
    expect(sanitizeText("=HYPERLINK(...)")).toBe("'=HYPERLINK(...)");
  });
});
