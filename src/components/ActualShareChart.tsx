import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type TooltipItem } from "chart.js";
import type { CategoryTotal } from "../services/calculations";
import { formatCurrency } from "../services/calculations";

ChartJS.register(ArcElement, Tooltip, Legend);

type ActualShareChartProps = {
  byCategory: CategoryTotal[];
};

const GRAYSCALE_RAMP = [
  "#0a0a0a",
  "#333333",
  "#555555",
  "#777777",
  "#999999",
  "#aaaaaa",
  "#bbbbbb",
  "#cccccc",
  "#dddddd",
  "#e5e5e5",
];

export default function ActualShareChart({ byCategory }: ActualShareChartProps) {
  const total = byCategory.reduce((sum, c) => sum + c.actual, 0);

  const data = {
    labels: byCategory.map((c) => c.category),
    datasets: [
      {
        data: byCategory.map((c) => c.actual),
        backgroundColor: byCategory.map((_, i) => GRAYSCALE_RAMP[i % GRAYSCALE_RAMP.length]),
        borderWidth: 2,
        borderColor: "#ffffff",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#6b6b6b",
          font: { size: 12, family: "Inter", weight: 600 },
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: "#0a0a0a",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (context: TooltipItem<"doughnut">) => {
            const pct = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : "0";
            return `${context.label}: ${formatCurrency(context.parsed)} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="cl-chart-container">
      <h2 className="h6 text-uppercase text-secondary mb-3">Share of actual cost</h2>
      <div style={{ height: "300px" }}>
        {total > 0 ? (
          <Doughnut data={data} options={options} />
        ) : (
          <div className="cl-empty-state text-center">
            <p className="text-secondary mb-0">No actual costs to display.</p>
          </div>
        )}
      </div>
    </div>
  );
}
