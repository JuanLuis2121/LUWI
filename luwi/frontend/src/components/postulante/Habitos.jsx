import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ANIMOS, OPCIONES_META, consejoDelDia } from "../../utils/espacioPostulante";

// Tarjetas interactivas del espacio del postulante (racha, meta, ánimo y consejo).
// Todo lo que guardan queda en este navegador; no se envía a la base de datos.

const tarjeta = "relative flex flex-col overflow-hidden rounded-3xl border border-white bg-white/90 p-5 shadow-[0_10px_30px_-18px_rgba(11,58,140,0.4)] sm:p-6";

function Encabezado({ titulo, subtitulo, icono }) {
  return (
    <header className="mb-4 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-lg">{icono}</span>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-luwi-profundo">{titulo}</h2>
        {subtitulo && <p className="mt-0.5 text-xs text-luwi-texto/75">{subtitulo}</p>}
      </div>
    </header>
  );
}

/** Botones de opción en forma de píldora. */
export function OpcionesChips({ opciones, valor, onChange, etiqueta, oscuro = false }) {
  return (
    <div role="radiogroup" aria-label={etiqueta} className={`inline-flex flex-wrap gap-1 rounded-xl p-1 ${oscuro ? "bg-white/10" : "bg-luwi-panel ring-1 ring-inset ring-luwi-linea/70"}`}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            onClick={() => onChange(o.valor)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/50 ${
              activo
                ? oscuro
                  ? "bg-white text-luwi-profundo shadow"
                  : "bg-white text-luwi-profundo shadow-sm ring-1 ring-luwi-linea"
                : oscuro
                ? "text-white/70 hover:text-white"
                : "text-luwi-texto/75 hover:text-luwi-profundo"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ---------- Racha ----------

export function RachaSemana({ racha, semana, diasSemana }) {
  const reducido = useReducedMotion();
  return (
    <section className={tarjeta}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-200/40 blur-2xl" />
      <Encabezado titulo="Tu racha" subtitulo="Días seguidos entrando a estudiar" icono="🔥" />

      <div className="relative flex items-end gap-3">
        <motion.span
          key={racha}
          initial={reducido ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 14 }}
          className="bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-5xl font-bold leading-none text-transparent"
        >
          {racha}
        </motion.span>
        <span className="pb-1 text-sm font-medium text-luwi-texto">{racha === 1 ? "día" : "días"}</span>
      </div>

      <ol className="relative mt-5 grid grid-cols-7 gap-1.5" aria-label="Actividad de esta semana">
        {semana.map((d, i) => (
          <li key={d.dia} className="flex flex-col items-center gap-1.5">
            <motion.span
              initial={reducido ? false : { scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 400, damping: 16 }}
              title={d.activo ? "Entraste este día" : d.futuro ? "Próximamente" : "Sin actividad"}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] ${
                d.activo
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_-6px_rgba(249,115,22,0.9)]"
                  : d.hoy
                  ? "border-2 border-dashed border-orange-300 bg-white text-luwi-texto"
                  : "bg-luwi-panel text-luwi-texto/40"
              }`}
            >
              {d.activo ? "🔥" : "·"}
            </motion.span>
            <span className={`text-[11px] font-semibold ${d.hoy ? "text-orange-500" : "text-luwi-texto/60"}`}>{d.letra}</span>
          </li>
        ))}
      </ol>

      <p className="mt-auto pt-4 text-xs text-luwi-texto/80">
        {diasSemana >= 5 ? "¡Semana perfecta en camino! 💪" : `Llevas ${diasSemana} de 7 días esta semana.`}
      </p>
    </section>
  );
}

// ---------- Meta semanal ----------

export function MetaSemanal({ meta, hechas, onMeta }) {
  const reducido = useReducedMotion();
  const pct = Math.min(100, Math.round((hechas / meta) * 100));
  const cumplida = hechas >= meta;
  const radio = 42;
  const circ = 2 * Math.PI * radio;

  return (
    <section className={tarjeta}>
      <Encabezado titulo="Meta de la semana" subtitulo="Unidades que quieres revisar" icono="🎯" />

      <div className="flex items-center gap-5">
        <div className="relative h-[104px] w-[104px] shrink-0">
          <svg viewBox="0 0 104 104" className="-rotate-90" aria-hidden="true">
            <circle cx="52" cy="52" r={radio} fill="none" stroke="#eaf3ff" strokeWidth="10" />
            <motion.circle
              cx="52"
              cy="52"
              r={radio}
              fill="none"
              stroke={cumplida ? "#10b981" : "url(#meta-g)"}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              initial={reducido ? false : { strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ - (circ * pct) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="meta-g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#0b5bd3" />
                <stop offset="100%" stopColor="#009cff" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none text-luwi-profundo">
              {hechas}
              <span className="text-sm font-semibold text-luwi-texto/60">/{meta}</span>
            </span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-luwi-texto/60">unidades</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-luwi-texto">
          {cumplida ? (
            <span className="font-semibold text-emerald-600">¡Meta cumplida! 🎉 Todo lo que sumes ahora es extra.</span>
          ) : (
            <>
              Te {meta - hechas === 1 ? "falta" : "faltan"} <strong className="font-semibold text-luwi-profundo">{meta - hechas}</strong>{" "}
              {meta - hechas === 1 ? "unidad" : "unidades"} para cumplir tu meta.
            </>
          )}
        </p>
      </div>

      <div className="mt-auto pt-5">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-luwi-texto/60">Cambiar meta</p>
        <OpcionesChips etiqueta="Meta semanal" opciones={OPCIONES_META.map((v) => ({ valor: v, label: `${v}` }))} valor={meta} onChange={onMeta} />
      </div>
    </section>
  );
}

// ---------- Ánimo del día ----------

export function CheckInAnimo({ animo, onAnimo }) {
  const reducido = useReducedMotion();
  const elegido = ANIMOS.find((a) => a.valor === animo);

  return (
    <section className={tarjeta}>
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-luwi-tecno/10 blur-2xl" />
      <Encabezado titulo="¿Cómo te sientes hoy?" subtitulo="Te damos una sugerencia según tu ánimo" icono="💬" />

      <div role="radiogroup" aria-label="Ánimo de hoy" className="relative grid grid-cols-5 gap-2">
        {ANIMOS.map((a) => {
          const activo = a.valor === animo;
          return (
            <motion.button
              key={a.valor}
              type="button"
              role="radio"
              aria-checked={activo}
              aria-label={a.label}
              title={a.label}
              onClick={() => onAnimo(a.valor)}
              whileHover={reducido ? undefined : { y: -4, scale: 1.08 }}
              whileTap={reducido ? undefined : { scale: 0.92 }}
              className={`flex aspect-square items-center justify-center rounded-2xl text-2xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/50 ${
                activo ? "bg-gradient-to-br from-luwi-cristal to-white ring-2 ring-luwi-tecno" : "bg-luwi-panel hover:bg-luwi-cristal-fondo"
              } ${animo && !activo ? "opacity-50 grayscale-[40%]" : ""}`}
            >
              {a.emoji}
            </motion.button>
          );
        })}
      </div>

      <div className="relative mt-auto min-h-[76px] pt-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={animo ?? "nada"}
            initial={reducido ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducido ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${elegido ? "bg-luwi-cristal-fondo text-luwi-profundo" : "bg-luwi-panel text-luwi-texto/75"}`}
          >
            {elegido ? (
              <>
                <strong className="font-semibold">{elegido.label}:</strong> {elegido.respuesta}
              </>
            ) : (
              "Elige una carita para recibir un consejo para hoy."
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ---------- Consejo del día ----------

export function ConsejoDelDia() {
  const reducido = useReducedMotion();
  const [desplazamiento, setDesplazamiento] = useState(0);
  const consejo = consejoDelDia(desplazamiento);

  return (
    <section className="relative flex flex-col overflow-hidden rounded-3xl bg-[linear-gradient(150deg,#0B5BD3_0%,#0B3A8C_60%,#061A45_100%)] p-6 text-white shadow-[0_20px_44px_-24px_rgba(6,26,69,0.85)]">
      <div aria-hidden="true" className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border-[22px] border-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 left-6 h-40 w-40 rounded-full bg-luwi-tecno/30 blur-3xl" />

      <p className="relative flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7cc8ff]">
        <span className="text-base">💡</span>
        Consejo del día
      </p>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={consejo.titulo}
          initial={reducido ? false : { opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={reducido ? undefined : { opacity: 0, x: -16 }}
          transition={{ duration: 0.25 }}
          className="relative mb-6"
        >
          <h3 className="mt-4 text-xl font-bold leading-snug">{consejo.titulo}</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{consejo.texto}</p>
        </motion.div>
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setDesplazamiento((d) => d + 1)}
        className="relative mt-auto inline-flex w-fit items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold ring-1 ring-inset ring-white/15 transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        Otro consejo
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />
        </svg>
      </button>
    </section>
  );
}
