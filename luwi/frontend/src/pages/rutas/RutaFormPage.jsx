import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Icon from "../../components/Icon";
import { ActionButton } from "../../components/AdminUI";
import { FieldError, Label, inputCls } from "../../components/FormControls";
import Panel from "../../components/dashboard/Panel";
import RoadmapRuta from "../../components/rutas/RoadmapRuta";
import CatalogoCursos from "../../components/rutas/CatalogoCursos";
import CoberturaCompetencias from "../../components/rutas/CoberturaCompetencias";
import { BookIcon, ChevronLeftIcon, RouteIcon, TrendUpIcon, ClockIcon } from "../../components/dashboard/icons";
import { rutasService, cursoCompatible } from "../../services/rutasService";
import { getCursos } from "../../services/cursosService";
import { puestosService } from "../../services/puestosService";
import { getCompetencias } from "../../services/competenciasService";
import { errMsg } from "../../services/api";
import { NIVELES, nivelDe, avisosDeOrden, coberturaCompetencias, formatoHoras, idDe } from "../../utils/rutas";

const TITULOS = { create: "Nueva ruta", edit: "Editar ruta", view: "Detalle de la ruta" };
const SUBTITULOS = {
  create: "Elige el puesto y arma el camino de cursos que seguirá el candidato.",
  edit: "Agrega, quita o reordena los cursos arrastrándolos.",
  view: "Así se ve el camino de formación de este puesto.",
};

const valorDe = (r) => (r.status === "fulfilled" ? r.value : null);

