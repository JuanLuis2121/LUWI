import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Logo from "../../components/Logo";
import {
  getMiFormacion,
  getCursoFormacion,
  marcarUnidadRevisada,
  guardarUltimaConsulta,
} from "../../services/miFormacionService";

const porcentaje = (valor) => `${Math.max(0, Math.min(100, Number(valor) || 0))}%`;

function BarraProgreso({ value, light = false }) {
  return <div className={`h-2 overflow-hidden rounded-full ${light ? "bg-white/20" : "bg-luwi-border"}`}><div className={`h-full rounded-full transition-[width] duration-500 ${light ? "bg-luwi-teal" : "bg-gradient-to-r from-luwi-blue to-luwi-teal"}`} style={{ width: porcentaje(value) }} /></div>;
}

function ErrorBox({ children, retry }) {
  if (!children) return null;
  return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><p>{children}</p>{retry && <button type="button" onClick={retry} className="mt-2 font-semibold underline">Intentar de nuevo</button>}</div>;
}

function Shell({ children }) {
  return <div className="min-h-screen bg-luwi-bg"><header className="border-b border-luwi-border bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-8"><Logo /><span className="text-sm font-semibold text-luwi-muted">Mi formación</span></div></header><main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-8 sm:py-9">{children}</main></div>;
}

