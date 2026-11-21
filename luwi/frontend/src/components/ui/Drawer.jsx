import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Panel lateral derecho para ver un registro sin salir del listado.
 * Se cierra con Escape, con la × o haciendo clic en el fondo.
 * - title / subtitle / icon: encabezado del panel.
 * - footer: botones al pie (ej. "Editar", "Abrir ficha").
 */
export default function Drawer({ open, onClose, title, subtitle, icon: Icon, footer, children }) {
  const panelRef = useRef(null);
  const cerrarRef = useRef(onClose);
  cerrarRef.current = onClose;

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return undefined;
    const alTeclear = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        cerrarRef.current();
      }
    };
    window.addEventListener("keydown", alTeclear, true);
    return () => window.removeEventListener("keydown", alTeclear, true);
  }, [open]);

  // Bloquear el desplazamiento de la página mientras está abierto
  useEffect(() => {
    if (!open) return undefined;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 font-poppins">
      <div onClick={onClose} className="absolute inset-0 bg-luwi-noche/30 backdrop-blur-[2px]" />

      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-[480px] flex-col bg-white shadow-[-30px_0_80px_-30px_rgba(6,26,69,0.5)] outline-none animate-[entrar-drawer_220ms_ease-out] motion-reduce:animate-none"
      >
        <header className="relative overflow-hidden border-b border-luwi-linea/70 bg-[radial-gradient(ellipse_at_100%_0%,#DCEBFF_0%,#FFFFFF_70%)] px-6 pb-5 pt-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_10px_20px_-8px_rgba(0,110,230,0.7)]">
                <Icon className="h-[22px] w-[22px]" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-lg font-bold leading-tight text-luwi-profundo">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-luwi-texto">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel"
              title="Cerrar (Esc)"
              className="-mr-2 -mt-1 rounded-lg p-2 text-luwi-texto/60 transition hover:bg-luwi-panel hover:text-luwi-profundo focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-luwi-linea/70 bg-luwi-panel/50 px-6 py-4">{footer}</footer>}
      </aside>
    </div>,
    document.body
  );
}

/** Fila "etiqueta / valor" para el contenido del panel. */
export function DrawerField({ label, children }) {
  return (
    <div className="border-b border-luwi-linea/60 py-3 last:border-0">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">{label}</dt>
      <dd className="mt-1 break-words text-sm text-luwi-profundo">{children || "—"}</dd>
    </div>
  );
}
