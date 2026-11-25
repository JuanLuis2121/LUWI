import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BuildingIcon, BriefcaseIcon, BookIcon, RouteIcon, HomeIcon, PlusIcon, CheckCircleIcon } from "./icons";
import { empresasService } from "../../services/empresasService";
import { puestosService } from "../../services/puestosService";
import { getCursos } from "../../services/cursosService";
import { rutasService } from "../../services/rutasService";

// Pantallas y acciones fijas del buscador
const DESTINOS = [
  { label: "Inicio", grupo: "Ir a", to: "/dashboard", icon: HomeIcon },
  { label: "Empresas", grupo: "Ir a", to: "/dashboard/empresas", icon: BuildingIcon },
  { label: "Puestos", grupo: "Ir a", to: "/dashboard/puestos", icon: BriefcaseIcon },
  { label: "Postulantes", grupo: "Ir a", to: "/dashboard/postulantes", icon: BuildingIcon },
  { label: "Recomendaciones IA", grupo: "Ir a", to: "/dashboard/recomendaciones-ia", icon: CheckCircleIcon },
  { label: "Cursos", grupo: "Ir a", to: "/dashboard/cursos", icon: BookIcon },
  { label: "Evaluaciones", grupo: "Ir a", to: "/dashboard/evaluaciones", icon: CheckCircleIcon },
  { label: "Rutas de aprendizaje", grupo: "Ir a", to: "/dashboard/rutas", icon: RouteIcon },
  { label: "Nueva empresa", grupo: "Crear", to: "/dashboard/empresas/nuevo", icon: PlusIcon },
  { label: "Nuevo puesto", grupo: "Crear", to: "/dashboard/puestos/nuevo", icon: PlusIcon },
  { label: "Nuevo curso", grupo: "Crear", to: "/dashboard/cursos/nuevo", icon: PlusIcon },
  { label: "Nueva evaluación", grupo: "Crear", to: "/dashboard/evaluaciones/nuevo", icon: PlusIcon },
  { label: "Nueva ruta de aprendizaje", grupo: "Crear", to: "/dashboard/rutas/nuevo", icon: PlusIcon },
];

const ORDEN_GRUPOS = ["Ir a", "Crear", "Empresas", "Puestos", "Cursos", "Rutas"];
const MAX_POR_GRUPO = 4;
const CACHE_MS = 60_000;

// Ignora mayúsculas y tildes al comparar.
const normalizar = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Registros de la plataforma, guardados un minuto para no repetir peticiones.
let cache = { hora: 0, datos: null };

async function cargarRegistros() {
  if (cache.datos && Date.now() - cache.hora < CACHE_MS) return cache.datos;

  const [empresas, puestos, cursos, rutas] = await Promise.allSettled([
    empresasService.list(),
    puestosService.list(),
    getCursos(),
    rutasService.list(),
  ]);
  const ok = (r) => (r.status === "fulfilled" ? r.value : []);
  const id = (x) => x.id ?? x._id;

  const datos = [
    ...ok(empresas).map((e) => ({ key: `e-${id(e)}`, label: e.nombre, detalle: e.sector, grupo: "Empresas", to: `/dashboard/empresas/${id(e)}`, icon: BuildingIcon })),
    ...ok(puestos).map((p) => ({ key: `p-${id(p)}`, label: p.titulo, detalle: p.empresa?.nombre ?? "", grupo: "Puestos", to: `/dashboard/puestos/${id(p)}`, icon: BriefcaseIcon })),
    ...ok(cursos).map((c) => ({ key: `c-${id(c)}`, label: c.titulo, detalle: c.competencia, grupo: "Cursos", to: `/dashboard/cursos/${id(c)}/unidades`, icon: BookIcon })),
    ...ok(rutas).map((r) => ({ key: `r-${id(r)}`, label: r.nombre, detalle: r.puestoTitulo, grupo: "Rutas", to: `/dashboard/rutas/${id(r)}`, icon: RouteIcon })),
  ];

  cache = { hora: Date.now(), datos };
  return datos;
}

/**
 * Buscador global del panel (Ctrl + K o ⌘ + K).
 * Busca pantallas, acciones y registros reales: empresas, puestos, cursos y rutas.
 */
