import { Link, useLocation } from "react-router-dom";
import { PageHeader } from "../../components/AdminUI";
import ProgressBar from "../../components/postulante/ProgressBar";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import {
  ArrowRightIcon, BookIcon, CheckCircleIcon, CheckIcon, ClockIcon, LockIcon,
} from "../../components/dashboard/icons";
import useMiFormacion from "../../hooks/useMiFormacion";
import { resumenFormacion, situacionCurso, formatoHoras } from "../../utils/formacion";

// Estilos según la situación del curso
const NUMERO = {
  hecho: "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-[0_8px_16px_-8px_rgba(16,185,129,0.8)]",
  actual: "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_0_0_6px_rgba(0,156,255,0.15)]",
  disponible: "bg-white text-luwi-medio ring-2 ring-luwi-cristal",
  bloqueado: "bg-luwi-panel text-luwi-texto/50 ring-1 ring-luwi-linea",
};

const ETIQUETA = {
  hecho: { texto: "Completado", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", punto: "bg-emerald-500" },
  actual: { texto: "En curso", cls: "bg-luwi-tecno/10 text-luwi-medio ring-luwi-tecno/25", punto: "bg-luwi-tecno" },
  disponible: { texto: "Habilitado", cls: "bg-luwi-cristal-fondo text-luwi-profundo ring-luwi-cristal", punto: "bg-luwi-medio" },
  bloqueado: { texto: "Bloqueado", cls: "bg-luwi-panel text-luwi-texto ring-luwi-linea", punto: "bg-luwi-texto/50" },
};

function CursoItem({ curso, situacion, asignacionId, suspendido, ultimo }) {
  const revisado = situacion === "hecho";
  const bloqueado = situacion === "bloqueado";
  const etiqueta = ETIQUETA[situacion];
  const textoBoton = revisado ? "Revisar contenido" : curso.estado === "EN_CURSO" ? "Continuar curso" : "Comenzar curso";

  return (
    <li className="relative flex gap-4 sm:gap-5">
      {/* Línea que une los cursos */}
      {!ultimo && (
        <span
          aria-hidden="true"
          className={`absolute left-[23px] top-14 h-[calc(100%-32px)] w-0.5 rounded-full ${revisado ? "bg-emerald-300" : "bg-luwi-linea"}`}
        />
      )}

      <span className={`relative z-10 mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${NUMERO[situacion]}`}>
        {revisado ? <CheckIcon className="h-6 w-6" /> : bloqueado ? <LockIcon className="h-5 w-5" /> : curso.orden}
      </span>

      <article
        className={`mb-4 min-w-0 flex-1 rounded-[24px] border p-5 transition sm:p-6 ${
          situacion === "actual"
            ? "border-luwi-tecno/30 bg-white shadow-[0_18px_40px_-24px_rgba(0,110,230,0.55)]"
            : bloqueado
            ? "border-white bg-white/60"
            : "border-white bg-white/90 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)]"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/60">Curso {curso.orden}</p>
            <h2 className={`mt-0.5 break-words text-[17px] font-semibold ${bloqueado ? "text-luwi-texto" : "text-luwi-profundo"}`}>
              {curso.titulo}
            </h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${etiqueta.cls}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${etiqueta.punto}`} />
            {etiqueta.texto}
          </span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2 text-xs text-luwi-texto">
          <li className="inline-flex items-center gap-1.5 rounded-lg bg-luwi-panel px-2.5 py-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatoHoras(curso.duracionHoras)}
          </li>
          {curso.nivel && <li className="rounded-lg bg-luwi-panel px-2.5 py-1 capitalize">{curso.nivel}</li>}
          <li className="rounded-lg bg-luwi-panel px-2.5 py-1">
            {curso.totalUnidades ?? curso.totalObligatorias} {(curso.totalUnidades ?? curso.totalObligatorias) === 1 ? "unidad" : "unidades"}
          </li>
        </ul>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="text-luwi-texto/80">
              {curso.revisadasObligatorias} de {curso.totalObligatorias} unidades revisadas
            </span>
            <span className="font-semibold text-luwi-profundo">{curso.porcentaje}%</span>
          </div>
          <ProgressBar value={curso.porcentaje} label={`Avance de ${curso.titulo}`} />
        </div>

        {bloqueado ? (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-luwi-panel px-3.5 py-2.5 text-sm text-luwi-texto">
            <LockIcon className="h-4 w-4 shrink-0" />
            Pendiente de habilitación por Recursos Humanos
          </p>
        ) : (
          !suspendido && (
            <Link
              to={`/mi-formacion/${asignacionId}/cursos/${curso.cursoAsignadoId}`}
              className={`mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30 ${
                revisado
                  ? "border border-luwi-linea bg-white text-luwi-profundo hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo"
                  : "bg-gradient-to-r from-luwi-profundo to-luwi-medio text-white shadow-[0_10px_24px_-10px_rgba(11,58,140,0.8)] hover:-translate-y-0.5 hover:brightness-110"
              }`}
            >
              {revisado && <CheckCircleIcon className="h-4 w-4" />}
              {textoBoton}
              {!revisado && <ArrowRightIcon className="h-4 w-4" />}
            </Link>
          )
        )}
      </article>
    </li>
  );
}

export default function MiFormacion() {
  const location = useLocation();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();
  const avisoNavegacion = location.state?.aviso;

  if (cargando && !datos) return <Cargando />;

  const asignacion = datos?.asignacion;
  const resumen = resumenFormacion(asignacion);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BookIcon}
        seccion="Tu ruta"
        title="Mi formación"
        subtitle={asignacion ? asignacion.ruta.nombre : "Tu ruta de formación"}
        stats={
          resumen
            ? [
                { label: "Avance general", value: `${asignacion.porcentaje}%` },
                { label: "Cursos completados", value: `${resumen.completados} de ${resumen.cursos.length}` },
                { label: "Duración total", value: formatoHoras(resumen.horasTotales) },
              ]
            : []
        }
      />

      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}

      {suspendido ? <Aviso>{MENSAJE_SUSPENDIDO}</Aviso> : avisoNavegacion && <Aviso>{avisoNavegacion}</Aviso>}

      {datos && !asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      {asignacion && (
        <>
          <section className="rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] sm:p-6">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold text-luwi-profundo">Avance general de la ruta</span>
              <span className="text-xl font-bold text-luwi-profundo">{asignacion.porcentaje}%</span>
            </div>
            <ProgressBar value={asignacion.porcentaje} label="Avance general de la ruta" className="h-2.5" />
            {asignacion.ruta.descripcion && (
              <p className="mt-3 break-words text-sm text-luwi-texto">{asignacion.ruta.descripcion}</p>
            )}
          </section>

          <ol>
            {resumen.cursos.map((curso, i) => (
              <CursoItem
                key={curso.cursoAsignadoId}
                curso={curso}
                situacion={situacionCurso(curso, resumen.actual?.cursoAsignadoId)}
                asignacionId={asignacion.id}
                suspendido={suspendido}
                ultimo={i === resumen.cursos.length - 1}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
