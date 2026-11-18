import { Link } from "react-router-dom";
import ProgressBar from "../../components/postulante/ProgressBar";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import {
  ArrowRightIcon, BookIcon, BriefcaseIcon, BuildingIcon, RouteIcon,
} from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";
import { destinoFormacion } from "../../services/formacionService";

function InfoCard({ icon: Icon, label, value, tone }) {
  return (
    <article className="flex items-start gap-4 rounded-2xl border border-luwi-border bg-white p-5 shadow-card">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-luwi-muted">{label}</p>
        <p className="mt-0.5 break-words font-semibold text-luwi-navy">{value}</p>
      </div>
    </article>
  );
}

export default function PostulanteInicio() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();

  if (cargando && !datos) return <Cargando filas={2} />;
  if (error && !datos) return <ErrorCarga mensaje={error} onRetry={recargar} />;

  const asignacion = datos?.asignacion;
  const nombre = datos?.postulante?.nombre || user?.username || "bienvenido";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-luwi-navy via-luwi-blue to-luwi-purple p-6 text-white shadow-card sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-luwi-teal/30" />

        <h1 className="relative break-words text-2xl font-bold sm:text-3xl">Hola, {nombre}</h1>
        <p className="relative mt-1 max-w-xl text-sm text-white/80">
          {asignacion
            ? "Este es el avance de tu ruta de formación."
            : "Aquí verás tu ruta de formación cuando Recursos Humanos te la asigne."}
        </p>

        {asignacion && (
          <div className="relative mt-5 max-w-xl">
            <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
              <span className="text-white/80">Avance de la ruta</span>
              <span className="text-lg font-bold">{asignacion.porcentaje}%</span>
            </div>
            <ProgressBar value={asignacion.porcentaje} inverse label="Avance de la ruta" />
          </div>
        )}

        {asignacion && !suspendido && (
          <Link
            to={destinoFormacion(asignacion)}
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-luwi-navy shadow-sm transition hover:bg-luwi-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {asignacion.tieneAvance ? "Continuar formación" : "Comenzar formación"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        )}
      </section>

      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}
      {!asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={BuildingIcon}
          label="Empresa"
          value={datos?.empresa?.nombre ?? "Sin asignar"}
          tone="from-luwi-blue to-luwi-purple"
        />
        <InfoCard
          icon={BriefcaseIcon}
          label="Puesto"
          value={datos?.puesto?.titulo ?? "Sin asignar"}
          tone="from-luwi-teal to-emerald-300"
        />
        <InfoCard
          icon={RouteIcon}
          label="Ruta"
          value={asignacion?.ruta?.nombre ?? "Sin asignar"}
          tone="from-luwi-purple to-luwi-blue"
        />
        <InfoCard
          icon={BookIcon}
          label="Cursos habilitados"
          value={asignacion ? `${asignacion.cursosHabilitados} de ${asignacion.totalCursos}` : "—"}
          tone="from-luwi-navy to-luwi-blue"
        />
      </div>
    </div>
  );
}
