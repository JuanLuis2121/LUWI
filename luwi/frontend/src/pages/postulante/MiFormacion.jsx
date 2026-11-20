import { Link, useLocation } from "react-router-dom";
import PageHeader from "../../components/dashboard/PageHeader";
import ProgressBar from "../../components/postulante/ProgressBar";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import { ArrowRightIcon, CheckCircleIcon, ClockIcon, LockIcon } from "../../components/dashboard/icons";
import useMiFormacion from "../../hooks/useMiFormacion";

const formatoHoras = (h) => {
  const n = Number(h) || 0;
  return `${n.toLocaleString("es-DO")} ${n === 1 ? "hora" : "horas"}`;
};

const badge = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

function CursoItem({ curso, asignacionId, suspendido }) {
  const habilitado = curso.acceso === "HABILITADO";
  const revisado = curso.estado === "CONTENIDOS_REVISADOS";
  const textoBoton = revisado
    ? "Revisar contenido"
    : curso.estado === "EN_CURSO"
      ? "Continuar curso"
      : "Comenzar curso";

  return (
    <li className="flex gap-4 rounded-2xl border border-luwi-border bg-white p-5 shadow-card">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          habilitado ? "bg-luwi-blue/10 text-luwi-blue" : "bg-luwi-bg text-luwi-muted"
        }`}
      >
        {curso.orden}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="min-w-0 break-words font-semibold text-luwi-navy">{curso.titulo}</h2>
          {habilitado ? (
            <span className={`${badge} bg-emerald-50 text-emerald-700`}>Habilitado</span>
          ) : (
            <span className={`${badge} bg-luwi-bg text-luwi-muted`}>Bloqueado</span>
          )}
          {revisado && (
            <span className={`${badge} bg-luwi-blue/10 text-luwi-blue`}>
              <CheckCircleIcon className="h-3.5 w-3.5" />
              Contenidos revisados
            </span>
          )}
        </div>

        <p className="mt-1 flex items-center gap-1.5 text-sm text-luwi-muted">
          <ClockIcon className="h-4 w-4 shrink-0" />
          {formatoHoras(curso.duracionHoras)}
        </p>

        <div className="mt-3">
          <ProgressBar value={curso.porcentaje} label={`Avance de ${curso.titulo}`} />
          <p className="mt-1.5 text-xs text-luwi-muted">
            {curso.revisadasObligatorias} de {curso.totalObligatorias} unidades revisadas
          </p>
        </div>

        {!habilitado ? (
          <p className="mt-4 flex items-start gap-2 text-sm text-luwi-muted">
            <LockIcon className="mt-0.5 h-4 w-4 shrink-0" />
            Pendiente de habilitación por Recursos Humanos
          </p>
        ) : (
          !suspendido && (
            <Link
              to={`/mi-formacion/${asignacionId}/cursos/${curso.cursoAsignadoId}`}
              className={`mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40 ${
                revisado
                  ? "border border-luwi-border text-luwi-navy hover:border-luwi-blue/40 hover:text-luwi-blue"
                  : "bg-luwi-blue text-white hover:bg-luwi-blue/90"
              }`}
            >
              {textoBoton}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )
        )}
      </div>
    </li>
  );
}

export default function MiFormacion() {
  const location = useLocation();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();
  const avisoNavegacion = location.state?.aviso;

  if (cargando && !datos) return <Cargando />;

  const asignacion = datos?.asignacion;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi formación"
        description={asignacion ? asignacion.ruta.nombre : "Tu ruta de formación"}
      />

      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}

      {suspendido ? (
        <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>
      ) : (
        avisoNavegacion && <Aviso>{avisoNavegacion}</Aviso>
      )}

      {datos && !asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      {asignacion && (
        <>
          <section className="rounded-2xl border border-luwi-border bg-white p-5 shadow-card">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="text-sm text-luwi-muted">Avance general</span>
              <span className="text-lg font-bold text-luwi-navy">{asignacion.porcentaje}%</span>
            </div>
            <ProgressBar value={asignacion.porcentaje} label="Avance general de la ruta" />
            {asignacion.ruta.descripcion && (
              <p className="mt-3 break-words text-sm text-luwi-muted">{asignacion.ruta.descripcion}</p>
            )}
          </section>

          <ol className="space-y-4">
            {asignacion.cursos.map((curso) => (
              <CursoItem
                key={curso.cursoAsignadoId}
                curso={curso}
                asignacionId={asignacion.id}
                suspendido={suspendido}
              />
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
