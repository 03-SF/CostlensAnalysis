export const CATEGORY_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 500;
export const COST_MAX_VALUE = 9999999999.99;
export const COST_DECIMAL_PLACES = 2;

export type CostItemFormValues = {
  category: string;
  description: string;
  estimated_cost: string;
  actual_cost: string;
};

export type CostItemFormErrors = Partial<
  Record<keyof CostItemFormValues, string>
>;

export type ParsedCostItem = {
  category: string;
  description: string;
  estimated_cost: number;
  actual_cost: number;
};

export type ParseResult =
  | { ok: true; values: ParsedCostItem }
  | { ok: false; errors: CostItemFormErrors };

export const emptyCostItemForm: CostItemFormValues = {
  category: "",
  description: "",
  estimated_cost: "",
  actual_cost: "",
};

function parseCost(raw: string): { ok: true; value: number } | { ok: false; reason: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false, reason: "This field is required." };
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { ok: false, reason: "Enter a positive number with up to two decimals." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return { ok: false, reason: "Enter a valid number." };
  if (value < 0) return { ok: false, reason: "Cost cannot be negative." };
  if (value > COST_MAX_VALUE) return { ok: false, reason: `Cost must be ${COST_MAX_VALUE} or less.` };
  return { ok: true, value: Math.round((value + Number.EPSILON) * 100) / 100 };
}

export function validateAndParseCostItem(values: CostItemFormValues): ParseResult {
  const errors: CostItemFormErrors = {};

  const category = values.category.trim();
  if (!category) {
    errors.category = "Category is required.";
  } else if (category.length > CATEGORY_MAX_LENGTH) {
    errors.category = `Category must be ${CATEGORY_MAX_LENGTH} characters or fewer.`;
  }

  const description = values.description.trim();
  if (description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  const estimated = parseCost(values.estimated_cost);
  if (!estimated.ok) errors.estimated_cost = estimated.reason;

  const actual = parseCost(values.actual_cost);
  if (!actual.ok) errors.actual_cost = actual.reason;

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    values: {
      category,
      description,
      estimated_cost: (estimated as { ok: true; value: number }).value,
      actual_cost: (actual as { ok: true; value: number }).value,
    },
  };
}
