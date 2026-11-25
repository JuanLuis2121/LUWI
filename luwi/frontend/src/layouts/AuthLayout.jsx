import { motion, useReducedMotion } from "motion/react";
import Logo, { LuwiIsotipo } from "../components/Logo";

const trazo = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const RutaIcon = (p) => (
  <svg {...trazo} {...p}><circle cx="6" cy="19" r="2" /><circle cx="18" cy="5" r="2" /><path d="M8 19h7a3 3 0 000-6H9a3 3 0 010-6h7" /></svg>
);
const ChispaIcon = (p) => (
  <svg {...trazo} {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" /></svg>
);

function TarjetaFlotante({ className = "", retraso = "0s", children }) {
  return (
    <div
      aria-hidden="true"
      style={{ animationDelay: retraso }}
      className={`pointer-events-none absolute hidden rounded-2xl border border-luwi-linea bg-white/85 p-3.5 shadow-[0_18px_40px_-20px_rgba(17,22,82,0.3)] backdrop-blur-xl animate-[flotar_7s_ease-in-out_infinite] motion-reduce:animate-none min-[1720px]:[@media(min-height:820px)]:block ${className}`}
    >
      {children}
    </div>
  );
}

function Fondo() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-40 -top-48 h-[600px] w-[600px] rounded-full bg-luwi-medio/15 blur-3xl" />
      <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-luwi-fawn/30 blur-3xl" />
      <div className="absolute -bottom-56 -right-40 h-[620px] w-[620px] rounded-full bg-luwi-fawn/35 blur-3xl" />
      <div className="absolute -bottom-48 -left-24 h-[480px] w-[480px] rounded-full bg-luwi-antique opacity-80 blur-3xl" />

      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(17,22,82,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(17,22,82,0.045) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 30%, transparent 85%)",
        }}
      />
    </div>
  );
}

/**
 * Estructura de las pantallas de acceso (login y registro) con identidad LUWI 2.0 Colonial Cobalt.
 */
