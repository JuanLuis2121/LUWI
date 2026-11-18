import PageHeader from "../../components/dashboard/PageHeader";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";

function Campo({ label, value }) {
  return (
    <div>
      <dt className="mb-1.5 text-sm font-medium text-luwi-ink">{label}</dt>
      <dd className="min-h-[2.75rem] break-words rounded-xl border border-luwi-border bg-luwi-bg px-4 py-2.5 text-sm text-luwi-navy">
        {value}
      </dd>
    </div>
  );
}

export default function MiPerfil() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();

  if (cargando && !datos) return <Cargando filas={1} />;

  const nombre = datos?.usuario?.nombre || user?.nombre || "";
  const correo = datos?.usuario?.correo || user?.email || "";

  return (
    <div className="space-y-6">
      <PageHeader title="Mi perfil" description="Estos datos los administra Recursos Humanos." />

      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}
      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}

      <section className="rounded-2xl border border-luwi-border bg-white p-5 shadow-card sm:p-6">
        <div className="mb-6 flex items-center gap-4">
          <span
            aria-hidden="true"
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-luwi-blue to-luwi-purple text-2xl font-bold text-white"
          >
            {(nombre.charAt(0) || "?").toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="break-words text-lg font-semibold text-luwi-navy">{nombre}</p>
            <p className="break-words text-sm text-luwi-muted">Postulante</p>
          </div>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nombre" value={nombre} />
          <Campo label="Correo" value={correo} />
          <Campo label="Puesto" value={datos?.puesto?.titulo ?? "Sin asignar"} />
        </dl>
      </section>
    </div>
  );
}
