import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Ventana modal con el estilo de LUWI (misma base visual que ConfirmModal).
 * - icon: componente de ícono para el encabezado.
 * - tono: "azul" | "verde" | "ambar" (color del ícono).
 * - footer: botones al pie.
 * Se cierra con Escape o haciendo clic en el fondo (salvo si `bloqueado`).
 */
const TONOS = {
  azul: "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_10px_20px_-8px_rgba(0,110,230,0.7)]",
  verde: "bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100",
  ambar: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
};

export default function ModalLuwi({ open, onClose, title, subtitle, icon: Icon, tono = "azul", footer, bloqueado = false, ancho = "max-w-lg", children }) {
  const cerrarRef = useRef(onClose);
  cerrarRef.current = onClose;
  const bloqueadoRef = useRef(bloqueado);
  bloqueadoRef.current = bloqueado;
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const alTeclear = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        if (!bloqueadoRef.current) cerrarRef.current();
      }
    };
    window.addEventListener("keydown", alTeclear, true);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-luwi-noche/40 p-4 font-poppins backdrop-blur-sm"
      onClick={() => !bloqueado && onClose()}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[calc(100vh-2rem)] w-full flex-col rounded-[28px] border border-white bg-white shadow-[0_30px_80px_-20px_rgba(6,26,69,0.45)] outline-none animate-[entrar-toast_200ms_ease-out] motion-reduce:animate-none ${ancho}`}
      >
        <header className="flex items-start gap-4 px-7 pb-2 pt-7">
          {Icon && (
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TONOS[tono] ?? TONOS.azul}`}>
              <Icon className="h-[22px] w-[22px]" />
            </span>
          )}
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-bold leading-tight text-luwi-profundo">{title}</h2>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-luwi-texto">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={bloqueado}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 rounded-lg p-2 text-luwi-texto/60 transition hover:bg-luwi-panel hover:text-luwi-profundo disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-4">{children}</div>

        {footer && <footer className="flex flex-wrap justify-end gap-3 px-7 pb-7 pt-2">{footer}</footer>}
      </div>
    </div>,
    document.body
  );
}
