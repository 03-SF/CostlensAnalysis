import { useState } from "react";
import Modal from "./Modal";
import { deleteProject, type Project } from "../projects/projectService";

type DeleteProjectModalProps = {
  project: Project;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteProjectModal({ project, onClose, onDeleted }: DeleteProjectModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteProject(project.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Delete project" onClose={onClose}>
      <div className="modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <p className="mb-0">
          Are you sure you want to delete <strong>{project.name}</strong>? This cannot be undone.
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-outline-dark" onClick={handleDelete} disabled={submitting}>
          {submitting ? "Deleting..." : "Delete project"}
        </button>
      </div>
    </Modal>
  );
}
