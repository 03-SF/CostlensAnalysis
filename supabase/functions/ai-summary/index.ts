const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SummaryInput {
  projectName: string;
  itemCount: number;
  totalEstimated: number;
  totalActual: number;
  totalVariance: number;
  pctVariance: number | null;
  overBudgetCategories: Array<{ category: string; variance: number; pctVariance: number | null }>;
  underBudgetCategories: Array<{ category: string; variance: number; pctVariance: number | null }>;
  largestOver: { category: string; variance: number } | null;
  largestUnder: { category: string; variance: number } | null;
}

interface SummaryOutput {
  summary: string;
  source: "ai" | "rules";
}

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(value: number | null): string {
  if (value === null) return "N/A";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function generateRuleSummary(input: SummaryInput): string {
  const {
    projectName,
    itemCount,
    totalEstimated,
    totalActual,
    totalVariance,
    pctVariance,
    overBudgetCategories,
    underBudgetCategories,
    largestOver,
    largestUnder,
  } = input;

  if (itemCount === 0) {
    return `The project "${projectName}" has no cost items yet. Add cost data to get a meaningful budget analysis.`;
  }

  const parts: string[] = [];
  const over = totalVariance > 0;
  const under = totalVariance < 0;
  const onBudget = totalVariance === 0;

  parts.push(
    `The project "${projectName}" tracks ${itemCount} cost ${itemCount === 1 ? "item" : "items"} with a total estimated budget of ${formatCurrency(totalEstimated)} and actual spending of ${formatCurrency(totalActual)}.`
  );

  if (onBudget) {
    parts.push("Actual spending matches the estimated budget exactly.");
  } else if (over) {
    parts.push(
      `The project is over budget by ${formatCurrency(totalVariance)} (${formatPct(pctVariance)}).`
    );
  } else {
    parts.push(
      `The project is under budget by ${formatCurrency(Math.abs(totalVariance))} (${formatPct(pctVariance)}).`
    );
  }

  if (largestOver) {
    parts.push(
      `The biggest overage is in "${largestOver.category}", which exceeds its estimate by ${formatCurrency(largestOver.variance)}.`
    );
  }

  if (largestUnder) {
    parts.push(
      `The biggest saving is in "${largestUnder.category}", which came in ${formatCurrency(Math.abs(largestUnder.variance))} under estimate.`
    );
  }

  if (overBudgetCategories.length > 1) {
    const others = overBudgetCategories
      .filter((c) => c.category !== largestOver?.category)
      .map((c) => `"${c.category}" (${formatPct(c.pctVariance)})`)
      .join(", ");
    if (others) {
      parts.push(`Other categories over budget: ${others}.`);
    }
  }

  if (underBudgetCategories.length > 1) {
    const others = underBudgetCategories
      .filter((c) => c.category !== largestUnder?.category)
      .map((c) => `"${c.category}" (${formatPct(c.pctVariance)})`)
      .join(", ");
    if (others) {
      parts.push(`Other categories under budget: ${others}.`);
    }
  }

  if (over) {
    parts.push(
      `Recommendation: Review the over-budget categories to identify causes and consider corrective action to bring spending back in line with estimates.`
    );
  } else if (under) {
    parts.push(
      `Recommendation: The project is managing costs well. Consider whether the under-budget categories reflect genuine savings or estimates that were too conservative.`
    );
  } else {
    parts.push(
      `Recommendation: The project is on budget. Continue monitoring actual costs as new items are added.`
    );
  }

  return parts.join(" ");
}

async function callAIProvider(input: SummaryInput): Promise<string | null> {
  const apiKey = Deno.env.get("AI_API_KEY");
  if (!apiKey) return null;

  try {
    const prompt = `You are a budget analyst. Write a concise plain-language summary (3-5 sentences) of this project's budget performance for a non-technical manager. Do not use markdown.

Project: ${input.projectName}
Items: ${input.itemCount}
Total estimated: ${input.totalEstimated}
Total actual: ${input.totalActual}
Total variance: ${input.totalVariance}
% variance: ${input.pctVariance ?? "N/A"}
Over-budget categories: ${JSON.stringify(input.overBudgetCategories)}
Under-budget categories: ${JSON.stringify(input.underBudgetCategories)}
Largest over: ${JSON.stringify(input.largestOver)}
Largest under: ${JSON.stringify(input.largestUnder)}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful budget analyst assistant." },
          { role: "user", content: prompt },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim().length > 0 ? text.trim() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const input = await req.json() as SummaryInput;

    if (!input.projectName || typeof input.projectName !== "string") {
      return new Response(JSON.stringify({ error: "Project name is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await callAIProvider(input);
    if (aiResult) {
      const output: SummaryOutput = { summary: aiResult, source: "ai" };
      return new Response(JSON.stringify(output), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ruleSummary = generateRuleSummary(input);
    const output: SummaryOutput = { summary: ruleSummary, source: "rules" };
    return new Response(JSON.stringify(output), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
