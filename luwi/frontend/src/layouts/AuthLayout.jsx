import Logo from "../components/Logo";

// ---------- Íconos pequeños de las tarjetas flotantes ----------

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
const CheckIcon = (p) => (
  <svg {...trazo} {...p}><path d="M5 12l5 5L20 7" /></svg>
);

/** Tarjeta de cristal que flota alrededor del login (solo pantallas muy anchas). */
function TarjetaFlotante({ className = "", retraso = "0s", children }) {
  return (
    <div
      aria-hidden="true"
      style={{ animationDelay: retraso }}
      className={`pointer-events-none absolute hidden rounded-2xl border border-white/80 bg-white/60 p-3.5 shadow-[0_18px_40px_-20px_rgba(11,58,140,0.45)] backdrop-blur-xl animate-[flotar_7s_ease-in-out_infinite] motion-reduce:animate-none min-[1720px]:[@media(min-height:820px)]:block ${className}`}
    >
      {children}
    </div>
  );
}

// ---------- Fondo de la página ----------

function Fondo() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Malla de color */}
      <div className="absolute -left-40 -top-48 h-[620px] w-[620px] rounded-full bg-[#CFE4FF] opacity-80 blur-3xl" />
      <div className="absolute -right-32 -top-40 h-[520px] w-[520px] rounded-full bg-luwi-tecno/25 blur-3xl" />
      <div className="absolute -bottom-56 -right-40 h-[640px] w-[640px] rounded-full bg-luwi-medio/20 blur-3xl" />
      <div className="absolute -bottom-48 -left-24 h-[480px] w-[480px] rounded-full bg-[#BBD7FF] opacity-70 blur-3xl" />
      <div className="absolute left-1/2 top-1/2 h-[560px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 blur-3xl" />

      {/* Cuadrícula fina que se desvanece hacia los bordes */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(11,58,140,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(11,58,140,0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 75% 70% at 50% 50%, black 30%, transparent 85%)",
        }}
      />

      {/* Anillos concéntricos en las esquinas */}
      <svg viewBox="0 0 600 600" className="absolute -right-48 -top-48 h-[600px] w-[600px] text-luwi-tecno opacity-[0.18]">
        {[120, 180, 240, 300].map((r) => (
          <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray={r === 240 ? "4 8" : undefined} />
        ))}
      </svg>
      <svg viewBox="0 0 600 600" className="absolute -bottom-56 -left-56 h-[600px] w-[600px] text-luwi-medio opacity-[0.14]">
        {[140, 200, 260].map((r) => (
          <circle key={r} cx="300" cy="300" r={r} fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray={r === 200 ? "4 8" : undefined} />
        ))}
      </svg>

      {/* Curva con flecha, inspirada en el isotipo de LUWI */}
      <svg viewBox="0 0 400 220" className="absolute bottom-[8%] right-[3%] hidden w-[360px] opacity-[0.22] xl:block">
        <defs>
          <linearGradient id="auth-curva" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#0b5bd3" stopOpacity="0" />
            <stop offset="100%" stopColor="#009cff" />
          </linearGradient>
        </defs>
        <path d="M10 200 C120 200 150 90 230 110 C300 128 320 60 370 30" fill="none" stroke="url(#auth-curva)" strokeWidth="6" strokeLinecap="round" />
        <path d="M350 22 L380 24 L372 52" fill="none" stroke="#009cff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Puntos de luz */}
      <span className="absolute left-[14%] top-[22%] h-2 w-2 rounded-full bg-luwi-tecno shadow-[0_0_12px_4px_rgba(0,156,255,0.45)]" />
      <span className="absolute right-[18%] top-[12%] h-1.5 w-1.5 rounded-full bg-luwi-medio shadow-[0_0_10px_3px_rgba(11,91,211,0.4)]" />
      <span className="absolute bottom-[18%] left-[9%] h-1.5 w-1.5 rounded-full bg-luwi-tecno shadow-[0_0_10px_3px_rgba(0,156,255,0.4)]" />
      <span className="absolute bottom-[10%] right-[30%] h-2 w-2 rounded-full bg-white shadow-[0_0_12px_4px_rgba(255,255,255,0.9)]" />
    </div>
  );
}

/**
 * Estructura de las pantallas de acceso (login y registro).
 * - Escritorio: tarjeta de cristal con panel ilustrado (izquierda) y formulario (derecha).
 * - Celular: solo el formulario, con el logo arriba.
 * - footer: texto opcional al pie del formulario (ej. "¿No tienes cuenta? Regístrate").
 */
