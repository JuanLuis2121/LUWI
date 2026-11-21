import { CUENTA, ESTADO_PROCESO, colorAvatar, iniciales } from "../../utils/pipeline";

// Piezas visuales pequeñas del pipeline de postulantes.

export function Avatar({ nombre, size = "md" }) {
  const medidas = size === "lg" ? "h-14 w-14 text-lg rounded-2xl" : size === "sm" ? "h-8 w-8 text-[11px] rounded-lg" : "h-10 w-10 text-sm rounded-xl";
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white shadow-[0_8px_18px_-10px_rgba(11,58,140,0.8)] ${colorAvatar(nombre)} ${medidas}`}
    >
      {iniciales(nombre)}
    </span>
  );
}

function Etiqueta({ cls, children, title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

export function EtiquetaEstado({ estado }) {
  const e = ESTADO_PROCESO[estado];
  if (!e) return null;
  return <Etiqueta cls={e.cls}>{e.label}</Etiqueta>;
}

export function EtiquetaCuenta({ cuenta, corta = false }) {
  const c = CUENTA[cuenta];
  if (!c) return null;
  return (
    <Etiqueta cls={c.cls} title={c.label}>
      {cuenta === "PENDIENTE" && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      )}
      {corta ? c.corto : c.label}
    </Etiqueta>
  );
}

/** Barra de avance con porcentaje. */
export function BarraAvance({ porcentaje = 0, completa = false, mostrarTexto = true }) {
  const valor = Math.max(0, Math.min(100, Math.round(porcentaje)));
  const lleno = completa || valor >= 100;
  return (
    <div className="flex items-center gap-2.5">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
        aria-label="Avance de la ruta"
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-luwi-cristal-fondo"
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-500 ${lleno ? "from-emerald-400 to-emerald-500" : "from-luwi-medio to-luwi-tecno"}`}
          style={{ width: `${valor}%` }}
        />
      </div>
      {mostrarTexto && <span className={`w-9 text-right text-[11px] font-bold ${lleno ? "text-emerald-600" : "text-luwi-profundo"}`}>{valor}%</span>}
    </div>
  );
}

export const UsersIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0113 0" />
    <path d="M16 4.6a3.5 3.5 0 010 6.8M18 14.2a6.5 6.5 0 013.5 5.8" />
  </svg>
);

export const PlayIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M7 4.5v15l12-7.5-12-7.5z" />
  </svg>
);

export const PauseIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" {...p}>
    <path d="M9 5v14M15 5v14" />
  </svg>
);

export const FlagIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </svg>
);

export const RouteMiniIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <circle cx="6" cy="19" r="2.5" />
    <circle cx="18" cy="5" r="2.5" />
    <path d="M8.5 19H15a3.5 3.5 0 000-7H9a3.5 3.5 0 010-7h6.5" />
  </svg>
);
