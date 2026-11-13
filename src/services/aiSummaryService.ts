import { supabase } from "../lib/supabase";
import type { ProjectSummary } from "./calculations";

export type AISummaryResponse = {
  summary: string;
  source: "ai" | "rules";
};

function buildPayload(projectName: string, summary: ProjectSummary) {
  const overBudgetCategories = summary.byCategory
    .filter((c) => c.variance > 0)
    .map((c) => ({ category: c.category, variance: c.variance, pctVariance: c.pct_variance }));

  const underBudgetCategories = summary.byCategory
    .filter((c) => c.variance < 0)
    .map((c) => ({ category: c.category, variance: c.variance, pctVariance: c.pct_variance }));

  const largestOver = overBudgetCategories.length > 0
    ? overBudgetCategories.reduce((max, c) => (c.variance > max.variance ? c : max))
    : null;

  const largestUnder = underBudgetCategories.length > 0
    ? underBudgetCategories.reduce((min, c) => (c.variance < min.variance ? c : min))
    : null;

  return {
    projectName,
    itemCount: summary.totals.count,
    totalEstimated: summary.totals.estimated,
    totalActual: summary.totals.actual,
    totalVariance: summary.totals.variance,
    pctVariance: summary.totals.pct_variance,
    overBudgetCategories,
    underBudgetCategories,
    largestOver: largestOver ? { category: largestOver.category, variance: largestOver.variance } : null,
    largestUnder: largestUnder ? { category: largestUnder.category, variance: largestUnder.variance } : null,
  };
}

export async function fetchAISummary(projectName: string, summary: ProjectSummary): Promise<AISummaryResponse> {
  const payload = buildPayload(projectName, summary);

  const { data, error } = await supabase.functions.invoke<AISummaryResponse>("ai-summary", {
    body: payload,
  });

  if (error) throw new Error("Could not generate the AI summary. Please try again.");
  if (!data || typeof data.summary !== "string") {
    throw new Error("The summary service returned an unexpected response.");
  }

  return data;
}
