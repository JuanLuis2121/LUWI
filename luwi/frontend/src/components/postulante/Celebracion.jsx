import { useEffect } from "react";
import { createPortal } from "react-dom";

// Piezas de confeti en los azules de LUWI (posiciones fijas: se ve igual cada vez)
const COLORES = ["#0b3a8c", "#0b5bd3", "#009cff", "#7cc8ff", "#dcebff"];
const PIEZAS = Array.from({ length: 42 }, (_, i) => ({
  izquierda: (i * 37) % 100,
  retraso: (i % 7) * 0.12,
  duracion: 2.2 + (i % 5) * 0.35,
  ancho: 6 + (i % 3) * 3,
  alto: 10 + (i % 4) * 3,
  color: COLORES.at(i % COLORES.length),
  giro: (i * 47) % 360,
}));

/**
 * Celebración al completar un curso o la ruta.
 * - titulo / mensaje: textos principales.
 * - acciones: botones (nodos) al pie.
 */
export default function Celebracion({ open, onClose, titulo, mensaje, acciones }) {
  useEffect(() => {
    if (!open) return undefined;
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 font-poppins" role="dialog" aria-modal="true" aria-labelledby="celebracion-titulo">
      <div onClick={onClose} className="absolute inset-0 bg-luwi-noche/45 backdrop-blur-sm" />

      {/* Confeti */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
        {PIEZAS.map((p, i) => (
          <span
            key={i}
            className="absolute top-0 block rounded-sm animate-[caer-confeti_linear_forwards]"
            style={{
              left: `${p.izquierda}%`,
              width: p.ancho,
              height: p.alto,
              background: p.color,
              animationDelay: `${p.retraso}s`,
              animationDuration: `${p.duracion}s`,
              transform: `rotate(${p.giro}deg)`,
            }}
          />
        ))}
      </div>

      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] bg-white text-center shadow-[0_40px_90px_-30px_rgba(6,26,69,0.6)] animate-[entrar-toast_260ms_ease-out] motion-reduce:animate-none">
        <div className="relative bg-[radial-gradient(ellipse_at_50%_0%,#CFE4FF_0%,#FFFFFF_70%)] px-8 pb-2 pt-10">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-[0_18px_36px_-14px_rgba(251,146,60,0.9)]">
            <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 16.9 6.1 20.1l1.3-6.6L2.5 8.9l6.6-.8L12 2z" />
            </svg>
          </span>
          <h2 id="celebracion-titulo" className="mt-6 text-2xl font-bold tracking-[-0.02em] text-luwi-profundo">
            {titulo}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-luwi-texto">{mensaje}</p>
        </div>
        <div className="flex flex-col gap-2 px-8 pb-8 pt-6">{acciones}</div>
      </div>
    </div>,
    document.body
  );
}
