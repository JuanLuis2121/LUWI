import { useId } from "react";

/** Minigráfica de línea con área (sin ejes). `datos` = arreglo de números. */
export default function Sparkline({ datos = [], ancho = 120, alto = 36, className = "" }) {
  const id = useId();
  if (datos.length < 2) return null;

  const min = Math.min(...datos);
  const max = Math.max(...datos);
  const rangoY = max - min || 1;
  const margen = 4;
  const pasoX = (ancho - margen * 2) / (datos.length - 1);
  const y = (v) => alto - margen - ((v - min) / rangoY) * (alto - margen * 2);
  const puntos = datos.map((v, i) => [margen + i * pasoX, max === min ? alto / 2 : y(v)]);
  const linea = puntos.map(([px, py], i) => `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
  const area = `${linea} L${ancho - margen} ${alto} L${margen} ${alto} Z`;
  const [ux, uy] = puntos.at(-1);

  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#009cff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#009cff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id}-a)`} />
      <path d={linea} fill="none" stroke="#0b5bd3" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={ux} cy={uy} r="2.6" fill="#009cff" stroke="white" strokeWidth="1.2" />
    </svg>
  );
}
