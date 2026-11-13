import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import type { CategoryTotal } from "../services/calculations";
import { formatCurrency } from "../services/calculations";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type ComparisonBarChartProps = {
  byCategory: CategoryTotal[];
};

export default function ComparisonBarChart({ byCategory }: ComparisonBarChartProps) {
  const labels = byCategory.map((c) => c.category);
  const data = {
    labels,
    datasets: [
      {
        label: "Estimated",
        data: byCategory.map((c) => c.estimated),
        backgroundColor: "#e5e5e5",
        borderColor: "#e5e5e5",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Actual",
        data: byCategory.map((c) => c.actual),
        backgroundColor: "#0a0a0a",
        borderColor: "#0a0a0a",
        borderWidth: 1,
        borderRadius: 4,
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
          usePointStyle: true,
          pointStyle: "rectRounded" as const,
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
          label: (context: TooltipItem<"bar">) =>
            `${context.dataset.label}: ${formatCurrency(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#f0f0f0" },
        ticks: {
          color: "#6b6b6b",
          font: { family: "Inter", size: 11 },
          callback: (value: string | number) => formatCurrency(Number(value)),
        },
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
      <h2 className="h6 text-uppercase text-secondary mb-3">Estimated vs actual by category</h2>
      <div style={{ height: "300px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
