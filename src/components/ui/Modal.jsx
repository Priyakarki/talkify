import { useEffect, useRef } from "react";
import { TriangleAlert, X } from "lucide-react";
import Button from "./Button";

export default function Modal({ open, onClose, title, description, children, footer, size = "sm" }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        ref={dialogRef}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Close dialog">
          <X size={18} />
        </button>
        {children}
        {title && (
          <h2 id="modal-title" className="modal__title">
            {title}
          </h2>
        )}
        {description && <p className="modal__text">{description}</p>}
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="modal__icon modal__icon--danger">
        <TriangleAlert size={22} aria-hidden="true" />
      </div>
    </Modal>
  );
}
