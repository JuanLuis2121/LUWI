import DonutChart from "../dashboard/DonutChart";
import { NIVELES, nivelDe, formatoHoras } from "../../utils/rutas";

const COLOR = { Básico: "#009cff", Intermedio: "#0b5bd3", Avanzado: "#0b3a8c" };

/**
 * Resumen visual del catálogo de rutas: cursos por nivel, ruta más larga
 * y rutas que todavía no tienen cursos.
 */
export default function MezclaNiveles({ rutas, onFiltrarSinCursos }) {
  const cursos = rutas.flatMap((r) => r.cursos);
  const conteo = Object.values(NIVELES).map((n) => ({
    label: n.label,
    value: cursos.filter((c) => nivelDe(c).label === n.label).length,
    color: COLOR[n.label],
  }));
  const larga = [...rutas].sort((a, b) => (b.duracionTotalHoras ?? 0) - (a.duracionTotalHoras ?? 0))[0];
  const sinCursos = rutas.filter((r) => r.cursos.length === 0).length;

  // Horas de formación por empresa (las 3 con más horas)
  const porEmpresa = [
    ...rutas
      .reduce((m, r) => {
        const e = r.empresaNombre || "Sin empresa";
        return m.set(e, (m.get(e) ?? 0) + (Number(r.duracionTotalHoras) || 0));
      }, new Map())
      .entries(),
  ]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);
  const maxHoras = porEmpresa[0]?.[1] || 1;

  return (
    <section className="flex flex-col rounded-[28px] border border-white bg-white/90 p-6 shadow-[0_14px_40px_-28px_rgba(11,58,140,0.6)]">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luwi-tecno">Mezcla de niveles</h2>
      <p className="mt-0.5 text-sm text-luwi-texto">Cursos en todas las rutas</p>

      <div className="mt-4 flex items-center gap-5">
        <DonutChart segmentos={conteo} centro={cursos.length} subcentro="cursos" size={128} grosor={16} />
        <ul className="min-w-0 flex-1 space-y-2.5">
          {conteo.map((s) => (
            <li key={s.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 font-medium text-luwi-profundo">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold text-luwi-profundo">{s.value}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-luwi-cristal-fondo">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${cursos.length ? (s.value / cursos.length) * 100 : 0}%`, background: s.color }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      {porEmpresa.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/60">Horas por empresa</p>
          <ul className="space-y-2">
            {porEmpresa.map(([nombre, horas]) => (
              <li key={nombre} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 text-xs">
                <span className="truncate font-medium text-luwi-profundo">{nombre}</span>
                <span className="font-semibold text-luwi-texto">{formatoHoras(horas)}</span>
                <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-luwi-cristal-fondo">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno transition-[width] duration-700"
                    style={{ width: `${(horas / maxHoras) * 100}%` }}
                  />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-5">
        {larga && (
          <p className="flex items-center justify-between gap-3 rounded-2xl bg-luwi-panel px-4 py-2.5 text-xs">
            <span className="text-luwi-texto">Ruta más larga</span>
            <span className="min-w-0 truncate text-right font-semibold text-luwi-profundo">
              {larga.nombre} · {formatoHoras(larga.duracionTotalHoras)}
            </span>
          </p>
        )}
        {sinCursos > 0 && (
          <button
            type="button"
            onClick={onFiltrarSinCursos}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-2.5 text-left text-xs text-amber-800 ring-1 ring-inset ring-amber-100 transition hover:bg-amber-100"
          >
            <span>
              {sinCursos} {sinCursos === 1 ? "ruta no tiene" : "rutas no tienen"} cursos
            </span>
            <span className="font-semibold">Ver</span>
          </button>
        )}
      </div>
    </section>
  );
}
