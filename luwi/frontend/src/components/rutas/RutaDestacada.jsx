import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Link } from "react-router-dom";
import CaminoSerpiente from "./CaminoSerpiente";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, BriefcaseIcon } from "../dashboard/icons";
import { formatoHoras, nivelDe } from "../../utils/rutas";

const INTERVALO = 7000;

/**
 * Carrusel oscuro con las rutas más completas, dibujadas como un camino animado.
 * - rutas: rutas normalizadas (rutasService.list).
 * - onAbrir(ruta): abre la vista rápida.
 */
export default function RutaDestacada({ rutas, onAbrir }) {
  const reducido = useReducedMotion();
  const [indice, setIndice] = useState(0);
  const [pausa, setPausa] = useState(false);
  const total = rutas.length;

  useEffect(() => {
    if (indice >= total) setIndice(0);
  }, [indice, total]);

  useEffect(() => {
    if (pausa || total < 2 || reducido) return undefined;
    const t = setTimeout(() => setIndice((i) => (i + 1) % total), INTERVALO);
    return () => clearTimeout(t);
  }, [indice, pausa, total, reducido]);

  if (total === 0) return null;
  const ruta = rutas[Math.min(indice, total - 1)];
  const ir = (paso) => setIndice((i) => (i + paso + total) % total);

  const niveles = ruta.cursos.reduce((acc, c) => {
    const n = nivelDe(c).label;
    acc[n] = (acc[n] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Rutas destacadas"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
      className="relative flex flex-col overflow-hidden rounded-[28px] bg-colonial-hero p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,20,76,0.8)] sm:p-7"
    >
      {/* Decoración */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-luwi-fawn/25 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-luwi-medio/30 blur-3xl" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:22px_22px]"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="w-full min-w-0 lg:w-auto lg:flex-1">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F0D4A4]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-luwi-fawn opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-luwi-fawn" />
            </span>
            Ruta destacada
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={ruta.id}
              initial={reducido ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducido ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <button
                type="button"
                onClick={() => onAbrir(ruta)}
                className="mt-2 block max-w-full truncate text-left text-2xl font-bold tracking-[-0.01em] transition hover:text-[#F8E6D2] focus:outline-none focus-visible:underline"
              >
                {ruta.nombre}
              </button>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/65">
                <span className="inline-flex items-center gap-1.5">
                  <BriefcaseIcon className="h-4 w-4" />
                  {[ruta.puestoTitulo, ruta.empresaNombre].filter(Boolean).join(" · ") || "Sin puesto"}
                </span>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-white/10">
            {ruta.cursos.length} {ruta.cursos.length === 1 ? "curso" : "cursos"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ring-white/10">
            <ClockIcon className="h-3.5 w-3.5" />
            {formatoHoras(ruta.duracionTotalHoras)}
          </span>
          {Object.entries(niveles).map(([n, cant]) => (
            <span key={n} className="hidden rounded-xl bg-white/5 px-3 py-1.5 text-xs text-white/70 ring-1 ring-inset ring-white/10 lg:inline">
              {cant} {n.toLowerCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-4 flex flex-1 items-center px-1 py-6">
        <CaminoSerpiente key={ruta.id} cursos={ruta.cursos} tamano="lg" tema="oscuro" viajero max={6} />
      </div>

      <div className="relative mt-1 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Elegir ruta destacada">
          {rutas.map((r, i) => (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={i === indice}
              aria-label={r.nombre}
              onClick={() => setIndice(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === indice ? "w-7 bg-luwi-tecno" : "w-1.5 bg-white/25 hover:bg-white/50"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => ir(-1)}
            disabled={total < 2}
            aria-label="Ruta anterior"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/10 transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ir(1)}
            disabled={total < 2}
            aria-label="Ruta siguiente"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/10 transition hover:bg-white/20 disabled:opacity-30"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <Link
            to={`/dashboard/rutas/${ruta.id}`}
            className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl bg-colonial-fawn px-4 text-sm font-bold text-luwi-profundo shadow-[0_10px_24px_-12px_rgba(15,20,76,0.5)] transition hover:-translate-y-0.5 hover:brightness-105"
          >
            Ver roadmap
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
