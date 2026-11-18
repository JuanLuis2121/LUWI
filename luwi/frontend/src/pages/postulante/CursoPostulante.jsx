import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProgressBar from "../../components/postulante/ProgressBar";
import { Aviso, Cargando, ErrorCarga } from "../../components/postulante/Avisos";
import {
  CheckIcon, ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon,
} from "../../components/dashboard/icons";
import {
  getCursoAsignado,
  guardarUltimaConsulta,
  marcarUnidadRevisada,
  MENSAJE_ERROR_AVANCE,
} from "../../services/formacionService";

const SIN_ACCESO = "Ya no tienes acceso a ese curso.";

// Unidad con la que se abre el curso
function unidadInicial({ unidades, ultimaUnidadId }) {
  if (ultimaUnidadId && unidades.some((u) => u.id === ultimaUnidadId)) return ultimaUnidadId;
  const pendiente = unidades.find((u) => u.obligatoria && !u.revisada);
  return (pendiente ?? unidades[0])?.id ?? null;
}

const botonNav =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-luwi-border bg-white px-4 py-2.5 text-sm font-semibold text-luwi-navy transition hover:border-luwi-blue/40 hover:text-luwi-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-luwi-border disabled:hover:text-luwi-navy";

function ListaUnidades({ unidades, actualId, onSelect }) {
  return (
    <nav aria-label="Unidades del curso" className="rounded-2xl border border-luwi-border bg-white p-3 shadow-card">
      <p className="px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-luwi-muted">
        Unidades
      </p>
      <ol className="space-y-1">
        {unidades.map((u, i) => {
          const actual = u.id === actualId;
          return (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => onSelect(u.id)}
                aria-current={actual ? "step" : undefined}
                className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40 ${
                  actual ? "bg-luwi-blue/10 text-luwi-blue" : "text-luwi-ink hover:bg-luwi-bg"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    u.revisada
                      ? "bg-emerald-500 text-white"
                      : actual
                        ? "bg-luwi-blue text-white"
                        : "bg-luwi-bg text-luwi-muted"
                  }`}
                >
                  {u.revisada ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block break-words ${actual ? "font-semibold" : "font-medium"}`}>
                    {u.titulo}
                  </span>
                  {!u.obligatoria && <span className="text-xs text-luwi-muted">Opcional</span>}
                  <span className="sr-only">{u.revisada ? " (revisada)" : ""}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CursoContenido() {
  const { asignacionId, cursoAsignadoId } = useParams();
  const navigate = useNavigate();
  const contenidoRef = useRef(null);

  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [unidadId, setUnidadId] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [errorAvance, setErrorAvance] = useState("");

  // Ante 403/404 se vuelve a "Mi formación" con el motivo
  const salirSinAcceso = useCallback(
    (err) => {
      if (err?.status !== 403 && err?.status !== 404) return false;
      navigate("/mi-formacion", {
        replace: true,
        state: { aviso: err.data?.message || SIN_ACCESO },
      });
      return true;
    },
    [navigate]
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await getCursoAsignado(asignacionId, cursoAsignadoId);
      setDetalle(data);
      setUnidadId((prev) =>
        prev && data.unidades.some((u) => u.id === prev) ? prev : unidadInicial(data)
      );
    } catch (err) {
      if (!salirSinAcceso(err)) setError(err.message || "No pudimos cargar el curso.");
    } finally {
      setCargando(false);
    }
  }, [asignacionId, cursoAsignadoId, salirSinAcceso]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Cada vez que cambia la unidad se guarda como última consulta
  useEffect(() => {
    if (!unidadId) return;
    guardarUltimaConsulta(asignacionId, { cursoAsignadoId, unidadId }).catch(salirSinAcceso);
  }, [asignacionId, cursoAsignadoId, unidadId, salirSinAcceso]);

  const irAUnidad = (id, { desdeLista = false } = {}) => {
    setUnidadId(id);
    setErrorAvance("");

    // Lleva la vista al contenido si quedó fuera de pantalla (o en celular al tocar la lista)
    const el = contenidoRef.current;
    if (!el) return;
    const enCelular = !window.matchMedia("(min-width: 1024px)").matches;
    if ((desdeLista && enCelular) || el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const marcar = async () => {
    setMarcando(true);
    setErrorAvance("");
    try {
      // El estado se actualiza solo con lo que responde el servidor
      setDetalle(await marcarUnidadRevisada(asignacionId, cursoAsignadoId, unidadId));
    } catch (err) {
      if (!salirSinAcceso(err)) setErrorAvance(MENSAJE_ERROR_AVANCE);
    } finally {
      setMarcando(false);
    }
  };

  const volver = (
    <Link
      to="/mi-formacion"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-luwi-muted transition hover:text-luwi-blue"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      Volver a mi formación
    </Link>
  );

  if (cargando && !detalle) return <Cargando filas={2} />;
  if (error && !detalle) {
    return (
      <div className="space-y-6">
        {volver}
        <ErrorCarga mensaje={error} onRetry={cargar} />
      </div>
    );
  }
  if (!detalle) return null;

  const { curso, unidades } = detalle;
  const indice = Math.max(0, unidades.findIndex((u) => u.id === unidadId));
  const unidad = unidades[indice];
  const anterior = unidades[indice - 1];
  const siguiente = unidades[indice + 1];

  return (
    <div className="space-y-6">
      {volver}

      <header className="rounded-2xl border border-luwi-border bg-white p-5 shadow-card sm:p-6">
        <p className="text-sm text-luwi-muted">Curso {curso.orden}</p>
        <h1 className="mt-0.5 break-words text-2xl font-bold text-luwi-navy">{curso.titulo}</h1>
        <div className="mt-4">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
            <span className="text-luwi-muted">
              {curso.revisadasObligatorias} de {curso.unidadesObligatorias} unidades obligatorias revisadas
            </span>
            <span className="font-bold text-luwi-navy">{curso.porcentaje}%</span>
          </div>
          <ProgressBar value={curso.porcentaje} label="Avance del curso" />
        </div>
      </header>

      {unidades.length === 0 ? (
        <Aviso>Este curso todavía no tiene contenido publicado.</Aviso>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ListaUnidades
              unidades={unidades}
              actualId={unidad.id}
              onSelect={(id) => irAUnidad(id, { desdeLista: true })}
            />
          </div>

          <article
            ref={contenidoRef}
            className="scroll-mt-20 rounded-2xl border border-luwi-border bg-white p-5 shadow-card sm:p-6 lg:col-span-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-luwi-muted">
                Unidad {indice + 1} de {unidades.length}
              </p>
              {!unidad.obligatoria && (
                <span className="rounded-full bg-luwi-bg px-2.5 py-0.5 text-xs font-semibold text-luwi-muted">
                  Opcional
                </span>
              )}
            </div>
            <h2 className="mt-1 break-words text-xl font-bold text-luwi-navy">{unidad.titulo}</h2>

            {unidad.contenido ? (
              <p className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-luwi-ink">
                {unidad.contenido}
              </p>
            ) : (
              <p className="mt-4 text-sm text-luwi-muted">Esta unidad no tiene texto.</p>
            )}

            {unidad.recursoUrl && (
              <a
                href={unidad.recursoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-luwi-blue/30 bg-luwi-blue/5 px-4 py-2.5 text-sm font-semibold text-luwi-blue transition hover:bg-luwi-blue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40"
              >
                Abrir recurso
                <ExternalLinkIcon className="h-4 w-4" />
              </a>
            )}

            {errorAvance && (
              <div className="mt-5">
                <ErrorCarga mensaje={errorAvance} />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-luwi-border pt-5 sm:flex sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => anterior && irAUnidad(anterior.id)}
                disabled={!anterior}
                className={`${botonNav} order-2 sm:order-1`}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Anterior
              </button>

              {unidad.revisada ? (
                <span className="order-1 col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-700 sm:order-2">
                  <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                  Unidad revisada
                </span>
              ) : (
                <button
                  type="button"
                  onClick={marcar}
                  disabled={marcando}
                  className="order-1 col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-luwi-blue px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-luwi-blue/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40 disabled:cursor-wait disabled:opacity-70 sm:order-2"
                >
                  <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                  {marcando ? "Guardando…" : "Marcar como revisada"}
                </button>
              )}

              <button
                type="button"
                onClick={() => siguiente && irAUnidad(siguiente.id)}
                disabled={!siguiente}
                className={`${botonNav} order-3`}
              >
                Siguiente
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

/** Contenido de un curso asignado. Se reinicia al cambiar de curso. */
export default function CursoPostulante() {
  const { cursoAsignadoId } = useParams();
  return <CursoContenido key={cursoAsignadoId} />;
}
