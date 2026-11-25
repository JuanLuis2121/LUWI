import { AlertIcon } from "../dashboard/icons";

export const MENSAJE_SUSPENDIDO =
  "Tu proceso de formación está suspendido. Contacta a Recursos Humanos.";

/** Aviso informativo (ámbar). */
export function Aviso({ children, className = "" }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-200 ${className}`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <AlertIcon className="h-[18px] w-[18px]" />
      </span>
      <p className="min-w-0 self-center break-words">{children}</p>
    </div>
  );
}

/** Error al cargar datos, con botón para reintentar. */
export function ErrorCarga({ mensaje, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 ring-1 ring-inset ring-red-200"
    >
      <span className="min-w-0 break-words">{mensaje || "No pudimos cargar la información."}</span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-xl bg-white px-3.5 py-1.5 font-semibold text-red-700 shadow-sm ring-1 ring-red-200 hover:bg-red-100"
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
    <div className="space-y-5" role="status" aria-label="Cargando">
      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="h-64 animate-pulse rounded-[28px] bg-white/80" />
        <div className="hidden h-64 animate-pulse rounded-[28px] bg-luwi-profundo/15 xl:block" />
      </div>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-[28px] bg-white/80" />
      ))}
      <span className="sr-only">Cargando…</span>
    </div>
  );
}