export default function MiFormacionPage() {
  const { asignacionId, cursoAsignadoId } = useParams();
  const detail = Boolean(asignacionId && cursoAsignadoId);
  const [resumen, setResumen] = useState(null);
  const [cursoDetalle, setCursoDetalle] = useState(null);
  const [cursoBloqueado, setCursoBloqueado] = useState(null);
  const [unidadId, setUnidadId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMiFormacion();
      setResumen(data);
      return data;
    } catch (err) {
      setError(err.message || "No se pudo cargar tu formación.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (!detail) cargar(); }, [detail, cargar]);

  useEffect(() => {
    if (!detail) {
      setCursoDetalle(null);
      setUnidadId("");
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    setNotice("");
    setCursoBloqueado(null);
    getCursoFormacion(asignacionId, cursoAsignadoId)
      .then((data) => {
        if (!active) return;
        setCursoDetalle(data);
        const firstPending = data.unidades?.find((u) => !u.revisada)?._id;
        const target = data.ultimaUnidadId || firstPending || data.unidades?.[0]?._id || "";
        setUnidadId(target);
        if (target) guardarUltimaConsulta(asignacionId, cursoAsignadoId, target).catch(() => {});
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "No se pudo abrir este curso.");
        if (err.data?.codigo === "CURSO_BLOQUEADO") setCursoBloqueado(err.data.curso ?? null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [detail, asignacionId, cursoAsignadoId]);

  const assignment = resumen?.asignacion;
  const selectedUnit = useMemo(
    () => cursoDetalle?.unidades?.find((unit) => String(unit._id) === String(unidadId)) ?? null,
    [cursoDetalle, unidadId]
  );
  const hrefCurso = (id) => `/mi-formacion/${assignment?.id}/cursos/${id}`;
  const ultima = assignment?.ultimaConsulta;
  const nextCourse = assignment?.cursos?.find((course) => course.cursoAsignadoId === ultima?.cursoAsignadoId && course.acceso === "HABILITADO")
    ?? assignment?.cursos?.find((course) => course.acceso === "HABILITADO");
  const continuarHref = ultima?.cursoAsignadoId && nextCourse?.cursoAsignadoId === ultima.cursoAsignadoId
    ? hrefCurso(ultima.cursoAsignadoId)
    : nextCourse ? hrefCurso(nextCourse.cursoAsignadoId) : "";
  const totalObligatorias = assignment?.cursos?.reduce((sum, course) => sum + (course.totalObligatorias ?? 0), 0) ?? 0;
  const revisadas = assignment?.cursos?.reduce((sum, course) => sum + (course.revisadasObligatorias ?? 0), 0) ?? 0;

  async function seleccionarUnidad(id) {
    setUnidadId(id);
    setNotice("");
    try {
      await guardarUltimaConsulta(asignacionId, cursoAsignadoId, id);
    } catch (err) {
      setNotice(err.message || "No se pudo guardar tu última unidad consultada.");
    }
  }

  async function marcarRevisada() {
    if (!selectedUnit || selectedUnit.revisada) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await marcarUnidadRevisada(asignacionId, selectedUnit._id);
      setCursoDetalle((current) => ({
        ...current,
        porcentajeGeneral: result.porcentajeGeneral,
        curso: result.curso ?? current.curso,
        unidades: current.unidades.map((unit) => String(unit._id) === String(selectedUnit._id) ? { ...unit, revisada: true } : unit),
      }));
      setNotice(result.nuevaRevision ? "Unidad marcada como revisada." : "Esta unidad ya estaba revisada.");
    } catch (err) {
      setError(err.message || "No se pudo guardar el avance de la unidad.");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !resumen && !detail) return <Shell><div className="animate-pulse rounded-3xl bg-white p-8"><div className="h-6 w-48 rounded bg-luwi-bg"/><div className="mt-4 h-3 rounded bg-luwi-bg"/></div></Shell>;

  if (detail) {
    const curso = cursoDetalle?.curso;
    return <Shell>
      <Link to="/mi-formacion" className="inline-flex items-center gap-2 text-sm font-semibold text-luwi-blue hover:underline">← Volver a Mi formación</Link>
      {!loading && cursoBloqueado && <section className="rounded-3xl border border-luwi-border bg-white p-6"><h1 className="text-2xl font-bold text-luwi-navy">{cursoBloqueado.titulo}</h1></section>}
      <ErrorBox>{cursoBloqueado ? "" : error}</ErrorBox>
      {loading ? <div className="h-72 animate-pulse rounded-3xl bg-white"/> : curso && <>
        <section className="rounded-3xl bg-gradient-to-br from-luwi-navy via-luwi-blue to-luwi-purple p-6 text-white shadow-card sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-white/75">Curso {curso.orden} · {curso.duracionHoras ?? 0} horas</p><h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">{curso.titulo}</h1></div><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">{curso.estado === "CONTENIDOS_REVISADOS" ? "Contenido revisado" : curso.estado === "EN_CURSO" ? "En curso" : "Disponible"}</span></div>
          <div className="mt-6 flex items-center gap-4"><div className="flex-1"><BarraProgreso value={curso.porcentaje} light/></div><strong className="text-sm">{curso.porcentaje ?? 0}%</strong></div>
        </section>
        {notice && <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</p>}
        {!cursoDetalle.unidades?.length ? <section className="rounded-3xl border border-dashed border-luwi-border bg-white p-8 text-center text-sm text-luwi-muted">Este curso todavía no tiene unidades disponibles.</section> : <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <nav aria-label="Unidades del curso" className="h-fit rounded-3xl border border-luwi-border bg-white p-3"><p className="px-3 py-2 text-xs font-bold uppercase tracking-wide text-luwi-muted">Unidades</p><ol className="space-y-1">{cursoDetalle.unidades.map((unit, index) => <li key={unit._id}><button type="button" onClick={() => seleccionarUnidad(unit._id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${String(unit._id) === String(unidadId) ? "bg-luwi-blue/10 text-luwi-navy" : "text-luwi-ink hover:bg-luwi-bg"}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${unit.revisada ? "bg-emerald-100 text-emerald-700" : "bg-luwi-bg text-luwi-muted"}`}>{unit.revisada ? "✓" : index + 1}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{unit.titulo}</span><span className="text-xs text-luwi-muted">{unit.tipo}{unit.obligatoria ? " · obligatoria" : " · complementaria"}</span></span></button></li>)}</ol></nav>
          <article className="min-h-80 rounded-3xl border border-luwi-border bg-white p-5 shadow-card sm:p-8">{selectedUnit ? <><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-luwi-blue">Unidad {selectedUnit.orden}</p><h2 className="mt-1 text-xl font-bold text-luwi-navy">{selectedUnit.titulo}</h2></div><span className="rounded-full bg-luwi-bg px-3 py-1 text-xs font-semibold text-luwi-muted">{selectedUnit.tipo}</span></div>
            {selectedUnit.tipo === "TEXTO" ? <div className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-sm leading-7 text-luwi-ink">{selectedUnit.contenido}</div> : <div className="mt-6 rounded-2xl bg-luwi-bg p-5"><p className="text-sm text-luwi-muted">{selectedUnit.tipo === "VIDEO" ? "Recurso en video" : "Material complementario"}</p><a href={selectedUnit.recursoUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-luwi-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-luwi-navy">Abrir {selectedUnit.tipo === "VIDEO" ? "video" : "enlace"} ↗</a></div>}
            <div className="mt-8 border-t border-luwi-border pt-5"><button type="button" disabled={selectedUnit.revisada || saving} onClick={marcarRevisada} className={`rounded-xl px-5 py-3 text-sm font-bold transition disabled:cursor-default ${selectedUnit.revisada ? "bg-emerald-50 text-emerald-700" : "bg-luwi-blue text-white hover:bg-luwi-navy disabled:opacity-60"}`}>{saving ? "Guardando…" : selectedUnit.revisada ? "✓ Unidad revisada" : "Marcar como revisada"}</button><p className="mt-2 text-xs text-luwi-muted">{selectedUnit.obligatoria ? "Esta unidad cuenta para tu avance." : "Esta unidad es complementaria y no cambia el porcentaje obligatorio."}</p></div>
          </> : <p className="text-sm text-luwi-muted">Selecciona una unidad para continuar.</p>}</article>
        </div>}
      </>}
    </Shell>;
  }

  if (error) return <Shell><ErrorBox retry={cargar}>{error}</ErrorBox></Shell>;
  if (!resumen) return <Shell><ErrorBox retry={cargar}>No se pudo cargar tu formación.</ErrorBox></Shell>;
  if (!assignment) return <Shell><section className="rounded-3xl bg-white px-6 py-14 text-center shadow-card"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-luwi-blue/10 text-luwi-blue"><span className="text-2xl">✦</span></span><h1 className="mt-4 text-2xl font-bold text-luwi-navy">Tu formación aparecerá aquí</h1><p className="mx-auto mt-2 max-w-md text-sm text-luwi-muted">Cuando Recursos Humanos te asigne una ruta de aprendizaje, podrás comenzar tus cursos desde esta página.</p></section></Shell>;

  return <Shell>
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-luwi-navy via-luwi-blue to-luwi-purple p-6 text-white shadow-card sm:p-8"><div className="pointer-events-none absolute -right-10 -top-12 h-48 w-48 rounded-full bg-white/10"/><p className="relative text-sm text-white/75">{resumen.empresa?.nombre ?? "Tu plan de aprendizaje"}{resumen.puesto?.titulo ? ` · ${resumen.puesto.titulo}` : ""}</p><h1 className="relative mt-2 text-2xl font-extrabold sm:text-3xl">Hola, {resumen.usuario?.nombre ?? "bienvenido"}</h1><p className="relative mt-2 max-w-2xl text-sm text-white/80">{assignment.ruta?.nombre ?? "Tu ruta de formación"}</p><div className="relative mt-6 flex flex-wrap items-center gap-4"><div className="w-full max-w-sm flex-1"><BarraProgreso value={assignment.porcentaje} light/></div><strong>{assignment.porcentaje ?? 0}% completado</strong><span className="text-sm text-white/75">{revisadas} de {totalObligatorias} unidades obligatorias</span></div>{continuarHref && resumen.proceso?.estado !== "SUSPENDIDO" && <Link to={continuarHref} className="relative mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-bold text-luwi-navy transition hover:bg-white/90">{assignment.tieneAvance ? "Continuar formación" : "Comenzar formación"} <span className="ml-2">→</span></Link>}{resumen.proceso?.estado === "SUSPENDIDO" && <p className="relative mt-5 rounded-xl bg-white/10 p-3 text-sm">Tu proceso está suspendido temporalmente. Contacta a Recursos Humanos para continuar.</p>}</section>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold text-luwi-navy">Cursos de tu ruta</h2><p className="mt-1 text-sm text-luwi-muted">El siguiente curso se habilitará según el avance de tu formación.</p></div><span className="text-sm text-luwi-muted">{assignment.cursosHabilitados} de {assignment.totalCursos} habilitados</span></div>
    <section className="grid gap-4 md:grid-cols-2">{[...(assignment.cursos ?? [])].sort((a,b) => a.orden - b.orden).map((course) => {
      if (course.acceso !== "HABILITADO") return <article key={course.cursoAsignadoId} className="flex items-center gap-3 rounded-2xl border border-luwi-border bg-white/70 p-5 text-luwi-muted"><span aria-hidden="true" className="text-lg">🔒</span><h3 className="font-semibold">{course.titulo}</h3></article>;
      return <Link key={course.cursoAsignadoId} to={hrefCurso(course.cursoAsignadoId)} className="group rounded-2xl border border-luwi-border bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:border-luwi-blue/30"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-luwi-blue">Curso {course.orden} · {course.duracionHoras ?? 0} h</p><h3 className="mt-1 font-bold text-luwi-navy group-hover:text-luwi-blue">{course.titulo}</h3></div><span className="rounded-full bg-luwi-blue/10 px-2.5 py-1 text-xs font-semibold text-luwi-blue">{course.estado === "CONTENIDOS_REVISADOS" ? "Revisado" : course.estado === "EN_CURSO" ? "En curso" : "Disponible"}</span></div><div className="mt-4 flex items-center gap-3"><div className="flex-1"><BarraProgreso value={course.porcentaje}/></div><span className="text-xs font-bold text-luwi-muted">{course.porcentaje ?? 0}%</span></div><p className="mt-2 text-xs text-luwi-muted">{course.revisadasObligatorias} de {course.totalObligatorias} unidades obligatorias revisadas</p></Link>;
    })}</section>
  </Shell>;
}
