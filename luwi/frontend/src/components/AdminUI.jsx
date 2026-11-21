import { Link } from "react-router-dom";

// Piezas visuales compartidas por las pantallas de administración
// (Empresas, Puestos, Cursos, Rutas y sus formularios).

// ---------- Botones ----------

const variants = {
  primary:
    "border-transparent bg-gradient-to-r from-luwi-profundo via-luwi-medio to-luwi-tecno text-white shadow-[0_10px_24px_-10px_rgba(11,58,140,0.75)] hover:-translate-y-0.5 hover:brightness-110",
  secondary:
    "border-luwi-linea bg-white text-luwi-texto hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo hover:text-luwi-profundo",
  edit: "border-luwi-cristal bg-luwi-cristal-fondo text-luwi-medio hover:border-luwi-tecno/50 hover:bg-luwi-cristal hover:text-luwi-profundo",
  danger: "border-red-100 bg-white text-red-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600",
};

const sizes = {
  md: "h-11 px-5 text-sm",
  sm: "h-9 min-w-9 px-2.5 text-xs",
};

export function ActionButton({
  variant = "secondary",
  size = "md",
  to,
  className = "",
  children,
  ...props
}) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-xl border font-semibold transition duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/25 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

// ---------- Etiquetas ----------

export function Badge({ children }) {
  return (
    <span className="inline-block max-w-full truncate whitespace-nowrap rounded-lg bg-luwi-cristal-fondo px-2.5 py-1 align-middle text-xs font-medium text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
      {children}
    </span>
  );
}

// Círculo/ícono de la primera columna de las tablas.
export function Bubble({ children }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-cristal to-white text-sm font-bold text-luwi-medio ring-1 ring-inset ring-luwi-linea">
      {children}
    </span>
  );
}

// ---------- Encabezado de página ----------

/**
 * Encabezado de las pantallas de listado.
 * - icon: componente de ícono (recibe className).
 * - seccion: texto pequeño encima del título (ej. "Organización").
 * - stats: [{ label, value }] tarjetas pequeñas con cifras.
 * - action: botón o enlace principal (ej. "Nueva empresa").
 */
export function PageHeader({ icon: IconCmp, seccion, title, subtitle, stats = [], action }) {
  return (
    <header className="relative mb-6 overflow-hidden rounded-[28px] border border-white bg-[radial-gradient(ellipse_at_100%_0%,#CFE4FF_0%,#EEF5FF_40%,#FFFFFF_75%)] p-6 shadow-[0_14px_40px_-28px_rgba(11,58,140,0.6)] sm:p-7">
      {/* Decoración */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/60" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-4 top-10 h-20 w-20 rounded-full bg-luwi-tecno/10 blur-2xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-start gap-4">
          {IconCmp && (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_12px_24px_-10px_rgba(0,110,230,0.75)]">
              <IconCmp className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            {seccion && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luwi-tecno">{seccion}</p>
            )}
            <h1 className="mt-0.5 text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">{title}</h1>
            {subtitle && <p className="mt-1 max-w-xl text-sm text-luwi-texto">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {stats.length > 0 && (
        <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          {stats.map((s) => (
            <div
              key={s.label}
              className="min-w-[150px] rounded-2xl bg-white px-4 py-3 shadow-[0_6px_16px_-10px_rgba(11,58,140,0.35)] ring-1 ring-inset ring-luwi-linea/70"
            >
              <dt className="text-[11px] font-medium text-luwi-texto/80">{s.label}</dt>
              <dd className="mt-0.5 text-xl font-bold leading-tight text-luwi-profundo">{s.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </header>
  );
}

// ---------- Tarjeta de tabla ----------

/** Contenedor blanco de las tablas de listado. */
export function TableCard({ children }) {
  return (
    <section className="overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_14px_40px_-28px_rgba(11,58,140,0.6)]">
      {children}
    </section>
  );
}

/** Buscador de las tablas. */
export function SearchBox({ value, onChange, placeholder, className = "" }) {
  return (
    <label
      className={`flex h-11 items-center gap-3 rounded-xl border border-luwi-linea bg-luwi-panel px-4 transition focus-within:border-luwi-tecno focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,156,255,0.10)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-luwi-texto/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-w-0 bg-transparent text-sm text-luwi-profundo outline-none placeholder:text-luwi-texto/60"
      />
    </label>
  );
}

/** Contador de resultados ("9 empresas"). */
export function CountPill({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-luwi-cristal-fondo px-3 py-1.5 text-xs font-semibold text-luwi-profundo">
      <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno" />
      {children}
    </span>
  );
}

// Clases de las celdas de encabezado de las tablas.
export const thCls = "px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/70";

/** Filas de carga con efecto pulso. */
export function TableSkeleton({ filas = 5 }) {
  return (
    <div className="space-y-3 px-6 py-5" role="status" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="h-10 w-10 animate-pulse rounded-xl bg-luwi-cristal-fondo" />
          <span className="h-4 flex-1 animate-pulse rounded-lg bg-luwi-cristal-fondo" />
          <span className="hidden h-4 w-32 animate-pulse rounded-lg bg-luwi-cristal-fondo sm:block" />
          <span className="h-9 w-28 animate-pulse rounded-xl bg-luwi-cristal-fondo" />
        </div>
      ))}
    </div>
  );
}

/** Mensaje cuando no hay registros o la búsqueda no encuentra nada. */
export function EmptyState({ icon: IconCmp, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-cristal to-white text-luwi-medio ring-1 ring-inset ring-luwi-linea">
        {IconCmp && <IconCmp className="h-7 w-7" />}
        <span aria-hidden="true" className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-luwi-tecno ring-4 ring-white" />
      </span>
      <p className="mt-4 text-sm font-semibold text-luwi-profundo">{title}</p>
      {text && <p className="mt-1 max-w-sm text-xs text-luwi-texto/80">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
