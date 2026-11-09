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

export default function Navbar() {
  return (
    <header className="bg-[#F2FBF9]">
      <nav className="mx-auto flex max-w-screen-2xl items-center justify-between px-8 py-5">
        <a
          href="#inicio"
          onClick={(e) => irASeccion(e, "#inicio")}
          className="text-2xl font-extrabold"
        >
          <span className="text-teal-500">LU</span>
          <span className="text-purple-400">WI</span>
        </a>

        <ul className="flex items-center gap-10">
          {links.map((l) => (
            <li key={l.label} className="hidden md:block">
              <a
                href={l.href}
                onClick={(e) => irASeccion(e, l.href)}
                className="text-lg font-medium text-black hover:text-teal-600 transition-colors"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/login"
              className="rounded-full bg-purple-300 px-8 py-3 text-lg font-bold text-black hover:bg-purple-400 transition-colors"
            >
              Inicia sesión
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}