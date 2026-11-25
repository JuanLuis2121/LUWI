// components/Navbar.jsx
const links = [
  { label: "Inicio", href: "#inicio" },
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Acerca de nosotros", href: "#nosotros" },
];

// Desplazamiento suave a la sección (Inicio sube al tope de la página)
function irASeccion(e, href) {
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

// Fondo transparente: en la landing se ve el panel azul del hero detrás
export default function Navbar() {
  return (
    <header className="relative z-30">
      <nav className="mx-auto flex max-w-screen-2xl items-center px-8 py-5 md:px-16">
        <a
          href="#inicio"
          onClick={(e) => irASeccion(e, "#inicio")}
          className="text-2xl font-extrabold"
        >
          <span className="text-azul">LU</span>
          <span className="text-marino">WI</span>
        </a>

        <ul className="ml-12 hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={(e) => irASeccion(e, l.href)}
                className="font-medium text-marino transition-colors hover:text-azul"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <a
          href="/login"
          className="ml-auto rounded-full bg-amarillo px-7 py-2.5 font-bold text-marino transition-colors hover:bg-amarillo-claro"
        >
          Inicia sesión
        </a>
      </nav>
    </header>
  );
}
