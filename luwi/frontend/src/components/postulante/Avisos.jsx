import { AlertIcon } from "../dashboard/icons";

export const MENSAJE_SUSPENDIDO =
  "Tu proceso de formación está suspendido. Contacta a Recursos Humanos.";

/** Aviso informativo (ámbar). */
export function Aviso({ children, className = "" }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 ${className}`}
    >
      <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="min-w-0 break-words">{children}</p>
    </div>
  );
}

/** Error al cargar datos, con botón para reintentar. */
export function ErrorCarga({ mensaje, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
    >
      <span className="min-w-0 break-words">{mensaje || "No pudimos cargar la información."}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 shadow-sm hover:bg-red-100"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}

/** Esqueleto de carga. */
export function Cargando({ filas = 3 }) {
  return (
    <div className="space-y-4" role="status" aria-label="Cargando">
      <div className="h-36 animate-pulse rounded-3xl bg-white shadow-card" />
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-white shadow-card" />
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
