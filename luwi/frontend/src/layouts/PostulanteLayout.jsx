import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { HomeIcon, BookIcon, UserIcon } from "../components/dashboard/icons";
import useAuth from "../hooks/useAuth";

// "Cerrar sesión" ya lo agrega el Sidebar
const MENU_POSTULANTE = [
  { to: "/inicio", label: "Inicio", icon: HomeIcon, end: true, grupo: "Mi espacio" },
  { to: "/mi-formacion", label: "Mi formación", icon: BookIcon, grupo: "Mi espacio" },
  { to: "/mi-perfil", label: "Mi perfil", icon: UserIcon, grupo: "Cuenta" },
];

// Título de la barra superior según la pantalla
function tituloDe(pathname) {
  if (pathname.startsWith("/mi-formacion/")) return "Curso";
  if (pathname.startsWith("/mi-formacion")) return "Mi formación";
  if (pathname.startsWith("/mi-perfil")) return "Mi perfil";
  return "Inicio";
}

const fechaHoy = () => {
  const f = new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
  return f.charAt(0).toUpperCase() + f.slice(1);
};

/** Estructura de las pantallas del postulante. */
export default function PostulanteLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-luwi-panel font-poppins">
      <Sidebar items={MENU_POSTULANTE} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />

      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setMenuOpen(true)}
          left={
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-luwi-profundo">{tituloDe(pathname)}</p>
              <p className="hidden truncate text-xs text-luwi-texto/75 sm:block">{fechaHoy()}</p>
            </div>
          }
        />
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
