import { Link, NavLink, useLocation } from "react-router-dom";
import AnimatedBackground from "../core/AnimatedBackground";
import Logo from "../Logo";
import useAuth from "../../hooks/useAuth";
import {
  HomeIcon, BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, LogoutIcon, CloseIcon, CheckCircleIcon,
} from "./icons";
import { UsersIcon } from "../pipeline/Piezas";

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

// Menú principal administrativo (incluye Evaluaciones y Recomendaciones IA de la entrega 5).
export const MENU_ITEMS = [
  { to: "/dashboard", label: "Inicio", icon: HomeIcon, end: true, grupo: "General" },
  { to: "/dashboard/empresas", label: "Empresas", icon: BuildingIcon, grupo: "Organización" },
  { to: "/dashboard/puestos", label: "Puestos", icon: BriefcaseIcon, grupo: "Organización" },
  { to: "/dashboard/postulantes", label: "Postulantes", icon: UsersIcon, grupo: "Talento" },
  { to: "/dashboard/recomendaciones-ia", label: "Recomendaciones IA", icon: SparkIcon, grupo: "Talento" },
  { to: "/dashboard/cursos", label: "Cursos", icon: BookIcon, grupo: "Formación" },
  { to: "/dashboard/evaluaciones", label: "Evaluaciones", icon: CheckCircleIcon, grupo: "Formación" },
  { to: "/dashboard/rutas", label: "Rutas de aprendizaje", icon: RouteIcon, grupo: "Formación" },
];

export const NOMBRE_ROL = {
  admin: "Administrador",
  empresa: "Empresa",
  rrhh: "Recursos Humanos",
  postulante: "Postulante",
};

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-fawn/60 ${
    isActive ? "font-semibold text-white" : "font-medium text-luwi-antique/70 hover:text-white"
  }`;

function agrupar(items) {
  const grupos = [];
  for (const item of items) {
    const nombre = item.grupo ?? "";
    let g = grupos.find((x) => x.nombre === nombre);
    if (!g) grupos.push((g = { nombre, items: [] }));
    g.items.push(item);
  }
  return grupos;
}

export default function Sidebar({ open, onClose, onLogout, items = MENU_ITEMS, mostrarIA = false }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const current = items.find(({ to, end }) => (end ? pathname === to : pathname.startsWith(to)))?.to;

  const nombre = user?.nombre || "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-luwi-noche/50 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Menú principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden bg-colonial-sidebar px-4 pb-4 pt-6 font-poppins transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decoración atmosférica Colonial Cobalt + Soft Fawn */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-luwi-tecno/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-luwi-fawn/18 blur-3xl" />
        <svg aria-hidden="true" viewBox="0 0 264 200" className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-[0.06]">
          <path d="M0 120 C60 80 120 160 264 90 V200 H0Z" fill="#F8E6D2" />
          <path d="M0 160 C80 120 150 190 264 140 V200 H0Z" fill="#D1B17C" />
        </svg>

        <div className="relative mb-6 flex items-center justify-between px-1.5">
          <Logo size="sm" variant="light" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <nav className="relative -mr-2 flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {agrupar(items).map((grupo) => (
            <div key={grupo.nombre || "menu"}>
              {grupo.nombre && (
                <p className="mb-2 px-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-luwi-fawn/75">
                  {grupo.nombre}
                </p>
              )}
              <div className="flex flex-col gap-1">
                <AnimatedBackground
                  value={current}
                  enableHover
                  className="rounded-xl bg-[linear-gradient(100deg,rgba(34,43,184,0.85)_0%,rgba(56,66,196,0.75)_72%,rgba(209,177,124,0.45)_100%)] ring-1 ring-luwi-fawn/30"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                >
                  {grupo.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} data-id={to} to={to} end={end} onClick={onClose} className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                              isActive
                                ? "bg-white/15 text-luwi-antique shadow-[0_6px_16px_-4px_rgba(15,20,76,0.5)]"
                                : "text-luwi-antique/60 group-hover:text-white"
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          <span className="truncate">{label}</span>
                          {isActive && (
                            <span
                              aria-hidden="true"
                              className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-luwi-fawn shadow-[0_0_8px_2px_rgba(209,177,124,0.65)]"
                            />
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
                </AnimatedBackground>
              </div>
            </div>
          ))}
        </nav>

        {/* Acceso rápido al módulo de Recomendaciones de IA */}
        {mostrarIA && (
          <Link
            to="/dashboard/recomendaciones-ia"
            onClick={onClose}
            className="group relative mb-3 mt-4 block overflow-hidden rounded-2xl border border-luwi-fawn/25 bg-luwi-antique/[0.07] p-4 transition hover:border-luwi-fawn/50 hover:bg-luwi-antique/[0.11] [@media(max-height:920px)]:hidden"
          >
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-luwi-fawn/25 blur-2xl" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-colonial-fawn text-luwi-profundo shadow-sm">
              <SparkIcon className="h-5 w-5" />
            </span>
            <p className="relative mt-3 text-sm font-semibold text-white">Recomendaciones IA</p>
            <p className="relative mt-1 text-xs leading-relaxed text-luwi-antique/70">
              Sugiere cursos del catálogo según brechas del puesto.
            </p>
            <span className="relative mt-3 inline-flex items-center gap-1 rounded-full bg-luwi-fawn/20 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wider text-luwi-antique transition group-hover:bg-luwi-fawn/30">
              Abrir módulo →
            </span>
          </Link>
        )}

        {/* Usuario + cerrar sesión */}
        <div className="relative mt-3 flex items-center gap-3 rounded-2xl bg-luwi-antique/[0.08] p-2.5 ring-1 ring-luwi-fawn/25">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-colonial-fawn text-sm font-extrabold text-luwi-profundo"
          >
            {inicial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{nombre}</p>
            <p className="truncate text-xs text-luwi-antique/65">{NOMBRE_ROL[user?.rol] ?? "Usuario"}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-lg p-2 text-luwi-antique/70 transition hover:bg-red-500/20 hover:text-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>
    </>
  );
}
