import { motion, useReducedMotion } from "motion/react";
import useAncho from "../../hooks/useAncho";
import { nivelDe } from "../../utils/rutas";

/**
 * Camino ondulado con un nodo por curso (como un mapa de niveles).
 * - cursos: [{ id, titulo, nivel, duracionHoras }]
 * - tamano: "md" (tarjetas) | "lg" (con nombres de los cursos).
 * - tema: "claro" | "oscuro" (colores del camino según el fondo).
 * - viajero: muestra un punto de luz que recorre el camino.
 * - max: cursos visibles; el resto se resume como "+N".
 * - estados: opcional, situación de cada curso ("hecho" | "actual" | "disponible" | "bloqueado").
 *   Si se envía, los nodos se pintan según el avance (vista del postulante) y no por nivel.
 * - marcador: índice del curso donde se muestra el pin "Tú" (vista del postulante).
 */
const MEDIDAS = {
  md: { alto: 92, nodo: 26, margen: 22, onda: 0.24, grosor: 9, texto: "text-[10px]" },
  lg: { alto: 188, nodo: 40, margen: 46, onda: 0.2, grosor: 14, texto: "text-[13px]" },
};

const COLORES = {
  claro: { camino: "#efe2d1", borde: "#f8efe4", linea: "#222bb8", anillo: "ring-white", viajero: "#d1b17c" },
  oscuro: { camino: "rgba(255,255,255,0.12)", borde: "rgba(255,255,255,0.04)", linea: "#f0d4a4", anillo: "ring-[#141964]", viajero: "#f8e6d2" },
};

const NODO_ESTADO = {
  hecho: "bg-gradient-to-br from-[#d1b17c] to-[#8c6a34] text-white",
  actual: "bg-gradient-to-br from-luwi-profundo to-luwi-tecno text-white",
  disponible: "bg-white text-luwi-medio !ring-luwi-cristal",
  bloqueado: "bg-luwi-panel text-luwi-texto/45 !ring-luwi-linea",
};

const TEXTO_ESTADO = { hecho: "Completado", actual: "En curso", disponible: "Disponible", bloqueado: "Bloqueado" };

// Puntos del camino: alternan arriba y abajo para formar la onda.
function calcularPuntos(n, ancho, { alto, margen, onda }) {
  if (n === 1) return [{ x: ancho / 2, y: alto / 2 }];
  const paso = (ancho - margen * 2) / (n - 1);
  const arriba = alto * (0.5 - onda);
  const abajo = alto * (0.5 + onda);
  return Array.from({ length: n }, (_, i) => ({ x: margen + i * paso, y: i % 2 === 0 ? abajo : arriba }));
}

