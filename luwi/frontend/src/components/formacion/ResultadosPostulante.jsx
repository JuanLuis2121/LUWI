import { useCallback, useEffect, useState } from "react";
import Icon from "../Icon";
import { ActionButton } from "../AdminUI";
import { ErrorBanner } from "../FormControls";
import Drawer from "../ui/Drawer";
import { CheckCircleIcon, BookIcon } from "../dashboard/icons";
import {
  getDetalleIntento,
  getResultadosPorPostulante,
  getResultadosPorProceso,
} from "../../services/resultadosService";

const ESTADO_META = {
  APROBADO: { label: "Aprobado", cls: "bg-luwi-cristal text-luwi-medio ring-luwi-medio/20", dot: "bg-luwi-medio" },
  REPROBADO: { label: "Reprobado", cls: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  EN_CURSO: { label: "En curso", cls: "bg-luwi-antique text-luwi-fawn-deep ring-luwi-fawn/40", dot: "bg-luwi-fawn-deep" },
  PENDIENTE: { label: "Pendiente", cls: "bg-luwi-panel text-luwi-texto ring-luwi-linea", dot: "bg-luwi-texto/50" },
};

function EstadoResultadoBadge({ estado }) {
  const cfg = ESTADO_META[estado] ?? ESTADO_META.PENDIENTE;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatoFecha(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

function DetalleResultadoDrawer({ item, onClose }) {
  const intentos = item?.intentos ?? [];
  const ultimoId = intentos.at(-1)?.intentoId ?? intentos.at(-1)?.id ?? intentos.at(-1)?._id ?? null;

  const [intentoId, setIntentoId] = useState(ultimoId);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setIntentoId(ultimoId);
  }, [ultimoId]);

  useEffect(() => {
    if (!item || !intentoId) {
      setDetalle(null);
      return;
    }
    let active = true;
    setCargando(true);
    setError("");
    getDetalleIntento(intentoId)
      .then((data) => active && setDetalle(data))
      .catch((e) => active && setError(e.message || "No se pudo cargar el detalle del resultado."))
      .finally(() => active && setCargando(false));
    return () => {
      active = false;
    };
  }, [item, intentoId]);

  return (
    <Drawer
      open={!!item}
      onClose={onClose}
      icon={CheckCircleIcon}
      title={item?.evaluacion?.titulo ?? "Detalle del resultado"}
      subtitle={item?.curso?.titulo ? `Curso · ${item.curso.titulo}` : ""}
    >
      {item && (
        <div className="space-y-5">
          {intentos.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-luwi-texto">Intento:</span>
              {intentos.map((it) => {
                const id = it.intentoId ?? it.id ?? it._id;
                const activo = id === intentoId;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setIntentoId(id)}
                    className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                      activo
                        ? "bg-colonial-btn text-white"
                        : "border border-luwi-linea bg-luwi-panel text-luwi-texto hover:text-luwi-profundo"
                    }`}
                  >
                    Intento #{it.numeroIntento}
                  </button>
                );
              })}
            </div>
          )}

          {error && <ErrorBanner>{error}</ErrorBanner>}

          {cargando ? (
            <div className="space-y-3" role="status" aria-label="Cargando detalle">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-luwi-antique/50" />
              ))}
            </div>
          ) : !intentoId ? (
            <p className="rounded-2xl bg-luwi-panel p-5 text-center text-sm text-luwi-texto">
              El postulante todavía no ha presentado intentos para esta evaluación.
            </p>
          ) : detalle ? (
            <>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-2xl border border-luwi-linea bg-luwi-panel p-3.5">
                  <p className="text-[11px] font-medium text-luwi-texto">Calificación</p>
                  <p className="mt-0.5 text-xl font-extrabold text-luwi-profundo">
                    {detalle.calificacion != null ? `${detalle.calificacion}%` : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-luwi-linea bg-luwi-panel p-3.5">
                  <p className="text-[11px] font-medium text-luwi-texto">Puntaje</p>
                  <p className="mt-0.5 text-xl font-extrabold text-luwi-profundo">
                    {detalle.puntajeObtenido ?? 0}/{detalle.puntajeTotal ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-luwi-linea bg-luwi-panel p-3.5">
                  <p className="text-[11px] font-medium text-luwi-texto">Resultado</p>
                  <div className="mt-1">
                    <EstadoResultadoBadge estado={detalle.resultado ?? detalle.estado} />
                  </div>
                </div>
              </div>

              <div className="text-xs text-luwi-texto">
                <span>Mínimo para aprobar: </span>
                <strong className="text-luwi-profundo">{detalle.puntajeMinimoAprobar ?? 70}%</strong>
                {detalle.fechaFinalizacion && (
                  <>
                    <span> · Finalizado el </span>
                    <strong className="text-luwi-profundo">{formatoFecha(detalle.fechaFinalizacion)}</strong>
                  </>
                )}
              </div>

              <div>
                <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-luwi-texto/75">
                  Desglose de respuestas
                </h3>
                {(detalle.respuestas ?? []).length === 0 ? (
                  <p className="rounded-xl bg-luwi-panel p-4 text-xs text-luwi-texto">
                    No hay respuestas registradas en este intento.
                  </p>
                ) : (
                  <ol className="space-y-2.5">
                    {detalle.respuestas.map((r, idx) => (
                      <li
                        key={r.preguntaId ?? idx}
                        className={`rounded-2xl border p-3.5 text-xs ${
                          r.esCorrecta
                            ? "border-luwi-medio/25 bg-luwi-cristal/40"
                            : "border-red-200/80 bg-red-50/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-luwi-profundo">
                            {idx + 1}. {r.pregunta}
                          </p>
                          <span className="shrink-0 font-bold text-luwi-profundo">
                            {r.puntosObtenidos ?? 0}/{r.puntos ?? 1} pts
                          </span>
                        </div>
                        <p className="mt-2 text-luwi-texto">
                          Respuesta elegida:{" "}
                          <strong className={r.esCorrecta ? "text-luwi-medio" : "text-red-700"}>{r.respuesta}</strong>
                        </p>
                        {!r.esCorrecta && r.respuestaCorrecta && (
                          <p className="mt-1 text-luwi-texto">
                            Respuesta correcta: <strong className="text-luwi-profundo">{r.respuestaCorrecta}</strong>
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}
    </Drawer>
  );
}

/**
 * Sección de Resultados de evaluaciones dentro de la Ficha del postulante (Entrega 5 - María C).
 */
export default function ResultadosPostulante({ procesoId, postulanteId }) {
  const [resultados, setResultados] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);

  const cargar = useCallback(async () => {
    if (!procesoId && !postulanteId) return;
    setCargando(true);
    setError("");
    try {
      const res = procesoId
        ? await getResultadosPorProceso(procesoId)
        : await getResultadosPorPostulante(postulanteId);
      setResultados(res.data ?? []);
      setResumen(res.resumen ?? null);
    } catch (err) {
      setError(err.message || "No se pudieron cargar los resultados del postulante.");
    } finally {
      setCargando(false);
    }
  }, [procesoId, postulanteId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const realizadas = resultados.filter((r) => (r.intentosUsados ?? r.intentos?.length ?? 0) > 0);

  return (
    <section
      aria-labelledby="resultados-postulante-titulo"
      className="rounded-3xl border border-luwi-linea bg-white p-5 shadow-[0_14px_38px_-22px_rgba(17,22,82,0.16)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal text-luwi-medio">
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="resultados-postulante-titulo" className="text-xl font-extrabold text-luwi-profundo">
              Resultados de evaluaciones
            </h2>
            <p className="text-xs text-luwi-texto">
              Calificaciones obtenidas, estado y desglose de intentos realizados por el postulante.
            </p>
          </div>
        </div>

        {resumen && (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-xl bg-luwi-panel px-3 py-1.5 text-xs font-semibold text-luwi-profundo ring-1 ring-inset ring-luwi-linea">
              Aprobadas: <strong>{resumen.aprobados ?? resumen.aprobadas ?? 0}</strong>
            </span>
            {(resumen.reprobados ?? 0) > 0 && (
              <span className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
                Reprobadas: <strong>{resumen.reprobados}</strong>
              </span>
            )}
            {resumen.promedio != null && (
              <span className="rounded-xl bg-luwi-cristal px-3 py-1.5 text-xs font-bold text-luwi-medio">
                Promedio: {resumen.promedio}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5">
        {error && (
          <div className="space-y-3">
            <ErrorBanner>{error}</ErrorBanner>
            <ActionButton size="sm" onClick={cargar}>
              Reintentar
            </ActionButton>
          </div>
        )}

        {cargando ? (
          <div className="space-y-2.5" role="status" aria-label="Cargando resultados">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-2xl bg-luwi-antique/50" />
            ))}
          </div>
        ) : !error && resultados.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-luwi-linea bg-luwi-panel/70 px-6 py-10 text-center">
            <p className="text-sm font-bold text-luwi-profundo">Sin evaluaciones realizadas todavía</p>
            <p className="mt-1 text-xs text-luwi-texto">
              Cuando el postulante complete una evaluación de sus cursos habilitados, sus resultados aparecerán aquí.
            </p>
          </div>
        ) : !error ? (
          <>
            {realizadas.length === 0 && (
              <p className="mb-3 rounded-2xl bg-luwi-antique/60 px-4 py-3 text-xs font-medium text-luwi-fawn-deep">
                Este postulante todavía no ha completado evaluaciones. Se muestran las evaluaciones publicadas pendientes en su ruta.
              </p>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-luwi-profundo">
                <thead className="border-y border-luwi-linea bg-luwi-panel text-[11px] uppercase tracking-[0.1em] text-luwi-texto/75">
                  <tr>
                    <th className="px-4 py-3 font-bold">Evaluación</th>
                    <th className="px-4 py-3 font-bold">Curso</th>
                    <th className="px-4 py-3 font-bold">Calificación</th>
                    <th className="px-4 py-3 font-bold">Fecha</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 text-right font-bold">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luwi-linea/70">
                  {resultados.map((r, i) => {
                    const tieneIntento = (r.intentos?.length ?? 0) > 0;
                    return (
                      <tr key={`${r.evaluacion?.id ?? i}-${r.asignacionId ?? ""}`} className="align-middle hover:bg-luwi-panel/50">
                        <td className="px-4 py-3.5 font-semibold text-luwi-profundo">{r.evaluacion?.titulo ?? "Evaluación"}</td>
                        <td className="px-4 py-3.5 text-xs text-luwi-texto">
                          <span className="inline-flex items-center gap-1.5">
                            <BookIcon className="h-3.5 w-3.5 text-luwi-fawn-deep" />
                            {r.curso?.titulo ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {r.calificacion != null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-luwi-profundo">{r.calificacion}%</span>
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-luwi-antique">
                                <div
                                  className="h-full rounded-full bg-colonial-progress"
                                  style={{ width: `${Math.min(100, Math.max(0, r.calificacion))}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-luwi-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-luwi-texto">{formatoFecha(r.fecha)}</td>
                        <td className="px-4 py-3.5">
                          <EstadoResultadoBadge estado={r.estado} />
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <ActionButton
                            size="sm"
                            variant={tieneIntento ? "edit" : "secondary"}
                            disabled={!tieneIntento}
                            onClick={() => setSeleccionado(r)}
                          >
                            <Icon name="eye" className="h-3.5 w-3.5" />
                            Ver detalle
                          </ActionButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>

      <DetalleResultadoDrawer item={seleccionado} onClose={() => setSeleccionado(null)} />
    </section>
  );
}
