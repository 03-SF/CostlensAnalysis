import { useEffect, type ReactNode } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <>
      <div className="modal d-block" role="dialog" aria-modal="true" aria-labelledby="cl-modal-title">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content cl-modal">
            <div className="modal-header">
              <h2 className="modal-title h5" id="cl-modal-title">
                {title}
              </h2>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>
            {children}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" onClick={onClose} />
    </>
  );
}