// Curvas suaves entre puntos (tangentes horizontales), con entrada y salida por los bordes.
function trazar(puntos, ancho, alto) {
  const medio = alto / 2;
  const inicio = { x: 0, y: medio };
  const fin = { x: ancho, y: medio };
  const todos = [inicio, ...puntos, fin];
  let d = `M ${inicio.x} ${inicio.y}`;
  for (let i = 1; i < todos.length; i += 1) {
    const a = todos[i - 1];
    const b = todos[i];
    const dx = (b.x - a.x) / 2;
    d += ` C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  }
  return d;
}

const recortar = (texto, max) => (texto.length > max ? `${texto.slice(0, max - 1)}…` : texto);

function Check(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function Candado(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export default function CaminoSerpiente({
  cursos = [],
  tamano = "md",
  tema = "claro",
  viajero = false,
  max = 7,
  animarEntrada = true,
  estados = null,
  marcador = null,
}) {
  const [ref, ancho] = useAncho();
  const reducido = useReducedMotion();
  const m = MEDIDAS[tamano] ?? MEDIDAS.md;
  const c = COLORES[tema] ?? COLORES.claro;

  // En pantallas angostas la vista grande muestra menos nodos para que los nombres quepan
  const limite = tamano === "lg" && ancho > 0 && ancho < 560 ? Math.min(max, 4) : max;
  const visibles = cursos.slice(0, limite);
  const resto = cursos.length - visibles.length;
  // En la vista grande se deja más margen para que los nombres de los extremos no se corten
  const margen = tamano === "lg" && ancho ? Math.max(m.margen, Math.min(95, ancho / (2 * Math.max(visibles.length, 1)))) : m.margen;
  const puntos = ancho ? calcularPuntos(visibles.length, ancho, { ...m, margen }) : [];
  const d = ancho ? trazar(puntos, ancho, m.alto) : "";
  const vacio = cursos.length === 0;
  const animar = animarEntrada && !reducido;
  const caracteres = ancho && visibles.length ? Math.max(8, Math.floor(ancho / visibles.length / 7.2)) : 14;

  // Tramo recorrido (vista del postulante): hasta el pin o hasta el último curso completado
  const marcadorVisible = marcador != null && marcador < visibles.length ? marcador : null;
  let hasta = marcadorVisible;
  if (hasta == null && estados) {
    const ultimoHecho = estados.slice(0, visibles.length).lastIndexOf("hecho");
    hasta = ultimoHecho >= 0 ? ultimoHecho : null;
  }
  const recorrido = estados && hasta != null && puntos[hasta] && ancho ? Math.min(1, puntos[hasta].x / ancho) : 0;
  const idGradiente = `camino-recorrido-${tamano}-${tema}`;

  return (
    <div
      ref={ref}
      className="relative w-full"
      style={{ height: m.alto }}
      role="img"
      aria-label={vacio ? "Ruta sin cursos" : `Camino de ${cursos.length} cursos: ${cursos.map((x) => x.titulo).join(", ")}`}
    >
      {ancho > 0 && (
        <svg width={ancho} height={m.alto} viewBox={`0 0 ${ancho} ${m.alto}`} className="absolute inset-0 overflow-visible" aria-hidden="true">
          <defs>
            <linearGradient id={idGradiente} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#222bb8" />
              <stop offset="100%" stopColor="#d1b17c" />
            </linearGradient>
          </defs>
          {vacio ? (
            <path d={`M 0 ${m.alto / 2} H ${ancho}`} fill="none" stroke={c.camino} strokeWidth={m.grosor} strokeLinecap="round" strokeDasharray="2 18" />
          ) : (
            <>
              {/* Camino de fondo (se dibuja al aparecer) */}
              <motion.path
                d={d}
                fill="none"
                stroke={c.borde}
                strokeWidth={m.grosor + 8}
                strokeLinecap="round"
                initial={animar ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              <motion.path
                d={d}
                fill="none"
                stroke={c.camino}
                strokeWidth={m.grosor}
                strokeLinecap="round"
                initial={animar ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
              {/* Tramo ya recorrido por el postulante */}
              {recorrido > 0 && (
                <motion.path
                  d={d}
                  fill="none"
                  stroke={`url(#${idGradiente})`}
                  strokeWidth={m.grosor * 0.55}
                  strokeLinecap="round"
                  initial={animar ? { pathLength: 0 } : false}
                  animate={{ pathLength: recorrido }}
                  transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                />
              )}
              {/* Línea punteada que avanza: da sensación de movimiento */}
              <path d={d} fill="none" stroke={c.linea} strokeOpacity={tema === "oscuro" ? 0.7 : 0.55} strokeWidth={2} strokeLinecap="round" strokeDasharray="1 11">
                {!reducido && <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.4s" repeatCount="indefinite" />}
              </path>
              {viajero && !reducido && (
                <g>
                  <circle r={m.grosor * 0.9} fill={c.viajero} opacity="0.18">
                    <animateMotion dur={`${2.2 + visibles.length * 0.45}s`} repeatCount="indefinite" path={d} />
                  </circle>
                  <circle r={m.grosor * 0.38} fill={c.viajero}>
                    <animateMotion dur={`${2.2 + visibles.length * 0.45}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              )}
            </>
          )}
        </svg>
      )}

      {vacio && (
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
          Sin cursos todavía
        </span>
      )}

      {puntos.map((p, i) => {
        const curso = visibles[i];
        const nivel = nivelDe(curso);
        const estado = estados?.[i];
        const arriba = p.y < m.alto / 2;
        const ultimoConResto = resto > 0 && i === visibles.length - 1;
        const claseNodo = estado ? NODO_ESTADO[estado] : `bg-gradient-to-br text-white ${nivel.nodo}`;
        const esMarcador = marcadorVisible === i;

        return (
          <motion.div
            key={curso.id ?? curso.cursoAsignadoId ?? i}
            className="absolute"
            style={{ left: p.x, top: p.y, width: m.nodo, height: m.nodo, marginLeft: -m.nodo / 2, marginTop: -m.nodo / 2 }}
            initial={animar ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.25 + i * 0.08, type: "spring", stiffness: 380, damping: 18 }}
          >
            {/* Halo del curso actual */}
            {estado === "actual" && !reducido && (
              <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-luwi-tecno/35 [animation-duration:2s]" />
            )}

            <span
              title={`${i + 1}. ${curso.titulo} · ${estado ? TEXTO_ESTADO[estado] : nivel.label}`}
              className={`relative flex h-full w-full items-center justify-center rounded-full font-bold ring-[3px] shadow-[0_6px_14px_-6px_rgba(15,20,76,0.7)] transition-transform duration-200 hover:scale-110 ${c.anillo} ${claseNodo} ${m.texto}`}
            >
              {ultimoConResto ? (
                `+${resto + 1}`
              ) : estado === "hecho" ? (
                <Check className="h-1/2 w-1/2" />
              ) : estado === "bloqueado" ? (
                <Candado className="h-[45%] w-[45%]" />
              ) : (
                i + 1
              )}
            </span>

            {/* Pin "Tú" sobre el curso actual */}
            {esMarcador && (
              <motion.span
                aria-hidden="true"
                className={`absolute left-1/2 z-10 -translate-x-1/2 ${arriba ? "top-full mt-2" : "bottom-full mb-2"}`}
                animate={reducido ? undefined : { y: arriba ? [0, 4, 0] : [0, -4, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="relative flex items-center rounded-full bg-luwi-profundo px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_8px_18px_-6px_rgba(17,22,82,0.8)]">
                  Tú
                  <span
                    className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-luwi-profundo ${arriba ? "-top-1" : "-bottom-1"}`}
                  />
                </span>
              </motion.span>
            )}

            {tamano === "lg" && (
              <span
                className={`pointer-events-none absolute left-1/2 w-max max-w-[170px] -translate-x-1/2 text-center leading-tight ${
                  arriba ? "bottom-full mb-2.5" : "top-full mt-2.5"
                }`}
              >
                <span className={`block truncate text-[12.5px] font-semibold ${tema === "oscuro" ? "text-white" : estado === "bloqueado" ? "text-luwi-texto/60" : "text-luwi-profundo"}`}>
                  {ultimoConResto ? `y ${resto + 1} cursos más` : recortar(curso.titulo, caracteres)}
                </span>
                {!ultimoConResto && (
                  <span className={`block text-[11px] ${tema === "oscuro" ? "text-white/55" : "text-luwi-texto/70"}`}>
                    {estado ? TEXTO_ESTADO[estado] : nivel.label}
                    {curso.duracionHoras ? ` · ${Math.round(curso.duracionHoras * 10) / 10} h` : ""}
                  </span>
                )}
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
