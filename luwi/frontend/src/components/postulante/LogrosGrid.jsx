import { motion, useReducedMotion } from "motion/react";

// Ícono de cada logro
const ICONOS = {
  inicio: "👣",
  curso: "📘",
  mitad: "⛰️",
  ruta: "🏆",
  racha: "🔥",
  semana: "📅",
  notas: "📝",
  meta: "🎯",
};

/**
 * Medallas de logros con su progreso.
 * - logros: resultado de calcularLogros().
 * - columnas: clases de la grilla (ej. "grid-cols-2 sm:grid-cols-4").
 * - compacto: oculta la descripción (para espacios pequeños).
 */
export default function LogrosGrid({ logros, columnas = "grid-cols-2 sm:grid-cols-4", compacto = false }) {
  const reducido = useReducedMotion();

  return (
    <ul className={`grid gap-3 ${columnas}`}>
      {logros.map((l, i) => (
        <motion.li
          key={l.id}
          initial={reducido ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          whileHover={reducido ? undefined : { y: -3 }}
          className={`group relative overflow-hidden rounded-2xl p-4 transition-shadow ${
            l.logrado
              ? "bg-gradient-to-br from-amber-50 via-white to-luwi-cristal-fondo ring-1 ring-amber-200/70 hover:shadow-[0_14px_30px_-18px_rgba(245,158,11,0.7)]"
              : "bg-luwi-panel/70 ring-1 ring-luwi-linea/60"
          }`}
        >
          {l.logrado && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-y-4 -left-16 w-10 rotate-12 bg-white/70 blur-md transition-transform duration-700 group-hover:translate-x-[260px]"
            />
          )}

          <div className="relative flex items-start justify-between gap-2">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-2xl text-[22px] ${
                l.logrado ? "bg-gradient-to-br from-amber-300 to-orange-400 shadow-[0_8px_16px_-8px_rgba(251,146,60,0.9)]" : "bg-white grayscale ring-1 ring-luwi-linea"
              }`}
            >
              <span className={l.logrado ? "" : "opacity-40"}>{ICONOS[l.id] ?? "⭐"}</span>
            </span>
            {l.logrado ? (
              <span className="rounded-full bg-luwi-antique px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-luwi-fawn-deep ring-1 ring-inset ring-luwi-fawn/45">
                Logrado
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-luwi-texto/60">
                {l.actual}/{l.meta}
                {l.unidad ?? ""}
              </span>
            )}
          </div>

          <p className={`relative mt-3 text-sm font-semibold ${l.logrado ? "text-luwi-profundo" : "text-luwi-texto/80"}`}>{l.titulo}</p>
          {!compacto && <p className="relative mt-0.5 text-[11.5px] leading-snug text-luwi-texto/70">{l.detalle}</p>}

          {!l.logrado && (
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-white ring-1 ring-inset ring-luwi-linea/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno"
                initial={reducido ? false : { width: 0 }}
                animate={{ width: `${l.progreso}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.04 }}
              />
            </div>
          )}
        </motion.li>
      ))}
    </ul>
  );
}
