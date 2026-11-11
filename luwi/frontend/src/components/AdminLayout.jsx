import { NavLink, Outlet } from "react-router-dom";
import Logo from "./Logo";
import Icon from "./Icon";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/empresas", label: "Empresas", icon: "building" },
  { to: "/puestos", label: "Puestos", icon: "briefcase" },
  { to: "/cursos", label: "Cursos", icon: "book" },
  { to: "/rutas", label: "Rutas", icon: "book" },
];

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-admin-bg lg:flex-row">
      <aside className="bg-white p-5 lg:min-h-screen lg:w-60 lg:shrink-0">
        <div className="mb-4 lg:mb-10">
          <Logo />
        </div>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `flex items-center gap-3 whitespace-nowrap rounded-full border-2 px-4 py-2.5 text-sm font-semibold text-admin-ink transition ${
                  isActive
                    ? "border-admin-blue bg-admin-soft"
                    : "border-transparent hover:bg-admin-soft/50"
                }`
              }
            >
              <Icon name={l.icon} className="h-[18px] w-[18px] text-admin-blue" />
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 p-6 lg:p-10">
        <Outlet />
      </main>
    </div>
  );
}