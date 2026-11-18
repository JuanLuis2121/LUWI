import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/dashboard/PageHeader";
import { getProgresoProceso } from "../../services/miFormacionService";

const estadoProceso = { ACTIVO: "Activo", SUSPENDIDO: "Suspendido", FINALIZADO: "Finalizado" };
const estadoCurso = {
  BLOQUEADO: "Bloqueado",
  SIN_INICIAR: "Sin iniciar",
  EN_CURSO: "En curso",
  CONTENIDOS_REVISADOS: "Contenido revisado",
};

export default function ProgresoProcesoPage() {
  const { procesoId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getProgresoProceso(procesoId)
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err.message || "No se pudo cargar el progreso."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [procesoId]);

  const proceso = data?.proceso;
  const asignacion = data?.asignacion;

  return <div className="space-y-6">
    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-luwi-blue hover:underline">← Volver al dashboard</Link>
    <PageHeader title="Ficha del postulante" description="Información del proceso y avance de formación." />
    {error && <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}<p className="mt-1 text-xs">Comprueba que tengas acceso a este proceso y vuelve a intentarlo.</p></div>}
    {loading ? <div className="h-52 animate-pulse rounded-3xl bg-white" /> : proceso && <>
      <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-luwi-muted">{proceso.empresa?.nombre ?? "Empresa"} · {proceso.puesto?.titulo ?? "Puesto"}</p><h2 className="mt-2 text-xl font-bold text-luwi-navy">{proceso.postulante?.nombre ?? "Postulante"}</h2><p className="mt-1 text-sm text-luwi-muted">{proceso.postulante?.correo ?? ""}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${proceso.estado === "ACTIVO" ? "bg-emerald-50 text-emerald-700" : proceso.estado === "SUSPENDIDO" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>{estadoProceso[proceso.estado] ?? proceso.estado}</span></div>
        <p className="mt-4 text-xs text-luwi-muted">Inicio del proceso: {proceso.fechaInicio ? new Date(proceso.fechaInicio).toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" }) : "Sin fecha"}</p>
      </section>
      {!asignacion ? <section className="rounded-3xl border border-dashed border-luwi-border bg-white px-6 py-12 text-center"><h3 className="font-semibold text-luwi-navy">Aún no hay una ruta asignada</h3><p className="mt-1 text-sm text-luwi-muted">El progreso aparecerá cuando Recursos Humanos asigne una ruta de formación.</p></section> : <>
        <section className="rounded-3xl bg-white p-5 shadow-card sm:p-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wide text-luwi-blue">Ruta de aprendizaje</p><h3 className="mt-1 text-lg font-bold text-luwi-navy">{asignacion.ruta?.nombre ?? "Ruta asignada"}</h3></div><strong className="text-2xl text-luwi-navy">{asignacion.porcentaje ?? 0}%</strong></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-luwi-bg"><div className="h-full rounded-full bg-gradient-to-r from-luwi-blue to-luwi-teal transition-[width]" style={{ width: `${Math.min(100, Math.max(0, Number(asignacion.porcentaje) || 0))}%` }} /></div><div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-luwi-muted"><span>{asignacion.revisadasObligatorias ?? 0} de {asignacion.totalObligatorias ?? 0} unidades obligatorias revisadas</span><span>{asignacion.cursosHabilitados ?? 0} de {asignacion.totalCursos ?? 0} cursos habilitados</span></div></section>
        <section className="overflow-hidden rounded-3xl border border-luwi-border bg-white"><header className="border-b border-luwi-border px-5 py-4"><h3 className="font-bold text-luwi-navy">Detalle por curso</h3></header><ol className="divide-y divide-luwi-border">{[...(asignacion.cursos ?? [])].sort((a,b) => a.orden - b.orden).map((curso) => <li key={curso.cursoAsignadoId} className="flex flex-wrap items-center gap-3 px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-luwi-bg text-xs font-bold text-luwi-blue">{curso.orden}</span><div className="min-w-0 flex-1"><p className="font-semibold text-luwi-ink">{curso.titulo}</p><p className="mt-1 text-xs text-luwi-muted">{curso.revisadasObligatorias ?? 0}/{curso.totalObligatorias ?? 0} obligatorias revisadas · {curso.duracionHoras ?? 0} h</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${curso.acceso === "HABILITADO" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>{estadoCurso[curso.estado] ?? curso.estado}</span><span className="w-12 text-right text-sm font-bold text-luwi-navy">{curso.porcentaje ?? 0}%</span></li>)}</ol></section>
      </>}
    </>}
  </div>;
}
