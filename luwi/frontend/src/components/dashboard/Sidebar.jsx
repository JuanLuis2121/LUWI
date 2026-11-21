import { NavLink, useLocation } from "react-router-dom";
import AnimatedBackground from "../core/AnimatedBackground";
import Logo from "../Logo";
import useAuth from "../../hooks/useAuth";
import {
  HomeIcon, BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, LogoutIcon, CloseIcon,
} from "./icons";

// Para agregar una sección nueva basta con añadir un objeto aquí.
// "grupo" agrupa los enlaces bajo un título pequeño en el menú.
export const MENU_ITEMS = [
  { to: "/dashboard", label: "Inicio", icon: HomeIcon, end: true, grupo: "General" },
  { to: "/dashboard/empresas", label: "Empresas", icon: BuildingIcon, grupo: "Organización" },
  { to: "/dashboard/puestos", label: "Puestos", icon: BriefcaseIcon, grupo: "Organización" },
  { to: "/dashboard/cursos", label: "Cursos", icon: BookIcon, grupo: "Formación" },
  { to: "/dashboard/rutas", label: "Rutas de aprendizaje", icon: RouteIcon, grupo: "Formación" },
];

export const NOMBRE_ROL = {
  admin: "Administrador",
  empresa: "Empresa",
  rrhh: "Recursos Humanos",
  postulante: "Postulante",
};

const linkClass = ({ isActive }) =>
  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/60 ${
    isActive ? "font-semibold text-white" : "font-medium text-white/65 hover:text-white"
  }`;

// Agrupa los enlaces conservando el orden en que aparecen.
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

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </svg>
  );
}

/**
 * Menú lateral oscuro. En escritorio es fijo; en celular se muestra como
 * panel deslizable controlado por `open` / `onClose`.
 * - mostrarIA: muestra la tarjeta "Análisis con IA" (solo en el panel administrativo).
 */
export default function Sidebar({ open, onClose, onLogout, items = MENU_ITEMS, mostrarIA = false }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const current = items.find(({ to, end }) => (end ? pathname === to : pathname.startsWith(to)))?.to;

  const nombre = user?.nombre || "Usuario";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <>
      {/* Fondo oscuro (solo celular) */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-luwi-noche/50 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Menú principal"
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-hidden bg-[linear-gradient(180deg,#0B3A8C_0%,#082C6E_45%,#061A45_100%)] px-4 pb-4 pt-6 font-poppins transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Decoración: brillos y curvas */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-luwi-tecno/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 h-72 w-72 rounded-full bg-luwi-tecno/10 blur-3xl" />
        <svg aria-hidden="true" viewBox="0 0 264 200" className="pointer-events-none absolute inset-x-0 bottom-0 w-full opacity-[0.07]">
          <path d="M0 120 C60 80 120 160 264 90 V200 H0Z" fill="white" />
          <path d="M0 160 C80 120 150 190 264 140 V200 H0Z" fill="white" />
        </svg>

        <div className="relative mb-9 flex items-center justify-between px-2">
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

        <nav className="scroll-oscuro relative -mr-2 flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
          {agrupar(items).map((grupo) => (
            <div key={grupo.nombre || "menu"}>
              {grupo.nombre && (
                <p className="mb-2 px-3.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  {grupo.nombre}
                </p>
              )}
              <div className="flex flex-col gap-1">
                <AnimatedBackground
                  value={current}
                  enableHover
                  className="rounded-xl bg-white/[0.09] ring-1 ring-white/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.3 }}
                >
                  {grupo.items.map(({ to, label, icon: Icon, end }) => (
                    <NavLink key={to} data-id={to} to={to} end={end} onClick={onClose} className={linkClass}>
                      {({ isActive }) => (
                        <>
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
                              isActive
                                ? "bg-gradient-to-br from-luwi-tecno to-luwi-medio text-white shadow-[0_6px_16px_-4px_rgba(0,156,255,0.7)]"
                                : "text-white/60 group-hover:text-white"
                            }`}
                          >
                            <Icon className="h-[18px] w-[18px]" />
                          </span>
                          {label}
                          {isActive && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-luwi-tecno shadow-[0_0_8px_2px_rgba(0,156,255,0.6)]" />}
                        </>
                      )}
                    </NavLink>
                  ))}
                </AnimatedBackground>
              </div>
            </div>
          ))}
        </nav>

        {/* Tarjeta de IA (módulo planificado en la propuesta). Se oculta en pantallas bajas. */}
        {mostrarIA && (
          <div className="relative mb-3 mt-4 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-4 [@media(max-height:820px)]:hidden">
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-luwi-tecno/30 blur-2xl" />
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-tecno to-luwi-medio text-white">
              <SparkIcon className="h-5 w-5" />
            </span>
            <p className="relative mt-3 text-sm font-semibold text-white">Análisis de brechas con IA</p>
            <p className="relative mt-1 text-xs leading-relaxed text-white/60">
              Compara candidatos con su puesto y recomienda rutas.
            </p>
            <span className="relative mt-3 inline-flex rounded-full bg-luwi-tecno/20 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-[#7cc8ff]">
              Próximamente
            </span>
          </div>
        )}

        {/* Usuario + cerrar sesión */}
        <div className="relative mt-3 flex items-center gap-3 rounded-2xl bg-white/[0.06] p-2.5 ring-1 ring-white/10">
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-tecno to-luwi-medio text-sm font-bold text-white"
          >
            {inicial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{nombre}</p>
            <p className="truncate text-xs text-white/55">{NOMBRE_ROL[user?.rol] ?? "Usuario"}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="rounded-lg p-2 text-white/60 transition hover:bg-red-500/15 hover:text-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <LogoutIcon className="h-5 w-5" />
          </button>
        </div>
      </aside>
    </>
  );
}