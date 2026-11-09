// components/Footer.jsx
const accountLinks = [
  { label: "Inicia sesión", href: "/login" },
  { label: "Solicitar acceso", href: "/solicitar" },
];

const legalLinks = [
  { label: "Términos y condiciones", href: "#" },
  { label: "Política de privacidad", href: "#" },
  { label: "Cookies", href: "#" },
];

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

// Reemplaza los href por tus perfiles reales cuando los tengas
const socials = [
  {
    name: "Instagram",
    handle: "@luwi.rd",
    href: "#",
    icon: (
      <svg {...iconBase} className="h-5 w-5">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
  {
    name: "LinkedIn",
    handle: "LUWI",
    href: "#",
    icon: (
      <svg {...iconBase} className="h-5 w-5">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect width="4" height="12" x="2" y="9" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "LUWI RD",
    href: "#",
    icon: (
      <svg {...iconBase} className="h-5 w-5">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  {
    name: "X",
    handle: "@luwi_rd",
    href: "#",
    icon: (
      <svg {...iconBase} className="h-5 w-5">
        <path d="M4 4l11.7 16H20L8.3 4z" />
        <path d="M4 20l6.8-6.8M13.2 10.8L20 4" />
      </svg>
    ),
  },
  {
    name: "YouTube",
    handle: "LUWI Academy",
    href: "#",
    icon: (
      <svg {...iconBase} className="h-5 w-5">
        <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
        <path d="m10 15 5-3-5-3z" />
      </svg>
    ),
  },
];

const contactItems = [
  {
    label: "hola@luwi.com",
    href: "mailto:hola@luwi.com",
    icon: (
      <svg {...iconBase} className="h-5 w-5 shrink-0">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    label: "+1 (809) 555-0123",
    href: "tel:+18095550123",
    icon: (
      <svg {...iconBase} className="h-5 w-5 shrink-0">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    label: "Santo Domingo, República Dominicana",
    icon: (
      <svg {...iconBase} className="h-5 w-5 shrink-0">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
];

const linkClass =
  "text-base text-white/70 transition-colors hover:text-teal-400 focus-visible:text-teal-400 focus-visible:outline-none";

const headingClass =
  "text-sm font-bold uppercase tracking-widest text-purple-300";

// Desplazamiento suave a la sección (Inicio sube al tope de la página)
function irASeccion(e, href) {
  if (!href.startsWith("#") || href === "#") return;
  e.preventDefault();
  const reducirMovimiento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const behavior = reducirMovimiento ? "auto" : "smooth";

  if (href === "#inicio") {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  document.querySelector(href)?.scrollIntoView({ behavior });
}

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-8 py-16 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1.3fr]">
        {/* Marca y redes */}
        <div>
          <a
            href="#inicio"
            onClick={(e) => irASeccion(e, "#inicio")}
            className="text-3xl font-extrabold"
          >
            <span className="text-teal-500">LU</span>
            <span className="text-purple-300">WI</span>
          </a>
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-white/50">
            Learn · Upgrade · Work · Improve
          </p>
          <p className="mt-5 max-w-xs text-base leading-relaxed text-white/70">
            Preparamos a los candidatos antes de que lleguen al puesto, con
            rutas de aprendizaje personalizadas para cada empresa.
          </p>

          <ul className="mt-6 flex flex-wrap gap-3" aria-label="Redes sociales">
            {socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${s.name} de LUWI (${s.handle})`}
                  title={`${s.name} · ${s.handle}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:border-teal-500 hover:bg-teal-500 hover:text-black focus-visible:border-teal-500 focus-visible:bg-teal-500 focus-visible:text-black focus-visible:outline-none"
                >
                  {s.icon}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Cuenta */}
        <div>
          <h2 className={headingClass}>Tu cuenta</h2>
          <ul className="mt-5 space-y-3">
            {accountLinks.map((l) => (
              <li key={l.label}>
                <a href={l.href} className={linkClass}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="/solicitar"
            className="mt-8 inline-block rounded-full bg-purple-300 px-7 py-3 text-base font-bold text-black transition-colors hover:bg-purple-400"
          >
            Inicia hoy
          </a>
        </div>

        {/* Contacto */}
        <div>
          <h2 className={headingClass}>Contacto</h2>
          <ul className="mt-5 space-y-4">
            {contactItems.map((c) => (
              <li key={c.label} className="flex items-start gap-3 text-white/70">
                <span className="mt-0.5 text-teal-500">{c.icon}</span>
                {c.href ? (
                  <a href={c.href} className={linkClass}>
                    {c.label}
                  </a>
                ) : (
                  <span className="text-base">{c.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Barra inferior */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-8 py-6 text-sm text-white/50 md:flex-row">
          <p>© {new Date().getFullYear()} LUWI. Todos los derechos reservados.</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {legalLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="transition-colors hover:text-teal-400 focus-visible:text-teal-400 focus-visible:outline-none"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}