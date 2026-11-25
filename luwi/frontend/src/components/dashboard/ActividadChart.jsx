import { useState } from "react";

// Series de la gráfica, en el orden en que se apilan (de abajo hacia arriba)
export const SERIES_ACTIVIDAD = [
  { key: "empresas", label: "Empresas", color: "#111652" },
  { key: "puestos", label: "Puestos", color: "#222bb8" },
  { key: "rutas", label: "Rutas", color: "#5c5b94" },
  { key: "cursos", label: "Cursos", color: "#d1b17c" },
];

const ALTO = 200;
const IZQ = 32;
const ABAJO = 26;
const ARRIBA = 10;

/** Escala "bonita" para el eje Y: 4 marcas redondas. */
function escala(max) {
  if (max <= 4) return [0, 1, 2, 3, 4];
  const paso = Math.ceil(max / 4 / (max > 40 ? 10 : max > 20 ? 5 : 1)) * (max > 40 ? 10 : max > 20 ? 5 : 1);
  return [0, paso, paso * 2, paso * 3, paso * 4];
}

/**
 * Barras apiladas de registros creados por intervalo.
 * - datos: [{ etiqueta, valores: { empresas, puestos, rutas, cursos } }]
 */
export default function ActividadChart({ datos }) {
  const [activo, setActivo] = useState(null);
  const ancho = 760;
  const totales = datos.map((d) => SERIES_ACTIVIDAD.reduce((a, s) => a + (d.valores[s.key] ?? 0), 0));
  const marcas = escala(Math.max(1, ...totales));
  const tope = marcas.at(-1);
  const zona = ancho - IZQ - 8;
  const anchoBarra = Math.min(36, (zona / datos.length) * 0.62);
  const xDe = (i) => IZQ + (zona / datos.length) * (i + 0.5);
  const yDe = (v) => ARRIBA + (ALTO - ARRIBA - ABAJO) * (1 - v / tope);
  // Con muchas barras se muestra solo una de cada N etiquetas
  const cadaN = datos.length > 14 ? Math.ceil(datos.length / 8) : 1;
  const totalPeriodo = totales.reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4">
        {SERIES_ACTIVIDAD.map((s) => (
          <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-luwi-texto">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-luwi-profundo">{totalPeriodo} registros en el periodo</span>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${ancho} ${ALTO}`} className="h-auto w-full" role="img" aria-label={`Registros creados por intervalo: ${totalPeriodo} en total`}>
          {marcas.map((m) => (
            <g key={m}>
              <line x1={IZQ} x2={ancho - 8} y1={yDe(m)} y2={yDe(m)} stroke="#efe2d1" strokeDasharray={m ? "3 4" : undefined} />
              <text x={IZQ - 8} y={yDe(m) + 4} textAnchor="end" fontSize="10.5" fill="#7a7d9b">
                {m}
              </text>
            </g>
          ))}

          {datos.map((d, i) => {
            let acumulado = 0;
            const x = xDe(i) - anchoBarra / 2;
            return (
              <g
                key={d.etiqueta + i}
                onMouseEnter={() => setActivo(i)}
                onMouseLeave={() => setActivo(null)}
                className="cursor-default"
              >
                <rect x={xDe(i) - zona / datos.length / 2} y={ARRIBA} width={zona / datos.length} height={ALTO - ARRIBA - ABAJO} fill={activo === i ? "#f6efe6" : "transparent"} rx="6" />
                {totales.at(i) === 0 ? (
                  <rect x={x} y={yDe(0) - 2} width={anchoBarra} height="2" rx="1" fill="#e5d5bf" />
                ) : (
                  SERIES_ACTIVIDAD.map((s) => {
                    const v = d.valores[s.key] ?? 0;
                    if (!v) return null;
                    const y0 = yDe(acumulado);
                    acumulado += v;
                    const y1 = yDe(acumulado);
                    return <rect key={s.key} x={x} y={y1} width={anchoBarra} height={Math.max(1, y0 - y1 - 1)} rx="3" fill={s.color} />;
                  })
                )}
                {i % cadaN === 0 && (
                  <text x={xDe(i)} y={ALTO - 8} textAnchor="middle" fontSize="10.5" fill={activo === i ? "#111652" : "#7a7d9b"}>
                    {d.etiqueta}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {activo != null && (
          <div
            className="pointer-events-none absolute top-0 z-10 w-44 -translate-x-1/2 rounded-xl bg-luwi-noche px-3 py-2.5 text-xs text-white shadow-[0_12px_30px_-10px_rgba(15,20,76,0.7)]"
            style={{ left: `${Math.min(88, Math.max(12, (xDe(activo) / ancho) * 100))}%` }}
          >
            <p className="mb-1.5 font-semibold">{datos.at(activo).etiqueta}</p>
            {SERIES_ACTIVIDAD.map((s) => (
              <p key={s.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 text-white/75">
                  <span className="h-2 w-2 rounded-sm ring-1 ring-white/40" style={{ background: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold">{datos.at(activo).valores[s.key] ?? 0}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
