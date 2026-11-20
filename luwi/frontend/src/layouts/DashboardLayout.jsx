import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/dashboard/Sidebar";
import Topbar from "../components/dashboard/Topbar";
import CreateMenu from "../components/dashboard/CreateMenu";
import CommandSearch from "../components/dashboard/CommandSearch";
import useAuth from "../hooks/useAuth";

/**
 * Estructura del panel: menú lateral + barra superior + contenido.
 * Las pantallas hijas se renderizan en <Outlet />.
 */
export default function DashboardLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-luwi-panel">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} mostrarIA />

      <div className="lg:pl-64">
        <Topbar
          onMenuClick={() => setMenuOpen(true)}
          left={
            <>
              <p className="truncate text-sm font-semibold text-luwi-profundo md:hidden">Panel de control</p>
              <div className="hidden w-full md:block">
                <CommandSearch />
              </div>
            </>
          }
        >
          <CreateMenu />
        </Topbar>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
