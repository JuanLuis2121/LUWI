import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../Icon";
import { ActionButton } from "../AdminUI";
import { ErrorBanner } from "../FormControls";
import { ClockIcon } from "../dashboard/icons";
import { formatoHoras } from "../cursos/EstadoCurso";
import { solicitarRecomendacionesIA } from "../../services/iaService";

function SparkIcon({ className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

/**
 * Panel reutilizable de Recomendaciones de formación con IA (Entrega 5 - María D).
 * Nunca asigna rutas ni habilita cursos automáticamente: entrega sugerencias + explicación para que RR. HH. decida.
 */
export default function RecomendacionesIAPanel({ puestoId, procesoId, candidatoId, contextoTexto }) {
  const [consultado, setConsultado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resumen, setResumen] = useState("");
  const [recomendaciones, setRecomendaciones] = useState([]);

  const puedeSolicitar = Boolean(puestoId || procesoId);

  async function manejarSolicitar() {
    if (!puedeSolicitar) return;
    setCargando(true);
    setError("");
    try {
      const data = await solicitarRecomendacionesIA({ puestoId, procesoId, candidatoId });
      setRecomendaciones(data.recomendaciones ?? []);
      setResumen(data.resumen ?? "");
      setConsultado(true);
    } catch (err) {
      setError(err.message || "No se pudo obtener respuesta del proveedor de IA.");
      setConsultado(true);
    } finally {
      setCargando(false);
    }
  }

  return (
    <section
      aria-labelledby="ia-recomendaciones-titulo"
      className="rounded-3xl border border-luwi-linea bg-white p-5 shadow-[0_14px_38px_-22px_rgba(17,22,82,0.16)] sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-colonial-fawn text-luwi-profundo shadow-sm">
            <SparkIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-luwi-fawn-deep">
              Asistente inteligente · RR. HH.
            </p>
            <h2 id="ia-recomendaciones-titulo" className="text-xl font-extrabold text-luwi-profundo">
              Recomendaciones de formación con IA
            </h2>
            <p className="mt-0.5 text-xs text-luwi-texto">
              {contextoTexto ||
                "Analiza las competencias del puesto frente al catálogo disponible y sugiere cursos con su justificación."}
            </p>
          </div>
        </div>

        <ActionButton variant="primary" disabled={!puedeSolicitar || cargando} onClick={manejarSolicitar}>
          <SparkIcon className="h-4 w-4" />
          {cargando ? "Consultando IA…" : consultado ? "Actualizar recomendaciones" : "Solicitar recomendaciones"}
        </ActionButton>
      </div>

      {/* Aviso explícito de regla de negocio (María D.8 y D.9) */}
      <p className="mt-4 flex items-start gap-2 rounded-2xl border border-luwi-fawn/40 bg-luwi-antique/55 px-4 py-2.5 text-xs text-luwi-profundo">
        <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0 text-luwi-fawn-deep" />
        <span>
          Las recomendaciones son únicamente sugerencias de apoyo. <strong>La IA no asigna rutas ni habilita cursos automáticamente</strong>; Recursos Humanos decide y gestiona las asignaciones desde los controles habituales.
        </span>
      </p>

      <div className="mt-5">
        {error && (
          <div className="space-y-3">
            <ErrorBanner>{error}</ErrorBanner>
            <ActionButton size="sm" disabled={cargando} onClick={manejarSolicitar}>
              Reintentar consulta
            </ActionButton>
          </div>
        )}

        {cargando && (
          <div className="grid gap-4 md:grid-cols-2" role="status" aria-label="Solicitando recomendaciones de IA">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-2xl bg-luwi-antique/50" />
            ))}
          </div>
        )}

        {!cargando && !error && !consultado && (
          <div className="rounded-2xl border-2 border-dashed border-luwi-linea bg-luwi-panel/70 px-6 py-8 text-center">
            <p className="text-sm font-bold text-luwi-profundo">
              {puedeSolicitar ? "Listo para generar sugerencias" : "Selecciona un puesto o proceso para consultar"}
            </p>
            <p className="mt-1 text-xs text-luwi-texto">
              Presiona “Solicitar recomendaciones” para consultar al servicio de IA los cursos sugeridos del catálogo.
            </p>
          </div>
        )}

        {!cargando && !error && consultado && recomendaciones.length === 0 && (
          <div className="rounded-2xl border border-luwi-linea bg-luwi-panel px-6 py-8 text-center">
            <p className="text-sm font-bold text-luwi-profundo">No se encontraron recomendaciones para este perfil</p>
            <p className="mt-1 text-xs text-luwi-texto">
              Verifica que el puesto tenga competencias definidas y que existan cursos publicados en el catálogo.
            </p>
          </div>
        )}

        {!cargando && !error && recomendaciones.length > 0 && (
          <div className="space-y-4">
            {resumen && (
              <p className="rounded-2xl bg-luwi-cristal/60 px-4 py-3 text-sm text-luwi-profundo">{resumen}</p>
            )}

            <ul className="grid gap-4 md:grid-cols-2">
              {recomendaciones.map((rec, idx) => (
                <li
                  key={rec.cursoId}
                  className="flex flex-col justify-between rounded-2xl border border-luwi-linea bg-luwi-panel/60 p-4 transition hover:border-luwi-medio/35 hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-lg bg-luwi-cristal px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-luwi-medio">
                        Sugerencia #{idx + 1}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-luwi-texto">
                        {rec.nivel && <span className="capitalize">{rec.nivel}</span>}
                        {rec.duracionHoras != null && (
                          <span className="inline-flex items-center gap-1">
                            <ClockIcon className="h-3.5 w-3.5 text-luwi-fawn-deep" />
                            {formatoHoras(rec.duracionHoras)}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-2.5 text-base font-extrabold text-luwi-profundo">{rec.titulo}</h3>
                    {rec.competencia && (
                      <p className="mt-0.5 text-xs font-semibold text-luwi-fawn-deep">{rec.competencia}</p>
                    )}

                    <p className="mt-2.5 rounded-xl bg-white p-3 text-xs leading-relaxed text-luwi-texto ring-1 ring-inset ring-luwi-linea">
                      {rec.explicacion}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-luwi-linea pt-3">
                    <span className="text-[11px] font-medium text-luwi-muted">Asignación manual por RR. HH.</span>
                    <div className="flex items-center gap-3">
                      {!rec.cursoId.startsWith("rec-") && (
                        <Link
                          to={`/dashboard/cursos/${rec.cursoId}/unidades`}
                          className="text-xs font-bold text-luwi-medio hover:underline"
                        >
                          Ver curso →
                        </Link>
                      )}
                      <Link
                        to="/dashboard/rutas"
                        className="text-xs font-bold text-luwi-fawn-deep hover:underline"
                      >
                        Ir a rutas
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
