import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import ConfirmModal from "../../components/ConfirmModal";
import {
  ActionButton,
  Badge,
  Bubble,
  CountPill,
  EmptyState,
  PageHeader,
  SearchBox,
  TableCard,
  TableSkeleton,
  thCls,
} from "../../components/AdminUI";
import { CheckCircleIcon, BookIcon } from "../../components/dashboard/icons";
import { ErrorBanner } from "../../components/FormControls";
import { useToast } from "../../components/ui/toast";
import { getCursos } from "../../services/cursosService";
import {
  actualizarEvaluacion,
  crearEvaluacion,
  desactivarEvaluacion,
  getEvaluaciones,
  publicarEvaluacion,
} from "../../services/evaluacionesService";

const FILTROS_ESTADO = [
  { value: "", label: "Todas" },
  { value: "PUBLICADA", label: "Publicadas" },
  { value: "BORRADOR", label: "Borrador" },
  { value: "INACTIVA", label: "Inactivas" },
];

const BADGE_ESTADO = {
  PUBLICADA: { label: "Publicada", cls: "bg-luwi-cristal text-luwi-medio ring-luwi-medio/20", dot: "bg-luwi-medio" },
  BORRADOR: { label: "Borrador", cls: "bg-luwi-antique text-luwi-fawn-deep ring-luwi-fawn/40", dot: "bg-luwi-fawn-deep" },
  INACTIVA: { label: "Inactiva", cls: "bg-luwi-panel text-luwi-texto ring-luwi-linea", dot: "bg-luwi-texto/50" },
};

