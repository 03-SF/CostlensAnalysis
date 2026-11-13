import { useState, type FormEvent } from "react";
import Modal from "./Modal";
import { createCostItem, updateCostItem, type CostItemInput } from "../costs/costItemService";
import {
  CATEGORY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  emptyCostItemForm,
  validateAndParseCostItem,
  type CostItemFormValues,
} from "../costs/validation";
import type { CostItem } from "../services/calculations";

type CostItemFormModalProps = {
  projectId: string;
  item: CostItem | null;
  onClose: () => void;
  onSaved: (item: CostItem) => void;
};

function valuesFromItem(item: CostItem | null): CostItemFormValues {
  if (!item) return { ...emptyCostItemForm };
  return {
    category: item.category,
    description: item.description,
    estimated_cost: String(item.estimated_cost),
    actual_cost: String(item.actual_cost),
  };
}

export default function CostItemFormModal({ projectId, item, onClose, onSaved }: CostItemFormModalProps) {
  const [values, setValues] = useState<CostItemFormValues>(valuesFromItem(item));
  const [errors, setErrors] = useState<Partial<Record<keyof CostItemFormValues, string>>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = item !== null;

  function updateField(field: keyof CostItemFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateAndParseCostItem(values);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      const input: CostItemInput = result.values;
      const saved = item
        ? await updateCostItem(item.id, input)
        : await createCostItem(projectId, input);
      if (!saved) {
        setServerError("This cost item no longer exists or you no longer have access to it.");
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
    <Modal title={isEditing ? "Edit cost item" : "Add cost item"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="modal-body">
          {serverError && (
            <div className="alert alert-danger" role="alert">
              {serverError}
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="cost-category" className="form-label fw-semibold">
              Category
            </label>
            <input
              id="cost-category"
              type="text"
              className={`form-control ${errors.category ? "is-invalid" : ""}`}
              maxLength={CATEGORY_MAX_LENGTH}
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              autoFocus
            />
            {errors.category && <div className="invalid-feedback">{errors.category}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="cost-description" className="form-label fw-semibold">
              Description <span className="text-secondary fw-normal">(optional)</span>
            </label>
            <input
              id="cost-description"
              type="text"
              className={`form-control ${errors.description ? "is-invalid" : ""}`}
              maxLength={DESCRIPTION_MAX_LENGTH}
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
            {errors.description && <div className="invalid-feedback">{errors.description}</div>}
          </div>

          <div className="row g-3">
            <div className="col-sm-6">
              <label htmlFor="cost-estimated" className="form-label fw-semibold">
                Estimated cost
              </label>
              <input
                id="cost-estimated"
                type="text"
                inputMode="decimal"
                className={`form-control ${errors.estimated_cost ? "is-invalid" : ""}`}
                placeholder="0.00"
                value={values.estimated_cost}
                onChange={(event) => updateField("estimated_cost", event.target.value)}
              />
              {errors.estimated_cost && <div className="invalid-feedback">{errors.estimated_cost}</div>}
            </div>
            <div className="col-sm-6">
              <label htmlFor="cost-actual" className="form-label fw-semibold">
                Actual cost
              </label>
              <input
                id="cost-actual"
                type="text"
                inputMode="decimal"
                className={`form-control ${errors.actual_cost ? "is-invalid" : ""}`}
                placeholder="0.00"
                value={values.actual_cost}
                onChange={(event) => updateField("actual_cost", event.target.value)}
              />
              {errors.actual_cost && <div className="invalid-feedback">{errors.actual_cost}</div>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-dark" disabled={submitting}>
            {submitting ? "Saving..." : isEditing ? "Save changes" : "Add item"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
