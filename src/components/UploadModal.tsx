import { useRef, useState } from "react";
import Modal from "./Modal";
import {
  validateFile,
  parseFile,
  generateSampleCsv,
  downloadFile,
  type ParseError,
  type ParsedCostRow,
} from "../services/fileParser";
import { bulkInsertCostItems, type CostItemInput } from "../costs/costItemService";

type UploadModalProps = {
  projectId: string;
  onClose: () => void;
  onImported: () => void;
};

type Stage = "select" | "parsing" | "preview" | "importing" | "done";

export default function UploadModal({ projectId, onClose, onImported }: UploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("select");
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<ParseError[]>([]);
  const [preview, setPreview] = useState<ParsedCostRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);

  function handleSampleClick() {
    downloadFile("costlens-sample.csv", generateSampleCsv(), "text/csv");
  }

  async function handleFile(file: File) {
    setError(null);
    setRowErrors([]);

    const validation = validateFile(file);
    if (!validation.ok) {
      setError(validation.error);
      setStage("select");
      return;
    }

    setStage("parsing");
    const result = await parseFile(file);
    if (!result.ok) {
      setRowErrors(result.errors);
      setStage("select");
      return;
    }

    setPreview(result.rows);
    setStage("preview");
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  async function handleImport() {
    setImporting(true);
    setStage("importing");
    try {
      const inputs: CostItemInput[] = preview.map((row) => ({
        category: row.category,
        description: row.description,
        estimated_cost: row.estimated_cost,
        actual_cost: row.actual_cost,
      }));
      await bulkInsertCostItems(projectId, inputs);
      setStage("done");
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not import the file. Please try again.");
      setStage("preview");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setStage("select");
    setError(null);
    setRowErrors([]);
    setPreview([]);
  }

  return (
    <Modal title="Upload cost data" onClose={onClose}>
      {stage === "done" ? (
        <div className="modal-body">
          <div className="text-center py-3">
            <div className="mb-3 text-success" style={{ fontSize: "3rem" }} aria-hidden="true">
              \u2713
            </div>
            <h2 className="h5 mb-2">Import complete</h2>
            <p className="text-secondary mb-4">{preview.length} items were added to this project.</p>
            <button type="button" className="btn btn-dark" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="modal-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {rowErrors.length > 0 && (
              <div className="alert alert-warning" role="alert">
                <p className="fw-semibold mb-2">Some rows could not be imported:</p>
                <ul className="mb-0 ps-3">
                  {rowErrors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      {err.row === 0 ? "File: " : `Row ${err.row}: `}
                      {err.message}
                    </li>
                  ))}
                  {rowErrors.length > 10 && (
                    <li className="text-secondary">...and {rowErrors.length - 10} more.</li>
                  )}
                </ul>
              </div>
            )}

            {(stage === "select" || stage === "parsing") && (
              <>
                <div
                  className={`cl-dropzone ${dragOver ? "cl-dropzone-active" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                  }}
                >
                  {stage === "parsing" ? (
                    <p className="mb-0 text-secondary">
                      <span className="spinner-border spinner-border-sm me-2" />
                      Parsing file...
                    </p>
                  ) : (
                    <>
                      <p className="mb-1 fw-semibold">Drop a .csv or .xlsx file here</p>
                      <p className="text-secondary mb-0">or click to browse</p>
                    </>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  className="d-none"
                  onChange={handleInputChange}
                />
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-secondary small">
                    Max 2 MB, up to 5,000 rows. Columns: category, description, estimated, actual.
                  </span>
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={handleSampleClick}>
                    Download sample
                  </button>
                </div>
              </>
            )}

            {stage === "preview" && (
              <div>
                <p className="text-secondary mb-3">
                  {preview.length} {preview.length === 1 ? "row" : "rows"} ready to import. Review below before confirming.
                </p>
                <div className="table-responsive" style={{ maxHeight: "300px" }}>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th>Description</th>
                        <th className="text-end">Estimated</th>
                        <th className="text-end">Actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 20).map((row, i) => (
                        <tr key={i}>
                          <td>{row.category}</td>
                          <td className="text-secondary">{row.description || "—"}</td>
                          <td className="text-end">{row.estimated_cost.toFixed(2)}</td>
                          <td className="text-end">{row.actual_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {preview.length > 20 && (
                  <p className="text-secondary small mb-0">
                    Showing first 20 of {preview.length} rows.
                  </p>
                )}
              </div>
            )}
          </div>

          {(stage === "preview" || stage === "importing") && (
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={reset} disabled={importing}>
                Choose different file
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleImport}
                disabled={importing}
              >
                {importing ? "Importing..." : `Upload & Analyze`}
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