export default function RutaFormPage({ mode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const readOnly = mode === "view";

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [cursos, setCursos] = useState([]); // objetos curso, en orden
  const [options, setOptions] = useState({ puestos: [], cursos: [] });
  const [extra, setExtra] = useState({ cursos: new Map(), puestos: new Map(), catalogo: [] });

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [opts, ruta] = await Promise.all([
          rutasService.options(),
          mode === "create" ? Promise.resolve(null) : rutasService.get(id),
        ]);

        // Datos de apoyo para la cobertura de competencias: si fallan, el constructor sigue funcionando.
        const [cursosFull, puestosFull, catalogo] = await Promise.allSettled([
          getCursos(),
          puestosService.list(),
          getCompetencias(),
        ]);
        if (!active) return;

        setOptions(opts);
        setExtra({
          cursos: new Map((valorDe(cursosFull) ?? []).map((c) => [idDe(c), c])),
          puestos: new Map((valorDe(puestosFull) ?? []).map((p) => [idDe(p), p])),
          catalogo: valorDe(catalogo) ?? [],
        });

        if (ruta) {
          setNombre(ruta.nombre);
          setDescripcion(ruta.descripcion);
          setPuestoId(ruta.puestoId);
          setCursos(ruta.cursos);
        }
      } catch (e) {
        if (!active) return;
        if (e?.response?.status === 404) setNotFound(true);
        else setSaveError(errMsg(e, "No se pudieron cargar los datos."));
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [mode, id]);

  // Curso con su información más reciente (estado, competencias, unidades)
  const completo = (c) => ({
    ...c,
    ...(options.cursos.find((x) => x.id === c.id) ?? {}),
    competencias: extra.cursos.get(c.id)?.competencias ?? c.competencias ?? [],
    competencia: c.competencia || extra.cursos.get(c.id)?.competencia || "",
  });

  const puesto = options.puestos.find((p) => p.id === puestoId);
  // Se memoriza para que el arrastre mantenga los mismos objetos entre renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cursosRuta = useMemo(() => cursos.map(completo), [cursos, options, extra]);
  const disponibles = puesto
    ? options.cursos.filter((c) => cursoCompatible(c, puesto) && !cursos.some((x) => x.id === c.id)).map(completo)
    : [];

  const incompatibles = new Set(puesto ? cursosRuta.filter((c) => !cursoCompatible(c, puesto)).map((c) => c.id) : []);
  const avisos = avisosDeOrden(cursosRuta);

  const cobertura = coberturaCompetencias({
    requeridas: extra.puestos.get(puestoId)?.competencias ?? [],
    cursos: cursosRuta,
    catalogo: extra.catalogo,
  });

  const horasTotales = cursosRuta.reduce((a, c) => a + (Number(c.duracionHoras) || 0), 0);
  const porNivel = Object.keys(NIVELES).map((n) => ({ n, total: cursosRuta.filter((c) => nivelDe(c) === NIVELES[n]).length }));

  // ---------- Validación ----------
  const errors = {};
  if (submitted) {
    if (nombre.trim().length < 3) errors.nombre = "El nombre debe tener al menos 3 caracteres.";
    if (!descripcion.trim()) errors.descripcion = "Escribe la descripción de la ruta.";
    if (!puestoId) errors.puesto = "Selecciona el puesto de la ruta.";
    if (cursos.length === 0) errors.cursos = "Agrega al menos un curso a la ruta.";
    else if (incompatibles.size > 0) errors.cursos = "Quita los cursos que no son compatibles con el puesto antes de guardar.";
  }
  const errorCount = Object.keys(errors).length;

  // ---------- Acciones ----------
  function agregar(cursoId) {
    const curso = options.cursos.find((c) => c.id === cursoId);
    if (!curso || cursos.some((c) => c.id === cursoId)) return;
    if (puesto && !cursoCompatible(curso, puesto)) return;
    setCursos((prev) => [...prev, curso]);
  }
  const quitar = (cid) => setCursos((prev) => prev.filter((c) => c.id !== cid));
  // Reorder entrega los objetos "completos": se guarda el orden con los objetos originales.
  const reordenar = (lista) => setCursos(lista.map((c) => cursos.find((x) => x.id === c.id)).filter(Boolean));

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    setSaveError("");
    if (nombre.trim().length < 3 || !descripcion.trim() || !puestoId || cursos.length === 0 || incompatibles.size > 0) return;

    setSaving(true);
    try {
      const form = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        puestoId,
        cursoIds: cursos.map((c) => c.id),
      };
      if (mode === "edit") await rutasService.update(id, form);
      else await rutasService.create(form);
      navigate("/dashboard/rutas", {
        state: { message: mode === "edit" ? "Ruta actualizada correctamente." : "Ruta creada correctamente." },
      });
    } catch (err) {
      setSaveError(errMsg(err, "No se pudo guardar la ruta."));
      setSaving(false);
    }
  }

  // ---------- Piezas ----------
  const acciones = readOnly ? (
    <ActionButton variant="primary" to={`/dashboard/rutas/${id}/editar`}>
      <Icon name="pencil" className="h-4 w-4" />
      Editar ruta
    </ActionButton>
  ) : (
    <>
      <ActionButton to="/dashboard/rutas">Cancelar</ActionButton>
      <ActionButton variant="primary" type="submit" form="form-ruta" disabled={saving}>
        <Icon name="check" className="h-4 w-4" />
        {saving ? "Guardando..." : mode === "edit" ? "Guardar cambios" : "Guardar ruta"}
      </ActionButton>
    </>
  );

  const resumen = [
    { label: "Cursos", valor: cursosRuta.length, icon: BookIcon },
    { label: "Duración total", valor: formatoHoras(horasTotales), icon: ClockIcon },
    {
      label: "Competencias del puesto",
      valor: cobertura.porcentaje == null ? "—" : `${cobertura.porcentaje}%`,
      icon: TrendUpIcon,
    },
  ];

  return (
    <div>
      <Link
        to="/dashboard/rutas"
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg py-1 pr-2 text-sm font-semibold text-luwi-texto transition hover:text-luwi-profundo"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Volver a Rutas
      </Link>

      {/* Encabezado */}
      <header className="relative mb-6 overflow-hidden rounded-[28px] border border-luwi-linea bg-[radial-gradient(ellipse_at_100%_0%,#F8E6D2_0%,#FBF2E6_40%,#FFFFFF_75%)] p-6 shadow-[0_14px_40px_-28px_rgba(17,22,82,0.4)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/60" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-colonial-btn text-white shadow-[0_12px_24px_-10px_rgba(34,43,184,0.6)]">
              <RouteIcon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-luwi-tecno">Rutas de aprendizaje</p>
              <h1 className="mt-0.5 break-words text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">
                {readOnly && nombre ? nombre : TITULOS[mode]}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-luwi-texto">{readOnly && descripcion ? descripcion : SUBTITULOS[mode]}</p>
            </div>
          </div>
          {!loading && !notFound && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
        </div>

        {!loading && !notFound && (
          <dl className="relative mt-6 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            {resumen.map((s) => (
              <div key={s.label} className="flex min-w-[170px] items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_6px_16px_-10px_rgba(17,22,82,0.35)] ring-1 ring-inset ring-luwi-linea/70">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-luwi-medio">
                  <s.icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <dt className="text-[11px] font-medium text-luwi-texto/80">{s.label}</dt>
                  <dd className="text-lg font-bold leading-tight text-luwi-profundo">{s.valor}</dd>
                </div>
              </div>
            ))}
            {/* Distribución por nivel */}
            <div className="col-span-2 flex min-w-[220px] flex-col justify-center rounded-2xl bg-white px-4 py-3 shadow-[0_6px_16px_-10px_rgba(17,22,82,0.35)] ring-1 ring-inset ring-luwi-linea/70 sm:col-span-1">
              <dt className="text-[11px] font-medium text-luwi-texto/80">Niveles</dt>
              <dd className="mt-1.5">
                <div className="flex h-2 overflow-hidden rounded-full bg-luwi-cristal-fondo">
                  {porNivel.map(({ n, total }) =>
                    total ? <div key={n} className={NIVELES[n].punto} style={{ width: `${(total / Math.max(1, cursosRuta.length)) * 100}%` }} /> : null
                  )}
                </div>
                <div className="mt-1.5 flex gap-3 text-[11px] text-luwi-texto">
                  {porNivel.map(({ n, total }) => (
                    <span key={n} className="inline-flex items-center gap-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${NIVELES[n].punto}`} />
                      {NIVELES[n].label} {total}
                    </span>
                  ))}
                </div>
              </dd>
            </div>
          </dl>
        )}
      </header>

      {(errorCount > 0 || saveError) && (
        <div role="alert" className="mb-5 flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-3.5 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200">
          <Icon name="alert" className="h-[18px] w-[18px] shrink-0" />
          {errorCount > 0
            ? `Hay ${errorCount} ${errorCount === 1 ? "campo" : "campos"} por completar o corregir antes de guardar.`
            : saveError}
        </div>
      )}

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="h-96 animate-pulse rounded-[28px] bg-white/80" />
          <div className="h-[520px] animate-pulse rounded-[28px] bg-white/80" />
        </div>
      ) : notFound ? (
        <p className="rounded-[28px] bg-white/90 p-8 text-center text-sm text-luwi-texto">No se encontró la ruta solicitada.</p>
      ) : (
        <form id="form-ruta" onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Datos de la ruta */}
          {!readOnly && (
            <Panel title="Datos de la ruta" subtitle="Nombre, puesto y objetivo" icon={RouteIcon}>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <Label htmlFor="nombre" required>Nombre de la ruta</Label>
                  <input
                    id="nombre"
                    value={nombre}
                    maxLength={120}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Ruta de Desarrollo Frontend"
                    className={inputCls(errors.nombre)}
                  />
                  <FieldError>{errors.nombre}</FieldError>
                </div>
                <div>
                  <Label htmlFor="puesto" required>Puesto</Label>
                  <select id="puesto" value={puestoId} onChange={(e) => setPuestoId(e.target.value)} className={inputCls(errors.puesto)}>
                    <option value="">Selecciona un puesto</option>
                    {options.puestos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.titulo}
                        {p.empresaNombre ? ` (${p.empresaNombre})` : ""}
                      </option>
                    ))}
                  </select>
                  <FieldError>{errors.puesto}</FieldError>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="descripcion" required>Descripción</Label>
                  <textarea
                    id="descripcion"
                    rows={3}
                    value={descripcion}
                    maxLength={2000}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Explica el objetivo de la ruta y a quién va dirigida."
                    className={`${inputCls(errors.descripcion)} resize-y`}
                  />
                  <FieldError>{errors.descripcion}</FieldError>
                </div>
              </div>
            </Panel>
          )}

          <div className={`grid items-start gap-6 ${readOnly ? "lg:grid-cols-[1fr_340px]" : "lg:grid-cols-[340px_1fr]"}`}>
            {/* Columna lateral: catálogo (al editar) y cobertura */}
            <div className={`space-y-6 lg:sticky lg:top-24 ${readOnly ? "lg:order-2" : ""}`}>
              {!readOnly && (
                <Panel title="Catálogo de cursos" subtitle="Arrastra o pulsa + para agregar" icon={BookIcon}>
                  <CatalogoCursos cursos={disponibles} onAgregar={agregar} bloqueado={!puesto} />
                </Panel>
              )}
              <Panel title="Cobertura de competencias" subtitle="Lo que pide el puesto vs. lo que enseña la ruta" icon={TrendUpIcon}>
                <CoberturaCompetencias cobertura={cobertura} hayPuesto={!!puesto} />
              </Panel>
            </div>

            {/* Roadmap */}
            <Panel
              title="Roadmap de la ruta"
              subtitle={readOnly ? "Orden en que el candidato tomará los cursos" : "Arrastra el asa ⋮⋮ de cada curso para cambiar el orden"}
              icon={RouteIcon}
              className="min-w-0"
            >
              <RoadmapRuta
                cursos={cursosRuta}
                puesto={puesto}
                editable={!readOnly}
                onReorder={reordenar}
                onRemove={quitar}
                onDropCurso={agregar}
                incompatibles={incompatibles}
                avisos={avisos}
              />
              <FieldError>{errors.cursos}</FieldError>
            </Panel>
          </div>
        </form>
      )}
    </div>
  );
}
