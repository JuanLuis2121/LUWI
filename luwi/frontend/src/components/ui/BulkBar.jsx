import { createPortal } from "react-dom";

/**
 * Barra flotante de acciones masivas (aparece al seleccionar filas).
 * - count: cuántos registros hay seleccionados.
 * - actions: [{ key, label, icon, onClick, danger? }]
 * - onClear: deseleccionar todo.
 */
export default function BulkBar({ count, actions, onClear }) {
  if (!count) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 font-poppins lg:pl-64">
      <div
        role="toolbar"
        aria-label="Acciones para la selección"
        className="pointer-events-auto flex items-center gap-1 rounded-2xl bg-[linear-gradient(135deg,#0B3A8C_0%,#082C6E_60%,#061A45_100%)] p-1.5 pl-4 text-white shadow-[0_24px_50px_-16px_rgba(6,26,69,0.7)] animate-[entrar-toast_200ms_ease-out] motion-reduce:animate-none"
      >
        <span className="mr-2 flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-luwi-tecno px-1.5 text-xs">{count}</span>
          {count === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <span aria-hidden="true" className="mx-1 h-6 w-px bg-white/15" />
        {actions.map(({ key, label, icon: Icon, onClick, danger }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 ${
              danger ? "text-red-200 hover:bg-red-500/20 hover:text-white" : "text-white/85 hover:bg-white/10 hover:text-white"
            }`}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={onClear}
          aria-label="Quitar selección"
          title="Quitar selección (Esc)"
          className="ml-1 rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
