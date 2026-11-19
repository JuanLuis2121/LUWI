import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { esRolValido, inicioSegunRol } from "../utils/roles";

/**
 * Protege un grupo de rutas.
 * - Mientras se recupera la sesión muestra un indicador de carga.
 * - Sin sesión, lleva a /login.
 * - Con un rol no permitido, lleva al inicio de su rol.
 */
export default function RequireAuth({ roles }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-luwi-bg" role="status">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-luwi-border border-t-luwi-blue" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Sin un rol conocido no hay a dónde redirigir (evita un ciclo de redirecciones)
  const rol = user.rol;
  if (!esRolValido(rol)) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(rol)) {
    return <Navigate to={inicioSegunRol(rol)} replace />;
  }

  return <Outlet />;
}
