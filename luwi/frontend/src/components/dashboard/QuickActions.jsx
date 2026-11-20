import { Link } from "react-router-dom";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, PlusIcon } from "./icons";

// Marlon: cada acceso abre el módulo con ?nuevo=1 para mostrar directamente el formulario.
export const ACCIONES = [
  { to: "/dashboard/empresas?nuevo=1", label: "Nueva empresa", icon: BuildingIcon },
  { to: "/dashboard/puestos?nuevo=1", label: "Nuevo puesto", icon: BriefcaseIcon },
  { to: "/dashboard/cursos?nuevo=1", label: "Nuevo curso", icon: BookIcon },
  { to: "/dashboard/rutas?nuevo=1", label: "Nueva ruta", icon: RouteIcon },
];

/** Accesos directos de creación. `inverse` = para usar sobre fondo con degradado. */
export default function QuickActions({ inverse = false }) {
  const tone = inverse
    ? "bg-white/15 text-white hover:bg-white/25 focus-visible:ring-white/60"
    : "bg-luwi-bg text-luwi-navy hover:bg-luwi-blue/10 focus-visible:ring-luwi-blue/40";
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {ACCIONES.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 ${tone}`}
        >
          <PlusIcon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </div>
  );
}
