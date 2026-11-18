import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../../components/Icon";
import { ActionButton } from "../../components/AdminUI";
import { getProcesosFormacion } from "../../services/procesosFormacionService";

const labelEstado = { ACTIVO: "Activo", SUSPENDIDO: "Suspendido", FINALIZADO: "Finalizado" };
const tonoEstado = {
  ACTIVO: "bg-emerald-50 text-emerald-700",
  SUSPENDIDO: "bg-amber-50 text-amber-800",
  FINALIZADO: "bg-admin-bg text-admin-muted",
};

function fecha(valor) {
  if (!valor) return "Sin fecha";
  return new Date(valor).toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" });
}

export default function ProcesosFormacionPage() {
  const [procesos, setProcesos] = useState([]);
  const [query, setQuery] = useState("");
  const [estado, setEstado] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setProcesos(await getProcesosFormacion());
    } catch (err) {
      setError(err.message || "No se pudieron cargar los procesos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtrados = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("es");
    return procesos.filter((p) => {
      const texto = `${p.postulante?.nombre ?? ""} ${p.postulante?.correo ?? ""} ${p.puesto?.titulo ?? ""} ${p.empresa?.nombre ?? ""}`.toLocaleLowerCase("es");
      return (estado === "TODOS" || p.estado === estado) && (!q || texto.includes(q));
    });
  }, [procesos, query, estado]);

  return <div>
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-4xl font-extrabold text-admin-ink">Postulantes</h1><p className="mt-1 text-sm text-admin-muted">Consulta procesos y revisa el avance de formación.</p></div><ActionButton onClick={cargar} disabled={loading}>Actualizar</ActionButton></header>

    {error && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}<button type="button" onClick={cargar} className="font-semibold underline">Reintentar</button></div>}

    <section className="mb-4 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-lg shadow-admin-blue/5 sm:flex-row sm:items-center sm:justify-between">
      <label className="flex w-full max-w-md items-center gap-3 rounded-2xl border-2 border-admin-line bg-admin-bg px-4 py-2.5 focus-within:border-admin-blue focus-within:ring-4 focus-within:ring-admin-blue/10"><Icon name="search" className="h-[18px] w-[18px] text-admin-blue"/><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, correo o puesto…" aria-label="Buscar postulantes" className="w-full bg-transparent text-sm outline-none"/></label>
      <div className="flex flex-wrap items-center gap-2">{["TODOS", "ACTIVO", "SUSPENDIDO", "FINALIZADO"].map((value) => <button key={value} type="button" onClick={() => setEstado(value)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${estado === value ? "bg-admin-ink text-white" : "bg-admin-bg text-admin-muted hover:bg-admin-soft"}`}>{value === "TODOS" ? "Todos" : labelEstado[value]}</button>)}</div>
    </section>

    <section className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-admin-blue/10">
      <div className="flex items-center justify-between px-5 py-4 text-xs font-bold text-admin-muted"><span>{filtrados.length} {filtrados.length === 1 ? "proceso" : "procesos"}</span><span>Actualizados recientemente</span></div>
      {loading ? <p className="border-t border-admin-border px-6 py-12 text-center text-sm text-admin-muted">Cargando postulantes…</p> : filtrados.length === 0 ? <div className="border-t border-admin-border px-6 py-14 text-center"><h2 className="font-bold text-admin-ink">{query || estado !== "TODOS" ? "No encontramos procesos" : "Aún no hay procesos de formación"}</h2><p className="mt-1 text-sm text-admin-muted">{query || estado !== "TODOS" ? "Prueba con otra búsqueda o filtro." : "Los procesos aparecerán cuando se creen postulaciones con formación."}</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm text-admin-ink"><thead className="border-y border-admin-border bg-admin-bg text-xs uppercase tracking-wide"><tr><th className="px-5 py-3 font-bold">Postulante</th><th className="px-5 py-3 font-bold">Puesto</th><th className="px-5 py-3 font-bold">Empresa</th><th className="px-5 py-3 font-bold">Inicio</th><th className="px-5 py-3 font-bold">Estado</th><th className="px-5 py-3 text-right font-bold">Ficha</th></tr></thead><tbody className="divide-y divide-admin-border/60">{filtrados.map((proceso) => <tr key={proceso.id} className="transition hover:bg-admin-bg/50"><td className="px-5 py-4"><p className="font-semibold">{proceso.postulante?.nombre ?? "Postulante"}</p><p className="text-xs text-admin-muted">{proceso.postulante?.correo ?? "Sin correo"}</p></td><td className="px-5 py-4">{proceso.puesto?.titulo ?? "—"}</td><td className="px-5 py-4">{proceso.empresa?.nombre ?? "—"}</td><td className="px-5 py-4 text-admin-muted">{fecha(proceso.fechaInicio)}</td><td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${tonoEstado[proceso.estado] ?? "bg-admin-bg text-admin-muted"}`}>{labelEstado[proceso.estado] ?? proceso.estado}</span></td><td className="px-5 py-4 text-right"><ActionButton size="sm" variant="edit" to={`/dashboard/postulantes/${proceso.id}`}>Ver ficha</ActionButton></td></tr>)}</tbody></table></div>}
    </section>
    <p className="mt-3 text-xs text-admin-muted">La API limita los resultados según el rol: Recursos Humanos solo recibe procesos de su empresa.</p>
  </div>;
}
