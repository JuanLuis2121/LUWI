import { motion, useReducedMotion } from "motion/react";
import { Aviso, Cargando, ErrorCarga, MENSAJE_SUSPENDIDO } from "../../components/postulante/Avisos";
import ProgressBar from "../../components/postulante/ProgressBar";
import AvatarPostulante from "../../components/postulante/AvatarPostulante";
import LogrosGrid from "../../components/postulante/LogrosGrid";
import { OpcionesChips } from "../../components/postulante/Habitos";
import { BriefcaseIcon, BuildingIcon, RouteIcon, UserIcon, LockIcon } from "../../components/dashboard/icons";
import useAuth from "../../hooks/useAuth";
import useMiFormacion from "../../hooks/useMiFormacion";
import useCountUp from "../../hooks/useCountUp";
import useEspacioPostulante from "../../hooks/useEspacioPostulante";
import { resumenFormacion, formatoHoras } from "../../utils/formacion";
import { ANIMOS, OPCIONES_META, OPCIONES_RITMO, finEstimado } from "../../utils/espacioPostulante";

const ESTADO_PROCESO = {
  ACTIVO: { texto: "Activo", cls: "bg-luwi-cristal text-luwi-medio ring-luwi-medio/20", punto: "bg-luwi-medio" },
  SUSPENDIDO: { texto: "Suspendido", cls: "bg-amber-50 text-amber-700 ring-amber-200", punto: "bg-amber-500" },
  FINALIZADO: { texto: "Finalizado", cls: "bg-luwi-cristal-fondo text-luwi-profundo ring-luwi-cristal", punto: "bg-luwi-medio" },
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

/** Cifra con animación de conteo. */
function Estadistica({ emoji, label, valor, sufijo = "", detalle, indice }) {
  const reducido = useReducedMotion();
  const animado = useCountUp(valor);
  return (
    <motion.article
      initial={reducido ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * indice }}
      whileHover={reducido ? undefined : { y: -3 }}
      className="relative overflow-hidden rounded-[22px] border border-luwi-linea/80 bg-white/95 p-5 shadow-[0_10px_30px_-18px_rgba(17,22,82,0.28)]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-3 -top-3 text-5xl opacity-[0.12]">
        {emoji}
      </span>
      <p className="text-xs font-medium text-luwi-texto/80">{label}</p>
      <p className="mt-1 text-[28px] font-bold leading-none tracking-[-0.02em] text-luwi-profundo">
        {Math.round(animado)}
        <span className="text-base font-semibold text-luwi-texto/70">{sufijo}</span>
      </p>
      {detalle && <p className="mt-1.5 text-[11.5px] text-luwi-texto/70">{detalle}</p>}
    </motion.article>
  );
}

const tarjeta = "rounded-[24px] border border-luwi-linea/80 bg-white/95 p-5 shadow-[0_10px_30px_-18px_rgba(17,22,82,0.28)] sm:p-6";

