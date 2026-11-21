import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PageHeader } from "../../components/AdminUI";
import ProgressBar from "../../components/postulante/ProgressBar";
import TuCamino from "../../components/postulante/TuCamino";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import { ArrowRightIcon, BookIcon, CheckCircleIcon, CheckIcon, ClockIcon, LockIcon } from "../../components/dashboard/icons";
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

const FILTROS = [
  { key: "todos", label: "Todos", incluye: () => true },
  { key: "pendientes", label: "Por hacer", incluye: (s) => s === "actual" || s === "disponible" },
  { key: "hechos", label: "Completados", incluye: (s) => s === "hecho" },
  { key: "bloqueados", label: "Bloqueados", incluye: (s) => s === "bloqueado" },
];

/** Una barrita por unidad obligatoria: llenas las revisadas. */
function UnidadesSegmentadas({ total, hechas, completo }) {
  if (!total) return null;
  if (total > 16) return <ProgressBar value={(hechas / total) * 100} label="Unidades revisadas" />;
  return (
    <div className="flex gap-1" role="img" aria-label={`${hechas} de ${total} unidades revisadas`}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-full transition-colors duration-500 ${
            i < hechas ? (completo ? "bg-emerald-400" : "bg-gradient-to-r from-luwi-medio to-luwi-tecno") : "bg-luwi-cristal-fondo"
          }`}
        />
      ))}
    </div>
  );
}

function CursoItem({ curso, situacion, asignacionId, suspendido, ultimo, indice }) {
  const reducido = useReducedMotion();
  const revisado = situacion === "hecho";
  const bloqueado = situacion === "bloqueado";
  const etiqueta = ETIQUETA[situacion];
  const textoBoton = revisado ? "Revisar contenido" : curso.estado === "EN_CURSO" ? "Continuar curso" : "Comenzar curso";
  const horasRestantes = Math.round((Number(curso.duracionHoras) || 0) * (1 - (curso.porcentaje ?? 0) / 100) * 10) / 10;

  return (
    <motion.li
      layout={!reducido}
      initial={reducido ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reducido ? undefined : { opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, delay: indice * 0.05 }}
      className="relative flex gap-4 sm:gap-5"
    >
      {/* Línea que une los cursos */}
      {!ultimo && (
        <span
          aria-hidden="true"
          className={`absolute left-[23px] top-14 h-[calc(100%-32px)] w-0.5 rounded-full ${revisado ? "bg-emerald-300" : "bg-luwi-linea"}`}
        />
      )}

      <span className={`relative z-10 mt-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-bold ${NUMERO[situacion]}`}>
        {situacion === "actual" && !reducido && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-2xl bg-luwi-tecno/25 [animation-duration:2.2s]" />}
        <span className="relative">{revisado ? <CheckIcon className="h-6 w-6" /> : bloqueado ? <LockIcon className="h-5 w-5" /> : curso.orden}</span>
      </span>

      <article
        className={`group relative mb-4 min-w-0 flex-1 overflow-hidden rounded-[24px] border p-5 transition duration-300 sm:p-6 ${
          situacion === "actual"
            ? "border-luwi-tecno/30 bg-white shadow-[0_18px_40px_-24px_rgba(0,110,230,0.55)]"
            : bloqueado
            ? "border-white bg-white/60"
            : "border-white bg-white/90 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-22px_rgba(11,58,140,0.5)]"
        }`}
      >
        {situacion === "actual" && (
          <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-luwi-tecno/10 blur-2xl" />
        )}
        {revisado && (
          <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 text-6xl opacity-[0.08]">
            🏆
          </span>
        )}

        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/60">Curso {curso.orden}</p>
            <h2 className={`mt-0.5 break-words text-[17px] font-semibold ${bloqueado ? "text-luwi-texto" : "text-luwi-profundo"}`}>{curso.titulo}</h2>
          </div>
          <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${etiqueta.cls}`}>
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${etiqueta.punto}`} />
            {etiqueta.texto}
          </span>
        </div>

        <ul className="relative mt-3 flex flex-wrap gap-2 text-xs text-luwi-texto">
          <li className="inline-flex items-center gap-1.5 rounded-lg bg-luwi-panel px-2.5 py-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatoHoras(curso.duracionHoras)}
          </li>
          {curso.nivel && <li className="rounded-lg bg-luwi-panel px-2.5 py-1 capitalize">{curso.nivel}</li>}
          <li className="rounded-lg bg-luwi-panel px-2.5 py-1">
            {curso.totalUnidades ?? curso.totalObligatorias} {(curso.totalUnidades ?? curso.totalObligatorias) === 1 ? "unidad" : "unidades"}
          </li>
          {!revisado && !bloqueado && horasRestantes > 0 && (
            <li className="rounded-lg bg-luwi-cristal-fondo px-2.5 py-1 font-semibold text-luwi-medio">≈ {formatoHoras(horasRestantes)} para terminar</li>
          )}
        </ul>

        <div className="relative mt-4">
          <div className="mb-1.5 flex items-baseline justify-between text-xs">
            <span className="text-luwi-texto/80">
              {curso.revisadasObligatorias} de {curso.totalObligatorias} unidades revisadas
            </span>
            <span className={`font-semibold ${revisado ? "text-emerald-600" : "text-luwi-profundo"}`}>{curso.porcentaje}%</span>
          </div>
          <UnidadesSegmentadas total={curso.totalObligatorias} hechas={curso.revisadasObligatorias} completo={revisado} />
        </div>

        {bloqueado ? (
          <p className="relative mt-4 flex items-center gap-2 rounded-xl bg-luwi-panel px-3.5 py-2.5 text-sm text-luwi-texto">
            <LockIcon className="h-4 w-4 shrink-0" />
            Pendiente de habilitación por Recursos Humanos
          </p>
        ) : (
          !suspendido && (
            <Link
              to={`/mi-formacion/${asignacionId}/cursos/${curso.cursoAsignadoId}`}
              className={`relative mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30 ${
                revisado
                  ? "border border-luwi-linea bg-white text-luwi-profundo hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo"
                  : "bg-gradient-to-r from-luwi-profundo to-luwi-medio text-white shadow-[0_10px_24px_-10px_rgba(11,58,140,0.8)] hover:-translate-y-0.5 hover:brightness-110"
              }`}
            >
              {revisado && <CheckCircleIcon className="h-4 w-4" />}
              {textoBoton}
              {!revisado && <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
            </Link>
          )
        )}
      </article>
    </motion.li>
  );
}

export default function MiFormacion() {
  const location = useLocation();
  const reducido = useReducedMotion();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();
  const [filtro, setFiltro] = useState("todos");
  const avisoNavegacion = location.state?.aviso;

  if (cargando && !datos) return <Cargando />;

  const asignacion = datos?.asignacion;
  const resumen = resumenFormacion(asignacion);
  const actualId = resumen?.actual?.cursoAsignadoId;
  const conSituacion = (resumen?.cursos ?? []).map((c) => ({ curso: c, situacion: situacionCurso(c, actualId) }));
  const criterio = FILTROS.find((f) => f.key === filtro) ?? FILTROS[0];
  const visibles = conSituacion.filter((x) => criterio.incluye(x.situacion));

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
                { label: "Horas restantes", value: formatoHoras(resumen.horasRestantes) },
              ]
            : []
        }
      />

      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}

      {suspendido ? <Aviso>{MENSAJE_SUSPENDIDO}</Aviso> : avisoNavegacion && <Aviso>{avisoNavegacion}</Aviso>}

      {datos && !asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      {asignacion && (
        <>
          <TuCamino resumen={resumen} titulo="Mapa de tu ruta" subtitulo={asignacion.ruta.descripcion || `Vas en el ${asignacion.porcentaje}% de tu ruta`} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filtrar cursos" className="inline-flex flex-wrap gap-1 rounded-2xl bg-white/90 p-1.5 shadow-[0_10px_30px_-20px_rgba(11,58,140,0.4)] ring-1 ring-white">
              {FILTROS.map((f) => {
                const cantidad = conSituacion.filter((x) => f.incluye(x.situacion)).length;
                const activo = filtro === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setFiltro(f.key)}
                    className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
                      activo ? "text-white" : "text-luwi-texto hover:text-luwi-profundo"
                    }`}
                  >
                    {activo && (
                      <motion.span
                        layoutId="filtro-formacion"
                        transition={reducido ? { duration: 0 } : { type: "spring", bounce: 0.2, duration: 0.4 }}
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio shadow-[0_8px_18px_-8px_rgba(11,58,140,0.8)]"
                      />
                    )}
                    <span className="relative">{f.label}</span>
                    <span className={`relative rounded-md px-1.5 text-[11px] ${activo ? "bg-white/20" : "bg-luwi-panel"}`}>{cantidad}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-luwi-texto/70">
              {resumen.unidadesRevisadas} de {resumen.unidadesTotales} unidades revisadas en total
            </span>
          </div>

          {visibles.length === 0 ? (
            <div className="rounded-[24px] border border-white bg-white/80 px-6 py-12 text-center">
              <p className="text-3xl">{filtro === "hechos" ? "🌱" : "✨"}</p>
              <p className="mt-2 text-sm font-semibold text-luwi-profundo">
                {filtro === "hechos" ? "Aún no completas ningún curso" : filtro === "bloqueados" ? "No tienes cursos bloqueados" : "No hay cursos aquí"}
              </p>
              <p className="mt-1 text-xs text-luwi-texto/75">
                {filtro === "hechos" ? "Cuando termines tu primer curso aparecerá aquí." : "Prueba con otro filtro."}
              </p>
            </div>
          ) : (
            <ol>
              <AnimatePresence initial={false}>
                {visibles.map(({ curso, situacion }, i) => (
                  <CursoItem
                    key={curso.cursoAsignadoId}
                    curso={curso}
                    situacion={situacion}
                    asignacionId={asignacion.id}
                    suspendido={suspendido}
                    ultimo={i === visibles.length - 1}
                    indice={i}
                  />
                ))}
              </AnimatePresence>
            </ol>
          )}
        </>
      )}
    </div>
  );
}
