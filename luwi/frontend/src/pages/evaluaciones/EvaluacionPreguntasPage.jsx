import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import { ActionButton, Badge, EmptyState, PageHeader, TableCard } from "../../components/AdminUI";
import { CheckCircleIcon } from "../../components/dashboard/icons";
import { ErrorBanner } from "../../components/FormControls";
import { useToast } from "../../components/ui/toast";
import { EstadoEvaluacionBadge } from "./EvaluacionesListPage";
import {
  TIPOS_PREGUNTA,
  actualizarPregunta,
  crearPregunta,
  desactivarEvaluacion,
  getEvaluacion,
  publicarEvaluacion,
  retirarPregunta,
} from "../../services/evaluacionesService";

const OPCIONES_INICIALES = ["", ""];

export default function EvaluacionPreguntasPage() {
  const { id: evaluacionId } = useParams();
  const toast = useToast();

  const [evaluacion, setEvaluacion] = useState(null);
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // Estado del formulario de pregunta (alta / edición)
  const [editandoId, setEditandoId] = useState(null);
  const [enunciado, setEnunciado] = useState("");
  const [tipo, setTipo] = useState(TIPOS_PREGUNTA.SELECCION_MULTIPLE);
  const [opciones, setOpciones] = useState(OPCIONES_INICIALES);
  const [respuestaCorrecta, setRespuestaCorrecta] = useState("");
  const [puntos, setPuntos] = useState("1");
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState("");

  // Acciones sobre preguntas y estado de evaluación
  const [aRetirar, setARetirar] = useState(null);
  const [retirando, setRetirando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga("");
    try {
      const ev = await getEvaluacion(evaluacionId);
      setEvaluacion(ev);
      setPreguntas(ev.preguntas ?? []);
    } catch (err) {
      setErrorCarga(err.message || "No se pudo cargar la evaluación.");
    } finally {
      setLoading(false);
    }
  }, [evaluacionId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function reiniciarFormulario() {
    setEditandoId(null);
    setEnunciado("");
    setTipo(TIPOS_PREGUNTA.SELECCION_MULTIPLE);
    setOpciones(["", ""]);
    setRespuestaCorrecta("");
    setPuntos("1");
    setErrorForm("");
  }

  function cambiarTipo(nuevoTipo) {
    setTipo(nuevoTipo);
    setErrorForm("");
    if (nuevoTipo === TIPOS_PREGUNTA.VERDADERO_FALSO) {
      setRespuestaCorrecta("Verdadero");
    } else {
      setOpciones((prev) => (prev.length >= 2 ? prev : ["", ""]));
      setRespuestaCorrecta("");
    }
  }

  function cargarParaEditar(p) {
    setEditandoId(p._id);
    setEnunciado(p.pregunta ?? "");
    const t = p.tipo === TIPOS_PREGUNTA.VERDADERO_FALSO ? TIPOS_PREGUNTA.VERDADERO_FALSO : TIPOS_PREGUNTA.SELECCION_MULTIPLE;
    setTipo(t);
    setOpciones(t === TIPOS_PREGUNTA.SELECCION_MULTIPLE ? [...(p.opciones ?? ["", ""])] : ["", ""]);
    setRespuestaCorrecta(p.respuestaCorrecta ?? "");
    setPuntos(String(p.puntos ?? 1));
    setErrorForm("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function actualizarOpcion(indice, valor) {
    setOpciones((prev) => {
      const anterior = prev[indice];
      const next = prev.map((o, i) => (i === indice ? valor : o));
      if (respuestaCorrecta && respuestaCorrecta === anterior) {
        setRespuestaCorrecta(valor);
      }
      return next;
    });
  }

  function agregarCampoOpcion() {
    if (opciones.length >= 6) return;
    setOpciones((prev) => [...prev, ""]);
  }

  function quitarCampoOpcion(indice) {
    if (opciones.length <= 2) return;
    setOpciones((prev) => {
      const eliminada = prev[indice];
      if (respuestaCorrecta === eliminada) setRespuestaCorrecta("");
      return prev.filter((_, i) => i !== indice);
    });
  }

  async function onSubmitPregunta(e) {
    e.preventDefault();
    setErrorForm("");

    const texto = enunciado.trim();
    if (texto.length < 3) {
      setErrorForm("Escribe un enunciado de al menos 3 caracteres.");
      return;
    }

    const pts = Number(puntos);
    if (Number.isNaN(pts) || pts < 0.1 || pts > 100) {
      setErrorForm("La puntuación debe ser un número entre 0.1 y 100.");
      return;
    }

    let opcionesLimpias = ["Verdadero", "Falso"];
    let correcta = respuestaCorrecta.trim();

    if (tipo === TIPOS_PREGUNTA.SELECCION_MULTIPLE) {
      opcionesLimpias = opciones.map((o) => o.trim()).filter(Boolean);
      if (opcionesLimpias.length < 2) {
        setErrorForm("Ingresa al menos 2 opciones válidas para selección múltiple.");
        return;
      }
      if (new Set(opcionesLimpias.map((o) => o.toLowerCase())).size !== opcionesLimpias.length) {
        setErrorForm("Las opciones no pueden repetirse.");
        return;
      }
      if (!correcta || !opcionesLimpias.includes(correcta)) {
        setErrorForm("Marca cuál de las opciones es la respuesta correcta.");
        return;
      }
    } else if (!["Verdadero", "Falso"].includes(correcta)) {
      setErrorForm("Selecciona si la respuesta correcta es Verdadero o Falso.");
      return;
    }

    const payload = {
      pregunta: texto,
      tipo,
      opciones: opcionesLimpias,
      respuestaCorrecta: correcta,
      puntos: pts,
    };

    setGuardando(true);
    try {
      const res = editandoId
        ? await actualizarPregunta(evaluacionId, editandoId, payload)
        : await crearPregunta(evaluacionId, payload);

      setPreguntas(res.preguntas ?? []);
      setEvaluacion((prev) =>
        prev
          ? {
              ...prev,
              estado: res.estado ?? prev.estado,
              totalPreguntas: res.totalPreguntas ?? (res.preguntas?.length ?? prev.totalPreguntas),
              puntajeTotal: res.puntajeTotal ?? prev.puntajeTotal,
            }
          : prev
      );
      toast({
        variant: "success",
        title: editandoId ? "Pregunta actualizada" : "Pregunta agregada",
      });
      reiniciarFormulario();
    } catch (err) {
      setErrorForm(err.message || "No se pudo guardar la pregunta.");
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarRetiro() {
    if (!aRetirar) return;
    setRetirando(true);
    try {
      const res = await retirarPregunta(evaluacionId, aRetirar._id);
      setPreguntas(res.preguntas ?? []);
      setEvaluacion((prev) =>
        prev
          ? {
              ...prev,
              estado: res.estado ?? prev.estado,
              totalPreguntas: res.totalPreguntas ?? prev.totalPreguntas,
              puntajeTotal: res.puntajeTotal ?? prev.puntajeTotal,
            }
          : prev
      );
      if (editandoId === aRetirar._id) reiniciarFormulario();
      toast({ variant: "success", title: "Pregunta retirada de la evaluación" });
      setARetirar(null);
    } catch (err) {
      toast({ variant: "error", title: "No se pudo retirar la pregunta", description: err.message });
    } finally {
      setRetirando(false);
    }
  }

  async function alternarPublicacion() {
    if (!evaluacion) return;
    setCambiandoEstado(true);
    try {
      const actualizada =
        evaluacion.estado === "PUBLICADA"
          ? await desactivarEvaluacion(evaluacionId)
          : await publicarEvaluacion(evaluacionId);
      setEvaluacion((prev) => ({ ...prev, ...actualizada }));
      toast({
        variant: "success",
        title: actualizada.estado === "PUBLICADA" ? "Evaluación publicada" : "Evaluación desactivada",
      });
    } catch (err) {
      toast({ variant: "error", title: "No se pudo cambiar el estado", description: err.message, duration: 7000 });
    } finally {
      setCambiandoEstado(false);
    }
  }

  const editable = evaluacion?.editable !== false;
  const puntajeTotal = preguntas.reduce((s, p) => s + (Number(p.puntos) || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/dashboard/evaluaciones"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-luwi-medio transition hover:text-luwi-profundo"
        >
          <Icon name="arrowLeft" className="h-3.5 w-3.5" />
          Volver a evaluaciones
        </Link>
      </div>

      {loading ? (
        <div className="h-44 animate-pulse rounded-[26px] bg-luwi-antique/50" />
      ) : errorCarga ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          <p>{errorCarga}</p>
          <div className="mt-4">
            <ActionButton size="sm" onClick={cargar}>
              Reintentar
            </ActionButton>
          </div>
        </div>
      ) : (
        <>
          <PageHeader
            icon={CheckCircleIcon}
            seccion={evaluacion?.curso?.titulo ? `Curso · ${evaluacion.curso.titulo}` : "Administración de preguntas"}
            title={evaluacion?.titulo ?? "Evaluación"}
            subtitle={evaluacion?.descripcion || "Administra el banco de preguntas, opciones y puntuación de esta evaluación."}
            stats={[
              { label: "Estado", value: evaluacion?.estado ?? "BORRADOR" },
              { label: "Preguntas vigentes", value: preguntas.length },
              { label: "Puntaje total", value: `${puntajeTotal} pts` },
              { label: "Mínimo aprobar", value: `${evaluacion?.puntajeMinimoAprobar ?? 70}%` },
            ]}
            action={
              editable && (
                <ActionButton
                  variant={evaluacion?.estado === "PUBLICADA" ? "secondary" : "fawn"}
                  disabled={cambiandoEstado}
                  onClick={alternarPublicacion}
                >
                  <Icon name={evaluacion?.estado === "PUBLICADA" ? "ban" : "send"} className="h-4 w-4" />
                  {cambiandoEstado
                    ? "Procesando…"
                    : evaluacion?.estado === "PUBLICADA"
                      ? "Desactivar"
                      : "Publicar evaluación"}
                </ActionButton>
              )
            }
          />

          <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
            {/* Formulario para agregar / editar preguntas */}
            {editable && (
              <section className="h-fit rounded-[26px] border border-luwi-linea bg-white p-6 shadow-[0_14px_38px_-22px_rgba(17,22,82,0.18)]">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-extrabold text-luwi-profundo">
                      {editandoId ? "Editar pregunta" : "Nueva pregunta"}
                    </h2>
                    <p className="text-xs text-luwi-texto">
                      Define el enunciado, el tipo de pregunta, las opciones y la respuesta correcta.
                    </p>
                  </div>
                  {editandoId && (
                    <span className="rounded-full bg-luwi-antique px-2.5 py-1 text-[11px] font-bold text-luwi-fawn-deep">
                      Editando
                    </span>
                  )}
                </div>

                <form onSubmit={onSubmitPregunta} className="space-y-4">
                  <ErrorBanner>{errorForm}</ErrorBanner>

                  <div>
                    <label htmlFor="preg-enunciado" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
                      Enunciado <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="preg-enunciado"
                      rows={3}
                      required
                      disabled={guardando}
                      value={enunciado}
                      onChange={(e) => setEnunciado(e.target.value)}
                      placeholder="Escribe la pregunta que responderá el postulante…"
                      className="w-full rounded-xl border border-admin-line bg-luwi-panel px-3.5 py-2.5 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white focus:ring-4 focus:ring-luwi-medio/15 disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-[1fr_110px] gap-3">
                    <div>
                      <label htmlFor="preg-tipo" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
                        Tipo de pregunta
                      </label>
                      <select
                        id="preg-tipo"
                        disabled={guardando}
                        value={tipo}
                        onChange={(e) => cambiarTipo(e.target.value)}
                        className="h-11 w-full rounded-xl border border-admin-line bg-luwi-panel px-3 text-sm font-medium text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white"
                      >
                        <option value={TIPOS_PREGUNTA.SELECCION_MULTIPLE}>Selección múltiple</option>
                        <option value={TIPOS_PREGUNTA.VERDADERO_FALSO}>Verdadero / Falso</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="preg-puntos" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
                        Puntuación
                      </label>
                      <input
                        id="preg-puntos"
                        type="number"
                        min={0.1}
                        max={100}
                        step={0.5}
                        required
                        disabled={guardando}
                        value={puntos}
                        onChange={(e) => setPuntos(e.target.value)}
                        className="h-11 w-full rounded-xl border border-admin-line bg-luwi-panel px-3 text-sm font-semibold text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white"
                      />
                    </div>
                  </div>

                  {tipo === TIPOS_PREGUNTA.SELECCION_MULTIPLE ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-luwi-profundo">
                          Opciones (marca la correcta)
                        </span>
                        {opciones.length < 6 && (
                          <button
                            type="button"
                            disabled={guardando}
                            onClick={agregarCampoOpcion}
                            className="text-xs font-bold text-luwi-medio hover:underline disabled:opacity-50"
                          >
                            + Agregar opción
                          </button>
                        )}
                      </div>

                      {opciones.map((op, i) => {
                        const limpia = op.trim();
                        const esCorrecta = Boolean(limpia) && respuestaCorrecta === op;
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="respuesta-correcta-sm"
                              aria-label={`Marcar opción ${i + 1} como correcta`}
                              disabled={guardando || !limpia}
                              checked={esCorrecta}
                              onChange={() => setRespuestaCorrecta(op)}
                              className="h-4 w-4 shrink-0 accent-luwi-medio"
                            />
                            <input
                              type="text"
                              disabled={guardando}
                              value={op}
                              onChange={(e) => actualizarOpcion(i, e.target.value)}
                              placeholder={`Opción ${i + 1}`}
                              className={`h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm text-luwi-profundo outline-none transition ${
                                esCorrecta
                                  ? "border-luwi-medio bg-luwi-cristal/60 font-medium"
                                  : "border-admin-line bg-luwi-panel focus:border-luwi-medio focus:bg-white"
                              }`}
                            />
                            {opciones.length > 2 && (
                              <button
                                type="button"
                                disabled={guardando}
                                onClick={() => quitarCampoOpcion(i)}
                                aria-label={`Quitar opción ${i + 1}`}
                                className="rounded-lg p-2 text-luwi-muted transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Icon name="trash" className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="block text-xs font-semibold text-luwi-profundo">
                        Respuesta correcta (Verdadero / Falso)
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        {["Verdadero", "Falso"].map((val) => {
                          const activo = respuestaCorrecta === val;
                          return (
                            <label
                              key={val}
                              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                                activo
                                  ? "border-luwi-medio bg-luwi-cristal text-luwi-medio"
                                  : "border-admin-line bg-luwi-panel text-luwi-texto hover:border-luwi-medio/40"
                              }`}
                            >
                              <input
                                type="radio"
                                name="respuesta-correcta-vf"
                                value={val}
                                disabled={guardando}
                                checked={activo}
                                onChange={() => setRespuestaCorrecta(val)}
                                className="h-4 w-4 accent-luwi-medio"
                              />
                              {val}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap justify-end gap-2.5 border-t border-luwi-linea pt-4">
                    {editandoId && (
                      <ActionButton onClick={reiniciarFormulario} disabled={guardando}>
                        Cancelar
                      </ActionButton>
                    )}
                    <ActionButton type="submit" variant="primary" disabled={guardando}>
                      <Icon name={editandoId ? "check" : "plus"} className="h-4 w-4" />
                      {guardando
                        ? "Guardando…"
                        : editandoId
                          ? "Guardar cambios"
                          : "Agregar pregunta"}
                    </ActionButton>
                  </div>
                </form>
              </section>
            )}

            {/* Lista de preguntas registradas */}
            <TableCard>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-luwi-linea px-6 py-4">
                <div>
                  <h2 className="text-base font-extrabold text-luwi-profundo">Preguntas registradas</h2>
                  <p className="text-xs text-luwi-texto">
                    {preguntas.length} {preguntas.length === 1 ? "pregunta activa" : "preguntas activas"} · {puntajeTotal} pts en total
                  </p>
                </div>
                <EstadoEvaluacionBadge estado={evaluacion?.estado} />
              </div>

              {preguntas.length === 0 ? (
                <EmptyState
                  icon={CheckCircleIcon}
                  title="Esta evaluación todavía no tiene preguntas"
                  text="Usa el formulario lateral para agregar preguntas de selección múltiple o verdadero/falso."
                />
              ) : (
                <ol className="divide-y divide-luwi-linea/70">
                  {preguntas.map((p, idx) => (
                    <li
                      key={p._id}
                      className={`p-5 transition ${editandoId === p._id ? "bg-luwi-cristal/35" : "hover:bg-luwi-panel/50"}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-colonial-btn text-xs font-extrabold text-white">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-luwi-profundo">{p.pregunta}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <Badge>
                                {p.tipo === TIPOS_PREGUNTA.VERDADERO_FALSO ? "Verdadero / Falso" : "Selección múltiple"}
                              </Badge>
                              <span className="rounded-full bg-luwi-antique px-2.5 py-0.5 text-xs font-bold text-luwi-fawn-deep">
                                {p.puntos} {Number(p.puntos) === 1 ? "pto" : "pts"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {editable && (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <ActionButton
                              size="sm"
                              variant="edit"
                              onClick={() => cargarParaEditar(p)}
                              aria-label={`Editar pregunta ${idx + 1}`}
                              title="Editar pregunta"
                            >
                              <Icon name="pencil" className="h-3.5 w-3.5" />
                            </ActionButton>
                            <ActionButton
                              size="sm"
                              variant="danger"
                              onClick={() => setARetirar(p)}
                              aria-label={`Retirar pregunta ${idx + 1}`}
                              title="Retirar pregunta"
                            >
                              <Icon name="trash" className="h-3.5 w-3.5" />
                            </ActionButton>
                          </div>
                        )}
                      </div>

                      <ul className="mt-3 grid gap-2 pl-11 sm:grid-cols-2">
                        {(p.opciones ?? []).map((op) => {
                          const correcta = op === p.respuestaCorrecta;
                          return (
                            <li
                              key={op}
                              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                                correcta
                                  ? "border-luwi-medio/40 bg-luwi-cristal/70 font-bold text-luwi-profundo"
                                  : "border-luwi-linea bg-luwi-panel/70 text-luwi-texto"
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                                  correcta ? "bg-luwi-medio text-white" : "bg-white ring-1 ring-admin-line"
                                }`}
                              >
                                {correcta ? "✓" : ""}
                              </span>
                              <span className="break-words">{op}</span>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ol>
              )}
            </TableCard>
          </div>
        </>
      )}

      <ConfirmModal
        open={!!aRetirar}
        title="Retirar pregunta"
        message={
          aRetirar
            ? `¿Retirar la pregunta "${aRetirar.pregunta}"? Dejará de mostrarse en futuros intentos, conservando el historial de respuestas anteriores.`
            : ""
        }
        confirmLabel="Retirar pregunta"
        loadingLabel="Retirando…"
        loading={retirando}
        onConfirm={confirmarRetiro}
        onCancel={() => setARetirar(null)}
      />
    </div>
  );
}