export default function AuthLayout({ title, subtitle, footer, children }) {
  const reducido = useReducedMotion();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-colonial-auth px-4 py-8 font-poppins sm:px-6">
      <Fondo />

      <TarjetaFlotante className="left-[4%] top-[16%] w-[264px]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-colonial-btn text-white">
            <RutaIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-luwi-profundo">Rutas personalizadas</p>
            <p className="text-xs text-luwi-texto">Según el puesto al que aplicas</p>
          </div>
        </div>
      </TarjetaFlotante>

      <TarjetaFlotante className="right-[4%] top-[20%] w-[264px]" retraso="-3.5s">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-luwi-antique text-luwi-fawn-deep">
            <ChispaIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-luwi-profundo">Formación con IA</p>
            <p className="text-xs text-luwi-texto">Detecta brechas y sugiere cursos</p>
          </div>
        </div>
      </TarjetaFlotante>

      <div className="relative w-full max-w-md lg:max-w-[1040px]">
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[44px] bg-gradient-to-br from-luwi-medio/15 via-white/40 to-luwi-fawn/30 opacity-85 blur-2xl" />

        <section className="relative grid w-full overflow-hidden rounded-[28px] border border-luwi-linea bg-white shadow-[0_36px_80px_-28px_rgba(15,20,76,0.34)] lg:min-h-[620px] lg:grid-cols-[1.02fr_1fr]">
          {/* ===== Panel izquierdo: Colonial Cobalt -> Soft Fawn ===== */}
          <div className="relative hidden flex-col justify-between overflow-hidden bg-colonial-hero px-11 py-10 text-white lg:flex">
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-12 h-[380px] w-[380px] rounded-full bg-luwi-tecno/30 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-[320px] w-[320px] rounded-full bg-luwi-fawn/35 blur-3xl" />

            <div className="relative z-10">
              <Logo size="md" variant="light" />

              <h2 className="mt-9 max-w-[360px] text-[34px] font-extrabold leading-[1.15] tracking-[-0.025em] text-white">
                Tu camino de
                <span className="block text-[#F0D4A4]">aprendizaje,</span>
                en un solo lugar.
              </h2>

              <p className="mt-3.5 max-w-[330px] text-[14.5px] leading-relaxed text-luwi-antique/85">
                Conecta, aprende y sigue tu progreso con LUWI.
              </p>
            </div>

            {/* Hero animado con isotipo LUWI + tarjeta de progreso flotante */}
            <div className="relative z-10 mt-8">
              <div className="relative flex h-[212px] w-[312px] items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/[0.12] via-[#1B2385]/45 to-[#D1B17C]/20 shadow-[0_24px_48px_-18px_rgba(12,16,72,0.65)] backdrop-blur-md">
                {/* Halo y anillos orbitales */}
                <motion.div
                  aria-hidden="true"
                  animate={reducido ? undefined : { scale: [1, 1.12, 1], opacity: [0.45, 0.7, 0.45] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(209,177,124,0.38)_0%,rgba(59,69,201,0.22)_52%,transparent_74%)] blur-xl"
                />
                <motion.div
                  aria-hidden="true"
                  animate={reducido ? undefined : { rotate: 360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                  className="pointer-events-none absolute h-[176px] w-[176px] rounded-full border border-dashed border-white/20"
                >
                  <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-[#F8E6D2] shadow-[0_0_10px_2px_rgba(248,230,210,0.85)]" />
                </motion.div>
                <motion.div
                  aria-hidden="true"
                  animate={reducido ? undefined : { rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="pointer-events-none absolute h-[126px] w-[126px] rounded-full border border-[#D1B17C]/30"
                >
                  <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[#D1B17C]" />
                </motion.div>

                {/* Etiquetas sutiles del ecosistema */}
                <motion.span
                  aria-hidden="true"
                  animate={reducido ? undefined : { y: [0, -4, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute left-3.5 top-3.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-luwi-antique backdrop-blur-md"
                >
                  Learn · Upgrade
                </motion.span>
                <motion.span
                  aria-hidden="true"
                  animate={reducido ? undefined : { y: [0, 4, 0] }}
                  transition={{ duration: 5, delay: 0.6, repeat: Infinity, ease: "easeInOut" }}
                  className="pointer-events-none absolute bottom-10 left-3.5 rounded-full border border-[#D1B17C]/35 bg-[#D1B17C]/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-[#F8E6D2] backdrop-blur-md"
                >
                  Work · Improve
                </motion.span>

                {/* Isotipo central con levitación suave */}
                <motion.div
                  initial={reducido ? false : { opacity: 0, scale: 0.9 }}
                  animate={reducido ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -7, 0] }}
                  transition={{
                    y: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
                    default: { duration: 0.55, ease: "easeOut" },
                  }}
                  className="relative flex h-[96px] w-[112px] items-center justify-center rounded-[24px] border border-white/25 bg-white/[0.12] shadow-[0_18px_36px_-14px_rgba(10,14,68,0.65)] backdrop-blur-xl"
                >
                  <LuwiIsotipo className="h-[64px] w-[78px] drop-shadow-[0_10px_20px_rgba(12,16,80,0.45)]" />
                </motion.div>
              </div>

              <motion.div
                initial={reducido ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="absolute -bottom-3 right-0 w-[236px] rounded-2xl border border-luwi-linea/80 bg-white p-4 text-luwi-profundo shadow-[0_20px_40px_-14px_rgba(15,20,76,0.35)]"
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Tu ruta activa</span>
                  <span className="text-luwi-medio">78%</span>
                </div>
                <p className="mt-1 text-xs text-luwi-texto">Formación personalizada</p>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-luwi-antique">
                  <motion.div
                    initial={reducido ? { width: "78%" } : { width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-colonial-progress"
                  />
                </div>
                <p className="mt-2 text-[11px] text-luwi-muted">Avance sincronizado con RR. HH.</p>
              </motion.div>
            </div>
          </div>

          {/* ===== Panel derecho: formulario limpio ===== */}
          <div className="relative z-10 flex flex-col justify-center bg-white px-7 py-10 sm:px-12 lg:py-12">
            <div className="relative mx-auto w-full max-w-[360px]">
              <Logo size="md" className="mb-8 lg:hidden" />

              <header className="mb-6">
                <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.025em] text-luwi-profundo">{title}</h1>
                {subtitle && <p className="mt-2 text-[14px] leading-relaxed text-luwi-texto">{subtitle}</p>}
              </header>

              {children}

              {footer && (
                <p className="mt-5 border-t border-luwi-linea pt-4 text-center text-[13.5px] text-luwi-texto">{footer}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      <p className="relative mt-6 text-center text-xs font-medium text-luwi-texto/80">
        © {new Date().getFullYear()} LUWI · Learn · Upgrade · Work · Improve
      </p>
    </main>
  );
}
