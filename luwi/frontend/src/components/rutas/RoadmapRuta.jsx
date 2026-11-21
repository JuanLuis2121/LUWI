import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { nivelDe, formatoHoras } from "../../utils/rutas";
import { BriefcaseIcon, ClockIcon } from "../dashboard/icons";

// ---------- Íconos ----------

const trazo = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const GripIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    {[6, 12, 18].map((y) => [9, 15].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
  </svg>
);
const XIcon = (p) => <svg {...trazo} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>;
const FlagIcon = (p) => <svg {...trazo} {...p}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
const AlertIcon = (p) => <svg {...trazo} {...p}><path d="M12 3l9.5 17H2.5L12 3z" /><path d="M12 10v4M12 17.5v.01" /></svg>;
const BookIcon = (p) => <svg {...trazo} {...p}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M4 19a2 2 0 012-2h13" /></svg>;

// ---------- Tarjeta de un curso ----------

function TarjetaCurso({ curso, numero, editable, onRemove, incompatible, avisoNivel, asaArrastre }) {
  const nivel = nivelDe(curso);
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_10px_26px_-18px_rgba(11,58,140,0.55)] transition ${
        incompatible ? "border-red-300 ring-2 ring-red-100" : "border-luwi-linea/80 hover:border-luwi-tecno/40"
      }`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${nivel.punto}`} />

      <div className="flex items-start gap-2.5">
        {editable && asaArrastre}
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-luwi-texto/60">Paso {numero}</p>
          <p className="mt-0.5 break-words text-[14.5px] font-semibold leading-snug text-luwi-profundo">{curso.titulo}</p>
        </div>
        {editable && (
          <button
            type="button"
            onClick={() => onRemove(curso.id)}
            aria-label={`Quitar ${curso.titulo}`}
            title="Quitar de la ruta"
            className="-mr-1 -mt-1 rounded-lg p-1.5 text-luwi-texto/50 opacity-70 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11.5px]">
        <span className={`rounded-md px-2 py-0.5 font-semibold ring-1 ring-inset ${nivel.chip}`}>{nivel.label}</span>
        {curso.duracionHoras ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-luwi-panel px-2 py-0.5 text-luwi-texto">
            <ClockIcon className="h-3 w-3" />
            {formatoHoras(curso.duracionHoras)}
          </span>
        ) : null}
        {curso.competencia && <span className="max-w-[160px] truncate rounded-md bg-luwi-panel px-2 py-0.5 text-luwi-texto">{curso.competencia}</span>}
      </div>

      {incompatible && (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          No es compatible con el puesto (no está publicado o es de otra empresa).
        </p>
      )}
      {!incompatible && avisoNivel && (
        <p className="mt-2.5 flex items-start gap-1.5 text-xs font-medium text-amber-700">
          <AlertIcon className="mt-px h-3.5 w-3.5 shrink-0" />
          Es de un nivel más básico que un curso anterior. Considera moverlo antes.
        </p>
      )}
    </article>
  );
}

// ---------- Una fila del roadmap (nodo + tarjeta + horas acumuladas) ----------

