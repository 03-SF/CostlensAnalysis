import { describe, it, expect } from "vitest";
import {
  validateAndParseCostItem,
  emptyCostItemForm,
} from "./validation";

describe("validateAndParseCostItem", () => {
  it("accepts valid input", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "1000",
      actual_cost: "1200",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.category).toBe("Materials");
      expect(result.values.estimated_cost).toBe(1000);
      expect(result.values.actual_cost).toBe(1200);
    }
  });

  it("rejects empty category", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "  ",
      estimated_cost: "100",
      actual_cost: "100",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.category).toBeDefined();
    }
  });

  it("rejects negative costs", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "-50",
      actual_cost: "100",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.estimated_cost).toBeDefined();
    }
  });

  it("rejects non-numeric text in cost fields", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "abc",
      actual_cost: "100",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.estimated_cost).toBeDefined();
    }
  });

  it("rejects more than two decimal places", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "100.123",
      actual_cost: "100",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.estimated_cost).toBeDefined();
    }
  });

  it("accepts empty actual_cost as 0 is not allowed - empty is rejected", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "100",
      actual_cost: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.actual_cost).toContain("required");
    }
  });

  it("accepts actual_cost of 0", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "Materials",
      estimated_cost: "100",
      actual_cost: "0",
    });
    expect(result.ok).toBe(true);
  });

  it("trims whitespace from category and description", () => {
    const result = validateAndParseCostItem({
      ...emptyCostItemForm,
      category: "  Materials  ",
      description: "  Steel pipes  ",
      estimated_cost: "100",
      actual_cost: "100",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.values.category).toBe("Materials");
      expect(result.values.description).toBe("Steel pipes");
    }
  });
});
