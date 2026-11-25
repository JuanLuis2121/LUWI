import { Link } from "react-router-dom";

/**
 * Contenedor con título para bloques del dashboard.
 * - icon: ícono opcional junto al título.
 * - action: enlace opcional en la esquina ({ label, to }).
 */
export default function Panel({ title, subtitle, icon: Icon, action, children, className = "" }) {
  return (
    <section
      className={`rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(17,22,82,0.4)] sm:p-6 ${className}`}
    >
      <header className="mb-5 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-luwi-medio">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-luwi-profundo">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-luwi-texto/75">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <Link
            to={action.to}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-cristal-fondo hover:text-luwi-profundo focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
          >
            {action.label}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        )}
      </header>
      {children}
    </section>
  );
}
