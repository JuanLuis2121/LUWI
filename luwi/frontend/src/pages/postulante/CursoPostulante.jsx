import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProgressBar from "../../components/postulante/ProgressBar";
import Celebracion from "../../components/postulante/Celebracion";
import EvaluacionesCurso from "../../components/postulante/EvaluacionesCurso";
import { Aviso, Cargando, ErrorCarga } from "../../components/postulante/Avisos";
import {
  ArrowRightIcon, BookIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, ExternalLinkIcon,
} from "../../components/dashboard/icons";
import { useToast } from "../../components/ui/toast";
import {
  getCursoAsignado,
  getMiFormacion,
  guardarUltimaConsulta,
  marcarUnidadRevisada,
  MENSAJE_ERROR_AVANCE,
} from "../../services/formacionService";
import { formatoHoras } from "../../utils/formacion";
import { urlIncrustable, minutosLectura, leerNota, guardarNota } from "../../utils/recursos";

const SIN_ACCESO = "Ya no tienes acceso a ese curso.";

// ---------- Íconos de tipo de unidad ----------

const trazo = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const TIPOS = {
  TEXTO: {
    label: "Lectura",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h7" />
      </svg>
    ),
  },
  VIDEO: {
    label: "Video",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M10 9l5 3-5 3z" />
      </svg>
    ),
  },
  ENLACE: {
    label: "Enlace",
    icon: (p) => (
      <svg {...trazo} {...p}>
        <path d="M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1" />
      </svg>
    ),
  },
};

