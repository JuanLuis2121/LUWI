import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import { HomeIcon, BookIcon, UserIcon } from "../components/dashboard/icons";
import useAuth from "../hooks/useAuth";

// "Cerrar sesión" ya lo agrega el Sidebar
const MENU_POSTULANTE = [
  { to: "/inicio", label: "Inicio", icon: HomeIcon, end: true },
  { to: "/mi-formacion", label: "Mi formación", icon: BookIcon },
  { to: "/mi-perfil", label: "Mi perfil", icon: UserIcon },
];

/** Estructura de las pantallas del postulante. */
export default function PostulanteLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-luwi-bg">
      <Sidebar
        items={MENU_POSTULANTE}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <Topbar
          username={user?.username}
          subtitle="Mi formación"
          onMenuClick={() => setMenuOpen(true)}
        />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
