import Logo from "../components/Logo";

/**
 * Estructura de las pantallas de acceso (login y registro).
 * - Escritorio: tarjeta de cristal con panel ilustrado (izquierda) y formulario (derecha).
 * - Celular: solo el formulario, con el logo arriba.
 */
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-luwi-cristal-fondo px-4 py-8 font-poppins sm:px-6">
      {/* Círculos del fondo de la página */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 h-[480px] w-[480px] rounded-full bg-luwi-cristal opacity-80 blur-2xl" />
        <div className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-[#BBD7FF] opacity-60 blur-xl" />
        <div className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-luwi-cristal opacity-90 blur-2xl" />
        <div className="absolute -bottom-40 left-[12%] h-[340px] w-[340px] rounded-full bg-[#C9DFFF] opacity-50 blur-2xl" />
      </div>

      {/* Tarjeta principal */}
      <section className="relative grid w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-white/60 shadow-[0_30px_80px_-20px_rgba(11,58,140,0.25)] backdrop-blur-xl lg:min-h-[620px] lg:max-w-[1040px] lg:grid-cols-[1.1fr_1fr]">

        {/* ===== Panel izquierdo (solo escritorio) ===== */}
        <div className="relative hidden overflow-hidden bg-[linear-gradient(180deg,#EEF5FF_0%,#D3E7FF_38%,#A9D5FD_64%,#A9D5FD_100%)] px-12 pt-11 lg:block">
          {/* Formas suaves */}
          <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-28 h-[420px] w-[420px] rounded-full bg-white/50" />

          {/* Ondas azules de la esquina inferior izquierda */}
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-[200px] -left-[170px] z-[1] h-[340px] w-[360px] rounded-[50%] bg-gradient-to-tr from-luwi-medio to-[#3D8BFF] opacity-80" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-[230px] -left-[140px] z-[1] h-[320px] w-[300px] rounded-[50%] bg-luwi-profundo" />

          {/* Logo y textos */}
          <div className="relative z-10">
            <Logo size="lg" />

            <h2 className="mt-10 max-w-[360px] text-[34px] font-semibold leading-[1.18] tracking-[-0.02em] text-luwi-profundo">
              Tu camino de
              <span className="block font-bold text-luwi-tecno">aprendizaje,</span>
              en un solo lugar.
            </h2>

            <p className="mt-4 max-w-[290px] text-[15px] leading-relaxed text-luwi-texto">
              Conecta, aprende y sigue tu progreso con LUWI.
            </p>
          </div>

          {/* Ilustración (su fondo coincide con el azul inferior del panel) */}
          <img
            src="/LUWI-login-illustration.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 right-0 z-0 w-[82%] max-w-[470px] [mask-image:radial-gradient(ellipse_70%_72%_at_55%_55%,black_62%,transparent_100%)]"
          />
        </div>

        {/* ===== Panel derecho: formulario ===== */}
        <div className="relative z-10 flex flex-col justify-center bg-[#F4F8FF] px-7 py-10 sm:px-12 lg:py-12">
          {/* Curva que separa los dos paneles (solo escritorio) */}
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

          {/* Brillo de la esquina superior derecha */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/80 blur-2xl" />

          <div className="relative mx-auto w-full max-w-[360px]">
            {/* Logo solo en celular */}
            <Logo size="md" className="mb-8 lg:hidden" />

            <header className="mb-7">
              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-luwi-profundo">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-2 text-[14px] leading-relaxed text-luwi-texto">
                  {subtitle}
                </p>
              )}
            </header>

            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
