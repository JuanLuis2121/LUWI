import { useMemo, useState } from "react";
import { NIVELES, nivelDe, formatoHoras } from "../../utils/rutas";
import { PlusIcon, ClockIcon, LockIcon } from "../dashboard/icons";

const FILTROS = [{ value: "", label: "Todos" }, ...Object.entries(NIVELES).map(([value, n]) => ({ value, label: n.label }))];

const normalizar = (t) => (t ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * Catálogo de cursos disponibles para la ruta.
 * Cada curso se agrega con "+" o arrastrándolo al roadmap.
 * - cursos: cursos compatibles que aún no están en la ruta.
 * - bloqueado: true mientras no se elija el puesto.
 */
export default function CatalogoCursos({ cursos, onAgregar, bloqueado }) {
  const [texto, setTexto] = useState("");
  const [nivel, setNivel] = useState("");

  const lista = useMemo(() => {
    const q = normalizar(texto.trim());
    return cursos.filter(
      (c) => (!nivel || c.nivel === nivel) && (!q || normalizar(`${c.titulo} ${c.competencia}`).includes(q))
    );
  }, [cursos, texto, nivel]);

  return (
    <div className="flex h-full flex-col">
      <label className="flex h-10 items-center gap-2.5 rounded-xl border border-luwi-linea bg-luwi-panel px-3.5 transition focus-within:border-luwi-tecno focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(0,156,255,0.10)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-luwi-texto/70" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar curso o competencia"
          aria-label="Buscar curso o competencia"
          disabled={bloqueado}
          className="w-full min-w-0 bg-transparent text-sm text-luwi-profundo outline-none placeholder:text-luwi-texto/60 disabled:cursor-not-allowed"
        />
      </label>

      <div role="tablist" aria-label="Filtrar por nivel" className="mt-3 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={nivel === f.value}
            disabled={bloqueado}
            onClick={() => setNivel(f.value)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition disabled:opacity-50 ${
              nivel === f.value ? "bg-luwi-profundo text-white" : "bg-luwi-panel text-luwi-texto hover:text-luwi-profundo"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="relative mt-4 min-h-[220px] flex-1">
        {bloqueado ? (
          <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-luwi-linea px-6 py-10 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-luwi-panel text-luwi-texto/60">
              <LockIcon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-semibold text-luwi-profundo">Elige primero el puesto</p>
            <p className="mt-1 text-xs text-luwi-texto/80">Así te mostramos solo los cursos compatibles con su empresa.</p>
          </div>
        ) : lista.length === 0 ? (
          <p className="rounded-2xl bg-luwi-panel px-4 py-8 text-center text-sm text-luwi-texto/80">
            {cursos.length === 0 ? "Ya agregaste todos los cursos disponibles." : "No hay cursos con ese filtro."}
          </p>
        ) : (
          <ul className="space-y-2 overflow-y-auto pr-1 lg:max-h-[560px]">
            {lista.map((c) => {
              const n = nivelDe(c);
              return (
                <li
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/curso-id", c.id);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className="group flex cursor-grab items-center gap-3 rounded-xl border border-luwi-linea/80 bg-white p-3 transition hover:border-luwi-tecno/40 hover:shadow-[0_8px_20px_-14px_rgba(11,58,140,0.6)] active:cursor-grabbing"
                >
                  <span aria-hidden="true" className={`h-9 w-1.5 shrink-0 rounded-full ${n.punto}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold text-luwi-profundo" title={c.titulo}>
                      {c.titulo}
                    </p>
                    <p className="mt-0.5 flex min-w-0 items-center gap-2 text-[11.5px] text-luwi-texto/80">
                      <span className="shrink-0">{n.label}</span>
                      {c.duracionHoras ? (
                        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
                          <ClockIcon className="h-3 w-3" />
                          {formatoHoras(c.duracionHoras)}
                        </span>
                      ) : null}
                      {c.competencia && <span className="min-w-0 truncate">· {c.competencia}</span>}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAgregar(c.id)}
                    aria-label={`Agregar ${c.titulo} a la ruta`}
                    title="Agregar a la ruta"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-luwi-cristal-fondo text-luwi-medio transition hover:bg-luwi-profundo hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-luwi-tecno/40"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!bloqueado && (
        <p className="mt-3 text-[11.5px] text-luwi-texto/70">
          Solo aparecen cursos publicados, globales o de la empresa del puesto.
        </p>
      )}
    </div>
  );
}
