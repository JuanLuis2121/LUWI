import { useEffect } from "react";
import { ActionButton } from "./AdminUI";

export default function ConfirmModal({
  open,
  title = "Confirmar eliminación",
  message,
  confirmLabel = "Eliminar",
  loading = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-admin-ink/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-xl font-extrabold text-admin-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm text-admin-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <ActionButton onClick={onCancel} disabled={loading}>
            Cancelar
          </ActionButton>
          <ActionButton variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Eliminando..." : confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}