/**
 * Gráfica de dona en SVG, sin librerías.
 * segmentos: [{ label, value, color }]  (color = valor CSS, ej. "#0b3a8c")
 */
export default function DonutChart({ segmentos, centro, subcentro, size = 156, grosor = 18 }) {
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const total = segmentos.reduce((a, s) => a + s.value, 0);
  const separacion = total > 0 && segmentos.filter((s) => s.value > 0).length > 1 ? 3 : 0;

  let acumulado = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="-rotate-90" role="img" aria-label={segmentos.map((s) => `${s.label}: ${s.value}`).join(", ")}>
        <circle cx={size / 2} cy={size / 2} r={radio} fill="none" stroke="#dcebff" strokeWidth={grosor} />
        {total > 0 &&
          segmentos.map((s) => {
            if (!s.value) return null;
            const largo = (s.value / total) * circunferencia;
            const trazo = Math.max(0, largo - separacion);
            const offset = -acumulado;
            acumulado += largo;
            return (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={radio}
                fill="none"
                stroke={s.color}
                strokeWidth={grosor}
                strokeDasharray={`${trazo} ${circunferencia - trazo}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[28px] font-bold leading-none text-luwi-profundo">{centro}</span>
        {subcentro && <span className="mt-1 text-[11px] text-luwi-texto">{subcentro}</span>}
      </div>
    </div>
  );
}
