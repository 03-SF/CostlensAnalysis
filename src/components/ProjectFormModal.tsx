import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import { createProject, updateProject, type Project } from "../projects/projectService";
import {
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
  validateProjectForm,
  type ProjectFormErrors,
} from "../projects/validation";

type ProjectFormModalProps = {
  project: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
};

export default function ProjectFormModal({ project, onClose, onSaved }: ProjectFormModalProps) {
  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [errors, setErrors] = useState<ProjectFormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = project !== null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = { name: name.trim(), description: description.trim() };
    const validationErrors = validateProjectForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setServerError(null);
    try {
      const saved = project
        ? await updateProject(project.id, values)
        : await createProject(values);
      if (!saved) {
        setServerError("This project no longer exists or you no longer have access to it.");
        return;
      }
      onSaved(saved);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit project" : "New project"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="project-name" className="form-label fw-semibold">
              Project name
            </label>
            <input
              id="project-name"
              type="text"
              className={`form-control ${errors.name ? "is-invalid" : ""}`}
              maxLength={PROJECT_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
            {errors.name && <div className="invalid-feedback">{errors.name}</div>}
          </div>

          <div className="mb-1">
            <label htmlFor="project-description" className="form-label fw-semibold">
              Description <span className="text-secondary fw-normal">(optional)</span>
            </label>
            <textarea
              id="project-description"
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              rows={3}
              maxLength={PROJECT_DESCRIPTION_MAX_LENGTH}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dark" disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Save changes" : "Create project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
