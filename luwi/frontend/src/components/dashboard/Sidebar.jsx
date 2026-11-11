import { NavLink, useLocation } from "react-router-dom";
import AnimatedBackground from "../core/AnimatedBackground";
import Logo from "../Logo";
import {
  HomeIcon, BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, LogoutIcon, CloseIcon,
} from "./icons";

// Para agregar una sección nueva basta con añadir un objeto aquí.
export const MENU_ITEMS = [
  { to: "/dashboard", label: "Inicio", icon: HomeIcon, end: true },
  { to: "/dashboard/empresas", label: "Empresas", icon: BuildingIcon },
  { to: "/dashboard/puestos", label: "Puestos", icon: BriefcaseIcon },
  { to: "/dashboard/cursos", label: "Cursos", icon: BookIcon },
  { to: "/dashboard/rutas", label: "Rutas de aprendizaje", icon: RouteIcon },
];

// El fondo animado lo pone <AnimatedBackground>; aquí solo el color del texto.
const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-blue/40 ${
    isActive ? "text-luwi-blue" : "text-luwi-ink hover:text-luwi-blue"
  }`;

/**
 * Menú lateral. En escritorio es fijo; en celular se muestra como
 * panel deslizable controlado por `open` / `onClose`.
 */
export default function Sidebar({ open, onClose, onLogout }) {
  const { pathname } = useLocation();
  const current = MENU_ITEMS.find(({ to, end }) => (end ? pathname === to : pathname.startsWith(to)))?.to;

  return (
    <>
      {/* Fondo oscuro (solo celular) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-luwi-navy/40 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Menú principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-luwi-border bg-white px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between lg:justify-center">
          <Logo />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-luwi-muted hover:bg-luwi-bg lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <AnimatedBackground
            value={current}
            enableHover
            className="rounded-xl bg-luwi-blue/10"
            transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
          >
            {MENU_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} data-id={to} to={to} end={end} onClick={onClose} className={linkClass}>
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </AnimatedBackground>
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex items-center gap-3 rounded-xl border border-luwi-border px-4 py-3 text-sm font-medium text-luwi-muted transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          Cerrar sesión
        </button>
      </aside>
    </>
  );
}
