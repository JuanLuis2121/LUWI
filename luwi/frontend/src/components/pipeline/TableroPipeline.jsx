import { useState } from "react";
import TarjetaPipeline from "./TarjetaPipeline";
import { ETAPAS } from "../../utils/pipeline";

/**
 * Tablero kanban por etapas. Al soltar una tarjeta llama onSoltar(tarjeta, etapaDestino);
 * la página decide qué hacer (iniciar proceso, asignar ruta, finalizar...).
 */
export default function TableroPipeline({ tarjetas, seleccion, onSeleccionar, onAbrir, onSoltar, ocupadas }) {
  const [sobre, setSobre] = useState(null);
  const porKey = new Map(tarjetas.map((t) => [t.key, t]));

  return (
    <div className="flex snap-x gap-4 overflow-x-auto p-5 [scrollbar-color:#d5e3f7_transparent] [scrollbar-width:thin]">
      {ETAPAS.map((etapa) => {
        const lista = tarjetas.filter((t) => t.etapa === etapa.key);
        const activa = sobre === etapa.key;
        const promedio =
          etapa.key === "EN_FORMACION" && lista.length
            ? Math.round(lista.reduce((s, t) => s + (t.proceso?.asignacion?.porcentaje ?? 0), 0) / lista.length)
            : null;

        return (
          <section
            key={etapa.key}
            aria-label={etapa.titulo}
            onDragOver={(e) => {
              if (e.dataTransfer.types.includes("text/pipeline-key")) {
                e.preventDefault();
                setSobre(etapa.key);
              }
            }}
            onDragLeave={(e) => !e.currentTarget.contains(e.relatedTarget) && setSobre(null)}
            onDrop={(e) => {
              e.preventDefault();
              setSobre(null);
              const t = porKey.get(e.dataTransfer.getData("text/pipeline-key"));
              if (t) onSoltar(t, etapa.key);
            }}
            className={`flex min-h-[380px] w-[285px] shrink-0 snap-start flex-col rounded-[22px] p-3 transition xl:w-0 xl:min-w-[240px] xl:flex-1 ${
              activa ? "bg-luwi-tecno/10 outline-2 outline-dashed outline-luwi-tecno/50" : "bg-luwi-panel"
            }`}
          >
            <header className="mb-3 px-1.5 pt-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${etapa.punto}`} />
                  <h3 className="truncate text-sm font-semibold text-luwi-profundo">{etapa.titulo}</h3>
                  <span className="rounded-md bg-white px-1.5 text-xs font-semibold text-luwi-texto ring-1 ring-luwi-linea">{lista.length}</span>
                </div>
              </div>
              <p className="mt-1 truncate pl-4 text-[11px] text-luwi-texto/60">
                {promedio != null ? `${etapa.ayuda} · promedio ${promedio}%` : etapa.ayuda}
              </p>
              <div className={`mt-2.5 h-1 rounded-full bg-gradient-to-r ${etapa.barra} opacity-80`} />
            </header>

            <ul className="flex-1 [scrollbar-color:#d5e3f7_transparent] [scrollbar-width:thin] space-y-2.5 overflow-y-auto pr-0.5 xl:max-h-[calc(100vh-300px)]">
              {lista.length === 0 && (
                <li className="rounded-2xl border-2 border-dashed border-luwi-linea px-4 py-8 text-center text-xs leading-relaxed text-luwi-texto/60">
                  {etapa.vacio}
                </li>
              )}
              {lista.map((t) => (
                <TarjetaPipeline
                  key={t.key}
                  tarjeta={t}
                  seleccionada={seleccion.has(t.key)}
                  onSeleccionar={onSeleccionar}
                  onAbrir={onAbrir}
                  ocupada={ocupadas.has(t.key)}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
