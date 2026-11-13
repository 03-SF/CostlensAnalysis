import { describe, it, expect } from "vitest";
import {
  calcVariance,
  calcPctVariance,
  calcRow,
  calcTotals,
  calcByCategory,
  calcSummary,
  roundCurrency,
  formatCurrency,
  formatPct,
  type CostItem,
} from "./calculations";

function item(overrides: Partial<CostItem> = {}): CostItem {
  return {
    id: "test-id",
    project_id: "proj-id",
    category: "Materials",
    description: "",
    estimated_cost: 1000,
    actual_cost: 1200,
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("roundCurrency", () => {
  it("rounds to two decimal places", () => {
    expect(roundCurrency(10.005)).toBe(10.01);
    expect(roundCurrency(10.004)).toBe(10);
    expect(roundCurrency(1234.567)).toBe(1234.57);
  });
});

describe("calcVariance", () => {
  it("returns actual minus estimated", () => {
    expect(calcVariance(1200, 1000)).toBe(200);
    expect(calcVariance(400, 500)).toBe(-100);
    expect(calcVariance(100, 100)).toBe(0);
  });
});

describe("calcPctVariance", () => {
  it("returns percentage when estimated is non-zero", () => {
    expect(calcPctVariance(1200, 1000)).toBe(20);
    expect(calcPctVariance(400, 500)).toBe(-20);
  });

  it("returns null when estimated is zero (N/A case)", () => {
    expect(calcPctVariance(300, 0)).toBeNull();
  });
});

describe("calcRow", () => {
  it("computes variance and pct_variance for an item", () => {
    const row = calcRow(item({ estimated_cost: 1000, actual_cost: 1200 }));
    expect(row.variance).toBe(200);
    expect(row.pct_variance).toBe(20);
  });

  it("returns null pct_variance when estimated is zero", () => {
    const row = calcRow(item({ estimated_cost: 0, actual_cost: 300 }));
    expect(row.variance).toBe(300);
    expect(row.pct_variance).toBeNull();
  });
});

describe("calcTotals", () => {
  it("sums estimated and actual across items", () => {
    const items = [
      item({ id: "1", estimated_cost: 1000, actual_cost: 1200 }),
      item({ id: "2", estimated_cost: 500, actual_cost: 400 }),
    ];
    const totals = calcTotals(items);
    expect(totals.estimated).toBe(1500);
    expect(totals.actual).toBe(1600);
    expect(totals.variance).toBe(100);
    expect(totals.pct_variance).toBeCloseTo(6.67, 1);
    expect(totals.count).toBe(2);
  });

  it("returns null pct_variance when total estimated is zero", () => {
    const totals = calcTotals([item({ estimated_cost: 0, actual_cost: 300 })]);
    expect(totals.pct_variance).toBeNull();
  });

  it("returns zero totals for an empty list", () => {
    const totals = calcTotals([]);
    expect(totals.estimated).toBe(0);
    expect(totals.actual).toBe(0);
    expect(totals.variance).toBe(0);
    expect(totals.pct_variance).toBeNull();
    expect(totals.count).toBe(0);
  });
});

describe("calcByCategory", () => {
  it("groups items by category and sorts alphabetically", () => {
    const items = [
      item({ id: "1", category: "Materials", estimated_cost: 1000, actual_cost: 1200 }),
      item({ id: "2", category: "Labor", estimated_cost: 500, actual_cost: 400 }),
      item({ id: "3", category: "Materials", estimated_cost: 200, actual_cost: 250 }),
    ];
    const byCategory = calcByCategory(items);
    expect(byCategory).toHaveLength(2);
    expect(byCategory[0].category).toBe("Labor");
    expect(byCategory[1].category).toBe("Materials");
    expect(byCategory[1].estimated).toBe(1200);
    expect(byCategory[1].actual).toBe(1450);
    expect(byCategory[1].count).toBe(2);
  });
});

describe("calcSummary", () => {
  it("returns rows, totals, and byCategory together", () => {
    const items = [
      item({ id: "1", estimated_cost: 1000, actual_cost: 1200 }),
      item({ id: "2", estimated_cost: 500, actual_cost: 400 }),
    ];
    const summary = calcSummary(items);
    expect(summary.rows).toHaveLength(2);
    expect(summary.totals.estimated).toBe(1500);
    expect(summary.byCategory).toHaveLength(1);
  });
});

describe("formatCurrency", () => {
  it("formats with two decimal places", () => {
    expect(formatCurrency(1200)).toBe("1,200.00");
    expect(formatCurrency(0)).toBe("0.00");
  });
});

describe("formatPct", () => {
  it("shows N/A for null", () => {
    expect(formatPct(null)).toBe("N/A");
  });

  it("shows a plus sign for positive values", () => {
    expect(formatPct(20)).toBe("+20.0%");
  });

  it("shows no plus for negative values", () => {
    expect(formatPct(-20)).toBe("-20.0%");
  });
});
