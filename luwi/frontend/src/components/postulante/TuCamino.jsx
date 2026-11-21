import { Link } from "react-router-dom";
import CaminoSerpiente from "../rutas/CaminoSerpiente";
import { situacionCurso } from "../../utils/formacion";

const LEYENDA = [
  { cls: "bg-emerald-500", texto: "Completado" },
  { cls: "bg-luwi-tecno", texto: "En curso" },
  { cls: "bg-white ring-2 ring-luwi-cristal", texto: "Disponible" },
  { cls: "bg-luwi-linea", texto: "Bloqueado" },
];

/**
 * Camino de la ruta del postulante: cursos como paradas, el tramo recorrido
 * en verde-azul y un pin "Tú" en el curso actual.
 */
export default function TuCamino({ resumen, titulo = "Tu camino", subtitulo, accion }) {
  const actualId = resumen.actual?.cursoAsignadoId;
  const cursos = resumen.cursos.map((c) => ({ ...c, id: c.cursoAsignadoId }));
  const estados = resumen.cursos.map((c) => situacionCurso(c, actualId));
  const marcador = resumen.cursos.findIndex((c) => c.cursoAsignadoId === actualId);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white bg-[radial-gradient(ellipse_at_10%_0%,#EAF3FF_0%,#FFFFFF_55%)] p-5 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] sm:p-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:radial-gradient(circle_at_1px_1px,#d5e3f7_1px,transparent_0)] [background-size:20px_20px]"
      />
      <header className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-lg">🗺️</span>
          <div>
            <h2 className="text-[15px] font-semibold text-luwi-profundo">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-xs text-luwi-texto/75">{subtitulo}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <ul className="hidden flex-wrap gap-x-3 gap-y-1 text-[11px] text-luwi-texto/75 sm:flex">
            {LEYENDA.map((l) => (
              <li key={l.texto} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${l.cls}`} />
                {l.texto}
              </li>
            ))}
          </ul>
          {accion && (
            <Link to={accion.to} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-luwi-medio transition hover:bg-luwi-cristal-fondo">
              {accion.label} →
            </Link>
          )}
        </div>
      </header>

      <div className="relative mt-2 px-1 py-7">
        <CaminoSerpiente cursos={cursos} tamano="lg" estados={estados} marcador={marcador >= 0 ? marcador : null} max={8} />
      </div>
    </section>
  );
}
