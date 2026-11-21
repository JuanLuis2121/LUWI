import { useEffect, useRef, useState } from "react";

/**
 * Anima un número desde su valor anterior hasta el nuevo.
 * Respeta la preferencia del sistema de reducir movimiento.
 */
export default function useCountUp(valor, duracion = 700) {
  const objetivo = Number(valor) || 0;
  const [actual, setActual] = useState(objetivo);
  const desde = useRef(0);

  useEffect(() => {
    const reducir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducir) {
      setActual(objetivo);
      desde.current = objetivo;
      return undefined;
    }

    const origen = desde.current;
    const inicio = performance.now();
    let frame;

    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - (1 - t) ** 3;
      setActual(origen + (objetivo - origen) * suave);
      if (t < 1) frame = requestAnimationFrame(paso);
      else desde.current = objetivo;
    };

    frame = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(frame);
  }, [objetivo, duracion]);

  return Number.isInteger(objetivo) ? Math.round(actual) : Math.round(actual * 10) / 10;
}
