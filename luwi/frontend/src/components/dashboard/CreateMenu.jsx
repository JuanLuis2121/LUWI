import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, PlusIcon } from "./icons";

const OPCIONES = [
  { to: "/dashboard/empresas/nuevo", label: "Empresa", detalle: "Registrar una organización", icon: BuildingIcon },
  { to: "/dashboard/puestos/nuevo", label: "Puesto", detalle: "Definir un cargo de la empresa", icon: BriefcaseIcon },
  { to: "/dashboard/cursos/nuevo", label: "Curso", detalle: "Crear contenido de formación", icon: BookIcon },
  { to: "/dashboard/rutas/nuevo", label: "Ruta de aprendizaje", detalle: "Ordenar cursos para un puesto", icon: RouteIcon },
];

/** Botón "Crear" con menú desplegable. Se cierra con Escape o al hacer clic fuera. */
export default function CreateMenu() {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => ref.current && !ref.current.contains(e.target) && setAbierto(false);
    const alEscape = (e) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alEscape);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alEscape);
    };
  }, [abierto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-luwi-profundo to-luwi-medio px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(11,58,140,0.6)] transition hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-luwi-tecno/30"
      >
        <PlusIcon className="h-4 w-4" />
        Crear
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-72 rounded-2xl border border-luwi-linea bg-white p-2 shadow-[0_20px_50px_-12px_rgba(11,58,140,0.35)]"
        >
          {OPCIONES.map(({ to, label, detalle, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-luwi-cristal-fondo focus:bg-luwi-cristal-fondo focus:outline-none"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-luwi-cristal text-luwi-profundo">
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-luwi-profundo">{label}</span>
                <span className="block truncate text-xs text-luwi-texto/80">{detalle}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