export default function CommandSearch() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);
  const cajaRef = useRef(null);
  const listaRef = useRef(null);

  // Carga los registros la primera vez que se abre (y cada minuto como máximo)
  useEffect(() => {
    if (!abierto) return;
    let activo = true;
    setCargando(true);
    cargarRegistros()
      .then((d) => activo && setRegistros(d))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [abierto]);

  const resultados = useMemo(() => {
    const q = normalizar(texto.trim());
    if (!q) return DESTINOS;

    const coinciden = (d) => normalizar(`${d.label} ${d.detalle ?? ""}`).includes(q);
    const fijos = DESTINOS.filter(coinciden);
    const porGrupo = {};
    for (const r of registros) {
      if (!coinciden(r)) continue;
      porGrupo[r.grupo] = porGrupo[r.grupo] ?? [];
      if (porGrupo[r.grupo].length < MAX_POR_GRUPO) porGrupo[r.grupo].push(r);
    }
    return [...fijos, ...ORDEN_GRUPOS.flatMap((g) => porGrupo[g] ?? [])];
  }, [texto, registros]);

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
    if (!abierto) return undefined;
    const alClicFuera = (e) => cajaRef.current && !cajaRef.current.contains(e.target) && setAbierto(false);
    document.addEventListener("mousedown", alClicFuera);
    return () => document.removeEventListener("mousedown", alClicFuera);
  }, [abierto]);

  // Mantiene visible la opción activa al moverse con las flechas
  useEffect(() => {
    listaRef.current?.querySelector(`[data-indice="${activo}"]`)?.scrollIntoView({ block: "nearest" });
  }, [activo]);

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

  // Cabecera de grupo cuando cambia el grupo respecto al anterior
  const conCabecera = resultados.map((d, i) => ({ ...d, cabecera: i === 0 || resultados.at(i - 1).grupo !== d.grupo }));

  return (
    <div ref={cajaRef} className="relative w-full max-w-md">
      <div className="flex h-10 items-center gap-2.5 rounded-xl border border-luwi-linea bg-luwi-panel px-3.5 transition focus-within:border-luwi-tecno focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(59,69,201,0.10)]">
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
          placeholder="Buscar empresas, puestos, cursos, rutas…"
          aria-label="Buscar en LUWI"
          role="combobox"
          aria-expanded={abierto}
          aria-controls="buscador-resultados"
          className="h-full w-full min-w-0 bg-transparent text-sm text-luwi-profundo outline-none placeholder:text-luwi-texto/60 [&::-webkit-search-cancel-button]:hidden"
        />
        {cargando && abierto ? (
          <span aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-luwi-cristal border-t-luwi-tecno" />
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-luwi-linea bg-white px-1.5 py-0.5 font-sans text-[10.5px] font-semibold text-luwi-texto/70 sm:block">
            Ctrl K
          </kbd>
        )}
      </div>

      {abierto && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-2xl border border-luwi-linea bg-white shadow-[0_20px_50px_-12px_rgba(17,22,82,0.35)]">
          <ul ref={listaRef} id="buscador-resultados" role="listbox" className="max-h-96 overflow-y-auto p-2">
            {resultados.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-luwi-texto/70">
                {cargando ? "Buscando…" : `Sin resultados para “${texto}”.`}
              </li>
            )}
            {conCabecera.map((d, i) => {
              const Icono = d.icon;
              return (
                <li key={d.key ?? d.to} role="option" aria-selected={i === activo}>
                  {d.cabecera && (
                    <p className="px-3 pb-1 pt-2.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/55">{d.grupo}</p>
                  )}
                  <button
                    type="button"
                    data-indice={i}
                    onMouseEnter={() => setActivo(i)}
                    onClick={() => ir(d)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                      i === activo ? "bg-luwi-cristal-fondo text-luwi-profundo" : "text-luwi-texto"
                    }`}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-luwi-cristal text-luwi-profundo">
                      <Icono className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-luwi-profundo">{d.label}</span>
                      {d.detalle && <span className="block truncate text-xs text-luwi-texto/70">{d.detalle}</span>}
                    </span>
                    {i === activo && <kbd className="shrink-0 font-sans text-[11px] text-luwi-texto/60">Enter ↵</kbd>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-4 border-t border-luwi-linea/70 bg-luwi-panel/60 px-4 py-2 text-[11px] text-luwi-texto/70">
            <span>↑ ↓ moverse</span>
            <span>Enter abrir</span>
            <span>Esc cerrar</span>
          </div>
        </div>
      )}
    </div>
  );
}
