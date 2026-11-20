import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import ProgressBar from "../../components/postulante/ProgressBar";
import { BriefcaseIcon, BuildingIcon, RouteIcon, UserIcon, LockIcon } from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";

const ESTADO_PROCESO = {
  ACTIVO: { texto: "Activo", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", punto: "bg-emerald-500" },
  SUSPENDIDO: { texto: "Suspendido", cls: "bg-amber-50 text-amber-700 ring-amber-200", punto: "bg-amber-500" },
};

function MailIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function Campo({ icon: Icon, label, value }) {
  return (
    <div>
      <dt className="mb-1.5 text-xs font-semibold text-luwi-texto/80">{label}</dt>
      <dd className="flex min-h-[48px] items-center gap-3 rounded-xl bg-luwi-panel px-4 py-2.5 text-sm text-luwi-profundo ring-1 ring-inset ring-luwi-linea/70">
        <Icon className="h-[18px] w-[18px] shrink-0 text-luwi-medio" />
        <span className="min-w-0 break-words">{value || "—"}</span>
      </dd>
    </div>
  );
}

const tarjeta = "rounded-[24px] border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] sm:p-6";

export default function MiPerfil() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();

  if (cargando && !datos) return <Cargando filas={1} />;

  const nombre = datos?.usuario?.nombre || user?.nombre || "";
  const correo = datos?.usuario?.correo || user?.email || "";
  const asignacion = datos?.asignacion;
  const estado = ESTADO_PROCESO[datos?.proceso?.estado];

  return (
    <div className="space-y-6">
      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}
      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}

      {/* Portada del perfil */}
      <section className="overflow-hidden rounded-[28px] border border-white bg-white/90 shadow-[0_14px_40px_-28px_rgba(11,58,140,0.6)]">
        <div className="relative h-36 overflow-hidden bg-[linear-gradient(120deg,#0B3A8C_0%,#0B5BD3_55%,#009CFF_100%)] sm:h-40">
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
          <div aria-hidden="true" className="absolute right-40 top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <svg aria-hidden="true" viewBox="0 0 800 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full opacity-20">
            <path d="M0 110 C160 60 320 160 480 100 C620 50 720 110 800 80 V160 H0Z" fill="white" />
          </svg>
        </div>

        <div className="relative px-6 pb-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-luwi-tecno to-luwi-medio text-4xl font-bold text-white shadow-[0_16px_30px_-12px_rgba(0,110,230,0.8)] ring-[6px] ring-white"
              >
                {(nombre.charAt(0) || "?").toUpperCase()}
              </span>
              <div className="min-w-0 pt-4">
                <h1 className="break-words text-2xl font-bold tracking-[-0.02em] text-luwi-profundo">{nombre}</h1>
                <p className="text-sm text-luwi-texto">Postulante{datos?.puesto?.titulo ? ` · ${datos.puesto.titulo}` : ""}</p>
              </div>
            </div>
            {estado && (
              <span className={`mt-5 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${estado.cls}`}>
                <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                Proceso {estado.texto.toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Información personal */}
        <section className={tarjeta}>
          <h2 className="text-[15px] font-semibold text-luwi-profundo">Información personal</h2>
          <p className="mt-0.5 text-xs text-luwi-texto/75">Tus datos de acceso a LUWI</p>
          <dl className="mt-5 space-y-4">
            <Campo icon={UserIcon} label="Nombre" value={nombre} />
            <Campo icon={MailIcon} label="Correo" value={correo} />
          </dl>
        </section>

        {/* Proceso de formación */}
        <section className={tarjeta}>
          <h2 className="text-[15px] font-semibold text-luwi-profundo">Mi proceso</h2>
          <p className="mt-0.5 text-xs text-luwi-texto/75">Empresa, puesto y ruta asignados</p>
          <dl className="mt-5 space-y-4">
            <Campo icon={BuildingIcon} label="Empresa" value={datos?.empresa?.nombre ?? "Sin asignar"} />
            <Campo icon={BriefcaseIcon} label="Puesto" value={datos?.puesto?.titulo ?? "Sin asignar"} />
            <Campo icon={RouteIcon} label="Ruta de formación" value={asignacion?.ruta?.nombre ?? "Sin asignar"} />
          </dl>
          {asignacion && (
            <div className="mt-5">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="text-luwi-texto/80">Avance de la ruta</span>
                <span className="font-semibold text-luwi-profundo">{asignacion.porcentaje}%</span>
              </div>
              <ProgressBar value={asignacion.porcentaje} label="Avance de la ruta" />
            </div>
          )}
        </section>
      </div>

      <p className="flex items-center gap-2 rounded-2xl bg-luwi-cristal-fondo px-5 py-3.5 text-sm text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
        <LockIcon className="h-4 w-4 shrink-0 text-luwi-medio" />
        Estos datos los administra Recursos Humanos. Si algo no es correcto, comunícate con ellos.
      </p>
    </div>
  );
}
