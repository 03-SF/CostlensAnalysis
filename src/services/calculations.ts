export type CostItem = {
  id: string;
  project_id: string;
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
  created_at: string;
};

export type CalculatedRow = CostItem & {
  variance: number;
  pct_variance: number | null;
};

export type CategoryTotal = {
  category: string;
  estimated: number;
  actual: number;
  variance: number;
  pct_variance: number | null;
  count: number;
};

export type ProjectTotals = {
  estimated: number;
  actual: number;
  variance: number;
  pct_variance: number | null;
  count: number;
};

export type ProjectSummary = {
  rows: CalculatedRow[];
  totals: ProjectTotals;
  byCategory: CategoryTotal[];
};

export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcVariance(actual: number, estimated: number): number {
  return roundCurrency(actual - estimated);
}

export function calcPctVariance(actual: number, estimated: number): number | null {
  if (estimated === 0) return null;
  return roundCurrency(((actual - estimated) / estimated) * 100);
}

export function calcRow(item: CostItem): CalculatedRow {
  return {
    ...item,
    variance: calcVariance(item.actual_cost, item.estimated_cost),
    pct_variance: calcPctVariance(item.actual_cost, item.estimated_cost),
  };
}

export function calcTotals(items: CostItem[]): ProjectTotals {
  let estimated = 0;
  let actual = 0;
  for (const item of items) {
    estimated += item.estimated_cost;
    actual += item.actual_cost;
  }
  estimated = roundCurrency(estimated);
  actual = roundCurrency(actual);
  return {
    estimated,
    actual,
    variance: roundCurrency(actual - estimated),
    pct_variance: calcPctVariance(actual, estimated),
    count: items.length,
  };
}

export function calcByCategory(items: CostItem[]): CategoryTotal[] {
  const map = new Map<string, { estimated: number; actual: number; count: number }>();
  for (const item of items) {
    const entry = map.get(item.category) ?? { estimated: 0, actual: 0, count: 0 };
    entry.estimated += item.estimated_cost;
    entry.actual += item.actual_cost;
    entry.count += 1;
    map.set(item.category, entry);
  }
  return Array.from(map.entries())
    .map(([category, entry]) => ({
      category,
      estimated: roundCurrency(entry.estimated),
      actual: roundCurrency(entry.actual),
      variance: roundCurrency(entry.actual - entry.estimated),
      pct_variance: calcPctVariance(entry.actual, entry.estimated),
      count: entry.count,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));
}

export function calcSummary(items: CostItem[]): ProjectSummary {
  return {
    rows: items.map(calcRow),
    totals: calcTotals(items),
    byCategory: calcByCategory(items),
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatPct(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
