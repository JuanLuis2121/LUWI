import { useEffect, useRef, useState } from "react";

/** Mide el ancho real de un elemento y se actualiza cuando cambia de tamaño. */
export default function useAncho() {
  const ref = useRef(null);
  const [ancho, setAncho] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    setAncho(el.getBoundingClientRect().width);
    if (typeof ResizeObserver === "undefined") return undefined;
    const obs = new ResizeObserver(([entrada]) => setAncho(Math.round(entrada.contentRect.width)));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return [ref, ancho];
}
