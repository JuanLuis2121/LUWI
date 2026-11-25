import { Link } from "react-router-dom";
import Sparkline from "./Sparkline";
import useCountUp from "../../hooks/useCountUp";

/** Etiqueta de cambio respecto al periodo anterior (ej. "+3 en 30 días"). */
function Delta({ nuevos, texto }) {
  const sube = nuevos > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
        sube ? "bg-luwi-antique text-luwi-fawn-deep" : "bg-luwi-panel text-luwi-texto/70"
      }`}
    >
      {sube && (
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 14l5-5 5 5" />
        </svg>
      )}
      {sube ? `+${nuevos}` : "Sin cambios"} {texto}
    </span>
  );
}

/**
 * Tarjeta de indicador, pensada como un paso del flujo de preparación.
 * - paso: número del paso ("01", "02"...). Opcional.
 * - detalle: texto corto debajo del número.
 * - progreso: 0-100, dibuja una barra con su porcentaje (opcional).
 * - tendencia: { nuevos, serie, texto } → etiqueta de cambio + minigráfica (opcional).
 * - conector: muestra una flecha hacia la siguiente tarjeta (solo pantallas grandes).
 * - to: si se recibe, toda la tarjeta lleva al módulo.
 */
export default function StatCard({ paso, label, value, icon: Icon, detalle, progreso, tendencia, conector = false, loading = false, to }) {
  const numero = useCountUp(typeof value === "number" ? value : 0);
  const mostrado = typeof value === "number" ? numero : value;

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_10px_20px_-8px_rgba(34,43,184,0.7)] transition duration-300 group-hover:scale-105">
          {Icon && <Icon className="h-[22px] w-[22px]" />}
        </span>
        {paso && <span className="text-[13px] font-bold tracking-wider text-luwi-linea transition group-hover:text-luwi-tecno/50">{paso}</span>}
      </div>

      <p className="mt-5 text-[13px] font-medium text-luwi-texto">{label}</p>

      {loading ? (
        <span className="mt-1 block h-10 w-20 animate-pulse rounded-lg bg-luwi-cristal" />
      ) : (
        <div className="mt-0.5 flex items-end justify-between gap-3">
          <p className="text-[36px] font-bold leading-tight tracking-tight text-luwi-profundo tabular-nums">{mostrado}</p>
          {tendencia?.serie && <Sparkline datos={tendencia.serie} ancho={96} alto={34} className="mb-2 h-[34px] w-[96px] shrink-0" />}
        </div>
      )}

      {tendencia && !loading && (
        <div className="mt-1">
          <Delta nuevos={tendencia.nuevos} texto={tendencia.texto} />
        </div>
      )}

      {detalle && !loading && <p className="mt-2 text-xs text-luwi-texto/80">{detalle}</p>}

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
    "group relative block h-full overflow-hidden rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(17,22,82,0.4)] transition duration-300 sm:p-6";

  return (
    <div className="relative h-full">
      {to ? (
        <Link
          to={to}
          aria-label={`${label}: ${value}`}
          className={`${cls} hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(17,22,82,0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40`}
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
