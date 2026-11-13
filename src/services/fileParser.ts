import Papa from "papaparse";
import * as XLSX from "xlsx";
import { sanitizeText } from "./sanitizers";

export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const MAX_ROWS = 5000;
export const REQUIRED_COLUMNS = ["category", "description", "estimated", "actual"] as const;
export const ALLOWED_EXTENSIONS = [".csv", ".xlsx"] as const;

export type ParsedCostRow = {
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
};

export type ParseError = {
  row: number;
  message: string;
};

export type ParseResult =
  | { ok: true; rows: ParsedCostRow[] }
  | { ok: false; errors: ParseError[] };

export type ValidationResult =
  | { ok: true; file: File }
  | { ok: false; error: string };

export function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  const dotIndex = lower.lastIndexOf(".");
  return dotIndex === -1 ? "" : lower.slice(dotIndex);
}

export function validateFile(file: File): ValidationResult {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    return { ok: false, error: "Only .csv and .xlsx files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: "File is too large. The maximum size is 2 MB." };
  }
  return { ok: true, file };
}

export async function isMagicBytesValid(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const ext = getExtension(file.name);

  if (ext === ".xlsx") {
    return header[0] === 0x50 && header[1] === 0x4b;
  }

  if (ext === ".csv") {
    for (let i = 0; i < header.length; i++) {
      if (header[i] === 0) return false;
    }
    return true;
  }

  return false;
}

function parseNumber(raw: unknown): { ok: true; value: number } | { ok: false } {
  if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
    return { ok: true, value: Math.round(raw * 100) / 100 };
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed === "") return { ok: false };
    if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return { ok: false };
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) return { ok: false };
    return { ok: true, value: Math.round(num * 100) / 100 };
  }
  return { ok: false };
}

function validateRows(
  rawRows: Record<string, unknown>[],
  hasHeader: boolean,
): ParseResult {
  const errors: ParseError[] = [];
  const rows: ParsedCostRow[] = [];

  if (rawRows.length === 0) {
    return { ok: false, errors: [{ row: 0, message: "The file has no data rows." }] };
  }

  if (rawRows.length > MAX_ROWS) {
    return {
      ok: false,
      errors: [{ row: 0, message: `The file has too many rows. The maximum is ${MAX_ROWS}.` }],
    };
  }

  const firstRow = rawRows[0];
  const columns = Object.keys(firstRow).map((c) => c.toLowerCase().trim());
  for (const required of REQUIRED_COLUMNS) {
    if (!columns.includes(required)) {
      return {
        ok: false,
        errors: [{ row: 0, message: `Missing required column: "${required}". Expected columns: ${REQUIRED_COLUMNS.join(", ")}.` }],
      };
    }
  }

  rawRows.forEach((raw, index) => {
    const displayRow = hasHeader ? index + 2 : index + 1;
    const get = (col: string) => {
      const key = Object.keys(raw).find((k) => k.toLowerCase().trim() === col);
      return key ? raw[key] : undefined;
    };

    const categoryRaw = get("category");
    const category = sanitizeText(categoryRaw).trim();
    if (!category) {
      errors.push({ row: displayRow, message: "Category is required." });
    } else if (category.length > 80) {
      errors.push({ row: displayRow, message: "Category must be 80 characters or fewer." });
    }

    const description = sanitizeText(get("description")).trim();
    if (description.length > 500) {
      errors.push({ row: displayRow, message: "Description must be 500 characters or fewer." });
    }

    const estimated = parseNumber(get("estimated"));
    if (!estimated.ok) {
      errors.push({ row: displayRow, message: "Estimated must be a non-negative number with up to two decimals." });
    }

    const actual = parseNumber(get("actual"));
    if (!actual.ok) {
      errors.push({ row: displayRow, message: "Actual must be a non-negative number with up to two decimals." });
    }

    if (errors.length === 0 || (category && estimated.ok && actual.ok)) {
      if (category && estimated.ok && actual.ok) {
        rows.push({
          category,
          description,
          estimated_cost: estimated.value,
          actual_cost: actual.value,
        });
      }
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors: errors.slice(0, 50) };
  }

  return { ok: true, rows };
}

function parseCsv(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const valid = validateRows(result.data, true);
        resolve(valid);
      },
      error: (err) => {
        resolve({ ok: false, errors: [{ row: 0, message: `CSV parse error: ${err.message}` }] });
      },
    });
  });
}

async function parseXlsx(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    return { ok: false, errors: [{ row: 0, message: "The workbook has no sheets." }] };
  }
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  return validateRows(json, true);
}

export async function parseFile(file: File): Promise<ParseResult> {
  const validMagic = await isMagicBytesValid(file);
  if (!validMagic) {
    return { ok: false, errors: [{ row: 0, message: "The file contents do not match its extension." }] };
  }

  const ext = getExtension(file.name);
  if (ext === ".csv") return parseCsv(file);
  if (ext === ".xlsx") return parseXlsx(file);
  return { ok: false, errors: [{ row: 0, message: "Unsupported file type." }] };
}

export function generateSampleCsv(): string {
  const header = REQUIRED_COLUMNS.join(",");
  const rows = [
    ["Materials", "Steel pipes", "1000", "1200"],
    ["Labor", "Plumbing (8 hrs)", "500", "400"],
    ["Equipment", "Excavator rental", "0", "300"],
    ["Materials", "Concrete", "800", "780"],
    ["Labor", "Electrical wiring", "600", "750"],
  ];
  return [header, ...rows.map((r) => r.join(","))].join("\n");
}

export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
