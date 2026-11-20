import { Link } from "react-router-dom";

/**
 * Tarjeta de indicador, pensada como un paso del flujo de preparación.
 * - paso: número del paso ("01", "02"...). Opcional.
 * - detalle: texto corto debajo del número.
 * - progreso: 0-100, dibuja una barra con su porcentaje (opcional).
 * - conector: muestra una flecha hacia la siguiente tarjeta (solo pantallas grandes).
 * - to: si se recibe, toda la tarjeta lleva al módulo.
 */
export default function StatCard({ paso, label, value, icon: Icon, detalle, progreso, conector = false, loading = false, to }) {
  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_10px_20px_-8px_rgba(0,110,230,0.7)] transition duration-300 group-hover:scale-105">
          {Icon && <Icon className="h-[22px] w-[22px]" />}
        </span>
        {paso && <span className="text-[13px] font-bold tracking-wider text-luwi-linea transition group-hover:text-luwi-tecno/50">{paso}</span>}
      </div>

      <p className="mt-5 text-[13px] font-medium text-luwi-texto">{label}</p>

      {loading ? (
        <span className="mt-1 block h-10 w-20 animate-pulse rounded-lg bg-luwi-cristal" />
      ) : (
        <p className="mt-0.5 text-[36px] font-bold leading-tight tracking-tight text-luwi-profundo">{value}</p>
      )}

      {detalle && !loading && <p className="mt-1 text-xs text-luwi-texto/80">{detalle}</p>}

      {typeof progreso === "number" && !loading && (
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-luwi-cristal">
            <div
              className="h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno transition-[width] duration-700"
              style={{ width: `${Math.min(100, Math.max(0, progreso))}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-luwi-profundo">{Math.round(progreso)}%</span>
        </div>
      )}
    </>
  );

  const cls =
    "group relative block h-full overflow-hidden rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] transition duration-300 sm:p-6";

  return (
    <div className="relative h-full">
      {to ? (
        <Link
          to={to}
          aria-label={`${label}: ${value}`}
          className={`${cls} hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(11,58,140,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40`}
        >
          {body}
        </Link>
      ) : (
        <article className={cls}>{body}</article>
      )}

      {conector && (
        <span
          aria-hidden="true"
          className="absolute -right-[18px] top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-luwi-linea bg-white text-luwi-tecno shadow-sm xl:flex"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 6 6 6-6 6" />
          </svg>
        </span>
      )}
    </div>
  );
}
