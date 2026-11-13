import { describe, it, expect } from "vitest";
import {
  validateFile,
  getExtension,
  MAX_FILE_SIZE,
  generateSampleCsv,
} from "./fileParser";

describe("getExtension", () => {
  it("returns lowercase extension", () => {
    expect(getExtension("data.CSV")).toBe(".csv");
    expect(getExtension("report.XLSX")).toBe(".xlsx");
  });

  it("returns empty string when no extension", () => {
    expect(getExtension("noextension")).toBe("");
  });
});

describe("validateFile", () => {
  it("accepts a valid .csv file within size limit", () => {
    const file = new File(["a,b,c"], "test.csv", { type: "text/csv" });
    const result = validateFile(file);
    expect(result.ok).toBe(true);
  });

  it("accepts a valid .xlsx file within size limit", () => {
    const file = new File([new Uint8Array([0x50, 0x4b])], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const result = validateFile(file);
    expect(result.ok).toBe(true);
  });

  it("rejects a .exe file", () => {
    const file = new File(["binary"], "malware.exe", { type: "application/octet-stream" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(".csv and .xlsx");
    }
  });

  it("rejects a .txt file", () => {
    const file = new File(["hello"], "notes.txt", { type: "text/plain" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(".csv and .xlsx");
    }
  });

  it("rejects a file over the size limit", () => {
    const content = new Array(MAX_FILE_SIZE + 1).fill("a").join("");
    const file = new File([content], "big.csv", { type: "text/csv" });
    const result = validateFile(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("2 MB");
    }
  });
});

describe("generateSampleCsv", () => {
  it("contains the required column headers", () => {
    const csv = generateSampleCsv();
    expect(csv).toContain("category");
    expect(csv).toContain("description");
    expect(csv).toContain("estimated");
    expect(csv).toContain("actual");
  });

  it("contains sample data rows", () => {
    const csv = generateSampleCsv();
    const lines = csv.split("\n");
    expect(lines.length).toBeGreaterThanOrEqual(5);
    expect(lines[1]).toContain("Materials");
  });
});
