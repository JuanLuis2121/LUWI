import { BuildingIcon } from "../dashboard/icons";
import TarjetaRuta from "./TarjetaRuta";
import { formatoHoras } from "../../utils/rutas";

// Agrupa las rutas por empresa (las rutas sin empresa van al final).
function agruparPorEmpresa(rutas) {
  const grupos = new Map();
  for (const r of rutas) {
    const nombre = r.empresaNombre || "Sin empresa";
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre).push(r);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === "Sin empresa") - (b === "Sin empresa") || a.localeCompare(b))
    .map(([nombre, lista]) => ({ nombre, rutas: lista }));
}

/**
 * Vista "Mapa": las rutas agrupadas por empresa, cada una con su camino.
 * Recibe las mismas acciones que la tabla.
 */
export default function MapaRutas({ rutas, seleccion, onSeleccionar, onAbrir, onEliminar }) {
  const grupos = agruparPorEmpresa(rutas);
  let indice = 0;

  return (
    <div className="space-y-9 p-5 sm:p-6">
      {grupos.map((g) => {
        const puestos = new Set(g.rutas.map((r) => r.puestoId).filter(Boolean)).size;
        const horas = g.rutas.reduce((a, r) => a + (Number(r.duracionTotalHoras) || 0), 0);
        return (
          <section key={g.nombre} aria-label={g.nombre}>
            <header className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white shadow-[0_8px_18px_-8px_rgba(0,110,230,0.7)]">
                <BuildingIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-base font-bold text-luwi-profundo">{g.nombre}</h2>
                <p className="text-xs text-luwi-texto/75">
                  {g.rutas.length} {g.rutas.length === 1 ? "ruta" : "rutas"} · {puestos} {puestos === 1 ? "puesto" : "puestos"} · {formatoHoras(horas)}
                </p>
              </div>
              <span aria-hidden="true" className="ml-2 h-px flex-1 bg-gradient-to-r from-luwi-linea to-transparent" />
            </header>

            <ul className="grid grid-flow-dense gap-5 sm:grid-cols-2 2xl:grid-cols-3">
              {g.rutas.map((r) => (
                <TarjetaRuta
                  key={r.id}
                  ruta={r}
                  indice={indice++}
                  seleccionada={seleccion.has(r.id)}
                  onSeleccionar={onSeleccionar}
                  onAbrir={onAbrir}
                  onEliminar={onEliminar}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
