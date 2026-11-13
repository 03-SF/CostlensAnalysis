import type { CalculatedRow, ProjectTotals } from "../services/calculations";
import { formatCurrency, formatPct } from "../services/calculations";

type CostTableProps = {
  rows: CalculatedRow[];
  totals: ProjectTotals;
  onEdit: (row: CalculatedRow) => void;
  onDelete: (row: CalculatedRow) => void;
};

const ANOMALY_THRESHOLD = 50;

export default function CostTable({ rows, totals, onEdit, onDelete }: CostTableProps) {
  if (rows.length === 0) {
    return (
      <div className="cl-empty-state text-center">
        <h2 className="h5 mb-2">No cost items yet</h2>
        <p className="text-secondary mb-0">Add a cost item or upload a file to start comparing estimated and actual costs.</p>
      </div>
    );
  }

  function variancePrefix(variance: number): string {
    if (variance > 0) return "\u25B2 ";
    if (variance < 0) return "\u25BC ";
    return "";
  }

  function isAnomaly(row: CalculatedRow): boolean {
    if (row.pct_variance === null) return false;
    return Math.abs(row.pct_variance) >= ANOMALY_THRESHOLD;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover cl-cost-table align-middle">
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Description</th>
            <th scope="col" className="text-end">Estimated</th>
            <th scope="col" className="text-end">Actual</th>
            <th scope="col" className="text-end">Variance</th>
            <th scope="col" className="text-end">% Var</th>
            <th scope="col" className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const overBudget = row.variance > 0;
            const underBudget = row.variance < 0;
            const anomaly = isAnomaly(row);
            return (
              <tr key={row.id}>
                <td className="fw-semibold">
                  {row.category}
                  {anomaly && (
                    <span className="cl-unusual-badge ms-2">Unusual</span>
                  )}
                </td>
                <td className="text-secondary">{row.description || "\u2014"}</td>
                <td className="text-end tabular-nums">{formatCurrency(row.estimated_cost)}</td>
                <td className="text-end tabular-nums">{formatCurrency(row.actual_cost)}</td>
                <td className={`text-end tabular-nums ${overBudget ? "cl-variance-over" : underBudget ? "cl-variance-under" : ""}`}>
                  {variancePrefix(row.variance)}{formatCurrency(Math.abs(row.variance))}
                </td>
                <td className={`text-end tabular-nums ${overBudget ? "cl-variance-over" : underBudget ? "cl-variance-under" : ""}`}>
                  {formatPct(row.pct_variance)}
                </td>
                <td className="text-center text-nowrap">
                  <button type="button" className="btn btn-sm btn-outline-secondary me-1" onClick={() => onEdit(row)}>
                    Edit
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-dark" onClick={() => onDelete(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="fw-bold">
            <td colSpan={2}>Total ({totals.count} {totals.count === 1 ? "item" : "items"})</td>
            <td className="text-end tabular-nums">{formatCurrency(totals.estimated)}</td>
            <td className="text-end tabular-nums">{formatCurrency(totals.actual)}</td>
            <td className={`text-end tabular-nums ${totals.variance > 0 ? "cl-variance-over" : totals.variance < 0 ? "cl-variance-under" : ""}`}>
              {variancePrefix(totals.variance)}{formatCurrency(Math.abs(totals.variance))}
            </td>
            <td className={`text-end tabular-nums ${totals.variance > 0 ? "cl-variance-over" : totals.variance < 0 ? "cl-variance-under" : ""}`}>
              {formatPct(totals.pct_variance)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
