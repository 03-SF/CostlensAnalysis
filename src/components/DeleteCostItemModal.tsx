import { useState } from "react";
import Modal from "./Modal";
import { deleteCostItem } from "../costs/costItemService";
import type { CostItem } from "../services/calculations";

type DeleteCostItemModalProps = {
  item: CostItem;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteCostItemModal({ item, onClose, onDeleted }: DeleteCostItemModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      await deleteCostItem(item.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Delete cost item" onClose={onClose}>
      <div className="modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <p className="mb-0">
          Delete <strong>{item.category}</strong>
          {item.description ? ` - ${item.description}` : ""}? This cannot be undone.
        </p>
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-outline-dark" onClick={handleDelete} disabled={submitting}>
          {submitting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
