import { useCallback, useEffect, useState } from "react";
import { ActionButton } from "../AdminUI";
import { ErrorBanner } from "../FormControls";
import { CheckCircleIcon, LockIcon } from "../dashboard/icons";
import { useToast } from "../ui/toast";
import {
  enviarRespuestasEvaluacion,
  getEvaluacionesDeCurso,
  iniciarIntentoEvaluacion,
} from "../../services/formacionService";

/**
 * Evaluaciones de un curso para el postulante (reglas del backend de Marlon):
 * 1. Debe haber revisado todas las unidades obligatorias para poder iniciar.
 * 2. Máximo 2 intentos; debe responder todas las preguntas. Nota oficial = calificación más alta.
 * 3. Las respuestas correctas solo se muestran cuando ya no le quedan intentos.
 */
export default function EvaluacionesCurso({ asignacionId, cursoAsignadoId, avanceKey }) {
  const toast = useToast();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // Intento activo en pantalla
  const [sesion, setSesion] = useState(null); // { evaluacionId, intento, intentosRestantes, evaluacion }
  const [respuestas, setRespuestas] = useState({});
  const [iniciandoId, setIniciandoId] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  // Último resultado recién calificado
  const [resultadoReciente, setResultadoReciente] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const data = await getEvaluacionesDeCurso(asignacionId, cursoAsignadoId);
      setDatos(data);
    } catch (err) {
      // Si el endpoint aún no está disponible en una rama sin mergear, no rompe el curso
      if (err?.status === 404) {
        setDatos({ evaluaciones: [], contenidosRevisados: false });
      } else {
        setError(err.message || "No pudimos cargar las evaluaciones del curso.");
      }
    } finally {
      setCargando(false);
    }
  }, [asignacionId, cursoAsignadoId]);

  useEffect(() => {
    cargar();
  }, [cargar, avanceKey]);

  async function manejarIniciar(ev) {
    setIniciandoId(ev.evaluacionId);
    setErrorEnvio("");
    setResultadoReciente(null);
    try {
      const res = await iniciarIntentoEvaluacion(asignacionId, cursoAsignadoId, ev.evaluacionId);
      setSesion({
        evaluacionId: ev.evaluacionId,
        intento: res.intento,
        intentosRestantes: res.intentosRestantes,
        evaluacion: res.evaluacion,
      });
      setRespuestas({});
      if (res.message) toast({ variant: "info", title: res.message });
    } catch (err) {
      toast({ variant: "error", title: "No se pudo iniciar", description: err.message });
    } finally {
      setIniciandoId(null);
    }
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    if (!sesion) return;

    const preguntas = sesion.evaluacion?.preguntas ?? [];
    const faltan = preguntas.filter((p) => !respuestas[p._id]);
    if (faltan.length > 0) {
      setErrorEnvio(`Debes responder todas las preguntas antes de enviar (faltan ${faltan.length}).`);
      return;
    }

    setEnviando(true);
    setErrorEnvio("");
    try {
      const listaRespuestas = preguntas.map((p) => ({
        pregunta: p._id,
        respuesta: respuestas[p._id],
      }));
      const res = await enviarRespuestasEvaluacion(
        asignacionId,
        cursoAsignadoId,
        sesion.evaluacionId,
        sesion.intento.intentoId,
        listaRespuestas
      );
      setResultadoReciente({ titulo: sesion.evaluacion.titulo, ...res });
      setSesion(null);
      setRespuestas({});
      toast({
        variant: res.resultado === "APROBADO" ? "success" : "info",
        title: res.message || "Evaluación enviada",
        description: `Calificación obtenida: ${res.calificacion}%`,
      });
      await cargar();
    } catch (err) {
      setErrorEnvio(err.message || "No se pudieron enviar tus respuestas.");
    } finally {
      setEnviando(false);
    }
  }

  if (cargando && !datos) return null;
  const evaluaciones = datos?.evaluaciones ?? [];
  if (!error && evaluaciones.length === 0 && !sesion && !resultadoReciente) return null;

  const preguntasActivas = sesion?.evaluacion?.preguntas ?? [];
  const contestadas = preguntasActivas.filter((p) => Boolean(respuestas[p._id])).length;

  return (
    <section
      aria-labelledby="evaluaciones-curso-titulo"
      className="rounded-[26px] border border-luwi-linea bg-white p-6 shadow-[0_14px_40px_-24px_rgba(17,22,82,0.16)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-colonial-btn text-white">
            <CheckCircleIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-luwi-fawn-deep">Evaluación del curso</p>
            <h2 id="evaluaciones-curso-titulo" className="text-xl font-extrabold text-luwi-profundo">
              Comprueba tu aprendizaje
            </h2>
            <p className="mt-0.5 text-xs text-luwi-texto">
              Tienes hasta 2 intentos por evaluación. Tu nota oficial siempre será la calificación más alta.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorBanner>{error}</ErrorBanner>
        </div>
      )}

      {/* Aviso de requisito: revisar todas las unidades obligatorias */}
      {datos && !datos.contenidosRevisados && (
        <div className="mt-4 flex items-center gap-2.5 rounded-2xl border border-luwi-fawn/40 bg-luwi-antique/60 px-4 py-3 text-xs font-medium text-luwi-profundo">
          <LockIcon className="h-4 w-4 shrink-0 text-luwi-fawn-deep" />
          <span>
            Para presentar la evaluación debes revisar primero todas las unidades obligatorias del curso (
            <strong>
              {datos.unidadesObligatorias?.revisadas ?? 0}/{datos.unidadesObligatorias?.total ?? 0}
            </strong>
            ).
          </span>
        </div>
      )}

      {/* Resultado recién enviado */}
      {resultadoReciente && (
        <div className="mt-5 rounded-2xl border border-luwi-linea bg-luwi-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-luwi-fawn-deep">Resultado registrado</p>
              <h3 className="text-lg font-extrabold text-luwi-profundo">{resultadoReciente.titulo}</h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-luwi-medio">{resultadoReciente.calificacion}%</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  resultadoReciente.resultado === "APROBADO"
                    ? "bg-luwi-cristal text-luwi-medio"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {resultadoReciente.resultado === "APROBADO" ? "Aprobado" : "Reprobado"}
              </span>
            </div>
          </div>

          <p className="mt-2 text-xs text-luwi-texto">
            Puntaje: <strong>{resultadoReciente.puntajeObtenido}/{resultadoReciente.puntajeTotal}</strong> · Mínimo para aprobar:{" "}
            <strong>{resultadoReciente.puntajeMinimoAprobar}%</strong>
            {resultadoReciente.notaOficial && (
              <>
                {" "}
                · Nota oficial: <strong className="text-luwi-profundo">{resultadoReciente.notaOficial.calificacion}%</strong>
              </>
            )}
          </p>

          {resultadoReciente.intentosRestantes > 0 ? (
            <p className="mt-3 rounded-xl bg-luwi-antique/70 px-3.5 py-2.5 text-xs text-luwi-profundo">
              Aún te queda <strong>{resultadoReciente.intentosRestantes} intento</strong> disponible. Las respuestas correctas se mostrarán solo cuando agotes tus intentos.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-bold text-luwi-profundo">Revisión de respuestas (intentos completados):</p>
              {(resultadoReciente.detalle ?? []).map((d, i) => (
                <div
                  key={d.preguntaId ?? i}
                  className={`rounded-xl border p-3 text-xs ${
                    d.esCorrecta ? "border-luwi-medio/25 bg-white" : "border-red-200 bg-red-50/50"
                  }`}
                >
                  <p className="font-bold text-luwi-profundo">
                    {i + 1}. {d.pregunta}
                  </p>
                  <p className="mt-1 text-luwi-texto">
                    Tu respuesta: <strong className={d.esCorrecta ? "text-luwi-medio" : "text-red-700"}>{d.respuesta}</strong>
                  </p>
                  {!d.esCorrecta && d.respuestaCorrecta && (
                    <p className="mt-0.5 text-luwi-texto">
                      Respuesta correcta: <strong className="text-luwi-profundo">{d.respuestaCorrecta}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulario activo de evaluación en curso */}
      {sesion ? (
        <form onSubmit={manejarEnviar} className="mt-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-colonial-banner px-5 py-4 text-white">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-luwi-fawn">
                Intento #{sesion.intento.numeroIntento} de 2
              </p>
              <h3 className="text-lg font-extrabold">{sesion.evaluacion.titulo}</h3>
            </div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-luwi-antique">
              Respondidas: {contestadas}/{preguntasActivas.length}
            </span>
          </div>

          <ErrorBanner>{errorEnvio}</ErrorBanner>

          <ol className="space-y-4">
            {preguntasActivas.map((p, idx) => (
              <li key={p._id} className="rounded-2xl border border-luwi-linea bg-luwi-panel/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-bold text-luwi-profundo">
                    {idx + 1}. {p.pregunta}
                  </p>
                  <span className="shrink-0 rounded-full bg-luwi-antique px-2.5 py-0.5 text-[11px] font-bold text-luwi-fawn-deep">
                    {p.puntos} {Number(p.puntos) === 1 ? "pto" : "pts"}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {(p.opciones ?? []).map((op) => {
                    const elegida = respuestas[p._id] === op;
                    return (
                      <label
                        key={op}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm transition ${
                          elegida
                            ? "border-luwi-medio bg-luwi-cristal font-semibold text-luwi-profundo"
                            : "border-luwi-linea bg-white text-luwi-texto hover:border-luwi-medio/40"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`preg-${p._id}`}
                          value={op}
                          disabled={enviando}
                          checked={elegida}
                          onChange={() => {
                            setRespuestas((prev) => ({ ...prev, [p._id]: op }));
                            setErrorEnvio("");
                          }}
                          className="h-4 w-4 shrink-0 accent-luwi-medio"
                        />
                        <span className="break-words">{op}</span>
                      </label>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-luwi-linea pt-4">
            <p className="text-xs text-luwi-texto">Debes responder todas las preguntas para enviar tu intento.</p>
            <div className="flex gap-2.5">
              <ActionButton onClick={() => setSesion(null)} disabled={enviando}>
                Salir sin enviar
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                disabled={enviando || contestadas < preguntasActivas.length}
              >
                {enviando ? "Calificando…" : "Enviar respuestas"}
              </ActionButton>
            </div>
          </div>
        </form>
      ) : (
        /* Lista de evaluaciones publicadas del curso */
        <ul className="mt-5 space-y-3">
          {evaluaciones.map((ev) => {
            const ocupada = iniciandoId === ev.evaluacionId;
            return (
              <li
                key={ev.evaluacionId}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-luwi-linea bg-luwi-panel/70 p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-extrabold text-luwi-profundo">{ev.titulo}</h3>
                    {ev.notaOficial && (
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          ev.notaOficial.resultado === "APROBADO"
                            ? "bg-luwi-cristal text-luwi-medio"
                            : "bg-luwi-antique text-luwi-fawn-deep"
                        }`}
                      >
                        Nota oficial: {ev.notaOficial.calificacion}% ({ev.notaOficial.resultado})
                      </span>
                    )}
                  </div>
                  {ev.descripcion && <p className="mt-0.5 text-xs text-luwi-texto">{ev.descripcion}</p>}
                  <p className="mt-1.5 text-xs text-luwi-texto/80">
                    {ev.totalPreguntas} preguntas · Mínimo {ev.puntajeMinimoAprobar}% · Intentos:{" "}
                    <strong>
                      {ev.intentosUsados}/{ev.maxIntentos ?? 2}
                    </strong>
                  </p>
                  {ev.motivo && <p className="mt-1 text-xs font-medium text-luwi-fawn-deep">{ev.motivo}</p>}
                </div>

                <ActionButton
                  variant={ev.disponible ? "primary" : "secondary"}
                  disabled={!ev.disponible || ocupada}
                  onClick={() => manejarIniciar(ev)}
                >
                  {ocupada
                    ? "Cargando…"
                    : ev.intentoEnCurso
                      ? "Continuar intento"
                      : ev.intentosUsados > 0
                        ? "Nuevo intento"
                        : "Iniciar evaluación"}
                </ActionButton>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
