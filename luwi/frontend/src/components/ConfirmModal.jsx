import { useEffect } from "react";
import { ActionButton } from "./AdminUI";

export default function ConfirmModal({
  open,
  title = "Confirmar eliminación",
  message,
  confirmLabel = "Eliminar",
  loadingLabel = "Eliminando...",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-luwi-noche/40 p-4 font-poppins backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[28px] border border-white bg-white p-7 shadow-[0_30px_80px_-20px_rgba(15,20,76,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 ring-1 ring-inset ring-red-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3l9.5 17H2.5L12 3z" />
            <path d="M12 10v4M12 17.5v.01" />
          </svg>
        </span>
        <h2 id="confirm-title" className="mt-4 text-lg font-bold text-luwi-profundo">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-luwi-texto">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <ActionButton onClick={onCancel} disabled={loading}>
            Cancelar
          </ActionButton>
          <ActionButton variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? loadingLabel : confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}