export default function MiPerfil() {
  const { user } = useAuth();
  const { datos, error, cargando, suspendido, recargar } = useMiFormacion();
  const asignacion = datos?.asignacion;
  const resumen = resumenFormacion(asignacion);
  const uid = datos?.usuario?.correo || user?.email || user?.nombre;
  const espacio = useEspacioPostulante(datos ? uid : null, resumen, asignacion);

  if (cargando && !datos) return <Cargando filas={1} />;

  const nombre = datos?.usuario?.nombre || user?.nombre || "";
  const correo = datos?.usuario?.correo || user?.email || "";
  const estado = ESTADO_PROCESO[datos?.proceso?.estado];
  const animoHoy = ANIMOS.find((a) => a.valor === espacio.animo);
  const logrados = espacio.logros.filter((l) => l.logrado).length;
  const horasHechas = resumen ? Math.round((resumen.horasTotales - resumen.horasRestantes) * 10) / 10 : 0;

  return (
    <div className="space-y-6">
      {error && !datos && <ErrorCarga mensaje={error} onRetry={recargar} />}
      {suspendido && <Aviso>{MENSAJE_SUSPENDIDO}</Aviso>}

      {/* Portada del perfil */}
      <section className="rounded-[28px] border border-luwi-linea/80 bg-white/95 shadow-[0_14px_40px_-28px_rgba(17,22,82,0.4)]">
        <div className="relative h-36 overflow-hidden rounded-t-[28px] bg-colonial-hero sm:h-40">
          <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full border-[30px] border-white/10" />
          <div aria-hidden="true" className="absolute right-40 top-10 h-24 w-24 rounded-full bg-white/10 blur-xl" />
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.12] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
          />
          <svg aria-hidden="true" viewBox="0 0 800 160" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-16 w-full opacity-20">
            <path d="M0 110 C160 60 320 160 480 100 C620 50 720 110 800 80 V160 H0Z" fill="white" />
          </svg>
          {/* Insignias flotantes de los logros obtenidos */}
          <div className="absolute bottom-4 right-6 hidden gap-2 sm:flex">
            {espacio.logros
              .filter((l) => l.logrado)
              .slice(0, 4)
              .map((l, i) => (
                <motion.span
                  key={l.id}
                  title={l.titulo}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg ring-1 ring-white/25 backdrop-blur"
                >
                  {{ inicio: "👣", curso: "📘", mitad: "⛰️", ruta: "🏆", racha: "🔥", semana: "📅", notas: "📝", meta: "🎯" }[l.id]}
                </motion.span>
              ))}
          </div>
        </div>

        <div className="relative px-6 pb-6 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <AvatarPostulante nombre={nombre} paleta={espacio.avatar} onPaleta={espacio.setAvatar} />
              <div className="min-w-0 pt-4">
                <h1 className="break-words text-2xl font-bold tracking-[-0.02em] text-luwi-profundo">{nombre}</h1>
                <p className="text-sm text-luwi-texto">Postulante{datos?.puesto?.titulo ? ` · ${datos.puesto.titulo}` : ""}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {animoHoy && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-luwi-cristal-fondo px-3 py-1 text-xs font-semibold text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
                  <span>{animoHoy.emoji}</span>
                  Hoy: {animoHoy.label.toLowerCase()}
                </span>
              )}
              {estado && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${estado.cls}`}>
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${estado.punto}`} />
                  Proceso {estado.texto.toLowerCase()}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Estadistica emoji="📈" label="Avance de la ruta" valor={asignacion?.porcentaje ?? 0} sufijo="%" detalle={resumen ? `${resumen.completados} de ${resumen.cursos.length} cursos` : "Sin ruta"} indice={0} />
        <Estadistica emoji="⏱️" label="Horas completadas" valor={Math.round(horasHechas)} sufijo=" h" detalle={resumen ? `de ${formatoHoras(resumen.horasTotales)}` : ""} indice={1} />
        <Estadistica emoji="🔥" label="Racha actual" valor={espacio.racha} sufijo={espacio.racha === 1 ? " día" : " días"} detalle={`${espacio.diasSemana} días activos esta semana`} indice={2} />
        <Estadistica emoji="🏅" label="Logros" valor={logrados} sufijo={`/${espacio.logros.length}`} detalle={`${espacio.notas} notas personales`} indice={3} />
      </div>

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

      {/* Logros */}
      <section className={tarjeta}>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-luwi-profundo">Mis logros</h2>
            <p className="mt-0.5 text-xs text-luwi-texto/75">Medallas por tu avance y tus hábitos de estudio</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-luwi-cristal-fondo">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${(logrados / espacio.logros.length) * 100}%` }}
                transition={{ duration: 0.9 }}
              />
            </div>
            <span className="text-sm font-bold text-luwi-profundo">
              {logrados}/{espacio.logros.length}
            </span>
          </div>
        </div>
        <LogrosGrid logros={espacio.logros} />
      </section>

      {/* Preferencias */}
      <section className={tarjeta}>
        <h2 className="text-[15px] font-semibold text-luwi-profundo">Mis preferencias de estudio</h2>
        <p className="mt-0.5 text-xs text-luwi-texto/75">Se guardan en este dispositivo y ajustan tus estimaciones</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-luwi-panel/70 p-4 ring-1 ring-inset ring-luwi-linea/60">
            <p className="text-sm font-semibold text-luwi-profundo">⏰ Tiempo de estudio al día</p>
            <p className="mt-0.5 text-xs text-luwi-texto/75">
              {resumen ? `Con este ritmo terminarías el ${finEstimado(resumen.horasRestantes, espacio.ritmo)}.` : "Úsalo para calcular cuándo terminarías tu ruta."}
            </p>
            <div className="mt-3">
              <OpcionesChips etiqueta="Tiempo de estudio al día" opciones={OPCIONES_RITMO} valor={espacio.ritmo} onChange={espacio.setRitmo} />
            </div>
          </div>
          <div className="rounded-2xl bg-luwi-panel/70 p-4 ring-1 ring-inset ring-luwi-linea/60">
            <p className="text-sm font-semibold text-luwi-profundo">🎯 Meta semanal</p>
            <p className="mt-0.5 text-xs text-luwi-texto/75">
              Unidades que quieres revisar cada semana. Esta semana llevas {espacio.hechasSemana}.
            </p>
            <div className="mt-3">
              <OpcionesChips etiqueta="Meta semanal" opciones={OPCIONES_META.map((v) => ({ valor: v, label: `${v} unidades` }))} valor={espacio.meta} onChange={espacio.setMeta} />
            </div>
          </div>
        </div>
      </section>

      <p className="flex items-center gap-2 rounded-2xl bg-luwi-cristal-fondo px-5 py-3.5 text-sm text-luwi-profundo ring-1 ring-inset ring-luwi-cristal">
        <LockIcon className="h-4 w-4 shrink-0 text-luwi-medio" />
        Tus datos personales los administra Recursos Humanos. Si algo no es correcto, comunícate con ellos.
      </p>
    </div>
  );
}
