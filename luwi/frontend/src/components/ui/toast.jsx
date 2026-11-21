import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

// Sistema de notificaciones tipo "toast" (esquina inferior derecha).
// Uso: const toast = useToast(); toast({ title, description, variant, action, duration, onExpire });
// - variant: "success" | "error" | "info"
// - action: { label, onClick } → botón dentro del toast (ej. "Deshacer"). Al pulsarlo NO se ejecuta onExpire.
// - onExpire: se ejecuta cuando el toast se cierra solo o con la ×, sin haber pulsado la acción.

const ToastContext = createContext(null);

const ESTILOS = {
  success: { barra: "bg-emerald-500", icono: "bg-emerald-50 text-emerald-600", path: "M5 12l5 5L20 7" },
  error: { barra: "bg-red-500", icono: "bg-red-50 text-red-600", path: "M12 8v5M12 16.5v.01M12 3l9.5 17H2.5L12 3z" },
  info: { barra: "bg-luwi-tecno", icono: "bg-luwi-cristal-fondo text-luwi-medio", path: "M12 11v5M12 7.5v.01M12 21a9 9 0 100-18 9 9 0 000 18z" },
};

function ToastItem({ toast, onClose }) {
  const [pausado, setPausado] = useState(false);
  const restante = useRef(toast.duration);
  const inicio = useRef(Date.now());
  const estilo = ESTILOS[toast.variant] ?? ESTILOS.info;

  // Temporizador que se detiene mientras el mouse está encima
  useEffect(() => {
    if (pausado) return undefined;
    inicio.current = Date.now();
    const t = setTimeout(() => onClose(toast.id, "expire"), restante.current);
    return () => {
      clearTimeout(t);
      restante.current -= Date.now() - inicio.current;
    };
  }, [pausado, toast.id, onClose]);

  return (
    <div
      role={toast.variant === "error" ? "alert" : "status"}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      className="pointer-events-auto relative w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-luwi-linea/80 bg-white font-poppins shadow-[0_20px_50px_-16px_rgba(6,26,69,0.45)] animate-[entrar-toast_220ms_ease-out] motion-reduce:animate-none"
    >
      <div className="flex items-start gap-3 p-4 pr-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${estilo.icono}`}>
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={estilo.path} />
          </svg>
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm font-semibold text-luwi-profundo">{toast.title}</p>
          {toast.description && <p className="mt-0.5 break-words text-xs text-luwi-texto">{toast.description}</p>}
        </div>
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action.onClick?.();
              onClose(toast.id, "action");
            }}
            className="shrink-0 rounded-lg bg-luwi-cristal-fondo px-3 py-1.5 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-profundo hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
          >
            {toast.action.label}
          </button>
        )}
        <button
          type="button"
          onClick={() => onClose(toast.id, "dismiss")}
          aria-label="Cerrar notificación"
          className="shrink-0 rounded-lg p-1 text-luwi-texto/50 transition hover:bg-luwi-panel hover:text-luwi-profundo"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
      {/* Barra de tiempo restante */}
      <div className="h-1 bg-luwi-panel">
        <div
          className={`h-full ${estilo.barra} origin-left animate-[vaciar-toast_linear_forwards] motion-reduce:animate-none`}
          style={{ animationDuration: `${toast.duration}ms`, animationPlayState: pausado ? "paused" : "running" }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const registro = useRef(new Map());

  const cerrar = useCallback((id, motivo) => {
    const t = registro.current.get(id);
    if (!t) return;
    registro.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
    if (motivo !== "action") t.onExpire?.();
  }, []);

  const toast = useCallback(({ title, description, variant = "info", action, duration = 5000, onExpire }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const nuevo = { id, title, description, variant, action, duration, onExpire };
    registro.current.set(id, nuevo);
    setToasts((prev) => [...prev.slice(-3), nuevo]);
    return id;
  }, []);

  const valor = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col items-end gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={cerrar} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  return ctx;
}
