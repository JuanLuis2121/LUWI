import { Link } from "react-router-dom";
import ProgressBar from "../../components/postulante/ProgressBar";
import RadialGauge from "../../components/dashboard/RadialGauge";
import Panel from "../../components/dashboard/Panel";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import {
  ArrowRightIcon, BookIcon, BriefcaseIcon, BuildingIcon, RouteIcon, CheckIcon, LockIcon, ClockIcon, TrendUpIcon,
} from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";
import { destinoFormacion } from "../../services/formacionService";
import { resumenFormacion, situacionCurso, formatoHoras } from "../../utils/formacion";

const rutaCurso = (asignacionId, cursoAsignadoId) => `/mi-formacion/${asignacionId}/cursos/${cursoAsignadoId}`;

// ---------- Bienvenida ilustrada ----------

function Bienvenida({ nombre, datos, asignacion, suspendido }) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-white bg-[radial-gradient(ellipse_at_82%_78%,#A9D5FD_0%,#B9DCFD_22%,#DCEBFF_48%,#F3F8FF_72%,#FFFFFF_100%)] p-6 shadow-[0_20px_50px_-30px_rgba(11,58,140,0.55)] sm:p-8 lg:min-h-[300px]">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-[18%] h-80 w-80 rounded-full border-[40px] border-white/30" />

      <img
        src="/LUWI-login-illustration.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-6 -right-6 hidden w-[46%] max-w-[440px] md:block [mask-image:radial-gradient(ellipse_62%_64%_at_55%_55%,black_55%,transparent_100%)]"
      />

      <div className="relative max-w-[480px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3 py-1 text-[11.5px] font-medium text-luwi-texto backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno shadow-[0_0_6px_2px_rgba(0,156,255,0.5)]" />
          Tu espacio de formación
        </span>

        <h1 className="mt-4 break-words text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo sm:text-[34px]">
          Hola, <span className="bg-gradient-to-r from-luwi-medio to-luwi-tecno bg-clip-text text-transparent">{nombre}</span>
        </h1>

        <p className="mt-2 text-[15px] leading-relaxed text-luwi-texto">
          {asignacion
            ? asignacion.porcentaje >= 100
              ? "¡Completaste tu ruta de formación! Recursos Humanos ya puede ver tu avance."
              : "Cada unidad que revisas te acerca a tu nuevo puesto. Sigue a tu ritmo."
            : "Aquí verás tu ruta de formación cuando Recursos Humanos te la asigne."}
        </p>

        {asignacion && !suspendido && (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={destinoFormacion(asignacion)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(11,58,140,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
            >
              {asignacion.tieneAvance ? "Continuar formación" : "Comenzar formación"}
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              to="/mi-formacion"
              className="inline-flex items-center gap-2 rounded-xl border border-white bg-white/80 px-5 py-2.5 text-sm font-semibold text-luwi-profundo shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
            >
              Ver mi ruta
            </Link>
          </div>
        )}

        <ul className="mt-6 flex flex-wrap gap-2">
          {datos?.puesto?.titulo && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-luwi-profundo">
              <BriefcaseIcon className="h-3.5 w-3.5 text-luwi-tecno" />
              {datos.puesto.titulo}
            </li>
          )}
          {datos?.empresa?.nombre && (
            <li className="inline-flex items-center gap-1.5 rounded-full bg-white/75 px-3 py-1 text-xs font-semibold text-luwi-profundo">
              <BuildingIcon className="h-3.5 w-3.5 text-luwi-tecno" />
              {datos.empresa.nombre}
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}

// ---------- Tarjeta oscura de avance ----------

function MiAvance({ asignacion, resumen }) {
  const filas = resumen
    ? [
        { label: "Cursos completados", valor: `${resumen.completados}/${resumen.cursos.length}` },
        { label: "Unidades revisadas", valor: `${resumen.unidadesRevisadas}/${resumen.unidadesTotales}` },
        { label: "Horas restantes", valor: `${resumen.horasRestantes.toLocaleString("es-DO")} h` },
      ]
    : [];

  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#0B3A8C_0%,#082C6E_50%,#061A45_100%)] p-6 text-white shadow-[0_20px_50px_-25px_rgba(6,26,69,0.8)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-luwi-tecno/25 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Mi avance</h2>
          <p className="mt-0.5 text-xs text-white/60">{asignacion?.ruta?.nombre ?? "Sin ruta asignada"}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#7cc8ff]">
          <TrendUpIcon className="h-[18px] w-[18px]" />
        </span>
      </div>

      <div className="relative mt-3 flex justify-center">
        <RadialGauge value={asignacion?.porcentaje ?? 0} label="Completado" />
      </div>

      <ul className="relative mt-2 divide-y divide-white/10">
        {filas.map((f) => (
          <li key={f.label} className="flex items-baseline justify-between py-2.5 text-sm">
            <span className="text-white/65">{f.label}</span>
            <span className="font-semibold">{f.valor}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ---------- Continúa donde lo dejaste ----------

function Continuar({ asignacion, curso, suspendido }) {
  if (!curso) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckIcon className="h-7 w-7" />
        </span>
        <p className="mt-3 text-sm font-semibold text-luwi-profundo">No tienes cursos pendientes habilitados</p>
        <p className="mt-1 text-xs text-luwi-texto/80">Cuando Recursos Humanos habilite el siguiente curso, aparecerá aquí.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_12px_24px_-10px_rgba(0,110,230,0.75)]">
        <BookIcon className="h-7 w-7" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-luwi-tecno">Curso {curso.orden}</p>
        <p className="mt-0.5 break-words text-lg font-semibold text-luwi-profundo">{curso.titulo}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-luwi-texto/80">
          <span className="inline-flex items-center gap-1">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatoHoras(curso.duracionHoras)}
          </span>
          <span>
            {curso.revisadasObligatorias} de {curso.totalObligatorias} unidades revisadas
          </span>
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={curso.porcentaje} label={`Avance de ${curso.titulo}`} className="flex-1" />
          <span className="text-xs font-semibold text-luwi-profundo">{curso.porcentaje}%</span>
        </div>
      </div>
      {!suspendido && (
        <Link
          to={rutaCurso(asignacion.id, curso.cursoAsignadoId)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(11,58,140,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
        >
          {curso.estado === "EN_CURSO" ? "Continuar" : "Comenzar"}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ---------- Ruta en pasos ----------

const ESTILO_PASO = {
  hecho: "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white",
  actual: "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_0_0_6px_rgba(0,156,255,0.15)]",
  disponible: "bg-white text-luwi-medio ring-2 ring-luwi-cristal",
  bloqueado: "bg-luwi-panel text-luwi-texto/50 ring-1 ring-luwi-linea",
};

const TEXTO_PASO = {
  hecho: "Completado",
  actual: "En curso",
  disponible: "Disponible",
  bloqueado: "Bloqueado",
};

function RutaPasos({ resumen }) {
  const actualId = resumen.actual?.cursoAsignadoId;
  return (
    <ol className="relative">
      {resumen.cursos.map((c, i) => {
        const s = situacionCurso(c, actualId);
        const ultimo = i === resumen.cursos.length - 1;
        return (
          <li key={c.cursoAsignadoId} className="relative flex gap-4 pb-5 last:pb-0">
            {!ultimo && (
              <span
                aria-hidden="true"
                className={`absolute left-[19px] top-11 h-[calc(100%-44px)] w-0.5 rounded-full ${
                  s === "hecho" ? "bg-emerald-300" : "bg-luwi-linea"
                }`}
              />
            )}
            <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${ESTILO_PASO[s]}`}>
              {s === "hecho" ? <CheckIcon className="h-5 w-5" /> : s === "bloqueado" ? <LockIcon className="h-4 w-4" /> : c.orden}
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className={`truncate text-sm font-semibold ${s === "bloqueado" ? "text-luwi-texto/70" : "text-luwi-profundo"}`}>{c.titulo}</p>
              <p className="text-xs text-luwi-texto/70">
                {TEXTO_PASO[s]} · {formatoHoras(c.duracionHoras)}
              </p>
            </div>
            <span className="shrink-0 pt-1 text-xs font-semibold text-luwi-texto">{c.porcentaje}%</span>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Logros ----------

function Logros({ logros }) {
  return (
    <ul className="grid grid-cols-2 gap-3">
      {logros.map((l) => (
        <li
          key={l.id}
          className={`rounded-2xl p-4 transition ${
            l.logrado ? "bg-gradient-to-br from-luwi-cristal-fondo to-white ring-1 ring-luwi-cristal" : "bg-luwi-panel/70 ring-1 ring-luwi-linea/60"
          }`}
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              l.logrado
                ? "bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-[0_8px_16px_-8px_rgba(251,146,60,0.9)]"
                : "bg-white text-luwi-texto/40 ring-1 ring-luwi-linea"
            }`}
          >
            {l.logrado ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 16.9 6.1 20.1l1.3-6.6L2.5 8.9l6.6-.8L12 2z" />
              </svg>
            ) : (
              <LockIcon className="h-4 w-4" />
            )}
          </span>
          <p className={`mt-3 text-sm font-semibold ${l.logrado ? "text-luwi-profundo" : "text-luwi-texto/70"}`}>{l.titulo}</p>
          <p className="mt-0.5 text-[11.5px] leading-snug text-luwi-texto/70">{l.detalle}</p>
        </li>
      ))}
    </ul>
  );
}

// ---------- Datos del proceso ----------

function InfoCard({ icon: Icon, label, value }) {
  return (
    <article className="flex items-center gap-4 rounded-[22px] border border-white bg-white/90 p-4 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-luwi-medio">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-luwi-texto/75">{label}</p>
        <p className="truncate text-sm font-semibold text-luwi-profundo" title={value}>
          {value}
        </p>
      </div>
    </article>
  );
}

// ---------- Pantalla ----------

export default function PostulanteInicio() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();

  if (cargando && !datos) return <Cargando filas={2} />;
  if (error && !datos) return <ErrorCarga mensaje={error} onRetry={recargar} />;

  const asignacion = datos?.asignacion;
  const resumen = resumenFormacion(asignacion);
  const nombre = datos?.usuario?.nombre || user?.nombre || "bienvenido";

  return (
    <div className="space-y-6">
      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Bienvenida nombre={nombre} datos={datos} asignacion={asignacion} suspendido={suspendido} />
        <MiAvance asignacion={asignacion} resumen={resumen} />
      </div>

      {!asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      {resumen && (
        <>
          <Panel title="Continúa donde lo dejaste" subtitle="Tu siguiente paso en la ruta" icon={ArrowRightIcon}>
            <Continuar asignacion={asignacion} curso={resumen.actual} suspendido={suspendido} />
          </Panel>

          <div className="grid gap-6 lg:grid-cols-5">
            <Panel
              title="Tu ruta de formación"
              subtitle={`${resumen.cursos.length} cursos · ${formatoHoras(resumen.horasTotales)}`}
              icon={RouteIcon}
              action={{ label: "Ver todo", to: "/mi-formacion" }}
              className="min-w-0 lg:col-span-3"
            >
              <RutaPasos resumen={resumen} />
            </Panel>

            <Panel
              title="Logros"
              subtitle={`${resumen.logros.filter((l) => l.logrado).length} de ${resumen.logros.length} desbloqueados`}
              icon={CheckIcon}
              className="min-w-0 lg:col-span-2"
            >
              <Logros logros={resumen.logros} />
            </Panel>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard icon={BuildingIcon} label="Empresa" value={datos?.empresa?.nombre ?? "Sin asignar"} />
        <InfoCard icon={BriefcaseIcon} label="Puesto" value={datos?.puesto?.titulo ?? "Sin asignar"} />
        <InfoCard
          icon={BookIcon}
          label="Cursos habilitados"
          value={asignacion ? `${asignacion.cursosHabilitados} de ${asignacion.totalCursos}` : "—"}
        />
      </div>
    </div>
  );
}
