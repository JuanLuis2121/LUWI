import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import EmptyState from "../../components/dashboard/EmptyState";
import { RouteIcon, BriefcaseIcon, BookIcon, ClockIcon } from "../../components/dashboard/icons";
import { getRutas } from "../../services/rutasService";

// El backend puede nombrar al puesto "nombre" o "titulo"; se acepta cualquiera.
const nombrePuesto = (puesto) => puesto?.nombre ?? puesto?.titulo ?? "Sin puesto";
const formatoHoras = (h) => `${Number.isInteger(h) ? h : Number(h ?? 0).toFixed(1)} h`;

function Dato({ icon: Icon, children }) {
  return (
    <li className="flex items-center gap-2 text-sm text-luwi-ink">
      <Icon className="h-4 w-4 shrink-0 text-luwi-blue" />
      <span className="min-w-0 truncate">{children}</span>
    </li>
  );
}

/** Tarjeta de una ruta. Juan: aquí se agregan los botones Ver / Editar / Eliminar. */
function RutaCard({ ruta }) {
  const cursos = ruta.cursos?.length ?? 0;
  const empresa = ruta.puesto?.empresa?.nombre;

  return (
    <article className="flex flex-col rounded-2xl border border-luwi-border bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-blue to-luwi-purple text-white">
          <RouteIcon className="h-5 w-5" />
        </span>
        <h3 className="min-w-0 truncate font-semibold text-luwi-navy">{ruta.nombre}</h3>
      </div>

      {ruta.descripcion && (
        <p className="mb-4 line-clamp-2 text-sm text-luwi-muted">{ruta.descripcion}</p>
      )}

      <ul className="mt-auto space-y-2 border-t border-luwi-border pt-4">
        <Dato icon={BriefcaseIcon}>
          {nombrePuesto(ruta.puesto)}
          {empresa && <span className="text-luwi-muted"> · {empresa}</span>}
        </Dato>
        <Dato icon={BookIcon}>{cursos} {cursos === 1 ? "curso" : "cursos"}</Dato>
        <Dato icon={ClockIcon}>Duración total: {formatoHoras(ruta.duracionTotalHoras)}</Dato>
      </ul>
    </article>
  );
}

export default function RutasAprendizaje() {
  const [rutas, setRutas] = useState(null);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setError("");
    setRutas(null);
    getRutas().then(setRutas).catch((e) => setError(e.message));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  return (
    <>
      <PageHeader title="Rutas de aprendizaje" description="Recorridos de formación por puesto." />

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
          <button type="button" onClick={cargar} className="rounded-lg bg-white px-3 py-1.5 font-semibold shadow-sm hover:bg-red-100">
            Reintentar
          </button>
        </div>
      ) : rutas === null ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-2xl bg-white" />)}
        </div>
      ) : rutas.length === 0 ? (
        <EmptyState icon={RouteIcon} title="Aún no hay rutas" text="Cuando se creen rutas aparecerán aquí." />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rutas.map((r) => <RutaCard key={r._id ?? r.id} ruta={r} />)}
        </section>
      )}
    </>
  );
}