export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F4F8FF] px-4 py-8 font-poppins sm:px-6">
      <Fondo />

      {/* Tarjetas flotantes alrededor del login */}
      <TarjetaFlotante className="left-[4%] top-[16%] w-[270px]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white">
            <RutaIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-luwi-profundo">Rutas personalizadas</p>
            <p className="text-xs text-luwi-texto">Según el puesto al que aplicas</p>
          </div>
        </div>
      </TarjetaFlotante>

      <TarjetaFlotante className="bottom-[14%] left-[6%] w-[250px]" retraso="-2.5s">
        <p className="text-xs font-semibold text-luwi-profundo">Tu progreso</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-luwi-cristal">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-luwi-medio to-luwi-tecno" />
          </div>
          <CheckIcon className="h-4 w-4 text-emerald-500" />
        </div>
        <div className="mt-3 flex gap-1.5">
          {["Learn", "Upgrade", "Work", "Improve"].map((p, i) => (
            <span
              key={p}
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${i < 3 ? "bg-luwi-cristal text-luwi-medio" : "bg-white text-luwi-texto/60 ring-1 ring-luwi-linea"}`}
            >
              {p}
            </span>
          ))}
        </div>
      </TarjetaFlotante>

      <TarjetaFlotante className="right-[4%] top-[20%] w-[270px]" retraso="-4s">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-luwi-tecno ring-1 ring-luwi-cristal">
            <ChispaIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-luwi-profundo">Formación con IA</p>
            <p className="text-xs text-luwi-texto">Detecta lo que te falta aprender</p>
          </div>
        </div>
      </TarjetaFlotante>

      {/* Tarjeta principal */}
      <div className="relative w-full max-w-md lg:max-w-[960px]">
        {/* Halo de luz detrás de la tarjeta */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-6 rounded-[44px] bg-gradient-to-br from-white via-luwi-tecno/15 to-luwi-medio/20 opacity-80 blur-2xl" />

        <section className="relative grid w-full overflow-hidden rounded-[32px] border border-white/90 bg-white/60 shadow-[0_40px_90px_-30px_rgba(11,58,140,0.4)] ring-1 ring-luwi-tecno/5 backdrop-blur-xl lg:min-h-[560px] lg:grid-cols-[1.05fr_1fr]">

          {/* ===== Panel izquierdo (solo escritorio) ===== */}
          <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#EEF5FF_0%,#D3E7FF_38%,#A9D5FD_64%,#A9D5FD_100%)] px-11 pt-10 lg:block">
            <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-white/50" />

            {/* Ondas azules de la esquina inferior izquierda */}
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-[200px] -left-[170px] z-[1] h-[340px] w-[360px] rounded-[50%] bg-gradient-to-tr from-luwi-medio to-[#3D8BFF] opacity-80" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-[230px] -left-[140px] z-[1] h-[320px] w-[300px] rounded-[50%] bg-luwi-profundo" />

            <div className="relative z-10">
              <Logo size="md" />

              <h2 className="mt-8 max-w-[340px] text-[30px] font-semibold leading-[1.18] tracking-[-0.02em] text-luwi-profundo">
                Tu camino de
                <span className="block font-bold text-luwi-tecno">aprendizaje,</span>
                en un solo lugar.
              </h2>

              <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-luwi-texto">
                Conecta, aprende y sigue tu progreso con LUWI.
              </p>
            </div>

            <img
              src="/LUWI-login-illustration.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-2 right-0 z-0 w-[80%] max-w-[420px] [mask-image:radial-gradient(ellipse_70%_72%_at_55%_55%,black_62%,transparent_100%)]"
            />
          </div>

          {/* ===== Panel derecho: formulario ===== */}
          <div className="relative z-10 flex flex-col justify-center bg-[#F4F8FF] px-7 py-9 sm:px-11 lg:py-10">
            <svg
              aria-hidden="true"
              viewBox="0 0 100 640"
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-y-0 right-full hidden h-full w-[90px] lg:block"
            >
              <path
                d="M100 0 H62 C18 70 78 150 46 250 C18 340 82 420 52 520 C38 570 52 610 70 640 H100 Z"
                className="fill-[#F4F8FF]"
              />
            </svg>

            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/80 blur-2xl" />

            <div className="relative mx-auto w-full max-w-[340px]">
              <Logo size="md" className="mb-8 lg:hidden" />

              <header className="mb-6">
                <h1 className="text-[26px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">{title}</h1>
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

      {/* Pie de página */}
      <p className="relative mt-6 text-center text-xs text-luwi-texto/70">
        © {new Date().getFullYear()} LUWI · Learn · Upgrade · Work · Improve
      </p>
    </main>
  );
}
