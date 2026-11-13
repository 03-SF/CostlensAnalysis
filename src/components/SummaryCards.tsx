import type { ProjectTotals } from "../services/calculations";
import { formatCurrency, formatPct } from "../services/calculations";

type SummaryCardsProps = {
  totals: ProjectTotals;
};

export default function SummaryCards({ totals }: SummaryCardsProps) {
  const overBudget = totals.variance > 0;
  const underBudget = totals.variance < 0;

  const cards = [
    {
      label: "Total estimated",
      value: formatCurrency(totals.estimated),
      variant: "neutral",
    },
    {
      label: "Total actual",
      value: formatCurrency(totals.actual),
      variant: "neutral",
    },
    {
      label: "Total variance",
      value: `${overBudget ? "\u25B2 " : underBudget ? "\u25BC " : ""}${formatCurrency(Math.abs(totals.variance))}`,
      variant: overBudget ? "over" : underBudget ? "under" : "neutral",
    },
    {
      label: "% variance",
      value: formatPct(totals.pct_variance),
      variant: overBudget ? "over" : underBudget ? "under" : "neutral",
    },
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card) => (
        <div className="col-6 col-lg-3" key={card.label}>
          <div className={`cl-summary-card cl-summary-${card.variant}`}>
            <span className="cl-summary-label">{card.label}</span>
            <span className="cl-summary-value">{card.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
