import { useEffect, useState } from "react";
import { PageHeader, TableCard } from "../../components/AdminUI";
import { ErrorBanner } from "../../components/FormControls";
import RecomendacionesIAPanel from "../../components/ia/RecomendacionesIAPanel";
import { getPipeline } from "../../services/procesosService";
import { puestosService } from "../../services/puestosService";

function SparkIcon({ className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

/**
 * Pantalla dedicada de Recomendaciones de formación con IA para Recursos Humanos (Entrega 5 - María D).
 */
export default function RecomendacionesIAPage() {
  const [procesos, setProcesos] = useState([]);
  const [puestos, setPuestos] = useState([]);
  const [modo, setModo] = useState("proceso"); // "proceso" | "puesto"
  const [procesoId, setProcesoId] = useState("");
  const [puestoId, setPuestoId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setCargando(true);
    Promise.allSettled([getPipeline(), puestosService.list()])
      .then(([resProc, resPue]) => {
        if (!active) return;
        const listaProc = resProc.status === "fulfilled" ? resProc.value.procesos ?? [] : [];
        const listaPue = resPue.status === "fulfilled" ? resPue.value ?? [] : [];
        setProcesos(listaProc);
        setPuestos(listaPue);
        if (listaProc.length > 0) {
          setProcesoId(listaProc[0].id);
        } else if (listaPue.length > 0) {
          setModo("puesto");
          setPuestoId(listaPue[0].id ?? listaPue[0]._id ?? "");
        }
        if (resProc.status === "rejected" && resPue.status === "rejected") {
          setError("No se pudieron cargar los procesos ni los puestos para consultar recomendaciones.");
        }
      })
      .finally(() => active && setCargando(false));
    return () => {
      active = false;
    };
  }, []);

  const procesoActual = procesos.find((p) => p.id === procesoId);
  const puestoActual = puestos.find((p) => String(p.id ?? p._id) === puestoId);

  const puestoObjetivo = modo === "proceso" ? procesoActual?.puesto?.id : puestoId;
  const candidatoObjetivo = modo === "proceso" ? procesoActual?.postulante?.id : undefined;
  const procesoObjetivo = modo === "proceso" ? procesoId : undefined;

  const contextoTexto =
    modo === "proceso" && procesoActual
      ? `Analizando el proceso de ${procesoActual.postulante?.nombre ?? "postulante"} para el puesto "${procesoActual.puesto?.titulo ?? "Sin puesto"}".`
      : puestoActual
        ? `Analizando competencias del puesto "${puestoActual.titulo}" frente al catálogo de cursos.`
        : "Selecciona un postulante en proceso o un puesto para solicitar recomendaciones.";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={SparkIcon}
        seccion="Talento · Inteligencia Artificial"
        title="Recomendaciones de formación"
        subtitle="Consulta sugerencias de cursos del catálogo respaldadas por IA según las competencias de cada puesto y postulante."
        stats={
          cargando
            ? []
            : [
                { label: "Procesos activos", value: procesos.filter((p) => p.estado === "ACTIVO").length },
                { label: "Puestos registrados", value: puestos.length },
                { label: "Control RR. HH.", value: "Manual" },
              ]
        }
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      <TableCard>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-luwi-profundo">Contexto de la consulta</h2>
              <p className="text-xs text-luwi-texto">
                Elige si deseas evaluar un postulante en proceso o analizar directamente un puesto.
              </p>
            </div>
            <div className="inline-flex gap-1 rounded-xl bg-luwi-panel p-1 ring-1 ring-inset ring-luwi-linea">
              {[
                { key: "proceso", label: "Por proceso / postulante" },
                { key: "puesto", label: "Por puesto" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setModo(t.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    modo === t.key ? "bg-white text-luwi-medio shadow-sm" : "text-luwi-texto hover:text-luwi-profundo"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {cargando ? (
            <div className="h-11 animate-pulse rounded-xl bg-luwi-antique/50" />
          ) : modo === "proceso" ? (
            <div>
              <label htmlFor="ia-select-proceso" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
                Proceso de formación (postulante y puesto)
              </label>
              <select
                id="ia-select-proceso"
                value={procesoId}
                onChange={(e) => setProcesoId(e.target.value)}
                className="h-11 w-full max-w-xl rounded-xl border border-admin-line bg-luwi-panel px-4 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white"
              >
                <option value="">Selecciona un proceso…</option>
                {procesos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.postulante?.nombre ?? "Postulante"} — {p.puesto?.titulo ?? "Puesto"} ({p.estado})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="ia-select-puesto" className="mb-1.5 block text-xs font-semibold text-luwi-profundo">
                Puesto a evaluar
              </label>
              <select
                id="ia-select-puesto"
                value={puestoId}
                onChange={(e) => setPuestoId(e.target.value)}
                className="h-11 w-full max-w-xl rounded-xl border border-admin-line bg-luwi-panel px-4 text-sm text-luwi-profundo outline-none transition focus:border-luwi-medio focus:bg-white"
              >
                <option value="">Selecciona un puesto…</option>
                {puestos.map((p) => {
                  const pid = String(p.id ?? p._id);
                  return (
                    <option key={pid} value={pid}>
                      {p.titulo} {p.empresa?.nombre ? `· ${p.empresa.nombre}` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>
      </TableCard>

      <RecomendacionesIAPanel
        key={`${modo}-${procesoObjetivo ?? ""}-${puestoObjetivo ?? ""}`}
        puestoId={puestoObjetivo}
        procesoId={procesoObjetivo}
        candidatoId={candidatoObjetivo}
        contextoTexto={contextoTexto}
      />
    </div>
  );
}