function Fila({ curso, indice, acumulado, editable, onRemove, incompatible, avisoNivel, arrastrable }) {
  const controles = useDragControls();
  const nivel = nivelDe(curso);
  const derecha = indice % 2 === 1;

  const asa = (
    <button
      type="button"
      onPointerDown={(e) => controles.start(e)}
      aria-label={`Mover ${curso.titulo}`}
      title="Arrastra para cambiar el orden"
      className="-ml-1 mt-0.5 cursor-grab touch-none rounded-lg p-1 text-luwi-texto/40 transition hover:bg-luwi-cristal-fondo hover:text-luwi-medio active:cursor-grabbing"
    >
      <GripIcon className="h-4 w-4" />
    </button>
  );

  const tarjeta = (
    <TarjetaCurso
      curso={curso}
      numero={indice + 1}
      editable={editable}
      onRemove={onRemove}
      incompatible={incompatible}
      avisoNivel={avisoNivel}
      asaArrastre={asa}
    />
  );

  // Una sola tarjeta: en celular va a la derecha del nodo; en escritorio alterna lados.
  const contenido = (
    <div className="grid grid-cols-[48px_1fr] items-center gap-x-3 py-2.5 md:grid-cols-[1fr_64px_1fr] md:gap-x-0">
      <div className={`col-start-2 row-start-1 min-w-0 ${derecha ? "md:col-start-3 md:pl-4" : "md:col-start-1 md:pr-4"}`}>
        {tarjeta}
      </div>

      <div className="relative z-10 col-start-1 row-start-1 flex justify-center md:col-start-2">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-base font-bold text-white shadow-[0_10px_20px_-8px_rgba(0,110,230,0.7)] ring-4 ring-luwi-panel ${nivel.nodo}`}
        >
          {indice + 1}
        </span>
      </div>

      <span
        className={`row-start-1 hidden items-center gap-1.5 text-[11px] font-semibold text-luwi-texto/60 md:flex ${
          derecha ? "md:col-start-1 md:justify-end md:pr-4" : "md:col-start-3 md:pl-4"
        }`}
      >
        {derecha ? (
          <>
            {formatoHoras(acumulado)} acumuladas
            <span className="h-px w-6 bg-luwi-linea" />
          </>
        ) : (
          <>
            <span className="h-px w-6 bg-luwi-linea" />
            {formatoHoras(acumulado)} acumuladas
          </>
        )}
      </span>
    </div>
  );

  if (!arrastrable) return <li>{contenido}</li>;

  return (
    <Reorder.Item
      value={curso}
      dragListener={false}
      dragControls={controles}
      className="relative list-none"
      whileDrag={{ scale: 1.02, zIndex: 20 }}
    >
      {contenido}
    </Reorder.Item>
  );
}

/**
 * Roadmap vertical de una ruta de aprendizaje.
 * - cursos: lista ordenada [{ id, titulo, nivel, duracionHoras, competencia }]
 * - editable: permite reordenar (arrastrando el asa) y quitar cursos.
 * - onReorder(nuevaLista), onRemove(id), onDropCurso(id): solo en modo editable.
 * - incompatibles / avisos: Sets de ids con problemas.
 */
export default function RoadmapRuta({
  cursos,
  puesto,
  editable = false,
  onReorder,
  onRemove,
  onDropCurso,
  incompatibles = new Set(),
  avisos = new Set(),
}) {
  const [sobre, setSobre] = useState(false);
  const total = cursos.reduce((a, c) => a + (Number(c.duracionHoras) || 0), 0);

  let acumulado = 0;
  const filas = cursos.map((c, i) => {
    acumulado += Number(c.duracionHoras) || 0;
    return (
      <Fila
        key={c.id}
        curso={c}
        indice={i}
        acumulado={acumulado}
        editable={editable}
        onRemove={onRemove}
        incompatible={incompatibles.has(c.id)}
        avisoNivel={avisos.has(c.id)}
        arrastrable={editable}
      />
    );
  });

  // Soltar un curso arrastrado desde el catálogo
  const zonaSoltar = editable
    ? {
        onDragOver: (e) => {
          if (e.dataTransfer.types.includes("text/curso-id")) {
            e.preventDefault();
            setSobre(true);
          }
        },
        onDragLeave: () => setSobre(false),
        onDrop: (e) => {
          e.preventDefault();
          setSobre(false);
          const id = e.dataTransfer.getData("text/curso-id");
          if (id) onDropCurso?.(id);
        },
      }
    : {};

  return (
    <div
      {...zonaSoltar}
      className={`relative rounded-[24px] p-2 transition ${sobre ? "bg-luwi-tecno/5 outline-2 outline-dashed outline-luwi-tecno/50" : ""}`}
    >
      {/* Línea del camino */}
      <span
        aria-hidden="true"
        className="absolute bottom-10 left-[32px] top-10 w-1 rounded-full bg-gradient-to-b from-luwi-tecno/60 via-luwi-medio/40 to-luwi-profundo/60 md:left-1/2 md:-translate-x-1/2"
      />

      {/* Inicio */}
      <div className="relative z-10 flex md:justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-white bg-white/90 py-2.5 pl-2.5 pr-4 shadow-[0_10px_26px_-18px_rgba(11,58,140,0.55)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-luwi-cristal-fondo text-luwi-medio">
            <BriefcaseIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-luwi-tecno">Inicio</p>
            <p className="text-sm font-semibold text-luwi-profundo">{puesto?.titulo ?? "Selecciona un puesto"}</p>
            {puesto?.empresaNombre && <p className="text-xs text-luwi-texto/75">{puesto.empresaNombre}</p>}
          </div>
        </div>
      </div>

      {/* Cursos */}
      <div className="my-3">
        {cursos.length === 0 ? (
          <div className="relative z-10 mx-auto my-6 flex max-w-sm flex-col items-center rounded-2xl border-2 border-dashed border-luwi-linea bg-white/80 px-6 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-luwi-cristal-fondo text-luwi-medio">
              <BookIcon className="h-6 w-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-luwi-profundo">La ruta está vacía</p>
            <p className="mt-1 text-xs text-luwi-texto/80">
              {editable ? "Arrastra cursos del catálogo hasta aquí o pulsa “+”." : "Esta ruta todavía no tiene cursos."}
            </p>
          </div>
        ) : editable ? (
          <Reorder.Group axis="y" values={cursos} onReorder={onReorder} className="relative">
            {filas}
          </Reorder.Group>
        ) : (
          <ol className="relative">{filas}</ol>
        )}
      </div>

      {/* Meta */}
      <div className="relative z-10 flex md:justify-center">
        <div className="flex items-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#0B3A8C_0%,#0B5BD3_60%,#009CFF_100%)] py-2.5 pl-2.5 pr-5 text-white shadow-[0_14px_30px_-14px_rgba(11,58,140,0.8)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <FlagIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-white/70">Meta</p>
            <p className="text-sm font-semibold">Listo para el puesto</p>
            <p className="text-xs text-white/75">
              {cursos.length} {cursos.length === 1 ? "curso" : "cursos"} · {formatoHoras(total)} de formación
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
