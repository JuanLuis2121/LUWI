import { useId } from "react";

/**
 * Indicador circular de 270° (0-100) con trazo en degradado.
 * Pensado para fondos oscuros.
 */
export default function RadialGauge({ value = 0, size = 168, grosor = 14, label }) {
  const id = useId();
  const v = Math.min(100, Math.max(0, value));
  const radio = (size - grosor) / 2;
  const circunferencia = 2 * Math.PI * radio;
  const arco = circunferencia * 0.75; // 270°
  const lleno = (arco * v) / 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="rotate-[135deg]" role="img" aria-label={`${label ?? "Valor"}: ${v}%`}>
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7cc8ff" />
            <stop offset="100%" stopColor="#009cff" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${arco} ${circunferencia}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radio}
          fill="none"
          stroke={`url(#${id}-g)`}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={`${lleno} ${circunferencia}`}
          className="transition-[stroke-dasharray] duration-1000 ease-out"
          style={{ filter: "drop-shadow(0 0 6px rgba(0,156,255,0.55))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[40px] font-bold leading-none tracking-tight text-white">
          {v}
          <span className="text-xl text-white/70">%</span>
        </span>
        {label && <span className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">{label}</span>}
      </div>
    </div>
  );
}