const EnfoqueIcon = (p) => (
  <svg {...trazo} {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);

// ---------- Utilidades ----------

/** Unidad con la que se abre el curso. */
function unidadInicial({ unidades, ultimaUnidadId }) {
  if (ultimaUnidadId && unidades.some((u) => u._id === ultimaUnidadId)) return ultimaUnidadId;
  const pendiente = unidades.find((u) => u.obligatoria && !u.revisada);
  return (pendiente ?? unidades.at(0))?._id ?? null;
}

const escribiendo = (e) => ["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target.isContentEditable;

const botonSecundario =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-luwi-linea bg-white px-4 py-2.5 text-sm font-semibold text-luwi-profundo transition hover:border-luwi-tecno/40 hover:bg-luwi-cristal-fondo focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white";

const botonPrincipal =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(17,22,82,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30 disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0";

// ---------- Índice de unidades ----------

function IndiceUnidades({ unidades, actualId, onSelect }) {
  const revisadas = unidades.filter((u) => u.revisada).length;
  return (
    <nav aria-label="Unidades del curso" className="rounded-[24px] border border-white bg-white/90 p-3 shadow-[0_10px_30px_-18px_rgba(17,22,82,0.4)]">
      <div className="flex items-center justify-between px-2 pb-3 pt-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/60">Contenido</p>
        <span className="rounded-md bg-luwi-cristal-fondo px-2 py-0.5 text-[11px] font-semibold text-luwi-medio">
          {revisadas}/{unidades.length}
        </span>
      </div>
      <ol className="relative space-y-1">
        {unidades.map((u, i) => {
          const actual = u._id === actualId;
          const Tipo = (TIPOS[u.tipo] ?? TIPOS.TEXTO).icon;
          return (
            <li key={u._id}>
              <button
                type="button"
                onClick={() => onSelect(u._id)}
                aria-current={actual ? "step" : undefined}
                className={`group flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40 ${
                  actual ? "bg-luwi-cristal-fondo ring-1 ring-luwi-cristal" : "hover:bg-luwi-panel"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                    u.revisada
                      ? "bg-gradient-to-br from-[#d1b17c] to-[#8c6a34] text-white"
                      : actual
                        ? "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white"
                        : "bg-luwi-panel text-luwi-texto/70 ring-1 ring-luwi-linea"
                  }`}
                >
                  {u.revisada ? <CheckIcon className="h-4 w-4" strokeWidth={2.6} /> : i + 1}
                </span>
                <span className="min-w-0 flex-1 pt-0.5">
                  <span className={`block break-words leading-snug ${actual ? "font-semibold text-luwi-profundo" : "font-medium text-luwi-profundo/90"}`}>
                    {u.titulo}
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-luwi-texto/65">
                    <Tipo className="h-3.5 w-3.5" />
                    {(TIPOS[u.tipo] ?? TIPOS.TEXTO).label}
                    {!u.obligatoria && <span className="rounded bg-luwi-panel px-1.5">Opcional</span>}
                  </span>
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

// ---------- Notas personales ----------

function NotasUnidad({ asignacionId, unidadId }) {
  const [texto, setTexto] = useState(() => leerNota(asignacionId, unidadId));
  const [estado, setEstado] = useState("");
  const [abierta, setAbierta] = useState(() => !!leerNota(asignacionId, unidadId));

  // Guarda automáticamente 700 ms después de dejar de escribir
  useEffect(() => {
    if (texto === leerNota(asignacionId, unidadId)) return undefined;
    setEstado("Guardando…");
    const t = setTimeout(() => setEstado(guardarNota(asignacionId, unidadId, texto) ? "Guardado" : "No se pudo guardar"), 700);
    return () => clearTimeout(t);
  }, [texto, asignacionId, unidadId]);

  return (
    <section className="mt-6 rounded-2xl bg-luwi-panel/70 ring-1 ring-inset ring-luwi-linea/70">
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-luwi-profundo">
          <svg {...trazo} className="h-4 w-4 text-luwi-medio">
            <path d="M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4" />
          </svg>
          Mis notas
          {texto.trim() && !abierta && <span className="rounded bg-luwi-cristal px-1.5 text-[10.5px] text-luwi-medio">1</span>}
        </span>
        <span className="text-xs text-luwi-texto/70">{abierta ? "Ocultar" : "Escribir"}</span>
      </button>
      {abierta && (
        <div className="px-4 pb-4">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            maxLength={4000}
            placeholder="Apunta ideas, dudas o lo que quieras recordar de esta unidad…"
            aria-label="Mis notas de esta unidad"
            className="w-full resize-y rounded-xl border border-luwi-linea bg-white px-3.5 py-3 text-sm text-luwi-profundo outline-none transition placeholder:text-luwi-texto/50 focus:border-luwi-tecno focus:shadow-[0_0_0_4px_rgba(59,69,201,0.10)]"
          />
          <p className="mt-1.5 flex justify-between text-[11px] text-luwi-texto/60">
            <span>Solo tú las ves, en este navegador.</span>
            <span aria-live="polite">{estado}</span>
          </p>
        </div>
      )}
    </section>
  );
}

// ---------- Contenido de una unidad ----------

function ContenidoUnidad({ unidad }) {
  const embed = unidad.tipo === "VIDEO" ? urlIncrustable(unidad.recursoUrl) : null;

  return (
    <>
      {embed && (
        <div className="mt-5 overflow-hidden rounded-2xl bg-luwi-noche shadow-[0_16px_40px_-20px_rgba(15,20,76,0.7)]">
          <div className="relative aspect-video">
            <iframe
              src={embed}
              title={unidad.titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
      )}

      {unidad.contenido ? (
        <div className="mt-5 whitespace-pre-line break-words text-[15px] leading-[1.8] text-luwi-profundo/90">{unidad.contenido}</div>
      ) : !embed && unidad.tipo !== "TEXTO" && unidad.recursoUrl ? (
        <p className="mt-5 text-sm text-luwi-texto">
          {unidad.tipo === "VIDEO" ? "Abre el recurso para ver el video." : "Abre el recurso para consultar el contenido."}
        </p>
      ) : !embed ? (
        <p className="mt-5 text-sm text-luwi-texto">Esta unidad no tiene contenido.</p>
      ) : null}

      {unidad.recursoUrl && (
        <a
          href={unidad.recursoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl border border-luwi-tecno/30 bg-luwi-tecno/5 px-4 py-2.5 text-sm font-semibold text-luwi-medio transition hover:bg-luwi-tecno/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
        >
          {embed ? "Abrir en otra pestaña" : "Abrir recurso"}
          <ExternalLinkIcon className="h-4 w-4" />
        </a>
      )}
    </>
  );
}

// ---------- Pantalla ----------

function CursoContenido() {
  const { asignacionId, cursoAsignadoId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const contenidoRef = useRef(null);

  const [detalle, setDetalle] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [unidadId, setUnidadId] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [errorAvance, setErrorAvance] = useState("");
  const [enfoque, setEnfoque] = useState(false);
  const [celebrar, setCelebrar] = useState(null); // { ruta: boolean, siguiente }

  // Ante 403/404 se vuelve a "Mi formación" con el motivo
  const salirSinAcceso = useCallback(
    (err) => {
      if (err?.status !== 403 && err?.status !== 404) return false;
      navigate("/mi-formacion", { replace: true, state: { aviso: err.data?.message || SIN_ACCESO } });
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
      setUnidadId((prev) => (prev && data.unidades.some((u) => u._id === prev) ? prev : unidadInicial(data)));
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

  const unidades = detalle?.unidades ?? [];
  const indice = Math.max(0, unidades.findIndex((u) => u._id === unidadId));
  const unidad = unidades.at(indice);
  const anterior = indice > 0 ? unidades.at(indice - 1) : null;
  const siguiente = unidades.at(indice + 1) ?? null;

  const irAUnidad = useCallback(
    (id) => {
      setUnidadId(id);
      setErrorAvance("");
      const el = contenidoRef.current;
      if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    []
  );

  // Busca el siguiente curso habilitado de la ruta (para el botón de la celebración)
  const siguienteCurso = async () => {
    try {
      const f = await getMiFormacion();
      const cursos = f?.asignacion?.cursos ?? [];
      return cursos.find((c) => c.cursoAsignadoId !== cursoAsignadoId && c.acceso === "HABILITADO" && c.estado !== "CONTENIDOS_REVISADOS") ?? null;
    } catch {
      return null;
    }
  };

  const aplicarRevision = (idUnidad, data) =>
    setDetalle((d) => ({
      ...d,
      unidades: d.unidades.map((u) => (u._id === idUnidad ? { ...u, revisada: true } : u)),
      curso: data?.curso ? { ...d.curso, ...data.curso } : d.curso,
      porcentajeGeneral: data?.porcentajeGeneral ?? d.porcentajeGeneral,
    }));

  /** Marca la unidad actual; con `continuar` pasa a la siguiente. */
  const marcar = async ({ continuar = false } = {}) => {
    if (!unidad || unidad.revisada || marcando) {
      if (continuar && siguiente) irAUnidad(siguiente._id);
      return;
    }
    const idUnidad = unidad._id;
    const antes = detalle.curso.porcentaje;
    setMarcando(true);
    setErrorAvance("");
    try {
      const data = await marcarUnidadRevisada(asignacionId, idUnidad);
      aplicarRevision(data?.unidadId ?? idUnidad, data);
      const despues = data?.curso?.porcentaje ?? antes;

      if (antes < 100 && despues >= 100) {
        const rutaCompleta = (data?.porcentajeGeneral ?? 0) >= 100;
        setCelebrar({ ruta: rutaCompleta, siguiente: rutaCompleta ? null : await siguienteCurso() });
      } else {
        toast({ variant: "success", title: "Unidad revisada", description: `Llevas ${despues}% del curso.`, duration: 2500 });
        if (continuar && siguiente) irAUnidad(siguiente._id);
      }
    } catch (err) {
      if (err?.status === 409) {
        aplicarRevision(idUnidad, null);
        cargar();
      } else if (!salirSinAcceso(err)) {
        setErrorAvance(MENSAJE_ERROR_AVANCE);
      }
    } finally {
      setMarcando(false);
    }
  };

  // Atajos: ← → moverse, M marcar, F modo enfoque, Esc salir del enfoque
  useEffect(() => {
    const alTeclear = (e) => {
      if (escribiendo(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "ArrowRight" && siguiente) irAUnidad(siguiente._id);
      else if (e.key === "ArrowLeft" && anterior) irAUnidad(anterior._id);
      else if (e.key.toLowerCase() === "m") marcar({ continuar: true });
      else if (e.key.toLowerCase() === "f") setEnfoque((v) => !v);
      else if (e.key === "Escape" && enfoque && !celebrar) setEnfoque(false);
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  });

  // En modo enfoque no se desplaza la página de fondo
  useEffect(() => {
    if (!enfoque) return undefined;
    const anteriorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anteriorOverflow;
    };
  }, [enfoque]);

  const volver = (
    <Link to="/mi-formacion" className="inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-luwi-texto transition hover:text-luwi-profundo">
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

  const { curso } = detalle;
  const horasRestantes = Math.round((Number(curso.duracionHoras) || 0) * (1 - (Number(curso.porcentaje) || 0) / 100) * 10) / 10;
  const tipo = unidad ? TIPOS[unidad.tipo] ?? TIPOS.TEXTO : null;
  const lectura = unidad ? minutosLectura(unidad.contenido) : 0;

  // ---------- Tarjeta de la unidad (se usa normal y en modo enfoque) ----------
  const tarjetaUnidad = unidad && (
    <article ref={contenidoRef} className="scroll-mt-24 rounded-[24px] border border-white bg-white p-6 shadow-[0_14px_40px_-28px_rgba(17,22,82,0.6)] sm:p-8">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-luwi-texto/70">
          Unidad {indice + 1} de {unidades.length}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-luwi-tecno/10 px-2.5 py-0.5 text-xs font-semibold text-luwi-medio">
          <tipo.icon className="h-3.5 w-3.5" />
          {tipo.label}
        </span>
        {lectura > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-luwi-panel px-2.5 py-0.5 text-xs text-luwi-texto">
            <ClockIcon className="h-3.5 w-3.5" />
            {lectura} min de lectura
          </span>
        )}
        {!unidad.obligatoria && <span className="rounded-full bg-luwi-panel px-2.5 py-0.5 text-xs font-semibold text-luwi-texto">Opcional</span>}
        {unidad.revisada && (
          <span className="inline-flex items-center gap-1 rounded-full bg-luwi-antique px-2.5 py-0.5 text-xs font-semibold text-luwi-fawn-deep">
            <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
            Revisada
          </span>
        )}
      </div>

      <h2 className="mt-2 break-words text-[24px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">{unidad.titulo}</h2>

      <ContenidoUnidad unidad={unidad} />

      {errorAvance && (
        <div className="mt-5">
          <ErrorCarga mensaje={errorAvance} />
        </div>
      )}

      <NotasUnidad key={unidad._id} asignacionId={asignacionId} unidadId={unidad._id} />

      {/* Navegación */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-luwi-linea/70 pt-5 sm:flex sm:items-center sm:justify-between">
        <button type="button" onClick={() => anterior && irAUnidad(anterior._id)} disabled={!anterior} className={`${botonSecundario} order-2 sm:order-1`} title="Atajo: ←">
          <ChevronLeftIcon className="h-4 w-4" />
          Anterior
        </button>

        {unidad.revisada ? (
          siguiente ? (
            <button type="button" onClick={() => irAUnidad(siguiente._id)} className={`${botonPrincipal} order-1 col-span-2 sm:order-2`} title="Atajo: →">
              Siguiente unidad
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          ) : (
            <span className="order-1 col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-luwi-antique px-5 py-2.5 text-sm font-semibold text-luwi-fawn-deep sm:order-2">
              <CheckIcon className="h-4 w-4" strokeWidth={2.6} />
              Última unidad revisada
            </span>
          )
        ) : (
          <button type="button" onClick={() => marcar({ continuar: true })} disabled={marcando} className={`${botonPrincipal} order-1 col-span-2 sm:order-2`} title="Atajo: M">
            <CheckIcon className="h-4 w-4" strokeWidth={2.6} />
            {marcando ? "Guardando…" : siguiente ? "Marcar y continuar" : "Marcar como revisada"}
          </button>
        )}

        <button type="button" onClick={() => siguiente && irAUnidad(siguiente._id)} disabled={!siguiente} className={`${botonSecundario} order-3`} title="Atajo: →">
          Siguiente
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {volver}
        {unidades.length > 0 && (
          <button type="button" onClick={() => setEnfoque(true)} className={botonSecundario} title="Atajo: F">
            <EnfoqueIcon className="h-4 w-4" />
            Modo enfoque
          </button>
        )}
      </div>

      {/* Encabezado del curso */}
      <header className="relative overflow-hidden rounded-[28px] bg-colonial-banner p-6 text-white shadow-[0_20px_50px_-25px_rgba(15,20,76,0.7)] sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-40 h-24 w-24 rounded-full bg-white/10 blur-xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Curso {curso.orden}</p>
            <h1 className="mt-1 break-words text-[28px] font-bold leading-tight tracking-[-0.02em]">{curso.titulo}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="inline-flex items-center gap-1.5">
                <BookIcon className="h-4 w-4" />
                {unidades.length} {unidades.length === 1 ? "unidad" : "unidades"}
              </span>
              {curso.duracionHoras ? (
                <span className="inline-flex items-center gap-1.5">
                  <ClockIcon className="h-4 w-4" />
                  {formatoHoras(curso.duracionHoras)}
                  {curso.porcentaje > 0 && curso.porcentaje < 100 && ` · te quedan ~${formatoHoras(horasRestantes)}`}
                </span>
              ) : null}
            </p>
          </div>
          <div className="w-full rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:w-72">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-medium text-white/80">Tu avance</p>
              <p className="text-2xl font-bold">{curso.porcentaje}%</p>
            </div>
            <ProgressBar value={curso.porcentaje} inverse label="Avance del curso" className="mt-2" />
            <p className="mt-2 text-xs text-white/75">
              {curso.revisadasObligatorias} de {curso.totalObligatorias} unidades obligatorias revisadas
            </p>
          </div>
        </div>
      </header>

      {unidades.length === 0 ? (
        <Aviso>Este curso todavía no tiene contenido publicado.</Aviso>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr]">
          <div className="lg:sticky lg:top-24">
            <IndiceUnidades unidades={unidades} actualId={unidad?._id} onSelect={irAUnidad} />
            <p className="mt-3 hidden px-2 text-[11px] text-luwi-texto/60 lg:block">
              Atajos: <kbd className="font-sans font-semibold">← →</kbd> moverse · <kbd className="font-sans font-semibold">M</kbd> marcar ·{" "}
              <kbd className="font-sans font-semibold">F</kbd> enfoque
            </p>
          </div>
          {!enfoque && tarjetaUnidad}
        </div>
      )}

      {/* Evaluaciones del curso (disponibles al completar todas las unidades obligatorias) */}
      <EvaluacionesCurso
        asignacionId={asignacionId}
        cursoAsignadoId={cursoAsignadoId}
        avanceKey={curso.revisadasObligatorias}
      />

      {/* Modo enfoque: la unidad a pantalla completa */}
      {enfoque &&
        unidad &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-luwi-panel font-poppins" role="dialog" aria-modal="true" aria-label="Modo enfoque">
            <div className="flex items-center gap-4 border-b border-luwi-linea/70 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
              <button type="button" onClick={() => setEnfoque(false)} className={botonSecundario} title="Salir (Esc)">
                <ChevronLeftIcon className="h-4 w-4" />
                Salir
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-luwi-profundo">{curso.titulo}</p>
                <ProgressBar value={curso.porcentaje} label="Avance del curso" className="mt-1.5 h-1.5 max-w-md" />
              </div>
              <span className="hidden text-xs font-semibold text-luwi-texto sm:block">
                {indice + 1} / {unidades.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8">
              <div className="mx-auto max-w-3xl">{tarjetaUnidad}</div>
            </div>
          </div>,
          document.body
        )}

      <Celebracion
        open={!!celebrar}
        onClose={() => setCelebrar(null)}
        titulo={celebrar?.ruta ? "¡Completaste tu ruta!" : "¡Curso completado!"}
        mensaje={
          celebrar?.ruta
            ? "Revisaste todos los cursos de tu ruta de formación. Recursos Humanos ya puede ver tu avance."
            : `Terminaste “${curso.titulo}”. ${celebrar?.siguiente ? "Tu siguiente curso ya está disponible." : "Sigue así: cada curso te acerca a tu nuevo puesto."}`
        }
        acciones={
          <>
            {celebrar?.siguiente ? (
              <Link
                to={`/mi-formacion/${asignacionId}/cursos/${celebrar.siguiente.cursoAsignadoId}`}
                onClick={() => setCelebrar(null)}
                className={botonPrincipal}
              >
                Ir a “{celebrar.siguiente.titulo}”
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            ) : (
              <Link to="/inicio" className={botonPrincipal}>
                Ver mi avance
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
            )}
            <Link to="/mi-formacion" className={botonSecundario}>
              Volver a mi formación
            </Link>
          </>
        }
      />
    </div>
  );
}

/** Contenido de un curso asignado. Se reinicia al cambiar de curso. */
export default function CursoPostulante() {
  const { cursoAsignadoId } = useParams();
  return <CursoContenido key={cursoAsignadoId} />;
}
