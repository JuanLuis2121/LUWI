import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, HomeIcon, PlusIcon } from "./icons";

// Destinos del buscador: pantallas del panel y acciones de creación.
const DESTINOS = [
  { label: "Inicio", grupo: "Ir a", to: "/dashboard", icon: HomeIcon },
  { label: "Empresas", grupo: "Ir a", to: "/dashboard/empresas", icon: BuildingIcon },
  { label: "Puestos", grupo: "Ir a", to: "/dashboard/puestos", icon: BriefcaseIcon },
  { label: "Cursos", grupo: "Ir a", to: "/dashboard/cursos", icon: BookIcon },
  { label: "Rutas de aprendizaje", grupo: "Ir a", to: "/dashboard/rutas", icon: RouteIcon },
  { label: "Nueva empresa", grupo: "Crear", to: "/dashboard/empresas/nuevo", icon: PlusIcon },
  { label: "Nuevo puesto", grupo: "Crear", to: "/dashboard/puestos/nuevo", icon: PlusIcon },
  { label: "Nuevo curso", grupo: "Crear", to: "/dashboard/cursos/nuevo", icon: PlusIcon },
  { label: "Nueva ruta de aprendizaje", grupo: "Crear", to: "/dashboard/rutas/nuevo", icon: PlusIcon },
];

// Ignora mayúsculas y tildes al comparar.
const normalizar = (t) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Buscador rápido del panel. Se abre con Ctrl + K (o ⌘ + K) y se navega con flechas y Enter. */
export default function CommandSearch() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const inputRef = useRef(null);
  const cajaRef = useRef(null);

  const resultados = useMemo(() => {
    const q = normalizar(texto.trim());
    return q ? DESTINOS.filter((d) => normalizar(d.label).includes(q)) : DESTINOS;
  }, [texto]);

  // Atajo Ctrl + K / ⌘ + K
  useEffect(() => {
    const alTeclear = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setAbierto(true);
      }
    };
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, []);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = (e) => cajaRef.current && !cajaRef.current.contains(e.target) && setAbierto(false);
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  const ir = (destino) => {
    navigate(destino.to);
    setTexto("");
    setAbierto(false);
    inputRef.current?.blur();
  };

  const alTecla = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && resultados[activo]) {
      e.preventDefault();
      ir(resultados[activo]);
    } else if (e.key === "Escape") {
      setAbierto(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={cajaRef} className="relative w-full max-w-md">
      <div className="flex h-10 items-center gap-2.5 rounded-xl border border-luwi-linea bg-luwi-panel px-3.5 transition focus-within:border-luwi-tecno focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,156,255,0.10)]">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0 text-luwi-texto/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setActivo(0);
            setAbierto(true);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTecla}
          placeholder="Buscar módulos o acciones…"
          aria-label="Buscar módulos o acciones"
          role="combobox"
          aria-expanded={abierto}
          aria-controls="buscador-resultados"
          className="h-full w-full min-w-0 bg-transparent text-sm text-luwi-profundo outline-none placeholder:text-luwi-texto/60 [&::-webkit-search-cancel-button]:hidden"
        />
        <kbd className="hidden shrink-0 rounded-md border border-luwi-linea bg-white px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-luwi-texto/70 sm:block">
          Ctrl K
        </kbd>
      </div>

      {abierto && (
        <ul
          id="buscador-resultados"
          role="listbox"
          className="absolute left-0 right-0 top-12 z-30 max-h-80 overflow-y-auto rounded-2xl border border-luwi-linea bg-white p-2 shadow-[0_20px_50px_-12px_rgba(11,58,140,0.35)]"
        >
          {resultados.length === 0 && <li className="px-3 py-6 text-center text-sm text-luwi-texto/70">Sin resultados para “{texto}”.</li>}
          {resultados.map((d, i) => {
            const Icon = d.icon;
            return (
              <li key={d.to} role="option" aria-selected={i === activo}>
                <button
                  type="button"
                  onMouseEnter={() => setActivo(i)}
                  onClick={() => ir(d)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                    i === activo ? "bg-luwi-cristal-fondo text-luwi-profundo" : "text-luwi-texto"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-luwi-cristal text-luwi-profundo">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium">{d.label}</span>
                  <span className="text-[11px] text-luwi-texto/60">{d.grupo}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
