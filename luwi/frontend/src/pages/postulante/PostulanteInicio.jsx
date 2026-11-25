import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import ProgressBar from "../../components/postulante/ProgressBar";
import RadialGauge from "../../components/dashboard/RadialGauge";
import Panel from "../../components/dashboard/Panel";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import TuCamino from "../../components/postulante/TuCamino";
import LogrosGrid from "../../components/postulante/LogrosGrid";
import { CheckInAnimo, ConsejoDelDia, MetaSemanal, OpcionesChips, RachaSemana } from "../../components/postulante/Habitos";
import { ArrowRightIcon, BookIcon, BriefcaseIcon, BuildingIcon, CheckIcon, ClockIcon, TrendUpIcon } from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";
import useEspacioPostulante from "../../hooks/useEspacioPostulante";
import { destinoFormacion } from "../../services/formacionService";
import { resumenFormacion, formatoHoras } from "../../utils/formacion";
import { OPCIONES_RITMO, finEstimado } from "../../utils/espacioPostulante";

const rutaCurso = (asignacionId, cursoAsignadoId) => `/mi-formacion/${asignacionId}/cursos/${cursoAsignadoId}`;

function saludo() {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

// ---------- Bienvenida ----------

function Bienvenida({ nombre, datos, asignacion, suspendido, racha }) {
  const reducido = useReducedMotion();
  const primerNombre = nombre.split(" ")[0];

  return (
    <section className="relative flex flex-col justify-center overflow-hidden rounded-[28px] border border-luwi-linea bg-[radial-gradient(ellipse_at_85%_80%,#F8E6D2_0%,#FBF2E6_32%,#FDF8F2_68%,#FFFFFF_100%)] p-6 shadow-[0_20px_50px_-30px_rgba(17,22,82,0.3)] sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 right-[18%] h-80 w-80 rounded-full border-[40px] border-white/30" />

      {/* Chip flotante de racha */}
      {racha > 0 && (
        <motion.div
          aria-hidden="true"
          initial={reducido ? false : { opacity: 0, scale: 0.8 }}
          animate={reducido ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
          transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" }, default: { duration: 0.4 } }}
          className="absolute right-8 top-8 hidden items-center gap-2 rounded-2xl bg-white/85 px-3.5 py-2 text-xs font-semibold text-luwi-profundo shadow-[0_12px_30px_-14px_rgba(17,22,82,0.55)] backdrop-blur md:flex"
        >
          <span className="text-lg">🔥</span>
          {racha} {racha === 1 ? "día" : "días"} de racha
        </motion.div>
      )}

      <div className="relative max-w-[600px] md:pr-36">
        <span className="inline-flex items-center gap-2 rounded-full border border-white bg-white/70 px-3 py-1 text-[11.5px] font-medium text-luwi-texto backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-luwi-tecno shadow-[0_0_6px_2px_rgba(59,69,201,0.5)]" />
          {saludo()}
        </span>

        <h1 className="mt-4 break-words text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo sm:text-[34px]">
          Hola, <span className="bg-gradient-to-r from-luwi-medio to-luwi-tecno bg-clip-text text-transparent">{primerNombre}</span>{" "}
          <motion.span
            aria-hidden="true"
            className="inline-block origin-[70%_70%]"
            animate={reducido ? undefined : { rotate: [0, 16, -8, 16, 0] }}
            transition={{ duration: 1.6, delay: 0.6, repeat: Infinity, repeatDelay: 5 }}
          >
            👋
          </motion.span>
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
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(17,22,82,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
            >
              {asignacion.tieneAvance ? "Continuar formación" : "Comenzar formación"}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

function MiAvance({ asignacion, resumen, ritmo, onRitmo }) {
  const filas = resumen
    ? [
        { label: "Cursos completados", valor: `${resumen.completados}/${resumen.cursos.length}` },
        { label: "Unidades revisadas", valor: `${resumen.unidadesRevisadas}/${resumen.unidadesTotales}` },
        { label: "Horas restantes", valor: `${resumen.horasRestantes.toLocaleString("es-DO")} h` },
      ]
    : [];

  return (
    <section className="relative flex flex-col overflow-hidden rounded-[28px] bg-colonial-hero p-6 text-white shadow-[0_20px_50px_-25px_rgba(15,20,76,0.7)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-luwi-fawn/30 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold">Mi avance</h2>
          <p className="mt-0.5 text-xs text-white/60">{asignacion?.ruta?.nombre ?? "Sin ruta asignada"}</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-[#F0D4A4]">
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

      {resumen && (
        <div className="relative mt-3 rounded-2xl bg-white/[0.07] p-3.5 ring-1 ring-inset ring-white/10">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-white/65">Terminarías el</span>
            <span className="font-bold text-[#F0D4A4]">{finEstimado(resumen.horasRestantes, ritmo)}</span>
          </div>
          <div className="mt-2.5">
            <p className="mb-1.5 text-[11px] text-white/50">Si estudias al día</p>
            <OpcionesChips oscuro etiqueta="Tiempo de estudio al día" opciones={OPCIONES_RITMO} valor={ritmo} onChange={onRitmo} />
          </div>
        </div>
      )}
    </section>
  );
}

// ---------- Continúa donde lo dejaste ----------

function Continuar({ asignacion, curso, suspendido }) {
  if (!curso) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-luwi-antique text-luwi-fawn-deep">
          <CheckIcon className="h-7 w-7" />
        </span>
        <p className="mt-3 text-sm font-semibold text-luwi-profundo">No tienes cursos pendientes habilitados</p>
        <p className="mt-1 text-xs text-luwi-texto/80">Cuando Recursos Humanos habilite el siguiente curso, aparecerá aquí.</p>
      </div>
    );
  }

  const restantes = Math.max(0, (curso.totalObligatorias ?? 0) - (curso.revisadasObligatorias ?? 0));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_12px_24px_-10px_rgba(34,43,184,0.75)]">
        <BookIcon className="h-7 w-7" />
        <span className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-luwi-medio shadow ring-1 ring-luwi-linea">
          {curso.orden}
        </span>
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
          {restantes > 0 && (
            <span className="rounded-full bg-luwi-cristal-fondo px-2 py-0.5 font-semibold text-luwi-medio">
              {restantes === 1 ? "¡Solo falta 1 unidad!" : `Faltan ${restantes} unidades`}
            </span>
          )}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={curso.porcentaje} label={`Avance de ${curso.titulo}`} className="flex-1" />
          <span className="text-xs font-semibold text-luwi-profundo">{curso.porcentaje}%</span>
        </div>
      </div>
      {!suspendido && (
        <Link
          to={rutaCurso(asignacion.id, curso.cursoAsignadoId)}
          className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(17,22,82,0.8)] transition hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
        >
          {curso.estado === "EN_CURSO" ? "Continuar" : "Comenzar"}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

// ---------- Pantalla ----------

export default function PostulanteInicio() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();
  const asignacion = datos?.asignacion;
  const resumen = resumenFormacion(asignacion);
  const uid = datos?.usuario?.correo || user?.email || user?.nombre;
  const espacio = useEspacioPostulante(datos ? uid : null, resumen, asignacion);

  if (cargando && !datos) return <Cargando filas={2} />;
  if (error && !datos) return <ErrorCarga mensaje={error} onRetry={recargar} />;

  const nombre = datos?.usuario?.nombre || user?.nombre || "bienvenido";
  const logrados = espacio.logros.filter((l) => l.logrado).length;

  return (
    <div className="space-y-6">
      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <Bienvenida nombre={nombre} datos={datos} asignacion={asignacion} suspendido={suspendido} racha={espacio.racha} />
        <MiAvance asignacion={asignacion} resumen={resumen} ritmo={espacio.ritmo} onRitmo={espacio.setRitmo} />
      </div>

      {!asignacion && <Aviso>Recursos Humanos todavía no te ha asignado una ruta.</Aviso>}

      {resumen && (
        <>
          <Panel title="Continúa donde lo dejaste" subtitle="Tu siguiente paso en la ruta" icon={ArrowRightIcon}>
            <Continuar asignacion={asignacion} curso={resumen.actual} suspendido={suspendido} />
          </Panel>

          <TuCamino
            resumen={resumen}
            subtitulo={`${resumen.cursos.length} cursos · ${formatoHoras(resumen.horasTotales)} · vas en el ${asignacion.porcentaje}%`}
            accion={{ label: "Ver detalle", to: "/mi-formacion" }}
          />
        </>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <RachaSemana racha={espacio.racha} semana={espacio.semana} diasSemana={espacio.diasSemana} />
        {resumen ? (
          <MetaSemanal meta={espacio.meta} hechas={espacio.hechasSemana} onMeta={espacio.setMeta} />
        ) : (
          <ConsejoDelDia />
        )}
        <CheckInAnimo animo={espacio.animo} onAnimo={espacio.setAnimo} />
      </div>

      {resumen && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Panel title="Logros" subtitle={`${logrados} de ${espacio.logros.length} desbloqueados`} icon={CheckIcon} action={{ label: "Ver en mi perfil", to: "/mi-perfil" }}>
            <LogrosGrid logros={espacio.logros} compacto />
          </Panel>
          <ConsejoDelDia />
        </div>
      )}
    </div>
  );
}