export function EstadoEvaluacionBadge({ estado }) {
  const cfg = BADGE_ESTADO[estado] ?? BADGE_ESTADO.BORRADOR;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cfg.cls}`}>
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FormularioEvaluacionModal({ open, inicial, cursos, onClose, onGuardada }) {
  const toast = useToast();
  const esEdicion = Boolean(inicial?._id);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [curso, setCurso] = useState("");
  const [puntajeMinimo, setPuntajeMinimo] = useState("70");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitulo(inicial?.titulo ?? "");
    setDescripcion(inicial?.descripcion ?? "");
    setCurso(inicial?.curso?._id ?? inicial?.curso ?? "");
    setPuntajeMinimo(String(inicial?.puntajeMinimoAprobar ?? 70));
    setError("");
    setGuardando(false);
  }, [open, inicial]);

  if (!open) return null;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const tituloLimpio = titulo.trim();
    if (tituloLimpio.length < 3) {
      setError("El nombre de la evaluación debe tener al menos 3 caracteres.");
      return;
    }
    if (!esEdicion && !curso) {
      setError("Selecciona el curso asociado a la evaluación.");
      return;
    }
    const min = Number(puntajeMinimo);
    if (Number.isNaN(min) || min < 0 || min > 100) {
      setError("El porcentaje mínimo para aprobar debe estar entre 0 y 100.");
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        titulo: tituloLimpio,
        descripcion: descripcion.trim(),
        puntajeMinimoAprobar: min,
      };
      const guardada = esEdicion
        ? await actualizarEvaluacion(inicial._id, payload)
        : await crearEvaluacion({ ...payload, curso });

      toast({
        variant: "success",
        title: esEdicion ? "Evaluación actualizada" : "Evaluación creada correctamente",
        description: `“${guardada.titulo}” se guardó en el catálogo.`,
      });
      onGuardada(guardada, esEdicion);
    } catch (err) {
      setError(err.message || "No se pudo guardar la evaluación.");
    } finally {
      setGuardando(false);
    }
  }

  const cursosSeleccionables = esEdicion ? cursos : cursos.filter((c) => c.editable !== false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-luwi-noche/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-eval-titulo"
      onClick={() => !guardando && onClose()}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[26px] border border-luwi-linea bg-white shadow-[0_28px_70px_-20px_rgba(15,20,76,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-colonial-banner px-6 py-5 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-luwi-fawn">Formación · Evaluaciones</p>
          <h2 id="modal-eval-titulo" className="mt-0.5 text-xl font-extrabold">
            {esEdicion ? "Editar evaluación" : "Nueva evaluación"}
          </h2>
          <p className="mt-1 text-xs text-luwi-antique/85">
            {esEdicion
              ? "Actualiza los datos generales de la evaluación."
              : "Asocia la evaluación a un curso y luego agrega sus preguntas."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <ErrorBanner>{error}</ErrorBanner>

          <div>
            <label htmlFor="eval-titulo" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
              Nombre de la evaluación <span className="text-red-500">*</span>
            </label>
            <input
              id="eval-titulo"
              type="text"
              required
              minLength={3}
              maxLength={150}
              disabled={guardando}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej. Evaluación final de Análisis de Datos"
              className="h-11 w-full rounded-xl border border-admin-line bg-luwi-panel px-4 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white focus:ring-4 focus:ring-luwi-medio/15 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="eval-curso" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
              Curso asociado <span className="text-red-500">*</span>
            </label>
            <select
              id="eval-curso"
              required
              disabled={guardando || esEdicion}
              value={curso}
              onChange={(e) => setCurso(e.target.value)}
              className="h-11 w-full rounded-xl border border-admin-line bg-luwi-panel px-4 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white focus:ring-4 focus:ring-luwi-medio/15 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <option value="">Selecciona un curso…</option>
              {cursosSeleccionables.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.titulo}
                </option>
              ))}
            </select>
            {!esEdicion && cursosSeleccionables.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-700">
                No tienes cursos propios de tu empresa disponibles para asociar una evaluación.
              </p>
            )}
            {esEdicion && (
              <p className="mt-1 text-[11px] text-luwi-muted">
                El curso asociado no se cambia para conservar la integridad de los intentos registrados.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="eval-desc" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
              Descripción
            </label>
            <textarea
              id="eval-desc"
              rows={3}
              maxLength={1000}
              disabled={guardando}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Indica qué competencias o temas mide esta evaluación."
              className="w-full rounded-xl border border-admin-line bg-luwi-panel px-4 py-3 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white focus:ring-4 focus:ring-luwi-medio/15 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="eval-minimo" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
              Porcentaje mínimo para aprobar (%)
            </label>
            <input
              id="eval-minimo"
              type="number"
              min={0}
              max={100}
              step={1}
              disabled={guardando}
              value={puntajeMinimo}
              onChange={(e) => setPuntajeMinimo(e.target.value)}
              className="h-11 w-36 rounded-xl border border-admin-line bg-luwi-panel px-4 text-sm font-semibold text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white focus:ring-4 focus:ring-luwi-medio/15 disabled:opacity-60"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-luwi-linea pt-4">
            <ActionButton onClick={onClose} disabled={guardando}>
              Cancelar
            </ActionButton>
            <ActionButton type="submit" variant="primary" disabled={guardando}>
              <Icon name="check" className="h-4 w-4" />
              {guardando ? "Guardando…" : "Guardar"}
            </ActionButton>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EvaluacionesListPage({ abrirNuevo = false }) {
  const navigate = useNavigate();
  const { id: editarIdParam } = useParams();
  const toast = useToast();

  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("");
  const [cursoFiltro, setCursoFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [modalAbierto, setModalAbierto] = useState(abrirNuevo);
  const [editando, setEditando] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);
  const [aDesactivar, setADesactivar] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setErrorCarga("");
    try {
      const [evs, crs] = await Promise.all([getEvaluaciones(), getCursos()]);
      setEvaluaciones(evs);
      setCursos(crs);
      if (editarIdParam) {
        const encontrada = evs.find((x) => x._id === editarIdParam);
        if (encontrada) {
          setEditando(encontrada);
          setModalAbierto(true);
        }
      }
    } catch (err) {
      setErrorCarga(err.message || "No se pudieron cargar las evaluaciones.");
    } finally {
      setLoading(false);
    }
  }, [editarIdParam]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    if (abrirNuevo) {
      setEditando(null);
      setModalAbierto(true);
    }
  }, [abrirNuevo]);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    return evaluaciones.filter((ev) => {
      if (estado && ev.estado !== estado) return false;
      const cursoId = ev.curso?._id ?? ev.curso;
      if (cursoFiltro && String(cursoId) !== cursoFiltro) return false;
      if (!q) return true;
      const texto = `${ev.titulo} ${ev.descripcion ?? ""} ${ev.curso?.titulo ?? ""}`.toLowerCase();
      return texto.includes(q);
    });
  }, [evaluaciones, estado, cursoFiltro, query]);

  const cuenta = (val) => (val ? evaluaciones.filter((e) => e.estado === val).length : evaluaciones.length);
  const totalPreguntas = evaluaciones.reduce((acc, e) => acc + (e.totalPreguntas ?? 0), 0);

  function cerrarModal() {
    setModalAbierto(false);
    setEditando(null);
    if (abrirNuevo || editarIdParam) {
      navigate("/dashboard/evaluaciones", { replace: true });
    }
  }

  function alGuardar(guardada, fueEdicion) {
    setEvaluaciones((prev) =>
      fueEdicion ? prev.map((e) => (e._id === guardada._id ? { ...e, ...guardada } : e)) : [guardada, ...prev]
    );
    cerrarModal();
  }

  async function manejarPublicar(ev) {
    setProcesandoId(ev._id);
    try {
      const actualizada = await publicarEvaluacion(ev._id);
      setEvaluaciones((prev) => prev.map((x) => (x._id === ev._id ? { ...x, ...actualizada } : x)));
      toast({ variant: "success", title: "Evaluación publicada", description: `“${ev.titulo}” ya está disponible para postulantes.` });
    } catch (err) {
      toast({ variant: "error", title: "No se pudo publicar", description: err.message, duration: 7000 });
    } finally {
      setProcesandoId(null);
    }
  }

  async function manejarDesactivar(ev) {
    setADesactivar(null);
    setProcesandoId(ev._id);
    try {
      const actualizada = await desactivarEvaluacion(ev._id);
      setEvaluaciones((prev) => prev.map((x) => (x._id === ev._id ? { ...x, ...actualizada } : x)));
      toast({ variant: "success", title: "Evaluación desactivada", description: `“${ev.titulo}” pasó a estado Inactiva.` });
    } catch (err) {
      toast({ variant: "error", title: "No se pudo desactivar", description: err.message });
    } finally {
      setProcesandoId(null);
    }
  }

  const botonNueva = (
    <ActionButton
      variant="fawn"
      onClick={() => {
        setEditando(null);
        setModalAbierto(true);
      }}
    >
      <Icon name="plus" className="h-4 w-4" />
      Nueva evaluación
    </ActionButton>
  );

  return (
    <div>
      <PageHeader
        icon={CheckCircleIcon}
        seccion="Formación"
        title="Evaluaciones"
        subtitle="Crea evaluaciones por curso, administra sus preguntas y publícalas para medir el avance de los postulantes."
        stats={
          loading
            ? []
            : [
                { label: "Total evaluaciones", value: evaluaciones.length },
                { label: "Publicadas", value: cuenta("PUBLICADA") },
                { label: "En borrador", value: cuenta("BORRADOR") },
                { label: "Preguntas creadas", value: totalPreguntas },
              ]
        }
        action={botonNueva}
      />

      {errorCarga && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{errorCarga}</span>
          <ActionButton size="sm" onClick={cargar}>
            Reintentar
          </ActionButton>
        </div>
      )}

      <TableCard>
        {/* Barra de búsqueda y filtros */}
        <div className="space-y-3 border-b border-luwi-linea p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1 basis-60">
              <SearchBox
                value={query}
                onChange={setQuery}
                placeholder="Buscar por nombre de evaluación o curso…"
                className="w-full"
              />
            </div>

            <select
              aria-label="Filtrar por curso"
              value={cursoFiltro}
              onChange={(e) => setCursoFiltro(e.target.value)}
              className="h-11 max-w-xs rounded-xl border border-luwi-linea bg-luwi-panel px-3.5 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white"
            >
              <option value="">Todos los cursos</option>
              {cursos.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.titulo}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filtrar evaluaciones por estado" className="flex flex-wrap gap-1 rounded-xl bg-luwi-panel p-1 ring-1 ring-inset ring-luwi-linea">
              {FILTROS_ESTADO.map((f) => {
                const activo = estado === f.value;
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="tab"
                    aria-selected={activo}
                    onClick={() => setEstado(f.value)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      activo ? "bg-white text-luwi-medio shadow-sm" : "text-luwi-texto hover:text-luwi-profundo"
                    }`}
                  >
                    {f.label}
                    <span className={`rounded-md px-1.5 text-[10.5px] ${activo ? "bg-luwi-cristal text-luwi-medio" : "bg-white/80 text-luwi-texto/70"}`}>
                      {cuenta(f.value)}
                    </span>
                  </button>
                );
              })}
            </div>
            <CountPill>
              {filtradas.length} {filtradas.length === 1 ? "evaluación" : "evaluaciones"}
            </CountPill>
          </div>
        </div>

        {/* Contenido */}
        {loading ? (
          <TableSkeleton />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={CheckCircleIcon}
            title={query || estado || cursoFiltro ? "Sin coincidencias" : "Aún no hay evaluaciones"}
            text={
              query || estado || cursoFiltro
                ? "Ajusta la búsqueda o los filtros para ver otras evaluaciones."
                : "Crea la primera evaluación y agrégale preguntas de selección múltiple o verdadero/falso."
            }
            action={
              query || estado || cursoFiltro ? (
                <ActionButton
                  onClick={() => {
                    setQuery("");
                    setEstado("");
                    setCursoFiltro("");
                  }}
                >
                  Limpiar filtros
                </ActionButton>
              ) : (
                botonNueva
              )
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-luwi-profundo">
              <thead className="bg-luwi-panel/80">
                <tr>
                  <th className={thCls}>Evaluación</th>
                  <th className={`${thCls} px-4`}>Curso asociado</th>
                  <th className={`${thCls} px-4`}>Preguntas</th>
                  <th className={`${thCls} px-4`}>Estado</th>
                  <th className={`${thCls} px-4 text-right`}>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-luwi-linea/70">
                {filtradas.map((ev) => {
                  const ocupado = procesandoId === ev._id;
                  const editable = ev.editable !== false;
                  return (
                    <tr key={ev._id} className="align-middle transition hover:bg-luwi-panel/60">
                      <td className="px-6 py-4">
                        <div className="flex min-w-[220px] items-start gap-3">
                          <Bubble>
                            <CheckCircleIcon className="h-4 w-4" />
                          </Bubble>
                          <div className="min-w-0">
                            <Link
                              to={`/dashboard/evaluaciones/${ev._id}/preguntas`}
                              className="font-semibold text-luwi-profundo transition hover:text-luwi-medio hover:underline"
                            >
                              {ev.titulo}
                            </Link>
                            {ev.descripcion && (
                              <p className="mt-0.5 line-clamp-2 max-w-[340px] text-xs text-luwi-texto/80">{ev.descripcion}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="inline-flex items-center gap-2 text-xs font-medium text-luwi-profundo">
                          <BookIcon className="h-3.5 w-3.5 shrink-0 text-luwi-fawn-deep" />
                          <span className="max-w-[220px] truncate">{ev.curso?.titulo ?? "Curso sin título"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Badge>
                            {ev.totalPreguntas ?? 0} {(ev.totalPreguntas ?? 0) === 1 ? "pregunta" : "preguntas"}
                          </Badge>
                          <span className="text-xs text-luwi-muted">Mín. {ev.puntajeMinimoAprobar ?? 70}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <EstadoEvaluacionBadge estado={ev.estado} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <ActionButton
                            size="sm"
                            variant="edit"
                            to={`/dashboard/evaluaciones/${ev._id}/preguntas`}
                            title="Gestionar preguntas"
                          >
                            <Icon name="layers" className="h-3.5 w-3.5" />
                            Preguntas
                          </ActionButton>
                          {editable && (
                            <>
                              <ActionButton
                                size="sm"
                                disabled={ocupado}
                                onClick={() => {
                                  setEditando(ev);
                                  setModalAbierto(true);
                                }}
                                aria-label={`Editar ${ev.titulo}`}
                                title="Editar evaluación"
                              >
                                <Icon name="pencil" className="h-3.5 w-3.5" />
                              </ActionButton>
                              {ev.estado !== "PUBLICADA" && (
                                <ActionButton
                                  size="sm"
                                  variant="primary"
                                  disabled={ocupado}
                                  onClick={() => manejarPublicar(ev)}
                                  title="Publicar evaluación"
                                >
                                  <Icon name="send" className="h-3.5 w-3.5" />
                                  {ocupado ? "…" : "Publicar"}
                                </ActionButton>
                              )}
                              {ev.estado !== "INACTIVA" && (
                                <ActionButton
                                  size="sm"
                                  variant="danger"
                                  disabled={ocupado}
                                  onClick={() => setADesactivar(ev)}
                                  aria-label={`Desactivar ${ev.titulo}`}
                                  title="Desactivar evaluación"
                                >
                                  <Icon name="ban" className="h-3.5 w-3.5" />
                                </ActionButton>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      <FormularioEvaluacionModal
        open={modalAbierto}
        inicial={editando}
        cursos={cursos}
        onClose={cerrarModal}
        onGuardada={alGuardar}
      />

      <ConfirmModal
        open={!!aDesactivar}
        title="Desactivar evaluación"
        message={
          aDesactivar
            ? `¿Desactivar "${aDesactivar.titulo}"? Los postulantes dejarán de poder iniciarla, pero los resultados anteriores se conservarán.`
            : ""
        }
        confirmLabel="Desactivar"
        loadingLabel="Desactivando…"
        loading={false}
        onConfirm={() => manejarDesactivar(aDesactivar)}
        onCancel={() => setADesactivar(null)}
      />
    </div>
  );
}
