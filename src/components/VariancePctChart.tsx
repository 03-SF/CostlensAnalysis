import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  type TooltipItem,
} from "chart.js";
import type { CategoryTotal } from "../services/calculations";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip);

type VariancePctChartProps = {
  byCategory: CategoryTotal[];
};

export default function VariancePctChart({ byCategory }: VariancePctChartProps) {
  const sorted = [...byCategory].sort((a, b) => {
    const aVal = a.pct_variance ?? -Infinity;
    const bVal = b.pct_variance ?? -Infinity;
    return bVal - aVal;
  });

  const data = {
    labels: sorted.map((c) => c.category),
    datasets: [
      {
        label: "% variance",
        data: sorted.map((c) => c.pct_variance ?? 0),
        backgroundColor: sorted.map((c) => {
          if (c.pct_variance === null) return "#e5e5e5";
          return c.pct_variance > 0 ? "#0a0a0a" : "#999999";
        }),
        borderColor: sorted.map((c) => {
          if (c.pct_variance === null) return "#e5e5e5";
          return c.pct_variance > 0 ? "#0a0a0a" : "#999999";
        }),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0a0a0a",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          label: (context: TooltipItem<"bar">) => {
            const item = sorted.find((c) => c.category === context.label);
            if (!item || item.pct_variance === null) return "% variance: N/A";
            const sign = item.pct_variance > 0 ? "+" : "";
            return `% variance: ${sign}${item.pct_variance.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          color: "#6b6b6b",
          font: { family: "Inter", size: 11 },
          callback: (value: string | number) => `${Number(value)}%`,
        },
        grid: { color: "#f0f0f0" },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: "#6b6b6b",
          font: { family: "Inter", size: 11 },
        },
      },
    },
  };

  return (
    <div className="cl-chart-container">
      <h2 className="h6 text-uppercase text-secondary mb-3">Variance % by category (sorted)</h2>
      <div style={{ height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
