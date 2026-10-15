// components/ComoFunciona.jsx
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "h-8 w-8",
  "aria-hidden": true,
};

const steps = [
  {
    title: "Registra el puesto y sus competencias",
    text: "La empresa crea el puesto y define las habilidades y conocimientos que necesita.",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
  },
  {
    title: "Vincula al candidato",
    text: "Cada candidato se asocia al puesto para el que se va a preparar.",
    icon: (
      <svg {...iconProps}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M22 11h-6" />
      </svg>
    ),
  },
  {
    title: "Completa su perfil y evaluación inicial",
    text: "El candidato llena su perfil y realiza una evaluación para conocer su nivel de partida.",
    icon: (
      <svg {...iconProps}>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Detecta brechas y recibe recomendaciones",
    text: "El sistema compara sus competencias con las del puesto y, con apoyo de IA, recomienda una ruta de capacitación.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: "Se forma y consulta resultados",
    text: "El candidato completa su formación y la empresa revisa su progreso en el panel de seguimiento.",
    icon: (
      <svg {...iconProps}>
        <path d="M3 3v18h18" />
        <path d="M7 16v-5M12 16V8M17 16v-8" />
      </svg>
    ),
  },
];

export default function ComoFunciona() {
  return (
    <section
      id="como-funciona"
      className="bg-[#DBB4FD] px-4 py-20 sm:px-8"
      aria-labelledby="como-funciona-titulo"
    >
      <div className="mx-auto max-w-6xl">
        <h2
          id="como-funciona-titulo"
          className="text-center text-4xl font-black tracking-tight text-black sm:text-6xl"
        >
          Cómo{" "}
          <span className="relative isolate ml-1 inline-block px-4 text-black">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 -z-10 h-full w-full"
              aria-hidden="true"
            >
              <polygon
                points="0,10 2,3 100,0 98,86 100,96 3,100 1,90"
                fill="#00B9A9"
              />
            </svg>
            funciona
          </span>
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-black/75">
          Del registro del puesto a la formación del candidato, en cinco pasos.
        </p>

        <ol className="mt-14 flex flex-wrap justify-center gap-6">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex w-full flex-col items-center rounded-3xl bg-white px-8 py-10 text-center shadow-[0_8px_24px_-8px_rgba(60,20,110,0.25)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#00B9A9] text-black">
                {step.icon}
              </span>
              <span className="mt-6 text-sm font-bold uppercase tracking-widest text-black/50">
                Paso {i + 1}
              </span>
              <h3 className="mt-2 text-xl font-extrabold leading-snug tracking-tight text-black sm:text-2xl">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-black/70">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}