import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
import NotFoundState from "../components/NotFoundState";
import ProjectFormModal from "../components/ProjectFormModal";
import DeleteProjectModal from "../components/DeleteProjectModal";
import CostTable from "../components/CostTable";
import SummaryCards from "../components/SummaryCards";
import CostItemFormModal from "../components/CostItemFormModal";
import DeleteCostItemModal from "../components/DeleteCostItemModal";
import UploadModal from "../components/UploadModal";
import ComparisonBarChart from "../components/ComparisonBarChart";
import ActualShareChart from "../components/ActualShareChart";
import VariancePctChart from "../components/VariancePctChart";
import AISummaryPanel from "../components/AISummaryPanel";
import { generatePdfReport } from "../services/pdfReport";
import { getProject, type Project } from "../projects/projectService";
import { isUuid } from "../projects/validation";
import { listCostItems } from "../costs/costItemService";
import { calcSummary, type CalculatedRow, type CostItem } from "../services/calculations";

type ViewStatus = "loading" | "ready" | "missing" | "error";
type Tab = "items" | "charts" | "ai" | "report";

export default function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const validId = projectId && isUuid(projectId) ? projectId : null;

  const [project, setProject] = useState<Project | null>(null);
  const [status, setStatus] = useState<ViewStatus>("loading");
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [items, setItems] = useState<CostItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<CalculatedRow | null>(null);
  const [deletingItem, setDeletingItem] = useState<CalculatedRow | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [aiSummaryText, setAiSummaryText] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("items");

  useEffect(() => {
    if (!validId) {
      setStatus("missing");
      return;
    }
    let active = true;
    setStatus("loading");
    getProject(validId)
      .then((result) => {
        if (!active) return;
        setProject(result);
        setStatus(result ? "ready" : "missing");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [validId]);

  const loadItems = useCallback(async (id: string) => {
    setItemsLoading(true);
    setItemsError(null);
    try {
      const result = await listCostItems(id);
      setItems(result);
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : "Could not load cost items.");
    } finally {
      setItemsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (validId && status === "ready") loadItems(validId);
  }, [validId, status, loadItems]);

  if (status === "loading") return <LoadingSpinner />;

  if (status === "error") {
    return (
      <div className="container py-5">
        <div className="alert" role="alert">
          We could not load this project. Please refresh the page to try again.
        </div>
      </div>
    );
  }

  if (status === "missing" || !project || !validId) {
    return (
      <NotFoundState
        title="Project not found"
        message="This project does not exist or you do not have access to it."
      />
    );
  }

  const summary = calcSummary(items);
  const hasItems = items.length > 0;

  function handleItemSaved(saved: CostItem) {
    setItems((prev) => {
      const index = prev.findIndex((item) => item.id === saved.id);
      if (index === -1) return [...prev, saved];
      const next = [...prev];
      next[index] = saved;
      return next;
    });
    setShowAddItem(false);
    setEditingItem(null);
  }

  function handleItemDeleted(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setDeletingItem(null);
  }

  function handleDownloadPdf() {
    if (!project) return;
    setPdfLoading(true);
    try {
      generatePdfReport({
        projectName: project.name,
        projectDescription: project.description,
        createdAt: new Date(project.created_at).toLocaleDateString(),
        generatedAt: new Date().toLocaleString(),
        summary,
        aiSummary: aiSummaryText,
      });
    } finally {
      setPdfLoading(false);
    }
  }

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: "items", label: "Items" },
    { key: "charts", label: "Charts" },
    { key: "ai", label: "AI Insights" },
    { key: "report", label: "Report" },
  ];

  return (
    <section className="cl-section">
      <div className="container">
        <Link to="/projects" className="cl-back-link d-inline-block mb-3">
          &larr; All projects
        </Link>

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3 mb-4">
          <div>
            <h1 className="h2 mb-1">{project.name}</h1>
            <p className="text-secondary mb-0">
              Created {new Date(project.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setEditing(true)}>
              Edit details
            </button>
            <button type="button" className="btn btn-outline-dark btn-sm" onClick={() => setDeleting(true)}>
              Delete
            </button>
          </div>
        </div>

        {project.description && (
          <div className="cl-feature-card mb-4">
            <h2 className="h6 text-uppercase text-secondary mb-2">Description</h2>
            <p className="mb-0 text-secondary">{project.description}</p>
          </div>
        )}

        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2 mb-3">
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowUpload(true)}>
              Upload file
            </button>
            <button type="button" className="btn btn-dark btn-sm" onClick={() => setShowAddItem(true)}>
              Add cost item
            </button>
          </div>
        </div>

        {hasItems && (
          <>
            <SummaryCards totals={summary.totals} />

            <div className="cl-tabs mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`cl-tab ${activeTab === tab.key ? "cl-tab-active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === "items" && (
              <>
                {itemsLoading ? (
                  <LoadingSpinner />
                ) : itemsError ? (
                  <div className="alert d-flex justify-content-between align-items-center" role="alert">
                    <span>{itemsError}</span>
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => loadItems(validId)}>
                      Try again
                    </button>
                  </div>
                ) : (
                  <CostTable
                    rows={summary.rows}
                    totals={summary.totals}
                    onEdit={(row) => setEditingItem(row)}
                    onDelete={(row) => setDeletingItem(row)}
                  />
                )}
              </>
            )}

            {activeTab === "charts" && (
              <div className="row g-4">
                <div className="col-12 col-lg-6">
                  <ComparisonBarChart byCategory={summary.byCategory} />
                </div>
                <div className="col-12 col-lg-6">
                  <ActualShareChart byCategory={summary.byCategory} />
                </div>
                <div className="col-12">
                  <VariancePctChart byCategory={summary.byCategory} />
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <AISummaryPanel
                projectName={project.name}
                summary={summary}
                onSummaryGenerated={setAiSummaryText}
              />
            )}

            {activeTab === "report" && (
              <div>
                <p className="text-secondary mb-3">
                  Download a PDF report with your project summary, cost items table, charts data, and AI summary.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleDownloadPdf}
                  disabled={pdfLoading || items.length === 0}
                >
                  {pdfLoading ? "Generating..." : "Download Report"}
                </button>
              </div>
            )}
          </>
        )}

        {!hasItems && !itemsLoading && (
          <div className="cl-empty-state text-center">
            <h2 className="h5 mb-2">No cost items yet</h2>
            <p className="text-secondary mb-4">Add a cost item or upload a spreadsheet to start analyzing your budget.</p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-outline-secondary" onClick={() => setShowUpload(true)}>
                Upload file
              </button>
              <button type="button" className="btn btn-dark" onClick={() => setShowAddItem(true)}>
                Add cost item
              </button>
            </div>
          </div>
        )}

        {itemsLoading && !hasItems && <LoadingSpinner />}
      </div>

      {editing && (
        <ProjectFormModal
          project={project}
          onClose={() => setEditing(false)}
          onSaved={(saved) => {
            setProject(saved);
            setEditing(false);
          }}
        />
      )}

      {deleting && (
        <DeleteProjectModal
          project={project}
          onClose={() => setDeleting(false)}
          onDeleted={() => navigate("/projects")}
        />
      )}

      {showAddItem && (
        <CostItemFormModal
          projectId={validId}
          item={null}
          onClose={() => setShowAddItem(false)}
          onSaved={handleItemSaved}
        />
      )}

      {editingItem && (
        <CostItemFormModal
          projectId={validId}
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={handleItemSaved}
        />
      )}

      {deletingItem && (
        <DeleteCostItemModal
          item={deletingItem}
          onClose={() => setDeletingItem(null)}
          onDeleted={() => handleItemDeleted(deletingItem.id)}
        />
      )}

      {showUpload && (
        <UploadModal
          projectId={validId}
          onClose={() => setShowUpload(false)}
          onImported={() => loadItems(validId)}
        />
      )}
    </section>
  );
}
