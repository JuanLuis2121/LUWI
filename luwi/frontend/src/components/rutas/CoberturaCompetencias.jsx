import { CheckIcon, AlertIcon } from "../dashboard/icons";

/**
 * Compara las competencias que exige el puesto con las que cubren los cursos de la ruta.
 * Recibe el resultado de coberturaCompetencias() (utils/rutas.js).
 */
export default function CoberturaCompetencias({ cobertura, hayPuesto }) {
  if (!hayPuesto) {
    return <p className="text-sm text-luwi-texto/80">Elige un puesto para ver qué competencias cubre la ruta.</p>;
  }

  // El puesto no tiene competencias registradas: se muestran las de los cursos como referencia.
  if (cobertura.total === 0) {
    return (
      <div>
        <p className="text-sm text-luwi-texto">Este puesto todavía no tiene competencias definidas.</p>
        {cobertura.textos.length > 0 && (
          <>
            <p className="mt-4 text-xs font-semibold text-luwi-texto/70">Competencias que trabaja la ruta</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {cobertura.textos.map((t) => (
                <li key={t} className="rounded-lg bg-luwi-cristal-fondo px-2.5 py-1 text-xs font-medium text-luwi-profundo">
                  {t}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  const p = cobertura.porcentaje;
  const radio = 34;
  const circ = 2 * Math.PI * radio;

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative h-[84px] w-[84px] shrink-0">
          <svg viewBox="0 0 84 84" className="-rotate-90" aria-hidden="true">
            <circle cx="42" cy="42" r={radio} fill="none" stroke="#efe2d1" strokeWidth="9" />
            <circle
              cx="42"
              cy="42"
              r={radio}
              fill="none"
              stroke={p === 100 ? "#d1b17c" : "#222bb8"}
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={`${(circ * p) / 100} ${circ}`}
              className="transition-[stroke-dasharray] duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-luwi-profundo">{p}%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-luwi-profundo">
            Cubre {cobertura.cubiertas.length} de {cobertura.total} competencias
          </p>
          <p className="mt-0.5 text-xs text-luwi-texto/80">
            {p === 100 ? "La ruta prepara todo lo que pide el puesto." : "Agrega cursos que trabajen las que faltan."}
          </p>
        </div>
      </div>

      {cobertura.faltantes.length > 0 && (
        <>
          <p className="mt-5 text-xs font-semibold text-amber-700">Faltan</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cobertura.faltantes.map((c) => (
              <li key={c.id} className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200">
                <AlertIcon className="h-3 w-3" />
                {c.nombre}
              </li>
            ))}
          </ul>
        </>
      )}

      {cobertura.cubiertas.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold text-luwi-medio">Cubiertas</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cobertura.cubiertas.map((c) => (
              <li key={c.id} className="inline-flex items-center gap-1 rounded-lg bg-luwi-cristal px-2.5 py-1 text-xs font-medium text-luwi-medio ring-1 ring-inset ring-luwi-medio/20">
                <CheckIcon className="h-3 w-3" />
                {c.nombre}
              </li>
            ))}
          </ul>
        </>
      )}

      {cobertura.extra.length > 0 && (
        <>
          <p className="mt-4 text-xs font-semibold text-luwi-texto/70">También trabaja</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {cobertura.extra.map((c) => (
              <li key={c.id} className="rounded-lg bg-luwi-panel px-2.5 py-1 text-xs text-luwi-texto">
                {c.nombre}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
